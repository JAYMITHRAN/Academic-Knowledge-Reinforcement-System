const pool = require('./backend/src/config/db');

async function test() {
  try {
    const [rows] = await pool.execute('SELECT * FROM users LIMIT 1');
    console.log('User columns:', Object.keys(rows[0] || {}));
    
    const [fRows] = await pool.execute('SELECT * FROM faculty LIMIT 1');
    console.log('Faculty columns:', Object.keys(fRows[0] || {}));

    const [ptRows] = await pool.execute('SELECT * FROM practice_tests LIMIT 1');
    console.log('Practice Test columns:', Object.keys(ptRows[0] || {}));

    const [mRows] = await pool.execute('SELECT * FROM mentorship LIMIT 1');
    console.log('Mentorship columns:', Object.keys(mRows[0] || {}));
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

test();
