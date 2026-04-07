// src/services/api.js
import axios from 'axios';
import { auth } from '../firebase';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
});

// Attach Firebase ID token to every request automatically
api.interceptors.request.use(async (config) => {
  // 1. Attach Firebase ID token
  const user = auth.currentUser;
  if (user) {
    const token = await user.getIdToken();
    config.headers.Authorization = `Bearer ${token}`;
  }

  // 2. Bypass ngrok browser warning (for automated requests)
  config.headers['ngrok-skip-browser-warning'] = 'true';

  return config;
});

// ── Auth ──────────────────────────────────────────────────────────────────────
export const firebaseLogin  = (idToken) => api.post('/auth/firebase-login', { idToken });
export const getMe          = ()        => api.get('/auth/me');

// ── Admin ─────────────────────────────────────────────────────────────────────
export const getAdminDashboard       = ()     => api.get('/admin/dashboard');
export const getAIPracticeLogs       = ()     => api.get('/admin/practice-logs');
export const createUser              = (data) => api.post('/admin/users', data);
export const bulkImportUsers         = (file) => {
  const fd = new FormData();
  fd.append('file', file);
  return api.post('/admin/users/bulk-import', fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};
export const bulkImportCourses       = (file) => {
  const fd = new FormData();
  fd.append('file', file);
  return api.post('/admin/courses/bulk-import', fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};
export const listUsers               = (role) => api.get('/admin/users', { params: { role } });
export const toggleUserStatus        = (id)   => api.patch(`/admin/users/${id}/toggle`);
export const updateUser              = (id, data) => api.put(`/admin/users/${id}`, data);
export const createCourse            = (data) => api.post('/admin/courses', data);
export const listCourses             = ()     => api.get('/admin/courses');
export const getCourseDetail         = (id)   => api.get(`/admin/courses/${id}`);
export const enrollStudent           = (courseId, studentUserId) => api.post(`/admin/courses/${courseId}/enroll`, { student_user_id: studentUserId });
export const bulkEnrollStudents      = (courseId, file) => {
  const fd = new FormData();
  fd.append('file', file);
  return api.post(`/admin/courses/${courseId}/bulk-enroll`, fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};
export const assignFaculty           = (data) => api.post('/admin/courses/assign-faculty', data);
export const assignMentor            = (data) => api.post('/admin/mentorship', data);
export const getFacultyMentees       = (userId) => api.get(`/admin/users/${userId}/mentees`);
export const setUploadPermission     = (data) => api.post('/admin/faculty/upload-permission', data);
export const adminUpdateCourseUnits  = (courseId, units) => api.put(`/admin/courses/${courseId}/units`, { units });
export const adminBulkImportUnits    = (file) => {
  const fd = new FormData();
  fd.append('file', file);
  return api.post('/admin/courses/bulk-import-units', fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};
// Marks
export const adminUploadMaterial     = (data) => api.post('/admin/materials', data);
export const listMaterials           = (courseId) =>
  api.get('/admin/materials', { params: courseId ? { course_id: courseId } : {} });

// ── Faculty ───────────────────────────────────────────────────────────────────
export const getFacultyDashboard  = ()   => api.get('/faculty/dashboard');
export const getFacultyStudents   = ()   => api.get('/faculty/students');
export const getMentees           = ()   => api.get('/faculty/mentees');
export const getMenteeDetail      = (id) => api.get(`/faculty/mentees/${id}`);
export const facultyUploadMarksheet = (file, maxMarks) => {
  const fd = new FormData();
  fd.append('marksheet', file);
  fd.append('max_marks', maxMarks || 100);
  return api.post('/faculty/upload-marksheet', fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};
export const facultyUpsertIndividualMark = (data) => api.post('/faculty/individual-mark', data);

export const adminUploadMarksheet = (file, maxMarks) => {
  const fd = new FormData();
  fd.append('marksheet', file);
  fd.append('max_marks', maxMarks || 100);
  return api.post('/admin/upload-marksheet', fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};
export const adminUpsertIndividualMark = (data) => api.post('/admin/individual-mark', data);

export const getCourseUnits       = (courseId) => api.get(`/faculty/courses/${courseId}/units`);
export const updateCourseUnits    = (courseId, units) => api.put(`/faculty/courses/${courseId}/units`, { units });

// Faculty Unlock Management
export const getPendingUnlockRequests = ()   => api.get('/faculty/practice/unlock-requests');
export const approveUnlockRequest     = (id, action) => api.post(`/faculty/practice/approve-unlock/${id}`, { action });

// ── Student ───────────────────────────────────────────────────────────────────
export const getStudentPerformance = () => api.get('/student/performance');
export const getStudentMaterials   = () => api.get('/student/materials');
export const getStudentCourseDetail = (id) => api.get(`/student/courses/${id}`);

// Practice Tests
export const schedulePracticeTest   = (data) => api.post('/student/practice/schedule', data);
export const getScheduledTests      = ()     => api.get('/student/practice/scheduled');
export const getPracticeTestDetail  = (id)   => api.get(`/student/practice/test/${id}`);
export const submitPracticeTest     = (id, data) => api.post(`/student/practice/submit/${id}`, data);
export const requestEarlyUnlock     = (id, data) => api.post(`/student/practice/request-unlock/${id}`, data);

export default api;