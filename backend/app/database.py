import os

from dotenv import load_dotenv
from sqlalchemy import create_engine, event as sa_event
from sqlalchemy.orm import sessionmaker, DeclarativeBase

load_dotenv()

LOCAL_DATABASE_URL = os.environ.get("LOCAL_DATABASE_URL", "sqlite:///./local_arews.db")

engine = create_engine(
    LOCAL_DATABASE_URL,
    pool_pre_ping=True,
    connect_args={"check_same_thread": False},
)


@sa_event.listens_for(engine, "connect")
def _sqlite_pragmas(dbapi_conn, _):
    cur = dbapi_conn.cursor()
    cur.execute("PRAGMA journal_mode=WAL")
    cur.execute("PRAGMA busy_timeout=3000")
    cur.close()


SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
