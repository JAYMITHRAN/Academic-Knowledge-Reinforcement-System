const pool = require('./src/config/db');

async function migrate() {
  console.log('Running migration: add unit_number to marks and performance_analysis...');
  try {
    const conn = await pool.getConnection();

    // -- Update marks table --
    const [marksCols] = await conn.execute("SHOW COLUMNS FROM marks LIKE 'unit_number'");
    if (marksCols.length === 0) {
      console.log('Adding unit_number to marks...');
      await conn.execute("ALTER TABLE marks ADD COLUMN unit_number TINYINT DEFAULT 1");
    }

    // Update index for marks (student_id, course_id, exam_type, unit_number)
    // First, find the current unique constraint (usually named uniquely or by columns)
    const [marksIndices] = await conn.execute("SHOW INDEX FROM marks WHERE Non_unique = 0 AND Key_name != 'PRIMARY'");
    if (marksIndices.length > 0) {
      const idxName = marksIndices[0].Key_name;
      console.log(`Dropping old index ${idxName} and adding unit-wise index for marks...`);
      await conn.execute(`ALTER TABLE marks DROP INDEX ${idxName}`);
    }
    await conn.execute("ALTER TABLE marks ADD UNIQUE INDEX idx_student_course_exam_unit (student_id, course_id, exam_type, unit_number)");

    // -- Update performance_analysis table --
    const [paCols] = await conn.execute("SHOW COLUMNS FROM performance_analysis LIKE 'unit_number'");
    if (paCols.length === 0) {
      console.log('Adding unit_number to performance_analysis...');
      await conn.execute("ALTER TABLE performance_analysis ADD COLUMN unit_number TINYINT DEFAULT 1");
    }

    const [paIndices] = await conn.execute("SHOW INDEX FROM performance_analysis WHERE Non_unique = 0 AND Key_name != 'PRIMARY'");
    if (paIndices.length > 0) {
      const idxName = paIndices[0].Key_name;
      console.log(`Dropping old index ${idxName} and adding unit-wise index for performance_analysis...`);
      await conn.execute(`ALTER TABLE performance_analysis DROP INDEX ${idxName}`);
    }
    await conn.execute("ALTER TABLE performance_analysis ADD UNIQUE INDEX idx_pa_student_course_exam_unit (student_id, course_id, exam_type, unit_number)");

    console.log('Migration successful: unit_number added and indices updated.');
    conn.release();
  } catch (err) {
    console.error('Migration failed:', err.message);
  } finally {
    process.exit(0);
  }
}

migrate();
