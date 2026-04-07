const pool = require('./src/config/db');
(async () => {
  try {
    const [tables] = await pool.execute('SHOW TABLES');
    console.log('Tables:', tables);
    for (const tableObj of tables) {
      const tableName = Object.values(tableObj)[0];
      const [columns] = await pool.execute(`DESCRIBE ${tableName}`);
      console.log(`Structure of ${tableName}:`, columns);
    }
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
