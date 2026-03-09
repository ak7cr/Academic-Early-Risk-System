import os
import ssl

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from sqlalchemy.pool import NullPool

load_dotenv()

DATABASE_URL = os.environ.get("DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError(
        "DATABASE_URL environment variable is not set. "
        "On Vercel, add it in Settings → Environment Variables."
    )

# Convert postgresql:// to postgresql+pg8000:// for the pure-Python driver
_url = DATABASE_URL
if _url.startswith("postgresql://"):
    _url = _url.replace("postgresql://", "postgresql+pg8000://", 1)
elif _url.startswith("postgres://"):
    _url = _url.replace("postgres://", "postgresql+pg8000://", 1)

# pg8000 needs an ssl_context for SSL connections (Supabase pooler requires SSL)
_ssl_context = ssl.create_default_context()
_ssl_context.check_hostname = False
_ssl_context.verify_mode = ssl.CERT_NONE

# Use NullPool for serverless (Vercel) — no persistent connection pool
engine = create_engine(
    _url,
    pool_pre_ping=True,
    poolclass=NullPool,
    connect_args={"ssl_context": _ssl_context},
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
