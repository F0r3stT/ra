CREATE DATABASE security;

\c security;

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'Пользователь' CHECK (role IN ('Пользователь', 'Администратор')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS incidents (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('Внешняя', 'Внутренняя')),
    protocol VARCHAR(50) NOT NULL,
    threat_level INTEGER DEFAULT 3 CHECK (threat_level BETWEEN 1 AND 5),
    status VARCHAR(50) NOT NULL DEFAULT 'Активна' CHECK (status IN ('Активна', 'Заблокирована', 'Закрыта')),
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    closed_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS incident_sources (
    id SERIAL PRIMARY KEY,
    source_name VARCHAR(100) NOT NULL,
    source_type VARCHAR(50) NOT NULL CHECK (source_type IN ('Система', 'Устройство', 'Человек')),
    ip_address INET,
    device_name VARCHAR(100),
    contact_info VARCHAR(200)
);

CREATE TABLE IF NOT EXISTS incident_source_links (
    incident_id INTEGER REFERENCES incidents(id) ON DELETE CASCADE,
    source_id INTEGER REFERENCES incident_sources(id) ON DELETE CASCADE,
    PRIMARY KEY (incident_id, source_id)
);

CREATE TABLE IF NOT EXISTS employees (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(150) NOT NULL,
    position VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    phone VARCHAR(20),
    department VARCHAR(100)
);

CREATE TABLE IF NOT EXISTS response_actions (
    id SERIAL PRIMARY KEY,
    action_name VARCHAR(150) NOT NULL,
    action_type VARCHAR(50) NOT NULL,
    description TEXT,
    executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    incident_id INTEGER REFERENCES incidents(id) ON DELETE CASCADE,
    employee_id INTEGER REFERENCES employees(id)
);

CREATE TABLE IF NOT EXISTS vulnerabilities (
    id SERIAL PRIMARY KEY,
    vulnerability_type VARCHAR(100) NOT NULL,
    software_version VARCHAR(50),
    system_name VARCHAR(100),
    patch_status VARCHAR(50) DEFAULT 'Открыта' CHECK (patch_status IN ('Открыта', 'Исправлена', 'В работе', 'Переоткрыта')),
    discovered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fixed_at TIMESTAMP,
    threat_level INTEGER CHECK (threat_level BETWEEN 1 AND 5)
);

CREATE TABLE IF NOT EXISTS incident_vulnerability_links (
    incident_id INTEGER REFERENCES incidents(id) ON DELETE CASCADE,
    vulnerability_id INTEGER REFERENCES vulnerabilities(id) ON DELETE CASCADE,
    PRIMARY KEY (incident_id, vulnerability_id)
);

CREATE TABLE IF NOT EXISTS audit_log (
    id SERIAL PRIMARY KEY,
    table_name VARCHAR(50) NOT NULL,
    record_id INTEGER NOT NULL,
    action VARCHAR(10) NOT NULL,
    old_data JSONB,
    new_data JSONB,
    changed_by VARCHAR(100),
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE OR REPLACE FUNCTION avg_response_time(
    p_employee_id INTEGER,
    p_start_date DATE,
    p_end_date DATE
)
RETURNS NUMERIC
LANGUAGE plpgsql
AS $$
DECLARE
    avg_hours NUMERIC;
BEGIN
    SELECT AVG(EXTRACT(EPOCH FROM (closed_at - created_at))/3600)
    INTO avg_hours
    FROM incidents i
    JOIN response_actions ra ON i.id = ra.incident_id
    WHERE ra.employee_id = p_employee_id
        AND i.status = 'Закрыта'
        AND i.closed_at BETWEEN p_start_date AND p_end_date
        AND i.created_at IS NOT NULL;
    
    RETURN COALESCE(avg_hours, 0);
END;
$$;

CREATE OR REPLACE FUNCTION is_valid_threat_level(
    p_incident_id INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
    threat_val INTEGER;
BEGIN
    SELECT threat_level INTO threat_val
    FROM incidents
    WHERE id = p_incident_id;
    
    RETURN threat_val BETWEEN 1 AND 5;
END;
$$;

CREATE OR REPLACE FUNCTION count_incidents_by_period(
    p_start_date DATE,
    p_end_date DATE
)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    total_count INTEGER;
BEGIN
    SELECT COUNT(*)
    INTO total_count
    FROM incidents
    WHERE DATE(created_at) BETWEEN p_start_date AND p_end_date;
    
    RETURN total_count;
END;
$$;

CREATE OR REPLACE FUNCTION get_top_vulnerabilities(
    p_year INTEGER,
    p_quarter INTEGER
)
RETURNS TABLE(
    vuln_type VARCHAR(100),
    occurrence_count BIGINT,
    avg_threat_level NUMERIC
)
LANGUAGE plpgsql
AS $$
DECLARE
    start_date DATE;
    end_date DATE;
BEGIN
    start_date := DATE(p_year || '-' || (p_quarter * 3 - 2) || '-01');
    end_date := start_date + INTERVAL '3 months' - INTERVAL '1 day';
    
    RETURN QUERY
    SELECT 
        v.vulnerability_type,
        COUNT(*) as occurrence_count,
        AVG(v.threat_level) as avg_threat_level
    FROM incident_vulnerability_links ivl
    JOIN vulnerabilities v ON ivl.vulnerability_id = v.id
    JOIN incidents i ON ivl.incident_id = i.id
    WHERE DATE(i.created_at) BETWEEN start_date AND end_date
    GROUP BY v.vulnerability_type
    ORDER BY occurrence_count DESC
    LIMIT 10;
END;
$$;

CREATE OR REPLACE FUNCTION audit_insert_incident()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO audit_log (table_name, record_id, action, new_data, changed_by)
    VALUES ('incidents', NEW.id, 'ВСТАВКА', row_to_json(NEW), CURRENT_USER);
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_audit_incident_insert ON incidents;
CREATE TRIGGER trg_audit_incident_insert
AFTER INSERT ON incidents
FOR EACH ROW
EXECUTE FUNCTION audit_insert_incident();

CREATE OR REPLACE FUNCTION audit_update_incident()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO audit_log (table_name, record_id, action, old_data, new_data, changed_by)
    VALUES ('incidents', NEW.id, 'ОБНОВЛЕНИЕ', row_to_json(OLD), row_to_json(NEW), CURRENT_USER);
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_audit_incident_update ON incidents;
CREATE TRIGGER trg_audit_incident_update
AFTER UPDATE ON incidents
FOR EACH ROW
EXECUTE FUNCTION audit_update_incident();

CREATE OR REPLACE FUNCTION check_threat_level()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.threat_level < 1 OR NEW.threat_level > 5 THEN
        RAISE EXCEPTION 'Уровень угрозы должен быть от 1 до 5. Получено: %', NEW.threat_level;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_check_threat_level ON incidents;
CREATE TRIGGER trg_check_threat_level
BEFORE INSERT OR UPDATE ON incidents
FOR EACH ROW
EXECUTE FUNCTION check_threat_level();

CREATE OR REPLACE FUNCTION prevent_active_incident_deletion()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF OLD.status IN ('Активна', 'Заблокирована') THEN
        RAISE EXCEPTION 'Нельзя удалить инцидент со статусом "%". Сначала закройте его.', OLD.status;
    END IF;
    RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_active_deletion ON incidents;
CREATE TRIGGER trg_prevent_active_deletion
BEFORE DELETE ON incidents
FOR EACH ROW
EXECUTE FUNCTION prevent_active_incident_deletion();

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_update_incident_timestamp ON incidents;
CREATE TRIGGER trg_update_incident_timestamp
BEFORE UPDATE ON incidents
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_update_vulnerability_timestamp ON vulnerabilities;
CREATE TRIGGER trg_update_vulnerability_timestamp
BEFORE UPDATE ON vulnerabilities
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE FUNCTION check_vulnerability_status()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    vuln_status VARCHAR(50);
BEGIN
    SELECT patch_status INTO vuln_status
    FROM vulnerabilities
    WHERE id = NEW.vulnerability_id;
    
    IF vuln_status = 'Исправлена' THEN
        UPDATE vulnerabilities 
        SET patch_status = 'Переоткрыта', updated_at = CURRENT_TIMESTAMP
        WHERE id = NEW.vulnerability_id;
    END IF;
    
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_check_vulnerability_link ON incident_vulnerability_links;
CREATE TRIGGER trg_check_vulnerability_link
BEFORE INSERT ON incident_vulnerability_links
FOR EACH ROW
EXECUTE FUNCTION check_vulnerability_status();