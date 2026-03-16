#!/usr/bin/env python3
"""Bidirectional database sync between local SQLite and remote admin API.

Usage:
  python scripts/db_sync.py pull
  python scripts/db_sync.py push --wipe-remote

Environment variables:
  REMOTE_BASE            default: https://academic-early-risk-system.vercel.app
  REMOTE_ADMIN_PASSWORD  default: 0000
  LOCAL_DB_PATH          default: ./local_mirror.db (relative to backend/)
"""

from __future__ import annotations

import argparse
import json
import sqlite3
import urllib.error
import urllib.request
from pathlib import Path
from typing import Any


def _request(base: str, admin_password: str, method: str, path: str, data: dict[str, Any] | None = None) -> Any:
    body = None if data is None else json.dumps(data).encode("utf-8")
    req = urllib.request.Request(
        base.rstrip("/") + path,
        data=body,
        method=method,
        headers={
            "Content-Type": "application/json",
            "X-Admin-Password": admin_password,
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=120) as resp:
            text = resp.read().decode("utf-8")
            return json.loads(text) if text else None
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", "ignore")
        raise RuntimeError(f"{method} {path} failed: HTTP {exc.code} {detail}") from exc


def _connect_local(local_db_path: Path) -> sqlite3.Connection:
    local_db_path.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(local_db_path)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def _ensure_schema(conn: sqlite3.Connection) -> None:
    conn.executescript(
        """
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY,
            email TEXT NOT NULL UNIQUE,
            password_plain TEXT,
            name TEXT NOT NULL,
            role TEXT NOT NULL,
            student_id TEXT,
            department TEXT,
            year INTEGER,
            created_at TEXT
        );

        CREATE TABLE IF NOT EXISTS subjects (
            id INTEGER PRIMARY KEY,
            code TEXT NOT NULL,
            name TEXT NOT NULL,
            student_id INTEGER NOT NULL,
            semester TEXT,
            created_at TEXT
        );

        CREATE TABLE IF NOT EXISTS tasks (
            id INTEGER PRIMARY KEY,
            title TEXT NOT NULL,
            subject_id INTEGER NOT NULL,
            student_id INTEGER NOT NULL,
            task_type TEXT NOT NULL,
            due_date TEXT NOT NULL,
            estimated_hours REAL NOT NULL,
            status TEXT NOT NULL,
            completed_at TEXT,
            created_at TEXT
        );

        CREATE TABLE IF NOT EXISTS risk_history (
            id INTEGER PRIMARY KEY,
            student_id INTEGER NOT NULL,
            risk_level TEXT NOT NULL,
            completion_rate REAL NOT NULL,
            overdue_tasks INTEGER NOT NULL,
            workload_score REAL NOT NULL,
            computed_at TEXT
        );
        """
    )
    conn.commit()


def _pull_remote_to_local(base: str, admin_password: str, conn: sqlite3.Connection) -> None:
    print("Pulling remote data...")
    users = _request(base, admin_password, "GET", "/api/admin/users")
    subjects = _request(base, admin_password, "GET", "/api/admin/subjects")
    tasks = _request(base, admin_password, "GET", "/api/admin/tasks")
    risk_rows = _request(base, admin_password, "GET", "/api/admin/risk_history")

    conn.execute("DELETE FROM risk_history")
    conn.execute("DELETE FROM tasks")
    conn.execute("DELETE FROM subjects")
    conn.execute("DELETE FROM users")

    conn.executemany(
        """
        INSERT INTO users (id, email, password_plain, name, role, student_id, department, year, created_at)
        VALUES (:id, :email, :password_plain, :name, :role, :student_id, :department, :year, :created_at)
        """,
        users,
    )
    conn.executemany(
        """
        INSERT INTO subjects (id, code, name, student_id, semester, created_at)
        VALUES (:id, :code, :name, :student_id, :semester, :created_at)
        """,
        subjects,
    )
    conn.executemany(
        """
        INSERT INTO tasks (id, title, subject_id, student_id, task_type, due_date, estimated_hours, status, completed_at, created_at)
        VALUES (:id, :title, :subject_id, :student_id, :task_type, :due_date, :estimated_hours, :status, :completed_at, :created_at)
        """,
        tasks,
    )
    conn.executemany(
        """
        INSERT INTO risk_history (id, student_id, risk_level, completion_rate, overdue_tasks, workload_score, computed_at)
        VALUES (:id, :student_id, :risk_level, :completion_rate, :overdue_tasks, :workload_score, :computed_at)
        """,
        risk_rows,
    )

    conn.commit()
    print(
        f"Pull complete: users={len(users)}, subjects={len(subjects)}, tasks={len(tasks)}, risk_history={len(risk_rows)}"
    )


def _push_local_to_remote(base: str, admin_password: str, conn: sqlite3.Connection, wipe_remote: bool) -> None:
    cur = conn.cursor()
    users = [dict(r) for r in cur.execute("SELECT * FROM users ORDER BY id").fetchall()]
    subjects = [dict(r) for r in cur.execute("SELECT * FROM subjects ORDER BY id").fetchall()]
    tasks = [dict(r) for r in cur.execute("SELECT * FROM tasks ORDER BY id").fetchall()]
    risk_rows = [dict(r) for r in cur.execute("SELECT * FROM risk_history ORDER BY id").fetchall()]

    if not users:
        raise RuntimeError("Local database is empty. Run pull first or populate local data before push.")

    print("Pushing local data to remote...")

    if wipe_remote:
        print("Wiping remote tables before push...")
        remote_risk = _request(base, admin_password, "GET", "/api/admin/risk_history")
        remote_tasks = _request(base, admin_password, "GET", "/api/admin/tasks")
        remote_subjects = _request(base, admin_password, "GET", "/api/admin/subjects")
        remote_users = _request(base, admin_password, "GET", "/api/admin/users")

        for row in remote_risk:
            _request(base, admin_password, "DELETE", f"/api/admin/risk_history/{row['id']}")
        for row in remote_tasks:
            _request(base, admin_password, "DELETE", f"/api/admin/tasks/{row['id']}")
        for row in remote_subjects:
            _request(base, admin_password, "DELETE", f"/api/admin/subjects/{row['id']}")
        for row in remote_users:
            _request(base, admin_password, "DELETE", f"/api/admin/users/{row['id']}")

    user_id_map: dict[int, int] = {}
    for user in users:
        password = user.get("password_plain") or ("faculty123" if user.get("role") == "faculty" else "student123")
        created = _request(
            base,
            admin_password,
            "POST",
            "/api/admin/users",
            {
                "email": user["email"],
                "password": password,
                "name": user["name"],
                "role": user["role"],
                "student_id": user.get("student_id"),
                "department": user.get("department"),
                "year": user.get("year"),
            },
        )
        user_id_map[user["id"]] = created["id"]

    subject_id_map: dict[int, int] = {}
    for subject in subjects:
        created = _request(
            base,
            admin_password,
            "POST",
            "/api/admin/subjects",
            {
                "code": subject["code"],
                "name": subject["name"],
                "student_id": user_id_map[subject["student_id"]],
                "semester": subject.get("semester"),
            },
        )
        subject_id_map[subject["id"]] = created["id"]

    for task in tasks:
        _request(
            base,
            admin_password,
            "POST",
            "/api/admin/tasks",
            {
                "title": task["title"],
                "subject_id": subject_id_map[task["subject_id"]],
                "student_id": user_id_map[task["student_id"]],
                "task_type": task["task_type"],
                "due_date": task["due_date"],
                "estimated_hours": task["estimated_hours"],
                "status": task["status"],
            },
        )

    for row in risk_rows:
        _request(
            base,
            admin_password,
            "POST",
            "/api/admin/risk_history",
            {
                "student_id": user_id_map[row["student_id"]],
                "risk_level": row["risk_level"],
                "completion_rate": row["completion_rate"],
                "overdue_tasks": row["overdue_tasks"],
                "workload_score": row["workload_score"],
            },
        )

    print(
        f"Push complete: users={len(users)}, subjects={len(subjects)}, tasks={len(tasks)}, risk_history={len(risk_rows)}"
    )


def main() -> None:
    parser = argparse.ArgumentParser(description="Sync local SQLite mirror with remote admin API database.")
    parser.add_argument("direction", choices=["pull", "push"], help="pull: remote->local, push: local->remote")
    parser.add_argument("--base", default="https://academic-early-risk-system.vercel.app", help="Remote API base URL")
    parser.add_argument("--admin-password", default="0000", help="Admin password for /api/admin endpoints")
    parser.add_argument("--local-db", default="./local_mirror.db", help="Path to local SQLite mirror DB")
    parser.add_argument(
        "--wipe-remote",
        action="store_true",
        help="When pushing, delete all remote rows before recreating from local mirror",
    )
    args = parser.parse_args()

    local_db_path = Path(args.local_db).resolve()
    conn = _connect_local(local_db_path)
    try:
        _ensure_schema(conn)
        if args.direction == "pull":
            _pull_remote_to_local(args.base, args.admin_password, conn)
        else:
            _push_local_to_remote(args.base, args.admin_password, conn, args.wipe_remote)
    finally:
        conn.close()


if __name__ == "__main__":
    main()
