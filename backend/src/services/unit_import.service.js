// src/services/unit_import.service.js
const ExcelJS = require('exceljs');
const pool    = require('../config/db');

/**
 * Expected columns:
 * course_code | unit_number | title | description | material_link
 */
const parseUnitSheet = async (buffer, originalname) => {
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

const processUnitImport = async (buffer, originalname) => {
  const rows = await parseUnitSheet(buffer, originalname);
  const errors = [];
  let success = 0;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const lineNum = i + 2;

    const course_code   = String(row.course_code || '').trim();
    const unit_number   = parseInt(row.unit_number, 10);
    const title         = String(row.title || '').trim();
    const description   = String(row.description || '').trim();
    const material_link = String(row.material_link || '').trim();

    if (!course_code || isNaN(unit_number) || unit_number < 1 || unit_number > 5) {
      errors.push({ row: lineNum, error: 'Valid course_code and unit_number (1-5) are required' });
      continue;
    }

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      // Ensure course exists
      const [cCheck] = await conn.execute('SELECT id FROM courses WHERE course_code = ?', [course_code]);
      if (cCheck.length === 0) {
        throw new Error(`Course code ${course_code} not found in database`);
      }
      const courseId = cCheck[0].id;

      // Upsert the unit
      await conn.execute(
        `INSERT INTO course_units (course_id, unit_number, title, description, material_link)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE title = VALUES(title), description = VALUES(description), material_link = VALUES(material_link)`,
        [courseId, unit_number, title || null, description || null, material_link || null]
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

module.exports = { processUnitImport };
