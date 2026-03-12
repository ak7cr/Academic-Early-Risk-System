"""
Admin API — password-protected CRUD for all DB tables.
Password is checked via X-Admin-Password header on every request.
"""

import hmac
from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import datetime

from ..database import get_db
from ..models import User, Subject, Task, RiskHistory

router = APIRouter(prefix="/api/admin", tags=["admin"])

ADMIN_PASSWORD = "0000"


def _verify_password(x_admin_password: str = Header(...)):
    if not hmac.compare_digest(x_admin_password, ADMIN_PASSWORD):
        raise HTTPException(status_code=401, detail="Invalid admin password")


# ── Schemas ─────────────────────────────────────────────────

class UserRow(BaseModel):
    id: int
    email: str
    password_hash: str
    name: str
    role: str
    student_id: str | None = None
    department: str | None = None
    year: int | None = None
    created_at: datetime | None = None
    model_config = {"from_attributes": True}

class UserUpdate(BaseModel):
    email: str | None = None
    password_hash: str | None = None
    name: str | None = None
    role: str | None = None
    student_id: str | None = None
    department: str | None = None
    year: int | None = None

class SubjectRow(BaseModel):
    id: int
    code: str
    name: str
    student_id: int
    semester: str | None = None
    created_at: datetime | None = None
    model_config = {"from_attributes": True}

class SubjectUpdate(BaseModel):
    code: str | None = None
    name: str | None = None
    student_id: int | None = None
    semester: str | None = None

class TaskRow(BaseModel):
    id: int
    title: str
    subject_id: int
    student_id: int
    task_type: str
    due_date: datetime
    estimated_hours: float
    status: str
    completed_at: datetime | None = None
    created_at: datetime | None = None
    model_config = {"from_attributes": True}

class TaskUpdate(BaseModel):
    title: str | None = None
    subject_id: int | None = None
    student_id: int | None = None
    task_type: str | None = None
    due_date: datetime | None = None
    estimated_hours: float | None = None
    status: str | None = None
    completed_at: datetime | None = None

class RiskRow(BaseModel):
    id: int
    student_id: int
    risk_level: str
    completion_rate: float
    overdue_tasks: int
    workload_score: float
    computed_at: datetime | None = None
    model_config = {"from_attributes": True}


# ── Auth check ──────────────────────────────────────────────

@router.post("/login")
def admin_login(x_admin_password: str = Header(...)):
    """Verify the admin password. Returns 200 on success."""
    _verify_password(x_admin_password)
    return {"ok": True}


# ── Users CRUD ─────────────────────────────────────────────

@router.get("/users", response_model=list[UserRow])
def list_users(db: Session = Depends(get_db), _=Depends(_verify_password)):
    return db.query(User).order_by(User.id).all()

@router.get("/users/{uid}", response_model=UserRow)
def get_user(uid: int, db: Session = Depends(get_db), _=Depends(_verify_password)):
    u = db.get(User, uid)
    if not u:
        raise HTTPException(404, "User not found")
    return u

@router.patch("/users/{uid}", response_model=UserRow)
def update_user(uid: int, body: UserUpdate, db: Session = Depends(get_db), _=Depends(_verify_password)):
    u = db.get(User, uid)
    if not u:
        raise HTTPException(404, "User not found")
    for k, v in body.model_dump(exclude_none=True).items():
        setattr(u, k, v)
    db.commit()
    db.refresh(u)
    return u

@router.delete("/users/{uid}")
def delete_user(uid: int, db: Session = Depends(get_db), _=Depends(_verify_password)):
    u = db.get(User, uid)
    if not u:
        raise HTTPException(404, "User not found")
    db.delete(u)
    db.commit()
    return {"deleted": uid}


# ── Subjects CRUD ──────────────────────────────────────────

@router.get("/subjects", response_model=list[SubjectRow])
def list_subjects(db: Session = Depends(get_db), _=Depends(_verify_password)):
    return db.query(Subject).order_by(Subject.id).all()

@router.patch("/subjects/{sid}", response_model=SubjectRow)
def update_subject(sid: int, body: SubjectUpdate, db: Session = Depends(get_db), _=Depends(_verify_password)):
    s = db.get(Subject, sid)
    if not s:
        raise HTTPException(404, "Subject not found")
    for k, v in body.model_dump(exclude_none=True).items():
        setattr(s, k, v)
    db.commit()
    db.refresh(s)
    return s

@router.delete("/subjects/{sid}")
def delete_subject(sid: int, db: Session = Depends(get_db), _=Depends(_verify_password)):
    s = db.get(Subject, sid)
    if not s:
        raise HTTPException(404, "Subject not found")
    db.delete(s)
    db.commit()
    return {"deleted": sid}


# ── Tasks CRUD ─────────────────────────────────────────────

@router.get("/tasks", response_model=list[TaskRow])
def list_tasks(db: Session = Depends(get_db), _=Depends(_verify_password)):
    return db.query(Task).order_by(Task.id).all()

@router.patch("/tasks/{tid}", response_model=TaskRow)
def update_task(tid: int, body: TaskUpdate, db: Session = Depends(get_db), _=Depends(_verify_password)):
    t = db.get(Task, tid)
    if not t:
        raise HTTPException(404, "Task not found")
    for k, v in body.model_dump(exclude_none=True).items():
        setattr(t, k, v)
    db.commit()
    db.refresh(t)
    return t

@router.delete("/tasks/{tid}")
def delete_task(tid: int, db: Session = Depends(get_db), _=Depends(_verify_password)):
    t = db.get(Task, tid)
    if not t:
        raise HTTPException(404, "Task not found")
    db.delete(t)
    db.commit()
    return {"deleted": tid}


# ── Risk History CRUD ──────────────────────────────────────

@router.get("/risk_history", response_model=list[RiskRow])
def list_risk_history(db: Session = Depends(get_db), _=Depends(_verify_password)):
    return db.query(RiskHistory).order_by(RiskHistory.id).all()

@router.delete("/risk_history/{rid}")
def delete_risk_history(rid: int, db: Session = Depends(get_db), _=Depends(_verify_password)):
    r = db.get(RiskHistory, rid)
    if not r:
        raise HTTPException(404, "Risk history not found")
    db.delete(r)
    db.commit()
    return {"deleted": rid}


# ── Stats ──────────────────────────────────────────────────

@router.get("/stats")
def stats(db: Session = Depends(get_db), _=Depends(_verify_password)):
    return {
        "users": db.query(User).count(),
        "subjects": db.query(Subject).count(),
        "tasks": db.query(Task).count(),
        "risk_history": db.query(RiskHistory).count(),
    }
