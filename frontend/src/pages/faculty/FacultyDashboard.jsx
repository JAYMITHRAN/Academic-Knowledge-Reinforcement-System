// src/pages/faculty/FacultyDashboard.jsx
import React, { useEffect, useState } from 'react';
import { getFacultyDashboard, getMentees, getCourseUnits, updateCourseUnits, facultyUploadMarksheet } from '../../services/api';
import AppLayout from '../../components/Layout/AppLayout';
import { useNavigate } from 'react-router-dom';

const LEVEL_COLOR = {
  weak: '#ef4444', needs_improvement: '#f59e0b', strong: '#22c55e',
};

const MarksManagementModal = ({ onClose, onImported, students, courses }) => {
  const [tab, setTab] = useState('bulk'); // 'bulk' | 'individual'
  const [file, setFile] = useState(null);
  const [maxMarks, setMaxMarks] = useState(30);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const fileInputRef = React.useRef(null);

  // Individual entry state
  const [indivData, setIndivData] = useState({
    studentId: '', courseId: '', unitNumber: 1, marks: '', examType: 'unit_test'
  });

  const handleDownloadTemplate = () => {
    const csvContent = "student_code,course_code,unit_1_marks,unit_2_marks,unit_3_marks,unit_4_marks,unit_5_marks,exam_type\nST1001,CS101,25,28,,,,\nST1002,CS101,,22,25,,,\n";
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'marks_import_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleBulkUpload = async () => {
    if (!file) return;
    setUploading(true);
    setResult(null);
    try {
      const res = await facultyUploadMarksheet(file, maxMarks);
      setResult({ success: true, data: res.data.summary });
      if (res.data.summary.success > 0) onImported();
    } catch (err) {
      setResult({ success: false, error: err.response?.data?.error || 'Upload failed' });
    } finally {
      setUploading(false);
    }
  };

  const handleIndividualSubmit = async (e) => {
    e.preventDefault();
    if (!indivData.studentId || !indivData.courseId || indivData.marks === '') return;
    setUploading(true);
    setResult(null);
    try {
      await facultyUpsertIndividualMark({ ...indivData, maxMarks });
      setResult({ success: true, message: 'Mark updated successfully!' });
      onImported();
    } catch (err) {
      setResult({ success: false, error: err.response?.data?.error || 'Update failed' });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)',
      zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center',
      backdropFilter: 'blur(8px)',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: '#0f172a', border: '1px solid #1e293b', borderRadius: '24px',
        padding: '32px', width: '100%', maxWidth: '600px', position: 'relative',
        boxShadow: '0 25px 60px rgba(0,0,0,0.8)', overflow: 'hidden'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h2 style={{ margin: 0, color: '#f1f5f9', fontSize: '1.4rem' }}>Manage Student Marks</h2>
            <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '1.5rem' }}>×</button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '4px', background: '#1e293b', padding: '4px', borderRadius: '12px', marginBottom: '28px' }}>
            <button 
                onClick={() => { setTab('bulk'); setResult(null); }}
                style={{
                    flex: 1, padding: '10px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem',
                    background: tab === 'bulk' ? '#0ea5e9' : 'transparent',
                    color: tab === 'bulk' ? '#fff' : '#94a3b8',
                }}
            >Bulk Import</button>
            <button 
                onClick={() => { setTab('individual'); setResult(null); }}
                style={{
                    flex: 1, padding: '10px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem',
                    background: tab === 'individual' ? '#0ea5e9' : 'transparent',
                    color: tab === 'individual' ? '#fff' : '#94a3b8',
                }}
            >Individual Entry</button>
        </div>

        {/* Shared Configuration */}
        <div style={{ marginBottom: '28px', padding: '20px', background: '#1e293b55', borderRadius: '16px', border: '1px solid #334155' }}>
          <label style={{ display: 'block', color: '#94a3b8', fontSize: '11px', fontWeight: 700, marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Test Configuration (Max Marks)
          </label>
          <div style={{ display: 'flex', gap: '8px' }}>
            {[30, 50, 100].map(m => (
              <button
                key={m}
                onClick={() => setMaxMarks(m)}
                style={{
                  flex: 1, padding: '12px', borderRadius: '10px', cursor: 'pointer',
                  border: '1px solid', fontWeight: 700, transition: '0.2s',
                  background: maxMarks === m ? '#1e1b4b' : 'transparent',
                  color: maxMarks === m ? '#818cf8' : '#64748b',
                  borderColor: maxMarks === m ? '#6366f1' : '#334155',
                }}
              >
                {m} Marks
              </button>
            ))}
          </div>
          <div style={{ marginTop: '12px', fontSize: '11px', color: '#475569', display: 'flex', justifyContent: 'space-between', padding: '0 4px' }}>
             <span style={{ color: '#ef4444' }}>Low: Below {maxMarks/2}</span>
             <span style={{ color: '#f59e0b' }}>Avg: {maxMarks/2}-{maxMarks*0.75}</span>
             <span style={{ color: '#22c55e' }}>Strong: Over {maxMarks*0.75}</span>
          </div>
        </div>

        {tab === 'bulk' ? (
          <div style={{ animation: 'fadeIn 0.3s ease' }}>
                <div style={{ marginBottom: '24px', padding: '16px', background: '#0ea5e90a', borderRadius: '12px', border: '1px dashed #0ea5e933' }}>
                    <p style={{ margin: '0 0 12px', fontSize: '13px', color: '#64748b' }}>Download the CSV template with unit-specific columns.</p>
                    <button onClick={handleDownloadTemplate} style={{
                        background: '#0ea5e922', color: '#0ea5e9', border: '1px solid #0ea5e944',
                        padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 600
                    }}>⬇ Template CSV</button>
                </div>

                <div style={{ marginBottom: '32px' }}>
                    <input
                        type="file"
                        accept=".csv, .xlsx"
                        onChange={e => setFile(e.target.files[0])}
                        ref={fileInputRef}
                        style={{ display: 'none' }}
                    />
                    <div onClick={() => fileInputRef.current?.click()} style={{ 
                        border: '2px dashed #334155', borderRadius: '16px', padding: '32px', textAlign: 'center', cursor: 'pointer',
                        background: file ? '#0ea5e90a' : 'transparent', borderColor: file ? '#0ea5e9' : '#334155', transition: '0.2s'
                    }}>
                        <div style={{ color: file ? '#0ea5e9' : '#475569', marginBottom: '16px' }}>
                          {file ? (
                            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto' }}>
                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                              <polyline points="14 2 14 8 20 8"></polyline>
                              <line x1="16" y1="13" x2="8" y2="13"></line>
                              <line x1="16" y1="17" x2="8" y2="17"></line>
                              <polyline points="10 9 9 9 8 9"></polyline>
                            </svg>
                          ) : (
                            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto' }}>
                              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                              <polyline points="17 8 12 3 7 8"></polyline>
                              <line x1="12" y1="3" x2="12" y2="15"></line>
                            </svg>
                          )}
                        </div>
                        <div style={{ color: '#cbd5e1', fontWeight: 600 }}>{file ? file.name : 'Click to select marksheets'}</div>
                        <div style={{ color: '#64748b', fontSize: '12px', marginTop: '4px' }}>Excel or CSV files only</div>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                    <button onClick={onClose} style={{ background: 'transparent', color: '#94a3b8', border: 'none', padding: '10px 20px', cursor: 'pointer' }}>Cancel</button>
                    <button onClick={handleBulkUpload} disabled={!file || uploading} style={{
                        background: '#0ea5e9', color: '#fff', border: 'none', borderRadius: '12px',
                        padding: '12px 32px', cursor: (!file || uploading) ? 'not-allowed' : 'pointer', fontWeight: 700,
                        boxShadow: '0 10px 25px rgba(14,165,233,0.3)', opacity: (!file || uploading) ? 0.6 : 1
                    }}>
                        {uploading ? 'Importing...' : 'Complete Import'}
                    </button>
                </div>
          </div>
        ) : (
          <form onSubmit={handleIndividualSubmit} style={{ animation: 'fadeIn 0.3s ease' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                    <div>
                        <label style={{ display: 'block', color: '#94a3b8', fontSize: '12px', marginBottom: '6px' }}>Student</label>
                        <select 
                            required
                            style={{ width: '100%', background: '#1e293b', color: '#fff', border: '1px solid #334155', borderRadius: '8px', padding: '10px' }}
                            value={indivData.studentId}
                            onChange={e => setIndivData({...indivData, studentId: e.target.value})}
                        >
                            <option value="">Select Student</option>
                            {students.map(s => <option key={s.id} value={s.id}>{s.name} ({s.student_code})</option>)}
                        </select>
                    </div>
                    <div>
                        <label style={{ display: 'block', color: '#94a3b8', fontSize: '12px', marginBottom: '6px' }}>Course</label>
                        <select 
                            required
                            style={{ width: '100%', background: '#1e293b', color: '#fff', border: '1px solid #334155', borderRadius: '8px', padding: '10px' }}
                            value={indivData.courseId}
                            onChange={e => setIndivData({...indivData, courseId: e.target.value})}
                        >
                            <option value="">Select Course</option>
                            {courses.map(c => <option key={c.id} value={c.id}>{c.course_name}</option>)}
                        </select>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '32px' }}>
                    <div>
                        <label style={{ display: 'block', color: '#94a3b8', fontSize: '12px', marginBottom: '6px' }}>Unit Number</label>
                        <select 
                            style={{ width: '100%', background: '#1e293b', color: '#fff', border: '1px solid #334155', borderRadius: '8px', padding: '10px' }}
                            value={indivData.unitNumber}
                            onChange={e => setIndivData({...indivData, unitNumber: e.target.value})}
                        >
                            {[1,2,3,4,5].map(n => <option key={n} value={n}>Unit {n}</option>)}
                        </select>
                    </div>
                    <div>
                        <label style={{ display: 'block', color: '#94a3b8', fontSize: '12px', marginBottom: '6px' }}>Marks Obtained</label>
                        <input 
                            type="number" min="0" max={maxMarks} required
                            placeholder={`Max ${maxMarks}`}
                            style={{ width: '100%', background: '#1e293b', color: '#fff', border: '1px solid #334155', borderRadius: '8px', padding: '10px' }}
                            value={indivData.marks}
                            onChange={e => setIndivData({...indivData, marks: e.target.value})}
                        />
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                    <button type="button" onClick={onClose} style={{ background: 'transparent', color: '#94a3b8', border: 'none', padding: '10px 20px', cursor: 'pointer' }}>Cancel</button>
                    <button type="submit" disabled={uploading} style={{
                        background: '#0ea5e9', color: '#fff', border: 'none', borderRadius: '12px',
                        padding: '12px 32px', cursor: uploading ? 'not-allowed' : 'pointer', fontWeight: 700,
                        boxShadow: '0 10px 25px rgba(14,165,233,0.3)', opacity: uploading ? 0.6 : 1
                    }}>
                        {uploading ? 'Updating...' : 'Update Mark'}
                    </button>
                </div>
          </form>
        )}

        {result && (
          <div style={{
            position: 'absolute', bottom: '24px', left: '32px', right: '32px',
            padding: '12px 16px', borderRadius: '12px', fontSize: '13px', zIndex: 10,
            background: result.success ? '#052e16' : '#450a0a',
            color: result.success ? '#4ade80' : '#f87171',
            border: `1px solid ${result.success ? '#166534' : '#7f1d1d'}`,
            animation: 'slideUp 0.3s ease'
          }}>
            {result.success ? (
               result.message || `Success! Imported ${result.data.success} rows.`
            ) : result.error}
          </div>
        )}
      </div>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
};

const FacultyDashboard = () => {
  const [dash,    setDash]    = useState(null);
  const [mentees, setMentees] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([getFacultyDashboard(), getMentees()])
      .then(([d, m]) => {
        setDash(d.data);
        setMentees(m.data.mentees);
      })
      .catch(err => {
        console.error('Dashboard load error:', err);
      })
      .finally(() => setLoading(false));
  }, []);

  // Syllabus Setup Modal State
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [unitsData, setUnitsData] = useState([]);
  const [loadingUnits, setLoadingUnits] = useState(false);
  const [savingUnits, setSavingUnits] = useState(false);
  const [unitMsg, setUnitMsg] = useState(null);
  
  // Marks Import Modal State
  const [showBulkImportMarks, setShowBulkImportMarks] = useState(false);

  const handleOpenCourse = (course) => {
    setSelectedCourse(course);
    setLoadingUnits(true);
    setUnitMsg(null);
    getCourseUnits(course.id)
      .then(res => {
        const fetchedUnits = res.data.units || [];
        // Ensure there are exactly 5 units to setup
        const populated = Array.from({ length: 5 }, (_, i) => {
          const num = i + 1;
          const exist = fetchedUnits.find(u => u.unit_number === num);
          return exist ? exist : { unit_number: num, title: '', description: '' };
        });
        setUnitsData(populated);
      })
      .catch(err => setUnitMsg({ text: 'Failed to load units', ok: false }))
      .finally(() => setLoadingUnits(false));
  };

  const handleSaveUnits = () => {
    setSavingUnits(true);
    setUnitMsg(null);
    updateCourseUnits(selectedCourse.id, unitsData)
      .then(res => setUnitMsg({ text: 'Syllabus updated successfully!', ok: true }))
      .catch(err => setUnitMsg({ text: err.response?.data?.error || 'Failed to save syllabus', ok: false }))
      .finally(() => setSavingUnits(false));
  };

  if (loading) return <AppLayout><p style={{ color: '#64748b' }}>Loading…</p></AppLayout>;
  if (!dash)   return <AppLayout><p style={{ color: '#ef4444' }}>Failed to load</p></AppLayout>;

  const { faculty, courses, mentee_count } = dash;

  return (
    <AppLayout>
      <h1 style={{ margin: '0 0 6px', fontSize: '1.8rem', fontWeight: 700, color: '#f1f5f9' }}>
        Faculty Dashboard
      </h1>
      <p style={{ color: '#64748b', marginBottom: '28px', fontSize: '0.88rem' }}>
        {faculty.department} · {faculty.employee_code}
      </p>

      {/* Quick stats */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '32px', flexWrap: 'wrap' }}>
        <div style={{
          background: '#0f172a', border: '1px solid #38bdf833',
          borderRadius: '12px', padding: '20px 28px', minWidth: '140px', flex: 1
        }}>
          <div style={{ color: '#38bdf8', marginBottom: '8px' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
            </svg>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: '#38bdf8' }}>{courses.length}</div>
          <div style={{ color: '#64748b', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: '4px' }}>
            My Courses
          </div>
        </div>

        <div style={{
          background: '#0f172a', border: '1px solid #a78bfa33',
          borderRadius: '12px', padding: '20px 28px', minWidth: '140px', flex: 1
        }}>
          <div style={{ color: '#a78bfa', marginBottom: '8px' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: '#a78bfa' }}>{mentee_count}</div>
          <div style={{ color: '#64748b', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: '4px' }}>
            Mentees
          </div>
        </div>

        {!!faculty.can_upload_marks && (
          <div style={{
            background: '#064e3b', border: '1px solid #10b98133',
            borderRadius: '12px', padding: '20px 28px',
            display: 'flex', flexDirection: 'column', justifyContent: 'center',
          }}>
            <div style={{ color: '#6ee7b7', fontSize: '0.8rem', fontWeight: 700, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
              Marks Upload Active
            </div>
            <button
              onClick={() => setShowBulkImportMarks(true)}
              style={{
                background: '#22c55e', color: '#fff', border: 'none',
                borderRadius: '6px', padding: '8px 16px',
                cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem',
              }}
            >
              Bulk Import Marks
            </button>
          </div>
        )}
      </div>

      {/* Courses */}
      <div style={{
        background: '#0f172a', border: '1px solid #1e293b',
        borderRadius: '12px', overflow: 'hidden', marginBottom: '28px',
      }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, color: '#e2e8f0', fontSize: '0.95rem' }}>My Courses</h3>
        </div>
        {courses.length === 0 ? (
          <p style={{ color: '#475569', padding: '24px' }}>No courses assigned yet.</p>
        ) : (
          <div style={{ padding: '12px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '12px' }}>
            {courses.map(c => (
              <div 
                key={c.id} 
                onClick={() => handleOpenCourse(c)}
                style={{
                  background: '#0a0f1e', borderRadius: '8px', padding: '16px',
                  border: '1px solid #1e293b', cursor: 'pointer',
                  transition: '0.2s'
                }}
                onMouseOver={e => e.currentTarget.style.background = '#ffffff07'}
                onMouseOut={e => e.currentTarget.style.background = '#0a0f1e'}
              >
                <div style={{ color: '#38bdf8', fontFamily: 'monospace', fontSize: '0.82rem', marginBottom: '6px' }}>
                  {c.course_code}
                </div>
                <div style={{ color: '#e2e8f0', fontWeight: 600, fontSize: '0.9rem' }}>{c.course_name}</div>
                <div style={{ color: '#64748b', fontSize: '0.75rem', marginTop: '6px', paddingBottom: '6px', borderBottom: '1px solid #1e293b' }}>
                  Sem {c.semester} · {c.credits} credits
                </div>
                <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '8px', textAlign: 'right', fontWeight: 600 }}>
                  Manage Syllabus →
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Mentees */}
      {mentees.length > 0 && (
        <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #1e293b' }}>
            <h3 style={{ margin: 0, color: '#e2e8f0', fontSize: '0.95rem' }}>Mentees Overview</h3>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#0a0f1e' }}>
                {['Student', 'Code', 'Dept / Year', 'Assessed', 'Weak', 'Needs Work', 'Strong', 'Detail'].map(h => (
                  <th key={h} style={{
                    padding: '10px 16px', textAlign: 'left',
                    color: '#475569', fontSize: '0.72rem',
                    textTransform: 'uppercase', letterSpacing: '0.08em',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {mentees.map((m, i) => (
                <tr key={m.student_id} style={{ borderTop: '1px solid #0f172a', background: i % 2 === 0 ? 'transparent' : '#ffffff03' }}>
                  <td style={{ padding: '12px 16px', color: '#e2e8f0', fontSize: '0.875rem', fontWeight: 500 }}>{m.name}</td>
                  <td style={{ padding: '12px 16px', color: '#64748b', fontSize: '0.8rem', fontFamily: 'monospace' }}>{m.student_code}</td>
                  <td style={{ padding: '12px 16px', color: '#94a3b8', fontSize: '0.8rem' }}>{m.department} / Y{m.year}</td>
                  <td style={{ padding: '12px 16px', color: '#64748b', fontSize: '0.875rem' }}>{m.total_courses}</td>
                  <td style={{ padding: '12px 16px', color: LEVEL_COLOR.weak, fontWeight: 700 }}>{m.weak_count}</td>
                  <td style={{ padding: '12px 16px', color: LEVEL_COLOR.needs_improvement, fontWeight: 700 }}>{m.improvement_count}</td>
                  <td style={{ padding: '12px 16px', color: LEVEL_COLOR.strong, fontWeight: 700 }}>{m.strong_count}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <button
                      onClick={() => navigate(`/faculty/mentees/${m.student_id}`)}
                      style={{
                        background: '#1e293b', color: '#94a3b8',
                        border: 'none', borderRadius: '6px',
                        padding: '4px 12px', cursor: 'pointer',
                        fontSize: '0.75rem',
                      }}
                    >
                      View →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Syllabus Modal Drawer */}
      {selectedCourse && (
        <div onClick={() => setSelectedCourse(null)} style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
          zIndex: 1000, display: 'flex', justifyContent: 'flex-end',
          backdropFilter: 'blur(8px)', transition: '0.3s'
        }}>
          <div onClick={e => e.stopPropagation()} style={{
            width: '100%', maxWidth: '600px', background: '#0f172a',
            height: '100vh', borderLeft: '1px solid #1e293b',
            padding: '32px', overflowY: 'auto', boxShadow: '-10px 0 30px rgba(0,0,0,0.5)',
            animation: 'slideIn 0.3s ease-out'
          }}>
            <style>{`
              @keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
            `}</style>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
              <div>
                <span style={{ color: '#38bdf8', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.15em' }}>SETUP SYLLABUS</span>
                <h2 style={{ margin: '4px 0 0', color: '#f1f5f9', fontSize: '1.4rem', fontWeight: 700 }}>
                  {selectedCourse.course_name}
                </h2>
              </div>
              <button onClick={() => setSelectedCourse(null)} style={{ 
                background: '#1e293b', color: '#94a3b8', border: 'none', borderRadius: '50%', 
                width: '36px', height: '36px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.2rem', transition: '0.2s',
              }} onMouseOver={e => e.target.style.background = '#334155'} onMouseOut={e => e.target.style.background = '#1e293b'}>✕</button>
            </div>

            {loadingUnits ? (
               <div style={{ padding: '80px 0', color: '#64748b', textAlign: 'center' }}>
                  <div style={{ width: '40px', height: '40px', border: '3px solid #1e293b', borderTopColor: '#38bdf8', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
                  <p style={{ fontSize: '14px' }}>Loading units...</p>
                  <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
               </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <p style={{ margin: '0 0 8px', color: '#64748b', fontSize: '14px' }}>
                    Define the 5 standard units and their theoretical descriptions for this course.
                  </p>
                  
                  {unitsData.map((unit, index) => (
                    <div key={index} style={{ background: '#0a0f1e', padding: '20px', borderRadius: '12px', border: '1px solid #1e293b' }}>
                        <h4 style={{ margin: '0 0 12px', color: '#cbd5e1', fontSize: '14px', fontWeight: 600 }}>Unit {unit.unit_number}</h4>
                        <div style={{ marginBottom: '12px' }}>
                          <label style={{ color: '#64748b', fontSize: '11px', textTransform: 'uppercase', marginBottom: '6px', display: 'block', fontWeight: 600 }}>Title *</label>
                          <input 
                            type="text"
                            placeholder={`e.g. Introduction to ${selectedCourse.course_name.split(' ')[0]}`}
                            value={unit.title}
                            onChange={(e) => {
                               const newUnits = [...unitsData];
                               newUnits[index].title = e.target.value;
                               setUnitsData(newUnits);
                            }}
                            style={{ width: '100%', background: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px', padding: '10px 14px', color: '#e2e8f0', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
                          />
                        </div>
                        <div>
                          <label style={{ color: '#64748b', fontSize: '11px', textTransform: 'uppercase', marginBottom: '6px', display: 'block', fontWeight: 600 }}>Description</label>
                          <textarea 
                            rows={3}
                            placeholder="Provide a brief syllabus description of the topics covered in this unit."
                            value={unit.description}
                            onChange={(e) => {
                               const newUnits = [...unitsData];
                               newUnits[index].description = e.target.value;
                               setUnitsData(newUnits);
                            }}
                            style={{ width: '100%', background: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px', padding: '10px 14px', color: '#e2e8f0', fontSize: '13px', outline: 'none', resize: 'vertical', boxSizing: 'border-box', marginBottom: '12px' }}
                          />
                        </div>
                        <div>
                          <label style={{ color: '#64748b', fontSize: '11px', textTransform: 'uppercase', marginBottom: '6px', display: 'block', fontWeight: 600 }}>Material Link (Drive/YouTube/PDF)</label>
                          <input 
                            type="text"
                            placeholder="https://..."
                            value={unit.material_link || ''}
                            onChange={(e) => {
                               const newUnits = [...unitsData];
                               newUnits[index].material_link = e.target.value;
                               setUnitsData(newUnits);
                            }}
                            style={{ width: '100%', background: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px', padding: '10px 14px', color: '#e2e8f0', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
                          />
                        </div>
                    </div>
                  ))}

                  {unitMsg && (
                    <div style={{
                      padding: '12px 16px', borderRadius: '8px', fontSize: '14px',
                      background: unitMsg.ok ? '#052e16' : '#450a0a',
                      color: unitMsg.ok ? '#4ade80' : '#f87171',
                      border: `1px solid ${unitMsg.ok ? '#166534' : '#7f1d1d'}`
                    }}>
                      {unitMsg.ok ? '✓ ' : '✗ '}{unitMsg.text}
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px', paddingBottom: '32px' }}>
                     <button
                       onClick={handleSaveUnits}
                       disabled={savingUnits}
                       style={{
                         background: 'linear-gradient(135deg, #0ea5e9, #6366f1)',
                         color: '#fff', border: 'none', borderRadius: '8px',
                         padding: '12px 28px', cursor: savingUnits ? 'not-allowed' : 'pointer', fontSize: '14px', fontWeight: 600,
                         opacity: savingUnits ? 0.7 : 1, boxShadow: '0 4px 12px rgba(99,102,241,0.3)'
                       }}
                     >
                       {savingUnits ? 'Saving...' : 'Save Syllabus Elements'}
                     </button>
                  </div>

                </div>
            )}
          </div>
        </div>
      )}
      {/* Marks Management Modal */}
      {showBulkImportMarks && (
        <MarksManagementModal 
          onClose={() => setShowBulkImportMarks(false)} 
          students={dash.students || []}
          courses={dash.courses || []}
          onImported={() => {
            window.location.reload(); 
          }}
        />
      )}
    </AppLayout>
  );
};

export default FacultyDashboard;
