// src/context/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { auth, provider, isConfigured } from '../firebase';
import { firebaseLogin } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user,    setUser]    = useState(null);   // our DB user
  const [profile, setProfile] = useState(null);   // student / faculty profile
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  // On mount: re-validate if Firebase still has a session
  useEffect(() => {
    // If not configured, just stop loading
    if (!isConfigured) {
      setLoading(false);
      return;
    }

    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const token = await firebaseUser.getIdToken();
          const res   = await firebaseLogin(token);
          setUser(res.data.user);
          setProfile(res.data.profile);
        } catch (err) {
          // Firebase session exists but user not in DB → sign out
          await signOut(auth);
          setUser(null);
          setProfile(null);
        }
      } else {
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const loginWithGoogle = async () => {
    if (!isConfigured) {
      throw new Error("Firebase not configured. Please use Mock Login instead.");
    }
    setError('');
    setLoading(true);
    try {
      const result    = await signInWithPopup(auth, provider);
      const idToken   = await result.user.getIdToken();
      const res       = await firebaseLogin(idToken);
      setUser(res.data.user);
      setProfile(res.data.profile);
      return res.data.user;
    } catch (err) {
      const msg = err.response?.data?.error || 'Login failed';
      setError(msg);
      await signOut(auth);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  };

  const mockLogin = async (role = 'student') => {
    setLoading(true);
    // Simulate a short delay
    await new Promise(r => setTimeout(r, 500));
    
    // Create a dummy user object based on the role
    const dummyUser = {
      id: "mock-123",
      email: `mock-${role}@example.com`,
      name: `Mock ${role.charAt(0).toUpperCase() + role.slice(1)}`,
      role: role
    };
    
    setUser(dummyUser);
    setProfile({}); // Empty profile
    setLoading(false);
    return dummyUser;
  };

  const logout = async () => {
    if (isConfigured) await signOut(auth);
    setUser(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, error, loginWithGoogle, mockLogin, logout, isConfigured }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
