const pool = require('./src/config/db');

async function check() {
  try {
    const [marksCols] = await pool.execute('DESCRIBE marks');
    console.log('--- MARKS TABLE ---');
    console.table(marksCols);

    const [paCols] = await pool.execute('DESCRIBE performance_analysis');
    console.log('--- PERFORMANCE_ANALYSIS TABLE ---');
    console.table(paCols);

    const [constraints] = await pool.execute(`
        SELECT TABLE_NAME, COLUMN_NAME, CONSTRAINT_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
        FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME IN ('marks', 'performance_analysis')
    `);
    console.log('--- CONSTRAINTS ---');
    console.table(constraints);

  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

check();
