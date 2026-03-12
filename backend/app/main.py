import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import engine, Base, SessionLocal
from .seed import seed_database
from .routers import auth, subjects, tasks, risk, students, reports, admin

# Create tables and seed — runs at import time (works for both serverless and uvicorn)
try:
    Base.metadata.create_all(bind=engine)
    # Ensure password_plain column exists (migration for existing DBs)
    from sqlalchemy import text, inspect as sa_inspect
    _insp = sa_inspect(engine)
    _cols = [c["name"] for c in _insp.get_columns("users")]
    if "password_plain" not in _cols:
        with engine.begin() as _conn:
            _conn.execute(text("ALTER TABLE users ADD COLUMN password_plain VARCHAR(256)"))
    _db = SessionLocal()
    try:
        seed_database(_db)
    finally:
        _db.close()
except Exception as exc:
    import logging
    logging.getLogger(__name__).warning("DB init/seed failed (will retry on first request): %s", exc)


@asynccontextmanager
async def lifespan(app: FastAPI):
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


@app.get("/api/debug")
def debug():
    """Temporary endpoint to diagnose Vercel deployment issues."""
    import importlib
    info: dict = {"db_url_set": bool(os.environ.get("DATABASE_URL"))}
    try:
        import pg8000
        info["pg8000"] = pg8000.__version__
    except ImportError as e:
        info["pg8000_error"] = str(e)
    try:
        from .database import engine
        with engine.connect() as conn:
            conn.execute(__import__("sqlalchemy").text("SELECT 1"))
        info["db_connection"] = "ok"
    except Exception as e:
        info["db_connection_error"] = str(e)
    return info
