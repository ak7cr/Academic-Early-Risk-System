from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import engine, Base, SessionLocal
from .seed import seed_database
from .routers import auth, subjects, tasks, risk, students, reports, admin


def _init_db():
    Base.metadata.create_all(bind=engine)

    from sqlalchemy import text, inspect as sa_inspect
    insp = sa_inspect(engine)
    user_cols = [c["name"] for c in insp.get_columns("users")]
    if "password_plain" not in user_cols:
        with engine.begin() as conn:
            conn.execute(text("ALTER TABLE users ADD COLUMN password_plain VARCHAR(256)"))
    if "faculty_notes" not in user_cols:
        with engine.begin() as conn:
            conn.execute(text("ALTER TABLE users ADD COLUMN faculty_notes VARCHAR(2000)"))

    with engine.begin() as conn:
        conn.execute(text(
            "UPDATE users SET password_plain = 'faculty123' "
            "WHERE role = 'faculty' AND password_plain IS NULL"
        ))
        conn.execute(text(
            "UPDATE users SET password_plain = 'student123' "
            "WHERE role = 'student' AND password_plain IS NULL"
        ))

    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()


@asynccontextmanager
async def lifespan(app: FastAPI):
    _init_db()
    yield


app = FastAPI(
    title="AREWS - Academic Risk Early-Warning System",
    description="Behavior-driven academic intelligence platform",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(subjects.router)
app.include_router(tasks.router)
app.include_router(risk.router)
app.include_router(students.router)
app.include_router(reports.router)
app.include_router(admin.router)


@app.get("/api/health")
def health():
    return {
        "status": "active",
        "system": "Academic Risk Early-Warning System",
        "risk_engine": "active",
        "version": "1.0.0",
    }
