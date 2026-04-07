// src/pages/student/StudentDashboard.jsx
import React, { useEffect, useState } from 'react';
import {
  RadarChart, PolarGrid, PolarAngleAxis, Radar,
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { getStudentPerformance, getStudentCourseDetail } from '../../services/api';
import AppLayout from '../../components/Layout/AppLayout';

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
    <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>{icon}</div>
    <div style={{ fontSize: '2rem', fontWeight: 700, color }}>{value}</div>
    <div style={{ color: '#64748b', fontSize: '0.78rem', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</div>
  </div>
);

const StudentCourseDetailModal = ({ courseId, onClose }) => {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!courseId) return;
    setLoading(true);
    getStudentCourseDetail(courseId)
      .then(res => setDetail(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [courseId]);

  if (!courseId) return null;

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
      zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center',
      backdropFilter: 'blur(8px)',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        width: '90%', maxWidth: '800px', maxHeight: '90vh', background: '#0f172a',
        borderRadius: '24px', border: '1px solid #1e293b', padding: '32px',
        overflowY: 'auto', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
        position: 'relative'
      }}>
        <button onClick={onClose} style={{
          position: 'absolute', top: '24px', right: '24px', background: '#1e293b',
          color: '#94a3b8', border: 'none', borderRadius: '50%', width: '36px', height: '36px',
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        {loading ? (
          <div style={{ padding: '100px 0', textAlign: 'center', color: '#64748b' }}>
            <div style={{ width: '40px', height: '40px', border: '3px solid #1e293b', borderTopColor: '#38bdf8', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
            <p>Gathering course resources...</p>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        ) : detail ? (
          <div>
            <div style={{ marginBottom: '32px' }}>
              <span style={{ color: '#38bdf8', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>COURSE OVERVIEW</span>
              <h2 style={{ margin: '8px 0', color: '#f1f5f9', fontSize: '1.8rem' }}>{detail.course.course_name}</h2>
              <div style={{ display: 'flex', gap: '8px', color: '#64748b', fontSize: '0.9rem' }}>
                <span style={{ color: '#312e81', background: '#818cf822', padding: '2px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600 }}>{detail.course.course_code}</span>
                <span>• Sem {detail.course.semester}</span>
                <span>• {detail.course.credits} Credits</span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px' }}>
              {/* Syllabus Timeline */}
              <div>
                <h3 style={{ color: '#e2e8f0', fontSize: '1rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                   Unit Selection
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {detail.units && detail.units.length > 0 ? (
                    detail.units.map((unit) => {
                      const unitMark = detail.marks?.find(m => m.unit_number === unit.unit_number);
                      
                      return (
                        <div key={unit.id} style={{ 
                          background: '#0a0f1e', padding: '20px', borderRadius: '16px', 
                          border: `1px solid ${unitMark ? LEVEL_COLOR[unitMark.performance_level] + '44' : '#1e293b'}`,
                          position: 'relative', overflow: 'hidden'
                        }}>
                          {unitMark && (
                            <div style={{ 
                              position: 'absolute', top: 0, left: 0, bottom: 0, width: '4px',
                              background: LEVEL_COLOR[unitMark.performance_level]
                            }} />
                          )}

                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ color: '#38bdf8', fontSize: '0.7rem', fontWeight: 800 }}>UNIT {unit.unit_number}</span>
                              {unitMark && (
                                <span style={{ 
                                  fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '10px',
                                  background: LEVEL_COLOR[unitMark.performance_level] + '22',
                                  color: LEVEL_COLOR[unitMark.performance_level],
                                  textTransform: 'uppercase', letterSpacing: '0.05em'
                                }}>
                                  {unitMark.marks} / {unitMark.max_marks}
                                </span>
                              )}
                            </div>
                            {unit.material_link && (
                              <a href={unit.material_link} target="_blank" rel="noreferrer" style={{
                                color: '#22c55e', textDecoration: 'none', fontSize: '0.75rem', fontWeight: 600,
                                display: 'flex', alignItems: 'center', gap: '4px', background: '#22c55e11', padding: '4px 8px', borderRadius: '4px'
                              }}>
                                  View Resource ↗
                              </a>
                            )}
                          </div>
                          <h4 style={{ margin: '0 0 8px', color: '#f1f5f9', fontSize: '0.95rem' }}>{unit.title || 'Untitled Unit'}</h4>
                          <p style={{ margin: 0, color: '#64748b', fontSize: '0.85rem', lineHeight: '1.6' }}>{unit.description}</p>
                        </div>
                      );
                    })
                  ) : (
                    <div style={{ padding: '24px', background: '#0a0f1e', borderRadius: '12px', border: '1px dashed #1e293b', textAlign: 'center', color: '#475569' }}>
                      No syllabus details defined yet.
                    </div>
                  )}
                </div>
              </div>

              {/* General Materials */}
              <div>
                <h3 style={{ color: '#e2e8f0', fontSize: '1rem', marginBottom: '20px' }}>Course Materials</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {detail.materials && detail.materials.length > 0 ? (
                    detail.materials.map((m) => (
                      <div key={m.id} style={{ background: '#1e293b44', padding: '16px', borderRadius: '12px', border: '1px solid #1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ color: '#f1f5f9', fontSize: '0.875rem', fontWeight: 500 }}>{m.title}</div>
                          <div style={{ color: '#64748b', fontSize: '0.75rem', marginTop: '2px' }}>{m.material_type?.toUpperCase()}</div>
                        </div>
                        <a href={m.material_link} target="_blank" rel="noreferrer" style={{
                          background: '#1e293b', color: '#38bdf8', padding: '6px 12px', borderRadius: '8px',
                          textDecoration: 'none', fontSize: '0.8rem', fontWeight: 600
                        }}>View</a>
                      </div>
                    ))
                  ) : (
                    <p style={{ color: '#475569', fontSize: '0.85rem' }}>No general course materials uploaded yet.</p>
                  )}
                </div>

                <div style={{ marginTop: '32px', padding: '20px', background: 'linear-gradient(135deg, #0a0f1e, #1e1b4b)', borderRadius: '16px', border: '1px solid #312e81' }}>
                  <h4 style={{ color: '#818cf8', fontSize: '0.85rem', margin: '0 0 4px' }}>Instructor</h4>
                  <div style={{ color: '#f1f5f9', fontWeight: 600, fontSize: '1rem' }}>{detail.course.faculty_name}</div>
                  <div style={{ color: '#94a3b8', fontSize: '0.8rem' }}>{detail.course.faculty_email}</div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <p style={{ color: '#ef4444' }}>Failed to load course details.</p>
        )}
      </div>
    </div>
  );
};

const StudentDashboard = () => {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');
  const [selectedCourseId, setSelectedCourseId] = useState(null);

  useEffect(() => {
    getStudentPerformance()
      .then(r => setData(r.data))
      .catch(e => setError(e.response?.data?.error || 'Failed to load'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <AppLayout><p style={{ color: '#64748b' }}>Loading…</p></AppLayout>;
  if (error)   return <AppLayout><p style={{ color: '#ef4444' }}>{error}</p></AppLayout>;

  const { student, mentor, enrolled_courses } = data;

  return (
    <AppLayout>
      {/* Header & Mentor Section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '24px', marginBottom: '40px' }}>
        <div>
          <h1 style={{
            margin: 0, fontSize: '1.8rem', fontWeight: 700,
            color: '#f1f5f9', letterSpacing: '-0.02em',
          }}>
            Welcome back, {student.name?.split(' ')[0]}
          </h1>
          <p style={{ color: '#64748b', marginTop: '6px', fontSize: '0.88rem' }}>
            {student.department} · Year {student.year}{student.section ? ` · Section ${student.section}` : ''} · {student.student_code}
          </p>
        </div>

        {/* Mentor Card */}
        {mentor && (
          <div style={{
            background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)',
            border: '1px solid #312e81', borderRadius: '12px',
            padding: '16px 20px', minWidth: '280px', flexShrink: 0,
            boxShadow: '0 10px 30px -10px rgba(0,0,0,0.5)',
          }}>
            <div style={{ color: '#818cf8', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
              </svg>
              Academic Mentor
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '40px', height: '40px', borderRadius: '50%',
                background: '#4338ca33', border: '1px solid #4338ca',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#818cf8', fontWeight: 700, fontSize: '1rem'
              }}>
                {mentor.name?.charAt(0)}
              </div>
              <div>
                <div style={{ color: '#f1f5f9', fontWeight: 600, fontSize: '0.95rem' }}>{mentor.name}</div>
                <div style={{ color: '#94a3b8', fontSize: '0.78rem' }}>{mentor.department}</div>
              </div>
            </div>
            <div style={{ borderTop: '1px solid #ffffff0a', marginTop: '12px', paddingTop: '10px', fontSize: '0.8rem', color: '#6366f1', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                <polyline points="22,6 12,13 2,6"></polyline>
              </svg>
              {mentor.email}
            </div>
          </div>
        )}
      </div>

      {/* Quick Access Grid or Banner */}
      <div style={{
        background: '#0f172a', border: '1px solid #1e293b',
        borderRadius: '16px', padding: '32px', marginBottom: '32px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px'
      }}>
        <div style={{ flex: 1, minWidth: '300px' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#f1f5f9', marginBottom: '8px' }}>Course Registration</h2>
          <p style={{ color: '#64748b', fontSize: '0.9rem', margin: 0 }}>
            You are currently registered for academic session. Please find your active courses below.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
           <div style={{ textAlign: 'center', padding: '0 20px' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#38bdf8' }}>{enrolled_courses?.length || 0}</div>
              <div style={{ fontSize: '0.7rem', color: '#475569', textTransform: 'uppercase' }}>Courses</div>
           </div>
           <div style={{ textAlign: 'center', padding: '0 20px', borderLeft: '1px solid #1e293b' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#22c55e' }}>{enrolled_courses?.reduce((sum, c) => sum + (c.credits || 0), 0)}</div>
              <div style={{ fontSize: '0.7rem', color: '#475569', textTransform: 'uppercase' }}>Credits</div>
           </div>
        </div>
      </div>

      {/* Enrolled Courses Section */}
      <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, color: '#e2e8f0', fontSize: '0.95rem', fontWeight: 600 }}>
            My Registered Courses
          </h3>
          <span style={{ fontSize: '0.75rem', color: '#64748b', background: '#1e293b', padding: '2px 10px', borderRadius: '20px' }}>
             Active Enrolment
          </span>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#0a0f1e' }}>
              {['Course Code', 'Course Name', 'Semester', 'Credits', 'Faculty'].map(h => (
                <th key={h} style={{
                  padding: '10px 16px', textAlign: 'left',
                  color: '#475569', fontSize: '0.75rem',
                  textTransform: 'uppercase', letterSpacing: '0.08em',
                  fontWeight: 600,
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {enrolled_courses?.map((c, i) => (
              <tr 
                key={c.id} 
                onClick={() => setSelectedCourseId(c.id)}
                style={{
                  borderTop: '1px solid #0f172a',
                  background: i % 2 === 0 ? 'transparent' : '#ffffff03',
                  cursor: 'pointer',
                  transition: 'background 0.2s'
                }}
                onMouseOver={e => e.currentTarget.style.background = '#ffffff07'}
                onMouseOut={e => e.currentTarget.style.background = i % 2 === 0 ? 'transparent' : '#ffffff03'}
              >
                <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                       <span style={{ color: '#38bdf8', fontSize: '0.85rem', fontWeight: 700, fontFamily: 'monospace' }}>{c.course_code}</span>
                       <span style={{ 
                         fontSize: '9px', fontWeight: 800, color: '#312e81', background: '#818cf822', 
                         padding: '1px 6px', borderRadius: '4px', border: '1px solid #818cf833', 
                         letterSpacing: '0.05em' 
                       }}>ACTIVE</span>
                    </div>
                </td>
                <td style={{ padding: '12px 16px' }}>
                   <div style={{ color: '#f1f5f9', fontSize: '0.875rem', fontWeight: 500 }}>{c.course_name}</div>
                   <div style={{ color: '#64748b', fontSize: '0.7rem', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                     View Syllabus & Materials 
                     <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                       <line x1="5" y1="12" x2="19" y2="12"></line>
                       <polyline points="12 5 19 12 12 19"></polyline>
                     </svg>
                   </div>
                </td>
                <td style={{ padding: '12px 16px', color: '#94a3b8', fontSize: '0.85rem' }}>Sem {c.semester}</td>
                <td style={{ padding: '12px 16px', color: '#94a3b8', fontSize: '0.85rem' }}>{c.credits} Cr</td>
                <td style={{ padding: '12px 16px', color: '#e2e8f0', fontSize: '0.85rem' }}>{c.faculty_name || 'Not assigned'}</td>
              </tr>
            ))}
            {(!enrolled_courses || enrolled_courses.length === 0) && (
              <tr>
                <td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: '#475569', fontSize: '0.9rem' }}>
                  No courses registered yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <StudentCourseDetailModal 
        courseId={selectedCourseId} 
        onClose={() => setSelectedCourseId(null)} 
      />
    </AppLayout>
  );
};

export default StudentDashboard;
