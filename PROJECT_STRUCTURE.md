# Academic Knowledge Reinforcement System (AKRS)
## Complete Project Structure

```
akrs/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── db.js                  # MySQL connection pool (Aiven)
│   │   │   └── firebase.js            # Firebase Admin SDK init
│   │   ├── middleware/
│   │   │   ├── auth.js                # Token verification + role check
│   │   │   └── upload.js              # Multer config
│   │   ├── routes/
│   │   │   ├── auth.routes.js
│   │   │   ├── admin.routes.js
│   │   │   ├── faculty.routes.js
│   │   │   └── student.routes.js
│   │   ├── controllers/
│   │   │   ├── auth.controller.js
│   │   │   ├── admin.controller.js
│   │   │   ├── faculty.controller.js
│   │   │   └── student.controller.js
│   │   ├── services/
│   │   │   ├── marksheet.service.js   # Excel parsing + insert
│   │   │   └── analysis.service.js    # Performance analysis logic
│   │   └── app.js
│   ├── schema.sql                     # Full MySQL schema
│   ├── .env.example
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── Layout/
    │   │   │   ├── Sidebar.jsx
    │   │   │   └── Navbar.jsx
    │   │   ├── Charts/
    │   │   │   ├── PerformanceChart.jsx
    │   │   │   └── SubjectRadar.jsx
    │   │   └── common/
    │   │       ├── ProtectedRoute.jsx
    │   │       └── RoleGuard.jsx
    │   ├── pages/
    │   │   ├── Login.jsx
    │   │   ├── admin/
    │   │   │   ├── AdminDashboard.jsx
    │   │   │   ├── ManageUsers.jsx
    │   │   │   ├── ManageCourses.jsx
    │   │   │   ├── MarksheetUpload.jsx
    │   │   │   └── CourseMaterials.jsx
    │   │   ├── faculty/
    │   │   │   ├── FacultyDashboard.jsx
    │   │   │   └── MenteeList.jsx
    │   │   └── student/
    │   │       ├── StudentDashboard.jsx
    │   │       └── MyMaterials.jsx
    │   ├── context/
    │   │   └── AuthContext.jsx
    │   ├── services/
    │   │   └── api.js
    │   ├── firebase.js
    │   └── App.jsx
    └── package.json
```
