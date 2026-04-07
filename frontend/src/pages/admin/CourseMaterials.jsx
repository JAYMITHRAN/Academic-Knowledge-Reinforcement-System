// src/pages/admin/CourseMaterials.jsx
import React, { useEffect, useState, useRef } from 'react';
import { listCourses, adminUploadMaterial, listMaterials, adminBulkImportUnits } from '../../services/api';
import AppLayout from '../../components/Layout/AppLayout';

const inputStyle = {
  width: '100%', background: '#0a0f1e', border: '1px solid #1e293b',
  borderRadius: '8px', padding: '10px 14px', color: '#e2e8f0',
  fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box',
};

const CourseMaterials = () => {
  const [courses,   setCourses]   = useState([]);
  const [materials, setMaterials] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [tab,       setTab]       = useState('manual');
  
  // Manual Form
  const [form, setForm] = useState({
    course_id: '', title: '', description: '', material_link: '', material_type: 'link',
  });
  const [submitting, setSubmitting] = useState(false);
  const [msg,        setMsg]        = useState('');

  // Bulk Import Form
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const fileInputRef = useRef(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [c, m] = await Promise.all([listCourses(), listMaterials()]);
      setCourses(c.data.courses);
      setMaterials(m.data.materials);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMsg('');
    try {
      await adminUploadMaterial(form);
      setMsg('✓ Material added');
      fetchData();
      setForm({ course_id: '', title: '', description: '', material_link: '', material_type: 'link' });
    } catch (err) {
      setMsg('✗ ' + (err.response?.data?.error || 'Failed'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownloadTemplate = () => {
    const csvContent = "course_code,unit_number,title,description,material_link\nCS101,1,Introduction to Computing,Basics of hardware and software,https://drive.google.com/...\nCS101,2,Programming Fundamentals,Variables loops and functions,https://youtube.com/...\n";
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'unit_import_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleBulkUpload = async () => {
    if (!file) return;
    setUploading(true);
    setResult(null);
    try {
      const res = await adminBulkImportUnits(file);
      setResult({ success: true, data: res.data.summary });
      if (res.data.summary.success > 0) fetchData();
    } catch (err) {
      setResult({ success: false, error: err.response?.data?.error || 'Upload failed' });
    } finally {
      setUploading(false);
    }
  };

  return (
    <AppLayout>
      <h1 style={{ margin: '0 0 8px', fontSize: '1.8rem', fontWeight: 700, color: '#f1f5f9' }}>
        Course Materials
      </h1>
      <p style={{ color: '#64748b', marginBottom: '32px', fontSize: '0.88rem' }}>
        Manage resource links and course syllabus modules.
      </p>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '28px' }}>
          {['manual', 'bulk'].map(t => (
              <button 
                key={t}
                onClick={() => { setTab(t); setMsg(''); setResult(null); }}
                style={{
                    padding: '8px 20px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600,
                    background: tab === t ? '#38bdf822' : 'transparent',
                    color: tab === t ? '#38bdf8' : '#64748b',
                    border: '1px solid',
                    borderColor: tab === t ? '#38bdf844' : 'transparent',
                    transition: '0.2s',
                }}
              >
                {t === 'manual' ? 'Manual Addition' : 'Bulk Import (Units)'}
              </button>
          ))}
      </div>

      <div style={{
          background: '#0f172a', border: '1px solid #1e293b',
          borderRadius: '16px', padding: '32px', marginBottom: '48px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
      }}>
        {tab === 'manual' ? (
            <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
                <h3 style={{ margin: '0 0 24px', color: '#e2e8f0', fontSize: '1rem' }}>Add Single Resource</h3>
                {msg && (
                    <div style={{
                        padding: '12px 16px', borderRadius: '10px', marginBottom: '20px',
                        background: msg.startsWith('✓') ? '#052e16' : '#1a0a0a',
                        color: msg.startsWith('✓') ? '#86efac' : '#fca5a5',
                        border: `1px solid ${msg.startsWith('✓') ? '#22c55e44' : '#ef444444'}`,
                        fontSize: '0.85rem',
                    }}>
                        {msg}
                    </div>
                )}
                <form onSubmit={handleManualSubmit}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        <div>
                            <label style={{ color: '#64748b', fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '8px', textTransform: 'uppercase' }}>Course *</label>
                            <select style={inputStyle} required value={form.course_id}
                                    onChange={e => setForm({ ...form, course_id: e.target.value })}>
                                <option value="">Select course</option>
                                {courses.map(c => (
                                    <option key={c.id} value={c.id}>{c.course_code} — {c.course_name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label style={{ color: '#64748b', fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '8px', textTransform: 'uppercase' }}>Material Type</label>
                            <select style={inputStyle} value={form.material_type}
                                    onChange={e => setForm({ ...form, material_type: e.target.value })}>
                                {['link', 'pdf', 'video', 'doc'].map(t => (
                                    <option key={t} value={t}>{t.toUpperCase()}</option>
                                ))}
                            </select>
                        </div>
                        <div style={{ gridColumn: '1 / -1' }}>
                            <label style={{ color: '#64748b', fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '8px', textTransform: 'uppercase' }}>Title *</label>
                            <input style={inputStyle} required value={form.title}
                                   onChange={e => setForm({ ...form, title: e.target.value })}
                                   placeholder="e.g. Chapter 3 — Normalization" />
                        </div>
                        <div style={{ gridColumn: '1 / -1' }}>
                            <label style={{ color: '#64748b', fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '8px', textTransform: 'uppercase' }}>Resource URL *</label>
                            <input style={inputStyle} required type="url" value={form.material_link}
                                   onChange={e => setForm({ ...form, material_link: e.target.value })}
                                   placeholder="https://..." />
                        </div>
                        <div style={{ gridColumn: '1 / -1' }}>
                            <label style={{ color: '#64748b', fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '8px', textTransform: 'uppercase' }}>Description</label>
                            <textarea style={{ ...inputStyle, resize: 'vertical', minHeight: '80px' }}
                                      value={form.description}
                                      onChange={e => setForm({ ...form, description: e.target.value })}
                                      placeholder="Brief description of the resource…" />
                        </div>
                    </div>
                    <button type="submit" disabled={submitting} style={{
                        marginTop: '24px',
                        background: 'linear-gradient(135deg, #0ea5e9, #6366f1)',
                        color: '#fff', border: 'none', borderRadius: '10px',
                        padding: '12px 32px', cursor: submitting ? 'not-allowed' : 'pointer',
                        fontWeight: 700, fontSize: '0.9rem', opacity: submitting ? 0.7 : 1,
                        boxShadow: '0 10px 20px rgba(0,0,0,0.2)'
                    }}>
                        {submitting ? 'Adding…' : 'Add Material'}
                    </button>
                </form>
            </div>
        ) : (
            <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
                <h3 style={{ margin: '0 0 12px', color: '#e2e8f0', fontSize: '1rem' }}>Bulk Import Course Units</h3>
                <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '32px' }}>
                    Populate course syllabus structures with titles and materials in one go.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
                    <div style={{ padding: '24px', background: '#0a0f1e', borderRadius: '16px', border: '1px solid #1e293b' }}>
                        <h4 style={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '16px' }}>1. Prepare Template</h4>
                        <p style={{ color: '#475569', fontSize: '0.8rem', lineHeight: 1.6, marginBottom: '20px' }}>
                            Download the unit template and fill it with course code, unit number and material links.
                        </p>
                        <button onClick={handleDownloadTemplate} style={{
                            background: '#1e293b', color: '#38bdf8', border: '1px solid #38bdf844',
                            borderRadius: '8px', padding: '10px 16px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700
                        }}>⬇ Unit Template (CSV)</button>
                    </div>

                    <div style={{ padding: '24px', background: '#0a0f1e', borderRadius: '16px', border: '1px solid #1e293b' }}>
                        <h4 style={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '16px' }}>2. Upload File</h4>
                        <input type="file" accept=".csv, .xlsx" onChange={e => setFile(e.target.files[0])} ref={fileInputRef} style={{ display: 'none' }} />
                        <div onClick={() => fileInputRef.current?.click()} style={{ 
                            border: '2px dashed #1e293b', borderRadius: '12px', padding: '16px', textAlign: 'center', cursor: 'pointer',
                            background: file ? '#0ea5e908' : 'transparent', borderColor: file ? '#0ea5e9' : '#1e293b', transition: '0.3s'
                        }}>
                             <div style={{ color: '#cbd5e1', fontWeight: 600, fontSize: '0.85rem' }}>{file ? file.name : 'Click to select file'}</div>
                        </div>
                        <button onClick={handleBulkUpload} disabled={!file || uploading} style={{
                            width: '100%', marginTop: '16px', background: '#0ea5e9', color: '#fff', border: 'none', borderRadius: '8px',
                            padding: '12px', cursor: (!file || uploading) ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: '0.85rem',
                            opacity: (!file || uploading) ? 0.6 : 1
                        }}>
                            {uploading ? 'Processing…' : 'Process Units'}
                        </button>
                    </div>
                </div>

                {result && (
                    <div style={{
                        marginTop: '24px', padding: '16px', borderRadius: '12px', fontSize: '13px',
                        background: result.success ? '#052e16' : '#1a0a0a',
                        color: result.success ? '#86efac' : '#fca5a5',
                        border: `1px solid ${result.success ? '#22c55e44' : '#ef444444'}`,
                    }}>
                        {result.success ? (
                            <div>✓ Success! {result.data.success} units imported. {result.data.failed > 0 && `${result.data.failed} failed.`}</div>
                        ) : result.error}
                    </div>
                )}
            </div>
        )}
      </div>

      {/* Materials list */}
      <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px', overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, color: '#e2e8f0', fontSize: '1rem', fontWeight: 600 }}>
            Resource Library ({materials.length})
          </h3>
        </div>

        {/* Subjects available summary */}
        {!loading && materials.length > 0 && (() => {
          // Group materials by course
          const courseMap = {};
          materials.forEach(m => {
            const key = m.course_id || m.course_code;
            if (!courseMap[key]) {
              courseMap[key] = { course_code: m.course_code, course_name: m.course_name, count: 0 };
            }
            courseMap[key].count += 1;
          });
          const courseList = Object.values(courseMap);
          return (
            <div style={{
              padding: '16px 24px',
              borderBottom: '1px solid #1e293b',
              background: '#0a0f1e',
            }}>
              <div style={{ fontSize: '0.7rem', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px', fontWeight: 700 }}>
                📚 Subjects with Materials ({courseList.length})
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {courseList.map((c) => (
                  <div key={c.course_code} style={{
                    display: 'inline-flex', alignItems: 'center', gap: '8px',
                    background: '#0f172a', border: '1px solid #1e293b',
                    borderRadius: '99px', padding: '6px 14px',
                    transition: 'border-color 0.2s',
                  }}>
                    <span style={{ color: '#38bdf8', fontSize: '0.72rem', fontWeight: 800, fontFamily: 'monospace' }}>
                      {c.course_code}
                    </span>
                    <span style={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: 500 }}>
                      {c.course_name}
                    </span>
                    <span style={{
                      background: '#38bdf822', color: '#38bdf8',
                      border: '1px solid #38bdf844',
                      borderRadius: '99px', padding: '1px 8px',
                      fontSize: '0.65rem', fontWeight: 700,
                    }}>
                      {c.count} {c.count === 1 ? 'resource' : 'resources'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

        {loading ? (
          <p style={{ color: '#64748b', padding: '32px' }}>Loading resources…</p>
        ) : materials.length === 0 ? (
          <p style={{ color: '#475569', padding: '48px', textAlign: 'center' }}>No materials uploaded yet</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#0a0f1e' }}>
                {['Subject', 'Title', 'Type', 'Link', 'Added'].map(h => (
                  <th key={h} style={{
                    padding: '12px 24px', textAlign: 'left',
                    color: '#475569', fontSize: '0.7rem',
                    textTransform: 'uppercase', letterSpacing: '0.1em',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {materials.map((m, i) => (
                <tr key={m.id} style={{ borderTop: '1px solid #0f172a', background: i % 2 === 0 ? 'transparent' : '#ffffff03' }}>
                  <td style={{ padding: '16px 24px' }}>
                    <div style={{ color: '#38bdf8', fontSize: '0.75rem', fontWeight: 700, fontFamily: 'monospace' }}>{m.course_code}</div>
                    <div style={{ color: '#e2e8f0', fontSize: '0.85rem', fontWeight: 600, marginTop: '3px' }}>{m.course_name}</div>
                  </td>
                  <td style={{ padding: '16px 24px', color: '#e2e8f0', fontSize: '0.875rem', fontWeight: 500 }}>{m.title}</td>
                  <td style={{ padding: '16px 24px' }}>
                    <span style={{
                      background: '#1e293b', color: '#94a3b8',
                      borderRadius: '4px', padding: '4px 10px',
                      fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 700,
                    }}>{m.material_type}</span>
                  </td>
                  <td style={{ padding: '16px 24px' }}>
                    <a href={m.material_link} target="_blank" rel="noopener noreferrer"
                      style={{ color: '#38bdf8', textDecoration: 'none', fontSize: '0.82rem', fontWeight: 600 }}>
                      Open ↗
                    </a>
                  </td>
                  <td style={{ padding: '16px 24px', color: '#475569', fontSize: '0.78rem' }}>
                    {new Date(m.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </AppLayout>
  );
};

export default CourseMaterials;
