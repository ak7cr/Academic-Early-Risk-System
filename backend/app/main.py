from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import engine, Base, SessionLocal
from .seed import seed_database
from .routers import auth, subjects, tasks, risk, students, reports


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create tables and seed on startup
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()
    yield


app = FastAPI(
    title="AREWS - Academic Risk Early-Warning System",
    description="Behavior-driven academic intelligence platform",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174", "http://localhost:5175", "http://localhost:5176"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(subjects.router)
app.include_router(tasks.router)
app.include_router(risk.router)
app.include_router(students.router)
app.include_router(reports.router)


@app.get("/api/health")
def health():
    return {
        "status": "active",
        "system": "Academic Risk Early-Warning System",
        "risk_engine": "active",
        "version": "1.0.0",
    }
