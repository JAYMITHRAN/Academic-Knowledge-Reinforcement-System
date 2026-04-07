-- ============================================================
-- AKRS - Academic Knowledge Reinforcement System
-- MySQL Schema (Raw SQL — No ORM)
-- Compatible with Aiven MySQL
-- ============================================================

CREATE DATABASE IF NOT EXISTS akrs_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE akrs_db;

-- ─────────────────────────────────────────
-- 1. USERS (central auth table)
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    name         VARCHAR(150)                      NOT NULL,
    email        VARCHAR(255)                      NOT NULL UNIQUE,
    role         ENUM('admin','faculty','student') NOT NULL,
    is_active    BOOLEAN DEFAULT TRUE,
    created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at   DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ─────────────────────────────────────────
-- 2. STUDENTS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS students (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    user_id      INT          NOT NULL UNIQUE,
    student_code VARCHAR(50)  NOT NULL UNIQUE,
    department   VARCHAR(100) NOT NULL,
    year         TINYINT      NOT NULL,  -- 1,2,3,4
    section      VARCHAR(10),
    created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ─────────────────────────────────────────
-- 3. FACULTY
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS faculty (
    id                    INT AUTO_INCREMENT PRIMARY KEY,
    user_id               INT          NOT NULL UNIQUE,
    employee_code         VARCHAR(50)  NOT NULL UNIQUE,
    department            VARCHAR(100) NOT NULL,
    can_upload_marks      BOOLEAN DEFAULT FALSE,
    created_at            DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ─────────────────────────────────────────
-- 4. COURSES
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS courses (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    course_code  VARCHAR(20)  NOT NULL UNIQUE,
    course_name  VARCHAR(200) NOT NULL,
    department   VARCHAR(100),
    semester     TINYINT,
    credits      TINYINT DEFAULT 3,
    faculty_id   INT,
    created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (faculty_id) REFERENCES faculty(id) ON DELETE SET NULL
);

-- ─────────────────────────────────────────
-- 4.5. COURSE UNITS (Syllabus)
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS course_units (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    course_id    INT          NOT NULL,
    unit_number  TINYINT      NOT NULL, -- 1 to 5
    title        VARCHAR(255),
    description  TEXT,
    UNIQUE KEY uq_course_unit (course_id, unit_number),
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);

-- ─────────────────────────────────────────
-- 5. STUDENT-COURSE ENROLLMENT
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS enrollments (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    student_id   INT NOT NULL,
    course_id    INT NOT NULL,
    enrolled_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_enrollment (student_id, course_id),
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id)  REFERENCES courses(id)  ON DELETE CASCADE
);

-- ─────────────────────────────────────────
-- 6. MARKS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS marks (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    student_id    INT            NOT NULL,
    course_id     INT            NOT NULL,
    marks         DECIMAL(5,2)   NOT NULL,
    max_marks     DECIMAL(5,2)   NOT NULL DEFAULT 100,
    exam_type     VARCHAR(50)    DEFAULT 'semester', -- mid, semester, internal
    uploaded_by   INT,           -- user_id of uploader
    uploaded_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_mark (student_id, course_id, exam_type),
    FOREIGN KEY (student_id)  REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id)   REFERENCES courses(id)  ON DELETE CASCADE,
    FOREIGN KEY (uploaded_by) REFERENCES users(id)    ON DELETE SET NULL
);

-- ─────────────────────────────────────────
-- 7. PERFORMANCE ANALYSIS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS performance_analysis (
    id                INT AUTO_INCREMENT PRIMARY KEY,
    student_id        INT          NOT NULL,
    course_id         INT          NOT NULL,
    exam_type         VARCHAR(50)  DEFAULT 'semester',
    marks             DECIMAL(5,2) NOT NULL,
    percentage        DECIMAL(5,2) NOT NULL,
    performance_level ENUM('weak','needs_improvement','strong') NOT NULL,
    analyzed_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_analysis (student_id, course_id, exam_type),
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id)  REFERENCES courses(id)  ON DELETE CASCADE
);

-- ─────────────────────────────────────────
-- 8. COURSE MATERIALS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS course_materials (
    id             INT AUTO_INCREMENT PRIMARY KEY,
    course_id      INT          NOT NULL,
    title          VARCHAR(255) NOT NULL,
    description    TEXT,
    material_link  TEXT         NOT NULL,
    material_type  VARCHAR(50)  DEFAULT 'link', -- link, pdf, video, doc
    uploaded_by    INT,
    created_at     DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id)   REFERENCES courses(id) ON DELETE CASCADE,
    FOREIGN KEY (uploaded_by) REFERENCES users(id)   ON DELETE SET NULL
);

-- ─────────────────────────────────────────
-- 9. MENTORSHIP
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS mentorship (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    mentor_id   INT NOT NULL,   -- faculty.id
    student_id  INT NOT NULL,   -- students.id
    assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_mentorship (mentor_id, student_id),
    FOREIGN KEY (mentor_id)  REFERENCES faculty(id)  ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

-- ─────────────────────────────────────────
-- 10. MARKSHEET UPLOAD LOGS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS marksheet_uploads (
    id             INT AUTO_INCREMENT PRIMARY KEY,
    filename       VARCHAR(255) NOT NULL,
    uploaded_by    INT,
    total_rows     INT DEFAULT 0,
    success_rows   INT DEFAULT 0,
    failed_rows    INT DEFAULT 0,
    status         ENUM('processing','completed','failed') DEFAULT 'processing',
    error_log      JSON,
    uploaded_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL
);

-- ─────────────────────────────────────────
-- INDEXES FOR PERFORMANCE
-- ─────────────────────────────────────────
CREATE INDEX idx_marks_student     ON marks(student_id);
CREATE INDEX idx_marks_course      ON marks(course_id);
CREATE INDEX idx_analysis_student  ON performance_analysis(student_id);
CREATE INDEX idx_analysis_level    ON performance_analysis(performance_level);
CREATE INDEX idx_materials_course  ON course_materials(course_id);
CREATE INDEX idx_users_email       ON users(email);

-- ─────────────────────────────────────────
-- SEED: Default Admin User
-- (Replace with your actual admin email)
-- ─────────────────────────────────────────
INSERT INTO users (name, email, role) 
VALUES ('System Admin', 'admin@yourdomain.com', 'admin')
ON DUPLICATE KEY UPDATE role = 'admin';
