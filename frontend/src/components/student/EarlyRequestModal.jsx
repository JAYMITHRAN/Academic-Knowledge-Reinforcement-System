// src/components/student/EarlyRequestModal.jsx
import React, { useState } from 'react';
import { requestEarlyUnlock } from '../../services/api';

const EarlyRequestModal = ({ testId, isOpen, onClose, onSuccess }) => {
  const [reason, setReason] = useState('');
  const [requesting, setRequesting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!reason.trim()) {
      setError('Please provide a reason for early access.');
      return;
    }

    try {
      setRequesting(true);
      setError('');
      await requestEarlyUnlock(testId, { reason });
      onSuccess?.();
      onClose();
      setReason('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send request. Please try again.');
    } finally {
      setRequesting(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: '#000000cc', display: 'flex', alignItems: 'center', justifyContent: 'center',
      zindex: 100000, backdropFilter: 'blur(8px)'
    }}>
      <div style={{
        background: '#0f172a', border: '1px solid #1e293b', borderRadius: '24px',
        width: '90%', maxWidth: '440px', padding: '32px', boxShadow: '0 24px 64px #000',
        animation: 'modalFadeIn 0.3s ease-out'
      }}>
        <style>{`
          @keyframes modalFadeIn {
            from { opacity: 0; transform: translateY(10px) scale(0.98); }
            to { opacity: 1; transform: none; }
          }
        `}</style>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <div style={{ 
            width: '40px', height: '40px', borderRadius: '10px', background: '#38bdf811',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#38bdf8'
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="10" rx="2"></rect>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
          </div>
          <h3 style={{ margin: 0, color: '#f1f5f9', fontSize: '1.25rem', fontWeight: 800 }}>Request Early Access</h3>
        </div>

        <p style={{ color: '#64748b', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '24px' }}>
          By requesting early access, you indicate that you have completed your preparation ahead of the 24-hour mandatory period. Your mentor will review your reason.
        </p>
        
        <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.05em' }}>
          Reason for Request
        </label>
        <textarea
          autoFocus
          value={reason}
          onChange={e => { setReason(e.target.value); setError(''); }}
          placeholder="e.g. I have completed the recommended materials and performed well in my self-assessment..."
          style={{
            width: '100%', height: '140px', background: '#0a0f1e', border: `1px solid ${error ? '#ef4444' : '#1e293b'}`,
            borderRadius: '14px', padding: '16px', color: '#e2e8f0', fontSize: '0.9rem',
            outline: 'none', resize: 'none', marginBottom: '12px', boxSizing: 'border-box',
            transition: 'border-color 0.2s',
            boxShadow: 'inset 0 2px 4px #0002'
          }}
        />

        {error && (
          <div style={{ color: '#ef4444', fontSize: '0.8rem', marginBottom: '20px', fontWeight: 600 }}>
            ⚠ {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            disabled={requesting}
            onClick={() => { onClose(); setReason(''); setError(''); }}
            style={{
              flex: 1, padding: '14px', borderRadius: '12px', border: '1px solid #1e293b',
              background: 'transparent', color: '#64748b', fontWeight: 700, cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            Cancel
          </button>
          <button
            disabled={requesting || !reason.trim()}
            onClick={handleSubmit}
            style={{
              flex: 2, padding: '14px', borderRadius: '12px', border: 'none',
              background: (requesting || !reason.trim()) ? '#1e293b' : 'linear-gradient(135deg, #38bdf8, #0ea5e9)',
              color: (requesting || !reason.trim()) ? '#475569' : '#0f172a',
              fontWeight: 800, cursor: (requesting || !reason.trim()) ? 'not-allowed' : 'pointer',
              boxShadow: (requesting || !reason.trim()) ? 'none' : '0 8px 20px -6px #0ea5e966',
              transition: 'all 0.2s'
            }}
          >
            {requesting ? 'Sending...' : 'Send Request'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EarlyRequestModal;
