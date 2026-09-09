<div align="center">

# 🎓 AKRS — Academic Knowledge Reinforcement System
### *Intelligent, Closed-Loop Educational Remediation Powered by Groq AI (Llama 3.3 70B)*

<br />

![AKRS Hero Banner](./akrs_hero_banner.jpg)

<br />

[![React](https://img.shields.io/badge/React-18.2.0-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-5.1.4-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-4.18-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?style=for-the-badge&logo=mysql&logoColor=white)](https://www.mysql.com/)
[![Groq AI](https://img.shields.io/badge/Groq_AI-Llama_3.3_70B-F55036?style=for-the-badge&logo=ai&logoColor=white)](https://groq.com/)
[![Firebase](https://img.shields.io/badge/Firebase-Auth_JWT-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com/)
[![Recharts](https://img.shields.io/badge/Recharts-Data_Viz-22B5BF?style=for-the-badge)](https://recharts.org/)

---

### 📑 Complete Master Table of Contents
1. [Executive Summary & Problem Statement](#1-executive-summary--problem-statement)
2. [Why AKRS? The Closed-Loop Solution](#2-why-akrs-the-closed-loop-solution)
3. [What We Have Built (Complete Feature Tour)](#3-what-we-have-built-complete-feature-tour)
4. [System Architecture & Multi-Tier Topology](#4-system-architecture--multi-tier-topology)
5. [Data Flow Diagrams & Sequence Flows](#5-data-flow-diagrams--sequence-flows)
6. [Technology Stack Matrix](#6-technology-stack-matrix)
7. [Database Architecture & ER Model](#7-database-architecture--er-model)
8. [AI Engineering & Groq Llama 3.3 Pipeline](#8-ai-engineering--groq-llama-33-pipeline)
9. [Proctoring & Anti-Malpractice Suite](#9-proctoring--anti-malpractice-suite)
10. [Marksheet Ingestion & Excel Specifications](#10-marksheet-ingestion--excel-specifications)
11. [Step-by-Step Installation & Setup Guide](#11-step-by-step-installation--setup-guide)
12. [Complete REST API Reference](#12-complete-rest-api-reference)
13. [Test Cases & Performance Analysis](#13-test-cases--performance-analysis)
14. [Cloud Deployment Guide](#14-cloud-deployment-guide)
15. [Troubleshooting & FAQs](#15-troubleshooting--faqs)
16. [Repository Structure & Navigation](#16-repository-structure--navigation)
17. [Future Roadmap & Extensibility](#17-future-roadmap--extensibility)

---

</div>

<br />

## 1. Executive Summary & Problem Statement

### ⚠️ The Problem in Conventional Education
In higher education and university environments, student evaluation is plagued by structural limitations:
1. **The Summative Assessment Terminus**: Evaluations are restricted to midterms, internal assignments, and semester-end exams. Once grades are published (e.g., *35/100* or *Grade D*), the evaluation lifecycle permanently stops.
2. **Zero Automated Remediation**: The system diagnoses *that* a student failed a subject, but offers **no personalized, structured pathway** for conceptual recovery.
3. **Faculty Bandwidth Exhaustion**: In classes of 60–120+ students, professors cannot manually author individual subjective diagnostic exams for each student's specific weak syllabus units, supervise remediation sessions, prevent cheating, and evaluate essay answers with nuanced qualitative feedback.
4. **Compounding Knowledge Debt**: Foundational knowledge gaps (e.g., *Data Structures: Graph Algorithms* or *Database: Normalization*) compound across semesters, leading to exam backlogs, high dropout rates, and poor industry readiness.

### 💡 The AKRS Vision
**AKRS (Academic Knowledge Reinforcement System)** is an AI-native educational platform that turns passive grading into an **active, self-correcting mastery loop**. 

By uniting **unit-level academic analytics**, **Groq Cloud AI (Llama 3.3 70B)**, **browser-level proctoring**, and **mentor-governed study locks**, AKRS provides an automated, personalized tutoring and diagnostic pipeline for every student.

---

## 2. Why AKRS? The Closed-Loop Solution

AKRS replaces the broken "Grade & Forget" model with a **Closed-Loop Reinforcement Cycle**:

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│  Faculty/Admin  │       │ Analysis Engine │       │  24-Hour Study  │
│  Uploads Marks  │ ────► │ Detects "Weak"  │ ────► │  Lock Activated │
│   (Bulk Excel)  │       │ Syllabus Units  │       │ (Mentor Unlock) │
└─────────────────┘       └─────────────────┘       └────────┬────────┘
                                                             │
┌─────────────────┐       ┌─────────────────┐       ┌────────▼────────┐
│ Dynamic Mastery │       │ Groq Llama 3.3  │       │   Anti-Cheat    │
│ Status Upgrade  │ ◄──── │ Qualitative AI  │ ◄──── │ AI Practice Exam│
│ (Weak ➔ Imprv)  │       │  Evaluation     │       │ (Browser Guard) │
└─────────────────┘       └─────────────────┘       └─────────────────┘
```

### Core Pedagogical & Technical Innovations:
* 🎯 **Unit-Level Granularity**: Works directly at the 5-unit syllabus level (e.g., *Unit 3: Dynamic Programming*), avoiding vague course-level averages.
* ⏳ **Spaced Preparation (24h Study Lock)**: When a remedial practice test is scheduled, it is locked for 24 hours to enforce structured revision of course materials. Students who prepare ahead of time can request early unlock from their assigned mentor.
* 🧠 **Real-World Scenario Questions**: Questions generated by Groq are **scenario-based descriptive challenges** (requiring 3–5 sentences of technical reasoning) rather than easily guessable MCQs.
* 🛡️ **Anti-Malpractice Security Guard**: The test window enforces full-screen execution and continuously monitors browser tab visibility. Any exit or tab-switch triggers immediate test invalidation (Score = 0).
* ⚡ **Instant AI Rubric Evaluation**: Groq evaluates student submissions within 3–4 seconds across three distinct dimensions: *Relevance (0–3)*, *Technical Depth (0–4)*, and *Real-World Application (0–3)*.
* 📈 **Dynamic Performance Promotion**: Scoring $\ge 70\%$ on a remedial practice test automatically promotes the student's unit status from `weak` to `needs_improvement` in the database.

---

## 3. What We Have Built (Complete Feature Tour)

AKRS provides three purpose-built role interfaces with role-based access control (RBAC):

### 🧑‍🎓 1. Student Portal (`/student`)
* **Multi-Axis Radar Chart**: Interactive radar visualization comparing student proficiencies across all enrolled courses.
* **Urgency-Ranked Recommendations**: Actionable alert cards highlighting weak syllabus units requiring immediate remediation.
* **Course Explorer & Unit Syllabus**: Detailed view of syllabus descriptions (Units 1 to 5) and faculty-curated resources (PDFs, PPTs, Drive links, and videos).
* **AI Practice Testing Hub**: Schedule practice tests for weak units, monitor countdown locks, and request early unlock from mentors with custom justifications.
* **Proctored Examination Suite**: Distraction-free exam mode with full-screen enforcement, real-time timer countdown, and anti-tab-switch detectors.
* **Instant Qualitative Feedback**: Question-by-question scoring and personalized feedback generated by Llama 3.3.
* **Learn Tracker**: Self-directed study logging module to track hours, subject tags, and personal notes.

### 👨‍🏫 2. Faculty / Mentor Portal (`/faculty`)
* **Mentee Monitoring Dashboard**: Real-time cohort health view with color-coded risk flags (`Weak`, `Needs Improvement`, `Strong`).
* **Deep Student Drill-Down**: Inspect student radar charts, unit-wise mark histories, and remedial attempt logs.
* **Early Unlock Request Queue**: Review, approve, or deny student requests for unlocking practice tests ahead of the 24-hour lock.
* **Marksheet Ingestion**: Single-student score entry or bulk Excel/CSV sheet uploads with automatic validation.
* **Syllabus & Material Management**: Edit unit descriptions and upload multimedia learning materials for assigned courses.

### 🛠️ 3. Admin Console (`/admin`)
* **System Executive Dashboard**: Real-time stats on total student enrollment, active faculty, overall pass/at-risk rates, and course loads.
* **User Management Hub**: Complete CRUD and batch Excel onboarding for Admins, Faculty, and Students with one-click active/inactive toggle.
* **Curriculum & Syllabus Builder**: Manage course catalogs, assign teaching faculty, define 5-unit syllabus trees, and bulk-import curriculum files.
* **Course Enrollment Matrix**: Single and bulk student-to-course enrollments.
* **Mentorship Allocator**: Assign and reassign faculty mentors to student cohorts.
* **AI Practice Audit Logs**: Global inspection log showing all AI-generated tests, student responses, AI scores, and malpractice violations.

---

## 4. System Architecture & Multi-Tier Topology

AKRS follows a robust **Three-Tier Architecture** augmented with high-performance Cloud AI inference and Identity platforms.

```mermaid
graph TD
    classDef client fill:#0f172a,stroke:#38bdf8,stroke-width:2px,color:#f8fafc;
    classDef server fill:#1e1b4b,stroke:#818cf8,stroke-width:2px,color:#f8fafc;
    classDef data fill:#064e3b,stroke:#34d399,stroke-width:2px,color:#f8fafc;
    classDef cloud fill:#451a03,stroke:#fb923c,stroke-width:2px,stroke-dasharray: 5 5,color:#f8fafc;

    subgraph "Client Layer (Frontend SPA)"
        A1["React 18 + Vite"]
        A2["Recharts Visualizations"]
        A3["Firebase Client SDK"]
        A4["Proctoring Listener"]
    end
    class A1,A2,A3,A4 client;

    subgraph "Application Layer (Node.js & Express)"
        B1["Express REST Gateway"]
        B2["Auth Middleware (RBAC)"]
        B3["AI Service (Groq SDK)"]
        B4["Marks & Performance Engine"]
        B5["Bulk Ingestion (ExcelJS/Multer)"]
    end
    class B1,B2,B3,B4,B5 server;

    subgraph "Persistence Layer (Relational Storage)"
        C1[("Aiven MySQL Database")]
        C2[("Performance Analysis Cache")]
    end
    class C1,C2 data;

    subgraph "External Cloud Infrastructure"
        D1{{"Firebase Authentication (Google OAuth 2.0)"}}
        D2{{"Groq Cloud (Llama 3.3 70B Versatile)"}}
    end
    class D1,D2 cloud;

    %% Data Flow
    A1 -->|"1. Google Sign-In"| D1
    D1 -.->|"2. Identity Token"| A1
    A1 -->|"3. Bearer Token + API Requests"| B1
    B1 -->|"4. Verify Signature"| D1
    B1 --> B2
    B2 --> B4 & B5
    B1 --> B3
    B3 <-->|"5. Structured Prompts & Answers"| D2
    B1 <-->|"6. Queries & Migrations"| C1
    B4 -->|"7. Cache Computed Metrics"| C2
```

---

## 5. Data Flow Diagrams & Sequence Flows

### 🔄 Level 1 Data Flow Diagram (DFD)

```mermaid
graph LR
    U[Student] -->|1. Sign In| P1(Auth Process)
    P1 -->|2. Get Identity| DB[(Database)]
    DB -->|3. Performance Radar| U
    
    T[Teacher] -->|4. Upload Marks| P2(Import Process)
    P2 -->|5. Store Marks| DB
    DB -->|6. Trigger Analysis| P3(Analysis Process)
    P3 -->|7. Update Levels| DB
    
    U -->|8. Schedule Practice| P4(AI Generation)
    P4 -->|9. Fetch Syllabus| DB
    G[Groq AI] <-->|10. Gen/Grade| P4
    P4 -->|11. Store Results| DB
```

---

### ⏱️ Complete Remedial Lifecycle Sequence Diagram

```mermaid
sequenceDiagram
    autonumber
    actor Faculty
    actor Student
    participant Frontend as React Client
    participant Backend as Express API
    participant DB as MySQL DB
    participant Groq as Groq AI (Llama 3.3)

    Faculty->>Frontend: Upload Marksheet (Excel/CSV)
    Frontend->>Backend: POST /api/faculty/upload-marksheet
    Backend->>DB: Ingest Marks & Run Performance Analysis
    Note over Backend,DB: Students with < 40% flagged as 'weak'
    
    Student->>Frontend: Open Student Dashboard
    Frontend->>Backend: GET /api/student/performance
    Backend->>Frontend: Return Radar Data & Weak Unit Alerts
    
    Student->>Frontend: Click "Schedule AI Practice Test"
    Frontend->>Backend: POST /api/student/practice/schedule
    Backend->>Groq: Generate 10 Scenario Questions for Unit
    Groq-->>Backend: Return JSON Questions Array
    Backend->>DB: Save Practice Test (Status: Scheduled, 24h Lock)
    
    opt Early Unlock Requested
        Student->>Frontend: Submit Early Access Request with Reason
        Frontend->>Backend: POST /api/student/practice/request-unlock/:id
        Faculty->>Frontend: Approve Unlock Request
        Frontend->>Backend: POST /api/faculty/practice/approve-unlock/:id
        Backend->>DB: Set unlock_status = 'granted'
    end
    
    Student->>Frontend: Enter Test (Enforces Fullscreen)
    alt Tab Switch or Exit Fullscreen Detected
        Frontend->>Backend: POST /practice/submit (malpractice: true)
        Backend->>DB: Record Score = 0, is_malpractice = 1
    else Normal Submission
        Student->>Frontend: Submit Descriptive Answers
        Frontend->>Backend: POST /api/student/practice/submit/:id
        Backend->>Groq: Evaluate Answers (Relevance, Depth, Application)
        Groq-->>Backend: Return Scores & Constructive Feedback
        Backend->>DB: Store Results & Update Performance Level (if score >= 70%)
        Backend-->>Frontend: Display Final Report & Detailed AI Feedback
    end
```

---

## 6. Technology Stack Matrix

| Layer | Technology | Version | Purpose & Architectural Role |
| :--- | :--- | :--- | :--- |
| **Frontend Framework** | React | `^18.2.0` | Declarative component UI architecture with fast reconciliation |
| **Build Tool** | Vite | `^5.1.4` | Lightning-fast HMR and optimized production bundle compilation |
| **Routing** | React Router DOM | `^6.22.0` | Client-side routing with role-gated `<ProtectedRoute>` wrappers |
| **Styling** | Vanilla CSS | Custom | Custom Cyberpunk Glassmorphism design system with neon accents |
| **Data Visualization** | Recharts | `^2.12.0` | Dynamic SVG Radar and Bar charts for multi-subject competencies |
| **HTTP Client** | Axios | `^1.6.7` | Promised-based HTTP client with automatic Firebase JWT interceptors |
| **Backend Runtime** | Node.js | `>= 18.x` | High-throughput asynchronous JavaScript runtime |
| **Web Server Framework**| Express.js | `^4.18.2` | RESTful API gateway with modular controllers and middleware |
| **AI Inference** | Groq SDK | `^1.1.2` | Ultra-low latency inference for **Llama 3.3 70B Versatile** |
| **Authentication** | Firebase Admin & Auth | `^12.0.0` | Google OAuth 2.0 identity verification and token authorization |
| **Database Engine** | MySQL (Aiven Cloud)| `8.0` | ACID-compliant relational persistence layer |
| **DB Client** | `mysql2/promise` | `^3.6.5` | High-performance pooled connection driver with parameterized queries |
| **File / Data Ingestion**| `multer` + `exceljs` | `^2.0` / `^4.4` | Multipart syllabus uploads & bulk Excel marksheet ingestion |

---

## 7. Database Architecture & ER Model

```mermaid
erDiagram
    USERS ||--o| STUDENTS : "profile for"
    USERS ||--o| FACULTY : "profile for"
    USERS ||--o{ MARKSHEET_UPLOADS : "performed by"
    USERS ||--o{ COURSE_MATERIALS : "uploaded by"

    FACULTY ||--o{ COURSES : "instructs"
    FACULTY ||--o{ MENTORSHIP : "guides"

    STUDENTS ||--o{ ENROLLMENTS : "enrolled in"
    STUDENTS ||--o{ MARKS : "awarded"
    STUDENTS ||--o{ PERFORMANCE_ANALYSIS : "cached level"
    STUDENTS ||--o{ MENTORSHIP : "guided by"
    STUDENTS ||--o{ PRACTICE_TESTS : "attempts"

    COURSES ||--o{ COURSE_UNITS : "contains (1-5)"
    COURSES ||--o{ ENROLLMENTS : "has"
    COURSES ||--o{ MARKS : "evaluates"
    COURSES ||--o{ COURSE_MATERIALS : "resources"
    COURSES ||--o{ PRACTICE_TESTS : "tests"

    PRACTICE_TESTS {
        int id PK
        int student_id FK
        int course_id FK
        int unit_number
        json questions
        json answers
        json ai_feedback
        int score
        int max_score
        string status
        string unlock_status
        boolean is_malpractice
        datetime scheduled_at
        datetime completed_at
    }
```

### Table Definitions:
1. `users`: Central identity record holding user roles (`admin`, `faculty`, `student`) linked to Firebase UIDs.
2. `students` & `faculty`: Institutional profiles (student code, employee code, department, year, upload permissions).
3. `courses` & `course_units`: Catalog of subjects and detailed 5-unit syllabus descriptions used as AI prompt context.
4. `marks`: Raw assessment records uploaded by faculty/admins.
5. `performance_analysis`: Precomputed caching table categorizing scores into `weak` ($<40\%$), `needs_improvement` ($40\text{--}74\%$), or `strong` ($\ge 75\%$).
6. `practice_tests`: Stores AI-generated scenario questions, student responses, qualitative feedback, timer timestamps, unlock requests, and malpractice flags.
7. `mentorship`: Maps faculty mentors to student mentees for targeted guidance.
8. `course_materials`: Repository of faculty-uploaded files, videos, documents, and reference links.

---

## 8. AI Engineering & Groq Llama 3.3 Pipeline

AKRS utilizes a two-stage prompt engineering pipeline executed on **Groq Cloud (Llama 3.3 70B Versatile)**:

### 1. Scenario-Based Question Generation
```javascript
const systemPrompt = `You are an expert academic examiner. Your task is to create 10 thought-provoking, 
real-world scenario-based exam questions for a university-level course unit.

Rules:
1. Questions must describe a realistic situation or problem scenario.
2. Questions must ask "how" or "what would you do" or "explain your approach" — encouraging descriptive, 
   theoretical reasoning, NOT multiple choice.
3. Each question should require at least 3–5 sentences to answer properly.
4. Focus on problem-solving, analysis, and application of knowledge.
5. Return ONLY a valid JSON array: [{ "id": 1, "question": "..." }, ...]`;
```

### 2. Qualitative Rubric Evaluation & Grading
```javascript
const systemPrompt = `You are a strict but fair university examiner. 
Evaluate each student answer based on:
- Relevance to the question (0-3 marks)
- Depth of explanation and reasoning (0-4 marks)  
- Real-world applicability and examples given (0-3 marks)

Return ONLY a valid JSON array:
[
  { "id": 1, "score": <0-10>, "feedback": "<one concise sentence>" },
  ...
]`;
```

---

## 9. Proctoring & Anti-Malpractice Suite

During practice test execution (`TakePracticeTest.jsx`):
1. **Full-Screen Enforcement**: The exam window triggers `document.documentElement.requestFullscreen()`.
2. **Tab-Switch & Blur Detection**: The browser listens for `visibilitychange` and `window.onblur`.
3. **Malpractice Invalidation**: If the student switches windows or exits fullscreen:
   - The test immediately freezes.
   - An alert notifies the student: *"Test invalidated due to malpractice (exit from fullscreen or tab switch)."*
   - An automatic submission is dispatched with `{ malpractice: true }`.
   - The backend records `score = 0`, sets `is_malpractice = 1`, and skips AI evaluation.

---

## 10. Marksheet Ingestion & Excel Specifications

### CSV / Excel Column Format:
| Column | Required | Type | Example |
| :--- | :--- | :--- | :--- |
| `student_code` | **Yes** | String | `STU001` |
| `course_code` | **Yes** | String | `CS301` |
| `unit_number` | **Yes** | Integer (1–5) | `3` |
| `marks` | **Yes** | Decimal | `34.5` |
| `max_marks` | Optional | Decimal | `100` (Default) |
| `exam_type` | Optional | String | `semester` / `mid` / `internal` |

### Ingestion Logic:
* Column headers are trimmed and case-insensitive.
* Unknown `student_code` or `course_code` rows are skipped and logged into `marksheet_uploads.error_log`.
* Duplicate entries for `(student_id, course_id, unit_number, exam_type)` are automatically **upserted**.
* Triggers automatic re-analysis in `performance_analysis`.

---

## 11. Step-by-Step Installation & Setup Guide

### 📋 Prerequisites
* **Node.js**: v18.0.0 or higher
* **npm**: v9.0.0 or higher
* **MySQL**: Local MySQL Server 8.0 or an [Aiven for MySQL](https://aiven.io/mysql) cloud instance
* **Groq API Key**: Free tier available at [Groq Console](https://console.groq.com)
* **Firebase Project**: Configured for Google Authentication via [Firebase Console](https://console.firebase.google.com)

---

### 1️⃣ Clone & Navigate
```bash
git clone https://github.com/your-username/Project01__AKRSS.git
cd Project01__AKRSS/akrs-vite
```

---

### 2️⃣ Database Initialization
```bash
# Create database
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS akrs_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# Execute Schema
mysql -u root -p akrs_db < backend/schema.sql
```

---

### 3️⃣ Backend Setup
```bash
cd backend
npm install
cp .env.example .env
```

Configure `backend/.env`:
```ini
PORT=5000
FRONTEND_URL=http://localhost:3000

# Database Configuration (Local or Aiven)
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=akrs_db
DB_SSL=false

# AI Configuration (Groq Cloud)
GROQ_API_KEY=gsk_your_groq_api_key_here

# Firebase Admin SDK (From Project Settings > Service Accounts)
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_KEY\n-----END PRIVATE KEY-----\n"

# Initial Auto-Seeded Administrator
ADMIN_EMAIL=admin@yourinstitution.edu
```

Start backend:
```bash
npm run dev
# Server running at: http://localhost:5000
```

---

### 4️⃣ Frontend Setup
```bash
cd ../frontend
npm install
cp .env.example .env
```

Configure `frontend/.env`:
```ini
VITE_API_URL=http://localhost:5000/api

# Firebase Web App Configuration (From Firebase Console > Web App Settings)
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_APP_ID=1:123456789:web:...
```

Start frontend:
```bash
npm run dev
# Vite dev server running at: http://localhost:3000
```

---

### 🧪 Mock Mode (Zero-Config Testing)
* Leave Firebase `.env` variables blank.
* The frontend automatically launches in **Mock Mode** with quick login buttons for **Admin**, **Faculty**, and **Student** personas.

---

## 12. Complete REST API Reference

### 🔐 Auth (`/api/auth`)
| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/firebase-login` | Verify Firebase token & get user role | Public |
| `GET` | `/api/auth/me` | Fetch authenticated user profile | Authenticated |

### 🧑‍🎓 Student (`/api/student`)
| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/student/performance` | Radar scores, weak unit recommendations | Student |
| `GET` | `/api/student/materials` | Study materials prioritized by weakness | Student |
| `GET` | `/api/student/courses/:courseId` | Course units & marks breakdown | Student |
| `POST` | `/api/student/practice/schedule` | Schedule AI practice test for weak unit | Student |
| `GET` | `/api/student/practice/scheduled` | List scheduled & completed tests | Student |
| `GET` | `/api/student/practice/test/:id` | Fetch questions for unlocked test | Student |
| `POST` | `/api/student/practice/submit/:id` | Submit answers for Groq AI grading | Student |
| `POST` | `/api/student/practice/request-unlock/:id` | Request early unlock from mentor | Student |

### 👨‍🏫 Faculty (`/api/faculty`)
| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/faculty/dashboard` | Mentee overview and course list | Faculty, Admin |
| `GET` | `/api/faculty/students` | List all department students | Faculty, Admin |
| `GET` | `/api/faculty/mentees` | List assigned mentees with risk levels | Faculty, Admin |
| `GET` | `/api/faculty/mentees/:studentId` | Detailed mentee performance & logs | Faculty, Admin |
| `POST` | `/api/faculty/upload-marksheet` | Bulk import marksheet (Excel/CSV) | Faculty, Admin |
| `GET` | `/api/faculty/practice/unlock-requests` | View pending early test unlock requests | Faculty, Admin |
| `POST` | `/api/faculty/practice/approve-unlock/:id`| Approve/deny student unlock request | Faculty, Admin |

### 🛠️ Admin (`/api/admin`)
| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/admin/dashboard` | High-level institution metrics | Admin |
| `GET` | `/api/admin/users` | List all system users with filters | Admin |
| `POST` | `/api/admin/users` | Create single user (Admin/Faculty/Student) | Admin |
| `POST` | `/api/admin/users/bulk-import` | Bulk import users via Excel | Admin |
| `PATCH` | `/api/admin/users/:userId/toggle` | Activate / deactivate user account | Admin |
| `GET` | `/api/admin/courses` | List all courses with assigned faculty | Admin |
| `POST` | `/api/admin/courses` | Create new course entry | Admin |
| `POST` | `/api/admin/courses/bulk-import` | Bulk import courses via Excel | Admin |
| `POST` | `/api/admin/courses/:courseId/bulk-enroll` | Bulk enroll students via Excel | Admin |
| `POST` | `/api/admin/mentorship` | Assign mentor to student | Admin |
| `GET` | `/api/admin/practice-logs` | Inspect all AI tests & malpractice logs | Admin |

---

## 13. Test Cases & Performance Analysis

| Test ID | Feature | Input | Expected Output | Status |
| :--- | :--- | :--- | :--- | :--- |
| **TC-01** | Google Sign-in | Valid Google Token | JWT Verified; redirected to role dashboard | ✅ Passed |
| **TC-02** | AI Question Gen | Course Unit ID | 10 Scenario Questions generated via Groq in <2s | ✅ Passed |
| **TC-03** | Gap Identification | Mark entered < 40% | Categorized as `weak`; recommendation displayed | ✅ Passed |
| **TC-04** | Malpractice Invalidation | Tab switch during test | Test auto-submits; score=0; flagged malpractice | ✅ Passed |
| **TC-05** | Mastery Promotion | Practice score $\ge 70\%$ | Unit upgraded from `weak` to `needs_improvement` | ✅ Passed |

---

## 14. Cloud Deployment Guide

### Backend (Render / Railway)
1. Push repository to GitHub.
2. Link repository to Render / Railway Web Service.
3. Set environment variables (`DB_HOST`, `DB_USER`, `DB_PASSWORD`, `GROQ_API_KEY`, `FIREBASE_PRIVATE_KEY`, etc.).
4. Build command: `npm install` | Start command: `node src/app.js`.

### Frontend (Vercel / Netlify)
1. Link `frontend/` folder to Vercel.
2. Build command: `npm run build` | Output directory: `dist`.
3. Set `VITE_API_URL` to backend URL and `VITE_FIREBASE_*` credentials.
4. Add production domain to Firebase Authorized Domains.

---

## 15. Troubleshooting & FAQs

### 1. "UNABLE_TO_VERIFY_LEAF_SIGNATURE" (Aiven MySQL SSL error)
* Download the Aiven CA Certificate into `backend/ca.pem` and set `DB_SSL=true`.

### 2. "Unauthorized user" on Login
* Ensure the Google email used for sign-in exists in the MySQL `users` table:
```sql
INSERT INTO users (name, email, role) VALUES ('Your Name', 'you@gmail.com', 'student');
```

### 3. Firebase Private Key Formatting Error
* In `.env`, ensure the private key contains literal `\n` characters:
```ini
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvgI...\n-----END PRIVATE KEY-----\n"
```

### 4. Faculty Cannot Upload Marksheets
* Verify `faculty.can_upload_marks = 1`:
```sql
UPDATE faculty SET can_upload_marks = 1 WHERE user_id = (SELECT id FROM users WHERE email = 'faculty@email.com');
```

---

## 16. Repository Structure & Navigation

```plaintext
Project01__AKRSS/
├── akrs_hero_banner.jpg              # Master high-resolution visual branding
├── README.md                         # Authoritative Master Documentation (This file)
└── akrs-vite/                        # Full-stack application root
    ├── akrs_hero_banner.jpg          # Local banner asset
    ├── README.md                     # Synchronized application documentation
    │
    ├── backend/                      # Node.js + Express REST API Server
    │   ├── src/
    │   │   ├── app.js                # Express app initialization & middleware
    │   │   ├── config/
    │   │   │   ├── db.js             # MySQL connection pool
    │   │   │   └── firebase.js       # Firebase Admin initialization
    │   │   ├── controllers/          # Request handlers (auth, student, faculty, admin)
    │   │   ├── middleware/           # Auth JWT verification, RBAC, Multer upload
    │   │   ├── routes/               # API route definitions
    │   │   └── services/
    │   │       ├── ai.service.js     # Groq Llama 3.3 test generation & evaluation
    │   │       ├── marksheet.service.js # Marksheet ingestion & caching logic
    │   │       └── user_import.service.js
    │   ├── schema.sql                # Complete MySQL relational database schema
    │   └── package.json
    │
    └── frontend/                     # React 18 + Vite Frontend Application
        ├── public/                   # Static assets & public images
        ├── src/
        │   ├── main.jsx              # Application entry point
        │   ├── App.jsx               # Route definitions & global design system
        │   ├── firebase.js           # Firebase Client SDK init
        │   ├── context/
        │   │   └── AuthContext.jsx   # Global auth state & JWT bearer interceptor
        │   ├── components/
        │   │   ├── Layout/           # Sidebar & App navigation shell
        │   │   ├── common/           # ProtectedRoute and modal helpers
        │   │   └── student/          # EarlyRequestModal & test widgets
        │   ├── pages/
        │   │   ├── Login.jsx         # Google Sign-in & Mock Mode portal
        │   │   ├── student/          # Dashboard, Radar, TakePracticeTest, LearnTracker
        │   │   ├── faculty/          # Dashboard, MenteeDetail, UnlockRequests, Upload
        │   │   └── admin/            # Dashboard, ManageUsers, ManageCourses, AuditLogs
        │   └── services/             # Axios API service clients
        ├── package.json
        └── vite.config.js
```

---

## 17. Future Roadmap & Extensibility

1. **Adaptive Difficulty Scaling**: Dynamically alter scenario complexity based on historical mastery trends across successive remedial sessions.
2. **Audio/Voice AI Viva Voce**: Voice-interactive examinations powered by real-time speech-to-text and conversational LLMs.
3. **Automated Coding Sandbox**: Embedded execution engine for Computer Science courses to test executable code submissions in addition to theoretical reasoning.
4. **LMS Interoperability**: Canvas / Moodle LTI 1.3 integration to sync marksheets and grades directly.

---

<div align="center">

**Built with precision for modern engineering education.**  
*Contributions, issues, and feature requests are welcome!*

</div>
