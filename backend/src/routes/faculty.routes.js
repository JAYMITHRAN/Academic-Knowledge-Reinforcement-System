// src/routes/faculty.routes.js
const express  = require('express');
const router   = express.Router();
const ctrl     = require('../controllers/faculty.controller');
const { verifyToken, requireRole } = require('../middleware/auth');
const { upload, handleMulterError } = require('../middleware/upload');

router.use(verifyToken, requireRole('faculty', 'admin'));

router.get('/dashboard',           ctrl.getDashboard);
router.get('/students',            ctrl.getStudents);
router.get('/mentees',             ctrl.getMentees);
router.get('/mentees/:studentId',  ctrl.getMenteeDetail);
router.post('/upload-marksheet',   upload.single('marksheet'), handleMulterError, ctrl.uploadMarksheet);
router.get('/courses/:courseId/units',    ctrl.getCourseUnits);
router.put('/courses/:courseId/units',    ctrl.updateCourseUnits);

// Practice Test Unlock Management
router.get('/practice/unlock-requests',   ctrl.getPendingUnlockRequests);
router.post('/practice/approve-unlock/:id', ctrl.approveUnlockRequest);

module.exports = router;