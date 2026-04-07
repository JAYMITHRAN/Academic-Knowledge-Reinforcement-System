// src/middleware/auth.js
const admin = require('../config/firebase');
const pool  = require('../config/db');

/**
 * verifyToken
 * ─────────────
 * 1. Reads Bearer token from Authorization header
 * 2. Verifies with Firebase Admin SDK
 * 3. Checks that the email EXISTS in our MySQL users table
 * 4. Attaches user row to req.user
 */
const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const idToken = authHeader.split('Bearer ')[1];

  try {
    // Step 1: Verify Firebase token
    const decoded = await admin.auth().verifyIdToken(idToken);
    const email   = decoded.email;

    if (!email) {
      return res.status(401).json({ error: 'Token has no email claim' });
    }

    // Step 2: Check email in our database
    const [rows] = await pool.execute(
      'SELECT id, name, email, role, is_active FROM users WHERE email = ?',
      [email]
    );

    if (rows.length === 0) {
      return res.status(403).json({
        error: 'Unauthorized user. You are not registered in the system.',
      });
    }

    const user = rows[0];

    if (!user.is_active) {
      return res.status(403).json({ error: 'Your account has been deactivated.' });
    }

    // Step 3: Attach to request
    req.user = user; // { id, name, email, role, is_active }
    next();
  } catch (err) {
    console.error('Auth error:', err.message);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

/**
 * requireRole(...roles)
 * ──────────────────────
 * Factory that returns middleware enforcing role restriction.
 * Usage: requireRole('admin')  or  requireRole('admin', 'faculty')
 */
const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({
      error: `Access denied. Required role(s): ${roles.join(', ')}`,
    });
  }
  next();
};

module.exports = { verifyToken, requireRole };
