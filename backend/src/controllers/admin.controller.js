// src/controllers/admin.controller.js
const pool               = require('../config/db');
const { processMarksheet, upsertMark } = require('../services/marksheet.service');
const { processUserImport } = require('../services/user_import.service');
const { processCourseImport } = require('../services/course_import.service');
const { processEnrollmentImport } = require('../services/enrollment_import.service');
const { processUnitImport } = require('../services/unit_import.service');

// ─── Dashboard Analytics ────────────────────────────────────────────────────
const getDashboard = async (req, res) => {
  try {
    const [[{ total_students }]]  = await pool.execute('SELECT COUNT(*) AS total_students FROM students');
    const [[{ total_faculty }]]   = await pool.execute('SELECT COUNT(*) AS total_faculty FROM faculty');
    const [[{ total_courses }]]   = await pool.execute('SELECT COUNT(*) AS total_courses FROM courses');
    const [[{ total_marks }]]     = await pool.execute('SELECT COUNT(*) AS total_marks FROM marks');
    const [[{ total_uploads }]]   = await pool.execute('SELECT COUNT(*) AS total_uploads FROM marksheet_uploads');
    const [[{ total_ai_practice }]] = await pool.execute("SELECT COUNT(*) AS total_ai_practice FROM practice_tests WHERE status = 'completed'");

    // Performance distribution
    const [distribution] = await pool.execute(
      `SELECT performance_level, COUNT(*) AS count
       FROM performance_analysis GROUP BY performance_level`
    );

    // Recent uploads
    const [recentUploads] = await pool.execute(
      `SELECT mu.*, u.name AS uploaded_by_name
       FROM marksheet_uploads mu
       LEFT JOIN users u ON mu.uploaded_by = u.id
       ORDER BY mu.uploaded_at DESC LIMIT 5`
    );

    return res.json({
      stats: {
        total_students: Number(total_students),
        total_faculty:  Number(total_faculty),
        total_courses:  Number(total_courses),
        total_marks:    Number(total_marks),
        total_uploads:  Number(total_uploads),
        total_ai_practice: Number(total_ai_practice),
      },
      distribution: distribution.map(d => ({ ...d, count: Number(d.count) })),
      recentUploads,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
};

// ─── Create User ─────────────────────────────────────────────────────────────
const createUser = async (req, res) => {
  const { name, email, role, department, year, section,
          student_code, employee_code } = req.body;

  if (!name || !email || !role) {
    return res.status(400).json({ error: 'name, email, role are required' });
  }
  if (!['student', 'faculty', 'admin'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role' });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Insert into users
    const [result] = await conn.execute(
      'INSERT INTO users (name, email, role) VALUES (?, ?, ?)',
      [name, email, role]
    );
    const userId = result.insertId;

    // Insert role-specific row
    if (role === 'student') {
      if (!student_code || !department || !year) {
        throw new Error('student_code, department, year required for student');
      }
      await conn.execute(
        'INSERT INTO students (user_id, student_code, department, year, section) VALUES (?, ?, ?, ?, ?)',
        [userId, student_code, department, year, section || null]
      );
    } else if (role === 'faculty') {
      if (!employee_code || !department) {
        throw new Error('employee_code and department required for faculty');
      }
      await conn.execute(
        'INSERT INTO faculty (user_id, employee_code, department) VALUES (?, ?, ?)',
        [userId, employee_code, department]
      );
    }

    await conn.commit();
    return res.status(201).json({ message: 'User created successfully', userId });
  } catch (err) {
    await conn.rollback();
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Email or code already exists' });
    }
    return res.status(500).json({ error: err.message });
  } finally {
    conn.release();
  }
};

// ─── Bulk Import Users ──────────────────────────────────────────────────────────
const bulkImportUsers = async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  try {
    const summary = await processUserImport(req.file.buffer, req.file.originalname);
    return res.json({ message: 'User import processed', summary });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// ─── Bulk Import Courses ──────────────────────────────────────────────────────────
const bulkImportCourses = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const summary = await processCourseImport(req.file.buffer, req.file.originalname);
    return res.json({ summary });
  } catch (err) {
    console.error('Course Import Error:', err);
    return res.status(500).json({ error: err.message });
  }
};

// ─── List Users ───────────────────────────────────────────────────────────────
const listUsers = async (req, res) => {
  const { role } = req.query;
  try {
    let query = `
      SELECT
        u.id, u.name, u.email, u.role, u.is_active, u.created_at,
        -- Student fields
        s.student_code, s.department AS s_department, s.year, s.section,
        -- Faculty fields
        f.employee_code, f.department AS f_department, f.can_upload_marks
      FROM users u
      LEFT JOIN students s ON s.user_id = u.id AND u.role = 'student'
      LEFT JOIN faculty  f ON f.user_id = u.id AND u.role = 'faculty'
    `;
    const params = [];
    if (role) {
      query += ' WHERE u.role = ?';
      params.push(role);
    }
    query += ' ORDER BY u.created_at DESC';

    const [rows] = await pool.execute(query, params);

    // Normalize department field per role
    const users = rows.map(u => ({
      ...u,
      department: u.role === 'student' ? u.s_department : u.role === 'faculty' ? u.f_department : null,
      s_department: undefined,
      f_department: undefined,
    }));

    return res.json({ users });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// ─── Update User ──────────────────────────────────────────────────────────────
const updateUser = async (req, res) => {
  const { userId } = req.params;
  const { name, department, year, section, student_code, employee_code, can_upload_marks } = req.body;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Get user role first
    const [uRows] = await conn.execute('SELECT role FROM users WHERE id = ?', [userId]);
    if (!uRows.length) return res.status(404).json({ error: 'User not found' });
    const { role } = uRows[0];

    // Update name in users table
    if (name) {
      await conn.execute('UPDATE users SET name = ? WHERE id = ?', [name, userId]);
    }

    // Update role-specific profile
    if (role === 'student') {
      await conn.execute(
        `UPDATE students SET
           student_code = COALESCE(NULLIF(?, ''), student_code),
           department   = COALESCE(NULLIF(?, ''), department),
           year         = COALESCE(NULLIF(?, ''), year),
           section      = COALESCE(NULLIF(?, ''), section)
         WHERE user_id = ?`,
        [student_code, department, year || null, section, userId]
      );
    } else if (role === 'faculty') {
      await conn.execute(
        `UPDATE faculty SET
           employee_code    = COALESCE(NULLIF(?, ''), employee_code),
           department       = COALESCE(NULLIF(?, ''), department),
           can_upload_marks = ?
         WHERE user_id = ?`,
        [employee_code, department, can_upload_marks ? 1 : 0, userId]
      );
    }

    await conn.commit();
    return res.json({ message: 'User updated successfully' });
  } catch (err) {
    await conn.rollback();
    return res.status(500).json({ error: err.message });
  } finally {
    conn.release();
  }
};
const toggleUserStatus = async (req, res) => {
  const { userId } = req.params;
  try {
    await pool.execute(
      'UPDATE users SET is_active = NOT is_active WHERE id = ?',
      [userId]
    );
    return res.json({ message: 'User status updated' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// ─── Create Course ────────────────────────────────────────────────────────────
const createCourse = async (req, res) => {
  const { course_code, course_name, department, semester, credits, faculty_user_id } = req.body;
  if (!course_code || !course_name) {
    return res.status(400).json({ error: 'course_code and course_name required' });
  }
  try {
    let facultyId = null;
    if (faculty_user_id) {
      const [f] = await pool.execute(
        'SELECT id FROM faculty WHERE user_id = ?', [faculty_user_id]
      );
      if (f.length) facultyId = f[0].id;
    }

    await pool.execute(
      `INSERT INTO courses (course_code, course_name, department, semester, credits, faculty_id)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [course_code, course_name, department || null, semester || null,
       credits || 3, facultyId]
    );
    return res.status(201).json({ message: 'Course created' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Course code already exists' });
    }
    return res.status(500).json({ error: err.message });
  }
};

// ─── List Courses ──────────────────────────────────────────────────────────────
const listCourses = async (req, res) => {
  try {
    const [courses] = await pool.execute(
      `SELECT c.*, u.name AS faculty_name
       FROM courses c
       LEFT JOIN faculty f ON c.faculty_id = f.id
       LEFT JOIN users u   ON f.user_id    = u.id
       ORDER BY c.created_at DESC`
    );
    return res.json({ courses });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// ─── Get Course Detail ────────────────────────────────────────────────────────
const getCourseDetail = async (req, res) => {
  const { courseId } = req.params;
  try {
    // 1. Course basic info + faculty
    const [[course]] = await pool.execute(
      `SELECT c.*, u.name AS faculty_name, u.email AS faculty_email
       FROM courses c
       LEFT JOIN faculty f ON c.faculty_id = f.id
       LEFT JOIN users u   ON f.user_id = u.id
       WHERE c.id = ?`,
      [courseId]
    );

    if (!course) return res.status(404).json({ error: 'Course not found' });

    // 2. Enrolled students (unique, one row per student)
    const [students] = await pool.execute(
      `SELECT DISTINCT s.id AS student_id, s.student_code, u.name, u.email
       FROM enrollments e
       JOIN students s ON e.student_id = s.id
       JOIN users u    ON s.user_id = u.id
       WHERE e.course_id = ?
       ORDER BY u.name ASC`,
      [courseId]
    );

    // 3. Performance distribution
    const [distribution] = await pool.execute(
      `SELECT performance_level, COUNT(*) AS count
       FROM performance_analysis
       WHERE course_id = ?
       GROUP BY performance_level`,
      [courseId]
    );

    // 4. Materials
    const [materials] = await pool.execute(
      `SELECT * FROM course_materials WHERE course_id = ? ORDER BY created_at DESC`,
      [courseId]
    );

    // 5. Course Units
    const [units] = await pool.execute(
      `SELECT * FROM course_units WHERE course_id = ? ORDER BY unit_number ASC`,
      [courseId]
    );

    return res.json({
      course,
      students,
      distribution: distribution.map(d => ({ ...d, count: Number(d.count) })),
      materials,
      units
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
};

// ─── Enroll Student to Course ───────────────────────────────────────────────
const enrollStudent = async (req, res) => {
  const { courseId } = req.params;
  const { student_user_id } = req.body;
  try {
    const [s] = await pool.execute(
      'SELECT id FROM students WHERE user_id = ?', [student_user_id]
    );
    if (!s.length) return res.status(404).json({ error: 'Student not found' });

    await pool.execute(
      'INSERT IGNORE INTO enrollments (student_id, course_id) VALUES (?, ?)',
      [s[0].id, courseId]
    );
    return res.json({ message: 'Student enrolled in course' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// ─── Assign Faculty to Course ─────────────────────────────────────────────────
const assignFaculty = async (req, res) => {
  const { course_id, faculty_user_id } = req.body;
  try {
    const [f] = await pool.execute(
      'SELECT id FROM faculty WHERE user_id = ?', [faculty_user_id]
    );
    if (!f.length) return res.status(404).json({ error: 'Faculty not found' });

    await pool.execute(
      'UPDATE courses SET faculty_id = ? WHERE id = ?',
      [f[0].id, course_id]
    );
    return res.json({ message: 'Faculty assigned to course' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// ─── Assign Mentor ─────────────────────────────────────────────────────────────
const assignMentor = async (req, res) => {
  const { mentor_user_id, student_user_id } = req.body;
  try {
    const [f] = await pool.execute(
      'SELECT id FROM faculty WHERE user_id = ?', [mentor_user_id]
    );
    const [s] = await pool.execute(
      'SELECT id FROM students WHERE user_id = ?', [student_user_id]
    );
    if (!f.length) return res.status(404).json({ error: 'Mentor (faculty) not found' });
    if (!s.length) return res.status(404).json({ error: 'Student not found' });

    await pool.execute(
      `INSERT IGNORE INTO mentorship (mentor_id, student_id) VALUES (?, ?)`,
      [f[0].id, s[0].id]
    );
    return res.json({ message: 'Mentor assigned' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// ─── Grant/Revoke Faculty Upload Permission ────────────────────────────────────
const setFacultyUploadPermission = async (req, res) => {
  const { faculty_user_id, can_upload } = req.body;
  try {
    await pool.execute(
      'UPDATE faculty SET can_upload_marks = ? WHERE user_id = ?',
      [can_upload ? 1 : 0, faculty_user_id]
    );
    return res.json({ message: `Upload permission ${can_upload ? 'granted' : 'revoked'}` });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// ─── Upload Marksheet ──────────────────────────────────────────────────────────
const uploadMarksheet = async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  // Log the upload
  const [logResult] = await pool.execute(
    `INSERT INTO marksheet_uploads (filename, uploaded_by, status)
     VALUES (?, ?, 'processing')`,
    [req.file.originalname, req.user.id]
  );
  const uploadId = logResult.insertId;

  try {
    const maxMarks = parseFloat(req.body.max_marks) || 100;
    const summary = await processMarksheet(req.file.buffer, req.user.id, req.file.originalname, maxMarks);
    
    // Update log
    await pool.execute(
      `UPDATE marksheet_uploads
       SET status = 'completed', total_rows = ?, success_rows = ?,
           failed_rows = ?, error_log = ?
       WHERE id = ?`,
      [summary.total, summary.success, summary.failed,
       JSON.stringify(summary.errors), uploadId]
    );

    return res.json({ message: 'Marksheet processed', uploadId, summary, max_marks: maxMarks });
  } catch (err) {
    await pool.execute(
      `UPDATE marksheet_uploads SET status = 'failed', error_log = ? WHERE id = ?`,
      [JSON.stringify([{ error: err.message }]), uploadId]
    );
    return res.status(500).json({ error: err.message });
  }
};

// ─── Upload Course Material ────────────────────────────────────────────────────
const uploadMaterial = async (req, res) => {
  const { course_id, title, description, material_link, material_type } = req.body;
  if (!course_id || !title || !material_link) {
    return res.status(400).json({ error: 'course_id, title, material_link required' });
  }
  try {
    await pool.execute(
      `INSERT INTO course_materials
         (course_id, title, description, material_link, material_type, uploaded_by)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [course_id, title, description || null, material_link,
       material_type || 'link', req.user.id]
    );
    return res.status(201).json({ message: 'Material uploaded' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// ─── List Materials ────────────────────────────────────────────────────────────
const listMaterials = async (req, res) => {
  const { course_id } = req.query;
  try {
    let query = `SELECT cm.*, c.course_name, c.course_code
                 FROM course_materials cm
                 JOIN courses c ON cm.course_id = c.id`;
    const params = [];
    if (course_id) {
      query += ' WHERE cm.course_id = ?';
      params.push(course_id);
    }
    query += ' ORDER BY cm.created_at DESC';
    const [materials] = await pool.execute(query, params);
    return res.json({ materials });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// ─── Get Mentees of a specific Faculty (admin view) ──────────────────────────
const getFacultyMentees = async (req, res) => {
  const { userId } = req.params;
  try {
    // Get faculty row from user_id
    const [fRows] = await pool.execute(
      'SELECT id FROM faculty WHERE user_id = ?', [userId]
    );
    if (!fRows.length) return res.status(404).json({ error: 'Faculty not found' });
    const facultyId = fRows[0].id;

    const [mentees] = await pool.execute(
      `SELECT
         s.id AS student_id, s.student_code, s.department, s.year, s.section,
         u.name, u.email, u.is_active
       FROM mentorship m
       JOIN students s ON s.id  = m.student_id
       JOIN users u    ON u.id  = s.user_id
       WHERE m.mentor_id = ?
       ORDER BY u.name`,
      [facultyId]
    );
    return res.json({ mentees });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// ─── Bulk Enroll Students ───────────────────────────────────────────────────
const bulkEnrollStudents = async (req, res) => {
  const { courseId } = req.params;
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const summary = await processEnrollmentImport(req.file.buffer, req.file.originalname, courseId);
    return res.json({ summary });
  } catch (err) {
    console.error('Bulk Enrollment Error:', err);
    return res.status(500).json({ error: err.message });
  }
};

// ─── Update Course Units ───────────────────────────────────────────────────────
const updateCourseUnits = async (req, res) => {
  const { courseId } = req.params;
  const { units } = req.body;
  if (!Array.isArray(units)) return res.status(400).json({ error: 'units must be an array' });

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
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

// ─── Bulk Import Course Units ─────────────────────────────────────────────────
const bulkImportCourseUnits = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const summary = await processUnitImport(req.file.buffer, req.file.originalname);
    return res.json({ summary });
  } catch (err) {
    console.error('Unit Import Error:', err);
    return res.status(500).json({ error: err.message });
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

// ─── AI Practice Logs ────────────────────────────────────────────────────────
const getAIPracticeLogs = async (req, res) => {
  try {
    const [logs] = await pool.execute(
      `SELECT pt.id, pt.unit_number, pt.score, pt.max_score, pt.status, pt.completed_at, pt.is_malpractice,
              u.name AS student_name, s.student_code,
              c.course_name, c.course_code
       FROM practice_tests pt
       JOIN students s ON pt.student_id = s.id
       JOIN users u ON s.user_id = u.id
       JOIN courses c ON pt.course_id = c.id
       WHERE pt.status = 'completed'
       ORDER BY pt.completed_at DESC`
    );
    return res.json({ logs });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getDashboard, createUser, bulkImportUsers, bulkImportCourses, listUsers, updateUser, toggleUserStatus,
  createCourse, listCourses, getCourseDetail, enrollStudent, bulkEnrollStudents, assignFaculty, assignMentor,
  setFacultyUploadPermission, uploadMarksheet, uploadMaterial, listMaterials,
  getFacultyMentees, updateCourseUnits, bulkImportCourseUnits, upsertIndividualMark, getAIPracticeLogs
};