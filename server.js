const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const port = 5000;

app.use(cors());
app.use(express.json());

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5433,
    database: process.env.DB_NAME || 'security',
});

app.get('/api/attacks', async (req, res) => {
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

app.get('/api/attacks/:id', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT id, name, description, type, protocol, 
                    threat_level, status, created_at as date, updated_at
             FROM incidents WHERE id = $1`,
            [req.params.id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/attacks', async (req, res) => {
    try {
        const { name, description, type, protocol, threat_level, status } = req.body;
        
        const result = await pool.query(
            `INSERT INTO incidents (name, description, type, protocol, threat_level, status)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING id, name, description, type, protocol, threat_level, status, created_at as date`,
            [name, description, type, protocol, threat_level || 3, status || 'Активна']
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/attacks/:id', async (req, res) => {
    try {
        const { name, description, type, protocol, threat_level, status } = req.body;
        
        const result = await pool.query(
            `UPDATE incidents 
             SET name = $1, description = $2, type = $3, protocol = $4, 
                 threat_level = $5, status = $6, updated_at = CURRENT_TIMESTAMP
             WHERE id = $7
             RETURNING id, name, description, type, protocol, threat_level, status, created_at as date`,
            [name, description, type, protocol, threat_level, status, req.params.id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/attacks/:id', async (req, res) => {
    try {
        const checkResult = await pool.query(
            'SELECT status FROM incidents WHERE id = $1',
            [req.params.id]
        );
        
        if (checkResult.rows.length === 0) {
            return res.status(404).json({ error: 'Not found' });
        }
        
        const status = checkResult.rows[0].status;
        
        if (status === 'Активна') {
            return res.status(400).json({ error: 'Нельзя удалить инцидент со статусом "Активна". Сначала заблокируйте его.' });
        }
        
        await pool.query('DELETE FROM incidents WHERE id = $1', [req.params.id]);
        res.status(204).send();
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/statistics', async (req, res) => {
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

app.get('/api/test-functions', async (req, res) => {
    try {
        const count = await pool.query(
            'SELECT count_incidents_by_period($1, $2) as count',
            ['2026-01-01', '2026-12-31']
        );
        const valid = await pool.query(
            'SELECT is_valid_threat_level($1) as valid',
            [1]
        );
        res.json({
            count_incidents: count.rows[0].count,
            is_valid_threat_level: valid.rows[0].valid
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});