// src/controllers/student.controller.js
const pool = require('../config/db');
const aiService = require('../services/ai.service');
const { analyzePerformance } = require('../services/marksheet.service');

// ─── Student Dashboard / Performance ──────────────────────────────────────────
const getPerformance = async (req, res) => {
  try {
    // Get student profile
    const [sRows] = await pool.execute(
      'SELECT id, student_code, department, year, section FROM students WHERE user_id = ?',
      [req.user.id]
    );
    if (!sRows.length) return res.status(404).json({ error: 'Student profile not found' });
    const student = sRows[0];

    const [marks] = await pool.execute(
      `SELECT
         c.id AS course_id, c.course_code, c.course_name,
         m.marks, m.max_marks, m.exam_type, m.unit_number,
         pa.percentage, pa.performance_level,
         cu.title AS unit_title
       FROM marks m
       JOIN courses c ON m.course_id = c.id
       LEFT JOIN course_units cu 
         ON cu.course_id = m.course_id AND cu.unit_number = m.unit_number
       LEFT JOIN performance_analysis pa
         ON pa.student_id = m.student_id
        AND pa.course_id  = m.course_id
        AND pa.exam_type  = m.exam_type
        AND pa.unit_number = m.unit_number
       WHERE m.student_id = ?
       ORDER BY pa.performance_level ASC, c.course_name ASC`,
      [student.id]
    );

    // Get Mentor details
    const [mentorRows] = await pool.execute(
      `SELECT u.name, u.email, f.department, f.employee_code
       FROM mentorship m
       JOIN faculty f ON m.mentor_id = f.id
       JOIN users u ON f.user_id = u.id
       WHERE m.student_id = ?`,
      [student.id]
    );
    const mentor = mentorRows[0] || null;

    // Get All Enrolled Courses
    const [enrolledCourses] = await pool.execute(
      `SELECT c.id, c.course_code, c.course_name, c.semester, c.credits, u.name AS faculty_name
       FROM enrollments e
       JOIN courses c ON e.course_id = c.id
       LEFT JOIN faculty f ON c.faculty_id = f.id
       LEFT JOIN users u ON f.user_id = u.id
       WHERE e.student_id = ?
       ORDER BY c.semester ASC, c.course_name ASC`,
      [student.id]
    );

    // Bucket by performance
    const weak               = marks.filter(m => m.performance_level === 'weak');
    const needs_improvement  = marks.filter(m => m.performance_level === 'needs_improvement');
    const strong             = marks.filter(m => m.performance_level === 'strong');

    // Build recommendation message
    const recommendations = [];
    const formatGrouped = (arr, typePrefix) => {
      const grouped = {};
      arr.forEach(m => {
        if (!grouped[m.course_name]) grouped[m.course_name] = [];
        if (m.unit_number) {
          grouped[m.course_name].push(`Unit ${m.unit_number}${m.unit_title ? `: ${m.unit_title}` : ''}`);
        }
      });
      Object.keys(grouped).forEach(course => {
        const units = grouped[course];
        recommendations.push({
          type: typePrefix,
          course: course,
          text: typePrefix === 'weak' ? `Focus urgently on: ${course}` : `Needs more practice in: ${course}`,
          units: units
        });
      });
    };

    formatGrouped(weak, 'weak');
    formatGrouped(needs_improvement, 'needs_improvement');

    return res.json({
      student: { ...student, name: req.user.name, email: req.user.email },
      mentor,
      enrolled_courses: enrolledCourses,
      marks,
      summary: {
        total:             marks.length,
        weak_count:        weak.length,
        improvement_count: needs_improvement.length,
        strong_count:      strong.length,
      },
      weak,
      needs_improvement,
      strong,
      recommendations,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
};

// ─── Course Materials for Student ─────────────────────────────────────────────
const getMaterials = async (req, res) => {
  try {
    const [sRows] = await pool.execute(
      'SELECT id FROM students WHERE user_id = ?', [req.user.id]
    );
    if (!sRows.length) return res.status(404).json({ error: 'Student not found' });
    const studentId = sRows[0].id;

    // Get materials for enrolled courses (prioritise weak subjects)
    const [materials] = await pool.execute(
      `SELECT
         cm.id, cm.title, cm.description, cm.material_link, cm.material_type,
         c.course_code, c.course_name,
         COALESCE(pa.performance_level, 'not_assessed') AS performance_level
       FROM enrollments e
       JOIN courses c ON e.course_id = c.id
       LEFT JOIN course_materials cm ON cm.course_id = c.id
       LEFT JOIN performance_analysis pa
         ON pa.student_id = e.student_id AND pa.course_id = c.id
       WHERE e.student_id = ? AND cm.id IS NOT NULL
       ORDER BY
         FIELD(pa.performance_level, 'weak', 'needs_improvement', 'strong', NULL),
         c.course_name`,
      [studentId]
    );

    return res.json({ materials });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// ─── Course Units + Materials for a specific enrolled course ────────────────────────
const getCourseDetail = async (req, res) => {
  const { courseId } = req.params;
  try {
    const [sRows] = await pool.execute(
      'SELECT id FROM students WHERE user_id = ?', [req.user.id]
    );
    if (!sRows.length) return res.status(404).json({ error: 'Student not found' });
    const studentId = sRows[0].id;

    // Ensure student is enrolled
    const [enroll] = await pool.execute(
      'SELECT id FROM enrollments WHERE student_id = ? AND course_id = ?',
      [studentId, courseId]
    );
    if (!enroll.length) return res.status(403).json({ error: 'Not enrolled in this course' });

    // Course info
    const [[course]] = await pool.execute(
      `SELECT c.*, u.name AS faculty_name, u.email AS faculty_email
       FROM courses c
       LEFT JOIN faculty f ON c.faculty_id = f.id
       LEFT JOIN users u ON f.user_id = u.id
       WHERE c.id = ?`, [courseId]
    );
    if (!course) return res.status(404).json({ error: 'Course not found' });

    // Course Units
    const [units] = await pool.execute(
      'SELECT * FROM course_units WHERE course_id = ? ORDER BY unit_number ASC',
      [courseId]
    );

    // Course Materials
    const [materials] = await pool.execute(
      `SELECT id, title, description, material_link, material_type, created_at
       FROM course_materials WHERE course_id = ? ORDER BY created_at DESC`,
      [courseId]
    );

    // Course Marks (Unit-wise)
    const [marks] = await pool.execute(
      `SELECT m.id, m.marks, m.max_marks, m.exam_type, m.unit_number,
              pa.performance_level
       FROM marks m
       LEFT JOIN performance_analysis pa
         ON pa.student_id = m.student_id 
        AND pa.course_id = m.course_id 
        AND pa.exam_type = m.exam_type
        AND pa.unit_number = m.unit_number
       WHERE m.student_id = ? AND m.course_id = ? 
       ORDER BY m.unit_number ASC`,
      [studentId, courseId]
    );

    return res.json({ course, units, materials, marks });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};


// ─── AI Practice Tests ───────────────────────────────────────────────────────

const schedulePracticeTest = async (req, res) => {
  const { courseId, unitNumber, scheduledAt } = req.body;
  if (!courseId || !unitNumber || !scheduledAt) {
    return res.status(400).json({ error: 'Missing courseId, unitNumber, or scheduledAt' });
  }

  try {
    const [sRows] = await pool.execute('SELECT id FROM students WHERE user_id = ?', [req.user.id]);
    if (!sRows.length) return res.status(404).json({ error: 'Student not found' });
    const studentId = sRows[0].id;

    // Generate questions for this test immediately so they are ready
    const questions = await aiService.generateQuestions(courseId, unitNumber);

    const [result] = await pool.execute(
      `INSERT INTO practice_tests (student_id, course_id, unit_number, scheduled_at, questions, status)
       VALUES (?, ?, ?, ?, ?, 'scheduled')`,
      [studentId, courseId, unitNumber, scheduledAt, JSON.stringify(questions)]
    );

    return res.json({ message: 'Practice test scheduled', testId: result.insertId });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
};

const getScheduledTests = async (req, res) => {
  try {
    const [sRows] = await pool.execute('SELECT id FROM students WHERE user_id = ?', [req.user.id]);
    if (!sRows.length) return res.status(404).json({ error: 'Student not found' });
    const studentId = sRows[0].id;

    const [tests] = await pool.execute(
      `SELECT
         pt.id, pt.student_id, pt.course_id, pt.unit_number,
         pt.scheduled_at, pt.completed_at, pt.score, pt.max_score, pt.status,
         pt.is_malpractice,
         c.course_code, c.course_name
       FROM practice_tests pt
       JOIN courses c ON pt.course_id = c.id
       WHERE pt.student_id = ?
       ORDER BY pt.scheduled_at DESC`,
      [studentId]
    );

    return res.json({ tests });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

const getPracticeTest = async (req, res) => {
  const { id } = req.params;
  try {
    const [tests] = await pool.execute(
      `SELECT pt.*, c.course_code, c.course_name
       FROM practice_tests pt
       JOIN courses c ON pt.course_id = c.id
       WHERE pt.id = ?`,
      [id || null]
    );
    if (!tests.length) return res.status(404).json({ error: 'Test not found' });
    
    const test = tests[0];

    // Enforce 24-hour lock unless granted
    if (test.status === 'scheduled') {
      const now = new Date();
      const sched = new Date(test.scheduled_at);
      if (now < sched && test.unlock_status !== 'granted') {
        const diff = Math.ceil((sched - now) / (1000 * 60));
        return res.status(403).json({ 
          error: `Test is locked for study. Available in ${Math.floor(diff / 60)}h ${diff % 60}m.`,
          locked: true,
          unlock_status: test.unlock_status
        });
      }
    }

    return res.json({ test });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

const submitPracticeTest = async (req, res) => {
  const { id }        = req.params;
  const { answers, malpractice } = req.body; // malpractice: boolean (optional)

  if (!answers || typeof answers !== 'object') {
    return res.status(400).json({ error: 'answers object is required' });
  }

  try {
    // Load the test record
    const [tests] = await pool.execute(
      `SELECT pt.*, c.course_name
       FROM practice_tests pt
       JOIN courses c ON pt.course_id = c.id
       WHERE pt.id = ?`,
      [id || null]
    );
    if (!tests.length) return res.status(404).json({ error: 'Test not found' });
    const test = tests[0];

    if (test.status === 'completed') {
      return res.status(400).json({ error: 'This test has already been submitted' });
    }

    let totalScore = 0;
    let maxScore   = 100;
    let perQuestion = [];
    let is_malpractice = malpractice ? true : false;

    if (malpractice) {
      // ── Handle Malpractice: zero score, no AI evaluation ──────────────────────
      totalScore = 0;
      maxScore   = 100; 
      perQuestion = Object.keys(answers).map(qid => ({
        id: qid, score: 0, feedback: 'Test invalidated due to malpractice (exit from fullscreen).'
      }));
    } else {
      // ── Normal Path: Call Groq AI for evaluation ─────────────────────────────
      // Parse stored questions
      const questions = typeof test.questions === 'string'
        ? JSON.parse(test.questions)
        : test.questions;

      // Fetch unit title for better Groq context
      const [unitRows] = await pool.execute(
        'SELECT title FROM course_units WHERE course_id = ? AND unit_number = ?',
        [test.course_id, test.unit_number]
      );
      const unitTitle = unitRows[0]?.title || `Unit ${test.unit_number} of ${test.course_name}`;

      const evaluation = await aiService.evaluateAnswers(questions, answers, unitTitle);
      totalScore = evaluation.totalScore;
      maxScore   = evaluation.maxScore;
      perQuestion = evaluation.perQuestion;
    }

    // ── Persist results to DB ────────────────────────────────────────────────
    await pool.execute(
      `UPDATE practice_tests
       SET score = ?, max_score = ?, answers = ?, ai_feedback = ?,
           is_malpractice = ?, status = 'completed', completed_at = NOW()
       WHERE id = ?`,
      [
        totalScore,
        maxScore,
        JSON.stringify(answers),
        JSON.stringify(perQuestion),
        is_malpractice ? 1 : 0,
        id || null,
      ]
    );

    // ── Dynamic Performance Status Update ────────────────────────────────────
    const scorePercent = (totalScore / maxScore) * 100;

    const [paRows] = await pool.execute(
      `SELECT performance_level FROM performance_analysis
       WHERE student_id = ? AND course_id = ? AND unit_number = ?`,
      [test.student_id, test.course_id, test.unit_number]
    );

    if (paRows.length > 0 && paRows[0].performance_level === 'weak' && scorePercent >= 70) {
      await pool.execute(
        `UPDATE performance_analysis
         SET performance_level = 'needs_improvement', analyzed_at = NOW()
         WHERE student_id = ? AND course_id = ? AND unit_number = ?`,
        [test.student_id, test.course_id, test.unit_number]
      );
    }

    return res.json({
      message:      'Test submitted and evaluated successfully',
      totalScore,
      maxScore,
      scorePercent: scorePercent.toFixed(1),
      improved:     paRows.length > 0 && paRows[0].performance_level === 'weak' && scorePercent >= 70,
      perQuestion,
    });
  } catch (err) {
    console.error('submitPracticeTest error:', err);
    return res.status(500).json({ error: err.message });
  }
};

const requestUnlock = async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;
  
  if (!reason || reason.trim().length === 0) {
    return res.status(400).json({ error: 'Please provide a reason for early access.' });
  }

  try {
    const [sRows] = await pool.execute('SELECT id FROM students WHERE user_id = ?', [req.user.id]);
    if (!sRows.length) return res.status(404).json({ error: 'Student not found' });
    const studentId = sRows[0].id;

    const [tests] = await pool.execute(
      'SELECT id, status, unlock_status FROM practice_tests WHERE id = ? AND student_id = ?',
      [id, studentId]
    );
    if (!tests.length) return res.status(404).json({ error: 'Test not found' });
    if (tests[0].status === 'completed') return res.status(400).json({ error: 'Test already completed' });
    if (tests[0].unlock_status !== 'none' && tests[0].unlock_status !== 'denied') {
      return res.status(400).json({ error: 'Unlock already requested or granted' });
    }

    await pool.execute(
      "UPDATE practice_tests SET unlock_status = 'pending', unlock_request_at = NOW(), unlock_reason = ? WHERE id = ?",
      [reason, id]
    );
    return res.json({ message: 'Early unlock requested. Please wait for your mentor to approve.' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getPerformance, getMaterials, getCourseDetail,
  schedulePracticeTest, getScheduledTests, getPracticeTest, submitPracticeTest,
  requestUnlock,
};
