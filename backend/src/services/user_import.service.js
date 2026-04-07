// src/services/user_import.service.js
const ExcelJS = require('exceljs');
const pool    = require('../config/db');

/**
 * Expected columns:
 * name | email | role | department | year | section | student_code | employee_code
 */
const parseUserSheet = async (buffer, originalname) => {
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
      if (key) obj[key] = cell.value ?? '';
    });
    rows.push(obj);
  });

  return rows;
};

const processUserImport = async (buffer, originalname) => {
  const rows = await parseUserSheet(buffer, originalname);
  const errors = [];
  let success = 0;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const lineNum = i + 2;

    const name          = String(row.name || '').trim();
    const email         = String(row.email || '').trim().toLowerCase();
    const role          = String(row.role || '').trim().toLowerCase();
    const department    = String(row.department || '').trim();
    const year          = parseInt(row.year, 10);
    const section       = String(row.section || '').trim();
    const student_code  = String(row.student_code || '').trim();
    const employee_code = String(row.employee_code || '').trim();

    if (!name || !email || !role) {
      errors.push({ row: lineNum, error: 'name, email, and role are required' });
      continue;
    }
    if (!['student', 'faculty', 'admin'].includes(role)) {
      errors.push({ row: lineNum, error: 'Invalid role' });
      continue;
    }

    if (role === 'student') {
      if (!student_code || !department || !year || isNaN(year)) {
        errors.push({ row: lineNum, error: 'student_code, department, and valid year are required for student' });
        continue;
      }
    } else if (role === 'faculty') {
      if (!employee_code || !department) {
        errors.push({ row: lineNum, error: 'employee_code and department are required for faculty' });
        continue;
      }
    }

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      // Check for existing user by email to avoid jumping auto-increments pointlessly
      const [uCheck] = await conn.execute('SELECT id FROM users WHERE email = ?', [email]);
      if (uCheck.length > 0) {
        throw new Error('Email already exists');
      }

      const [result] = await conn.execute(
        'INSERT INTO users (name, email, role) VALUES (?, ?, ?)',
        [name, email, role]
      );
      const userId = result.insertId;

      if (role === 'student') {
        const [sCheck] = await conn.execute('SELECT id FROM students WHERE student_code = ?', [student_code]);
        if (sCheck.length > 0) {
          throw new Error('Student code already exists');
        }
        await conn.execute(
          'INSERT INTO students (user_id, student_code, department, year, section) VALUES (?, ?, ?, ?, ?)',
          [userId, student_code, department, year, section || null]
        );
      } else if (role === 'faculty') {
        const [fCheck] = await conn.execute('SELECT id FROM faculty WHERE employee_code = ?', [employee_code]);
        if (fCheck.length > 0) {
          throw new Error('Employee code already exists');
        }
        await conn.execute(
          'INSERT INTO faculty (user_id, employee_code, department) VALUES (?, ?, ?)',
          [userId, employee_code, department]
        );
      }

      await conn.commit();
      success++;
    } catch (err) {
      await conn.rollback();
      if (err.code === 'ER_DUP_ENTRY') {
        errors.push({ row: lineNum, error: 'Duplicate entry detected (email, student_code or employee_code)' });
      } else {
        errors.push({ row: lineNum, error: err.message });
      }
    } finally {
      conn.release();
    }
  }

  return { total: rows.length, success, failed: errors.length, errors };
};

module.exports = { processUserImport };
