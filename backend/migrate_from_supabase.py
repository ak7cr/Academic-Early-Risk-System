"""
One-time migration: download all Supabase data into the local SQLite database.

Usage:
    cd backend
    python migrate_from_supabase.py
"""

import os
import ssl
import sys
from datetime import datetime, timezone

from dotenv import load_dotenv
from sqlalchemy import create_engine, text, event as sa_event
from sqlalchemy.orm import sessionmaker

load_dotenv()

TABLES = [
    # pull order respects FK dependencies
    {
        "name": "users",
        "columns": [
            "id", "email", "password_hash", "password_plain",
            "name", "role", "student_id", "department", "year", "created_at",
        ],
    },
    {
        "name": "subjects",
        "columns": ["id", "code", "name", "student_id", "semester", "created_at"],
    },
    {
        "name": "tasks",
        "columns": [
            "id", "title", "subject_id", "student_id", "task_type",
            "due_date", "estimated_hours", "status", "completed_at", "created_at",
        ],
    },
    {
        "name": "risk_history",
        "columns": [
            "id", "student_id", "risk_level", "completion_rate",
            "overdue_tasks", "workload_score", "computed_at",
        ],
    },
]


def _remote_engine():
    url = os.environ.get("DATABASE_URL", "")
    if not url:
        print("ERROR: DATABASE_URL not set in .env")
        sys.exit(1)
    if url.startswith("postgresql://"):
        url = url.replace("postgresql://", "postgresql+pg8000://", 1)
    elif url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql+pg8000://", 1)
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE
    from sqlalchemy.pool import NullPool
    return create_engine(url, poolclass=NullPool, connect_args={"ssl_context": ctx, "timeout": 15})


def _local_engine():
    url = os.environ.get("LOCAL_DATABASE_URL", "sqlite:///./local_arews.db")
    eng = create_engine(url, connect_args={"check_same_thread": False})

    @sa_event.listens_for(eng, "connect")
    def _pragmas(conn, _):
        cur = conn.cursor()
        cur.execute("PRAGMA journal_mode=WAL")
        cur.close()

    return eng


def migrate():
    print("Connecting to Supabase…")
    remote = _remote_engine()
    local = _local_engine()

    # Ensure local schema exists
    sys.path.insert(0, os.path.dirname(__file__))
    from app.database import Base  # noqa: F401 — imports models via app
    import app.models  # noqa: F401 — registers all models on Base
    Base.metadata.create_all(bind=local)
    print("Local schema ready.")

    now = datetime.now(timezone.utc)
    Session = sessionmaker(bind=local)
    db = Session()

    total = 0
    with remote.connect() as remote_conn:
        for table_info in TABLES:
            table = table_info["name"]
            cols = table_info["columns"]

            rows = remote_conn.execute(
                text(f'SELECT {", ".join(cols)} FROM "{table}"')
            ).mappings().all()

            if not rows:
                print(f"  {table}: 0 rows (skipped)")
                continue

            # Build SQLite upsert (includes extra local-only columns)
            all_cols = cols + ["updated_at", "pending_sync"]
            cols_sql = ", ".join(f'"{c}"' for c in all_cols)
            placeholders = ", ".join(f":{c}" for c in all_cols)
            updates = ", ".join(
                f'"{c}" = EXCLUDED."{c}"' for c in all_cols if c != "id"
            )
            sql = text(
                f'INSERT INTO "{table}" ({cols_sql}) VALUES ({placeholders}) '
                f"ON CONFLICT (id) DO UPDATE SET {updates}"
            )

            for row in rows:
                params = dict(row)
                params["updated_at"] = now
                params["pending_sync"] = False
                db.execute(sql, params)
                total += 1

            db.commit()
            print(f"  {table}: {len(rows)} rows imported")

    db.close()
    print(f"\nDone — {total} rows migrated to local_arews.db")
    print("You can now run the server without DATABASE_URL.")


if __name__ == "__main__":
    migrate()
