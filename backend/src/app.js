// src/app.js
require('dotenv').config();
const express = require('express');
const cors    = require('cors');

const initDb = require('./config/initDb');  // ← auto schema creation

const authRoutes    = require('./routes/auth.routes');
const adminRoutes   = require('./routes/admin.routes');
const facultyRoutes = require('./routes/faculty.routes');
const studentRoutes = require('./routes/student.routes');

const app  = express();
const PORT = process.env.PORT || 5000;

// Enable trust proxy for ngrok/proxies
app.set('trust proxy', 1);

// ── Middleware ────────────────────────────────────────────────────────────────
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:3000',
  'https://keelless-annice-unneuralgic.ngrok-free.dev'
].map(o => o?.replace(/\/$/, '')); // Remove trailing slashes

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    const normalizedOrigin = origin.replace(/\/$/, '');
    
    const isAllowed = allowedOrigins.includes(normalizedOrigin) || 
                     normalizedOrigin.endsWith('.ngrok-free.dev') ||
                     normalizedOrigin.endsWith('.ngrok-free.app') ||
                     normalizedOrigin.endsWith('.ngrok.io');

    if (isAllowed) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked for: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/auth',    authRoutes);
app.use('/api/admin',   adminRoutes);
app.use('/api/faculty', facultyRoutes);
app.use('/api/student', studentRoutes);

// ── Health Check ──────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => res.json({ status: 'ok', ts: new Date() }));

// ── Global Error Handler ──────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

// ── Bootstrap ─────────────────────────────────────────────────────────────────
// initDb() runs all CREATE TABLE IF NOT EXISTS statements and seeds the
// admin user before the HTTP server starts accepting connections.
// If the database is unreachable or DDL fails, the process exits with code 1.
const start = async () => {
  try {
    await initDb();                    // ← creates tables + indexes + admin seed
    app.listen(PORT, () => {
      console.log(`🚀 AKRS Backend running on port ${PORT}`);
    });
  } catch (err) {
    console.error('💥 Startup failed:', err.message);
    process.exit(1);
  }
};

start();

module.exports = app;
