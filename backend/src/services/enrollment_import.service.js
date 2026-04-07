// src/services/enrollment_import.service.js
const ExcelJS = require('exceljs');
const pool    = require('../config/db');

/**
 * Expected columns:
 * student_code
 */
const parseEnrollmentSheet = async (buffer, originalname) => {
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

const processEnrollmentImport = async (buffer, originalname, courseId) => {
  const rows = await parseEnrollmentSheet(buffer, originalname);
  const errors = [];
  let success = 0;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const lineNum = i + 2;

    const student_code = String(row.student_code || '').trim();

    if (!student_code) {
      errors.push({ row: lineNum, error: 'student_code is required' });
      continue;
    }

    try {
      // Find student by code
      const [s] = await pool.execute(
        'SELECT id FROM students WHERE student_code = ?', [student_code]
      );
      if (!s.length) {
        errors.push({ row: lineNum, error: `Student code not found: ${student_code}` });
        continue;
      }

      const studentId = s[0].id;

      // Enroll student ignoring if already there
      const [result] = await pool.execute(
        'INSERT IGNORE INTO enrollments (student_id, course_id) VALUES (?, ?)',
        [studentId, courseId]
      );

      if (result.affectedRows === 0) {
        errors.push({ row: lineNum, error: `Student ${student_code} already enrolled` });
      } else {
        success++;
      }
    } catch (err) {
      errors.push({ row: lineNum, error: err.message });
    }
  }

  return { total: rows.length, success, failed: errors.length, errors };
};

module.exports = { processEnrollmentImport };
