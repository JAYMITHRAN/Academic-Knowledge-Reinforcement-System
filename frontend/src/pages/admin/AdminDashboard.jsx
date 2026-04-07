// src/pages/admin/AdminDashboard.jsx
import React, { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { getAdminDashboard } from '../../services/api';
import AppLayout from '../../components/Layout/AppLayout';

const COLORS = { weak: '#ef4444', needs_improvement: '#f59e0b', strong: '#22c55e' };

const BigStat = ({ label, value, icon, color }) => (
  <div style={{
    background: '#0f172a', border: '1px solid #1e293b',
    borderRadius: '12px', padding: '24px',
    borderLeft: `3px solid ${color}`,
  }}>
    <div style={{ fontSize: '1.8rem', marginBottom: '8px' }}>{icon}</div>
    <div style={{ fontSize: '2.2rem', fontWeight: 700, color, lineHeight: 1 }}>{value}</div>
    <div style={{ color: '#64748b', fontSize: '0.78rem', marginTop: '8px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
      {label}
    </div>
  </div>
);

const AdminDashboard = () => {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshData = () => {
    setLoading(true);
    getAdminDashboard()
      .then((res) => {
        setData(res.data);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    refreshData();
  }, []);

  if (loading) return <AppLayout><p style={{ color: '#64748b' }}>Loading…</p></AppLayout>;
  if (!data)   return <AppLayout><p style={{ color: '#ef4444' }}>Failed to load</p></AppLayout>;

  const { stats, distribution, recentUploads } = data;
  const pieData = distribution.map(d => ({
    name:  d.performance_level.replace('_', ' '),
    value: d.count,
    color: COLORS[d.performance_level] || '#64748b',
  }));

  return (
    <AppLayout>
      <h1 style={{ margin: '0 0 8px', fontSize: '1.8rem', fontWeight: 700, color: '#f1f5f9' }}>
        Admin Dashboard
      </h1>
      <p style={{ color: '#64748b', marginBottom: '32px', fontSize: '0.88rem' }}>
        System-wide analytics and management overview
      </p>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        <BigStat label="Students"     value={stats.total_students} icon="◈" color="#38bdf8" />
        <BigStat label="Faculty"      value={stats.total_faculty}  icon="◉" color="#a78bfa" />
        <BigStat label="Courses"      value={stats.total_courses}  icon="◎" color="#34d399" />
        <BigStat label="Marks Stored" value={stats.total_marks}    icon="⬡" color="#fb923c" />
        <BigStat label="Uploads"      value={stats.total_uploads}  icon="⊕" color="#f472b6" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: '24px' }}>
        {/* Pie chart */}
        <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', padding: '20px' }}>
          <h3 style={{ margin: '0 0 16px', color: '#94a3b8', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Performance Distribution
          </h3>
          {pieData.length ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}>
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#e2e8f0' }}
                />
                <Legend
                  formatter={(val) => <span style={{ color: '#94a3b8', fontSize: '0.8rem', textTransform: 'capitalize' }}>{val}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p style={{ color: '#475569', textAlign: 'center', padding: '40px 0' }}>No analysis data yet</p>
          )}
        </div>

        {/* Recent uploads */}
        <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #1e293b' }}>
            <h3 style={{ margin: 0, color: '#e2e8f0', fontSize: '0.9rem', fontWeight: 600 }}>
              Recent Marksheet Uploads
            </h3>
          </div>
          {recentUploads.length === 0 ? (
            <p style={{ color: '#475569', padding: '24px', textAlign: 'center' }}>No uploads yet</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#0a0f1e' }}>
                  {['File', 'Uploaded By', 'Success / Total', 'Status', 'Date'].map(h => (
                    <th key={h} style={{
                      padding: '10px 16px', textAlign: 'left',
                      color: '#475569', fontSize: '0.72rem',
                      textTransform: 'uppercase', letterSpacing: '0.08em',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentUploads.map((u, i) => {
                  const statusColor = u.status === 'completed' ? '#22c55e' : u.status === 'failed' ? '#ef4444' : '#f59e0b';
                  return (
                    <tr key={i} style={{ borderTop: '1px solid #0f172a' }}>
                      <td style={{ padding: '10px 16px', color: '#cbd5e1', fontSize: '0.82rem', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {u.filename}
                      </td>
                      <td style={{ padding: '10px 16px', color: '#94a3b8', fontSize: '0.82rem' }}>{u.uploaded_by_name}</td>
                      <td style={{ padding: '10px 16px', color: '#e2e8f0', fontSize: '0.82rem' }}>
                        {u.success_rows} / {u.total_rows}
                      </td>
                      <td style={{ padding: '10px 16px' }}>
                        <span style={{
                          background: `${statusColor}15`, color: statusColor,
                          border: `1px solid ${statusColor}44`,
                          borderRadius: '99px', padding: '2px 8px', fontSize: '0.72rem', fontWeight: 600,
                        }}>
                          {u.status}
                        </span>
                      </td>
                      <td style={{ padding: '10px 16px', color: '#475569', fontSize: '0.78rem' }}>
                        {new Date(u.uploaded_at).toLocaleDateString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default AdminDashboard;
