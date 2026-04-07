// src/controllers/auth.controller.js
const admin = require('../config/firebase');
const { isFirebaseConfigured } = admin;
const pool  = require('../config/db');

/**
 * POST /api/auth/firebase-login
 * Body: { idToken }
 * 
 * Flow:
 *  1. Verify Firebase ID token
 *  2. Extract email
 *  3. Check against our users table
 *  4. Return user info + role
 */
const firebaseLogin = async (req, res) => {
  const { idToken } = req.body;

  if (!idToken) {
    return res.status(400).json({ error: 'idToken is required' });
  }

  try {
    if (!isFirebaseConfigured) {
      return res.status(503).json({ 
        error: 'Backend is running in MOCK mode. Firebase Admin is not configured. Please use Mock Login on the frontend.' 
      });
    }

    // Verify with Firebase Admin
    const decoded = await admin.auth().verifyIdToken(idToken);
    const email   = decoded.email;
    const name    = decoded.name || decoded.email;

    if (!email) {
      return res.status(400).json({ error: 'No email in token' });
    }

    // Check our database
    const [rows] = await pool.execute(
      'SELECT id, name, email, role, is_active FROM users WHERE email = ?',
      [email]
    );

    if (rows.length === 0) {
      return res.status(403).json({
        error: 'Unauthorized user. Contact your administrator to get access.',
      });
    }

    const user = rows[0];

    if (!user.is_active) {
      return res.status(403).json({ error: 'Account deactivated. Contact admin.' });
    }

    // Fetch role-specific profile
    let profile = null;

    if (user.role === 'student') {
      const [s] = await pool.execute(
        'SELECT id, student_code, department, year, section FROM students WHERE user_id = ?',
        [user.id]
      );
      profile = s[0] || null;
    } else if (user.role === 'faculty') {
      const [f] = await pool.execute(
        'SELECT id, employee_code, department, can_upload_marks FROM faculty WHERE user_id = ?',
        [user.id]
      );
      profile = f[0] || null;
    }

    return res.json({
      message: 'Login successful',
      user: {
        id:    user.id,
        name:  user.name,
        email: user.email,
        role:  user.role,
      },
      profile,
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(401).json({ error: 'Invalid Firebase token' });
  }
};

/**
 * GET /api/auth/me
 * Returns the currently authenticated user (uses verifyToken middleware)
 */
const getMe = async (req, res) => {
  const user = req.user;
  let profile = null;

  if (user.role === 'student') {
    const [s] = await pool.execute(
      'SELECT id, student_code, department, year, section FROM students WHERE user_id = ?',
      [user.id]
    );
    profile = s[0] || null;
  } else if (user.role === 'faculty') {
    const [f] = await pool.execute(
      'SELECT id, employee_code, department, can_upload_marks FROM faculty WHERE user_id = ?',
      [user.id]
    );
    profile = f[0] || null;
  }

  return res.json({ user, profile });
};

module.exports = { firebaseLogin, getMe };