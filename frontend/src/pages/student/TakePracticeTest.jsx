// src/pages/student/TakePracticeTest.jsx
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getPracticeTestDetail, submitPracticeTest } from '../../services/api';
import AppLayout from '../../components/Layout/AppLayout';

/* ─── tiny helpers ─────────────────────────────────────────────── */
const fmtTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

const ScoreBadge = ({ score, max = 10, isMalpractice = false }) => {
  if (isMalpractice) {
    return (
      <span style={{
        display: 'inline-block', padding: '2px 10px', borderRadius: '99px',
        background: '#ef444418', border: '1px solid #ef444455',
        color: '#ef4444', fontWeight: 700, fontSize: '0.8rem',
      }}>
        MALPRACTICE (0/{max})
      </span>
    );
  }
  const pct = (score / max) * 100;
  const color = pct >= 70 ? '#22c55e' : pct >= 40 ? '#f59e0b' : '#ef4444';
  return (
    <span style={{
      display: 'inline-block', padding: '2px 10px', borderRadius: '99px',
      background: `${color}18`, border: `1px solid ${color}55`,
      color, fontWeight: 700, fontSize: '0.8rem',
    }}>
      {score}/{max}
    </span>
  );
};

/* ─── main component ────────────────────────────────────────────── */
const TakePracticeTest = () => {
  const { id }        = useParams();
  const navigate      = useNavigate();
  const timerRef      = useRef(null);
  
  // Ref for the persistent wrapper that includes overlay + test
  const contentWrapperRef = useRef(null);

  const [loading,     setLoading]     = useState(true);
  const [test,        setTest]        = useState(null);
  const [error,       setError]       = useState('');

  const [currentIdx,  setCurrentIdx]  = useState(0);
  const [answers,     setAnswers]     = useState({});
  const answersRef    = useRef({});
  const [timeLeft,    setTimeLeft]    = useState(45 * 60);
  
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [started,      setStarted]      = useState(false);

  // submission states
  const [submitting,  setSubmitting]  = useState(false);
  const [result,      setResult]      = useState(null);

  /* ── keep ref in sync ──────────────────────────────────────────── */
  useEffect(() => { answersRef.current = answers; }, [answers]);

  /* ── load test ─────────────────────────────────────────────────── */
  useEffect(() => {
    getPracticeTestDetail(id)
      .then(r => {
        if (r.data.test.status === 'completed') {
          setError('This test has already been submitted.');
        } else {
          setTest(r.data.test);
        }
        setLoading(false);
      })
      .catch(() => { setError('Failed to load test.'); setLoading(false); });
  }, [id]);

  /* ── submission logic ───────────────────────────────────────────── */
  const handleSubmit = useCallback(async (isMalpractice = false) => {
    clearInterval(timerRef.current);
    if (submitting || result) return;
    
    // Exit fullscreen if still in it
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }

    setSubmitting(true);
    try {
      const res = await submitPracticeTest(id, { 
        answers: answersRef.current,
        malpractice: isMalpractice 
      });
      setResult(res.data);
    } catch (err) {
      alert(err.response?.data?.error || 'Submission failed. Please try again.');
      setSubmitting(false);
    }
  }, [id, submitting, result]);

  /* ── Countdown timer ───────────────────────────────────────────── */
  useEffect(() => {
    if (!started || !test || loading || result) return;
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleSubmit(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [started, test, loading, result, handleSubmit]);

  /* ── Fullscreen & Visibility detection ────────────────────────── */
  const enterFullscreen = () => {
    const el = document.documentElement; // Request fullscreen on the whole page to be safe
    if (el.requestFullscreen) {
      el.requestFullscreen();
    } else if (el.webkitRequestFullscreen) {
      el.webkitRequestFullscreen();
    } else if (el.msRequestFullscreen) {
      el.msRequestFullscreen();
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      const isFs = !!(document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement);
      setIsFullscreen(isFs);
      
      if (started && !isFs && !result && !submitting) {
        handleSubmit(true);
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && started && !result && !submitting) {
        handleSubmit(true);
      }
    };

    document.addEventListener('fullscreenchange', handleFsChange);
    document.addEventListener('webkitfullscreenchange', handleFsChange);
    document.addEventListener('mozfullscreenchange', handleFsChange);
    document.addEventListener('MSFullscreenChange', handleFsChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFsChange);
      document.removeEventListener('webkitfullscreenchange', handleFsChange);
      document.removeEventListener('mozfullscreenchange', handleFsChange);
      document.removeEventListener('MSFullscreenChange', handleFsChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [started, result, submitting, handleSubmit]);

  /* ── answer setter ─────────────────────────────────────────────── */
  const setAnswer = (qId, text) => setAnswers(prev => ({ ...prev, [qId]: text }));

  /* ─── Render Logic ─────────────────────────────────────────────── */
  if (loading) return (
    <AppLayout>
      <div style={{ textAlign: 'center', padding: '80px 0' }}>
        <p style={{ color: '#64748b' }}>Loading your test…</p>
      </div>
    </AppLayout>
  );

  if (error) return (
    <AppLayout>
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <p style={{ color: '#ef4444' }}>{error}</p>
        <button onClick={() => navigate('/student/practice')}
          style={{ marginTop: '12px', color: '#38bdf8', background: 'none', border: 'none', cursor: 'pointer' }}>
          ← Back to Practice
        </button>
      </div>
    </AppLayout>
  );

  return (
    <AppLayout hideSidebar={started && !result} hideHeader={started && !result}>
      <div ref={contentWrapperRef} style={{ background: '#020617', minHeight: '100vh', color: '#f1f5f9' }}>
        
        {/* Violation Warning during test */}
        {started && !result && !isFullscreen && (
          <div style={{ 
            position: 'fixed', top: 0, left: 0, right: 0, zIndex: 10000, 
            background: '#ef4444', color: '#fff', padding: '12px', 
            textAlign: 'center', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' 
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
              <line x1="12" y1="9" x2="12" y2="13"></line>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
            RE-ENTER FULLSCREEN IMMEDIATELY OR TEST WILL VOID
          </div>
        )}

        {/* 1. Start overlay (shown when NOT started and NOT resulted) */}
        {!started && !result && (
          <div style={{ maxWidth: '600px', margin: '0 auto', padding: '60px 20px', textAlign: 'center' }}>
            <div style={{ 
              width: '80px', height: '80px', borderRadius: '50%', background: '#38bdf811',
              display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px',
              color: '#38bdf8'
            }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                <polyline points="9 11 12 14 15 11"></polyline>
              </svg>
            </div>
            <h2 style={{ color: '#f1f5f9', fontWeight: 800, marginBottom: '16px', fontSize: '1.8rem' }}>Enforced Test Environment</h2>
            <p style={{ color: '#94a3b8', lineHeight: 1.6, marginBottom: '32px', fontSize: '1rem' }}>
              This practice test requires <strong>Full Screen Mode</strong> to ensure a focused environment. 
              <br/><br/>
              <span style={{ color: '#ef4444', fontWeight: 600 }}>WARNING:</span> Exiting full-screen or switching tabs after the test starts will result in <strong>immediate automatic submission</strong> and a <strong>Malpractice Mark (Score: 0)</strong>.
            </p>
            <button 
              onClick={() => {
                enterFullscreen();
                setStarted(true);
              }}
              style={{
                padding: '16px 48px', borderRadius: '12px', border: 'none',
                background: '#38bdf8', color: '#0f172a', fontWeight: 800,
                fontSize: '1.1rem', cursor: 'pointer', boxShadow: '0 4px 20px rgba(56, 189, 248, 0.4)',
                transition: 'transform 0.2s'
              }}
              onMouseEnter={e => e.target.style.transform = 'scale(1.05)'}
              onMouseLeave={e => e.target.style.transform = 'scale(1)'}
            >
              I Understand, Start Test
            </button>
          </div>
        )}

        {/* 2. AI Evaluating screen */}
        {submitting && !result && (
          <div style={{ maxWidth: '560px', margin: '0 auto', padding: '80px 20px', textAlign: 'center' }}>
            <div style={{ width: '80px', height: '80px', border: '3px solid #1e293b', borderTop: '3px solid #38bdf8', borderRadius: '50%', margin: '0 auto 28px', animation: 'spin 1s linear infinite' }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            <h2 style={{ color: '#f1f5f9', fontWeight: 700, marginBottom: '10px' }}>AI is Evaluating Your Answers</h2>
            <p style={{ color: '#64748b' }}>Checking for depth, accuracy, and real-world applicability…</p>
          </div>
        )}

        {/* 3. Results screen */}
        {result && (
          <div style={{ maxWidth: '820px', margin: '0 auto', padding: '40px 20px' }}>
            {result.is_malpractice && (
              <div style={{ background: '#ef444418', border: '1px solid #ef4444', borderRadius: '12px', padding: '16px', marginBottom: '24px', color: '#ef4444', fontWeight: 700, textAlign: 'center' }}>
                ⚠️ MALPRACTICE DETECTED: Test submitted automatically due to fullscreen exit.
              </div>
            )}
            
            <div style={{ background: `linear-gradient(135deg, #0f172a, #1e293b)`, border: `1px solid ${result.is_malpractice ? '#ef444444' : '#22c55e44'}`, borderTop: `4px solid ${result.is_malpractice ? '#ef4444' : '#22c55e'}`, borderRadius: '16px', padding: '32px', marginBottom: '28px', textAlign: 'center' }}>
              <div style={{ fontSize: '3.5rem', fontWeight: 800, color: result.is_malpractice ? '#ef4444' : '#22c55e' }}>
                {result.totalScore} <span style={{ fontSize: '1.5rem', color: '#64748b' }}>/ {result.maxScore}</span>
              </div>
              <div style={{ color: result.is_malpractice ? '#ef4444' : '#22c55e', fontWeight: 600, marginTop: '10px', fontSize: '1.2rem' }}>
                {result.is_malpractice ? 'VOID — MALPRACTICE' : `${result.scorePercent}% — Great Effort!`}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '32px' }}>
              {(typeof test.questions === 'string' ? JSON.parse(test.questions) : test.questions).map((q, i) => {
                const fb = result.perQuestion?.find(p => p.id === q.id) || {};
                return (
                  <div key={i} style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', padding: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '14px' }}>
                      <span style={{ color: '#475569', fontSize: '0.75rem', fontWeight: 700 }}>QUESTION {i + 1}</span>
                      <ScoreBadge score={fb.score ?? 0} isMalpractice={result.is_malpractice} />
                    </div>
                    <p style={{ color: '#f1f5f9', fontWeight: 500, fontSize: '1rem', lineHeight: 1.6, marginBottom: '20px' }}>{q.question}</p>
                    <div style={{ background: '#0a0f1e', padding: '16px', borderRadius: '8px', borderLeft: '4px solid #334155' }}>
                      <div style={{ fontSize: '0.7rem', color: '#475569', textTransform: 'uppercase', marginBottom: '8px' }}>Your Answer</div>
                      <p style={{ color: '#cbd5e1', fontSize: '0.9rem', margin: 0, lineHeight: 1.6 }}>{answers[q.id] || <em style={{ opacity: 0.4 }}>No response provided.</em>}</p>
                    </div>
                    {fb.feedback && (
                      <div style={{ marginTop: '16px', background: '#162032', padding: '16px', borderRadius: '8px', borderLeft: '4px solid #38bdf855', color: '#cbd5e1', fontSize: '0.9rem', lineHeight: 1.6 }}>
                        <div style={{ fontSize: '0.7rem', color: '#38bdf8', textTransform: 'uppercase', marginBottom: '8px' }}>AI Feedback</div>
                        {fb.feedback}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            
            <button onClick={() => navigate('/student/practice')} style={{ width: '100%', padding: '14px', borderRadius: '12px', border: 'none', background: '#38bdf8', color: '#0f172a', fontWeight: 800, cursor: 'pointer', fontSize: '1rem' }}>
              ← Return to Dashboard
            </button>
          </div>
        )}

        {/* 4. Test Interface */}
        {started && !result && !submitting && (
          <div style={{ maxWidth: '820px', margin: '0 auto', padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', background: '#0f172a', padding: '16px 24px', borderRadius: '12px', border: '1px solid #1e293b' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.2rem', color: '#f1f5f9' }}>{test.course_name}</h2>
                <p style={{ margin: 0, color: '#64748b', fontSize: '0.8rem', marginTop: '4px' }}>Unit {test.unit_number} · Scenario-Based Assessment</p>
              </div>
              <div style={{ padding: '10px 20px', borderRadius: '10px', background: timeLeft < 120 ? '#ef444422' : '#38bdf815', color: timeLeft < 120 ? '#ef4444' : '#38bdf8', fontWeight: 800, fontFamily: 'monospace', fontSize: '1.3rem', border: `1px solid ${timeLeft < 120 ? '#ef444444' : '#38bdf833'}` }}>
                {fmtTime(timeLeft)}
              </div>
            </div>

            {/* Q-Navigator */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '24px' }}>
              {(typeof test.questions === 'string' ? JSON.parse(test.questions) : test.questions).map((q, i) => (
                <button 
                  key={i} 
                  onClick={() => setCurrentIdx(i)} 
                  style={{ 
                    width: '38px', height: '38px', borderRadius: '8px', 
                    border: i === currentIdx ? '2px solid #38bdf8' : '1px solid #1e293b', 
                    background: i === currentIdx ? '#38bdf822' : (answers[q.id]?.trim() ? '#22c55e22' : 'transparent'), 
                    color: i === currentIdx ? '#38bdf8' : (answers[q.id]?.trim() ? '#22c55e' : '#475569'), 
                    fontWeight: 800, cursor: 'pointer', transition: 'all 0.2s'
                  }}
                >
                  {i + 1}
                </button>
              ))}
            </div>

            <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '20px', padding: '32px', marginBottom: '24px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: '#38bdf8' }} />
              <div style={{ color: '#38bdf8', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '16px' }}>Current Challenge</div>
              <p style={{ fontSize: '1.15rem', lineHeight: 1.7, marginBottom: '24px', color: '#f1f5f9' }}>
                {(typeof test.questions === 'string' ? JSON.parse(test.questions) : test.questions)[currentIdx].question}
              </p>
              <textarea
                value={answers[(typeof test.questions === 'string' ? JSON.parse(test.questions) : test.questions)[currentIdx].id] || ''}
                onChange={e => setAnswer((typeof test.questions === 'string' ? JSON.parse(test.questions) : test.questions)[currentIdx].id, e.target.value)}
                placeholder="Formulate your detailed response here…"
                rows={10}
                style={{ width: '100%', boxSizing: 'border-box', background: '#020617', border: '1px solid #1e293b', borderRadius: '12px', padding: '20px', color: '#e2e8f0', fontSize: '1rem', lineHeight: 1.6, outline: 'none', resize: 'none', transition: 'border-color 0.2s' }}
                onFocus={e => e.target.style.borderColor = '#38bdf8'}
                onBlur={e => e.target.style.borderColor = '#1e293b'}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <button disabled={currentIdx === 0} onClick={() => setCurrentIdx(currentIdx - 1)} style={{ padding: '12px 28px', borderRadius: '10px', background: 'transparent', border: '1px solid #1e293b', color: '#94a3b8', cursor: 'pointer', fontWeight: 600, opacity: currentIdx === 0 ? 0.3 : 1 }}>← Back</button>
              <div style={{ display: 'flex', gap: '12px' }}>
                {currentIdx < (typeof test.questions === 'string' ? JSON.parse(test.questions) : test.questions).length - 1 ? (
                  <button onClick={() => setCurrentIdx(currentIdx + 1)} style={{ padding: '12px 32px', borderRadius: '10px', background: '#38bdf8', color: '#0f172a', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    Continue 
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="5" y1="12" x2="19" y2="12"></line>
                      <polyline points="12 5 19 12 12 19"></polyline>
                    </svg>
                  </button>
                ) : (
                  <button onClick={() => handleSubmit(false)} style={{ padding: '12px 40px', borderRadius: '10px', background: '#22c55e', color: '#0f172a', fontWeight: 800, cursor: 'pointer', boxShadow: '0 4px 14px rgba(34, 197, 94, 0.3)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                    Finalize & Submit
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

      </div>
    </AppLayout>
  );
};

export default TakePracticeTest;
