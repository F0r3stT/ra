const { query } = require('../database/db');

async function getAllIncidents() {
    const result = await query(
        `SELECT id, name, description, type, protocol, 
                threat_level, status, created_at as date, updated_at
         FROM incidents ORDER BY created_at DESC`
    );
    return result.rows;
}

async function getIncidentById(id) {
    const result = await query(
        `SELECT id, name, description, type, protocol, 
                threat_level, status, created_at as date, updated_at
         FROM incidents WHERE id = $1`,
        [id]
    );
    return result.rows[0];
}

async function createIncident(data) {
    const result = await query(
        `INSERT INTO incidents (name, description, type, protocol, threat_level, status)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, name, description, type, protocol, threat_level, status, created_at as date`,
        [data.name, data.desc, data.type, data.protocol, data.threat_level || 3, data.status]
    );
    return result.rows[0];
}

async function updateIncident(id, data) {
    const result = await query(
        `UPDATE incidents 
         SET name = $1, description = $2, type = $3, protocol = $4, 
             threat_level = $5, status = $6, updated_at = CURRENT_TIMESTAMP
         WHERE id = $7
         RETURNING id, name, description, type, protocol, threat_level, status, created_at as date`,
        [data.name, data.desc, data.type, data.protocol, data.threat_level, data.status, id]
    );
    return result.rows[0];
}

async function deleteIncident(id) {
    await query('DELETE FROM incidents WHERE id = $1', [id]);
    return { id };
}

async function getStatistics() {
    const result = await query(`
        SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN status = 'Активна' THEN 1 ELSE 0 END) as active,
            SUM(CASE WHEN status = 'Заблокирована' THEN 1 ELSE 0 END) as blocked,
            SUM(CASE WHEN type = 'Внешняя' THEN 1 ELSE 0 END) as external,
            SUM(CASE WHEN type = 'Внутренняя' THEN 1 ELSE 0 END) as internal
        FROM incidents
    `);
    return result.rows[0];
}

module.exports = {
    getAllIncidents,
    getIncidentById,
    createIncident,
    updateIncident,
    deleteIncident,
    getStatistics
};