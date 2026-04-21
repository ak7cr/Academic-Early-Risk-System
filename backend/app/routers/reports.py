from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import User, UserRole, Task, TaskStatus
from ..schemas import WeeklyReport
from ..auth import get_current_user, require_faculty
from ..risk_engine import _classify, _build_recommendations, _as_utc

router = APIRouter(prefix="/api/reports", tags=["reports"])


def _generate_report(db: Session, student: User) -> WeeklyReport:
    now = datetime.now(timezone.utc)
    week_ago = now - timedelta(days=7)

    tasks = db.query(Task).filter(Task.student_id == student.id).all()
    total = len(tasks)
    completed = sum(1 for t in tasks if t.status == TaskStatus.completed)
    overdue = sum(1 for t in tasks if t.status == TaskStatus.overdue or (t.status == TaskStatus.pending and _as_utc(t.due_date) < now))
    pending = total - completed - overdue
    rate = (completed / total * 100) if total > 0 else 100.0
    workload = min(10.0, round(((overdue * 2 + pending) / total) * 10, 1)) if total > 0 else 0.0

    risk = _classify(overdue, rate)
    recs = _build_recommendations(risk, overdue, rate, pending)

    return WeeklyReport(
        student_name=student.name,
        student_id=student.student_id,
        report_period=f"{week_ago.strftime('%b %d')} - {now.strftime('%b %d, %Y')}",
        total_tasks=total,
        completed_tasks=completed,
        missed_deadlines=overdue,
        completion_rate=round(rate, 1),
        risk_level=risk.value,
        workload_score=workload,
        recommendations=recs,
    )


@router.get("/weekly", response_model=WeeklyReport)
def get_weekly_report(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get weekly report for current student."""
    return _generate_report(db, current_user)


@router.get("/student/{student_id}/weekly", response_model=WeeklyReport)
def get_student_weekly_report(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_faculty),
):
    """Get weekly report for a specific student (faculty only)."""
    student = db.query(User).filter(User.id == student_id, User.role == UserRole.student).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    return _generate_report(db, student)
