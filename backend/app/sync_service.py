"""
Bidirectional sync between local SQLite and remote Supabase.

Push: local pending_sync=True records → Supabase (INSERT … ON CONFLICT DO UPDATE)
Pull: all Supabase records → local SQLite (INSERT … ON CONFLICT DO UPDATE)

Both directions use raw SQL so we avoid SQLAlchemy enum-type mismatches between
the two dialects.  The remote schema is untouched — no new columns are added there.
"""

import logging
from datetime import datetime, timezone

from sqlalchemy import text
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)

# Columns that exist on BOTH local SQLite and remote Supabase.
# (updated_at / pending_sync are local-only and excluded from remote ops.)
REMOTE_COLS: dict[str, list[str]] = {
    "users": [
        "id", "email", "password_hash", "password_plain", "name",
        "role", "student_id", "department", "year", "created_at",
    ],
    "subjects": ["id", "code", "name", "student_id", "semester", "created_at"],
    "tasks": [
        "id", "title", "subject_id", "student_id", "task_type",
        "due_date", "estimated_hours", "status", "completed_at", "created_at",
    ],
    "risk_history": [
        "id", "student_id", "risk_level", "completion_rate",
        "overdue_tasks", "workload_score", "computed_at",
    ],
}

# Pull order respects FK dependencies (parents before children).
PULL_ORDER = ["users", "subjects", "tasks", "risk_history"]


def _val(v):
    """Coerce enum instances to their string value."""
    return v.value if hasattr(v, "value") else v


# ---------------------------------------------------------------------------
# Push  (local → Supabase)
# ---------------------------------------------------------------------------

def _build_pg_upsert(table: str, columns: list[str]) -> str:
    cols = ", ".join(f'"{c}"' for c in columns)
    placeholders = ", ".join(f":{c}" for c in columns)
    updates = ", ".join(f'"{c}" = EXCLUDED."{c}"' for c in columns if c != "id")
    return (
        f'INSERT INTO "{table}" ({cols}) VALUES ({placeholders}) '
        f"ON CONFLICT (id) DO UPDATE SET {updates}"
    )


def push_pending(local_db: Session, remote_engine) -> int:
    """Push all pending_sync=True local records to Supabase. Returns count pushed."""
    from .models import User, Subject, Task, RiskHistory

    model_map = [
        (User, "users"),
        (Subject, "subjects"),
        (Task, "tasks"),
        (RiskHistory, "risk_history"),
    ]

    total = 0
    try:
        with remote_engine.begin() as conn:
            for model, table in model_map:
                cols = REMOTE_COLS[table]
                sql = text(_build_pg_upsert(table, cols))
                records = local_db.query(model).filter(model.pending_sync == True).all()
                for rec in records:
                    params = {c: _val(getattr(rec, c, None)) for c in cols}
                    conn.execute(sql, params)
                    total += 1

        # Mark synced after successful remote commit
        for model, _ in model_map:
            local_db.query(model).filter(model.pending_sync == True).update(
                {"pending_sync": False}, synchronize_session=False
            )
        local_db.commit()
        if total:
            logger.info("Sync push: %d records sent to Supabase", total)
    except Exception as exc:
        logger.warning("Sync push failed: %s", exc)
        local_db.rollback()
    return total


def push_one(record, table: str, remote_engine) -> bool:
    """Push a single record to Supabase immediately after a local write."""
    if remote_engine is None:
        return False
    cols = REMOTE_COLS.get(table)
    if not cols:
        return False
    sql = text(_build_pg_upsert(table, cols))
    params = {c: _val(getattr(record, c, None)) for c in cols}
    try:
        with remote_engine.begin() as conn:
            conn.execute(sql, params)
        return True
    except Exception as exc:
        logger.warning("Immediate push failed (%s id=%s): %s", table, getattr(record, "id", "?"), exc)
        return False


# ---------------------------------------------------------------------------
# Pull  (Supabase → local)
# ---------------------------------------------------------------------------

def _build_sqlite_upsert(table: str, columns: list[str]) -> str:
    """SQLite ON CONFLICT … DO UPDATE (requires SQLite ≥ 3.24, i.e. 2018+)."""
    all_cols = columns + ["updated_at", "pending_sync"]
    cols = ", ".join(f'"{c}"' for c in all_cols)
    placeholders = ", ".join(f":{c}" for c in all_cols)
    updates = ", ".join(
        f'"{c}" = EXCLUDED."{c}"'
        for c in all_cols
        if c != "id"
    )
    return (
        f'INSERT INTO "{table}" ({cols}) VALUES ({placeholders}) '
        f"ON CONFLICT (id) DO UPDATE SET {updates}"
    )


_PULL_BATCH = 50  # commit every N rows so the SQLite write-lock is released often


def pull_all(local_db: Session, remote_engine) -> int:
    """Pull every row from Supabase and upsert into local SQLite. Returns row count."""
    total = 0
    now = datetime.now(timezone.utc)
    try:
        with remote_engine.connect() as remote_conn:
            for table in PULL_ORDER:
                cols = REMOTE_COLS[table]
                rows = remote_conn.execute(
                    text(f'SELECT {", ".join(cols)} FROM "{table}"')
                ).mappings().all()

                sql = text(_build_sqlite_upsert(table, cols))
                for i, row in enumerate(rows):
                    params = dict(row)
                    params["updated_at"] = now
                    params["pending_sync"] = False
                    local_db.execute(sql, params)
                    total += 1
                    if (i + 1) % _PULL_BATCH == 0:
                        local_db.commit()  # release lock periodically

        local_db.commit()

        # Record pull timestamp
        from .models import SyncMeta
        meta = local_db.get(SyncMeta, 1)
        if meta is None:
            meta = SyncMeta(id=1)
            local_db.add(meta)
        meta.last_pull_at = now
        local_db.commit()

        logger.info("Sync pull: %d rows fetched from Supabase", total)
    except Exception as exc:
        logger.warning("Sync pull failed: %s", exc)
        local_db.rollback()
    return total


def delete_one(table: str, record_id: int, remote_engine) -> bool:
    """Delete a record from Supabase by ID."""
    if remote_engine is None:
        return False
    try:
        with remote_engine.begin() as conn:
            conn.execute(text(f'DELETE FROM "{table}" WHERE id = :id'), {"id": record_id})
        return True
    except Exception as exc:
        logger.warning("Remote delete failed (%s id=%d): %s", table, record_id, exc)
        return False


# ---------------------------------------------------------------------------
# Combined
# ---------------------------------------------------------------------------

def sync_once(local_db: Session, remote_engine):
    """Push pending local changes, then pull latest from Supabase."""
    if remote_engine is None:
        logger.debug("No remote engine configured — skipping sync")
        return
    push_pending(local_db, remote_engine)
    pull_all(local_db, remote_engine)
