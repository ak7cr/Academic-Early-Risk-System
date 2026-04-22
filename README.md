# AREWS — Academic Risk Early-Warning System

A full-stack academic intelligence platform that monitors student risk in real time, surfaces insights to faculty, and helps students stay on track before it's too late.

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Database](#database)
- [Risk Engine](#risk-engine)
- [API Reference](#api-reference)
- [Frontend Pages](#frontend-pages)
- [Components](#components)
- [Authentication](#authentication)
- [Seed Data & Demo Credentials](#seed-data--demo-credentials)

---

## Overview

AREWS turns raw task and deadline data into explainable risk scores. Students get a self-aware dashboard with trend forecasts and recovery plans. Faculty get a real-time class-wide view with priority alerts, per-student drill-downs, and exportable reports — all running locally on SQLite with no external dependencies.

The platform was originally built on Supabase (PostgreSQL) and migrated to local SQLite for zero-latency offline use. The migration script lives at `backend/migrate_from_supabase.py`.

---

## Features

### Student Portal

| Feature | Description |
|---|---|
| **Dashboard** | Live risk score, completion rate, overdue count, workload pressure. Due-soon banner for tasks within 48 h. Subject risk heatmap. Weekly trend charts (completion, risk, backlog). |
| **Task Manager** | Create, edit, delete tasks. Auto-detects overdue on load. Sorted by urgency (overdue → pending → completed). Filter by subject. |
| **Subject Manager** | Full CRUD for subjects (code, name, semester). Per-subject risk badge. Empty-state CTA. |
| **What-If Simulator** | Simulate completing N overdue tasks or adding N new tasks. Side-by-side current vs projected risk output. |
| **Recovery Plan** | Personalised recovery steps generated from current risk state. Actionable weekly goals. |
| **Reports** | Weekly summary: completion rate, overdue, workload score, recommendations. |
| **Settings** | Edit name, email, password. Read-only profile info (student ID, department, year). |

### Faculty Portal

| Feature | Description |
|---|---|
| **Overview Dashboard** | 4 metric cards (total students, high-risk count, avg completion, low-risk). High-risk alert banner. Full student list with live risk badges. |
| **Students Overview** | Full roster with risk, completion %, overdue tasks, workload. Click-through to individual profiles. |
| **Priority Students** | Filtered view of high-risk students only — quick triage. |
| **Class Analytics** | Risk distribution charts, completion trends, department breakdown. |
| **Reports** | Per-student weekly reports. Export entire class as CSV. Print individual or all-class PDF. |
| **Student Detail** | Task distribution pie, subject risk bar chart, historical trends, private faculty notes. |
| **Settings** | Edit profile. Logout with theme preservation. |

---

## Tech Stack

### Frontend

| Package | Version | Purpose |
|---|---|---|
| React | 19.1.0 | UI framework |
| TypeScript | 5.8.3 | Type safety |
| Vite | 6.3.5 | Build tool + HMR |
| Tailwind CSS | 4.2.1 | Utility-first styling |
| React Router | 7.13.1 | Client-side routing |
| Recharts | 3.8.0 | Charts and visualisations |
| Lucide React | 0.577.0 | Icons |

### Backend

| Package | Version | Purpose |
|---|---|---|
| FastAPI | 0.115.6 | Web framework |
| Uvicorn | 0.34.0 | ASGI server |
| SQLAlchemy | 2.0.36 | ORM |
| Pydantic | 2.10.4 | Request/response validation |
| python-jose | 3.3.0 | JWT signing + verification |
| bcrypt | 4.2.1 | Password hashing |
| python-dotenv | 1.0.1 | Environment config |

### Database

- **SQLite** — `backend/local_arews.db`
- WAL mode enabled (`PRAGMA journal_mode=WAL`)
- `busy_timeout = 3000 ms` — handles concurrent reads during writes
- 5 tables: `users`, `subjects`, `tasks`, `risk_history`, `sync_meta`

---

## Project Structure

```
Academic Early Risk System/
├── backend/
│   ├── app/
│   │   ├── routers/
│   │   │   ├── auth.py          # /api/auth/*
│   │   │   ├── subjects.py      # /api/subjects/*
│   │   │   ├── tasks.py         # /api/tasks/*
│   │   │   ├── risk.py          # /api/risk/*
│   │   │   ├── students.py      # /api/students/* (faculty only)
│   │   │   ├── reports.py       # /api/reports/*
│   │   │   └── admin.py         # /api/admin/* (password protected)
│   │   ├── main.py              # App entrypoint, lifespan, CORS, router registration
│   │   ├── database.py          # SQLite engine, WAL mode, session factory
│   │   ├── models.py            # SQLAlchemy ORM models
│   │   ├── schemas.py           # Pydantic request/response schemas
│   │   ├── auth.py              # JWT helpers, dependency guards
│   │   ├── risk_engine.py       # Rule-based risk classification engine
│   │   └── seed.py              # Initial data seeder
│   ├── requirements.txt
│   ├── local_arews.db           # SQLite database (created on first run)
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── pages/               # One file per route/page
│   │   ├── components/          # Shared UI components
│   │   ├── lib/
│   │   │   ├── api.ts           # All API calls (typed)
│   │   │   └── ThemeContext.tsx # Dark/light mode context
│   │   ├── App.tsx              # Routes + RequireAuth guard
│   │   └── main.tsx
│   ├── package.json
│   ├── vite.config.ts
│   └── .env
└── README.md
```

---

## Getting Started

### Prerequisites

- Python 3.12+
- Node.js 18+

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

The backend starts at `http://localhost:8000`. On first run it will:

1. Create all database tables
2. Run any pending `ALTER TABLE` migrations
3. Seed 6 faculty users, 20 students, 127 subjects, and 397 tasks

API docs available at `http://localhost:8000/docs`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend starts at `http://localhost:5173`.

---

## Environment Variables

### Backend — `backend/.env`

```env
LOCAL_DATABASE_URL=sqlite:///./local_arews.db
SECRET_KEY=your-secret-key-here
ADMIN_PASSWORD=0000
```

`SECRET_KEY` signs JWTs — change it in production. `ADMIN_PASSWORD` protects `/api/admin/*` via the `X-Admin-Password` request header.

### Frontend — `frontend/.env`

```env
VITE_API_URL=http://localhost:8000
```

---

## Database

### Schema

#### `users`

| Column | Type | Notes |
|---|---|---|
| id | INTEGER PK | |
| email | VARCHAR(320) | Unique |
| password_hash | VARCHAR(256) | bcrypt |
| password_plain | VARCHAR(256) | Stored for admin visibility |
| name | VARCHAR(200) | |
| role | VARCHAR | `student` or `faculty` |
| student_id | VARCHAR(50) | Unique, students only |
| department | VARCHAR(200) | |
| year | INTEGER | 1–4, students only |
| faculty_notes | VARCHAR(2000) | Private notes written by faculty per student |
| created_at | DATETIME | |
| updated_at | DATETIME | Auto-updated on change |

#### `subjects`

| Column | Type | Notes |
|---|---|---|
| id | INTEGER PK | |
| code | VARCHAR(20) | e.g. `CS301` |
| name | VARCHAR(200) | |
| student_id | INTEGER FK | → users.id (CASCADE delete) |
| semester | VARCHAR(50) | |

#### `tasks`

| Column | Type | Notes |
|---|---|---|
| id | INTEGER PK | |
| title | VARCHAR(300) | |
| subject_id | INTEGER FK | → subjects.id (CASCADE delete) |
| student_id | INTEGER FK | → users.id (CASCADE delete) |
| task_type | VARCHAR | `assignment`, `exam`, `task`, `quiz`, `project`, `lab`, `other` |
| due_date | DATETIME | |
| estimated_hours | FLOAT | |
| status | VARCHAR | `pending`, `completed`, `overdue` |
| completed_at | DATETIME | Nullable |

#### `risk_history`

| Column | Type | Notes |
|---|---|---|
| id | INTEGER PK | |
| student_id | INTEGER FK | → users.id (CASCADE delete) |
| risk_level | VARCHAR | `low`, `medium`, `high` |
| completion_rate | FLOAT | 0–100 |
| overdue_tasks | INTEGER | |
| workload_score | FLOAT | 0–10 |
| computed_at | DATETIME | |

### SQLite Datetime Quirk

SQLite drops tzinfo on read. The `_as_utc()` helper in `risk_engine.py` re-attaches UTC before any datetime comparison:

```python
def _as_utc(dt: datetime) -> datetime:
    if dt is not None and dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt
```

### Schema Migrations

New columns are added via `ALTER TABLE` in `main.py` `_init_db()` at startup:

```python
user_cols = [c["name"] for c in insp.get_columns("users")]
if "new_column" not in user_cols:
    with engine.begin() as conn:
        conn.execute(text("ALTER TABLE users ADD COLUMN new_column VARCHAR(...)"))
```

---

## Risk Engine

`backend/app/risk_engine.py` — deterministic, rule-based, fully explainable.

### Classification Rules

```
HIGH   if overdue > 3  and completion < 60%
HIGH   if overdue >= 1 and completion < 60%
HIGH   if overdue > 3  and completion < 80%
MEDIUM if 1 <= overdue <= 3 and 60% <= completion <= 80%
MEDIUM if overdue > 0  and completion > 80%
MEDIUM if overdue == 0 and completion <= 80%
LOW    if overdue == 0 and completion > 80%
```

### Metrics

| Metric | Formula |
|---|---|
| Completion rate | `completed / total * 100` |
| Overdue tasks | `status=overdue` OR (`status=pending` AND `due_date < now`) |
| Workload score | `min(10, (overdue×2 + pending) / total × 10)` — 0–10 scale |

### Key Functions

| Function | Description |
|---|---|
| `compute_risk(db, student_id)` | Computes risk, auto-marks pending-past-due tasks as overdue, generates explanation + recommendations, writes to `risk_history` (throttled: once/hour or on level change) |
| `compute_trends(db, student_id, weeks=5)` | Returns last N weekly history entries as `{ completion_trend, risk_trend, backlog_trend }` with labels `"Week 1"…"Current"` |
| `compute_subject_risk(db, student_id)` | Per-subject risk using a single aggregation query — no N+1 |
| `_classify(overdue, completion_rate)` | Pure function: returns `RiskLevel` from the rules above |
| `_build_explanation(...)` | Natural-language explanation of current risk factors |
| `_build_recommendations(...)` | Actionable steps based on risk level, overdue count, pending count |

### What-If Simulator

`POST /api/risk/simulate` takes `{ complete_tasks, add_tasks }` and returns current vs projected risk without writing any data:

```python
projected_completed = min(completed + complete_tasks, overdue)
projected_overdue   = overdue - projected_completed
projected_total     = total + add_tasks
```

---

## API Reference

Base URL: `http://localhost:8000`  
All protected endpoints require `Authorization: Bearer <token>`.

### Auth — `/api/auth`

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/register` | — | Register student or faculty |
| POST | `/login` | — | Login, returns JWT + user object |
| GET | `/me` | ✓ | Get current user profile |
| PATCH | `/me` | ✓ | Update name, email, password, department, year |

**Register body**
```json
{
  "email": "string",
  "password": "string",
  "name": "string",
  "role": "student | faculty",
  "student_id": "string (students only)",
  "department": "string",
  "year": 1
}
```

**Login response**
```json
{
  "access_token": "eyJ...",
  "token_type": "bearer",
  "user": { "id": 1, "email": "...", "name": "...", "role": "student" }
}
```

---

### Subjects — `/api/subjects`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/` | student | List own subjects |
| GET | `/with-risk` | student | Subjects with per-subject risk metrics |
| POST | `/` | student | Create subject (`code`, `name`, `semester?`) |
| DELETE | `/{id}` | student | Delete subject (cascades to tasks) |

---

### Tasks — `/api/tasks`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/?status=` | student | List tasks, optionally filtered by status |
| POST | `/` | student | Create task |
| PATCH | `/{id}` | student | Update title, due_date, estimated_hours, status |
| DELETE | `/{id}` | student | Delete task |

**Create task body**
```json
{
  "title": "string",
  "subject_id": 1,
  "task_type": "assignment | exam | task | quiz | project | lab | other",
  "due_date": "2026-05-01T10:00:00Z",
  "estimated_hours": 3.5
}
```

---

### Risk — `/api/risk`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/current` | student | Compute and return current risk assessment |
| GET | `/history` | student | Last 20 risk history entries |
| GET | `/trends?weeks=5` | student | Weekly trend data |
| POST | `/simulate` | student | What-if simulation (no data written) |

**Risk response**
```json
{
  "risk_level": "high | medium | low",
  "completion_rate": 62.5,
  "overdue_tasks": 3,
  "total_tasks": 20,
  "completed_tasks": 12,
  "workload_score": 6.2,
  "explanation": ["Completion rate is 62.5%...", "3 tasks are overdue..."],
  "recommendations": ["Prioritize completing overdue tasks immediately.", "..."]
}
```

---

### Students — `/api/students` *(faculty only)*

| Method | Path | Description |
|---|---|---|
| GET | `/` | All students with live risk metrics (single aggregation query, no N+1) |
| GET | `/{id}` | Individual student summary |
| GET | `/{id}/risk` | Student's full risk assessment |
| GET | `/{id}/trends` | Student's trend data `{ labels, completion, overdue, workload }` |
| GET | `/{id}/subjects` | Student's subjects with per-subject risk |
| PATCH | `/{id}/notes` | Save private faculty notes for this student |

---

### Reports — `/api/reports`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/weekly` | student | Current student's weekly report |
| GET | `/student/{id}/weekly` | faculty | Specific student's weekly report |

**Weekly report response**
```json
{
  "student_name": "string",
  "student_id": "string",
  "report_period": "Apr 15 – Apr 22, 2026",
  "total_tasks": 20,
  "completed_tasks": 12,
  "missed_deadlines": 3,
  "completion_rate": 62.5,
  "risk_level": "medium",
  "workload_score": 6.2,
  "recommendations": ["..."]
}
```

---

### Admin — `/api/admin` *(X-Admin-Password header required)*

Full CRUD for all resources. Pass `X-Admin-Password: <ADMIN_PASSWORD>` with every request.

| Resource | Endpoints |
|---|---|
| Users | `GET /users`, `POST /users`, `GET /users/{id}`, `PATCH /users/{id}`, `DELETE /users/{id}` |
| Subjects | `GET /subjects`, `POST /subjects`, `PATCH /subjects/{id}`, `DELETE /subjects/{id}` |
| Tasks | `GET /tasks`, `POST /tasks`, `PATCH /tasks/{id}`, `DELETE /tasks/{id}` |
| Risk History | `GET /risk_history`, `POST /risk_history`, `DELETE /risk_history/{id}` |
| Stats | `GET /stats` — row counts for all tables |

---

## Frontend Pages

### Student Pages

| File | Route | Description |
|---|---|---|
| `RoleSelection.tsx` | `/` | Landing page — choose Student or Faculty |
| `AuthPage.tsx` | `/auth/:role` | Login / signup form for the selected role |
| `StudentDashboard.tsx` | `/student/dashboard` | Risk overview, trend charts, due-soon banner, subject heatmap |
| `StudentTasks.tsx` | `/student/tasks` | Task list with create/edit/delete, sorted by urgency |
| `StudentSubjects.tsx` | `/student/subjects` | Subject management with risk badges |
| `StudentSimulator.tsx` | `/student/simulator` | What-if risk simulator |
| `StudentRecovery.tsx` | `/student/recovery` | Personalised recovery plan |
| `StudentReports.tsx` | `/student/reports` | Weekly academic report |
| `StudentSettings.tsx` | `/student/settings` | Profile edit + logout |

### Faculty Pages

| File | Route | Description |
|---|---|---|
| `FacultyDashboard.tsx` | `/faculty/dashboard` | Class overview with metric cards and alert banner |
| `StudentsOverview.tsx` | `/faculty/students` | Full student list with risk metrics |
| `StudentDetail.tsx` | `/faculty/students/:id` | Individual student drill-down + faculty notes |
| `FacultyPriority.tsx` | `/faculty/priority` | High-risk students only |
| `FacultyAnalytics.tsx` | `/faculty/analytics` | Class-wide analytics charts |
| `FacultyReports.tsx` | `/faculty/reports` | Bulk reports, CSV export, print |
| `FacultySettings.tsx` | `/faculty/settings` | Profile edit + logout |

### Route Protection

All protected routes are wrapped in a `RequireAuth` component in `App.tsx`:

```tsx
function RequireAuth({ children, role }) {
  const token = localStorage.getItem("token");
  if (!token) return <Navigate to="/" replace />;
  if (role) {
    const user = JSON.parse(localStorage.getItem("user") || "null");
    if (user?.role !== role)
      return <Navigate to={user?.role === "faculty" ? "/faculty/dashboard" : "/student/dashboard"} replace />;
  }
  return <>{children}</>;
}
```

A student visiting a faculty URL (or vice versa) is redirected to their own dashboard.

---

## Components

| File | Description |
|---|---|
| `Sidebar.tsx` | Navigation sidebar. Accepts `role` and `items[]`. Logout button clears localStorage while preserving the `theme` key. |
| `TopNavbar.tsx` | Top bar with page title, subtitle, user name, dark mode toggle, and overdue notification badge. |
| `MetricCard.tsx` | Reusable metric tile: icon, title, value, description, status (`danger` / `warning` / `success` / `neutral`). Color-coded border and icon. |
| `RiskBadge.tsx` | Pill badge for `high` / `medium` / `low` risk levels. `size` prop: `sm`, `md`, `lg`. |
| `AlertBanner.tsx` | Warning banner with icon and message. Used on FacultyDashboard when high-risk students exist. |

---

## Authentication

- **Algorithm**: HS256 JWT
- **Expiry**: 24 hours
- **Storage**: `localStorage` (`token` + `user` keys)
- **Password hashing**: bcrypt

On every API request the frontend sends `Authorization: Bearer <token>`. A 401 response triggers automatic logout:

```ts
if (res.status === 401) {
  localStorage.clear();
  window.location.href = "/";
}
```

**Backend guards:**

| Guard | Description |
|---|---|
| `get_current_user` | Decodes JWT, validates user exists in DB |
| `require_faculty` | Extends `get_current_user`, raises 403 if role ≠ faculty |
| `require_student` | Extends `get_current_user`, raises 403 if role ≠ student |

---

## Seed Data & Demo Credentials

On first startup, `seed.py` populates the database with:

- **6 faculty** — one per department
- **20 students** — distributed across risk profiles (6 high, 8 medium, 6 low)
- **127 subjects** — 3–5 per student
- **397 tasks** — with realistic status distributions matching each student's risk profile
- **Risk history** — 4–6 weeks of entries per student

### Login Credentials

| Role | Email | Password |
|---|---|---|
| Faculty | `maya.carter@university.edu` | `faculty123` |
| Faculty | `ethan.brooks@university.edu` | `faculty123` |
| Faculty | `lina.flores@university.edu` | `faculty123` |
| Faculty | `omar.singh@university.edu` | `faculty123` |
| Faculty | `zoe.kim@university.edu` | `faculty123` |
| Faculty | `noah.patel@university.edu` | `faculty123` |
| Student | Any seeded student email | `student123` |

Student IDs range from `2026001` to `2026020`. See `backend/app/seed.py` for the full list of student email addresses.

---

## Dark Mode

Theme is managed by `ThemeContext.tsx` and persists in `localStorage` under the key `"theme"`. The theme key is explicitly preserved on logout so the user's preference survives between sessions. The toggle is available in `TopNavbar` on every page.

---

## Known Limitations

- **Single-process SQLite** — suitable for local/demo use. For production multi-user deployment, migrate back to PostgreSQL (the original Supabase schema is compatible; see `migrate_from_supabase.py`).
- **No email notifications** — risk alerts are in-app only.
- **No attendance tracking** — risk is task-based only; attendance is not a factor.
- **Static risk thresholds** — hardcoded in `risk_engine.py`; no per-faculty customisation.
- **No mobile layout** — designed for desktop browsers.
