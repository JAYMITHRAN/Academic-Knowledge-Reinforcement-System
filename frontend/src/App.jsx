// src/App.jsx
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/common/ProtectedRoute';

// Pages
import Login             from './pages/Login';
import StudentDashboard  from './pages/student/StudentDashboard';
import MyMaterials       from './pages/student/MyMaterials';
import AdminDashboard    from './pages/admin/AdminDashboard';
import ManageUsers       from './pages/admin/ManageUsers';
import ManageCourses     from './pages/admin/ManageCourses';
import MarksManagement   from './pages/admin/MarksManagement';
import CourseMaterials   from './pages/admin/CourseMaterials';
import AIPracticeLogs    from './pages/admin/AIPracticeLogs';
import Analytics         from './pages/admin/Analytics';
import FacultyDashboard  from './pages/faculty/FacultyDashboard';
import FacultyUpload     from './pages/faculty/FacultyUpload';
import StudentsList      from './pages/faculty/StudentsList';
import MenteeDetail      from './pages/faculty/MenteeDetail';
import TestRequests      from './pages/faculty/TestRequests';
import StudentPerformance from './pages/student/StudentPerformance';
import AIPractice        from './pages/student/AIPractice';
import TakePracticeTest  from './pages/student/TakePracticeTest';
import LearnTracker      from './pages/student/LearnTracker';

// Global styles injected once
const GlobalStyle = () => (
  <style>{`
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: #050a14;
      color: #e2e8f0;
      font-family: 'Inter', -apple-system, sans-serif;
      -webkit-font-smoothing: antialiased;
    }
    ::-webkit-scrollbar { width: 6px; }
    ::-webkit-scrollbar-track { background: #0f172a; }
    ::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 3px; }
    a { color: inherit; }
    input, select, textarea, button { font-family: inherit; }
  `}</style>
);

// Root redirect based on role
const RootRedirect = () => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user)   return <Navigate to="/login" replace />;
  const map = { admin: '/admin', faculty: '/faculty', student: '/student' };
  return <Navigate to={map[user.role] || '/login'} replace />;
};

const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<RootRedirect />} />
    <Route path="/login" element={<Login />} />

    {/* ── Student ── */}
    <Route path="/student" element={
      <ProtectedRoute allowedRoles={['student']}>
        <StudentDashboard />
      </ProtectedRoute>
    } />
    <Route path="/student/performance" element={
      <ProtectedRoute allowedRoles={['student']}>
        <StudentPerformance />
      </ProtectedRoute>
    } />
    <Route path="/student/materials" element={
      <ProtectedRoute allowedRoles={['student']}>
        <MyMaterials />
      </ProtectedRoute>
    } />
    <Route path="/student/practice" element={
      <ProtectedRoute allowedRoles={['student']}>
        <AIPractice />
      </ProtectedRoute>
    } />
    <Route path="/student/practice/:id" element={
      <ProtectedRoute allowedRoles={['student']}>
        <TakePracticeTest />
      </ProtectedRoute>
    } />
    <Route path="/student/learn-tracker" element={
      <ProtectedRoute allowedRoles={['student']}>
        <LearnTracker />
      </ProtectedRoute>
    } />

    {/* ── Admin ── */}
    <Route path="/admin" element={
      <ProtectedRoute allowedRoles={['admin']}>
        <AdminDashboard />
      </ProtectedRoute>
    } />
    <Route path="/admin/users" element={
      <ProtectedRoute allowedRoles={['admin']}>
        <ManageUsers />
      </ProtectedRoute>
    } />
    <Route path="/admin/courses" element={
      <ProtectedRoute allowedRoles={['admin']}>
        <ManageCourses />
      </ProtectedRoute>
    } />
    <Route path="/admin/marks" element={
      <ProtectedRoute allowedRoles={['admin']}>
        <MarksManagement />
      </ProtectedRoute>
    } />
    <Route path="/admin/materials" element={
      <ProtectedRoute allowedRoles={['admin']}>
        <CourseMaterials />
      </ProtectedRoute>
    } />
    <Route path="/admin/practice-logs" element={
      <ProtectedRoute allowedRoles={['admin']}>
        <AIPracticeLogs />
      </ProtectedRoute>
    } />
    <Route path="/admin/analytics" element={
      <ProtectedRoute allowedRoles={['admin']}>
        <Analytics />
      </ProtectedRoute>
    } />

    {/* ── Faculty ── */}
    <Route path="/faculty" element={
      <ProtectedRoute allowedRoles={['faculty']}>
        <FacultyDashboard />
      </ProtectedRoute>
    } />
    <Route path="/faculty/upload" element={
      <ProtectedRoute allowedRoles={['faculty']}>
        <FacultyUpload />
      </ProtectedRoute>
    } />
    <Route path="/faculty/students" element={
      <ProtectedRoute allowedRoles={['faculty']}>
        <StudentsList />
      </ProtectedRoute>
    } />
    <Route path="/faculty/mentees/:studentId" element={
      <ProtectedRoute allowedRoles={['faculty']}>
        <MenteeDetail />
      </ProtectedRoute>
    } />
    <Route path="/faculty/test-requests" element={
      <ProtectedRoute allowedRoles={['faculty']}>
        <TestRequests />
      </ProtectedRoute>
    } />

    {/* Catch-all */}
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

const App = () => (
  <BrowserRouter>
    <GlobalStyle />
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  </BrowserRouter>
);

export default App;