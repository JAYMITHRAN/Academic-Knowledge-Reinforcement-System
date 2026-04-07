// src/pages/faculty/MenteeDetail.jsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getMenteeDetail } from '../../services/api';
import AppLayout from '../../components/Layout/AppLayout';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Cell, ReferenceLine,
} from 'recharts';

const LEVEL_COLOR = {
  weak: '#ef4444', needs_improvement: '#f59e0b', strong: '#22c55e',
};
const LEVEL_LABEL = {
  weak: 'Weak', needs_improvement: 'Needs Improvement', strong: 'Strong',
};

const MenteeDetail = () => {
  const { studentId } = useParams();
  const navigate       = useNavigate();
  const [marks,  setMarks]  = useState([]);
  const [student, setStudent] = useState({});
  const [practiceTests, setPracticeTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  useEffect(() => {
    getMenteeDetail(studentId)
      .then(r => {
        setMarks(r.data.marks);
        setStudent(r.data.student || {});
        setPracticeTests(r.data.practiceTests || []);
      })
      .catch(e => setError(e.response?.data?.error || 'Failed to load'))
      .finally(() => setLoading(false));
  }, [studentId]);

  if (loading) return <AppLayout><p style={{ color: '#64748b' }}>Loading…</p></AppLayout>;
  if (error)   return (
    <AppLayout>
      <p style={{ color: '#ef4444' }}>{error}</p>
      <button onClick={() => navigate(-1)} style={{ color: '#38bdf8', background: 'none', border: 'none', cursor: 'pointer', marginTop: '8px' }}>
        ← Back
      </button>
    </AppLayout>
  );

  const barData = marks.map(m => ({
    name:  `${m.course_code} ${m.exam_type === 'mid' ? '(Mid)' : ''}`,
    full:  `${m.course_name} (${m.exam_type})`,
    marks: parseFloat(m.marks),
    color: LEVEL_COLOR[m.performance_level] || '#64748b',
  }));

  const weak  = marks.filter(m => m.performance_level === 'weak');
  const needs = marks.filter(m => m.performance_level === 'needs_improvement');

  return (
    <AppLayout>
      <button
        onClick={() => navigate(-1)}
        style={{
          background: 'none', border: 'none', color: '#64748b',
          cursor: 'pointer', fontSize: '0.875rem', marginBottom: '20px',
          display: 'flex', alignItems: 'center', gap: '6px',
        }}
      >
        ← Back to Mentees
      </button>

      <h1 style={{ margin: '0 0 6px', fontSize: '1.6rem', fontWeight: 700, color: '#f1f5f9' }}>
        {student.name ? `${student.name}'s Performance Detail` : 'Mentee Performance Detail'}
      </h1>
      <p style={{ color: '#64748b', marginBottom: '28px', fontSize: '0.88rem' }}>
        {student.student_code ? `${student.student_code} · ${student.department}` : `Student ID: ${studentId}`}
        {' · '}{marks.length} assessments
      </p>

      {/* Alert banners */}
      {weak.length > 0 && (
        <div style={{
          background: '#1a0000', border: '1px solid #ef444433',
          borderLeft: '3px solid #ef4444',
          borderRadius: '8px', padding: '14px 18px', marginBottom: '16px',
        }}>
          <div style={{ color: '#ef4444', fontWeight: 600, fontSize: '0.82rem', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            ⚠ Weak Areas — Requires Immediate Attention
          </div>
          <div style={{ color: '#fca5a5', fontSize: '0.875rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {Object.entries(
               weak.reduce((acc, m) => {
                 if (!acc[m.course_name]) acc[m.course_name] = [];
                 if (m.unit_number) acc[m.course_name].push(`Unit ${m.unit_number}${m.unit_title ? `: ${m.unit_title}` : ''}`);
                 return acc;
               }, {})
            ).map(([course, units], i) => (
               <div key={i}>
                 <div style={{ fontWeight: 600 }}>{course}</div>
                 {units.length > 0 && (
                   <ul style={{ margin: '4px 0 0 0', paddingLeft: '20px', fontSize: '0.8rem', color: '#ef4444' }}>
                     {units.map((u, j) => <li key={j}>{u}</li>)}
                   </ul>
                 )}
               </div>
            ))}
          </div>
        </div>
      )}
      {needs.length > 0 && (
        <div style={{
          background: '#1a0d00', border: '1px solid #f59e0b33',
          borderLeft: '3px solid #f59e0b',
          borderRadius: '8px', padding: '14px 18px', marginBottom: '24px',
        }}>
          <div style={{ color: '#f59e0b', fontWeight: 600, fontSize: '0.82rem', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            ◆ Needs Improvement
          </div>
          <div style={{ color: '#fcd34d', fontSize: '0.875rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {Object.entries(
               needs.reduce((acc, m) => {
                 if (!acc[m.course_name]) acc[m.course_name] = [];
                 if (m.unit_number) acc[m.course_name].push(`Unit ${m.unit_number}${m.unit_title ? `: ${m.unit_title}` : ''}`);
                 return acc;
               }, {})
            ).map(([course, units], i) => (
               <div key={i}>
                 <div style={{ fontWeight: 600 }}>{course}</div>
                 {units.length > 0 && (
                   <ul style={{ margin: '4px 0 0 0', paddingLeft: '20px', fontSize: '0.8rem', color: '#f59e0b' }}>
                     {units.map((u, j) => <li key={j}>{u}</li>)}
                   </ul>
                 )}
               </div>
            ))}
          </div>
        </div>
      )}

      {/* Bar chart */}
      <div style={{
        background: '#0f172a', border: '1px solid #1e293b',
        borderRadius: '12px', padding: '20px', marginBottom: '24px',
      }}>
        <h3 style={{ margin: '0 0 16px', color: '#94a3b8', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          Marks per Subject
        </h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={barData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} />
            <YAxis tick={{ fill: '#64748b', fontSize: 11 }} domain={[0, 100]} />
            <Tooltip
              contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#e2e8f0' }}
              formatter={(val, name, props) => [val, props.payload.full]}
              cursor={{ fill: '#ffffff06' }}
            />
            <ReferenceLine y={50} stroke="#ef444444" strokeDasharray="4 4" />
            <ReferenceLine y={70} stroke="#f59e0b44" strokeDasharray="4 4" />
            <Bar dataKey="marks" radius={[4, 4, 0, 0]}>
              {barData.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div style={{ display: 'flex', gap: '20px', marginTop: '12px', justifyContent: 'center' }}>
          <span style={{ color: '#64748b', fontSize: '0.72rem' }}>— 50% threshold (Weak)</span>
          <span style={{ color: '#64748b', fontSize: '0.72rem' }}>— 70% threshold (Needs Improvement)</span>
        </div>
      </div>

      {/* Detail table */}
      <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', overflow: 'hidden', marginBottom: '24px' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid #1e293b' }}>
          <h3 style={{ margin: 0, color: '#e2e8f0', fontSize: '0.9rem' }}>Subject Breakdown</h3>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#0a0f1e' }}>
              {['Course', 'Unit #', 'Topic/Title', 'Marks', '%', 'Status'].map(h => (
                <th key={h} style={{
                  padding: '10px 16px', textAlign: 'left',
                  color: '#475569', fontSize: '0.72rem',
                  textTransform: 'uppercase', letterSpacing: '0.08em',
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {marks.map((m, i) => {
              const color = LEVEL_COLOR[m.performance_level] || '#64748b';
              return (
                <tr key={i} style={{
                  borderTop: '1px solid #0f172a',
                  background: m.performance_level === 'weak' ? '#1a000033' : 'transparent',
                }}>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ color: '#cbd5e1', fontSize: '0.875rem', fontWeight: 500 }}>{m.course_name}</div>
                    <div style={{ color: '#64748b', fontSize: '0.72rem', fontFamily: 'monospace' }}>{m.course_code} - {m.exam_type || 'semester'}</div>
                  </td>
                  <td style={{ padding: '12px 16px', color: '#38bdf8', fontSize: '0.8rem', fontWeight: 700 }}>
                    #{m.unit_number || 'N/A'}
                  </td>
                  <td style={{ padding: '12px 16px', color: '#94a3b8', fontSize: '0.8rem', maxWidth: '240px' }}>
                    {m.unit_title || <span style={{ fontStyle: 'italic', opacity: 0.5 }}>Untitled Topic</span>}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ color: '#e2e8f0', fontWeight: 700 }}>{m.marks} <span style={{ color: '#64748b', fontWeight: 400, fontSize: '0.8rem' }}>/ {m.max_marks}</span></div>
                  </td>
                  <td style={{ padding: '12px 16px', color: '#e2e8f0' }}>{parseFloat(m.percentage).toFixed(1)}%</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{
                      background: `${color}15`, color,
                      border: `1px solid ${color}44`,
                      borderRadius: '99px', padding: '3px 10px',
                      fontSize: '0.73rem', fontWeight: 600,
                    }}>
                      {LEVEL_LABEL[m.performance_level] || m.performance_level}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Practice Test History */}
      <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', overflow: 'hidden' }}>
        <div style={{ 
          padding: '14px 20px', borderBottom: '1px solid #1e293b',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center' 
        }}>
          <h3 style={{ margin: 0, color: '#e2e8f0', fontSize: '0.9rem' }}>AI Practice Test History</h3>
          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Reaching 70%+ improves "Weak" status</span>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#0a0f1e' }}>
              {['Date', 'Course', 'Unit #', 'Score', 'Status'].map(h => (
                <th key={h} style={{
                  padding: '10px 16px', textAlign: 'left',
                  color: '#475569', fontSize: '0.72rem',
                  textTransform: 'uppercase', letterSpacing: '0.08em',
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {practiceTests.length > 0 ? practiceTests.map((t, i) => {
              const perc = (t.score / t.max_score) * 100;
              const isGood = perc >= 70 && !t.is_malpractice;
              const isMal = t.is_malpractice;
              return (
                <tr key={i} style={{ borderTop: '1px solid #1e293b', background: isMal ? '#ef444405' : 'transparent' }}>
                  <td style={{ padding: '12px 16px', color: '#94a3b8', fontSize: '0.8rem' }}>
                    {new Date(t.completed_at).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ color: '#cbd5e1', fontSize: '0.875rem' }}>{t.course_name}</div>
                    <div style={{ color: '#64748b', fontSize: '0.72rem' }}>{t.course_code}</div>
                  </td>
                  <td style={{ padding: '12px 16px', color: '#38bdf8', fontSize: '0.8rem', fontWeight: 700 }}>
                    #{t.unit_number}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ color: isMal ? '#ef4444' : (isGood ? '#22c55e' : '#e2e8f0'), fontWeight: 700 }}>
                      {isMal ? '0.00' : t.score} / {t.max_score}
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{
                      background: isMal ? '#ef444415' : (isGood ? '#22c55e15' : '#64748b15'),
                      color: isMal ? '#ef4444' : (isGood ? '#22c55e' : '#64748b'),
                      borderRadius: '99px', padding: '3px 10px',
                      fontSize: '0.7rem', fontWeight: 600,
                    }}>
                      {isMal ? 'Malpractice' : (isGood ? 'Status Improved' : 'Completed')}
                    </span>
                  </td>
                </tr>
              );
            }) : (
              <tr>
                <td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: '#64748b', fontSize: '0.9rem' }}>
                  No practice history found for this mentee.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </AppLayout>
  );
};

export default MenteeDetail;
