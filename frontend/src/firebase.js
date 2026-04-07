// src/firebase.js
import { initializeApp }           from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey:     import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:  import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId:      import.meta.env.VITE_FIREBASE_APP_ID,
};

// Check if Firebase is actually configured
let isConfigured = !!(firebaseConfig.apiKey && firebaseConfig.apiKey !== 'your_actual_key_here');

let app;
let auth;
let provider;

if (isConfigured) {
  try {
    app      = initializeApp(firebaseConfig);
    auth     = getAuth(app);
    provider = new GoogleAuthProvider();
  } catch (err) {
    console.error("Firebase initialization failed:", err);
    isConfigured = false;
  }
}

if (!isConfigured) {
  console.warn("⚠️ Firebase is NOT configured. Running in MOCK Mode.");
  // Mock Auth Object
  auth = {
    currentUser: null,
    onAuthStateChanged: (cb) => {
      // Simulate no user logged in by default
      setTimeout(() => cb(null), 10);
      return () => {};
    },
    signOut: () => Promise.resolve(),
  };
  provider = {};
}

export { auth, provider, isConfigured };
export default app || null;