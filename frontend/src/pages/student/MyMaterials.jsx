// src/pages/student/MyMaterials.jsx
import React, { useEffect, useState } from 'react';
import { getStudentPerformance, getStudentCourseDetail } from '../../services/api';
import AppLayout from '../../components/Layout/AppLayout';

const MyMaterials = () => {
  const [view,             setView]             = useState('courses'); // 'courses' or 'units'
  const [enrolledCourses,  setEnrolledCourses]  = useState([]);
  const [selectedCourse,   setSelectedCourse]   = useState(null);
  const [courseDetails,    setCourseDetails]    = useState(null);
  const [loading,          setLoading]          = useState(true);

  const fetchEnrolledCourses = () => {
    setLoading(true);
    getStudentPerformance()
      .then(res => {
        setEnrolledCourses(res.data.enrolled_courses || []);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  const fetchCourseUnits = (courseId) => {
    setLoading(true);
    getStudentCourseDetail(courseId)
      .then(res => {
        setCourseDetails(res.data);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchEnrolledCourses();
  }, []);

  const handleSelectCourse = (course) => {
    setSelectedCourse(course);
    setCourseDetails(null);
    setView('units');
    fetchCourseUnits(course.id);
  };

  const handleBack = () => {
    setView('courses');
    setSelectedCourse(null);
    setCourseDetails(null);
  };

  if (loading && view === 'courses') {
    return <AppLayout><p style={{ color: '#64748b' }}>Fetching your courses…</p></AppLayout>;
  }

  // View: Course selection list
  if (view === 'courses') {
    return (
      <AppLayout>
        <h1 style={{ margin: '0 0 8px', fontSize: '1.8rem', fontWeight: 700, color: '#f1f5f9' }}>
          Study Materials
        </h1>
        <p style={{ color: '#64748b', marginBottom: '32px', fontSize: '0.88rem' }}>
          Select a course to view its structure and study resources.
        </p>

        {enrolledCourses.length === 0 ? (
          <div style={{ padding: '60px', background: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px', textAlign: 'center' }}>
            <p style={{ color: '#475569' }}>You are not registered for any courses yet.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
            {enrolledCourses.map(course => (
              <div 
                key={course.id}
                onClick={() => handleSelectCourse(course)}
                style={{
                  background: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px',
                  padding: '24px', cursor: 'pointer', transition: '0.3s',
                  position: 'relative', overflow: 'hidden'
                }}
                onMouseOver={e => e.currentTarget.style.borderColor = '#38bdf844'}
                onMouseOut={e => e.currentTarget.style.borderColor = '#1e293b'}
              >
                <div style={{ fontSize: '0.72rem', color: '#38bdf8', fontWeight: 700, marginBottom: '8px', letterSpacing: '0.05em' }}>
                  {course.course_code}
                </div>
                <h3 style={{ margin: '0 0 16px', color: '#f1f5f9', fontSize: '1.1rem', fontWeight: 600 }}>
                  {course.course_name}
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontSize: '0.8rem' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                  {course.faculty_name || 'Assigned Faculty'}
                </div>
                <div style={{ position: 'absolute', bottom: '0', right: '0', padding: '16px', color: '#38bdf8', opacity: 0.1 }}>
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                  </svg>
                </div>
              </div>
            ))}
          </div>
        )}
      </AppLayout>
    );
  }

  // View: 5 Units Drill-down
  const units = courseDetails?.units || [];
  const populatedUnits = Array.from({ length: 5 }, (_, i) => {
    const num = i + 1;
    const existing = units.find(u => u.unit_number === num);
    return existing || { unit_number: num, title: '', description: '' };
  });

  return (
    <AppLayout>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
        <button 
          onClick={handleBack}
          style={{
            background: '#1e293b', color: '#94a3b8', border: 'none', borderRadius: '8px',
            padding: '8px 16px', cursor: 'pointer', fontSize: '0.85rem'
          }}
        >
          ← Back to Courses
        </button>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 700, color: '#f1f5f9' }}>
             {selectedCourse?.course_name}
          </h1>
          <p style={{ color: '#64748b', margin: 0, fontSize: '0.8rem' }}>Course Structure & Syllabus</p>
        </div>
      </div>

      {loading ? (
        <p style={{ color: '#64748b', padding: '40px' }}>Loading unit structure…</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
          {populatedUnits.map(unit => (
            <div 
              key={unit.unit_number}
              style={{
                background: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px',
                padding: '24px', opacity: unit.title ? 1 : 0.6
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <span style={{ 
                    background: '#38bdf815', color: '#38bdf8', border: '1px solid #38bdf833', 
                    borderRadius: '6px', padding: '2px 8px', fontSize: '0.7rem', fontWeight: 700
                }}>
                  UNIT {unit.unit_number}
                </span>
                {!unit.title && <span style={{ fontSize: '11px', color: '#475569' }}>Coming Soon</span>}
              </div>

              <h3 style={{ margin: '0 0 10px', color: '#e2e8f0', fontSize: '1rem', fontWeight: 600 }}>
                {unit.title || `Unit ${unit.unit_number} Title`}
              </h3>
              
              <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '20px', lineHeight: 1.6, minHeight: '44px' }}>
                {unit.description || 'The curriculum for this unit has not been specified yet. Materials will appear here once uploaded by the administration.'}
              </p>

              {unit.material_link ? (
                <a
                  href={unit.material_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '8px',
                    color: '#38bdf8', fontSize: '0.85rem', fontWeight: 600,
                    textDecoration: 'none'
                  }}
                >
                  Access Study Material 
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                    <polyline points="12 5 19 12 12 19"></polyline>
                  </svg>
                </a>
              ) : (
                <div style={{ color: '#334155', fontSize: '0.85rem', fontWeight: 500, fontStyle: 'italic' }}>
                  No link available yet
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </AppLayout>
  );
};

export default MyMaterials;
