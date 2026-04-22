# AREWS — Academic Risk Early-Warning System

A full-stack academic intelligence platform that monitors student risk in real time, surfaces insights to faculty, and helps students stay on track before it's too late.

---

## Tech Stack

| Layer | Technologies |
|---|---|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS, Recharts, React Router v7 |
| Backend | FastAPI, SQLAlchemy 2.0, Pydantic v2, Python 3.12 |
| Database | SQLite (WAL mode) — migrated from Supabase/PostgreSQL |
| Auth | JWT HS256 (24 h expiry), bcrypt password hashing |

---

## Getting Started

**Backend**
```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --reload
# → http://localhost:8000
# → http://localhost:8000/docs  (Swagger UI)
```

**Frontend**
```bash
cd frontend
npm install
npm run dev
# → http://localhost:5173
```

On first backend run: tables are created, migrations applied, and seed data loaded automatically.

---

## Environment Variables

**`backend/.env`**
```env
LOCAL_DATABASE_URL=sqlite:///./local_arews.db
SECRET_KEY=your-secret-key-here
ADMIN_PASSWORD=0000
```

**`frontend/.env`**
```env
VITE_API_URL=http://localhost:8000
```

---

## Features

### Student Portal

| Page | Description |
|---|---|
| Dashboard | Live risk score, completion rate, overdue count, workload pressure. Due-soon banner (48 h). Subject risk heatmap. Trend charts. |
| Tasks | Create, edit, delete tasks. Auto-detects overdue. Sorted by urgency. |
| Subjects | Full CRUD. Per-subject risk badge. |
| Simulator | What-if: simulate completing or adding tasks, see projected risk. |
| Recovery Plan | Personalised recovery steps from current risk state. |
| Reports | Weekly summary: completion, overdue, workload, recommendations. |
| Settings | Edit profile. |

### Faculty Portal

| Page | Description |
|---|---|
| Dashboard | Metric cards, high-risk alert banner, full student list with risk badges. |
| Students | Full roster with risk, completion %, overdue, workload. |
| Priority Students | Filtered to high-risk only — quick triage. |
| Analytics | Class-wide risk distribution and trend charts. |
| Reports | Per-student weekly reports. CSV export. Print PDF. |
| Student Detail | Task distribution, subject risk breakdown, historical trends, private faculty notes. |

---

## Risk Engine

Rule-based, deterministic, explainable. Lives in `backend/app/risk_engine.py`.

```
HIGH   — overdue > 3  OR  completion < 60%
MEDIUM — overdue 1–3  AND  completion 60–80%
LOW    — overdue = 0  AND  completion > 80%
```

- **Workload score**: `min(10, (overdue×2 + pending) / total × 10)`
- Risk history is written at most once per hour, or immediately on level change.
- `compute_trends()` buckets history into 5 weekly points for the trend charts.
- `compute_subject_risk()` uses a single aggregation query — no N+1.

---

## API Reference

Base URL: `http://localhost:8000`. All protected routes require `Authorization: Bearer <token>`.

| Router | Prefix | Key Endpoints |
|---|---|---|
| Auth | `/api/auth` | `POST /login`, `POST /register`, `GET /me`, `PATCH /me` |
| Subjects | `/api/subjects` | CRUD + `/with-risk` |
| Tasks | `/api/tasks` | CRUD + `?status=` filter |
| Risk | `/api/risk` | `GET /current`, `GET /trends`, `GET /history`, `POST /simulate` |
| Students | `/api/students` | Faculty only. List, detail, risk, trends, subjects, `PATCH /{id}/notes` |
| Reports | `/api/reports` | `GET /weekly`, `GET /student/{id}/weekly` |
| Admin | `/api/admin` | Full CRUD on all tables. Requires `X-Admin-Password` header. |

---

## Project Structure

```
├── backend/
│   ├── app/
│   │   ├── routers/         # auth, subjects, tasks, risk, students, reports, admin
│   │   ├── main.py          # entrypoint, lifespan, CORS
│   │   ├── models.py        # User, Subject, Task, RiskHistory
│   │   ├── schemas.py       # Pydantic schemas
│   │   ├── auth.py          # JWT + role guards
│   │   ├── risk_engine.py   # classification, trends, subject risk
│   │   └── seed.py          # initial data
│   └── requirements.txt
└── frontend/
    └── src/
        ├── pages/           # one file per route
        ├── components/      # Sidebar, TopNavbar, MetricCard, RiskBadge, AlertBanner
        ├── lib/
        │   ├── api.ts       # all typed API calls
        │   └── ThemeContext.tsx
        └── App.tsx          # routes + RequireAuth guard
```

---

## Demo Credentials

| Role | Email | Password |
|---|---|---|
| Faculty (×6) | `maya.carter@university.edu`, `ethan.brooks@university.edu`, `lina.flores@university.edu`, `omar.singh@university.edu`, `zoe.kim@university.edu`, `noah.patel@university.edu` | `faculty123` |
| Student (×20) | See `backend/app/seed.py` for full list | `student123` |

Seeded with 127 subjects and 397 tasks across 20 students (IDs `2026001`–`2026020`).

---

## Known Limitations

- SQLite is single-process — for multi-user production, migrate back to PostgreSQL (`migrate_from_supabase.py` handles this).
- No email notifications — alerts are in-app only.
- No attendance tracking — risk is task-based only.
- No mobile layout — desktop browsers only.
