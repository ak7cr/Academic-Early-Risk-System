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
from ..auth import hash_password

router = APIRouter(prefix="/api/admin", tags=["admin"])

ADMIN_PASSWORD = "0000"


def _verify_password(x_admin_password: str = Header(...)):
    if not hmac.compare_digest(x_admin_password, ADMIN_PASSWORD):
        raise HTTPException(status_code=401, detail="Invalid admin password")


# ── Schemas ─────────────────────────────────────────────────

class UserRow(BaseModel):
    id: int
    email: str
    password_plain: str | None = None
    name: str
    role: str
    student_id: str | None = None
    department: str | None = None
    year: int | None = None
    created_at: datetime | None = None
    model_config = {"from_attributes": True}

class UserUpdate(BaseModel):
    email: str | None = None
    password: str | None = None
    name: str | None = None
    role: str | None = None
    student_id: str | None = None
    department: str | None = None
    year: int | None = None

class UserCreate(BaseModel):
    email: str
    password: str
    name: str
    role: str
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

class SubjectCreate(BaseModel):
    code: str
    name: str
    student_id: int
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

class TaskCreate(BaseModel):
    title: str
    subject_id: int
    student_id: int
    task_type: str
    due_date: datetime
    estimated_hours: float = 1.0
    status: str = "pending"

class RiskRow(BaseModel):
    id: int
    student_id: int
    risk_level: str
    completion_rate: float
    overdue_tasks: int
    workload_score: float
    computed_at: datetime | None = None
    model_config = {"from_attributes": True}

class RiskCreate(BaseModel):
    student_id: int
    risk_level: str
    completion_rate: float = 0.0
    overdue_tasks: int = 0
    workload_score: float = 0.0


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

@router.post("/users", response_model=UserRow)
def create_user(body: UserCreate, db: Session = Depends(get_db), _=Depends(_verify_password)):
    from ..models import UserRole
    u = User(
        email=body.email,
        password_hash=hash_password(body.password),
        password_plain=body.password,
        name=body.name,
        role=UserRole(body.role),
        student_id=body.student_id,
        department=body.department,
        year=body.year,
    )
    db.add(u)
    db.commit()
    db.refresh(u)
    return u

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
    update_data = body.model_dump(exclude_none=True)
    if "password" in update_data:
        plain = update_data.pop("password")
        update_data["password_hash"] = hash_password(plain)
        update_data["password_plain"] = plain
    for k, v in update_data.items():
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

@router.post("/subjects", response_model=SubjectRow)
def create_subject(body: SubjectCreate, db: Session = Depends(get_db), _=Depends(_verify_password)):
    s = Subject(
        code=body.code,
        name=body.name,
        student_id=body.student_id,
        semester=body.semester,
    )
    db.add(s)
    db.commit()
    db.refresh(s)
    return s

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

@router.post("/tasks", response_model=TaskRow)
def create_task(body: TaskCreate, db: Session = Depends(get_db), _=Depends(_verify_password)):
    from ..models import TaskType, TaskStatus
    t = Task(
        title=body.title,
        subject_id=body.subject_id,
        student_id=body.student_id,
        task_type=TaskType(body.task_type),
        due_date=body.due_date,
        estimated_hours=body.estimated_hours,
        status=TaskStatus(body.status),
    )
    db.add(t)
    db.commit()
    db.refresh(t)
    return t

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

@router.post("/risk_history", response_model=RiskRow)
def create_risk_history(body: RiskCreate, db: Session = Depends(get_db), _=Depends(_verify_password)):
    from ..models import RiskLevel
    r = RiskHistory(
        student_id=body.student_id,
        risk_level=RiskLevel(body.risk_level),
        completion_rate=body.completion_rate,
        overdue_tasks=body.overdue_tasks,
        workload_score=body.workload_score,
    )
    db.add(r)
    db.commit()
    db.refresh(r)
    return r

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
