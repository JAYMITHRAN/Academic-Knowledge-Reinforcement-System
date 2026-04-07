// src/components/Layout/AppLayout.jsx
import React from 'react';
import Sidebar from './Sidebar';

const AppLayout = ({ children }) => (
  <div style={{
    display:    'flex',
    minHeight:  '100vh',
    background: '#0a0f1e',
    color:      '#e2e8f0',
    fontFamily: "'Inter', sans-serif",
  }}>
    <Sidebar />
    <main style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
      {children}
    </main>
  </div>
);

export default AppLayout;
