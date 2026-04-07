const pool = require('./src/config/db');

async function migrate() {
    console.log('Running migration...');
    try {
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS course_units (
                id           INT AUTO_INCREMENT PRIMARY KEY,
                course_id    INT          NOT NULL,
                unit_number  TINYINT      NOT NULL,
                title        VARCHAR(255),
                description  TEXT,
                UNIQUE KEY uq_course_unit (course_id, unit_number),
                FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
            )
        `);
        console.log('Migration successful: course_units table created.');
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        process.exit(0);
    }
}

migrate();
