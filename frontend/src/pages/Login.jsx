// src/pages/Login.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { isConfigured } from '../firebase';

const ROLE_PATHS = { admin: '/admin', faculty: '/faculty', student: '/student' };

const Login = () => {
  const { loginWithGoogle, mockLogin, user, loading } = useAuth();
  const navigate = useNavigate();
  const [err, setErr]     = useState('');
  const [busy, setBusy]   = useState(false);

  const handleMockLogin = async (role) => {
    setErr('');
    setBusy(true);
    try {
      const u = await mockLogin(role);
      navigate(ROLE_PATHS[u.role] || '/');
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };

  const mockBtnStyle = {
    width: '100%',
    padding: '12px',
    borderRadius: '8px',
    border: '1px dashed #334155',
    background: 'rgba(30,41,59,0.5)',
    color: '#94a3b8',
    fontSize: '0.85rem',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.2s',
  };

  useEffect(() => {
    if (user) navigate(ROLE_PATHS[user.role] || '/');
  }, [user, navigate]);

  const handleLogin = async () => {
    setErr('');
    setBusy(true);
    try {
      const u = await loginWithGoogle();
      navigate(ROLE_PATHS[u.role] || '/');
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };

  if (loading) return null;

  return (
    <div style={{
      minHeight:  '100vh',
      background: '#050a14',
      display:    'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'Inter', sans-serif",
      position:   'relative',
      overflow:   'hidden',
    }}>
      {/* Background grid */}
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.06,
        backgroundImage: `
          linear-gradient(#38bdf8 1px, transparent 1px),
          linear-gradient(90deg, #38bdf8 1px, transparent 1px)`,
        backgroundSize: '48px 48px',
      }} />

      {/* Glow blobs */}
      <div style={{
        position: 'absolute', width: '500px', height: '500px',
        borderRadius: '50%', background: '#0369a1',
        filter: 'blur(120px)', opacity: 0.15,
        top: '-100px', left: '-100px', pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', width: '400px', height: '400px',
        borderRadius: '50%', background: '#7c3aed',
        filter: 'blur(120px)', opacity: 0.1,
        bottom: '-80px', right: '-80px', pointerEvents: 'none',
      }} />

      {/* Card */}
      <div style={{
        position:    'relative',
        background:  'rgba(15,23,42,0.9)',
        border:      '1px solid #1e293b',
        borderRadius: '16px',
        padding:     '48px 40px',
        width:       '400px',
        backdropFilter: 'blur(20px)',
        boxShadow:   '0 25px 60px rgba(0,0,0,0.5)',
      }}>
        {/* Logo mark */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: '56px', height: '56px', borderRadius: '14px',
            background: 'linear-gradient(135deg, #0ea5e9, #6366f1)',
            fontSize: '1.8rem', marginBottom: '20px',
          }}>
            ◈
          </div>
          <h1 style={{
            margin: 0, fontSize: '1.5rem', fontWeight: 700, color: '#f1f5f9',
            letterSpacing: '-0.02em',
          }}>
            AKRS
          </h1>
          <p style={{
            margin: '6px 0 0', color: '#64748b', fontSize: '0.82rem',
            letterSpacing: '0.08em', textTransform: 'uppercase',
          }}>
            Academic Knowledge Reinforcement System
          </p>
        </div>

        <div style={{
          height: '1px', background: '#1e293b', margin: '0 0 32px',
        }} />

        <p style={{
          color: '#94a3b8', fontSize: '0.88rem', marginBottom: '24px',
          textAlign: 'center', lineHeight: 1.6,
        }}>
          Sign in with your institutional Google account.<br />
          Only registered users can access the system.
        </p>

        {/* Error */}
        {err && (
          <div style={{
            background: '#1a0a0a', border: '1px solid #ef4444',
            borderRadius: '8px', padding: '12px 16px',
            color: '#fca5a5', fontSize: '0.83rem', marginBottom: '20px',
            display: 'flex', alignItems: 'flex-start', gap: '8px',
          }}>
            <span>⚠</span> {err}
          </div>
        )}

        {/* Google Sign-In Button */}
        {isConfigured ? (
          <button
            onClick={handleLogin}
            disabled={busy}
            style={{
              width:       '100%',
              display:     'flex',
              alignItems:  'center',
              justifyContent: 'center',
              gap:         '12px',
              padding:     '14px 20px',
              borderRadius: '10px',
              border:      '1px solid #334155',
              background:  busy ? '#1e293b' : '#0f172a',
              color:       busy ? '#475569' : '#e2e8f0',
              fontSize:    '0.9rem',
              fontWeight:  600,
              cursor:      busy ? 'not-allowed' : 'pointer',
              transition:  'all 0.2s',
            }}
            onMouseEnter={(e) => {
              if (!busy) e.currentTarget.style.borderColor = '#38bdf8';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#334155';
            }}
          >
            {/* Google SVG */}
            <svg width="18" height="18" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            </svg>
            {busy ? 'Signing in…' : 'Continue with Google'}
          </button>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <p style={{ color: '#ef4444', fontSize: '0.75rem', textAlign: 'center', marginBottom: '8px' }}>
              Firebase not configured. Use Mock Login:
            </p>
            <button
              onClick={() => handleMockLogin('student')}
              style={mockBtnStyle}
            >
              Mock Student Login
            </button>
            <button
              onClick={() => handleMockLogin('faculty')}
              style={mockBtnStyle}
            >
              Mock Faculty Login
            </button>
            <button
              onClick={() => handleMockLogin('admin')}
              style={mockBtnStyle}
            >
              Mock Admin Login
            </button>
          </div>
        )}

        <p style={{
          textAlign: 'center', color: '#334155', fontSize: '0.75rem', marginTop: '24px',
        }}>
          Access is restricted to registered institutional accounts only.
        </p>
      </div>
    </div>
  );
};

export default Login;
