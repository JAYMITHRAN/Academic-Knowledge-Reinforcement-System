// src/pages/student/StudentPerformance.jsx
import React, { useEffect, useState } from 'react';
import {
  RadarChart, PolarGrid, PolarAngleAxis, Radar,
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import {
  getStudentPerformance,
  getScheduledTests,
  schedulePracticeTest
} from '../../services/api';
import AppLayout from '../../components/Layout/AppLayout';
import { useNavigate } from 'react-router-dom';
import EarlyRequestModal from '../../components/student/EarlyRequestModal';

const LEVEL_COLOR = {
  weak:             '#ef4444',
  needs_improvement:'#f59e0b',
  strong:           '#22c55e',
};
const LEVEL_LABEL = {
  weak:             'Weak',
  needs_improvement:'Needs Improvement',
  strong:           'Strong',
};

const StatCard = ({ label, value, color, icon }) => (
  <div style={{
    background: '#0f172a', border: `1px solid ${color}33`,
    borderRadius: '12px', padding: '20px 24px',
    flex: 1, minWidth: '140px',
  }}>
    <div style={{ color, marginBottom: '8px', display: 'flex' }}>{icon}</div>
    <div style={{ fontSize: '2rem', fontWeight: 700, color }}>{value}</div>
    <div style={{ color: '#64748b', fontSize: '0.78rem', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</div>
  </div>
);

const StudentPerformance = () => {
  const navigate  = useNavigate();
  const [data,    setData]    = useState(null);
  const [tests,   setTests]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');
  const [filter,  setFilter]  = useState('all');
  
  // Modal & Action State
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [unlockTargetId,  setUnlockTargetId]  = useState(null);
  const [scheduling,      setScheduling]      = useState(null);
  const [toast,           setToast]           = useState('');

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 4000);
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [perf, sched] = await Promise.all([
        getStudentPerformance(),
        getScheduledTests()
      ]);
      setData(perf.data);
      setTests(sched.data.tests);
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleStartLearning = async (courseId, unitNumber) => {
    const key = `${courseId}-${unitNumber}`;
    try {
      setScheduling(key);
      const scheduledAt = new Date(Date.now() + 24 * 60 * 60 * 1000)
        .toISOString().slice(0, 19).replace('T', ' ');
      await schedulePracticeTest({ courseId, unitNumber, scheduledAt });
      await fetchData();
      showToast('✓ Learning session started! Practice unlocks in 24 hours.');
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to start.');
    } finally {
      setScheduling(null);
    }
  };

  if (loading) return <AppLayout><p style={{ color: '#64748b' }}>Loading…</p></AppLayout>;
  if (error)   return <AppLayout><p style={{ color: '#ef4444' }}>{error}</p></AppLayout>;

  const { student, summary, marks, recommendations } = data;

  if (!marks || marks.length === 0) {
    return (
      <AppLayout>
        <h1 style={{ margin: '0 0 8px', fontSize: '1.8rem', fontWeight: 700, color: '#f1f5f9' }}>
          My Performance
        </h1>
        <div style={{
          background: '#0f172a', border: '1px solid #1e293b',
          borderRadius: '12px', padding: '48px', textAlign: 'center', marginTop: '24px'
        }}>
          <div style={{ 
            width: '64px', height: '64px', borderRadius: '50%', background: '#1e293b', 
            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
            color: '#475569'
          }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect>
              <rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect>
              <line x1="6" y1="6" x2="6.01" y2="6"></line>
              <line x1="6" y1="18" x2="6.01" y2="18"></line>
            </svg>
          </div>
          <p style={{ color: '#64748b', margin: 0 }}>No performance data available yet. Please wait for marks to be uploaded.</p>
        </div>
      </AppLayout>
    );
  }

  const radarData = marks.map(m => ({
    subject:  m.course_code,
    fullName: m.course_name,
    score:    parseFloat(m.percentage) || 0,
    fullMark: 100,
  }));

  const barData = marks.map(m => ({
    name:  m.course_code,
    marks: parseFloat(m.marks),
    fill:  LEVEL_COLOR[m.performance_level] || '#64748b',
  }));

  const filteredMarks = filter === 'all' 
    ? marks 
    : marks.filter(m => m.performance_level === filter);

  return (
    <AppLayout>
      <div style={{ marginBottom: '32px' }}>
        {toast && (
          <div style={{
            position: 'fixed', top: '24px', right: '24px', zIndex: 10000,
            background: '#0f172a', border: '1px solid #334155', borderRadius: '12px',
            padding: '16px 24px', color: '#f1f5f9', fontSize: '0.9rem', fontWeight: 600,
            boxShadow: '0 12px 48px #000', animation: 'fadeIn 0.3s ease',
            display: 'flex', alignItems: 'center', gap: '12px'
          }}>
            <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: none; } }`}</style>
            <span>{toast}</span>
          </div>
        )}
        <h1 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 700, color: '#f1f5f9' }}>
          My Performance
        </h1>
        <p style={{ color: '#64748b', marginTop: '6px', fontSize: '0.88rem' }}>
          Academic analysis and assessment breakdown for {student.name}
        </p>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '32px' }}>
        <StatCard label="Total Assessments"  value={summary.total}             color="#38bdf8" icon={
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
          </svg>
        } />
        <StatCard label="Strong"         value={summary.strong_count}      color="#22c55e" icon={
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
            <polyline points="17 6 23 6 23 12"></polyline>
          </svg>
        } />
        <StatCard label="Needs Work"     value={summary.improvement_count} color="#f59e0b" icon={
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="23 18 13.5 8.5 8.5 13.5 1 6"></polyline>
            <polyline points="17 18 23 18 23 12"></polyline>
          </svg>
        } />
        <StatCard label="Weak"           value={summary.weak_count}        color="#ef4444" icon={
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
        } />
      </div>

      {/* Recommendations */}
      {data.recommendations && data.recommendations.length > 0 && (
        <div style={{
          background: '#1a0d00', border: '1px solid #f59e0b44',
          borderLeft: '3px solid #f59e0b',
          borderRadius: '10px', padding: '16px 20px', marginBottom: '32px',
        }}>
          <div style={{ color: '#f59e0b', fontWeight: 800, marginBottom: '12px', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.15em', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path>
              <line x1="4" y1="22" x2="4" y2="15"></line>
            </svg>
            Recommendations
          </div>
          {data.recommendations.map((r, i) => {
            if (typeof r === 'string') {
              return <p key={i} style={{ color: '#fcd34d', margin: '4px 0', fontSize: '0.9rem' }}>{r}</p>;
            }
            return (
              <div key={i} style={{ marginBottom: '12px' }}>
                <p style={{ color: r.type === 'weak' ? '#fca5a5' : '#fcd34d', margin: '4px 0', fontSize: '0.9rem', fontWeight: 600 }}>
                  {r.text}
                </p>
                {r.units && r.units.length > 0 && (
                  <ul style={{ color: '#fef3c7', margin: '4px 0 0 0', paddingLeft: '24px', fontSize: '0.85rem' }}>
                    {r.units.map((u, j) => (
                      <li key={j} style={{ marginBottom: '4px' }}>{u}</li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>
        <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', padding: '20px' }}>
          <h3 style={{ margin: '0 0 16px', color: '#94a3b8', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Marks per Subject
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={barData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} domain={[0, 100]} />
              <Tooltip
                contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#e2e8f0' }}
                cursor={{ fill: '#ffffff0a' }}
              />
              <Bar dataKey="marks" radius={[4, 4, 0, 0]}>
                {barData.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', padding: '20px' }}>
          <h3 style={{ margin: '0 0 16px', color: '#94a3b8', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Performance Radar
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#1e293b" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 11 }} />
              <Radar name="Score" dataKey="score" stroke="#38bdf8" fill="#38bdf8" fillOpacity={0.2} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Assessment table */}
      <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', overflow: 'hidden' }}>
        <div style={{ 
          padding: '16px 20px', borderBottom: '1px solid #1e293b', 
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' 
        }}>
          <h3 style={{ margin: 0, color: '#e2e8f0', fontSize: '0.95rem', fontWeight: 600 }}>
            Detailed Assessment Breakdown
          </h3>
          
          {/* Filter pills */}
          <div style={{ display: 'flex', gap: '8px' }}>
            {['all', 'weak', 'needs_improvement', 'strong'].map(f => (
              <button 
                key={f} 
                onClick={() => setFilter(f)} 
                style={{
                  padding: '4px 12px', borderRadius: '6px', border: '1px solid',
                  background: filter === f ? '#38bdf815' : 'transparent',
                  borderColor: filter === f ? '#38bdf844' : '#1e293b',
                  color: filter === f ? '#38bdf8' : '#64748b',
                  fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer',
                  transition: '0.2s', textTransform: 'capitalize'
                }}
              >
                {f.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#0a0f1e' }}>
              {['Course', 'Unit #', 'Topic/Title', 'Marks', 'Percentage', 'Status', 'Action'].map(h => (
                <th key={h} style={{
                  padding: '10px 16px', textAlign: h === 'Action' ? 'right' : 'left',
                  color: '#475569', fontSize: '0.7rem',
                  textTransform: 'uppercase', letterSpacing: '0.08em',
                  fontWeight: 600,
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredMarks.map((m, i) => {
              const color = LEVEL_COLOR[m.performance_level] || '#64748b';
              return (
                <tr key={i} style={{
                  borderTop: '1px solid #0f172a',
                  background: i % 2 === 0 ? 'transparent' : '#ffffff03',
                }}>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ color: '#cbd5e1', fontSize: '0.85rem', fontWeight: 500 }}>{m.course_name}</div>
                    <div style={{ color: '#64748b', fontSize: '0.72rem', fontFamily: 'monospace' }}>{m.course_code}</div>
                  </td>
                  <td style={{ padding: '12px 16px', color: '#38bdf8', fontSize: '0.8rem', fontWeight: 700 }}>
                    #{m.unit_number || 'N/A'}
                  </td>
                  <td style={{ padding: '12px 16px', color: '#94a3b8', fontSize: '0.8rem', maxWidth: '240px' }}>
                    {m.unit_title || <span style={{ fontStyle: 'italic', opacity: 0.5 }}>Untitled Topic</span>}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ color: '#e2e8f0', fontWeight: 600, fontSize: '0.875rem' }}>{m.marks} / {m.max_marks}</div>
                  </td>
                  <td style={{ padding: '12px 16px', color: '#e2e8f0', fontSize: '0.875rem' }}>
                    {parseFloat(m.percentage).toFixed(1)}%
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{
                      background: `${color}15`, color,
                      border: `1px solid ${color}44`,
                      borderRadius: '99px', padding: '3px 10px',
                      fontSize: '0.7rem', fontWeight: 600,
                    }}>
                      {LEVEL_LABEL[m.performance_level] || m.performance_level}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                    {m.performance_level !== 'strong' && (() => {
                      const key = `${m.course_id}-${m.unit_number}`;
                      const test = tests.find(t => `${t.course_id}-${t.unit_number}` === key && t.status === 'scheduled');
                      
                      if (!test) {
                        return (
                          <button
                            disabled={scheduling === key}
                            onClick={() => handleStartLearning(m.course_id, m.unit_number)}
                            style={{
                              background: '#38bdf8', color: '#0f172a', border: 'none',
                              padding: '6px 12px', borderRadius: '6px', fontSize: '0.72rem',
                              fontWeight: 800, cursor: 'pointer', transition: '0.2s'
                            }}
                          >
                            {scheduling === key ? '...' : 'Start Learning'}
                          </button>
                        );
                      }

                      const isGranted = test.unlock_status === 'granted';
                      const isReady   = isGranted || new Date(test.scheduled_at) <= new Date();

                      if (isReady) {
                        return (
                          <button
                            onClick={() => navigate(`/student/practice/${test.id}`)}
                            style={{
                              background: '#22c55e', color: '#0f172a', border: 'none',
                              padding: '6px 12px', borderRadius: '6px', fontSize: '0.72rem',
                              fontWeight: 800, cursor: 'pointer'
                            }}
                          >
                            Take Test
                          </button>
                        );
                      }

                      if (test.unlock_status === 'pending') {
                        return (
                          <span style={{ color: '#f59e0b', fontSize: '0.7rem', fontWeight: 700 }}>
                            Waiting for review...
                          </span>
                        );
                      }

                      return (
                        <button
                          onClick={() => {
                            setUnlockTargetId(test.id);
                            setShowUnlockModal(true);
                          }}
                          style={{
                            background: 'rgba(56, 189, 248, 0.1)', border: '1px solid rgba(56, 189, 248, 0.3)',
                            color: '#38bdf8', padding: '6px 12px', borderRadius: '6px',
                            fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer'
                          }}
                        >
                          Request Early Access
                        </button>
                      );
                    })()}

                    {m.performance_level === 'strong' && (
                      <span style={{ color: '#475569', fontSize: '0.72rem', fontStyle: 'italic' }}>
                        Unit Mastery ✓
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
            {filteredMarks.length === 0 && (
              <tr>
                <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#475569' }}>
                  No records found for the selected filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <EarlyRequestModal
        isOpen={showUnlockModal}
        testId={unlockTargetId}
        onClose={() => setShowUnlockModal(false)}
        onSuccess={fetchData}
      />
    </AppLayout>
  );
};

export default StudentPerformance;
