// src/pages/faculty/StudentsList.jsx
import React, { useEffect, useState } from 'react';
import { getFacultyStudents as getStudents } from '../../services/api';
import AppLayout from '../../components/Layout/AppLayout';

const StudentsList = () => {
  const [students, setStudents] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');
  const [activeTab, setActiveTab] = useState('course'); // 'course' or 'mentee'

  useEffect(() => {
    getStudents()
      .then(r => setStudents(r.data.students))
      .catch((err) => console.error('Students load error:', err))
      .finally(() => setLoading(false));
  }, []);

  const tabFiltered = students.filter(s => 
    activeTab === 'mentee' ? s.is_mentee === 1 : s.is_mentee === 0
  );

  const filtered = tabFiltered.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    (s.student_code || '').toLowerCase().includes(search.toLowerCase()) ||
    (s.course_code || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppLayout>
      <h1 style={{ margin: '0 0 8px', fontSize: '1.6rem', fontWeight: 700, color: '#f1f5f9' }}>
        My Students & Mentees
      </h1>
      <p style={{ color: '#64748b', marginBottom: '24px', fontSize: '0.88rem' }}>
        View insights and details for your enrolled students and mentees.
      </p>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
        <button
          onClick={() => setActiveTab('course')}
          style={{
            background: activeTab === 'course' ? '#38bdf8' : '#0f172a',
            color: activeTab === 'course' ? '#0f172a' : '#64748b',
            border: `1px solid ${activeTab === 'course' ? '#38bdf8' : '#1e293b'}`,
            borderRadius: '8px', padding: '8px 16px', cursor: 'pointer',
            fontWeight: 600, fontSize: '0.875rem', transition: 'all 0.2s',
          }}
        >
          Course Students
        </button>
        <button
          onClick={() => setActiveTab('mentee')}
          style={{
            background: activeTab === 'mentee' ? '#a855f7' : '#0f172a',
            color: activeTab === 'mentee' ? '#fff' : '#64748b',
            border: `1px solid ${activeTab === 'mentee' ? '#a855f7' : '#1e293b'}`,
            borderRadius: '8px', padding: '8px 16px', cursor: 'pointer',
            fontWeight: 600, fontSize: '0.875rem', transition: 'all 0.2s',
          }}
        >
          Mentees
        </button>
      </div>

      {/* Search */}
      <input
        style={{
          background: '#0f172a', border: '1px solid #1e293b',
          borderRadius: '8px', padding: '10px 16px', color: '#e2e8f0',
          fontSize: '0.875rem', outline: 'none', width: '320px',
          marginBottom: '20px',
        }}
        placeholder="Search by name, code, or course…"
        value={search}
        onChange={e => setSearch(e.target.value)}
      />

      <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', overflow: 'hidden' }}>
        {loading ? (
          <p style={{ color: '#64748b', padding: '24px' }}>Loading…</p>
        ) : filtered.length === 0 ? (
          <p style={{ color: '#475569', padding: '32px', textAlign: 'center' }}>No records found in this tab.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#0a0f1e' }}>
                {['Name', 'Student Code', 'Department', 'Year', 'Course', 'Email', 'Action'].map(h => (
                  <th key={h} style={{
                    padding: '10px 16px', textAlign: 'left',
                    color: '#475569', fontSize: '0.72rem',
                    textTransform: 'uppercase', letterSpacing: '0.08em',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((s, i) => (
                <tr key={`${s.id}-${s.course_code}`} style={{
                  borderTop: '1px solid #0f172a',
                  background: i % 2 === 0 ? 'transparent' : '#ffffff03',
                }}>
                  <td style={{ padding: '12px 16px', color: '#e2e8f0', fontWeight: 500, fontSize: '0.875rem' }}>{s.name}</td>
                  <td style={{ padding: '12px 16px', color: '#64748b', fontFamily: 'monospace', fontSize: '0.8rem' }}>{s.student_code}</td>
                  <td style={{ padding: '12px 16px', color: '#94a3b8', fontSize: '0.82rem' }}>{s.department}</td>
                  <td style={{ padding: '12px 16px', color: '#64748b', fontSize: '0.82rem' }}>Year {s.year}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{
                      background: s.course_code === 'MENTEE' ? '#4c1d9533' : '#0c4a6e33',
                      color: s.course_code === 'MENTEE' ? '#a855f7' : '#38bdf8',
                      border: `1px solid ${s.course_code === 'MENTEE' ? '#a855f733' : '#38bdf822'}`,
                      borderRadius: '4px', padding: '2px 8px',
                      fontSize: '0.75rem', fontFamily: 'monospace',
                    }}>
                      {s.course_code}
                    </span>
                    {s.course_name !== 'Mentorship Program' && (
                      <span style={{ color: '#64748b', fontSize: '0.78rem', marginLeft: '8px' }}>
                        {s.course_name}
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '12px 16px', color: '#475569', fontSize: '0.78rem' }}>{s.email}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <a 
                      href={`/faculty/mentees/${s.id}`}
                      style={{ 
                        color: s.is_mentee === 1 ? '#a855f7' : '#38bdf8', 
                        fontSize: '0.75rem', fontWeight: 600, textDecoration: 'none' 
                      }}
                    >
                      {s.is_mentee === 1 ? 'View Mentee →' : 'View Details →'}
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <p style={{ color: '#334155', fontSize: '0.75rem', marginTop: '12px' }}>
        Showing {filtered.length} of {tabFiltered.length} records in this tab
      </p>
    </AppLayout>
  );
};

export default StudentsList;