// src/pages/faculty/TestRequests.jsx
import React, { useEffect, useState } from 'react';
import { getPendingUnlockRequests, approveUnlockRequest } from '../../services/api';
import AppLayout from '../../components/Layout/AppLayout';

const TestRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');
  const [processing, setProcessing] = useState(null); // ID of request being handled

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await getPendingUnlockRequests();
      setRequests(res.data.requests);
    } catch {
      setError('Failed to load pending requests.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleAction = async (id, action) => {
    try {
      setProcessing(id);
      await approveUnlockRequest(id, action);
      setRequests(prev => prev.filter(r => r.id !== id));
    } catch (err) {
      alert(err.response?.data?.error || 'Action failed.');
    } finally {
      setProcessing(null);
    }
  };

  return (
    <AppLayout>
      <div style={{ padding: '24px 0' }}>
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ 
            margin: 0, fontSize: '1.8rem', fontWeight: 800, color: '#f1f5f9',
            display: 'flex', alignItems: 'center', gap: '12px'
          }}>
            <div style={{ padding: '6px', borderRadius: '8px', background: '#38bdf811', display: 'flex' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
            </div>
            AI Test Unlock Requests
          </h1>
          <p style={{ color: '#64748b', marginTop: '6px', fontSize: '0.9rem' }}>
            Approve or deny early access requests for AI Practice Tests from your mentees by validating their reasons.
          </p>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#64748b' }}>
            Loading requests...
          </div>
        ) : error ? (
          <div style={{ background: '#ef444411', border: '1px solid #ef444433', padding: '20px', borderRadius: '12px', color: '#ef4444' }}>
            {error}
          </div>
        ) : requests.length === 0 ? (
          <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px', padding: '80px', textAlign: 'center' }}>
            <div style={{ 
              width: '64px', height: '64px', borderRadius: '50%', background: '#38bdf811', 
              display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px',
              color: '#38bdf8'
            }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
              </svg>
            </div>
            <h3 style={{ color: '#f1f5f9', margin: 0 }}>All caught up!</h3>
            <p style={{ color: '#475569', marginTop: '8px' }}>No pending unlock requests at the moment.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '24px' }}>
            {requests.map((r) => (
              <div key={r.id} style={{
                background: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px',
                padding: '24px', position: 'relative', overflow: 'hidden',
                transition: 'transform 0.2s, box-shadow 0.2s',
                display: 'flex', flexDirection: 'column'
              }}>
                <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: '#38bdf8' }} />
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <div>
                    <div style={{ color: '#38bdf8', fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>
                      Student Request
                    </div>
                    <h3 style={{ margin: 0, color: '#f1f5f9', fontWeight: 700, fontSize: '1.1rem' }}>{r.student_name}</h3>
                    <div style={{ color: '#475569', fontSize: '0.75rem', marginTop: '2px' }}>{r.student_code}</div>
                  </div>
                  <div style={{ textAlign: 'right', color: '#64748b', fontSize: '0.7rem' }}>
                    Requested {new Date(r.unlock_request_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>

                <div style={{ background: '#1e293b55', borderRadius: '12px', padding: '16px', marginBottom: '16px' }}>
                  <div style={{ fontWeight: 600, color: '#cbd5e1', fontSize: '0.88rem' }}>{r.course_name}</div>
                  <div style={{ color: '#64748b', fontSize: '0.75rem', marginTop: '4px' }}>
                    Unit {r.unit_number} · Descriptive Practice
                  </div>
                  <div style={{ 
                    marginTop: '12px', padding: '8px 12px', background: '#38bdf80a', border: '1px solid #38bdf81a', 
                    borderRadius: '8px', color: '#38bdf8', fontSize: '0.75rem', fontWeight: 600,
                    display: 'flex', alignItems: 'center', gap: '8px'
                  }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                    </svg>
                    Scheduled: {new Date(r.scheduled_at).toLocaleDateString()}
                  </div>
                </div>

                <div style={{ marginBottom: '24px' }}>
                  <div style={{ color: '#94a3b8', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.05em' }}>
                    Reason Provided:
                  </div>
                  <div style={{ 
                    background: '#0a0f1e', border: '1px solid #1e293b', borderRadius: '10px', 
                    padding: '12px', color: '#e2e8f0', fontSize: '0.85rem', lineHeight: 1.5,
                    fontStyle: 'italic', position: 'relative'
                  }}>
                    "{r.unlock_reason || 'No reason provided.'}"
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: 'auto' }}>
                  <button
                    disabled={processing === r.id}
                    onClick={() => handleAction(r.id, 'granted')}
                    style={{
                      flex: 1, padding: '12px', borderRadius: '10px', border: 'none',
                      background: '#22c55e', color: '#0f172a', fontWeight: 800,
                      cursor: 'pointer', transition: '0.2s', opacity: processing === r.id ? 0.3 : 1,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                    Approve Early Access
                  </button>
                  <button
                    disabled={processing === r.id}
                    onClick={() => handleAction(r.id, 'denied')}
                    style={{
                      width: '48px', height: '44px', borderRadius: '10px', border: '1px solid #ef444444',
                      background: 'transparent', color: '#ef4444', fontWeight: 700,
                      cursor: 'pointer', transition: '0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default TestRequests;
