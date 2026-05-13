--
-- PostgreSQL database dump
--

\restrict d8izngNnlL5vojKA637DFf5onkvqyAZFfxZN0h53fUwIOP34MZ793zPWrQijUvv

-- Dumped from database version 16.13 (Ubuntu 16.13-0ubuntu0.24.04.1)
-- Dumped by pg_dump version 16.13 (Ubuntu 16.13-0ubuntu0.24.04.1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: audit_all_changes(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.audit_all_changes() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO audit_log (table_name, record_id, action, new_data, changed_by)
        VALUES (TG_TABLE_NAME, NEW.id, 'INSERT', row_to_json(NEW), CURRENT_USER);
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO audit_log (table_name, record_id, action, old_data, new_data, changed_by)
        VALUES (TG_TABLE_NAME, NEW.id, 'UPDATE', row_to_json(OLD), row_to_json(NEW), CURRENT_USER);
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO audit_log (table_name, record_id, action, old_data, changed_by)
        VALUES (TG_TABLE_NAME, OLD.id, 'DELETE', row_to_json(OLD), CURRENT_USER);
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$;


ALTER FUNCTION public.audit_all_changes() OWNER TO postgres;

--
-- Name: audit_insert_incident(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.audit_insert_incident() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    INSERT INTO audit_log (table_name, record_id, action, new_data, changed_by)
    VALUES ('incidents', NEW.id, 'ВСТАВКА', row_to_json(NEW), CURRENT_USER);
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.audit_insert_incident() OWNER TO postgres;

--
-- Name: audit_update_incident(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.audit_update_incident() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    INSERT INTO audit_log (table_name, record_id, action, old_data, new_data, changed_by)
    VALUES ('incidents', NEW.id, 'ОБНОВЛЕНИЕ', row_to_json(OLD), row_to_json(NEW), CURRENT_USER);
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.audit_update_incident() OWNER TO postgres;

--
-- Name: avg_response_time(integer, date, date); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.avg_response_time(p_employee_id integer, p_start_date date, p_end_date date) RETURNS numeric
    LANGUAGE plpgsql
    AS $$
DECLARE
    avg_hours NUMERIC;
BEGIN
    SELECT AVG(EXTRACT(EPOCH FROM (i.closed_at - i.created_at))/3600)
    INTO avg_hours
    FROM incidents i
    JOIN response_measures rm ON i.id = rm.incident_id
    WHERE rm.employee_id = p_employee_id
        AND i.status = 'Закрыта'
        AND DATE(i.closed_at) BETWEEN p_start_date AND p_end_date
        AND i.created_at IS NOT NULL
        AND i.closed_at IS NOT NULL;
    
    RETURN COALESCE(avg_hours, 0);
END;
$$;


ALTER FUNCTION public.avg_response_time(p_employee_id integer, p_start_date date, p_end_date date) OWNER TO postgres;

--
-- Name: check_threat_level(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.check_threat_level() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF NEW.threat_level < 1 OR NEW.threat_level > 5 THEN
        RAISE EXCEPTION 'Уровень угрозы должен быть от 1 до 5. Получено: %', NEW.threat_level;
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.check_threat_level() OWNER TO postgres;

--
-- Name: check_vulnerability_patch_status(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.check_vulnerability_patch_status() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Приводим к стандартному формату
    IF NEW.patch_status = 'Fixed' THEN
        NEW.patch_status := 'Fixed';
    ELSIF NEW.patch_status = 'Open' THEN
        NEW.patch_status := 'Open';
    ELSIF NEW.patch_status = 'InProgress' THEN
        NEW.patch_status := 'InProgress';
    ELSIF NEW.patch_status = 'Reopened' THEN
        NEW.patch_status := 'Reopened';
    ELSE
        -- Любое другое значение заменяем на 'Open' (по заданию - 'Unknown')
        NEW.patch_status := 'Open';
    END IF;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.check_vulnerability_patch_status() OWNER TO postgres;

--
-- Name: check_vulnerability_status(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.check_vulnerability_status() RETURNS trigger
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


ALTER FUNCTION public.check_vulnerability_status() OWNER TO postgres;

--
-- Name: count_incidents_by_period(date, date); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.count_incidents_by_period(p_start_date date, p_end_date date) RETURNS integer
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


ALTER FUNCTION public.count_incidents_by_period(p_start_date date, p_end_date date) OWNER TO postgres;

--
-- Name: get_top_vulnerabilities(integer, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_top_vulnerabilities(p_year integer, p_quarter integer) RETURNS TABLE(vuln_type character varying, occurrence_count bigint, avg_threat_level numeric)
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


ALTER FUNCTION public.get_top_vulnerabilities(p_year integer, p_quarter integer) OWNER TO postgres;

--
-- Name: is_valid_threat_level(integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.is_valid_threat_level(p_incident_id integer) RETURNS boolean
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


ALTER FUNCTION public.is_valid_threat_level(p_incident_id integer) OWNER TO postgres;

--
-- Name: my_new_func(date, date); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.my_new_func(p_start_date date, p_end_date date) RETURNS integer
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


ALTER FUNCTION public.my_new_func(p_start_date date, p_end_date date) OWNER TO postgres;

--
-- Name: prevent_active_incident_deletion(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.prevent_active_incident_deletion() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF OLD.status IN ('Активна', 'Заблокирована') THEN
        RAISE EXCEPTION 'Нельзя удалить инцидент со статусом "%". Сначала закройте его.', OLD.status;
    END IF;
    RETURN OLD;
END;
$$;


ALTER FUNCTION public.prevent_active_incident_deletion() OWNER TO postgres;

--
-- Name: set_closed_at_time(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.set_closed_at_time() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Если статус изменился на "Закрыта", записываем текущее время
    IF NEW.status = 'Закрыта' AND OLD.status != 'Закрыта' THEN
        NEW.closed_at = CURRENT_TIMESTAMP;
    -- Если инцидент открыли обратно, стираем время закрытия
    ELSIF NEW.status != 'Закрыта' THEN
        NEW.closed_at = NULL;
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.set_closed_at_time() OWNER TO postgres;

--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_updated_at_column() OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: audit_log; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.audit_log (
    id integer NOT NULL,
    table_name character varying(50) NOT NULL,
    record_id integer NOT NULL,
    action character varying(10) NOT NULL,
    old_data jsonb,
    new_data jsonb,
    changed_by character varying(100),
    changed_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.audit_log OWNER TO postgres;

--
-- Name: audit_log_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.audit_log_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.audit_log_id_seq OWNER TO postgres;

--
-- Name: audit_log_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.audit_log_id_seq OWNED BY public.audit_log.id;


--
-- Name: employees; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.employees (
    id integer NOT NULL,
    full_name character varying(150) NOT NULL,
    "position" character varying(100) NOT NULL,
    email character varying(100) NOT NULL,
    phone character varying(20),
    department character varying(100)
);


ALTER TABLE public.employees OWNER TO postgres;

--
-- Name: employees_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.employees_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.employees_id_seq OWNER TO postgres;

--
-- Name: employees_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.employees_id_seq OWNED BY public.employees.id;


--
-- Name: incident_source_links; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.incident_source_links (
    incident_id integer NOT NULL,
    source_id integer NOT NULL
);


ALTER TABLE public.incident_source_links OWNER TO postgres;

--
-- Name: incident_sources; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.incident_sources (
    id integer NOT NULL,
    source_name character varying(100) NOT NULL,
    source_type character varying(50) NOT NULL,
    ip_address character varying(45),
    device_name character varying(100),
    contact_info character varying(200),
    CONSTRAINT incident_sources_source_type_check CHECK (((source_type)::text = ANY ((ARRAY['System'::character varying, 'Device'::character varying, 'Person'::character varying])::text[])))
);


ALTER TABLE public.incident_sources OWNER TO postgres;

--
-- Name: incident_sources_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.incident_sources_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.incident_sources_id_seq OWNER TO postgres;

--
-- Name: incident_sources_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.incident_sources_id_seq OWNED BY public.incident_sources.id;


--
-- Name: incident_vulnerabilities; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.incident_vulnerabilities (
    incident_id integer NOT NULL,
    vulnerability_id integer NOT NULL
);


ALTER TABLE public.incident_vulnerabilities OWNER TO postgres;

--
-- Name: incident_vulnerability_links; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.incident_vulnerability_links (
    incident_id integer NOT NULL,
    vulnerability_id integer NOT NULL
);


ALTER TABLE public.incident_vulnerability_links OWNER TO postgres;

--
-- Name: incidents; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.incidents (
    id integer NOT NULL,
    name character varying(200) NOT NULL,
    description text NOT NULL,
    type character varying(50) NOT NULL,
    protocol character varying(50) NOT NULL,
    threat_level integer DEFAULT 3,
    status character varying(50) DEFAULT 'Активна'::character varying NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    closed_at timestamp without time zone,
    created_by integer,
    CONSTRAINT incidents_status_check CHECK (((status)::text = ANY ((ARRAY['Активна'::character varying, 'Заблокирована'::character varying, 'Закрыта'::character varying])::text[]))),
    CONSTRAINT incidents_threat_level_check CHECK (((threat_level >= 1) AND (threat_level <= 5))),
    CONSTRAINT incidents_type_check CHECK (((type)::text = ANY ((ARRAY['Внешняя'::character varying, 'Внутренняя'::character varying])::text[])))
);


ALTER TABLE public.incidents OWNER TO postgres;

--
-- Name: incidents_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.incidents_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.incidents_id_seq OWNER TO postgres;

--
-- Name: incidents_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.incidents_id_seq OWNED BY public.incidents.id;


--
-- Name: response_actions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.response_actions (
    id integer NOT NULL,
    action_name character varying(150) NOT NULL,
    action_type character varying(50) NOT NULL,
    description text,
    executed_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    incident_id integer,
    employee_id integer
);


ALTER TABLE public.response_actions OWNER TO postgres;

--
-- Name: response_actions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.response_actions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.response_actions_id_seq OWNER TO postgres;

--
-- Name: response_actions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.response_actions_id_seq OWNED BY public.response_actions.id;


--
-- Name: response_measures; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.response_measures (
    id integer NOT NULL,
    measure_name character varying(150) NOT NULL,
    measure_type character varying(50) NOT NULL,
    description text,
    executed_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    incident_id integer,
    employee_id integer
);


ALTER TABLE public.response_measures OWNER TO postgres;

--
-- Name: response_measures_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.response_measures_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.response_measures_id_seq OWNER TO postgres;

--
-- Name: response_measures_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.response_measures_id_seq OWNED BY public.response_measures.id;


--
-- Name: responsible_employees; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.responsible_employees (
    id integer NOT NULL,
    full_name character varying(150) NOT NULL,
    "position" character varying(100) NOT NULL,
    email character varying(100) NOT NULL,
    phone character varying(20),
    department character varying(100)
);


ALTER TABLE public.responsible_employees OWNER TO postgres;

--
-- Name: responsible_employees_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.responsible_employees_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.responsible_employees_id_seq OWNER TO postgres;

--
-- Name: responsible_employees_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.responsible_employees_id_seq OWNED BY public.responsible_employees.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id integer NOT NULL,
    username character varying(50) NOT NULL,
    email character varying(100) NOT NULL,
    password_hash character varying(255) NOT NULL,
    role character varying(20) DEFAULT 'Пользователь'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT users_role_check CHECK (((role)::text = ANY ((ARRAY['Пользователь'::character varying, 'Администратор'::character varying])::text[])))
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: vulnerabilities; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.vulnerabilities (
    id integer NOT NULL,
    vulnerability_type character varying(100) NOT NULL,
    software_version character varying(50),
    system_name character varying(100),
    patch_status character varying(50) DEFAULT 'Open'::character varying,
    discovered_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    fixed_at timestamp without time zone,
    threat_level integer,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT vulnerabilities_patch_status_check CHECK (((patch_status)::text = ANY ((ARRAY['Open'::character varying, 'Fixed'::character varying, 'InProgress'::character varying, 'Reopened'::character varying])::text[]))),
    CONSTRAINT vulnerabilities_threat_level_check CHECK (((threat_level >= 1) AND (threat_level <= 5)))
);


ALTER TABLE public.vulnerabilities OWNER TO postgres;

--
-- Name: vulnerabilities_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.vulnerabilities_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.vulnerabilities_id_seq OWNER TO postgres;

--
-- Name: vulnerabilities_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.vulnerabilities_id_seq OWNED BY public.vulnerabilities.id;


--
-- Name: audit_log id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_log ALTER COLUMN id SET DEFAULT nextval('public.audit_log_id_seq'::regclass);


--
-- Name: employees id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employees ALTER COLUMN id SET DEFAULT nextval('public.employees_id_seq'::regclass);


--
-- Name: incident_sources id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.incident_sources ALTER COLUMN id SET DEFAULT nextval('public.incident_sources_id_seq'::regclass);


--
-- Name: incidents id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.incidents ALTER COLUMN id SET DEFAULT nextval('public.incidents_id_seq'::regclass);


--
-- Name: response_actions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.response_actions ALTER COLUMN id SET DEFAULT nextval('public.response_actions_id_seq'::regclass);


--
-- Name: response_measures id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.response_measures ALTER COLUMN id SET DEFAULT nextval('public.response_measures_id_seq'::regclass);


--
-- Name: responsible_employees id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.responsible_employees ALTER COLUMN id SET DEFAULT nextval('public.responsible_employees_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: vulnerabilities id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vulnerabilities ALTER COLUMN id SET DEFAULT nextval('public.vulnerabilities_id_seq'::regclass);


--
-- Name: audit_log audit_log_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_log
    ADD CONSTRAINT audit_log_pkey PRIMARY KEY (id);


--
-- Name: employees employees_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_email_key UNIQUE (email);


--
-- Name: employees employees_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_pkey PRIMARY KEY (id);


--
-- Name: incident_source_links incident_source_links_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.incident_source_links
    ADD CONSTRAINT incident_source_links_pkey PRIMARY KEY (incident_id, source_id);


--
-- Name: incident_sources incident_sources_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.incident_sources
    ADD CONSTRAINT incident_sources_pkey PRIMARY KEY (id);


--
-- Name: incident_vulnerabilities incident_vulnerabilities_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.incident_vulnerabilities
    ADD CONSTRAINT incident_vulnerabilities_pkey PRIMARY KEY (incident_id, vulnerability_id);


--
-- Name: incident_vulnerability_links incident_vulnerability_links_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.incident_vulnerability_links
    ADD CONSTRAINT incident_vulnerability_links_pkey PRIMARY KEY (incident_id, vulnerability_id);


--
-- Name: incidents incidents_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.incidents
    ADD CONSTRAINT incidents_pkey PRIMARY KEY (id);


--
-- Name: response_actions response_actions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.response_actions
    ADD CONSTRAINT response_actions_pkey PRIMARY KEY (id);


--
-- Name: response_measures response_measures_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.response_measures
    ADD CONSTRAINT response_measures_pkey PRIMARY KEY (id);


--
-- Name: responsible_employees responsible_employees_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.responsible_employees
    ADD CONSTRAINT responsible_employees_email_key UNIQUE (email);


--
-- Name: responsible_employees responsible_employees_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.responsible_employees
    ADD CONSTRAINT responsible_employees_pkey PRIMARY KEY (id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- Name: vulnerabilities vulnerabilities_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vulnerabilities
    ADD CONSTRAINT vulnerabilities_pkey PRIMARY KEY (id);


--
-- Name: incidents trg_audit_incident_insert; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_audit_incident_insert AFTER INSERT ON public.incidents FOR EACH ROW EXECUTE FUNCTION public.audit_insert_incident();


--
-- Name: incidents trg_audit_incident_update; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_audit_incident_update AFTER UPDATE ON public.incidents FOR EACH ROW EXECUTE FUNCTION public.audit_update_incident();


--
-- Name: incidents trg_audit_incidents; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_audit_incidents AFTER INSERT OR DELETE OR UPDATE ON public.incidents FOR EACH ROW EXECUTE FUNCTION public.audit_all_changes();


--
-- Name: vulnerabilities trg_audit_vulnerabilities; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_audit_vulnerabilities AFTER INSERT OR DELETE OR UPDATE ON public.vulnerabilities FOR EACH ROW EXECUTE FUNCTION public.audit_all_changes();


--
-- Name: incidents trg_check_threat_level; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_check_threat_level BEFORE INSERT OR UPDATE ON public.incidents FOR EACH ROW EXECUTE FUNCTION public.check_threat_level();


--
-- Name: incident_vulnerabilities trg_check_vulnerability_link; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_check_vulnerability_link BEFORE INSERT ON public.incident_vulnerabilities FOR EACH ROW EXECUTE FUNCTION public.check_vulnerability_status();


--
-- Name: incident_vulnerability_links trg_check_vulnerability_link; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_check_vulnerability_link BEFORE INSERT ON public.incident_vulnerability_links FOR EACH ROW EXECUTE FUNCTION public.check_vulnerability_status();


--
-- Name: vulnerabilities trg_check_vulnerability_status; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_check_vulnerability_status BEFORE INSERT OR UPDATE ON public.vulnerabilities FOR EACH ROW EXECUTE FUNCTION public.check_vulnerability_patch_status();


--
-- Name: incidents trg_prevent_active_deletion; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_prevent_active_deletion BEFORE DELETE ON public.incidents FOR EACH ROW EXECUTE FUNCTION public.prevent_active_incident_deletion();


--
-- Name: incidents trg_set_closed_at_time; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_set_closed_at_time BEFORE UPDATE ON public.incidents FOR EACH ROW EXECUTE FUNCTION public.set_closed_at_time();


--
-- Name: incidents trg_update_incident_timestamp; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_update_incident_timestamp BEFORE UPDATE ON public.incidents FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: vulnerabilities trg_update_vulnerability_timestamp; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_update_vulnerability_timestamp BEFORE UPDATE ON public.vulnerabilities FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: incident_source_links incident_source_links_incident_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.incident_source_links
    ADD CONSTRAINT incident_source_links_incident_id_fkey FOREIGN KEY (incident_id) REFERENCES public.incidents(id) ON DELETE CASCADE;


--
-- Name: incident_source_links incident_source_links_source_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.incident_source_links
    ADD CONSTRAINT incident_source_links_source_id_fkey FOREIGN KEY (source_id) REFERENCES public.incident_sources(id) ON DELETE CASCADE;


--
-- Name: incident_vulnerabilities incident_vulnerabilities_incident_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.incident_vulnerabilities
    ADD CONSTRAINT incident_vulnerabilities_incident_id_fkey FOREIGN KEY (incident_id) REFERENCES public.incidents(id) ON DELETE CASCADE;


--
-- Name: incident_vulnerabilities incident_vulnerabilities_vulnerability_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.incident_vulnerabilities
    ADD CONSTRAINT incident_vulnerabilities_vulnerability_id_fkey FOREIGN KEY (vulnerability_id) REFERENCES public.vulnerabilities(id) ON DELETE CASCADE;


--
-- Name: incident_vulnerability_links incident_vulnerability_links_incident_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.incident_vulnerability_links
    ADD CONSTRAINT incident_vulnerability_links_incident_id_fkey FOREIGN KEY (incident_id) REFERENCES public.incidents(id) ON DELETE CASCADE;


--
-- Name: incident_vulnerability_links incident_vulnerability_links_vulnerability_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.incident_vulnerability_links
    ADD CONSTRAINT incident_vulnerability_links_vulnerability_id_fkey FOREIGN KEY (vulnerability_id) REFERENCES public.vulnerabilities(id) ON DELETE CASCADE;


--
-- Name: incidents incidents_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.incidents
    ADD CONSTRAINT incidents_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: response_actions response_actions_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.response_actions
    ADD CONSTRAINT response_actions_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id);


--
-- Name: response_actions response_actions_incident_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.response_actions
    ADD CONSTRAINT response_actions_incident_id_fkey FOREIGN KEY (incident_id) REFERENCES public.incidents(id) ON DELETE CASCADE;


--
-- Name: response_measures response_measures_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.response_measures
    ADD CONSTRAINT response_measures_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.responsible_employees(id);


--
-- Name: response_measures response_measures_incident_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.response_measures
    ADD CONSTRAINT response_measures_incident_id_fkey FOREIGN KEY (incident_id) REFERENCES public.incidents(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict d8izngNnlL5vojKA637DFf5onkvqyAZFfxZN0h53fUwIOP34MZ793zPWrQijUvv

