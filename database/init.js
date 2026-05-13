const fs = require('fs');
const path = require('path');
const { pool } = require('./db');
const bcrypt = require('bcrypt');

async function initDatabase() {
    const client = await pool.connect();
    try {
        console.log('Initializing database...');
        
       
        const sql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
        const commands = sql.split(';').filter(cmd => cmd.trim());
        
        for (const command of commands) {
            if (command.trim()) {
                await client.query(command);
            }
        }
        
    
        const hashedPassword = await bcrypt.hash('admin123', 10);
        await client.query(`
            INSERT INTO users (username, email, password_hash, role) 
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (username) DO NOTHING
        `, ['admin', 'admin@security.com', hashedPassword, 'admin']);
        
        console.log('Database initialized successfully');
        console.log('Test user: admin / admin123');
        console.log('Using database: security');
    } catch (err) {
        console.error('Database initialization error:', err);
        throw err;
    } finally {
        client.release();
    }
}

module.exports = { initDatabase };