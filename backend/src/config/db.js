// src/config/db.js
// Standard MySQL connection pool (local MySQL, no mandatory SSL)
const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host:               process.env.DB_HOST     || 'localhost',
  port:               parseInt(process.env.DB_PORT || '3306', 10),
  user:               process.env.DB_USER     || 'root',
  password:           process.env.DB_PASSWORD || '',
  database:           process.env.DB_NAME     || 'akrs_db',
  waitForConnections: true,
  connectionLimit:    10,
  queueLimit:         0,
  timezone:           '+00:00',
  // SSL optional — set DB_SSL=true in .env to enable
  ...(process.env.DB_SSL === 'true' && {
    ssl: { rejectUnauthorized: false },
  }),
});

// Test connection on startup
(async () => {
  try {
    const conn = await pool.getConnection();
    console.log(`✅ Connected to MySQL: ${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 3306}`);
    conn.release();
  } catch (err) {
    console.error('❌ MySQL connection failed:', err.message);
    console.warn('⚠️  Make sure MySQL is running and .env credentials are correct.');
  }
})();

module.exports = pool;