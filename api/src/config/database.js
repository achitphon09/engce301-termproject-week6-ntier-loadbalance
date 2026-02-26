// src/config/database.js
const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.DB_HOST || 'db',
    port: parseInt(process.env.DB_PORT) || 5432,
    database: process.env.DB_NAME || 'taskboard_db',
    user: process.env.DB_USER || 'taskboard',
    password: process.env.DB_PASSWORD || 'taskboard123',
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000
});

pool.on('connect', () => console.log('✅ Connected to PostgreSQL'));
pool.on('error', (err) => console.error('❌ PostgreSQL error:', err.message));

const query = async (text, params) => {
    const start = Date.now();
    const result = await pool.query(text, params);
    console.log(`📊 DB Query: ${Date.now() - start}ms | Rows: ${result.rowCount}`);
    return result;
};

const healthCheck = async () => {
    try {
        const result = await pool.query('SELECT NOW() as time');
        return { status: 'healthy', timestamp: result.rows[0].time };
    } catch (error) {
        return { status: 'unhealthy', error: error.message };
    }
};

module.exports = { pool, query, healthCheck };
