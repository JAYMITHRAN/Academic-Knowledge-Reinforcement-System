# AKRS — Academic Knowledge Reinforcement System
## Complete Implementation Guide

---

## Table of Contents
1. [Project Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Aiven MySQL Setup](#aiven-setup)
4. [Firebase Setup](#firebase-setup)
5. [Backend Setup](#backend-setup)
6. [Frontend Setup](#frontend-setup)
7. [Database Initialization](#database-init)
8. [First Login & Admin Seed](#first-login)
9. [API Reference](#api-reference)
10. [Excel Marksheet Format](#marksheet-format)
11. [Performance Analysis Logic](#analysis-logic)
12. [Deployment](#deployment)
13. [Troubleshooting](#troubleshooting)

---

## 1. Project Overview <a name="overview"></a>

AKRS is a role-based academic platform with three user types:

| Role    | Can Do                                                          |
|---------|-----------------------------------------------------------------|
| Admin   | Create users, courses, upload marks, manage materials, analytics |
| Faculty | View own students, manage mentees, optionally upload marks       |
| Student | View own marks, performance analysis, study materials           |

**Authentication flow:**
```
Google Sign-In → Firebase ID Token → Backend verifies token
→ checks email in MySQL users table → returns role → access granted
```

---

## 2. Prerequisites <a name="prerequisites"></a>

- Node.js v18+
- npm v9+
- MySQL client (for running schema)
- An Aiven account (free tier works)
- A Firebase project (free Spark plan works)

---

## 3. Aiven MySQL Setup <a name="aiven-setup"></a>

### Step 1 — Create Aiven MySQL Service
1. Sign up at https://console.aiven.io
2. Create new service → **MySQL** → choose cloud/region → free trial or paid
3. Wait for service to start (2–3 min)

### Step 2 — Get Connection Details
From your service overview page, note:
```
Host:     your-service-mysql.aivencloud.com
Port:     12345   (varies)
User:     avnadmin
Password: (shown in console)
Database: defaultdb  (or create akrs_db)
```

### Step 3 — Download CA Certificate
1. In Aiven console → your MySQL service → **Overview** tab
2. Scroll to **Connection information**
3. Click **Download CA cert** → save as `backend/certs/ca.pem`

### Step 4 — Create the Database
```bash
mysql --ssl-ca=backend/certs/ca.pem \
      -h YOUR_HOST -P YOUR_PORT \
      -u avnadmin -p \
      -e "CREATE DATABASE IF NOT EXISTS akrs_db CHARACTER SET utf8mb4;"
```

### Step 5 — Run Schema
```bash
mysql --ssl-ca=backend/certs/ca.pem \
      -h YOUR_HOST -P YOUR_PORT \
      -u avnadmin -p akrs_db \
      < backend/schema.sql
```

---

## 4. Firebase Setup <a name="firebase-setup"></a>

### Frontend (Web SDK)
1. Go to https://console.firebase.google.com
2. Create new project (or use existing)
3. **Authentication** → Sign-in method → Enable **Google**
4. Add your domain to **Authorized Domains**:
   - `localhost` (already there)
   - Your production domain (e.g. `akrs.vercel.app`)
5. **Project Settings** → **Your Apps** → **Add app** → Web (`</>`)
6. Copy config object — you'll need:
   ```
   apiKey, authDomain, projectId, appId
   ```

### Backend (Admin SDK)
1. **Project Settings** → **Service Accounts** tab
2. Click **Generate new private key** → downloads a JSON file
3. From that JSON, extract:
   ```
   project_id      → FIREBASE_PROJECT_ID
   client_email    → FIREBASE_CLIENT_EMAIL
   private_key     → FIREBASE_PRIVATE_KEY
   ```

---

## 5. Backend Setup <a name="backend-setup"></a>

```bash
cd backend
cp .env.example .env
# Fill in all values in .env
npm install
npm run dev
```

### `.env` Values

```env
PORT=5000
NODE_ENV=development

# Aiven MySQL
DB_HOST=your-service.aivencloud.com
DB_PORT=23456
DB_USER=avnadmin
DB_PASSWORD=your_password
DB_NAME=akrs_db
DB_SSL_CA=./certs/ca.pem

# Firebase Admin
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\nYOUR...\n-----END RSA PRIVATE KEY-----\n"

# CORS
FRONTEND_URL=http://localhost:3000
```

> **Important:** The `FIREBASE_PRIVATE_KEY` must have literal `\n` (not real newlines) when stored in `.env`. The code handles the replacement automatically.

---

## 6. Frontend Setup <a name="frontend-setup"></a>

```bash
cd frontend
cp .env.example .env
# Fill in Firebase Web SDK config
npm install
npm start
```

### `.env` Values
```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_FIREBASE_API_KEY=AIzaSy...
REACT_APP_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
REACT_APP_FIREBASE_APP_ID=1:123...
```

---

## 7. Database Initialization <a name="database-init"></a>

After running `schema.sql`, verify tables were created:
```sql
USE akrs_db;
SHOW TABLES;
```
Expected output:
```
courses
course_materials
enrollments
faculty
marks
marksheet_uploads
mentorship
performance_analysis
students
users
```

---

## 8. First Login & Admin Seed <a name="first-login"></a>

The schema seeds one admin:
```sql
INSERT INTO users (name, email, role)
VALUES ('System Admin', 'admin@yourdomain.com', 'admin');
```

**Before running the schema**, edit `schema.sql` and replace `admin@yourdomain.com` with the actual Google account email you'll use as admin.

Or do it after:
```sql
UPDATE users SET email = 'your.real@gmail.com' WHERE role = 'admin';
```

Then sign in with that Google account — you'll land on the Admin Dashboard.

### Typical Setup Order
1. Admin logs in
2. Admin creates faculty users (Manage Users → New User)
3. Admin creates courses (Course Management → Create Course)
4. Admin assigns faculty to courses
5. Admin creates student users
6. Admin uploads marksheet CSV → marks inserted + analysis runs automatically
7. Admin assigns mentors to students (optional)
8. Admin uploads course materials
9. Students and faculty log in and see their dashboards

---

## 9. API Reference <a name="api-reference"></a>

### Auth
| Method | Endpoint              | Body              | Description                     |
|--------|-----------------------|-------------------|---------------------------------|
| POST   | `/api/auth/firebase-login` | `{ idToken }` | Verify token + check DB access |
| GET    | `/api/auth/me`        | —                 | Get current user + profile      |

### Admin (requires `admin` role)
| Method | Endpoint                          | Description                        |
|--------|-----------------------------------|------------------------------------|
| GET    | `/api/admin/dashboard`            | Stats + distribution + uploads     |
| POST   | `/api/admin/users`                | Create user (student/faculty/admin)|
| GET    | `/api/admin/users?role=student`   | List users (optional role filter)  |
| PATCH  | `/api/admin/users/:id/toggle`     | Toggle active/inactive             |
| POST   | `/api/admin/courses`              | Create course                      |
| GET    | `/api/admin/courses`              | List all courses with faculty      |
| POST   | `/api/admin/courses/assign-faculty` | `{ course_id, faculty_user_id }` |
| POST   | `/api/admin/mentorship`           | `{ mentor_user_id, student_user_id }` |
| POST   | `/api/admin/faculty/upload-permission` | `{ faculty_user_id, can_upload }` |
| POST   | `/api/admin/upload-marksheet`     | multipart: `marksheet` file        |
| POST   | `/api/admin/materials`            | Upload course material link        |
| GET    | `/api/admin/materials?course_id=` | List materials                     |

### Faculty (requires `faculty` role)
| Method | Endpoint                       | Description                       |
|--------|--------------------------------|-----------------------------------|
| GET    | `/api/faculty/dashboard`       | Profile + courses + mentee count  |
| GET    | `/api/faculty/students`        | Students in faculty's courses     |
| GET    | `/api/faculty/mentees`         | Mentees with performance summary  |
| GET    | `/api/faculty/mentees/:id`     | One mentee's full marks detail    |
| POST   | `/api/faculty/upload-marksheet`| Upload marks (if permitted)       |

### Student (requires `student` role)
| Method | Endpoint                    | Description                            |
|--------|-----------------------------|----------------------------------------|
| GET    | `/api/student/performance`  | All marks + analysis + recommendations |
| GET    | `/api/student/materials`    | Materials for enrolled courses         |

---

## 10. Excel / CSV Marksheet Format <a name="marksheet-format"></a>

### Required Columns
| Column         | Required | Notes                                |
|----------------|----------|--------------------------------------|
| `student_code` | ✓        | Must match `students.student_code`   |
| `course_code`  | ✓        | Must match `courses.course_code`     |
| `marks`        | ✓        | Numeric (e.g. `72` or `72.5`)        |
| `max_marks`    | optional | Defaults to `100`                    |
| `exam_type`    | optional | Defaults to `semester`; e.g. `mid`   |

### Sample CSV
```csv
student_code,course_code,marks,max_marks,exam_type
STU001,CS301,45,100,semester
STU001,CS302,72,100,semester
STU002,CS301,88,100,semester
```

### Notes
- Column headers are **case-insensitive** and **whitespace-trimmed**
- Rows with unknown `student_code` or `course_code` are **skipped** and logged as errors
- Duplicate `(student_id, course_id, exam_type)` → **upserted** (existing record updated)
- Auto-enrolls students into courses if not already enrolled
- Performance analysis runs **automatically** after each row insert

---

## 11. Performance Analysis Logic <a name="analysis-logic"></a>

```
percentage = (marks / max_marks) × 100

if percentage < 50  → performance_level = 'weak'
if percentage ≤ 70  → performance_level = 'needs_improvement'
if percentage > 70  → performance_level = 'strong'
```

Results are stored in `performance_analysis` table. Upserted on every marksheet upload, so re-uploading updated marks will recalculate the level.

The student dashboard automatically generates recommendations:
- Weak subjects → "Focus urgently on: ..."
- Needs improvement → "Needs more practice in: ..."

---

## 12. Deployment <a name="deployment"></a>

### Backend → Railway / Render / any Node host

1. Set all environment variables in the hosting platform's dashboard
2. Upload `certs/ca.pem` — for platforms without file system persistence, you can inline the cert:
   ```env
   DB_SSL_CA_BASE64=<base64 encoded ca.pem>
   ```
   Then update `db.js`:
   ```js
   const sslOptions = process.env.DB_SSL_CA_BASE64
     ? { ca: Buffer.from(process.env.DB_SSL_CA_BASE64, 'base64').toString() }
     : { ca: fs.readFileSync(path.resolve(process.env.DB_SSL_CA)) };
   ```
3. Build command: `npm install`
4. Start command: `node src/app.js`

### Frontend → Vercel / Netlify

```bash
cd frontend
npm run build
# Deploy the /build folder
```

Set environment variables in Vercel/Netlify dashboard:
```
REACT_APP_API_URL=https://your-backend.railway.app/api
REACT_APP_FIREBASE_API_KEY=...
REACT_APP_FIREBASE_AUTH_DOMAIN=...
REACT_APP_FIREBASE_PROJECT_ID=...
REACT_APP_FIREBASE_APP_ID=...
```

Add your production URL to Firebase → Authentication → Authorized Domains.

---

## 13. Troubleshooting <a name="troubleshooting"></a>

### "UNABLE_TO_VERIFY_LEAF_SIGNATURE" (SSL error)
→ The `ca.pem` file path is wrong. Verify `DB_SSL_CA=./certs/ca.pem` and that the file exists.

### "Unauthorized user" on login
→ The Google account's email is not in the `users` table. Add it via:
```sql
INSERT INTO users (name, email, role) VALUES ('Your Name', 'you@gmail.com', 'student');
```

### Firebase token invalid
→ Check that `FIREBASE_PRIVATE_KEY` in `.env` has `\n` (two characters: backslash + n), not actual newlines.

### CORS errors in browser
→ Ensure `FRONTEND_URL` in backend `.env` exactly matches your frontend origin, including protocol and port.

### Marks uploaded but analysis not running
→ Check the `performance_analysis` table. If rows are missing, verify `student_code` and `course_code` in the CSV match exactly what's in the DB.

### Faculty can't upload marks
→ The `faculty.can_upload_marks` flag is `false` by default. Admin must grant permission via the Course Management page or:
```sql
UPDATE faculty SET can_upload_marks = 1 WHERE user_id = (SELECT id FROM users WHERE email = 'faculty@email.com');
```
