// src/pages/admin/AIPracticeLogs.jsx
import React, { useEffect, useState } from 'react';
import AppLayout from '../../components/Layout/AppLayout';
import { getAIPracticeLogs } from '../../services/api';

const S = {
  page:    { padding: '32px', maxWidth: '1200px', margin: '0 auto' },
  header:  { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' },
  title:   { fontSize: '24px', fontWeight: 700, color: '#e2e8f0' },
  search:  { 
    background: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px',
    padding: '8px 16px', color: '#e2e8f0', outline: 'none', width: '300px'
  },
  card:    { background: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', overflow: 'hidden' },
  table:   { width: '100%', borderCollapse: 'collapse' },
  th:      { textAlign: 'left', padding: '16px', fontSize: '12px', color: '#64748b', borderBottom: '1px solid #1e293b', textTransform: 'uppercase', letterSpacing: '0.05em' },
  td:      { padding: '16px', fontSize: '14px', color: '#cbd5e1', borderBottom: '1px solid #1e293b' },
  student: { display: 'flex', flexDirection: 'column' },
  name:    { fontWeight: 600, color: '#f1f5f9' },
  code:    { fontSize: '12px', color: '#64748b' },
  score:   (pct) => ({ 
    fontWeight: 700, 
    color: pct >= 80 ? '#22c55e' : pct >= 50 ? '#f59e0b' : '#ef4444' 
  }),
  malbadge: (isMal) => ({
    padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 700,
    background: isMal ? '#450a0a' : '#064e3b',
    color:      isMal ? '#f87171' : '#34d399',
    textTransform: 'uppercase'
  }),
  empty:   { textAlign: 'center', padding: '60px', color: '#475569' },
  loader:  { textAlign: 'center', padding: '100px', color: '#64748b' },
  error:   { background: '#450a0a', border: '1px solid #7f1d1d', borderRadius: '8px', padding: '16px', color: '#f87171', marginBottom: '24px' },
};

export default function AIPracticeLogs() {
  const [logs, setLogs] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const res = await getAIPracticeLogs();
      setLogs(res.data.logs || []);
    } catch (err) {
      setError('Failed to fetch practice logs');
    } finally {
      setLoading(false);
    }
  };

  const filtered = logs.filter(l => 
    l.student_name?.toLowerCase().includes(search.toLowerCase()) ||
    l.student_code?.toLowerCase().includes(search.toLowerCase()) ||
    l.course_name?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <AppLayout><div style={S.loader}>Loading logs...</div></AppLayout>;

  return (
    <AppLayout>
      <div style={S.page}>
        <div style={S.header}>
          <h1 style={S.title}>AI Practice Logs</h1>
          <input 
            style={S.search} 
            placeholder="Search student, course or code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {error && <div style={S.error}>{error}</div>}

        <div style={S.card}>
          {filtered.length > 0 ? (
            <table style={S.table}>
              <thead>
                <tr>
                  <th style={S.th}>Student</th>
                  <th style={S.th}>Course & Unit</th>
                  <th style={S.th}>Score</th>
                  <th style={S.th}>Malpractice</th>
                  <th style={S.th}>Date</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(log => {
                  const pct = (log.score / log.max_score) * 100;
                  return (
                    <tr key={log.id}>
                      <td style={S.td}>
                        <div style={S.student}>
                          <span style={S.name}>{log.student_name}</span>
                          <span style={S.code}>{log.student_code}</span>
                        </div>
                      </td>
                      <td style={S.td}>
                        <div style={S.student}>
                          <span style={S.name}>{log.course_name}</span>
                          <span style={S.code}>Unit {log.unit_number} ({log.course_code})</span>
                        </div>
                      </td>
                      <td style={S.td}>
                        <span style={S.score(pct)}>
                          {log.score} / {log.max_score} ({pct.toFixed(0)}%)
                        </span>
                      </td>
                      <td style={S.td}>
                        <span style={S.malbadge(log.is_malpractice)}>
                          {log.is_malpractice ? 'Detected' : 'Clear'}
                        </span>
                      </td>
                      <td style={S.td}>
                        {new Date(log.completed_at).toLocaleDateString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div style={S.empty}>No practice logs found.</div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
