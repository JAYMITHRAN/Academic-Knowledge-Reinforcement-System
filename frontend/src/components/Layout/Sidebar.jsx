// src/components/Layout/Sidebar.jsx
import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const NAV_ITEMS = {
  admin: [
    { label: 'Dashboard',        path: '/admin',                  icon: '⬡' },
    { label: 'Manage Users',     path: '/admin/users',            icon: '◈' },
    { label: 'Courses',          path: '/admin/courses',          icon: '◎' },
    { label: 'Mark Management',  path: '/admin/marks',            icon: '⊕' },
    { label: 'AI Practice Logs', path: '/admin/practice-logs',    icon: '✧' },
    { label: 'Course Materials', path: '/admin/materials',        icon: '◉' },
    { label: 'Analytics',        path: '/admin/analytics',        icon: '◈' },
  ],
  faculty: [
    { label: 'Dashboard',        path: '/faculty',                icon: '⬡' },
    { label: 'My Students',      path: '/faculty/students',       icon: '◈' },
    { label: 'Test Requests',    path: '/faculty/test-requests',  icon: '⏱' },
    { label: 'Upload Marks',     path: '/faculty/upload',         icon: '⊕' },
  ],
  student: [
    { label: 'Dashboard',        path: '/student',                icon: '⬡' },
    { label: 'My Performance',   path: '/student/performance',    icon: '◈' },
    { label: 'Study Materials',  path: '/student/materials',      icon: '◉' },
    { label: 'Learn Tracker',    path: '/student/learn-tracker',  icon: '◎' },
    { label: 'AI Practice',      path: '/student/practice',       icon: '✧' },
  ],
};

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate         = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const items = NAV_ITEMS[user?.role] || [];

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <aside style={{
      width:      collapsed ? '64px' : '240px',
      minHeight:  '100vh',
      background: '#0f172a',
      borderRight: '1px solid #1e293b',
      display:    'flex',
      flexDirection: 'column',
      transition: 'width 0.25s ease',
      overflow:   'hidden',
      flexShrink: 0,
    }}>
      {/* Logo */}
      <div style={{
        padding:    '24px 16px',
        borderBottom: '1px solid #1e293b',
        display:    'flex',
        alignItems: 'center',
        gap:        '12px',
      }}>
        <span style={{ fontSize: '1.5rem', flexShrink: 0 }}>◈</span>
        {!collapsed && (
          <span style={{
            fontFamily:  "'DM Mono', monospace",
            fontSize:    '0.8rem',
            fontWeight:  700,
            color:       '#e2e8f0',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
          }}>
            AKRS
          </span>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          style={{
            marginLeft: 'auto', background: 'none', border: 'none',
            color: '#475569', cursor: 'pointer', fontSize: '1rem', flexShrink: 0,
          }}
        >
          {collapsed ? '›' : '‹'}
        </button>
      </div>

      {/* User badge */}
      {!collapsed && (
        <div style={{
          padding:    '16px',
          borderBottom: '1px solid #1e293b',
        }}>
          <div style={{
            background: '#1e293b', borderRadius: '8px', padding: '12px',
          }}>
            <div style={{ fontSize: '0.7rem', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              {user?.role}
            </div>
            <div style={{ color: '#e2e8f0', fontSize: '0.85rem', fontWeight: 600, marginTop: '4px' }}>
              {user?.name}
            </div>
            <div style={{ color: '#64748b', fontSize: '0.72rem', marginTop: '2px' }}>
              {user?.email}
            </div>
          </div>
        </div>
      )}

      {/* Nav */}
      <nav style={{ flex: 1, padding: '12px 8px', overflowY: 'auto' }}>
        {items.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/admin' || item.path === '/faculty' || item.path === '/student'}
            style={({ isActive }) => ({
              display:      'flex',
              alignItems:   'center',
              gap:          '12px',
              padding:      '10px 12px',
              borderRadius: '6px',
              marginBottom: '4px',
              textDecoration: 'none',
              color:    isActive ? '#38bdf8' : '#94a3b8',
              background: isActive ? '#0c4a6e22' : 'transparent',
              borderLeft: isActive ? '2px solid #38bdf8' : '2px solid transparent',
              fontSize:  '0.85rem',
              fontWeight: isActive ? 600 : 400,
              transition: 'all 0.15s',
              whiteSpace: 'nowrap',
              overflow:   'hidden',
            })}
          >
            <span style={{ fontSize: '1rem', flexShrink: 0 }}>{item.icon}</span>
            {!collapsed && item.label}
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div style={{ padding: '12px 8px', borderTop: '1px solid #1e293b' }}>
        <button
          onClick={handleLogout}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: '12px',
            padding: '10px 12px', borderRadius: '6px', border: 'none',
            background: 'none', color: '#ef4444', cursor: 'pointer',
            fontSize: '0.85rem', fontWeight: 500, whiteSpace: 'nowrap',
          }}
        >
          <span style={{ flexShrink: 0 }}>⊗</span>
          {!collapsed && 'Logout'}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;