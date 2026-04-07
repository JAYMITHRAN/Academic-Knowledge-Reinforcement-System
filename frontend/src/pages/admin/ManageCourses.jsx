import React, { useEffect, useState, useRef } from 'react';
import {
  listCourses, getCourseDetail, enrollStudent, bulkEnrollStudents, createCourse, assignFaculty,
  listUsers, assignMentor, setUploadPermission,
  bulkImportCourses, adminUpdateCourseUnits, adminBulkImportUnits,
  adminUploadMarksheet, adminUpsertIndividualMark
} from '../../services/api';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import AppLayout from '../../components/Layout/AppLayout';

const inputStyle = {
  width: '100%', background: '#0a0f1e', border: '1px solid #1e293b',
  borderRadius: '8px', padding: '10px 14px', color: '#e2e8f0',
  fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box',
};

const SectionCard = ({ title, children }) => (
  <div style={{
    background: '#0f172a', border: '1px solid #1e293b',
    borderRadius: '12px', overflow: 'hidden', marginBottom: '24px',
  }}>
    <div style={{ padding: '16px 20px', borderBottom: '1px solid #1e293b' }}>
      <h3 style={{ margin: 0, color: '#e2e8f0', fontSize: '0.95rem', fontWeight: 600 }}>{title}</h3>
    </div>
    <div style={{ padding: '20px' }}>{children}</div>
  </div>
);

const BulkImportModal = ({ onClose, onImported }) => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const fileInputRef = useRef(null);

  const handleDownloadTemplate = () => {
    const csvContent = "course_code,course_name,department,semester,credits,faculty_email\nCS101,Intro to Computing,CSE,1,3,faculty@example.com\nMA201,Calculus II,Math,2,4,\n";
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'course_import_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setResult(null);
    try {
      const res = await bulkImportCourses(file);
      setResult({ success: true, data: res.data.summary });
    } catch (err) {
      setResult({ success: false, error: err.response?.data?.error || 'Upload failed' });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
      zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center',
      backdropFilter: 'blur(4px)',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px',
        padding: '32px', width: '100%', maxWidth: '520px', position: 'relative',
        boxShadow: '0 25px 60px rgba(0,0,0,0.6)',
      }}>
        <h3 style={{ margin: '0 0 20px', color: '#f1f5f9' }}>Bulk Import Courses</h3>
        
        <div style={{ marginBottom: '24px', padding: '16px', background: '#1e293b55', borderRadius: '8px', border: '1px solid #334155' }}>
          <p style={{ margin: '0 0 10px', fontSize: '14px', color: '#94a3b8' }}>
            1. Download the template and fill in your course data.
          </p>
          <button onClick={handleDownloadTemplate} style={{
            background: '#ffffff11', color: '#e2e8f0', border: '1px solid #334155',
            padding: '6px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px'
          }}>⬇ Download Template (CSV)</button>
        </div>

        <div style={{ marginBottom: '24px' }}>
          <p style={{ margin: '0 0 10px', fontSize: '14px', color: '#94a3b8' }}>
            2. Upload your completed file (.csv or .xlsx)
          </p>
          <input 
            type="file" 
            accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
            onChange={e => setFile(e.target.files[0])}
            ref={fileInputRef}
            style={{ display: 'none' }}
          />
          <div style={{ display: 'flex', gap: '10px' }}>
             <button onClick={() => fileInputRef.current?.click()} style={{
              background: '#0ea5e9', color: '#fff', border: 'none', borderRadius: '6px',
              padding: '8px 16px', cursor: 'pointer', fontSize: '14px', fontWeight: 500
             }}>Select File</button>
             <span style={{ alignSelf: 'center', fontSize: '13px', color: '#cbd5e1' }}>
               {file ? file.name : 'No file chosen'}
             </span>
          </div>
        </div>

        {result && (
          <div style={{
            padding: '12px 16px', borderRadius: '8px', marginBottom: '20px', fontSize: '14px',
            background: result.success ? (result.data.failed === 0 ? '#052e16' : '#451a03') : '#1a0a0a',
            color: result.success ? (result.data.failed === 0 ? '#86efac' : '#fdba74') : '#fca5a5',
            border: `1px solid ${result.success ? (result.data.failed === 0 ? '#166534' : '#9a3412') : '#ef4444'}`,
            maxHeight: '150px', overflowY: 'auto'
          }}>
            {result.success ? (
              <>
                <div style={{ fontWeight: 600, marginBottom: '8px' }}>
                  Successfully imported: {result.data.success} | Failed: {result.data.failed}
                </div>
                {result.data.errors && result.data.errors.length > 0 && (
                  <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px' }}>
                    {result.data.errors.map((e, idx) => (
                      <li key={idx}>Row {e.row}: {e.error}</li>
                    ))}
                  </ul>
                )}
              </>
            ) : (
              <div>Error: {result.error}</div>
            )}
          </div>
        )}

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', borderTop: '1px solid #1e293b', paddingTop: '20px' }}>
          <button onClick={() => {
            if (result?.success && result.data.success > 0) onImported();
            onClose();
          }} style={{
            background: 'transparent', color: '#94a3b8', border: '1px solid #334155',
            borderRadius: '8px', padding: '8px 20px', cursor: 'pointer', fontSize: '14px'
          }}>Close</button>
          
          <button onClick={handleUpload} disabled={!file || uploading} style={{
            background: '#22c55e', color: '#fff', border: 'none', borderRadius: '8px',
            padding: '8px 24px', cursor: (!file || uploading) ? 'not-allowed' : 'pointer', fontSize: '14px', fontWeight: 600,
            opacity: (!file || uploading) ? 0.6 : 1
          }}>
            {uploading ? 'Uploading...' : 'Upload & Import'}
          </button>
        </div>
      </div>
    </div>
  );
};


const CourseDetailDrawer = ({ courseId, onClose, allStudents = [] }) => {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [bulkEnrolling, setBulkEnrolling] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [studentSearch, setStudentSearch] = useState('');
  const [enrollMsg, setEnrollMsg] = useState(null);
  const fileInputRef = useRef(null);
  // Units (Syllabus) state
  const [unitsData, setUnitsData] = useState([]);
  const [savingUnits, setSavingUnits] = useState(false);
  const [unitMsg, setUnitMsg] = useState(null);
  const unitFileInputRef = useRef(null);
  const [showMarksModal, setShowMarksModal] = useState(false);

  const fetchDetail = () => {
    if (!courseId) return;
    setLoading(true);
    getCourseDetail(courseId)
      .then(res => {
        setDetail(res.data);
        // Init units — ensure exactly 5 slots
        const fetched = res.data.units || [];
        const populated = Array.from({ length: 5 }, (_, i) => {
          const num = i + 1;
          const exist = fetched.find(u => u.unit_number === num);
          return exist ? exist : { unit_number: num, title: '', description: '' };
        });
        setUnitsData(populated);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  const handleSaveUnits = () => {
    setSavingUnits(true);
    setUnitMsg(null);
    adminUpdateCourseUnits(courseId, unitsData)
      .then(() => setUnitMsg({ text: 'Syllabus saved successfully!', ok: true }))
      .catch(err => setUnitMsg({ text: err.response?.data?.error || 'Save failed', ok: false }))
      .finally(() => setSavingUnits(false));
  };

  useEffect(() => {
    fetchDetail();
  }, [courseId]);

  const handleEnroll = async () => {
    if (!selectedStudentId) return;
    setEnrolling(true);
    setEnrollMsg(null);
    try {
      await enrollStudent(courseId, selectedStudentId);
      setEnrollMsg({ text: 'Student enrolled!', ok: true });
      setSelectedStudentId('');
      setStudentSearch('');
      fetchDetail();
      setTimeout(() => setEnrollMsg(null), 4000);
    } catch (err) {
      setEnrollMsg({ text: err.response?.data?.error || 'Enrollment failed', ok: false });
    } finally {
      setEnrolling(false);
    }
  };

  const handleBulkEnroll = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setBulkEnrolling(true);
    setEnrollMsg(null);
    try {
      const res = await bulkEnrollStudents(courseId, file);
      const summary = res.data.summary;
      setEnrollMsg({ 
        text: `Bulk Enrollment: ${summary.success} success, ${summary.failed} failed. ${summary.failed > 0 ? (summary.errors[0]?.error || '') : ''}`, 
        ok: summary.failed === 0 
      });
      fetchDetail();
    } catch (err) {
      setEnrollMsg({ text: err.response?.data?.error || 'Bulk upload failed', ok: false });
    } finally {
      setBulkEnrolling(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  if (!courseId) return null;

  // Find students not yet in this course
  const enrolledStudentCodes = detail?.students?.map(s => s.student_code) || [];
  const availableStudents = allStudents.filter(s => s.role === 'student' && !enrolledStudentCodes.includes(s.student_code));

  const filteredStudents = availableStudents.filter(s => 
    s.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
    s.student_code.toLowerCase().includes(studentSearch.toLowerCase())
  );

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
      zIndex: 1000, display: 'flex', justifyContent: 'flex-end',
      backdropFilter: 'blur(8px)', transition: '0.3s'
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        width: '100%', maxWidth: '520px', background: '#0f172a',
        height: '100vh', borderLeft: '1px solid #1e293b',
        padding: '32px', overflowY: 'auto', boxShadow: '-10px 0 30px rgba(0,0,0,0.5)',
        animation: 'slideIn 0.3s ease-out'
      }}>
        <style>{`
          @keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
        `}</style>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
             <div>
                <span style={{ color: '#38bdf8', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.15em' }}>COURSE ANALYTICS</span>
                <h2 style={{ margin: '4px 0 0', color: '#f1f5f9', fontSize: '1.4rem', fontWeight: 700 }}>
                  {loading ? 'Fetching...' : detail?.course?.course_name}
                </h2>
             </div>
             <button onClick={onClose} style={{ 
               background: '#1e293b', color: '#94a3b8', border: 'none', borderRadius: '50%', 
               width: '36px', height: '36px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
               fontSize: '1.2rem', transition: '0.2s',
             }} onMouseOver={e => e.target.style.background = '#334155'} onMouseOut={e => e.target.style.background = '#1e293b'}>✕</button>
        </div>

        {loading ? (
             <div style={{ padding: '80px 0', color: '#64748b', textAlign: 'center' }}>
                <div style={{ width: '40px', height: '40px', border: '3px solid #1e293b', borderTopColor: '#38bdf8', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
                <p style={{ fontSize: '14px' }}>Loading detailed insights...</p>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
             </div>
        ) : detail && (
             <>
                {/* Information Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '32px' }}>
                    {[
                      { l: 'CODE', v: detail.course.course_code },
                      { l: 'CREDITS', v: detail.course.credits },
                      { l: 'SEMESTER', v: detail.course.semester || 'N/A' },
                      { l: 'DEPARTMENT', v: detail.course.department || 'General' },
                    ].map((it, idx) => (
                      <div key={idx} style={{ background: '#1e293b55', padding: '16px', borderRadius: '12px', border: '1px solid #1e293b' }}>
                          <div style={{ fontSize: '10px', color: '#64748b', marginBottom: '6px', fontWeight: 600 }}>{it.l}</div>
                          <div style={{ color: '#e2e8f0', fontWeight: 600, fontSize: '14px' }}>{it.v}</div>
                      </div>
                    ))}
                </div>

                {/* Faculty Highlight */}
                <div style={{ marginBottom: '32px', padding: '20px', borderRadius: '16px', border: '1px solid #6366f144', background: 'linear-gradient(135deg, #0f172a, #1a1b3a)', position: 'relative', overflow: 'hidden' }}>
                     <div style={{ position: 'absolute', top: -10, right: -10, fontSize: '80px', color: '#6366f108', fontWeight: 900, pointerEvents: 'none' }}>PROF</div>
                     <div style={{ fontSize: '11px', color: '#6366f1', textTransform: 'uppercase', marginBottom: '14px', fontWeight: 700, letterSpacing: '0.05em' }}>Faculty Lead</div>
                     {detail.course.faculty_name ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                           <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#6366f122', color: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', fontWeight: 700, border: '1px solid #6366f133' }}>
                             {detail.course.faculty_name[0]}
                           </div>
                           <div>
                              <div style={{ color: '#f1f5f9', fontWeight: 600, fontSize: '15px' }}>{detail.course.faculty_name}</div>
                              <div style={{ color: '#94a3b8', fontSize: '12px', marginTop: '2px' }}>{detail.course.faculty_email}</div>
                           </div>
                        </div>
                     ) : (
                        <div style={{ color: '#475569', fontSize: '14px', fontStyle: 'italic' }}>No faculty assigned yet</div>
                     )}
                </div>

                {/* Course Syllabus / Units — Editable */}
                <div style={{ marginBottom: '32px', padding: '20px', borderRadius: '16px', background: '#0a0f1e', border: '1px solid #1e293b' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <h4 style={{ color: '#94a3b8', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', margin: 0 }}>Course Syllabus</h4>
                        <button
                          onClick={handleSaveUnits}
                          disabled={savingUnits}
                          style={{
                            background: 'linear-gradient(135deg, #0ea5e9, #6366f1)', color: '#fff',
                            border: 'none', borderRadius: '6px', padding: '6px 18px',
                            cursor: savingUnits ? 'not-allowed' : 'pointer', fontSize: '12px', fontWeight: 600,
                            opacity: savingUnits ? 0.7 : 1,
                          }}
                        >
                          {savingUnits ? 'Saving...' : 'Save Syllabus'}
                        </button>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                        {unitsData.map((unit, index) => (
                            <div key={index} style={{ background: '#1e293b55', padding: '16px', borderRadius: '12px', border: '1px solid #1e293b' }}>
                                <div style={{ color: '#38bdf8', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '10px' }}>Unit {unit.unit_number}</div>
                                <input
                                    type="text"
                                    placeholder="Unit title..."
                                    value={unit.title || ''}
                                    onChange={(e) => {
                                        const n = [...unitsData];
                                        n[index] = { ...n[index], title: e.target.value };
                                        setUnitsData(n);
                                    }}
                                    style={{ ...inputStyle, marginBottom: '8px', fontSize: '13px' }}
                                />
                                <textarea
                                    rows={2}
                                    placeholder="Short topic description for this unit..."
                                    value={unit.description || ''}
                                    onChange={(e) => {
                                        const n = [...unitsData];
                                        n[index] = { ...n[index], description: e.target.value };
                                        setUnitsData(n);
                                    }}
                                    style={{ ...inputStyle, resize: 'vertical', fontSize: '13px', marginBottom: '8px' }}
                                />
                                <input
                                    type="text"
                                    placeholder="Resource Link (Drive/YouTube/PDF)..."
                                    value={unit.material_link || ''}
                                    onChange={(e) => {
                                        const n = [...unitsData];
                                        n[index] = { ...n[index], material_link: e.target.value };
                                        setUnitsData(n);
                                    }}
                                    style={{ ...inputStyle, fontSize: '13px' }}
                                />
                            </div>
                        ))}
                    </div>
                    {unitMsg && (
                        <div style={{
                            marginTop: '12px', padding: '10px 14px', borderRadius: '8px', fontSize: '13px',
                            background: unitMsg.ok ? '#052e16' : '#450a0a',
                            color: unitMsg.ok ? '#4ade80' : '#f87171',
                            border: `1px solid ${unitMsg.ok ? '#166534' : '#7f1d1d'}`
                        }}>
                            {unitMsg.ok ? '✓ ' : '✗ '}{unitMsg.text}
                        </div>
                    )}
                </div>

                {/* Enroll New Student */}
                <div style={{ marginBottom: '32px', padding: '20px', borderRadius: '16px', background: '#0a0f1e', border: '1px solid #1e293b' }}>
                    <h4 style={{ color: '#f1f5f9', fontSize: '0.9rem', marginBottom: '16px', fontWeight: 600 }}>Enroll New Student</h4>
                    
                    <div style={{ marginBottom: '12px' }}>
                        <input 
                          type="text"
                          placeholder="Search student by name or code..."
                          style={{ ...inputStyle, fontSize: '13px' }}
                          value={studentSearch}
                          onChange={e => setStudentSearch(e.target.value)}
                        />
                    </div>

                    <div style={{ display: 'flex', gap: '10px' }}>
                        <select 
                          style={{ ...inputStyle, flex: 1 }} 
                          value={selectedStudentId}
                          onChange={e => setSelectedStudentId(e.target.value)}
                        >
                            <option value="">{studentSearch ? `Results (${filteredStudents.length})` : 'Select a student...'}</option>
                            {filteredStudents.map(s => (
                                <option key={s.id} value={s.id}>{s.name} ({s.student_code})</option>
                            ))}
                        </select>
                        <button 
                          onClick={handleEnroll}
                          disabled={!selectedStudentId || enrolling}
                          style={{
                            background: '#0ea5e9', color: '#fff', border: 'none', borderRadius: '8px',
                            padding: '0 16px', cursor: (!selectedStudentId || enrolling) ? 'not-allowed' : 'pointer',
                            fontSize: '14px', fontWeight: 600, opacity: (!selectedStudentId || enrolling) ? 0.6 : 1
                          }}
                        >
                            {enrolling ? '...' : 'Enroll'}
                        </button>
                        
                        <input
                          type="file"
                          accept=".csv, .xlsx"
                          onChange={handleBulkEnroll}
                          style={{ display: 'none' }}
                          ref={fileInputRef}
                        />
                        <button 
                          onClick={() => fileInputRef.current?.click()}
                          disabled={bulkEnrolling}
                          style={{
                            background: '#1e293b', color: '#e2e8f0', border: '1px solid #334155', borderRadius: '8px',
                            padding: '0 16px', cursor: bulkEnrolling ? 'not-allowed' : 'pointer',
                            fontSize: '14px', fontWeight: 600, opacity: bulkEnrolling ? 0.6 : 1,
                            whiteSpace: 'nowrap'
                          }}
                        >
                            {bulkEnrolling ? 'Uploading...' : 'Bulk Upload'}
                        </button>
                    </div>
                    {enrollMsg && (
                        <div style={{ marginTop: '12px', fontSize: '13px', color: enrollMsg.ok ? '#4ade80' : '#f87171' }}>
                            {enrollMsg.ok ? '✓ ' : '✗ '}{enrollMsg.text}
                        </div>
                    )}
                </div>

                {/* Performance Visualisation */}
                <div style={{ marginBottom: '32px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '16px' }}>
                      <h4 style={{ color: '#94a3b8', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase' }}>Performance Chart</h4>
                      <span style={{ fontSize: '11px', color: '#475569' }}>Based on {detail.students.length} marks</span>
                    </div>
                    <div style={{ height: '220px', background: '#0a0f1e', padding: '20px', borderRadius: '12px', border: '1px solid #1e293b' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={detail.distribution}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                                <XAxis dataKey="performance_level" tick={{ fill: '#64748b', fontSize: 10 }} />
                                <YAxis tick={{ fill: '#64748b', fontSize: 10 }} />
                                <Tooltip 
                                  cursor={{ fill: 'transparent' }} 
                                  contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', fontSize: '12px' }} 
                                />
                                <Bar dataKey="count" radius={[4,4,0,0]} barSize={40}>
                                    {detail.distribution.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={
                                            entry.performance_level === 'strong' ? '#22c55e' :
                                            entry.performance_level === 'needs_improvement' ? '#f59e0b' : '#ef4444'
                                        } />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Marks Management Trigger */}
                <div style={{ marginBottom: '32px' }}>
                    <button 
                        onClick={() => setShowMarksModal(true)}
                        style={{
                            width: '100%', padding: '16px', borderRadius: '16px', background: '#312e81', color: '#fff',
                            border: '1px solid #4338ca', cursor: 'pointer', fontWeight: 800, fontSize: '0.9rem',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px'
                        }}
                    >
                        📝 Manage Course Marks (Bulk/Indiv)
                    </button>
                    {showMarksModal && (
                      <MarksManagementModal 
                        initialCourseId={courseId}
                        students={allStudents.filter(s => s.role === 'student')}
                        courses={[detail.course]}
                        onClose={() => setShowMarksModal(false)}
                        onImported={() => {
                            fetchDetail();
                        }}
                      />
                    )}
                </div>

                {/* Student Roster */}
                <div>
                    <h4 style={{ color: '#94a3b8', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: '16px' }}>
                        Enrolled Students ({detail.students.length})
                    </h4>
                    {detail.students.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '32px', color: '#475569', background: '#0a0f1e', borderRadius: '12px', border: '1px solid #1e293b', fontSize: '13px' }}>
                            No students enrolled yet.
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {detail.students.map((s, idx) => (
                                <div key={idx} style={{
                                    display: 'flex', alignItems: 'center', gap: '12px',
                                    background: '#0a0f1e', border: '1px solid #1e293b',
                                    borderRadius: '10px', padding: '12px 16px',
                                }}>
                                    <div style={{
                                        width: '34px', height: '34px', borderRadius: '50%', flexShrink: 0,
                                        background: '#38bdf822', border: '1px solid #38bdf844',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: '13px', fontWeight: 700, color: '#38bdf8',
                                    }}>
                                        {s.name?.charAt(0).toUpperCase()}
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ color: '#e2e8f0', fontWeight: 600, fontSize: '14px' }}>{s.name}</div>
                                        <div style={{ color: '#64748b', fontSize: '11px', marginTop: '2px' }}>{s.student_code}</div>
                                    </div>
                                    <div style={{ fontSize: '11px', color: '#475569' }}>#{idx + 1}</div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
             </>
        )}
      </div>
    </div>
  );
};

const ManageCourses = () => {
  const [courses,  setCourses]  = useState([]);
  const [faculty,  setFaculty]  = useState([]);
  const [students, setStudents] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [msg,      setMsg]      = useState({ text: '', ok: true });
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState(null);
  const [courseSearch, setCourseSearch] = useState('');

  // Forms
  const [courseForm, setCourseForm] = useState({
    course_code: '', course_name: '', department: '', semester: '', credits: 3,
  });
  const [assignForm, setAssignForm] = useState({ course_id: '', faculty_user_id: '' });
  const [mentorForm, setMentorForm] = useState({ mentor_user_id: '', student_user_id: '' });
  const [permForm,   setPermForm]   = useState({ faculty_user_id: '', can_upload: false });

  const showMsg = (text, ok = true) => {
    setMsg({ text, ok });
    setTimeout(() => setMsg({ text: '', ok: true }), 4000);
  };

  const loadAll = async () => {
    setLoading(true);
    try {
      const [c, f, s] = await Promise.all([
        listCourses(),
        listUsers('faculty'),
        listUsers('student'),
      ]);
      setCourses(c.data.courses);
      setFaculty(f.data.users);
      setStudents(s.data.users);
    } catch (err) {
      showMsg('✗ Failed to load data: ' + (err.response?.data?.error || err.message), false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAll(); }, []);

  const handleCreateCourse = async (e) => {
    e.preventDefault();
    try {
      await createCourse(courseForm);
      showMsg('✓ Course created');
      setCourseForm({ course_code: '', course_name: '', department: '', semester: '', credits: 3 });
      loadAll();
    } catch (err) {
      showMsg('✗ ' + (err.response?.data?.error || 'Failed'), false);
    }
  };

  const handleAssignFaculty = async (e) => {
    e.preventDefault();
    try {
      await assignFaculty(assignForm);
      showMsg('✓ Faculty assigned to course');
      setAssignForm({ course_id: '', faculty_user_id: '' });
      loadAll();
    } catch (err) {
      showMsg('✗ ' + (err.response?.data?.error || 'Failed'), false);
    }
  };

  const handleAssignMentor = async (e) => {
    e.preventDefault();
    try {
      await assignMentor(mentorForm);
      showMsg('✓ Mentor assigned');
      setMentorForm({ mentor_user_id: '', student_user_id: '' });
    } catch (err) {
      showMsg('✗ ' + (err.response?.data?.error || 'Failed'), false);
    }
  };

  const handleSetPermission = async (e) => {
    e.preventDefault();
    try {
      await setUploadPermission(permForm);
      showMsg(`✓ Upload permission ${permForm.can_upload ? 'granted' : 'revoked'}`);
      setPermForm({ faculty_user_id: '', can_upload: false });
    } catch (err) {
      showMsg('✗ ' + (err.response?.data?.error || 'Failed'), false);
    }
  };

  const MsgBanner = () => msg.text ? (
    <div style={{
      padding: '12px 16px', borderRadius: '8px', marginBottom: '20px',
      background: msg.ok ? '#052e16' : '#1a0a0a',
      color: msg.ok ? '#86efac' : '#fca5a5',
      border: `1px solid ${msg.ok ? '#22c55e44' : '#ef444444'}`,
      fontSize: '0.875rem',
    }}>{msg.text}</div>
  ) : null;

  return (
    <AppLayout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
        <div>
          <h1 style={{ margin: '0 0 8px', fontSize: '1.6rem', fontWeight: 700, color: '#f1f5f9' }}>
            Course Management
          </h1>
          <p style={{ color: '#64748b', margin: 0, fontSize: '0.88rem' }}>
            Create courses, assign faculty, manage mentorship, and control upload permissions.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button onClick={() => setShowBulkImport(true)} style={{
            background: '#1e293b', color: '#e2e8f0', border: '1px solid #334155', borderRadius: '8px',
            padding: '10px 20px', cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem',
          }}>
            Bulk Import Courses
          </button>
        </div>
      </div>

      {showBulkImport && (
        <BulkImportModal
          onClose={() => setShowBulkImport(false)}
          onImported={loadAll}
        />
      )}


      {selectedCourseId && (
        <CourseDetailDrawer 
          courseId={selectedCourseId} 
          onClose={() => setSelectedCourseId(null)} 
          allStudents={students}
        />
      )}

      <MsgBanner />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>

        {/* ── Create Course ── */}
        <SectionCard title="Create New Course">
          <form onSubmit={handleCreateCourse}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ color: '#64748b', fontSize: '0.78rem', display: 'block', marginBottom: '6px' }}>Course Code *</label>
                <input style={inputStyle} required placeholder="CS301"
                  value={courseForm.course_code}
                  onChange={e => setCourseForm({ ...courseForm, course_code: e.target.value })} />
              </div>
              <div>
                <label style={{ color: '#64748b', fontSize: '0.78rem', display: 'block', marginBottom: '6px' }}>Course Name *</label>
                <input style={inputStyle} required placeholder="Database Management Systems"
                  value={courseForm.course_name}
                  onChange={e => setCourseForm({ ...courseForm, course_name: e.target.value })} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ color: '#64748b', fontSize: '0.78rem', display: 'block', marginBottom: '6px' }}>Department</label>
                  <input style={inputStyle} placeholder="CSE"
                    value={courseForm.department}
                    onChange={e => setCourseForm({ ...courseForm, department: e.target.value })} />
                </div>
                <div>
                  <label style={{ color: '#64748b', fontSize: '0.78rem', display: 'block', marginBottom: '6px' }}>Semester</label>
                  <select style={inputStyle}
                    value={courseForm.semester}
                    onChange={e => setCourseForm({ ...courseForm, semester: e.target.value })}>
                    <option value="">—</option>
                    {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>Sem {s}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ color: '#64748b', fontSize: '0.78rem', display: 'block', marginBottom: '6px' }}>Credits</label>
                  <input style={inputStyle} type="number" min="1" max="6"
                    value={courseForm.credits}
                    onChange={e => setCourseForm({ ...courseForm, credits: e.target.value })} />
                </div>
              </div>
              <button type="submit" style={{
                background: 'linear-gradient(135deg, #0ea5e9, #6366f1)',
                color: '#fff', border: 'none', borderRadius: '8px',
                padding: '10px', cursor: 'pointer', fontWeight: 600, marginTop: '4px',
              }}>
                Create Course
              </button>
            </div>
          </form>
        </SectionCard>

        {/* ── Assign Faculty ── */}
        <SectionCard title="Assign Faculty to Course">
          <form onSubmit={handleAssignFaculty}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ color: '#64748b', fontSize: '0.78rem', display: 'block', marginBottom: '6px' }}>Course *</label>
                <select style={inputStyle} required
                  value={assignForm.course_id}
                  onChange={e => setAssignForm({ ...assignForm, course_id: e.target.value })}>
                  <option value="">Select course</option>
                  {courses.map(c => (
                    <option key={c.id} value={c.id}>{c.course_code} — {c.course_name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ color: '#64748b', fontSize: '0.78rem', display: 'block', marginBottom: '6px' }}>Faculty *</label>
                <select style={inputStyle} required
                  value={assignForm.faculty_user_id}
                  onChange={e => setAssignForm({ ...assignForm, faculty_user_id: e.target.value })}>
                  <option value="">Select faculty</option>
                  {faculty.map(f => (
                    <option key={f.id} value={f.id}>{f.name} ({f.email})</option>
                  ))}
                </select>
              </div>
              <button type="submit" style={{
                background: '#0f766e', color: '#99f6e4',
                border: '1px solid #0d9488', borderRadius: '8px',
                padding: '10px', cursor: 'pointer', fontWeight: 600,
              }}>
                Assign Faculty
              </button>
            </div>
          </form>
        </SectionCard>

        {/* ── Assign Mentor ── */}
        <SectionCard title="Assign Mentor to Student">
          <form onSubmit={handleAssignMentor}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ color: '#64748b', fontSize: '0.78rem', display: 'block', marginBottom: '6px' }}>Mentor (Faculty) *</label>
                <select style={inputStyle} required
                  value={mentorForm.mentor_user_id}
                  onChange={e => setMentorForm({ ...mentorForm, mentor_user_id: e.target.value })}>
                  <option value="">Select faculty</option>
                  {faculty.map(f => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ color: '#64748b', fontSize: '0.78rem', display: 'block', marginBottom: '6px' }}>Student *</label>
                <select style={inputStyle} required
                  value={mentorForm.student_user_id}
                  onChange={e => setMentorForm({ ...mentorForm, student_user_id: e.target.value })}>
                  <option value="">Select student</option>
                  {students.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.email})</option>
                  ))}
                </select>
              </div>
              <button type="submit" style={{
                background: '#4c1d95', color: '#ddd6fe',
                border: '1px solid #6d28d9', borderRadius: '8px',
                padding: '10px', cursor: 'pointer', fontWeight: 600,
              }}>
                Assign Mentor
              </button>
            </div>
          </form>
        </SectionCard>

        {/* ── Upload Permission ── */}
        <SectionCard title="Faculty Upload Permission">
          <form onSubmit={handleSetPermission}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ color: '#64748b', fontSize: '0.78rem', display: 'block', marginBottom: '6px' }}>Faculty *</label>
                <select style={inputStyle} required
                  value={permForm.faculty_user_id}
                  onChange={e => setPermForm({ ...permForm, faculty_user_id: e.target.value })}>
                  <option value="">Select faculty</option>
                  {faculty.map(f => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <label style={{
                  position: 'relative', display: 'inline-block',
                  width: '44px', height: '24px', cursor: 'pointer',
                }}>
                  <input
                    type="checkbox"
                    checked={permForm.can_upload}
                    onChange={e => setPermForm({ ...permForm, can_upload: e.target.checked })}
                    style={{ opacity: 0, width: 0, height: 0 }}
                  />
                  <span style={{
                    position: 'absolute', inset: 0,
                    background: permForm.can_upload ? '#22c55e' : '#334155',
                    borderRadius: '12px', transition: '0.3s',
                  }} />
                  <span style={{
                    position: 'absolute', top: '3px',
                    left: permForm.can_upload ? '23px' : '3px',
                    width: '18px', height: '18px',
                    background: '#fff', borderRadius: '50%', transition: '0.3s',
                  }} />
                </label>
                <span style={{ color: '#94a3b8', fontSize: '0.875rem' }}>
                  {permForm.can_upload ? 'Grant upload permission' : 'Revoke upload permission'}
                </span>
              </div>
              <button type="submit" style={{
                background: permForm.can_upload ? '#052e16' : '#1a0a0a',
                color: permForm.can_upload ? '#86efac' : '#f87171',
                border: `1px solid ${permForm.can_upload ? '#22c55e44' : '#ef444444'}`,
                borderRadius: '8px', padding: '10px', cursor: 'pointer', fontWeight: 600,
              }}>
                {permForm.can_upload ? 'Grant Permission' : 'Revoke Permission'}
              </button>
            </div>
          </form>
        </SectionCard>
      </div>

      {/* ── Courses Table ── */}
      <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <h3 style={{ margin: 0, color: '#e2e8f0', fontSize: '0.95rem', whiteSpace: 'nowrap' }}>
            All Courses ({courses.length})
          </h3>
          <div style={{ position: 'relative', flex: '1', minWidth: '200px', maxWidth: '360px' }}>
            <div style={{
              position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)',
              color: '#475569', pointerEvents: 'none', display: 'flex', alignItems: 'center'
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search by code, name, or department…"
              value={courseSearch}
              onChange={e => setCourseSearch(e.target.value)}
              style={{
                width: '100%', boxSizing: 'border-box',
                background: '#0a0f1e', border: '1px solid #1e293b',
                borderRadius: '8px', padding: '8px 32px 8px 36px',
                color: '#e2e8f0', fontSize: '0.82rem', outline: 'none',
                transition: 'border-color 0.2s',
              }}
              onFocus={e => e.target.style.borderColor = '#38bdf8'}
              onBlur={e => e.target.style.borderColor = '#1e293b'}
            />
            {courseSearch && (
              <button
                onClick={() => setCourseSearch('')}
                style={{
                  position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', color: '#475569', cursor: 'pointer', fontSize: '0.9rem',
                }}
              >✕</button>
            )}
          </div>
        </div>
        {loading ? (
          <p style={{ color: '#64748b', padding: '24px' }}>Loading…</p>
        ) : courses.length === 0 ? (
          <p style={{ color: '#475569', padding: '24px', textAlign: 'center' }}>No courses yet</p>
        ) : (() => {
          const q = courseSearch.toLowerCase().trim();
          const filtered = q
            ? courses.filter(c =>
                c.course_code?.toLowerCase().includes(q) ||
                c.course_name?.toLowerCase().includes(q) ||
                c.department?.toLowerCase().includes(q) ||
                c.faculty_name?.toLowerCase().includes(q)
              )
            : courses;
          return (
          <>
            {filtered.length === 0 && (
              <p style={{ color: '#475569', padding: '32px', textAlign: 'center' }}>
                No courses match &ldquo;{courseSearch}&rdquo;
              </p>
            )}
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#0a0f1e' }}>
                {['Code', 'Name', 'Department', 'Semester', 'Credits', 'Faculty'].map(h => (
                  <th key={h} style={{
                    padding: '10px 16px', textAlign: 'left',
                    color: '#475569', fontSize: '0.72rem',
                    textTransform: 'uppercase', letterSpacing: '0.08em',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((c, i) => (
                <tr 
                  key={c.id} 
                  onClick={() => setSelectedCourseId(c.id)}
                  style={{
                    borderTop: '1px solid #0f172a',
                    background: i % 2 === 0 ? 'transparent' : '#ffffff03',
                    cursor: 'pointer',
                    transition: '0.2s',
                  }}
                  onMouseOver={e => e.currentTarget.style.background = '#ffffff0a'}
                  onMouseOut={e => e.currentTarget.style.background = (i % 2 === 0 ? 'transparent' : '#ffffff03')}
                >
                  <td style={{ padding: '12px 16px', color: '#38bdf8', fontFamily: 'monospace', fontSize: '0.82rem', fontWeight: 600 }}>
                    {c.course_code}
                  </td>
                  <td style={{ padding: '12px 16px', color: '#e2e8f0', fontSize: '0.875rem' }}>{c.course_name}</td>
                  <td style={{ padding: '12px 16px', color: '#94a3b8', fontSize: '0.82rem' }}>{c.department || '—'}</td>
                  <td style={{ padding: '12px 16px', color: '#64748b', fontSize: '0.82rem' }}>
                    {c.semester ? `Sem ${c.semester}` : '—'}
                  </td>
                  <td style={{ padding: '12px 16px', color: '#64748b', fontSize: '0.82rem' }}>{c.credits}</td>
                  <td style={{ padding: '12px 16px', color: c.faculty_name ? '#a78bfa' : '#334155', fontSize: '0.82rem' }}>
                    {c.faculty_name || 'Unassigned'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </>
          );
        })()}
      </div>
    </AppLayout>
  );
};

const MarksManagementModal = ({ onClose, onImported, students, courses, initialCourseId }) => {
  const [tab, setTab] = useState('bulk');
  const [file, setFile] = useState(null);
  const [maxMarks, setMaxMarks] = useState(30);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const fileInputRef = React.useRef(null);

  const [indivData, setIndivData] = useState({
    studentId: '', courseId: initialCourseId || '', unitNumber: 1, marks: '', examType: 'unit_test'
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
      const res = await adminUploadMarksheet(file, maxMarks);
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
      await adminUpsertIndividualMark({ ...indivData, maxMarks });
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
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
      zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center',
      backdropFilter: 'blur(10px)',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: '#0f172a', border: '1px solid #1e293b', borderRadius: '28px',
        padding: '32px', width: '100%', maxWidth: '580px', position: 'relative',
        boxShadow: '0 30px 70px rgba(0,0,0,0.9)', overflow: 'hidden', color: '#f1f5f9'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800 }}>Manage Marks</h2>
            <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '1.5rem' }}>×</button>
        </div>

        <div style={{ display: 'flex', gap: '4px', background: '#0a0f1e', padding: '4px', borderRadius: '12px', marginBottom: '24px' }}>
            <button onClick={() => setTab('bulk')} style={{
                flex: 1, padding: '10px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontWeight: 700,
                background: tab === 'bulk' ? '#0ea5e9' : 'transparent', color: tab === 'bulk' ? '#fff' : '#64748b'
            }}>Bulk</button>
            <button onClick={() => setTab('individual')} style={{
                flex: 1, padding: '10px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontWeight: 700,
                background: tab === 'individual' ? '#0ea5e9' : 'transparent', color: tab === 'individual' ? '#fff' : '#64748b'
            }}>Individual</button>
        </div>

        <div style={{ marginBottom: '24px', padding: '20px', background: '#1e293b', borderRadius: '16px', border: '1px solid #334155' }}>
          <label style={{ display: 'block', color: '#94a3b8', fontSize: '10px', fontWeight: 800, marginBottom: '12px', textTransform: 'uppercase' }}>Configuration (Max Marks)</label>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
            {[30, 50, 100].map(m => (
              <button key={m} onClick={() => setMaxMarks(m)} style={{
                  flex: 1, padding: '10px', borderRadius: '10px', cursor: 'pointer', border: '1px solid', fontWeight: 800,
                  background: maxMarks === m ? '#1e1b4b' : 'transparent', color: maxMarks === m ? '#c7d2fe' : '#475569',
                  borderColor: maxMarks === m ? '#6366f1' : '#1e293b'
              }}>{m}</button>
            ))}
          </div>
          <div style={{ fontSize: '10px', color: '#475569', display: 'flex', justifyContent: 'space-between' }}>
             <span style={{ color: '#ef4444' }}>Low: &lt;{maxMarks/2}</span>
             <span style={{ color: '#f59e0b' }}>Avg: {maxMarks/2}-{maxMarks*0.75}</span>
             <span style={{ color: '#22c55e' }}>Strong: &gt;{maxMarks*0.75}</span>
          </div>
        </div>

        {tab === 'bulk' ? (
          <div>
                <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>Excel or CSV marksheet</span>
                    <button onClick={handleDownloadTemplate} style={{ background: 'transparent', color: '#0ea5e9', border: '1px solid #0ea5e966', padding: '6px 12px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 700 }}>⬇ Template</button>
                </div>
                <div onClick={() => fileInputRef.current?.click()} style={{ 
                    border: '2px dashed #1e293b', borderRadius: '16px', padding: '32px', textAlign: 'center', cursor: 'pointer',
                    background: file ? '#0ea5e908' : 'transparent', borderColor: file ? '#0ea5e9' : '#1e293b', marginBottom: '24px'
                }}>
                    <div style={{ fontSize: '2rem' }}>{file ? '📦' : '☁️'}</div>
                    <div style={{ fontWeight: 700, color: '#cbd5e1' }}>{file ? file.name : 'Choose File'}</div>
                </div>
                <input type="file" accept=".csv, .xlsx" onChange={e => setFile(e.target.files[0])} ref={fileInputRef} style={{ display: 'none' }} />
                <button onClick={handleBulkUpload} disabled={!file || uploading} style={{
                    width: '100%', background: '#0ea5e9', color: '#fff', border: 'none', borderRadius: '12px', padding: '14px', fontWeight: 800, opacity: (!file || uploading) ? 0.6 : 1
                }}>{uploading ? 'Processing...' : 'Bulk Import'}</button>
          </div>
        ) : (
          <form onSubmit={handleIndividualSubmit}>
                <div style={{ marginBottom: '16px' }}>
                    <label style={{ fontSize: '11px', color: '#64748b' }}>Student</label>
                    <select required value={indivData.studentId} onChange={e => setIndivData({...indivData, studentId: e.target.value})}
                        style={{ width: '100%', background: '#0a0f1e', color: '#fff', border: '1px solid #1e293b', borderRadius: '10px', padding: '10px', marginTop: '4px' }}>
                        <option value="">Select Student</option>
                        {students.map(s => <option key={s.id} value={s.id}>{s.name} ({s.student_code})</option>)}
                    </select>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                    <div>
                        <label style={{ fontSize: '11px', color: '#64748b' }}>Unit</label>
                        <select value={indivData.unitNumber} onChange={e => setIndivData({...indivData, unitNumber: e.target.value})}
                            style={{ width: '100%', background: '#0a0f1e', color: '#fff', border: '1px solid #1e293b', borderRadius: '10px', padding: '10px', marginTop: '4px' }}>
                            {[1,2,3,4,5].map(n => <option key={n} value={n}>Unit {n}</option>)}
                        </select>
                    </div>
                    <div>
                        <label style={{ fontSize: '11px', color: '#64748b' }}>Marks</label>
                        <input type="number" min="0" max={maxMarks} required value={indivData.marks} onChange={e => setIndivData({...indivData, marks: e.target.value})}
                            style={{ width: '100%', background: '#0a0f1e', color: '#fff', border: '1px solid #1e293b', borderRadius: '10px', padding: '10px', marginTop: '4px' }} />
                    </div>
                </div>
                <button type="submit" disabled={uploading} style={{
                    width: '100%', background: '#0ea5e9', color: '#fff', border: 'none', borderRadius: '12px', padding: '14px', fontWeight: 800, opacity: uploading ? 0.6 : 1
                }}>{uploading ? 'Updating...' : 'Save Mark'}</button>
          </form>
        )}

        {result && (
          <div style={{ marginTop: '20px', padding: '12px', borderRadius: '10px', fontSize: '12px', background: result.success ? '#064e3b' : '#7f1d1d', color: '#fff', textAlign: 'center' }}>
            {result.success ? (result.message || 'Success!') : result.error}
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageCourses;