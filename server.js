const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const port = process.env.SERVER_PORT || 5000;

app.use(helmet());
app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true
}));
app.use(express.json());

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { error: 'Слишком много запросов, попробуйте позже' }
});
app.use('/api/', limiter);

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '9824015668',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5433,
    database: process.env.DB_NAME || 'security',
});

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ error: 'Требуется авторизация' });
    }
    
    jwt.verify(token, process.env.JWT_SECRET || 'secret-key-change-me', (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Недействительный токен' });
        }
        req.user = user;
        next();
    });
};

const authenticateAdmin = (req, res, next) => {
    // Проверяем все возможные варианты написания роли админа
    const role = req.user.role;
    if (role !== 'Администратор' && role !== 'admin' && role !== 'Admin') {
        return res.status(403).json({ error: 'Доступ запрещен. Требуются права администратора.' });
    }
    next();
};

app.post('/api/auth/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        
        if (!username || !email || !password) {
            return res.status(400).json({ error: 'Все поля обязательны для заполнения' });
        }
        
        if (password.length < 6) {
            return res.status(400).json({ error: 'Пароль должен содержать минимум 6 символов' });
        }
        
        const hashedPassword = await bcrypt.hash(password, 10);
        
        const result = await pool.query(
            `INSERT INTO users (username, email, password_hash, role)
             VALUES ($1, $2, $3, $4)
             RETURNING id, username, email, role, created_at`,
            [username, email, hashedPassword, 'Пользователь']
        );
        
        const token = jwt.sign(
            { id: result.rows[0].id, username: result.rows[0].username, role: result.rows[0].role },
            process.env.JWT_SECRET || 'secret-key-change-me',
            { expiresIn: '7d' }
        );
        
        res.status(201).json({
            message: 'Регистрация успешна',
            token,
            user: {
                id: result.rows[0].id,
                username: result.rows[0].username,
                email: result.rows[0].email,
                role: result.rows[0].role
            }
        });
    } catch (err) {
        if (err.code === '23505') {
            res.status(400).json({ error: 'Пользователь с таким email или именем уже существует' });
        } else {
            res.status(500).json({ error: 'Ошибка сервера: ' + err.message });
        }
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        if (!username || !password) {
            return res.status(400).json({ error: 'Имя пользователя и пароль обязательны' });
        }
        
        const result = await pool.query(
            `SELECT id, username, email, password_hash, role FROM users WHERE username = $1 OR email = $1`,
            [username]
        );
        
        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Неверное имя пользователя или пароль' });
        }
        
        const user = result.rows[0];
        const validPassword = await bcrypt.compare(password, user.password_hash);
        
        if (!validPassword) {
            return res.status(401).json({ error: 'Неверное имя пользователя или пароль' });
        }
        
        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role },
            process.env.JWT_SECRET || 'secret-key-change-me',
            { expiresIn: '7d' }
        );
        
        res.json({
            message: 'Вход выполнен успешно',
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/auth/verify', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT id, username, email, role FROM users WHERE id = $1`,
            [req.user.id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Пользователь не найден' });
        }
        
        res.json({ user: result.rows[0] });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/attacks', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT id, name, description, type, protocol, 
                    threat_level, status, created_at as date, updated_at
             FROM incidents ORDER BY created_at DESC`
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/attacks/paginated', authenticateToken, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;
        const typeFilter = req.query.type;
        const statusFilter = req.query.status;
        
        let query = 'SELECT * FROM incidents WHERE 1=1';
        let countQuery = 'SELECT COUNT(*) FROM incidents WHERE 1=1';
        let params = [];
        let paramIndex = 1;
        
        if (typeFilter && typeFilter !== 'Все') {
            query += ` AND type = $${paramIndex}`;
            countQuery += ` AND type = $${paramIndex}`;
            params.push(typeFilter);
            paramIndex++;
        }
        
        if (statusFilter && statusFilter !== 'Все') {
            query += ` AND status = $${paramIndex}`;
            countQuery += ` AND status = $${paramIndex}`;
            params.push(statusFilter);
            paramIndex++;
        }
        
        query += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        params.push(limit, offset);
        
        const [dataResult, countResult] = await Promise.all([
            pool.query(query, params),
            pool.query(countQuery, params.slice(0, -2))
        ]);
        
        res.json({
            data: dataResult.rows,
            total: parseInt(countResult.rows[0].count),
            page: page,
            totalPages: Math.ceil(parseInt(countResult.rows[0].count) / limit)
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/attacks/:id', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT id, name, description, type, protocol, 
                    threat_level, status, created_at as date, updated_at
             FROM incidents WHERE id = $1`,
            [req.params.id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Не найдено' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/attacks', authenticateToken, authenticateAdmin, async (req, res) => {
    const client = await pool.connect(); 
    
    try {
      
        const { name, description, type, protocol, threat_level, status, vulnerability_ids, source_ids, date } = req.body;
        
        if (!name || !description || !protocol) {
            return res.status(400).json({ error: 'Название, описание и протокол обязательны' });
        }
        
        await client.query('BEGIN'); 
        
    
        const createdAt = date ? new Date(date) : new Date();
        
     
        const incidentResult = await client.query(
            `INSERT INTO incidents (name, description, type, protocol, threat_level, status, created_by, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             RETURNING id, name, description, type, protocol, threat_level, status, created_at as date`,
            [name, description, type || 'Внешняя', protocol.toUpperCase(), threat_level || 3, status || 'Активна', req.user.id, createdAt]
        );
        
        const newIncidentId = incidentResult.rows[0].id;
        
        if (vulnerability_ids && vulnerability_ids.length > 0) {
            for (let v_id of vulnerability_ids) {
                await client.query(
                    'INSERT INTO incident_vulnerability_links (incident_id, vulnerability_id) VALUES ($1, $2)',
                    [newIncidentId, v_id]
                );
            }
        }
        
        if (source_ids && source_ids.length > 0) {
            for (let s_id of source_ids) {
                await client.query(
                    'INSERT INTO incident_source_links (incident_id, source_id) VALUES ($1, $2)',
                    [newIncidentId, s_id]
                );
            }
        }
        
        await client.query('COMMIT');
        res.status(201).json(incidentResult.rows[0]);
    } catch (err) {
        await client.query('ROLLBACK'); 
        res.status(500).json({ error: err.message });
    } finally {
        client.release();
    }
});

app.put('/api/attacks/:id', authenticateToken, authenticateAdmin, async (req, res) => {
    const client = await pool.connect();
    
    try {
        const { name, description, type, protocol, threat_level, status, date, vulnerability_ids, source_ids } = req.body;
        
        await client.query('BEGIN');
        
   
        let result;
        if (date) {
            result = await client.query(
                `UPDATE incidents 
                 SET name = $1, description = $2, type = $3, protocol = $4, 
                     threat_level = $5, status = $6, created_at = $7, updated_at = CURRENT_TIMESTAMP
                 WHERE id = $8 RETURNING *`,
                [name, description, type, protocol.toUpperCase(), threat_level, status, new Date(date), req.params.id]
            );
        } else {
            result = await client.query(
                `UPDATE incidents 
                 SET name = $1, description = $2, type = $3, protocol = $4, 
                     threat_level = $5, status = $6, updated_at = CURRENT_TIMESTAMP
                 WHERE id = $7 RETURNING *`,
                [name, description, type, protocol.toUpperCase(), threat_level, status, req.params.id]
            );
        }
        
        if (result.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Не найдено' });
        }
        
    
        await client.query('DELETE FROM incident_vulnerability_links WHERE incident_id = $1', [req.params.id]);
        if (vulnerability_ids && vulnerability_ids.length > 0) {
            for (let v_id of vulnerability_ids) {
                await client.query(
                    'INSERT INTO incident_vulnerability_links (incident_id, vulnerability_id) VALUES ($1, $2)',
                    [req.params.id, v_id]
                );
            }
        }
        
 
        await client.query('DELETE FROM incident_source_links WHERE incident_id = $1', [req.params.id]);
        if (source_ids && source_ids.length > 0) {
            for (let s_id of source_ids) {
                await client.query(
                    'INSERT INTO incident_source_links (incident_id, source_id) VALUES ($1, $2)',
                    [req.params.id, s_id]
                );
            }
        }
        
        await client.query('COMMIT');
        res.json(result.rows[0]);
    } catch (err) {
        await client.query('ROLLBACK');
        res.status(500).json({ error: err.message });
    } finally {
        client.release();
    }
});

app.delete('/api/attacks/:id', authenticateToken, authenticateAdmin, async (req, res) => {
    try {
        const checkResult = await pool.query(
            'SELECT status FROM incidents WHERE id = $1',
            [req.params.id]
        );
        
        if (checkResult.rows.length === 0) {
            return res.status(404).json({ error: 'Не найдено' });
        }
        
        const status = checkResult.rows[0].status;
        
        if (status === 'Активна') {
            return res.status(400).json({ error: 'Нельзя удалить активный инцидент. Сначала заблокируйте его.' });
        }
        
        await pool.query('DELETE FROM incidents WHERE id = $1', [req.params.id]);
        res.status(204).send();
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/employees', authenticateToken, authenticateAdmin, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM employees ORDER BY id');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/employees/:id', authenticateToken, authenticateAdmin, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM employees WHERE id = $1', [req.params.id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Не найдено' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/employees', authenticateToken, authenticateAdmin, async (req, res) => {
    try {
        const { full_name, position, email, phone, department } = req.body;
        const result = await pool.query(
            'INSERT INTO employees (full_name, position, email, phone, department) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [full_name, position, email, phone, department]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/employees/:id', authenticateToken, authenticateAdmin, async (req, res) => {
    try {
        const { full_name, position, email, phone, department } = req.body;
        const result = await pool.query(
            'UPDATE employees SET full_name=$1, position=$2, email=$3, phone=$4, department=$5 WHERE id=$6 RETURNING *',
            [full_name, position, email, phone, department, req.params.id]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/employees/:id', authenticateToken, authenticateAdmin, async (req, res) => {
    try {
        await pool.query('DELETE FROM employees WHERE id=$1', [req.params.id]);
        res.status(204).send();
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/sources', authenticateToken, authenticateAdmin, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM incident_sources ORDER BY id');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/sources/:id', authenticateToken, authenticateAdmin, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM incident_sources WHERE id = $1', [req.params.id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Не найдено' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/sources', authenticateToken, authenticateAdmin, async (req, res) => {
    try {
        const { source_name, source_type, ip_address, device_name, contact_info } = req.body;
        const result = await pool.query(
            'INSERT INTO incident_sources (source_name, source_type, ip_address, device_name, contact_info) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [source_name, source_type, ip_address, device_name, contact_info]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/sources/:id', authenticateToken, authenticateAdmin, async (req, res) => {
    try {
        const { source_name, source_type, ip_address, device_name, contact_info } = req.body;
        const result = await pool.query(
            'UPDATE incident_sources SET source_name=$1, source_type=$2, ip_address=$3, device_name=$4, contact_info=$5 WHERE id=$6 RETURNING *',
            [source_name, source_type, ip_address, device_name, contact_info, req.params.id]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/sources/:id', authenticateToken, authenticateAdmin, async (req, res) => {
    try {
        await pool.query('DELETE FROM incident_sources WHERE id=$1', [req.params.id]);
        res.status(204).send();
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/measures', authenticateToken, authenticateAdmin, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT rm.*, i.name as incident_name, e.full_name as employee_name 
            FROM response_measures rm
            LEFT JOIN incidents i ON rm.incident_id = i.id
            LEFT JOIN employees e ON rm.employee_id = e.id
            ORDER BY rm.id
        `);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/measures/:id', authenticateToken, authenticateAdmin, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT rm.*, i.name as incident_name, e.full_name as employee_name 
            FROM response_measures rm
            LEFT JOIN incidents i ON rm.incident_id = i.id
            LEFT JOIN employees e ON rm.employee_id = e.id
            WHERE rm.id = $1
        `, [req.params.id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Не найдено' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/measures', authenticateToken, authenticateAdmin, async (req, res) => {
    try {
        const { measure_name, measure_type, description, incident_id, employee_id } = req.body;
        const result = await pool.query(
            'INSERT INTO response_measures (measure_name, measure_type, description, incident_id, employee_id) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [measure_name, measure_type, description, incident_id, employee_id]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/measures/:id', authenticateToken, authenticateAdmin, async (req, res) => {
    try {
        const { measure_name, measure_type, description, incident_id, employee_id } = req.body;
        const result = await pool.query(
            'UPDATE response_measures SET measure_name=$1, measure_type=$2, description=$3, incident_id=$4, employee_id=$5 WHERE id=$6 RETURNING *',
            [measure_name, measure_type, description, incident_id, employee_id, req.params.id]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/measures/:id', authenticateToken, authenticateAdmin, async (req, res) => {
    try {
        await pool.query('DELETE FROM response_measures WHERE id=$1', [req.params.id]);
        res.status(204).send();
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/vulnerabilities', authenticateToken, authenticateAdmin, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM vulnerabilities ORDER BY id');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/vulnerabilities/:id', authenticateToken, authenticateAdmin, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM vulnerabilities WHERE id = $1', [req.params.id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Не найдено' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/vulnerabilities', authenticateToken, authenticateAdmin, async (req, res) => {
    try {
        const { vulnerability_type, software_version, system_name, patch_status, threat_level } = req.body;
        const result = await pool.query(
            'INSERT INTO vulnerabilities (vulnerability_type, software_version, system_name, patch_status, threat_level) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [vulnerability_type, software_version, system_name, patch_status, threat_level]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/vulnerabilities/:id', authenticateToken, authenticateAdmin, async (req, res) => {
    try {
        const { vulnerability_type, software_version, system_name, patch_status, threat_level } = req.body;
        const result = await pool.query(
            'UPDATE vulnerabilities SET vulnerability_type=$1, software_version=$2, system_name=$3, patch_status=$4, threat_level=$5, updated_at=CURRENT_TIMESTAMP WHERE id=$6 RETURNING *',
            [vulnerability_type, software_version, system_name, patch_status, threat_level, req.params.id]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/vulnerabilities/:id', authenticateToken, authenticateAdmin, async (req, res) => {
    try {
        await pool.query('DELETE FROM vulnerabilities WHERE id=$1', [req.params.id]);
        res.status(204).send();
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/audit-log', authenticateToken, authenticateAdmin, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM audit_log ORDER BY changed_at DESC LIMIT 100');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/statistics', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN status = 'Активна' THEN 1 ELSE 0 END) as active,
                SUM(CASE WHEN status = 'Заблокирована' THEN 1 ELSE 0 END) as blocked,
                SUM(CASE WHEN type = 'Внешняя' THEN 1 ELSE 0 END) as external,
                SUM(CASE WHEN type = 'Внутренняя' THEN 1 ELSE 0 END) as internal
            FROM incidents
        `);
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/incidents', authenticateToken, authenticateAdmin, async (req, res) => {
    try {
        const result = await pool.query('SELECT id, name FROM incidents ORDER BY id');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/count-by-period', authenticateToken, async (req, res) => {
    try {
        const { start, end } = req.query;
        const result = await pool.query('SELECT count_incidents_by_period($1, $2) as count', [start, end]);
        res.json({ count: result.rows[0].count });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/avg-response-time', authenticateToken, async (req, res) => {
    try {
        const { employee_id, start, end } = req.query;
        const result = await pool.query('SELECT avg_response_time($1, $2, $3) as avg_hours', [employee_id, start, end]);
        res.json({ avg_hours: result.rows[0].avg_hours });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/top-vulnerabilities', authenticateToken, async (req, res) => {
    try {
        const { year, quarter } = req.query;
        const result = await pool.query('SELECT * FROM get_top_vulnerabilities($1, $2)', [year, quarter]);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/incident-vulnerabilities', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                ivl.incident_id, 
                ivl.vulnerability_id, 
                i.name as incident_name, 
                v.vulnerability_type, 
                v.patch_status
            FROM incident_vulnerability_links ivl
            JOIN incidents i ON ivl.incident_id = i.id
            JOIN vulnerabilities v ON ivl.vulnerability_id = v.id
            ORDER BY i.created_at DESC
        `);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: 'Ошибка сервера: ' + err.message });
    }
});


app.post('/api/incident-vulnerabilities', authenticateToken, authenticateAdmin, async (req, res) => {
    const { incident_id, vulnerability_id } = req.body;
    try {
        await pool.query(
            'INSERT INTO incident_vulnerability_links (incident_id, vulnerability_id) VALUES ($1, $2)',
            [incident_id, vulnerability_id]
        );

        res.status(201).json({ message: 'Связь успешно создана' });
    } catch (err) {
        if (err.code === '23505') {
            res.status(400).json({ error: 'Эта связь уже существует' });
        } else {
            res.status(500).json({ error: err.message });
        }
    }
});


app.delete('/api/incident-vulnerabilities', authenticateToken, authenticateAdmin, async (req, res) => {
    const { incident_id, vulnerability_id } = req.body;
    try {
        const result = await pool.query(
            'DELETE FROM incident_vulnerability_links WHERE incident_id = $1 AND vulnerability_id = $2',
            [incident_id, vulnerability_id]
        );
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Связь не найдена' });
        }
        res.status(204).send();
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
app.get('/api/attacks/:id/vulnerabilities', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT v.* FROM vulnerabilities v
             JOIN incident_vulnerability_links ivl ON v.id = ivl.vulnerability_id
             WHERE ivl.incident_id = $1`, [req.params.id]
        );
        res.json(result.rows);
    } catch (err) { 
        res.status(500).json({ error: err.message }); 
    }
});


app.get('/api/attacks/:id/sources', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT s.* FROM incident_sources s
             JOIN incident_source_links isl ON s.id = isl.source_id
             WHERE isl.incident_id = $1`, [req.params.id]
        );
        res.json(result.rows);
    } catch (err) { 
        res.status(500).json({ error: err.message }); 
    }
});
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});