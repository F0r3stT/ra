const { pool } = require('./db');
const bcrypt = require('bcrypt');

async function initDatabase() {
    const client = await pool.connect();
    try {
        console.log('Создание администратора...');
        
        // Хешируем пароль для суперадмина
        const hashedPassword = await bcrypt.hash('admin123', 10);
        
        // Вставляем админа
        await client.query(`
            INSERT INTO users (username, email, password_hash, role) 
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (username) DO NOTHING
        `, ['admin', 'admin@security.com', hashedPassword, 'Администратор']);
        
        console.log('Администратор успешно создан!');
        console.log('Данные для входа: admin / admin123');
    } catch (err) {
        console.error('Ошибка:', err);
    } finally {
        client.release();
        // Закрываем пул соединений
        await pool.end();
    }
}

initDatabase();