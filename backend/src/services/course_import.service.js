// src/services/course_import.service.js
const ExcelJS = require('exceljs');
const pool    = require('../config/db');

/**
 * Expected columns:
 * course_code | course_name | department | semester | credits | faculty_email
 */
const parseCourseSheet = async (buffer, originalname) => {
  const workbook = new ExcelJS.Workbook();
  const { Readable } = require('stream');

  const isCsv = originalname
    ? originalname.toLowerCase().endsWith('.csv')
    : !buffer.slice(0, 4).equals(Buffer.from([0x50, 0x4B, 0x03, 0x04]));

  if (isCsv) {
    const stream = Readable.from(buffer);
    await workbook.csv.read(stream);
  } else {
    const stream = Readable.from(buffer);
    await workbook.xlsx.read(stream);
  }

  const sheet = workbook.worksheets[0];
  if (!sheet) throw new Error('No worksheet found in uploaded file.');

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
      if (key) {
        // Handle Excel Formula results
        if (cell.value && typeof cell.value === 'object' && cell.value.result !== undefined) {
          obj[key] = cell.value.result;
        } else {
          obj[key] = cell.value ?? '';
        }
      }
    });
    rows.push(obj);
  });

  return rows;
};

const processCourseImport = async (buffer, originalname) => {
  const rows = await parseCourseSheet(buffer, originalname);
  const errors = [];
  let success = 0;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const lineNum = i + 2;

    const course_code   = String(row.course_code || '').trim();
    const course_name   = String(row.course_name || '').trim();
    const department    = String(row.department || '').trim();
    const semester      = parseInt(row.semester, 10);
    const credits       = parseInt(row.credits, 10) || 3;
    const faculty_email = String(row.faculty_email || '').trim().toLowerCase();

    if (!course_code || !course_name) {
      errors.push({ row: lineNum, error: 'course_code and course_name are required' });
      continue;
    }

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      // Check for existing course
      const [cCheck] = await conn.execute('SELECT id FROM courses WHERE course_code = ?', [course_code]);
      if (cCheck.length > 0) {
        throw new Error(`Course code ${course_code} already exists`);
      }

      // Lookup faculty_id if faculty_email provided
      let facultyId = null;
      if (faculty_email) {
        const [fRows] = await conn.execute(
          `SELECT f.id FROM faculty f 
           JOIN users u ON f.user_id = u.id 
           WHERE u.email = ?`,
          [faculty_email]
        );
        if (fRows.length > 0) {
          facultyId = fRows[0].id;
        }
      }

      await conn.execute(
        'INSERT INTO courses (course_code, course_name, department, semester, credits, faculty_id) VALUES (?, ?, ?, ?, ?, ?)',
        [course_code, course_name, department || null, isNaN(semester) ? null : semester, credits, facultyId]
      );

      await conn.commit();
      success++;
    } catch (err) {
      await conn.rollback();
      errors.push({ row: lineNum, error: err.message });
    } finally {
      conn.release();
    }
  }

  return { total: rows.length, success, failed: errors.length, errors };
};

module.exports = { processCourseImport };
