// src/components/common/ProtectedRoute.jsx
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

/**
 * Protects any route — redirects to /login if not authenticated.
 * Optionally restricts to specific roles via `allowedRoles` prop.
 */
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100vh', background: '#0f172a', color: '#94a3b8',
        fontFamily: 'monospace', fontSize: '1.1rem', letterSpacing: '0.05em'
      }}>
        Authenticating...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to role's own dashboard
    const dashboardMap = {
      admin:   '/admin',
      faculty: '/faculty',
      student: '/student',
    };
    return <Navigate to={dashboardMap[user.role] || '/login'} replace />;
  }

  return children;
};

export default ProtectedRoute;
