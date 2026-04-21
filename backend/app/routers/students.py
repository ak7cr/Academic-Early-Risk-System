from datetime import datetime, timezone

from sqlalchemy import func, case, and_
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import User, UserRole, Task, TaskStatus
from ..schemas import StudentSummary, RiskResult
from ..auth import require_faculty
from ..risk_engine import compute_risk, compute_trends, compute_subject_risk, _classify, _as_utc

router = APIRouter(prefix="/api/students", tags=["students"])


def _now_utc():
    return datetime.now(timezone.utc)


@router.get("", response_model=list[StudentSummary])
def list_students(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_faculty),
):
    """List all students with risk metrics — 2 queries total, overdue includes pending+past-due."""
    students = db.query(User).filter(User.role == UserRole.student).all()
    if not students:
        return []

    student_ids = [s.id for s in students]
    now = _now_utc()

    stats = db.query(
        Task.student_id,
        func.count(Task.id).label("total"),
        func.sum(case((Task.status == TaskStatus.completed, 1), else_=0)).label("completed"),
        func.sum(case(
            (Task.status == TaskStatus.overdue, 1),
            else_=case(
                (and_(Task.status == TaskStatus.pending, Task.due_date < now), 1),
                else_=0,
            ),
        )).label("overdue"),
    ).filter(Task.student_id.in_(student_ids)).group_by(Task.student_id).all()

    stats_map = {row.student_id: row for row in stats}
    results = []
    for s in students:
        row = stats_map.get(s.id)
        total = row.total if row else 0
        completed = row.completed if row else 0
        overdue = row.overdue if row else 0
        rate = (completed / total * 100) if total > 0 else 100.0
        workload = min(10.0, round(((overdue * 2 + (total - completed - overdue)) / total) * 10, 1)) if total > 0 else 0.0
        results.append(StudentSummary(
            id=s.id,
            name=s.name,
            email=s.email,
            student_id=s.student_id,
            department=s.department,
            year=s.year,
            risk_level=_classify(overdue, rate).value,
            completion_rate=round(rate, 1),
            missed_deadlines=overdue,
            workload_score=workload,
            total_tasks=total,
        ))
    return results


@router.get("/{student_id}", response_model=StudentSummary)
def get_student(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_faculty),
):
    student = db.query(User).filter(User.id == student_id, User.role == UserRole.student).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    now = _now_utc()
    tasks = db.query(Task).filter(Task.student_id == student.id).all()
    total = len(tasks)
    completed = sum(1 for t in tasks if t.status == TaskStatus.completed)
    overdue = sum(1 for t in tasks if t.status == TaskStatus.overdue or (t.status == TaskStatus.pending and _as_utc(t.due_date) < now))
    rate = (completed / total * 100) if total > 0 else 100.0
    workload = min(10.0, round(((overdue * 2 + (total - completed - overdue)) / total) * 10, 1)) if total > 0 else 0.0

    return StudentSummary(
        id=student.id,
        name=student.name,
        email=student.email,
        student_id=student.student_id,
        department=student.department,
        year=student.year,
        risk_level=_classify(overdue, rate).value,
        completion_rate=round(rate, 1),
        missed_deadlines=overdue,
        workload_score=workload,
        total_tasks=total,
    )


@router.get("/{student_id}/risk", response_model=RiskResult)
def get_student_risk(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_faculty),
):
    student = db.query(User).filter(User.id == student_id, User.role == UserRole.student).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    return compute_risk(db, student.id)


@router.get("/{student_id}/trends")
def get_student_trends(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_faculty),
):
    """Return trend data in the shape the frontend expects:
    { labels, completion, overdue, workload }
    """
    student = db.query(User).filter(User.id == student_id, User.role == UserRole.student).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    trend_data = compute_trends(db, student.id)

    labels = [p["week"] for p in trend_data["completion_trend"]]
    completion = [p["value"] for p in trend_data["completion_trend"]]
    overdue = [p["overdue"] for p in trend_data["backlog_trend"]]
    # derive workload from risk_trend numeric value (20=low, 50=medium, 85=high → scale 0-10)
    workload = [round(p["value"] / 10, 1) for p in trend_data["risk_trend"]]

    return {
        "labels": labels,
        "completion": completion,
        "overdue": overdue,
        "workload": workload,
    }


@router.get("/{student_id}/subjects")
def get_student_subjects(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_faculty),
):
    student = db.query(User).filter(User.id == student_id, User.role == UserRole.student).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    return compute_subject_risk(db, student.id)
