// src/config/firebase.js
const admin = require('firebase-admin');
require('dotenv').config();

const isConfigured = !!(
  process.env.FIREBASE_PROJECT_ID &&
  process.env.FIREBASE_CLIENT_EMAIL &&
  process.env.FIREBASE_PRIVATE_KEY
);

if (isConfigured && !admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId:   process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey:  process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      }),
    });
    console.log('✅ Firebase Admin initialized');
  } catch (err) {
    console.error('❌ Firebase Admin initialization failed:', err.message);
  }
} else if (!isConfigured) {
  console.warn('⚠️ Firebase Admin NOT configured. Certain auth features will be disabled.');
}

module.exports = admin;
module.exports.isFirebaseConfigured = isConfigured;
