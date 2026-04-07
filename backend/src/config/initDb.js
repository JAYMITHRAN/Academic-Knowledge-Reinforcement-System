// src/config/initDb.js
// ─────────────────────────────────────────────────────────────────────────────
// Automatically creates all tables and seeds the default admin on first run.
// Called once at backend startup BEFORE the HTTP server begins listening.
// Safe to call on every restart — every statement uses IF NOT EXISTS / IGNORE.
// ─────────────────────────────────────────────────────────────────────────────
const pool = require('./db');

// Each entry is executed in order. The order matters because of foreign keys.
const DDL_STATEMENTS = [
  // ── 1. USERS ────────────────────────────────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS users (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    name         VARCHAR(150)                      NOT NULL,
    email        VARCHAR(255)                      NOT NULL UNIQUE,
    role         ENUM('admin','faculty','student') NOT NULL,
    is_active    BOOLEAN  DEFAULT TRUE,
    created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at   DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  // ── 2. STUDENTS ─────────────────────────────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS students (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    user_id      INT         NOT NULL UNIQUE,
    student_code VARCHAR(50) NOT NULL UNIQUE,
    department   VARCHAR(100) NOT NULL,
    year         TINYINT     NOT NULL,
    section      VARCHAR(10),
    created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_students_user
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  // ── 3. FACULTY ──────────────────────────────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS faculty (
    id               INT AUTO_INCREMENT PRIMARY KEY,
    user_id          INT         NOT NULL UNIQUE,
    employee_code    VARCHAR(50) NOT NULL UNIQUE,
    department       VARCHAR(100) NOT NULL,
    can_upload_marks BOOLEAN DEFAULT FALSE,
    created_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_faculty_user
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  // ── 4. COURSES ──────────────────────────────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS courses (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    course_code VARCHAR(20)  NOT NULL UNIQUE,
    course_name VARCHAR(200) NOT NULL,
    department  VARCHAR(100),
    semester    TINYINT,
    credits     TINYINT  DEFAULT 3,
    faculty_id  INT,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_courses_faculty
      FOREIGN KEY (faculty_id) REFERENCES faculty(id) ON DELETE SET NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  // ── 5. ENROLLMENTS ──────────────────────────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS enrollments (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    student_id  INT NOT NULL,
    course_id   INT NOT NULL,
    enrolled_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_enrollment (student_id, course_id),
    CONSTRAINT fk_enroll_student
      FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    CONSTRAINT fk_enroll_course
      FOREIGN KEY (course_id)  REFERENCES courses(id)  ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  // ── 6. MARKS ────────────────────────────────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS marks (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    student_id  INT          NOT NULL,
    course_id   INT          NOT NULL,
    marks       DECIMAL(5,2) NOT NULL,
    max_marks   DECIMAL(5,2) NOT NULL DEFAULT 100,
    exam_type   VARCHAR(50)  DEFAULT 'semester',
    uploaded_by INT,
    uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_mark (student_id, course_id, exam_type),
    CONSTRAINT fk_marks_student
      FOREIGN KEY (student_id)  REFERENCES students(id) ON DELETE CASCADE,
    CONSTRAINT fk_marks_course
      FOREIGN KEY (course_id)   REFERENCES courses(id)  ON DELETE CASCADE,
    CONSTRAINT fk_marks_uploader
      FOREIGN KEY (uploaded_by) REFERENCES users(id)    ON DELETE SET NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  // ── 7. PERFORMANCE ANALYSIS ─────────────────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS performance_analysis (
    id                INT AUTO_INCREMENT PRIMARY KEY,
    student_id        INT          NOT NULL,
    course_id         INT          NOT NULL,
    exam_type         VARCHAR(50)  DEFAULT 'semester',
    marks             DECIMAL(5,2) NOT NULL,
    percentage        DECIMAL(5,2) NOT NULL,
    performance_level ENUM('weak','needs_improvement','strong') NOT NULL,
    analyzed_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_analysis (student_id, course_id, exam_type),
    CONSTRAINT fk_pa_student
      FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    CONSTRAINT fk_pa_course
      FOREIGN KEY (course_id)  REFERENCES courses(id)  ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  // ── 8. COURSE MATERIALS ─────────────────────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS course_materials (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    course_id     INT          NOT NULL,
    title         VARCHAR(255) NOT NULL,
    description   TEXT,
    material_link TEXT         NOT NULL,
    material_type VARCHAR(50)  DEFAULT 'link',
    uploaded_by   INT,
    created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_cm_course
      FOREIGN KEY (course_id)   REFERENCES courses(id) ON DELETE CASCADE,
    CONSTRAINT fk_cm_uploader
      FOREIGN KEY (uploaded_by) REFERENCES users(id)   ON DELETE SET NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  // ── 9. MENTORSHIP ───────────────────────────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS mentorship (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    mentor_id   INT NOT NULL,
    student_id  INT NOT NULL,
    assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_mentorship (mentor_id, student_id),
    CONSTRAINT fk_mentor_faculty
      FOREIGN KEY (mentor_id)  REFERENCES faculty(id)  ON DELETE CASCADE,
    CONSTRAINT fk_mentor_student
      FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  // ── 10. MARKSHEET UPLOAD LOGS ───────────────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS marksheet_uploads (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    filename     VARCHAR(255) NOT NULL,
    uploaded_by  INT,
    total_rows   INT DEFAULT 0,
    success_rows INT DEFAULT 0,
    failed_rows  INT DEFAULT 0,
    status       ENUM('processing','completed','failed') DEFAULT 'processing',
    error_log    JSON,
    uploaded_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_mu_uploader
      FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
];

// Indexes created separately — IF NOT EXISTS syntax not supported for indexes
// in older MySQL, so we check existence first.
const INDEXES = [
  { name: 'idx_marks_student',    table: 'marks',               col: 'student_id' },
  { name: 'idx_marks_course',     table: 'marks',               col: 'course_id'  },
  { name: 'idx_analysis_student', table: 'performance_analysis', col: 'student_id' },
  { name: 'idx_analysis_level',   table: 'performance_analysis', col: 'performance_level' },
  { name: 'idx_materials_course', table: 'course_materials',    col: 'course_id'  },
  { name: 'idx_users_email',      table: 'users',               col: 'email'      },
];

// ─────────────────────────────────────────────────────────────────────────────
// createIndexIfMissing — checks information_schema before creating
// ─────────────────────────────────────────────────────────────────────────────
const createIndexIfMissing = async (conn, { name, table, col }) => {
  const [rows] = await conn.execute(
    `SELECT COUNT(*) AS cnt
     FROM information_schema.statistics
     WHERE table_schema = DATABASE()
       AND table_name   = ?
       AND index_name   = ?`,
    [table, name]
  );
  if (rows[0].cnt === 0) {
    await conn.execute(`CREATE INDEX ${name} ON ${table}(${col})`);
    console.log(`  ✦ index created: ${name}`);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// seedAdminUser — inserts the default admin only if no admin row exists yet
// ─────────────────────────────────────────────────────────────────────────────
const seedAdminUser = async (conn) => {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminName  = process.env.ADMIN_NAME || 'System Admin';

  if (!adminEmail) {
    console.warn(
      '  ⚠ ADMIN_EMAIL not set in .env — skipping admin seed.\n' +
      '    Set ADMIN_EMAIL=your@email.com to auto-create the first admin.'
    );
    return;
  }

  // Insert only if that email doesn't exist yet
  const [result] = await conn.execute(
    `INSERT INTO users (name, email, role)
     VALUES (?, ?, 'admin')
     ON DUPLICATE KEY UPDATE role = 'admin', is_active = TRUE`,
    [adminName, adminEmail]
  );

  if (result.affectedRows > 0 && result.insertId > 0) {
    console.log(`  ✦ admin seeded: ${adminEmail}`);
  } else {
    console.log(`  ✔ admin already exists: ${adminEmail}`);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// initDb — main export, called from app.js before server.listen()
// ─────────────────────────────────────────────────────────────────────────────
const initDb = async () => {
  console.log('🗄  Running database initialisation…');
  const conn = await pool.getConnection();

  try {
    // Run every CREATE TABLE IF NOT EXISTS statement in sequence
    for (const sql of DDL_STATEMENTS) {
      await conn.execute(sql);
    }
    console.log('  ✔ All tables verified / created');

    // Create missing indexes safely
    for (const idx of INDEXES) {
      await createIndexIfMissing(conn, idx);
    }

    // Seed default admin user from .env
    await seedAdminUser(conn);

    console.log('✅ Database initialisation complete\n');
  } catch (err) {
    console.error('❌ Database initialisation failed:', err.message);
    throw err; // bubble up — app.js will exit(1)
  } finally {
    conn.release();
  }
};

module.exports = initDb;
