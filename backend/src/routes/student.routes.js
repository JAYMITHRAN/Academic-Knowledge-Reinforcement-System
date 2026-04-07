// src/routes/student.routes.js
const express  = require('express');
const router   = express.Router();
const ctrl     = require('../controllers/student.controller');
const { verifyToken, requireRole } = require('../middleware/auth');

router.use(verifyToken, requireRole('student'));

router.get('/performance', ctrl.getPerformance);
router.get('/materials',   ctrl.getMaterials);
router.get('/courses/:courseId', ctrl.getCourseDetail);

// AI Practice Tests
router.post('/practice/schedule',  ctrl.schedulePracticeTest);
router.get('/practice/scheduled', ctrl.getScheduledTests);
router.get('/practice/test/:id',  ctrl.getPracticeTest);
router.post('/practice/submit/:id', ctrl.submitPracticeTest);
router.post('/practice/request-unlock/:id', ctrl.requestUnlock);

module.exports = router;
