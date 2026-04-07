# AKRS — Academic Knowledge Reinforcement System

Tech Stack: **Vite + React** (frontend) · **Node.js + Express** (backend) · **MySQL** (database)

---

## Quick Start

### 1. MySQL Setup
```bash
# Create the database
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS akrs_db CHARACTER SET utf8mb4;"

# Run the schema
mysql -u root -p akrs_db < backend/schema.sql
```

### 2. Backend Setup
```bash
cd backend

# Copy and fill in your credentials
cp .env.example .env
# Edit .env: set DB_PASSWORD, ADMIN_EMAIL, Firebase credentials

npm install
npm run dev
# Runs on http://localhost:5000
```

### 3. Frontend Setup
```bash
cd frontend

# Copy and fill in your Firebase Web SDK credentials
cp .env.example .env
# Edit .env: set VITE_FIREBASE_* values

npm install
npm run dev
# Runs on http://localhost:3000
```

---

## Environment Variables

### Backend (`backend/.env`)
| Variable | Description |
|---|---|
| `DB_HOST` | MySQL host (default: `localhost`) |
| `DB_PORT` | MySQL port (default: `3306`) |
| `DB_USER` | MySQL username |
| `DB_PASSWORD` | MySQL password |
| `DB_NAME` | Database name (default: `akrs_db`) |
| `DB_SSL` | Set `true` only if your MySQL requires SSL |
| `ADMIN_EMAIL` | Google email of the first admin (auto-seeded) |
| `FIREBASE_PROJECT_ID` | From Firebase Console → Service Accounts |
| `FIREBASE_CLIENT_EMAIL` | From Firebase service account JSON |
| `FIREBASE_PRIVATE_KEY` | From Firebase service account JSON |
| `FRONTEND_URL` | For CORS (default: `http://localhost:3000`) |

### Frontend (`frontend/.env`)
| Variable | Description |
|---|---|
| `VITE_API_URL` | Backend API URL (default: `http://localhost:5000/api`) |
| `VITE_FIREBASE_API_KEY` | From Firebase Console → Web App config |
| `VITE_FIREBASE_AUTH_DOMAIN` | From Firebase Console → Web App config |
| `VITE_FIREBASE_PROJECT_ID` | From Firebase Console → Web App config |
| `VITE_FIREBASE_APP_ID` | From Firebase Console → Web App config |

---

## Firebase Setup (Required for Google Sign-In)

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a project → Enable **Authentication** → Enable **Google** sign-in provider
3. **Web App config** → Project Settings → Your Apps → Add Web App → copy config into `frontend/.env`
4. **Service Account** → Project Settings → Service Accounts → Generate new private key → copy values into `backend/.env`

---

## Mock Mode (No Firebase)
If Firebase is not configured, the app runs in **Mock Mode** — the Login page will show mock login buttons for each role (admin/faculty/student). The backend API still requires a real DB connection.

---

## User Roles
| Role | Capabilities |
|---|---|
| **Admin** | Create users, manage courses, upload marksheets, manage materials |
| **Faculty** | View assigned students, manage mentees, optionally upload marks |
| **Student** | View own performance, access course materials |
