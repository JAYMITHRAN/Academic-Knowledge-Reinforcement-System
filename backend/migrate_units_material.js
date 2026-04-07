const pool = require('./src/config/db');

async function migrate() {
  console.log('Running migration: add material_link to course_units...');
  try {
    // Check if column already exists first
    const [cols] = await pool.execute(`
      SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'course_units'
        AND COLUMN_NAME = 'material_link'
    `);

    if (cols.length > 0) {
      console.log('Column material_link already exists, skipping.');
    } else {
      await pool.execute(`ALTER TABLE course_units ADD COLUMN material_link TEXT DEFAULT NULL`);
      console.log('Migration successful: material_link column added.');
    }
  } catch (err) {
    console.error('Migration failed:', err.message);
  } finally {
    process.exit(0);
  }
}

migrate();
