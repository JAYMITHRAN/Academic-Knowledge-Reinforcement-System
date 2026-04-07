// src/routes/auth.routes.js
const express    = require('express');
const router     = express.Router();
const { firebaseLogin, getMe } = require('../controllers/auth.controller');
const { verifyToken }          = require('../middleware/auth');

router.post('/firebase-login', firebaseLogin);
router.get('/me', verifyToken, getMe);

module.exports = router;
