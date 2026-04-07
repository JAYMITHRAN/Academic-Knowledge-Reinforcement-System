// src/services/marksheet.service.js
const ExcelJS = require('exceljs');
const pool    = require('../config/db');

/**
 * Expected Excel columns (case-insensitive):
 *   student_code | student_name | course_code | course_name | unit_1_marks | unit_2_marks ... | exam_type
 *
 * Support for Unit 1 to 5.
 */

const parseMarksheet = async (buffer, originalname) => {
  const workbook = new ExcelJS.Workbook();
  const { Readable } = require('stream');

  // Detect CSV by file extension hint stored on the buffer, or by sniffing content
  // multer stores originalname on req.file; we accept it as a second param
  const isCsv = originalname
    ? originalname.toLowerCase().endsWith('.csv')
    : !buffer.slice(0, 4).equals(Buffer.from([0x50, 0x4B, 0x03, 0x04])); // not a ZIP/xlsx

  if (isCsv) {
    const stream = Readable.from(buffer);
    await workbook.csv.read(stream);
  } else {
    const stream = Readable.from(buffer);
    await workbook.xlsx.read(stream);
  }

  const sheet = workbook.worksheets[0];
  if (!sheet) throw new Error('No worksheet found in uploaded file.');

  // First row = headers
  const headerRow = sheet.getRow(1);
  const headers   = [];
  headerRow.eachCell({ includeEmpty: true }, (cell) => {
    headers.push(
      String(cell.value ?? '').trim().toLowerCase().replace(/\s+/g, '_')
    );
  });

  const rows = [];
  sheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber === 1) return; // skip header
    const obj = {};
    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      const key = headers[colNumber - 1];
      if (key) obj[key] = cell.value ?? '';
    });
    rows.push(obj);
  });

  return rows;
};

/**
 * processMarksheet
 * ─────────────────
 * Parses the uploaded file, validates each row,
 * inserts marks into DB, and runs performance analysis.
 *
 * Returns summary: { total, success, failed, errors }
 */
const processMarksheet = async (buffer, uploadedBy, originalname, maxMarksOverride = 100) => {
  const rows    = await parseMarksheet(buffer, originalname);
  const errors  = [];
  let   success = 0;

  for (let i = 0; i < rows.length; i++) {
    const row     = rows[i];
    const lineNum = i + 2; // Excel row number (header = row 1)

    // ── Validate required fields ───────────────────────────────
    const studentCode = String(row.student_code || '').trim();
    const courseCode  = String(row.course_code  || '').trim();
    const examType    = String(row.exam_type || 'unit_test').trim().toLowerCase();

    // Check for marks in any unit (unit_1_marks, unit_2_marks, ...)
    const unitMarks = [];
    for (let uNum = 1; uNum <= 5; uNum++) {
      const field = `unit_${uNum}_marks`;
      if (row[field] !== undefined && row[field] !== '') {
        const val = parseFloat(row[field]);
        if (!isNaN(val)) unitMarks.push({ unitNumber: uNum, marks: val });
      }
    }

    if (!studentCode) {
      errors.push({ row: lineNum, error: 'Missing student_code' });
      continue;
    }
    if (!courseCode) {
      errors.push({ row: lineNum, error: 'Missing course_code' });
      continue;
    }
    if (unitMarks.length === 0) {
      errors.push({ row: lineNum, error: 'At least one unit mark is required' });
      continue;
    }

    try {
      // ── Resolve student ─────────────────────────────────────
      const [sRows] = await pool.execute(
        'SELECT id FROM students WHERE student_code = ?',
        [studentCode]
      );
      if (sRows.length === 0) {
        errors.push({ row: lineNum, error: `Student not found: ${studentCode}` });
        continue;
      }
      const studentId = sRows[0].id;

      // ── Resolve course ──────────────────────────────────────
      const [cRows] = await pool.execute(
        'SELECT id FROM courses WHERE course_code = ?',
        [courseCode]
      );
      if (cRows.length === 0) {
        errors.push({ row: lineNum, error: `Course not found: ${courseCode}` });
        continue;
      }
      const courseId = cRows[0].id;

      // ── Process each unit entry ──────────────────────────────
      for (const item of unitMarks) {
        // ── Insert / update mark ───────────────────────────────
        await pool.execute(
          `INSERT INTO marks (student_id, course_id, marks, max_marks, exam_type, unit_number, uploaded_by)
           VALUES (?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE
             marks       = VALUES(marks),
             max_marks   = VALUES(max_marks),
             uploaded_by = VALUES(uploaded_by),
             uploaded_at = NOW()`,
          [studentId, courseId, item.marks, maxMarksOverride, examType, item.unitNumber, uploadedBy]
        );

        // ── Run performance analysis ───────────────────────────
        await analyzePerformance(studentId, courseId, item.marks, maxMarksOverride, examType, item.unitNumber);
      }

      // ── Auto-enroll if not already enrolled ─────────────────
      await pool.execute(
        `INSERT IGNORE INTO enrollments (student_id, course_id) VALUES (?, ?)`,
        [studentId, courseId]
      );

      success++;
    } catch (err) {
      errors.push({ row: lineNum, error: err.message });
    }
  }

  return { total: rows.length, success, failed: errors.length, errors };
};

/**
 * analyzePerformance
 * ───────────────────
 * Determines performance level and upserts into performance_analysis.
 */
const analyzePerformance = async (studentId, courseId, marks, maxMarks, examType, unitNumber = 1) => {
  const percentage = (marks / maxMarks) * 100;

  let level;
  if (percentage < 50)       level = 'weak';              // Below 50%
  else if (percentage < 75)  level = 'needs_improvement'; // 50% to 75%
  else                       level = 'strong';            // Above 75%

  await pool.execute(
    `INSERT INTO performance_analysis
       (student_id, course_id, exam_type, unit_number, marks, percentage, performance_level)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       marks             = VALUES(marks),
       percentage        = VALUES(percentage),
       performance_level = VALUES(performance_level),
       analyzed_at       = NOW()`,
    [studentId, courseId, examType, unitNumber, marks, percentage.toFixed(2), level]
  );
};

/**
 * upsertMark
 * ───────────
 * Reusable function for both bulk and individual entries.
 */
const upsertMark = async (studentId, courseId, marks, maxMarks, examType, unitNumber, uploadedBy) => {
  // ── Insert / update mark ───────────────────────────────
  await pool.execute(
    `INSERT INTO marks (student_id, course_id, marks, max_marks, exam_type, unit_number, uploaded_by)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       marks       = VALUES(marks),
       max_marks   = VALUES(max_marks),
       uploaded_by = VALUES(uploaded_by),
       uploaded_at = NOW()`,
    [studentId, courseId, marks, maxMarks, examType, unitNumber, uploadedBy]
  );

  // ── Run performance analysis ───────────────────────────
  await analyzePerformance(studentId, courseId, marks, maxMarks, examType, unitNumber);

  // ── Auto-enroll if not already enrolled ─────────────────
  await pool.execute(
    `INSERT IGNORE INTO enrollments (student_id, course_id) VALUES (?, ?)`,
    [studentId, courseId]
  );
};

module.exports = { processMarksheet, analyzePerformance, upsertMark };