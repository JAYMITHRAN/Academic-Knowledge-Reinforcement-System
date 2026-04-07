// src/pages/admin/Analytics.jsx
import React, { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import AppLayout from '../../components/Layout/AppLayout';
import { getAdminDashboard } from '../../services/api';

// ── Styles ────────────────────────────────────────────────────────────────────
const S = {
  page:    { padding: '32px', maxWidth: '1200px', margin: '0 auto' },
  heading: { fontSize: '24px', fontWeight: 700, color: '#e2e8f0', marginBottom: '8px' },
  sub:     { fontSize: '14px', color: '#64748b', marginBottom: '32px' },

  grid4: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px,1fr))', gap: '16px', marginBottom: '32px' },
  card:  { background: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', padding: '20px' },
  label: { fontSize: '12px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' },
  value: { fontSize: '32px', fontWeight: 700, color: '#e2e8f0' },
  accent:{ fontSize: '13px', color: '#6366f1', marginTop: '4px' },

  grid2: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px,1fr))', gap: '24px', marginBottom: '32px' },
  chartCard: { background: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', padding: '24px' },
  chartTitle: { fontSize: '16px', fontWeight: 600, color: '#e2e8f0', marginBottom: '20px' },

  table:  { width: '100%', borderCollapse: 'collapse' },
  th:     { textAlign: 'left', padding: '10px 12px', fontSize: '12px', color: '#64748b', borderBottom: '1px solid #1e293b', textTransform: 'uppercase' },
  td:     { padding: '12px', fontSize: '14px', color: '#cbd5e1', borderBottom: '1px solid #0f172a' },
  badge:  (status) => ({
    display: 'inline-block', padding: '2px 10px', borderRadius: '999px', fontSize: '12px', fontWeight: 600,
    background: status === 'completed' ? '#14532d' : status === 'processing' ? '#1e3a5f' : '#450a0a',
    color:      status === 'completed' ? '#4ade80' : status === 'processing' ? '#60a5fa' : '#f87171',
  }),

  empty: { textAlign: 'center', padding: '40px', color: '#475569', fontSize: '14px' },
  error: { background: '#450a0a', border: '1px solid #7f1d1d', borderRadius: '8px', padding: '16px', color: '#f87171', marginBottom: '24px' },
  loader:{ textAlign: 'center', padding: '80px', color: '#64748b' },
};

const PIE_COLORS = {
  strong:             '#22c55e',
  needs_improvement:  '#f59e0b',
  weak:               '#ef4444',
};

const LEVEL_ORDER = ['strong', 'needs_improvement', 'weak'];

export default function Analytics() {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await getAdminDashboard();
        setData(res.data);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to load analytics data');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <AppLayout><div style={S.loader}>Loading analytics…</div></AppLayout>;

  return (
    <AppLayout>
      <div style={S.page}>
        <div style={S.heading}>Analytics</div>
        <div style={S.sub}>Overview of academic data and performance distribution</div>

        {error && <div style={S.error}>{error}</div>}

        {/* ── Stat Cards ── */}
        {data && (
          <>
            <div style={S.grid4}>
              <StatCard label="Total Students"  value={data.stats.total_students} accent="Registered students" />
              <StatCard label="Total Faculty"   value={data.stats.total_faculty}  accent="Teaching staff" />
              <StatCard label="Total Courses"   value={data.stats.total_courses}  accent="Active courses" />
              <StatCard label="AI Practice Done" value={data.stats.total_ai_practice} accent="Completed practice tests" />
              <StatCard label="Marksheet Uploads" value={data.stats.total_uploads} accent="CSV/Excel uploads" />
            </div>

            {/* AI Practice Table or other metrics can go here if needed, but for now we follow the plan to just clean up */}


            {/* ── Recent Uploads Table ── */}
            <div style={S.chartCard}>
              <div style={S.chartTitle}>Recent Marksheet Uploads</div>
              {data.recentUploads?.length > 0 ? (
                <table style={S.table}>
                  <thead>
                    <tr>
                      <th style={S.th}>File Name</th>
                      <th style={S.th}>Uploaded By</th>
                      <th style={S.th}>Status</th>
                      <th style={S.th}>Total</th>
                      <th style={S.th}>Success</th>
                      <th style={S.th}>Failed</th>
                      <th style={S.th}>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recentUploads.map((u) => (
                      <tr key={u.id}>
                        <td style={S.td}>{u.filename}</td>
                        <td style={S.td}>{u.uploaded_by_name || '—'}</td>
                        <td style={S.td}><span style={S.badge(u.status)}>{u.status}</span></td>
                        <td style={S.td}>{u.total_rows ?? '—'}</td>
                        <td style={{ ...S.td, color: '#4ade80' }}>{u.success_rows ?? '—'}</td>
                        <td style={{ ...S.td, color: '#f87171' }}>{u.failed_rows ?? '—'}</td>
                        <td style={S.td}>{new Date(u.uploaded_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div style={S.empty}>No marksheet uploads yet. Upload a marksheet to see data here.</div>
              )}
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
}

// ── Helper Components ─────────────────────────────────────────────────────────
function StatCard({ label, value, accent }) {
  return (
    <div style={S.card}>
      <div style={S.label}>{label}</div>
      <div style={S.value}>{value ?? 0}</div>
      <div style={S.accent}>{accent}</div>
    </div>
  );
}

function EmptyChart() {
  return <div style={S.empty}>No performance data yet. Upload marksheets to see charts.</div>;
}

function sortedDistribution(dist = []) {
  return [...dist].sort(
    (a, b) => LEVEL_ORDER.indexOf(a.performance_level) - LEVEL_ORDER.indexOf(b.performance_level)
  );
}