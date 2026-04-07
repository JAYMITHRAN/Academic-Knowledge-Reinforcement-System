// src/pages/faculty/FacultyUpload.jsx
import React, { useEffect, useState, useRef } from 'react';
import { getFacultyStudents, getFacultyDashboard, facultyUploadMarksheet, facultyUpsertIndividualMark } from '../../services/api';
import AppLayout from '../../components/Layout/AppLayout';

const FacultyUpload = () => {
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [tab, setTab] = useState('bulk');
  const [file, setFile] = useState(null);
  const [maxMarks, setMaxMarks] = useState(30);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const fileInputRef = useRef(null);

  const [indivData, setIndivData] = useState({
    studentId: '', courseId: '', unitNumber: 1, marks: '', examType: 'unit_test'
  });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [rUser, rCourse] = await Promise.all([
          getFacultyStudents(),
          getFacultyDashboard()
        ]);
        // faculty/students returns { students: [...] }
        const allStudents = rUser.data.students || [];
        // Only use students that are enrolled in the course, mentees might have course_code === 'MENTEE'
        setStudents(allStudents.filter(s => !s.is_mentee)); 
        // faculty/dashboard returns { courses: [...] }
        setCourses(rCourse.data.courses || []);
      } catch (err) {
        console.error('Error fetching management data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

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
    } catch (err) {
      setResult({ success: false, error: err.response?.data?.error || 'Update failed' });
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
      return (
          <AppLayout>
              <p style={{ color: '#64748b' }}>Initializing Marks Management…</p>
          </AppLayout>
      );
  }

  return (
    <AppLayout>
      <div style={{ maxWidth: '800px' }}>
        <h1 style={{ margin: '0 0 8px', fontSize: '1.8rem', fontWeight: 700, color: '#f1f5f9' }}>
          Upload Marks
        </h1>
        <p style={{ color: '#64748b', marginBottom: '32px', fontSize: '0.88rem' }}>
          Bulk import or individually manage student academic records for your assigned courses
        </p>

        <div style={{
            background: '#0f172a', border: '1px solid #1e293b', borderRadius: '24px',
            padding: '32px', boxShadow: '0 20px 50px rgba(0,0,0,0.3)'
        }}>
            {/* Tabs */}
            <div style={{ display: 'flex', gap: '6px', background: '#0a0f1e', padding: '6px', borderRadius: '16px', marginBottom: '32px' }}>
                <button 
                    onClick={() => { setTab('bulk'); setResult(null); }}
                    style={{
                        flex: 1, padding: '12px', borderRadius: '12px', border: 'none', cursor: 'pointer', fontWeight: 800, fontSize: '0.9rem',
                        background: tab === 'bulk' ? '#0ea5e9' : 'transparent',
                        color: tab === 'bulk' ? '#fff' : '#475569',
                        transition: '0.2s'
                    }}
                >Bulk Import</button>
                <button 
                    onClick={() => { setTab('individual'); setResult(null); }}
                    style={{
                        flex: 1, padding: '12px', borderRadius: '12px', border: 'none', cursor: 'pointer', fontWeight: 800, fontSize: '0.9rem',
                        background: tab === 'individual' ? '#818cf8' : 'transparent',
                        color: tab === 'individual' ? '#fff' : '#475569',
                        transition: '0.2s'
                    }}
                >Individual Entry</button>
            </div>

            {/* Performance Bounds configuration */}
            <div style={{ marginBottom: '32px', padding: '24px', background: 'linear-gradient(to right, #1e293b, #0f172a)', borderRadius: '20px', border: '1px solid #334155' }}>
                <label style={{ display: 'block', color: '#94a3b8', fontSize: '10px', fontWeight: 800, marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                    Performance Bounds (Total {maxMarks})
                </label>
                <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                    {[30, 50, 100].map(m => (
                    <button
                        key={m}
                        onClick={() => setMaxMarks(m)}
                        style={{
                        flex: 1, padding: '14px', borderRadius: '14px', cursor: 'pointer',
                        border: '1px solid', fontWeight: 800, transition: '0.2s',
                        background: maxMarks === m ? '#1e1b4b' : 'transparent',
                        color: maxMarks === m ? '#c7d2fe' : '#475569',
                        borderColor: maxMarks === m ? '#6366f1' : '#1e293b',
                        }}
                    >
                        {m} PT
                    </button>
                    ))}
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <div style={{ flex: 1, height: '4px', borderRadius: '2px', background: '#ef4444', position: 'relative' }}>
                        <span style={{ position: 'absolute', top: '8px', left: 0, fontSize: '10px', color: '#ef4444', whiteSpace: 'nowrap' }}>Below {maxMarks/2} (WEAK)</span>
                    </div>
                    <div style={{ flex: 0.5, height: '4px', borderRadius: '2px', background: '#f59e0b', position: 'relative' }}>
                        <span style={{ position: 'absolute', top: '8px', left: 0, fontSize: '10px', color: '#f59e0b', whiteSpace: 'nowrap' }}>Avg</span>
                    </div>
                    <div style={{ flex: 0.5, height: '4px', borderRadius: '2px', background: '#22c55e', position: 'relative' }}>
                        <span style={{ position: 'absolute', top: '8px', left: 0, fontSize: '10px', color: '#22c55e', whiteSpace: 'nowrap' }}>Over {maxMarks*0.75} (STRONG)</span>
                    </div>
                </div>
            </div>

            {tab === 'bulk' ? (
            <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
                    <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Use the standard unit-wise CSV format.</div>
                        <button onClick={handleDownloadTemplate} style={{
                            background: 'transparent', color: '#0ea5e9', border: '1px solid #0ea5e966',
                            padding: '8px 16px', borderRadius: '10px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700
                        }}>⬇ Template</button>
                    </div>

                    <div style={{ marginBottom: '32px' }}>
                        <input type="file" accept=".csv, .xlsx" onChange={e => setFile(e.target.files[0])} ref={fileInputRef} style={{ display: 'none' }} />
                        <div onClick={() => fileInputRef.current?.click()} style={{ 
                            border: '2px dashed #1e293b', borderRadius: '20px', padding: '40px', textAlign: 'center', cursor: 'pointer',
                            background: file ? '#0ea5e908' : 'transparent', borderColor: file ? '#0ea5e9' : '#1e293b', transition: '0.3s'
                        }}>
                            <div style={{ fontSize: '3rem', marginBottom: '12px' }}>{file ? '📦' : '☁️'}</div>
                            <div style={{ color: '#cbd5e1', fontWeight: 700, fontSize: '1.1rem' }}>{file ? file.name : 'Drop marksheet here'}</div>
                            <div style={{ color: '#475569', fontSize: '0.8rem', marginTop: '4px' }}>Bulk processing for multiple units and students</div>
                        </div>
                    </div>

                    <button onClick={handleBulkUpload} disabled={!file || uploading} style={{
                        width: '100%', background: '#0ea5e9', color: '#fff', border: 'none', borderRadius: '16px',
                        padding: '16px', cursor: (!file || uploading) ? 'not-allowed' : 'pointer', fontWeight: 800, fontSize: '1rem',
                        boxShadow: '0 15px 30px rgba(14,165,233,0.3)', opacity: (!file || uploading) ? 0.6 : 1
                    }}>
                        {uploading ? 'Processing Data...' : 'Confirm Bulk Import'}
                    </button>
            </div>
            ) : (
            <form onSubmit={handleIndividualSubmit} style={{ animation: 'fadeIn 0.4s ease-out' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
                        <div>
                            <label style={{ display: 'block', color: '#64748b', fontSize: '11px', fontWeight: 700, marginBottom: '8px', textTransform: 'uppercase' }}>Student</label>
                            <select required value={indivData.studentId} onChange={e => setIndivData({...indivData, studentId: e.target.value})}
                                style={{ width: '100%', background: '#0a0f1e', color: '#fff', border: '1px solid #1e293b', borderRadius: '12px', padding: '14px', fontSize: '0.9rem' }}>
                                <option value="">Select Target Student</option>
                                {students.reduce((acc, current) => {
                                  const x = acc.find(item => item.id === current.id);
                                  if (!x) {
                                    return acc.concat([current]);
                                  } else {
                                    return acc;
                                  }
                                }, []).map(s => <option key={s.id} value={s.id}>{s.name} ({s.student_code})</option>)}
                            </select>
                        </div>
                        <div>
                            <label style={{ display: 'block', color: '#64748b', fontSize: '11px', fontWeight: 700, marginBottom: '8px', textTransform: 'uppercase' }}>Course</label>
                            <select required value={indivData.courseId} onChange={e => setIndivData({...indivData, courseId: e.target.value})}
                                style={{ width: '100%', background: '#0a0f1e', color: '#fff', border: '1px solid #1e293b', borderRadius: '12px', padding: '14px', fontSize: '0.9rem' }}>
                                <option value="">Select Course</option>
                                {courses.map(c => <option key={c.id} value={c.id}>{c.course_name} ({c.course_code})</option>)}
                            </select>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '40px' }}>
                        <div>
                            <label style={{ display: 'block', color: '#64748b', fontSize: '11px', fontWeight: 700, marginBottom: '8px', textTransform: 'uppercase' }}>Target Unit</label>
                            <select value={indivData.unitNumber} onChange={e => setIndivData({...indivData, unitNumber: e.target.value})}
                                style={{ width: '100%', background: '#0a0f1e', color: '#fff', border: '1px solid #1e293b', borderRadius: '12px', padding: '14px', fontSize: '0.9rem' }}>
                                {[1,2,3,4,5].map(n => <option key={n} value={n}>Unit {n} Performance</option>)}
                            </select>
                        </div>
                        <div>
                            <label style={{ display: 'block', color: '#64748b', fontSize: '11px', fontWeight: 700, marginBottom: '8px', textTransform: 'uppercase' }}>Score / {maxMarks}</label>
                            <input type="number" min="0" max={maxMarks} required value={indivData.marks} onChange={e => setIndivData({...indivData, marks: e.target.value})}
                                style={{ width: '100%', background: '#0a0f1e', color: '#fff', border: '1px solid #1e293b', borderRadius: '12px', padding: '14px', fontSize: '0.9rem' }} />
                        </div>
                    </div>

                    <button type="submit" disabled={uploading} style={{
                        width: '100%', background: '#818cf8', color: '#fff', border: 'none', borderRadius: '16px',
                        padding: '16px', cursor: uploading ? 'not-allowed' : 'pointer', fontWeight: 800, fontSize: '1rem',
                        boxShadow: '0 15px 30px rgba(129,140,248,0.3)', opacity: uploading ? 0.6 : 1
                    }}>
                        {uploading ? 'Updating Record...' : 'Confirm Record Update'}
                    </button>
            </form>
            )}

            {result && (
                <div style={{
                    marginTop: '24px', padding: '16px', borderRadius: '16px', fontSize: '14px',
                    background: result.success ? '#064e3b' : '#7f1d1d',
                    color: result.success ? '#d1fae5' : '#fee2e2',
                    border: `1px solid ${result.success ? '#059669' : '#b91c1c'}`,
                    animation: 'slideUp 0.3s ease-out', fontWeight: 600
                }}>
                    {result.success ? (result.message || `Import Success! ${result.data?.success} rows added.`) : result.error}
                </div>
            )}
        </div>
      </div>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: scale(0.98) translateY(10px); } to { opacity: 1; transform: scale(1) translateY(0); } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </AppLayout>
  );
};

export default FacultyUpload;
