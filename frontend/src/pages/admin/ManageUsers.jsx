// src/pages/admin/ManageUsers.jsx
import React, { useEffect, useState, useRef } from 'react';
import { listUsers, createUser, toggleUserStatus, updateUser, getFacultyMentees, bulkImportUsers } from '../../services/api';
import AppLayout from '../../components/Layout/AppLayout';

const ROLE_COLOR = { admin: '#a78bfa', faculty: '#38bdf8', student: '#34d399' };

const inputStyle = {
  width: '100%', background: '#0a0f1e', border: '1px solid #1e293b',
  borderRadius: '8px', padding: '10px 14px', color: '#e2e8f0',
  fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box',
};

// ── User Detail Popup ─────────────────────────────────────────────────────────
const BulkImportModal = ({ onClose, onImported }) => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const fileInputRef = useRef(null);

  const handleDownloadTemplate = () => {
    const csvContent = "name,email,role,department,year,section,student_code,employee_code\nJohn Doe,john@example.com,student,Computer Science,2,A,STU123,\nDr. Smith,smith@example.com,faculty,Computer Science,,,,EMP456\nAdmin User,admin@example.com,admin,,,,,";
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'user_import_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setResult(null);
    try {
      const res = await bulkImportUsers(file);
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
        <h3 style={{ margin: '0 0 20px', color: '#f1f5f9' }}>Bulk Import Users</h3>
        
        <div style={{ marginBottom: '24px', padding: '16px', background: '#1e293b55', borderRadius: '8px', border: '1px solid #334155' }}>
          <p style={{ margin: '0 0 10px', fontSize: '14px', color: '#94a3b8' }}>
            1. Download the template and fill in your user data.
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

const UserDetailPopup = ({ user, onClose, onToggle, onUpdated }) => {
  const [mentees,        setMentees]        = useState([]);
  const [menteesLoading, setMenteesLoading] = useState(false);
  const [editMode,       setEditMode]       = useState(false);
  const [saving,         setSaving]         = useState(false);
  const [saveMsg,        setSaveMsg]        = useState('');
  const [form,           setForm]           = useState({});

  // Load mentees when a faculty is opened
  useEffect(() => {
    if (!user || user.role !== 'faculty') { setMentees([]); return; }
    setMenteesLoading(true);
    getFacultyMentees(user.id)
      .then(r => setMentees(r.data.mentees || []))
      .catch(() => setMentees([]))
      .finally(() => setMenteesLoading(false));
  }, [user]);

  // Pre-fill edit form whenever user changes
  useEffect(() => {
    if (!user) return;
    setEditMode(false);
    setSaveMsg('');
    setForm({
      name:           user.name          || '',
      department:     user.department    || '',
      employee_code:  user.employee_code || '',
      can_upload_marks: !!user.can_upload_marks,
      student_code:   user.student_code  || '',
      year:           user.year          || '',
      section:        user.section       || '',
    });
  }, [user]);

  if (!user) return null;
  const roleColor = ROLE_COLOR[user.role] || '#64748b';

  const Field = ({ label, value }) => (
    <div style={{ marginBottom: '16px' }}>
      <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>{label}</div>
      <div style={{ fontSize: '15px', color: '#e2e8f0', fontWeight: 500 }}>
        {value ?? <span style={{ color: '#ef4444', fontSize: '13px' }}>Not set</span>}
      </div>
    </div>
  );

  const EditInput = ({ label, field, type = 'text', placeholder = '' }) => (
    <div style={{ marginBottom: '14px' }}>
      <label style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '5px' }}>{label}</label>
      <input
        type={type}
        value={form[field] ?? ''}
        placeholder={placeholder}
        onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
        style={{
          width: '100%', background: '#0a0f1e', border: '1px solid #334155',
          borderRadius: '7px', padding: '8px 12px', color: '#e2e8f0',
          fontSize: '14px', outline: 'none', boxSizing: 'border-box',
        }}
      />
    </div>
  );

  const handleSave = async () => {
    setSaving(true);
    setSaveMsg('');
    try {
      await updateUser(user.id, form);
      setSaveMsg('✓ Saved successfully');
      setEditMode(false);
      onUpdated(); // reload user list
    } catch (err) {
      setSaveMsg('✗ ' + (err.response?.data?.error || 'Save failed'));
    } finally {
      setSaving(false);
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
        maxHeight: '90vh', overflowY: 'auto',
      }}>
        {/* Close */}
        <button onClick={onClose} style={{
          position: 'absolute', top: '16px', right: '16px',
          background: '#1e293b', border: 'none', borderRadius: '50%',
          width: '32px', height: '32px', cursor: 'pointer',
          color: '#94a3b8', fontSize: '16px', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
        }}>✕</button>

        {/* Avatar + name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
          <div style={{
            width: '56px', height: '56px', borderRadius: '50%', flexShrink: 0,
            background: `${roleColor}22`, border: `2px solid ${roleColor}44`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '22px', color: roleColor, fontWeight: 700,
          }}>
            {user.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: '#f1f5f9' }}>{user.name}</div>
            <span style={{
              background: `${roleColor}18`, color: roleColor,
              border: `1px solid ${roleColor}44`, borderRadius: '99px',
              padding: '2px 12px', fontSize: '12px', fontWeight: 600, textTransform: 'capitalize',
            }}>{user.role}</span>
          </div>
          {/* Edit toggle */}
          <button onClick={() => { setEditMode(e => !e); setSaveMsg(''); }} style={{
            marginLeft: 'auto', marginRight: '36px',
            background: editMode ? '#1e293b' : '#6366f115',
            color: editMode ? '#94a3b8' : '#818cf8',
            border: `1px solid ${editMode ? '#334155' : '#6366f133'}`,
            borderRadius: '7px', padding: '6px 14px',
            cursor: 'pointer', fontSize: '13px', fontWeight: 600,
          }}>
            {editMode ? '✕ Cancel' : '✎ Edit'}
          </button>
        </div>

        {saveMsg && (
          <div style={{
            padding: '9px 14px', borderRadius: '8px', marginBottom: '16px', fontSize: '13px',
            background: saveMsg.startsWith('✓') ? '#052e16' : '#1a0a0a',
            color: saveMsg.startsWith('✓') ? '#86efac' : '#fca5a5',
            border: `1px solid ${saveMsg.startsWith('✓') ? '#166534' : '#ef4444'}`,
          }}>{saveMsg}</div>
        )}

        <div style={{ borderTop: '1px solid #1e293b', marginBottom: '20px' }} />

        {/* ── VIEW MODE ── */}
        {!editMode && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 24px' }}>
            <Field label="Email"   value={user.email} />
            <Field label="Status"  value={
              <span style={{ color: user.is_active ? '#22c55e' : '#ef4444' }}>
                {user.is_active ? '● Active' : '● Inactive'}
              </span>
            } />
            <Field label="User ID" value={`#${user.id}`} />
            <Field label="Joined"  value={new Date(user.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} />

            {user.role === 'faculty' && <>
              <Field label="Employee Code"    value={user.employee_code || null} />
              <Field label="Department"       value={user.department    || null} />
              <Field label="Can Upload Marks" value={user.can_upload_marks ? 'Yes' : 'No'} />
            </>}

            {user.role === 'student' && <>
              <Field label="Student Code" value={user.student_code || null} />
              <Field label="Department"   value={user.department   || null} />
              <Field label="Year"         value={user.year ? `Year ${user.year}` : null} />
              <Field label="Section"      value={user.section      || null} />
            </>}
          </div>
        )}

        {/* ── EDIT MODE ── */}
        {editMode && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
            <EditInput label="Full Name" field="name" />

            {user.role === 'faculty' && <>
              <EditInput label="Employee Code" field="employee_code" placeholder="e.g. EMP001" />
              <EditInput label="Department"    field="department"    placeholder="e.g. Computer Science" />
              <div style={{ gridColumn: '1 / -1', marginBottom: '14px' }}>
                <label style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={!!form.can_upload_marks}
                    onChange={e => setForm(f => ({ ...f, can_upload_marks: e.target.checked }))}
                    style={{ width: '16px', height: '16px', accentColor: '#6366f1' }}
                  />
                  Can Upload Marks
                </label>
              </div>
            </>}

            {user.role === 'student' && <>
              <EditInput label="Student Code" field="student_code" placeholder="e.g. STU001" />
              <EditInput label="Department"   field="department"   placeholder="e.g. AIML" />
              <div>
                <label style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '5px' }}>Year</label>
                <select
                  value={form.year || ''}
                  onChange={e => setForm(f => ({ ...f, year: e.target.value }))}
                  style={{ width: '100%', background: '#0a0f1e', border: '1px solid #334155', borderRadius: '7px', padding: '8px 12px', color: '#e2e8f0', fontSize: '14px', outline: 'none' }}
                >
                  <option value="">Select year</option>
                  {[1,2,3,4].map(y => <option key={y} value={y}>Year {y}</option>)}
                </select>
              </div>
              <EditInput label="Section" field="section" placeholder="A / B / C" />
            </>}
          </div>
        )}

        {/* ── Mentees (faculty only, view mode) ── */}
        {!editMode && user.role === 'faculty' && (
          <>
            <div style={{ borderTop: '1px solid #1e293b', margin: '8px 0 18px' }} />
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '14px' }}>
              Mentees {!menteesLoading && `(${mentees.length})`}
            </div>
            {menteesLoading ? (
              <div style={{ color: '#475569', fontSize: '14px', padding: '10px 0' }}>Loading mentees…</div>
            ) : mentees.length === 0 ? (
              <div style={{ background: '#0a0f1e', border: '1px solid #1e293b', borderRadius: '10px', padding: '18px', textAlign: 'center', color: '#475569', fontSize: '14px' }}>
                No mentees assigned yet.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {mentees.map(m => (
                  <div key={m.student_id} style={{
                    background: '#0a0f1e', border: '1px solid #1e293b', borderRadius: '10px',
                    padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '14px',
                  }}>
                    <div style={{
                      width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0,
                      background: '#34d39922', border: '1px solid #34d39944',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '14px', fontWeight: 700, color: '#34d399',
                    }}>{m.name?.charAt(0).toUpperCase()}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: '#e2e8f0', marginBottom: '2px' }}>{m.name}</div>
                      <div style={{ fontSize: '12px', color: '#64748b' }}>{m.email}</div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '2px' }}>{m.student_code}</div>
                      <div style={{ fontSize: '11px', color: '#475569' }}>
                        {m.department}{m.year ? ` · Yr ${m.year}` : ''}{m.section ? ` · ${m.section}` : ''}
                      </div>
                    </div>
                    <div style={{
                      width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0,
                      background: m.is_active ? '#22c55e' : '#ef4444',
                    }} />
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Actions */}
        <div style={{ borderTop: '1px solid #1e293b', marginTop: '24px', paddingTop: '20px', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{
            background: 'transparent', color: '#94a3b8', border: '1px solid #1e293b',
            borderRadius: '8px', padding: '8px 20px', cursor: 'pointer', fontSize: '14px',
          }}>Close</button>

          {editMode ? (
            <button onClick={handleSave} disabled={saving} style={{
              background: '#4f46e5', color: '#fff', border: 'none',
              borderRadius: '8px', padding: '8px 24px',
              cursor: saving ? 'not-allowed' : 'pointer',
              fontSize: '14px', fontWeight: 600, opacity: saving ? 0.6 : 1,
            }}>
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          ) : (
            <button onClick={() => { onToggle(user.id); onClose(); }} style={{
              background: user.is_active ? '#1a0a0a' : '#052e16',
              color: user.is_active ? '#f87171' : '#86efac',
              border: `1px solid ${user.is_active ? '#ef444433' : '#22c55e33'}`,
              borderRadius: '8px', padding: '8px 20px',
              cursor: 'pointer', fontSize: '14px', fontWeight: 600,
            }}>
              {user.is_active ? 'Deactivate User' : 'Activate User'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
// ── Main Component ────────────────────────────────────────────────────────────
const ManageUsers = () => {
  const [users,      setUsers]      = useState([]);
  const [roleFilter, setRoleFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading,    setLoading]    = useState(true);
  const [showForm,   setShowForm]   = useState(false);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [form, setForm] = useState({
    name: '', email: '', role: 'student',
    department: '', year: '', section: '',
    student_code: '', employee_code: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [msg,        setMsg]        = useState('');

  const loadUsers = () => {
    setLoading(true);
    listUsers(roleFilter || undefined)
      .then(r => setUsers(r.data.users))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadUsers(); }, [roleFilter]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMsg('');
    try {
      await createUser(form);
      setMsg('✓ User created successfully');
      setShowForm(false);
      setForm({ name: '', email: '', role: 'student', department: '', year: '', section: '', student_code: '', employee_code: '' });
      loadUsers();
    } catch (err) {
      setMsg('✗ ' + (err.response?.data?.error || 'Failed to create user'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggle = async (id) => {
    await toggleUserStatus(id);
    loadUsers();
  };

  // Enrich selectedUser with extra fields from the users list when opening popup
  const openUserPopup = (u) => setSelectedUser(u);

  return (
    <AppLayout>
      {/* Detail Popup */}
      <UserDetailPopup
        user={selectedUser}
        onClose={() => setSelectedUser(null)}
        onToggle={handleToggle}
        onUpdated={() => { loadUsers(); setSelectedUser(null); }}
      />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 700, color: '#f1f5f9' }}>Manage Users</h1>
          <p style={{ color: '#64748b', marginTop: '4px', fontSize: '0.88rem' }}>Click any row to view full details</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={() => setShowBulkImport(true)} style={{
            background: '#1e293b', color: '#e2e8f0', border: '1px solid #334155', borderRadius: '8px',
            padding: '10px 20px', cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem',
          }}>
            Bulk Import
          </button>
          <button onClick={() => setShowForm(!showForm)} style={{
            background: '#0ea5e9', color: '#fff', border: 'none', borderRadius: '8px',
            padding: '10px 20px', cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem',
          }}>
            {showForm ? '✕ Cancel' : '+ New User'}
          </button>
        </div>
      </div>

      {/* Bulk Import Modal */}
      {showBulkImport && (
        <BulkImportModal
          onClose={() => setShowBulkImport(false)}
          onImported={() => {
            loadUsers();
          }}
        />
      )}

      {/* Create user form */}
      {showForm && (
        <div style={{
          background: '#0f172a', border: '1px solid #1e293b',
          borderRadius: '12px', padding: '24px', marginBottom: '24px',
        }}>
          <h3 style={{ margin: '0 0 20px', color: '#e2e8f0' }}>Create New User</h3>
          {msg && (
            <div style={{
              padding: '10px 14px', borderRadius: '8px', marginBottom: '16px',
              background: msg.startsWith('✓') ? '#052e16' : '#1a0a0a',
              color: msg.startsWith('✓') ? '#86efac' : '#fca5a5',
              border: `1px solid ${msg.startsWith('✓') ? '#166534' : '#ef4444'}`,
              fontSize: '0.85rem',
            }}>
              {msg}
            </div>
          )}
          <form onSubmit={handleCreate}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ color: '#64748b', fontSize: '0.78rem', display: 'block', marginBottom: '6px' }}>Full Name *</label>
                <input style={inputStyle} required value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <label style={{ color: '#64748b', fontSize: '0.78rem', display: 'block', marginBottom: '6px' }}>Email *</label>
                <input style={inputStyle} type="email" required value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })} />
              </div>
              <div>
                <label style={{ color: '#64748b', fontSize: '0.78rem', display: 'block', marginBottom: '6px' }}>Role *</label>
                <select style={inputStyle} value={form.role}
                  onChange={e => setForm({ ...form, role: e.target.value })}>
                  <option value="student">Student</option>
                  <option value="faculty">Faculty</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div>
                <label style={{ color: '#64748b', fontSize: '0.78rem', display: 'block', marginBottom: '6px' }}>Department</label>
                <input style={inputStyle} value={form.department}
                  onChange={e => setForm({ ...form, department: e.target.value })} />
              </div>

              {form.role === 'student' && <>
                <div>
                  <label style={{ color: '#64748b', fontSize: '0.78rem', display: 'block', marginBottom: '6px' }}>Student Code *</label>
                  <input style={inputStyle} required value={form.student_code}
                    onChange={e => setForm({ ...form, student_code: e.target.value })} />
                </div>
                <div>
                  <label style={{ color: '#64748b', fontSize: '0.78rem', display: 'block', marginBottom: '6px' }}>Year *</label>
                  <select style={inputStyle} value={form.year}
                    onChange={e => setForm({ ...form, year: e.target.value })}>
                    <option value="">Select year</option>
                    {[1,2,3,4].map(y => <option key={y} value={y}>Year {y}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ color: '#64748b', fontSize: '0.78rem', display: 'block', marginBottom: '6px' }}>Section</label>
                  <input style={inputStyle} value={form.section}
                    onChange={e => setForm({ ...form, section: e.target.value })} placeholder="A / B / C" />
                </div>
              </>}

              {form.role === 'faculty' && (
                <div>
                  <label style={{ color: '#64748b', fontSize: '0.78rem', display: 'block', marginBottom: '6px' }}>Employee Code *</label>
                  <input style={inputStyle} required value={form.employee_code}
                    onChange={e => setForm({ ...form, employee_code: e.target.value })} />
                </div>
              )}
            </div>
            <div style={{ marginTop: '20px' }}>
              <button type="submit" disabled={submitting} style={{
                background: '#0ea5e9', color: '#fff', border: 'none',
                borderRadius: '8px', padding: '10px 24px',
                cursor: submitting ? 'not-allowed' : 'pointer',
                fontWeight: 600, fontSize: '0.875rem', opacity: submitting ? 0.6 : 1,
              }}>
                {submitting ? 'Creating…' : 'Create User'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Search + Filters */}
      <div style={{ marginBottom: '16px', position: 'relative' }}>
        <div style={{
          position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)',
          color: '#475569', pointerEvents: 'none', display: 'flex', alignItems: 'center'
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
        </div>
        <input
          type="text"
          placeholder="Search by name, email or role…"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          style={{
            width: '100%', boxSizing: 'border-box',
            background: '#0a0f1e', border: '1px solid #1e293b',
            borderRadius: '10px', padding: '10px 14px 10px 42px',
            color: '#e2e8f0', fontSize: '0.875rem', outline: 'none',
            transition: 'border-color 0.2s',
          }}
          onFocus={e => e.target.style.borderColor = '#38bdf8'}
          onBlur={e => e.target.style.borderColor = '#1e293b'}
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            style={{
              position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
              background: 'none', border: 'none', color: '#475569', cursor: 'pointer', fontSize: '1rem',
            }}
          >✕</button>
        )}
      </div>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        {['', 'student', 'faculty', 'admin'].map(r => (
          <button key={r} onClick={() => setRoleFilter(r)} style={{
            padding: '6px 16px', borderRadius: '99px', border: '1px solid',
            borderColor: roleFilter === r ? '#38bdf8' : '#1e293b',
            background: roleFilter === r ? '#0c4a6e33' : 'transparent',
            color: roleFilter === r ? '#38bdf8' : '#64748b',
            cursor: 'pointer', fontSize: '0.8rem', textTransform: 'capitalize',
          }}>
            {r || 'All'}
          </button>
        ))}
      </div>

      {/* Table */}
      <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', overflow: 'hidden' }}>
        {loading ? (
          <p style={{ color: '#64748b', padding: '24px' }}>Loading…</p>
        ) : users.length === 0 ? (
          <p style={{ color: '#475569', padding: '32px', textAlign: 'center' }}>No users found.</p>
        ) : (() => {
          const q = searchQuery.toLowerCase().trim();
          const filtered = q
            ? users.filter(u =>
                u.name?.toLowerCase().includes(q) ||
                u.email?.toLowerCase().includes(q) ||
                u.role?.toLowerCase().includes(q)
              )
            : users;
          return (
          <>
            {filtered.length === 0 && (
              <p style={{ color: '#475569', padding: '32px', textAlign: 'center' }}>
                No users match &ldquo;{searchQuery}&rdquo;
              </p>
            )}
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#0a0f1e' }}>
                {['Name', 'Email', 'Role', 'Status', 'Created', 'Action'].map(h => (
                  <th key={h} style={{
                    padding: '10px 16px', textAlign: 'left',
                    color: '#475569', fontSize: '0.72rem',
                    textTransform: 'uppercase', letterSpacing: '0.08em',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((u, i) => {
                const roleColor = ROLE_COLOR[u.role] || '#64748b';
                return (
                  <tr
                    key={u.id}
                    onClick={() => openUserPopup(u)}
                    style={{
                      borderTop: '1px solid #0f172a',
                      background: i % 2 === 0 ? 'transparent' : '#ffffff03',
                      cursor: 'pointer',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = '#1e293b55'}
                    onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? 'transparent' : '#ffffff03'}
                  >
                    <td style={{ padding: '12px 16px', color: '#e2e8f0', fontSize: '0.875rem', fontWeight: 500 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: '30px', height: '30px', borderRadius: '50%',
                          background: `${roleColor}22`, color: roleColor,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '13px', fontWeight: 700, flexShrink: 0,
                        }}>
                          {u.name?.charAt(0).toUpperCase()}
                        </div>
                        {u.name}
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px', color: '#94a3b8', fontSize: '0.82rem' }}>{u.email}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        background: `${roleColor}15`, color: roleColor,
                        border: `1px solid ${roleColor}44`,
                        borderRadius: '99px', padding: '2px 10px',
                        fontSize: '0.72rem', fontWeight: 600, textTransform: 'capitalize',
                      }}>{u.role}</span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ color: u.is_active ? '#22c55e' : '#ef4444', fontSize: '0.82rem' }}>
                        {u.is_active ? '● Active' : '● Inactive'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', color: '#475569', fontSize: '0.78rem' }}>
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <button
                        onClick={e => { e.stopPropagation(); handleToggle(u.id); }}
                        style={{
                          background: u.is_active ? '#1a0a0a' : '#052e16',
                          color: u.is_active ? '#f87171' : '#86efac',
                          border: `1px solid ${u.is_active ? '#ef444433' : '#22c55e33'}`,
                          borderRadius: '6px', padding: '4px 12px',
                          cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600,
                        }}
                      >
                        {u.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </>
          );
        })()}
      </div>
    </AppLayout>
  );
};

export default ManageUsers;