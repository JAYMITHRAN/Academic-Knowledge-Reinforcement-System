// src/pages/student/LearnTracker.jsx
import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getStudentPerformance,
  getScheduledTests,
  schedulePracticeTest,
  requestEarlyUnlock
} from '../../services/api';
import AppLayout from '../../components/Layout/AppLayout';
import EarlyRequestModal from '../../components/student/EarlyRequestModal';

/* ─── helpers ───────────────────────────────────────────────────── */
const LEVEL_COLOR = { weak: '#ef4444', needs_improvement: '#f59e0b', strong: '#22c55e' };
const LEVEL_LABEL = { weak: 'Weak', needs_improvement: 'Needs Improvement', strong: 'Strong' };

// Given a future Date, returns e.g. "23h 14m 05s" or "Ready!"
const useCountdown = (targetDate, isGranted) => {
  const calc = () => {
    if (isGranted) return null;
    const diff = new Date(targetDate) - Date.now();
    if (diff <= 0) return null; // ready
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    return `${String(h).padStart(2, '0')}h ${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`;
  };
  const [display, setDisplay] = useState(calc);
  useEffect(() => {
    if (!targetDate || isGranted) {
      setDisplay(null);
      return;
    }
    const t = setInterval(() => setDisplay(calc()), 1000);
    return () => clearInterval(t);
  }, [targetDate, isGranted]);
  return display; // null = ready to take
};

/* ─── Subject card ──────────────────────────────────────────────── */
const SubjectCard = ({ mark, scheduledTest, onSchedule, scheduling, onStart, onRequestUnlock }) => {
  const color    = LEVEL_COLOR[mark.performance_level] || '#64748b';
  const label    = LEVEL_LABEL[mark.performance_level] || mark.performance_level;
  
  const isGranted = scheduledTest?.unlock_status === 'granted';
  const countdown = useCountdown(scheduledTest?.scheduled_at, isGranted);
  
  const isReady   = scheduledTest && !countdown;   // time has passed OR granted
  const isPending = scheduledTest && !!countdown;  // still counting down AND NOT granted
  const status    = scheduledTest?.unlock_status || 'none';

  return (
    <div style={{
      background: '#0f172a',
      border: `1px solid ${color}33`,
      borderLeft: `4px solid ${color}`,
      borderRadius: '12px',
      padding: '20px 24px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: '16px',
      flexWrap: 'wrap',
      transition: 'box-shadow 0.2s',
    }}>
      {/* Info */}
      <div style={{ flex: 1, minWidth: '200px' }}>
        <div style={{ fontWeight: 700, color: '#f1f5f9', fontSize: '1rem', marginBottom: '4px' }}>
          {mark.course_name}
        </div>
        <div style={{ color: '#64748b', fontSize: '0.8rem', marginBottom: '8px' }}>
          Unit {mark.unit_number}{mark.unit_title ? ` · ${mark.unit_title}` : ''}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <span style={{
            padding: '3px 10px', borderRadius: '99px', fontSize: '0.68rem', fontWeight: 700,
            background: `${color}18`, border: `1px solid ${color}44`, color, textTransform: 'uppercase'
          }}>
            {label}
          </span>
          <span style={{ color: '#475569', fontSize: '0.75rem' }}>
            {parseFloat(mark.marks)}/{parseFloat(mark.max_marks)} marks ({parseFloat(mark.percentage || 0).toFixed(0)}%)
          </span>
        </div>
      </div>

      {/* Right side: action */}
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        {!scheduledTest && (
          <button
            disabled={scheduling}
            onClick={onSchedule}
            style={{
              padding: '12px 24px', borderRadius: '10px', border: 'none',
              background: scheduling ? '#1e293b' : color,
              color: scheduling ? '#475569' : '#0f172a',
              fontWeight: 800, fontSize: '0.85rem',
              cursor: scheduling ? 'wait' : 'pointer',
              transition: 'all 0.2s',
              minWidth: '150px',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="5 3 19 12 5 21 5 3"></polygon>
            </svg>
            {scheduling ? 'Scheduling…' : 'Start Learning'}
          </button>
        )}

        {isPending && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ color: '#f59e0b', fontFamily: 'monospace', fontWeight: 800, fontSize: '1.2rem', lineHeight: 1 }}>
                {countdown}
              </div>
              <div style={{ color: '#475569', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: '4px' }}>
                Test unlocks in
              </div>
            </div>

            {status === 'pending' && (
              <div style={{ 
                background: '#f59e0b12', color: '#f59e0b', padding: '10px 16px', borderRadius: '10px', 
                border: '1px solid #f59e0b33', fontSize: '0.8rem', fontWeight: 600,
                display: 'flex', alignItems: 'center', gap: '8px'
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
                Waiting for mentor...
              </div>
            )}

            {status === 'denied' && (
              <div style={{ 
                color: '#ef4444', fontSize: '0.75rem', fontWeight: 600,
                background: '#ef444411', padding: '6px 12px', borderRadius: '6px', border: '1px solid #ef444433',
                marginBottom: '8px'
              }}>
                ✕ Unlock request denied
              </div>
            )}

            {(status === 'none' || status === 'denied') && (
              <button
                onClick={onRequestUnlock}
                style={{
                  background: 'rgba(56, 189, 248, 0.1)', border: '1px solid rgba(56, 189, 248, 0.3)',
                  color: '#38bdf8', padding: '8px 16px', borderRadius: '8px', fontSize: '0.75rem',
                  fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
                  transition: 'all 0.2s'
                }}
                onMouseOver={e => e.currentTarget.style.background = 'rgba(56, 189, 248, 0.2)'}
                onMouseOut={e => e.currentTarget.style.background = 'rgba(56, 189, 248, 0.1)'}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="10" rx="2"></rect>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
                Request Early Access
              </button>
            )}
          </div>
        )}

        {isReady && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
            {status === 'granted' && (
              <div style={{ color: '#22c55e', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                ✓ Request Approved
              </div>
            )}
            <button
              onClick={onStart}
              style={{
                padding: '12px 24px', borderRadius: '10px', border: 'none',
                background: '#22c55e', color: '#0f172a',
                fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer',
                animation: 'glow 1.5s ease-in-out infinite alternate',
                minWidth: '150px',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
              Take Test Now
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

/* ─── Main Page ─────────────────────────────────────────────────── */
const LearnTracker = () => {
  const navigate = useNavigate();
  const [loading, setLoading]     = useState(true);
  const [data,    setData]        = useState(null);
  const [tests,   setTests]       = useState([]);
  const [scheduling, setScheduling] = useState(null);
  const [toast,   setToast]       = useState('');
  const [error,   setError]       = useState('');

  // Unlock Request Modal State
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [unlockTargetId,  setUnlockTargetId]  = useState(null);
  const [unlockReason,    setUnlockReason]    = useState('');
  const [requesting,      setRequesting]      = useState(false);

  const showToast = (msg, dur = 4000) => {
    setToast(msg);
    setTimeout(() => setToast(''), dur);
  };

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      const [perf, sched] = await Promise.all([
        getStudentPerformance(),
        getScheduledTests(),
      ]);
      setData(perf.data);
      setTests(sched.data.tests);
    } catch {
      setError('Failed to load. Please refresh.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleStartLearning = async (courseId, unitNumber) => {
    const key = `${courseId}-${unitNumber}`;
    try {
      setScheduling(key);
      const scheduledAt = new Date(Date.now() + 24 * 60 * 60 * 1000)
        .toISOString().slice(0, 19).replace('T', ' ');
      await schedulePracticeTest({ courseId, unitNumber, scheduledAt });
      await fetchAll();
      showToast('✓ Learning started! Your test unlocks in exactly 24 hours.');
    } catch {
      showToast('⚠ Failed to schedule. Please try again.');
    } finally {
      setScheduling(null);
    }
  };

  const handleRequestUnlock = async () => {
    if (!unlockReason.trim()) return alert('Please provide a reason.');
    try {
      setRequesting(true);
      await requestEarlyUnlock(unlockTargetId, { reason: unlockReason });
      await fetchAll();
      showToast('Unlock request sent! Faculty will review your reason.');
      setShowUnlockModal(false);
      setUnlockReason('');
    } catch (err) {
      showToast(err.response?.data?.error || 'Request failed.');
    } finally {
      setRequesting(false);
    }
  };

  if (loading) return (
    <AppLayout>
      <div style={{ color: '#64748b', textAlign: 'center', padding: '80px 0' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid #1e293b', borderTop: '3px solid #38bdf8', borderRadius: '50%', margin: '0 auto 16px', animation: 'spin 1s linear infinite' }} />
        Loading your tracker…
      </div>
    </AppLayout>
  );

  if (error) return <AppLayout><p style={{ color: '#ef4444' }}>{error}</p></AppLayout>;

  // Filter & Map
  const seen = new Set();
  const weakSubjects = [...(data.weak || []), ...(data.needs_improvement || [])].filter(m => {
    const k = `${m.course_id}-${m.unit_number}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });

  const testMap = {};
  tests.forEach(t => {
    const k = `${t.course_id}-${t.unit_number}`;
    if (!testMap[k] || new Date(t.created_at) > new Date(testMap[k].created_at)) {
      testMap[k] = t;
    }
  });

  const readyCount   = weakSubjects.filter(m => {
    const t = testMap[`${m.course_id}-${m.unit_number}`];
    const isGranted = t?.unlock_status === 'granted';
    return t && t.status === 'scheduled' && (isGranted || new Date(t.scheduled_at) <= new Date());
  }).length;

  const pendingCount = weakSubjects.filter(m => {
    const t = testMap[`${m.course_id}-${m.unit_number}`];
    const isGranted = t?.unlock_status === 'granted';
    return t && t.status === 'scheduled' && !isGranted && new Date(t.scheduled_at) > new Date();
  }).length;

  return (
    <AppLayout>
      <style>{`
        @keyframes glow { from { box-shadow: 0 0 4px #22c55e55; } to { box-shadow: 0 0 16px #22c55e99; } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      {toast && (
        <div style={{
          position: 'fixed', top: '24px', right: '24px', zIndex: 10000,
          background: '#0f172a', border: '1px solid #334155', borderRadius: '12px',
          padding: '16px 24px', color: '#f1f5f9', fontSize: '0.9rem', fontWeight: 600,
          boxShadow: '0 12px 48px #000', animation: 'fadeIn 0.3s ease',
          display: 'flex', alignItems: 'center', gap: '12px'
        }}>
          <span>{toast}</span>
        </div>
      )}

      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ 
          margin: 0, fontSize: '2rem', fontWeight: 800, color: '#f1f5f9',
          display: 'flex', alignItems: 'center', gap: '12px'
        }}> 
          <div style={{ padding: '6px', borderRadius: '8px', background: '#38bdf811', display: 'flex' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2v10l4.5 4.5"></path>
              <circle cx="12" cy="12" r="10"></circle>
            </svg>
          </div>
          Learn Tracker 
        </h1>
        <p style={{ color: '#64748b', marginTop: '8px', fontSize: '0.95rem', maxWidth: '700px', lineHeight: 1.6 }}>
          Focused study sessions that unlock practice opportunities. 
          When you click <strong style={{ color: '#e2e8f0' }}>Start Learning</strong>, 
          you commit to 24 hours of preparation before the AI Practice Test unlocks.
        </p>
      </div>

      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', marginBottom: '32px' }}>
        {[
          { label: 'Weak Subjects',  value: weakSubjects.length,   color: '#ef4444' },
          { label: 'Study Sessions', value: pendingCount,           color: '#f59e0b' },
          { label: 'Unlocked Tests', value: readyCount,             color: '#22c55e' },
        ].map(s => (
          <div key={s.label} style={{
            flex: 1, minWidth: '140px', background: '#0f172a', border: `1px solid ${s.color}22`,
            borderBottom: `3px solid ${s.color}`, borderRadius: '14px', padding: '24px',
          }}>
            <div style={{ fontSize: '2.5rem', fontWeight: 900, color: s.color, lineHeight: 1 }}> {s.value} </div>
            <div style={{ color: '#475569', fontSize: '0.7rem', fontWeight: 800, marginTop: '10px', textTransform: 'uppercase', letterSpacing: '0.1em' }}> {s.label} </div>
          </div>
        ))}
      </div>

      {/* Steps UI */}
      <div style={{ background: 'linear-gradient(90deg, #0f172a, #161e31)', border: '1px solid #1e293b', borderRadius: '16px', padding: '24px', marginBottom: '32px', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px' }}>
        {[
          { step: '1', title: 'Commit', sub: 'Start a session' },
          { step: '2', title: 'Prepare', sub: 'Study for 24h' },
          { step: '3', title: 'Validate', sub: 'Take AI Test' },
          { step: '4', title: 'Upgrade', sub: 'Level up' },
        ].map((s, i) => (
          <div key={i} style={{ flex: 1, minWidth: '120px', textAlign: 'center' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#38bdf811', border: '1px solid #38bdf833', color: '#38bdf8', margin: '0 auto 10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 800 }}> {s.step} </div>
            <div style={{ color: '#f1f5f9', fontSize: '0.85rem', fontWeight: 700 }}>{s.title}</div>
            <div style={{ color: '#475569', fontSize: '0.7rem', marginTop: '2px' }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {weakSubjects.length === 0 ? (
        <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px', padding: '60px', textAlign: 'center' }}>
          <div style={{ 
            width: '64px', height: '64px', borderRadius: '50%', background: '#22c55e11', 
            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px',
            color: '#22c55e'
          }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
          </div>
          <div style={{ color: '#f1f5f9', fontSize: '1.2rem', fontWeight: 700 }}>All subjects are performed well!</div>
          <div style={{ color: '#475569', fontSize: '0.9rem', marginTop: '8px' }}>No intervention required at this time. Keep up the great work.</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {weakSubjects.map(m => {
            const key  = `${m.course_id}-${m.unit_number}`;
            const test = testMap[key];
            const pendingTest = test?.status === 'scheduled' ? test : null;
            return (
              <SubjectCard
                key={key}
                mark={m}
                scheduledTest={pendingTest}
                scheduling={scheduling === key}
                onSchedule={() => handleStartLearning(m.course_id, m.unit_number)}
                onStart={() => navigate(`/student/practice/${test.id}`)}
                onRequestUnlock={() => {
                  setUnlockTargetId(test.id);
                  setShowUnlockModal(true);
                  setUnlockReason('');
                }}
              />
            );
          })}
        </div>
      )}

      {/* History */}
      {tests.filter(t => t.status === 'completed').length > 0 && (
        <div style={{ marginTop: '48px' }}>
          <h3 style={{ color: '#475569', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '20px' }}> Practice History </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {tests.filter(t => t.status === 'completed').map(t => {
              const pct = t.max_score > 0 ? ((t.score / t.max_score) * 100).toFixed(0) : 0;
              const color = pct >= 70 ? '#22c55e' : pct >= 40 ? '#f59e0b' : '#ef4444';
              return (
                <div key={t.id} style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 700, color: '#e2e8f0', fontSize: '0.9rem' }}> {t.course_name} <span style={{ opacity: 0.3, margin: '0 8px' }}>·</span> Unit {t.unit_number} </div>
                    <div style={{ color: '#475569', fontSize: '0.75rem', marginTop: '6px' }}> {new Date(t.completed_at).toLocaleDateString()} at {new Date(t.completed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      {t.is_malpractice && <span style={{ marginLeft: '10px', color: '#ef4444', fontWeight: 800, border: '1px solid #ef444433', padding: '1px 8px', borderRadius: '4px', fontSize: '0.65rem', background: '#ef444411' }}>MALPRACTICE</span>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ color: t.is_malpractice ? '#ef4444' : color, fontWeight: 800, fontSize: '1.1rem' }}> {t.is_malpractice ? '0' : t.score} <span style={{ fontSize: '0.8rem', opacity: 0.4 }}>/ {t.max_score}</span> </div>
                      {!t.is_malpractice && <div style={{ color: color, fontSize: '0.65rem', fontWeight: 700, marginTop: '2px' }}>{pct}% ACCURACY</div>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      <EarlyRequestModal
        isOpen={showUnlockModal}
        testId={unlockTargetId}
        onClose={() => setShowUnlockModal(false)}
        onSuccess={fetchAll}
      />
    </AppLayout>
  );
};

export default LearnTracker;
