// src/pages/student/AIPractice.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getStudentPerformance, schedulePracticeTest, getScheduledTests } from '../../services/api';
import AppLayout from '../../components/Layout/AppLayout';

const LEVEL_COLOR = { weak: '#ef4444', needs_improvement: '#f59e0b' };
const LEVEL_LABEL = { weak: 'Weak', needs_improvement: 'Needs Improvement' };

const AIPractice = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [scheduledTests, setScheduledTests] = useState([]);
  const [scheduling, setScheduling] = useState(null); // holds card key being scheduled
  const [toast, setToast] = useState('');
  const [error, setError] = useState('');

  useEffect(() => { fetchData(); }, []);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [perf, scheduled] = await Promise.all([
        getStudentPerformance(),
        getScheduledTests(),
      ]);
      setData(perf.data);
      setScheduledTests(scheduled.data.tests);
    } catch {
      setError('Failed to load data. Please refresh.');
    } finally {
      setLoading(false);
    }
  };

  const handleSchedule = async (courseId, unitNumber, key) => {
    if (!courseId) {
      showToast('⚠ Course ID not found. Please refresh.');
      return;
    }
    try {
      setScheduling(key);
      // Schedule immediately (now) so student can start right away
      const scheduledAt = new Date().toISOString().slice(0, 19).replace('T', ' ');
      await schedulePracticeTest({ courseId, unitNumber, scheduledAt });
      await fetchData();
      showToast('✓ Test scheduled! Click "Start Test" to begin.');
    } catch {
      showToast('Failed to schedule test. Please try again.');
    } finally {
      setScheduling(null);
    }
  };

  /* ── Loading ── */
  if (loading) return (
    <AppLayout>
      <div style={{ textAlign: 'center', padding: '80px 0', color: '#64748b' }}>
        Loading your practice data…
      </div>
    </AppLayout>
  );

  if (error) return (
    <AppLayout>
      <p style={{ color: '#ef4444' }}>{error}</p>
    </AppLayout>
  );

  /* Deduplicate by course+unit — only show one card per unique unit */
  const seen = new Set();
  const practiceNeeded = [...(data.weak || []), ...(data.needs_improvement || [])].filter(m => {
    const key = `${m.course_id}-${m.unit_number}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const pending   = scheduledTests.filter(t => t.status === 'scheduled');
  const completed = scheduledTests.filter(t => t.status === 'completed');

  return (
    <AppLayout>
      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: '20px', right: '20px', zIndex: 9999,
          background: '#1e293b', border: '1px solid #334155', borderRadius: '10px',
          padding: '12px 20px', color: '#e2e8f0', fontSize: '0.875rem',
          boxShadow: '0 8px 32px #0008',
        }}>
          {toast}
        </div>
      )}

      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ 
          margin: 0, fontSize: '1.8rem', fontWeight: 800, color: '#f1f5f9',
          display: 'flex', alignItems: 'center', gap: '12px'
        }}>
          <div style={{ padding: '6px', borderRadius: '8px', background: '#38bdf811', display: 'flex' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
            </svg>
          </div>
          AI Exam Practice
        </h1>
        <p style={{ color: '#64748b', marginTop: '6px', fontSize: '0.88rem' }}>
          AI generates 10 real-world scenario questions for your weak units and grades
          your descriptive answers with per-question feedback.
        </p>
      </div>

      {/* Info banner */}
      <div style={{
        background: '#0f172a', border: '1px solid #38bdf833',
        borderLeft: '3px solid #38bdf8', borderRadius: '10px',
        padding: '14px 20px', marginBottom: '28px',
        display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap',
      }}>
        <div style={{ 
          width: '40px', height: '40px', borderRadius: '10px', background: '#38bdf811',
          display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#38bdf8', flexShrink: 0
        }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="10" rx="2"></rect>
            <circle cx="12" cy="5" r="2"></circle>
            <path d="M12 7v4"></path>
            <line x1="8" y1="16" x2="8" y2="16"></line>
            <line x1="16" y1="16" x2="16" y2="16"></line>
          </svg>
        </div>
        <div style={{ fontSize: '0.85rem', color: '#94a3b8', lineHeight: 1.6 }}>
          <strong style={{ color: '#38bdf8' }}>How it works: </strong>
          Schedule a test → AI crafts 10 questions based on your unit topic →
          You write descriptive answers (45 min) → AI evaluates each response and gives marks + feedback →
          Score ≥70% upgrades the subject from <span style={{ color: '#ef4444' }}>Weak</span> to{' '}
          <span style={{ color: '#f59e0b' }}>Needs Improvement</span>.
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>

        {/* Left: Recommended units */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', padding: '24px' }}>
            <h3 style={{ margin: '0 0 4px', color: '#e2e8f0', fontSize: '0.95rem', fontWeight: 600 }}>
              Recommended Units
            </h3>
            <p style={{ margin: '0 0 16px', color: '#475569', fontSize: '0.75rem' }}>
              Current performance areas that need your attention
            </p>

            {practiceNeeded.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 0', color: '#475569' }}>
                <div style={{ 
                  width: '48px', height: '48px', borderRadius: '50%', background: '#22c55e11',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
                  color: '#22c55e'
                }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                  </svg>
                </div>
                <p style={{ margin: 0, fontWeight: 600 }}>No critical weak areas found!</p>
                <p style={{ margin: '4px 0 0', fontSize: '0.75rem' }}>Keep up the great work.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {practiceNeeded.map((m) => {
                  const key   = `${m.course_id}-${m.unit_number}`;
                  const color = LEVEL_COLOR[m.performance_level] || '#64748b';
                  return (
                    <div key={key} style={{
                      background: '#1e293b', padding: '14px 16px', borderRadius: '10px',
                      borderLeft: `3px solid ${color}55`,
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between',
                        alignItems: 'flex-start', gap: '10px' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, color: '#f1f5f9', fontSize: '0.9rem' }}>
                            {m.course_name}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '3px' }}>
                            Unit {m.unit_number}{m.unit_title ? `: ${m.unit_title}` : ''}
                          </div>
                          <div style={{
                            display: 'inline-block', marginTop: '6px',
                            padding: '2px 8px', borderRadius: '99px', fontSize: '0.68rem',
                            fontWeight: 600, background: `${color}18`,
                            border: `1px solid ${color}44`, color,
                          }}>
                            {LEVEL_LABEL[m.performance_level]}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            <div style={{ marginTop: '20px', padding: '12px', background: '#38bdf80a', borderRadius: '8px', border: '1px dashed #38bdf844' }}>
              <p style={{ margin: 0, fontSize: '0.75rem', color: '#38bdf8', textAlign: 'center', lineHeight: 1.5 }}>
                💡 Start a study session for these units in the <strong>Learn Tracker</strong> tab 
                to schedule your AI Practice Test.
              </p>
            </div>
          </div>
        </div>

        {/* Right: Tests */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

          {/* Pending / Start */}
          <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', padding: '24px' }}>
            <h3 style={{ margin: '0 0 4px', color: '#e2e8f0', fontSize: '0.95rem', fontWeight: 600 }}>
              Ready to Start
            </h3>
            <p style={{ margin: '0 0 16px', color: '#475569', fontSize: '0.75rem' }}>
              Scheduled tests awaiting completion
            </p>
            {pending.length === 0 ? (
              <p style={{ color: '#475569', fontSize: '0.85rem' }}>
                No pending tests. Schedule one from the left panel.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {pending.map((t) => (
                  <div key={t.id} style={{
                    background: '#0a1628', border: '1px solid #38bdf833',
                    padding: '14px 16px', borderRadius: '10px',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  }}>
                    <div>
                      <div style={{ fontWeight: 600, color: '#f1f5f9', fontSize: '0.88rem' }}>
                        {t.course_name}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '3px' }}>
                        Unit {t.unit_number} · {new Date(t.scheduled_at).toLocaleString()}
                      </div>
                    </div>
                    <button
                      onClick={() => navigate(`/student/practice/${t.id}`)}
                      style={{
                        padding: '8px 14px', borderRadius: '7px',
                        border: '1px solid #38bdf8', background: 'transparent',
                        color: '#38bdf8', fontWeight: 700, fontSize: '0.75rem',
                        cursor: 'pointer',
                      }}
                    >
                      Start →
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Completed */}
          <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', padding: '24px' }}>
            <h3 style={{ margin: '0 0 16px', color: '#e2e8f0', fontSize: '0.95rem', fontWeight: 600 }}>
              Completed Tests
            </h3>
            {completed.length === 0 ? (
              <p style={{ color: '#475569', fontSize: '0.85rem' }}>No completed tests yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {completed.map((t) => {
                  const pct = t.max_score > 0 ? ((t.score / t.max_score) * 100).toFixed(0) : 0;
                  const color = pct >= 70 ? '#22c55e' : pct >= 40 ? '#f59e0b' : '#ef4444';
                  return (
                    <div key={t.id} style={{
                      background: '#1e293b', padding: '12px 16px', borderRadius: '8px',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      border: t.is_malpractice ? '1px solid #ef444455' : 'none',
                    }}>
                      <div>
                        <div style={{ fontWeight: 600, color: '#f1f5f9', fontSize: '0.85rem' }}>
                          {t.course_name} – Unit {t.unit_number}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                          {new Date(t.completed_at).toLocaleDateString()}
                          {t.is_malpractice && (
                            <span style={{ 
                              background: '#ef444422', color: '#ef4444', 
                              padding: '1px 6px', borderRadius: '4px', 
                              fontSize: '0.65rem', fontWeight: 700,
                              border: '1px solid #ef444444'
                            }}>MALPRACTICE</span>
                          )}
                        </div>
                      </div>
                      <div style={{
                        padding: '4px 12px', borderRadius: '99px',
                        background: t.is_malpractice ? '#ef444412' : `${color}18`, 
                        border: `1px solid ${t.is_malpractice ? '#ef444433' : `${color}44`}`,
                        color: t.is_malpractice ? '#ef4444' : color, 
                        fontWeight: 700, fontSize: '0.78rem',
                      }}>
                        {t.is_malpractice ? '0' : t.score}/{t.max_score} ({t.is_malpractice ? '0' : pct}%)
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      </div>
    </AppLayout>
  );
};

export default AIPractice;
