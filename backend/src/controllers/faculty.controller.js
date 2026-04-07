// src/controllers/faculty.controller.js
const pool                   = require('../config/db');
const { processMarksheet, upsertMark }   = require('../services/marksheet.service');

// ─── Faculty Dashboard ─────────────────────────────────────────────────────────
const getDashboard = async (req, res) => {
  try {
    const [fRows] = await pool.execute(
      'SELECT id, employee_code, department, can_upload_marks FROM faculty WHERE user_id = ?',
      [req.user.id]
    );
    if (!fRows.length) return res.status(404).json({ error: 'Faculty profile not found' });
    const faculty = fRows[0];

    // Courses assigned to this faculty
    const [courses] = await pool.execute(
      'SELECT id, course_code, course_name, semester, credits FROM courses WHERE faculty_id = ?',
      [faculty.id]
    );

    // Summary count
    const [[{ mentee_count }]] = await pool.execute(
      'SELECT COUNT(*) AS mentee_count FROM mentorship WHERE mentor_id = ?',
      [faculty.id]
    );

    return res.json({
      faculty: { ...faculty, name: req.user.name, email: req.user.email },
      courses,
      mentee_count,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// ─── Students in Faculty's Courses ────────────────────────────────────────────
const getStudents = async (req, res) => {
  try {
    const [fRows] = await pool.execute(
      'SELECT id FROM faculty WHERE user_id = ?', [req.user.id]
    );
    if (!fRows.length) return res.status(404).json({ error: 'Faculty not found' });
    const facultyId = fRows[0].id;

    const [students] = await pool.execute(
      `SELECT DISTINCT
         s.id, s.student_code, s.department, s.year, s.section,
         u.name, u.email,
         c.course_code, c.course_name,
         0 AS is_mentee
       FROM courses c
       JOIN enrollments e  ON e.course_id  = c.id
       JOIN students s     ON s.id         = e.student_id
       JOIN users u        ON u.id         = s.user_id
       WHERE c.faculty_id  = ?
       
       UNION
       
       SELECT DISTINCT
         s.id, s.student_code, s.department, s.year, s.section,
         u.name, u.email,
         'MENTEE' AS course_code, 'Mentorship Program' AS course_name,
         1 AS is_mentee
       FROM mentorship m
       JOIN students s ON s.id = m.student_id
       JOIN users u    ON u.id = s.user_id
       WHERE m.mentor_id = ?
       
       ORDER BY name`,
      [facultyId, facultyId]
    );

    return res.json({ students });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// ─── Mentees List ──────────────────────────────────────────────────────────────
const getMentees = async (req, res) => {
  try {
    const [fRows] = await pool.execute(
      'SELECT id FROM faculty WHERE user_id = ?', [req.user.id]
    );
    if (!fRows.length) return res.status(404).json({ error: 'Faculty not found' });
    const facultyId = fRows[0].id;

    // Mentees with their performance summary
    const [mentees] = await pool.execute(
      `SELECT
         s.id AS student_id, s.student_code, s.department, s.year,
         u.name, u.email,
         SUM(CASE WHEN pa.performance_level = 'weak'              THEN 1 ELSE 0 END) AS weak_count,
         SUM(CASE WHEN pa.performance_level = 'needs_improvement' THEN 1 ELSE 0 END) AS improvement_count,
         SUM(CASE WHEN pa.performance_level = 'strong'            THEN 1 ELSE 0 END) AS strong_count,
         COUNT(pa.id) AS total_courses
       FROM mentorship m
       JOIN students s ON s.id     = m.student_id
       JOIN users u    ON u.id     = s.user_id
       LEFT JOIN performance_analysis pa ON pa.student_id = s.id
       WHERE m.mentor_id = ?
       GROUP BY s.id, s.student_code, s.department, s.year, u.name, u.email
       ORDER BY weak_count DESC, u.name`,
      [facultyId]
    );

    return res.json({
      mentees: mentees.map(m => ({
        ...m,
        weak_count:        Number(m.weak_count),
        improvement_count: Number(m.improvement_count),
        strong_count:      Number(m.strong_count),
        total_courses:     Number(m.total_courses),
      })),
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// ─── Mentee Detail ─────────────────────────────────────────────────────────────
const getMenteeDetail = async (req, res) => {
  const { studentId } = req.params;
  try {
    const [fRows] = await pool.execute(
      'SELECT id FROM faculty WHERE user_id = ?', [req.user.id]
    );
    if (!fRows.length) return res.status(404).json({ error: 'Faculty not found' });
    const facultyId = fRows[0].id;

    // Verify mentorship or course enrollment
    const [mentorship] = await pool.execute(
      'SELECT id FROM mentorship WHERE mentor_id = ? AND student_id = ?',
      [facultyId, studentId]
    );
    
    const [enrollment] = await pool.execute(
      `SELECT c.id FROM courses c
       JOIN enrollments e ON e.course_id = c.id
       WHERE c.faculty_id = ? AND e.student_id = ? LIMIT 1`,
       [facultyId, studentId]
    );

    if (!mentorship.length && !enrollment.length) {
      return res.status(403).json({ error: 'Not your student or mentee' });
    }

    let marksQuery = `SELECT c.course_code, c.course_name, m.marks, m.max_marks, m.exam_type, m.unit_number,
              pa.percentage, pa.performance_level, cu.title AS unit_title
       FROM marks m
       JOIN courses c ON m.course_id = c.id
       LEFT JOIN course_units cu ON cu.course_id = m.course_id AND cu.unit_number = m.unit_number
       LEFT JOIN performance_analysis pa
         ON pa.student_id = m.student_id 
        AND pa.course_id = m.course_id 
        AND pa.exam_type = m.exam_type
        AND pa.unit_number = m.unit_number
       WHERE m.student_id = ?`;
    let queryParams = [studentId];

    if (!mentorship.length) {
      marksQuery += ` AND c.faculty_id = ?`;
      queryParams.push(facultyId);
    }

    marksQuery += ` ORDER BY pa.performance_level, c.course_name`;

    const [marks] = await pool.execute(marksQuery, queryParams);

    // Fetch practice tests
    const [practiceTests] = await pool.execute(
      `SELECT pt.*, c.course_code, c.course_name
       FROM practice_tests pt
       JOIN courses c ON pt.course_id = c.id
       WHERE pt.student_id = ? AND pt.status = 'completed'
       ORDER BY pt.completed_at DESC`,
      [studentId]
    );

    const [sRows] = await pool.execute(
      `SELECT s.id, s.student_code, s.department, s.year, u.name, u.email
       FROM students s JOIN users u ON s.user_id = u.id
       WHERE s.id = ?`,
       [studentId]
    );
    const student = sRows[0] || {};

    return res.json({ student, marks, practiceTests });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// ─── Faculty Upload Marks (if permitted) ──────────────────────────────────────
const uploadMarksheet = async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  // Check permission
  const [fRows] = await pool.execute(
    'SELECT can_upload_marks FROM faculty WHERE user_id = ?', [req.user.id]
  );
  if (!fRows.length || !fRows[0].can_upload_marks) {
    return res.status(403).json({ error: 'You do not have permission to upload marks' });
  }

  const [logResult] = await pool.execute(
    `INSERT INTO marksheet_uploads (filename, uploaded_by, status) VALUES (?, ?, 'processing')`,
    [req.file.originalname, req.user.id]
  );
  const uploadId = logResult.insertId;

  try {
    const maxMarks = parseFloat(req.body.max_marks) || 100;
    const summary = await processMarksheet(req.file.buffer, req.user.id, req.file.originalname, maxMarks);
    await pool.execute(
      `UPDATE marksheet_uploads
       SET status='completed', total_rows=?, success_rows=?, failed_rows=?, error_log=?
       WHERE id=?`,
      [summary.total, summary.success, summary.failed,
       JSON.stringify(summary.errors), uploadId]
    );
    return res.json({ message: 'Marksheet processed', summary, max_marks: maxMarks });
  } catch (err) {
    await pool.execute(
      `UPDATE marksheet_uploads SET status='failed', error_log=? WHERE id=?`,
      [JSON.stringify([{ error: err.message }]), uploadId]
    );
    return res.status(500).json({ error: err.message });
  }
};

// ─── Course Units (Syllabus) ──────────────────────────────────────────────────
const getCourseUnits = async (req, res) => {
  const { courseId } = req.params;
  try {
    const [units] = await pool.execute(
      `SELECT * FROM course_units WHERE course_id = ? ORDER BY unit_number ASC`,
      [courseId]
    );
    return res.json({ units });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

const updateCourseUnits = async (req, res) => {
  const { courseId } = req.params;
  const { units } = req.body; // Array of { unit_number, title, description }
  
  if (!Array.isArray(units)) return res.status(400).json({ error: 'units must be an array' });

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Upsert each unit
    for (const u of units) {
      if (!u.unit_number) continue;
      await conn.execute(
        `INSERT INTO course_units (course_id, unit_number, title, description, material_link)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE title = VALUES(title), description = VALUES(description), material_link = VALUES(material_link)`,
        [courseId, u.unit_number, u.title || null, u.description || null, u.material_link || null]
      );
    }

    await conn.commit();
    return res.json({ message: 'Course units updated successfully' });
  } catch (err) {
    await conn.rollback();
    return res.status(500).json({ error: err.message });
  } finally {
    conn.release();
  }
};

// ─── Individual Mark Entry ──────────────────────────────────────────────────
const upsertIndividualMark = async (req, res) => {
  const { studentId, courseId, marks, maxMarks, unitNumber, examType } = req.body;

  if (!studentId || !courseId || marks === undefined || !maxMarks || !unitNumber) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    await upsertMark(studentId, courseId, marks, maxMarks, examType || 'unit_test', unitNumber, req.user.id);
    return res.json({ message: 'Mark updated successfully' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
};

// ─── Test Unlock Management ─────────────────────────────────────────────────
const getPendingUnlockRequests = async (req, res) => {
  try {
    const [fRows] = await pool.execute('SELECT id FROM faculty WHERE user_id = ?', [req.user.id]);
    if (!fRows.length) return res.status(404).json({ error: 'Faculty not found' });
    const mentorId = fRows[0].id;

    const [requests] = await pool.execute(
      `SELECT pt.id, pt.unlock_request_at, pt.unit_number, pt.scheduled_at, pt.unlock_reason,
              u.name AS student_name, s.student_code,
              c.course_name, c.course_code
       FROM practice_tests pt
       JOIN mentorship m ON pt.student_id = m.student_id
       JOIN students s ON pt.student_id = s.id
       JOIN users u ON s.user_id = u.id
       JOIN courses c ON pt.course_id = c.id
       WHERE m.mentor_id = ? AND pt.unlock_status = 'pending' AND pt.status = 'scheduled'
       ORDER BY pt.unlock_request_at ASC`,
      [mentorId || null]
    );
    return res.json({ requests });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

const approveUnlockRequest = async (req, res) => {
  const { id } = req.params;
  const { action } = req.body; // 'granted' or 'denied'
  try {
    const [fRows] = await pool.execute('SELECT id FROM faculty WHERE user_id = ?', [req.user.id]);
    if (!fRows.length) return res.status(404).json({ error: 'Faculty not found' });
    const mentorId = fRows[0].id;

    const [check] = await pool.execute(
      `SELECT pt.id FROM practice_tests pt
       JOIN mentorship m ON pt.student_id = m.student_id
       WHERE pt.id = ? AND m.mentor_id = ?`,
      [id || null, mentorId || null]
    );
    if (!check.length) return res.status(403).json({ error: 'Unauthorized to manage this request' });

    if (action === 'granted') {
      await pool.execute(
        "UPDATE practice_tests SET unlock_status = 'granted', scheduled_at = NOW() WHERE id = ?",
        [id || null]
      );
    } else {
      await pool.execute(
        "UPDATE practice_tests SET unlock_status = 'denied' WHERE id = ?",
        [id || null]
      );
    }
    return res.json({ message: `Request ${action || 'processed'} successfully` });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

module.exports = { 
  getDashboard, getStudents, getMentees, getMenteeDetail, uploadMarksheet, 
  getCourseUnits, updateCourseUnits, upsertIndividualMark,
  getPendingUnlockRequests, approveUnlockRequest
};