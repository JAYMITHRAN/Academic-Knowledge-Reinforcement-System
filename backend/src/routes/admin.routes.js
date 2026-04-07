// src/routes/admin.routes.js
const express  = require('express');
const router   = express.Router();
const ctrl     = require('../controllers/admin.controller');
const { verifyToken, requireRole } = require('../middleware/auth');
const { upload, handleMulterError } = require('../middleware/upload');

// All admin routes require authentication + admin role
router.use(verifyToken, requireRole('admin'));

router.get('/dashboard',           ctrl.getDashboard);
router.get('/practice-logs',      ctrl.getAIPracticeLogs);

// User management
router.post('/users',              ctrl.createUser);
router.post('/users/bulk-import',  upload.single('file'), handleMulterError, ctrl.bulkImportUsers);
router.get('/users',               ctrl.listUsers);
router.patch('/users/:userId/toggle',  ctrl.toggleUserStatus);
router.put('/users/:userId',           ctrl.updateUser);

// Course management
router.post('/courses',            ctrl.createCourse);
router.post('/courses/bulk-import', upload.single('file'), handleMulterError, ctrl.bulkImportCourses);
router.get('/courses',             ctrl.listCourses);
router.get('/courses/:courseId',   ctrl.getCourseDetail);
router.post('/courses/:courseId/enroll', ctrl.enrollStudent);
router.post('/courses/:courseId/bulk-enroll', upload.single('file'), handleMulterError, ctrl.bulkEnrollStudents);
router.post('/courses/assign-faculty', ctrl.assignFaculty);

// Course Units (Syllabus)
router.put('/courses/:courseId/units',            ctrl.updateCourseUnits);
router.post('/courses/bulk-import-units',         upload.single('file'), handleMulterError, ctrl.bulkImportCourseUnits);

// Mentorship
router.post('/mentorship',         ctrl.assignMentor);
router.get('/users/:userId/mentees', ctrl.getFacultyMentees);

// Faculty permissions
router.post('/faculty/upload-permission', ctrl.setFacultyUploadPermission);

// Marksheet
router.post('/upload-marksheet',   upload.single('marksheet'), handleMulterError, ctrl.uploadMarksheet);
router.post('/individual-mark',    ctrl.upsertIndividualMark);

// Materials
router.post('/materials',          ctrl.uploadMaterial);
router.get('/materials',           ctrl.listMaterials);

module.exports = router;