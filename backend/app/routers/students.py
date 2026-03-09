from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import User, UserRole, Task, TaskStatus
from ..schemas import StudentSummary, RiskResult
from ..auth import require_faculty
from ..risk_engine import compute_risk, compute_trends, compute_subject_risk

router = APIRouter(prefix="/api/students", tags=["students"])


@router.get("", response_model=list[StudentSummary])
def list_students(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_faculty),
):
    """List all students with their risk metrics (faculty only)."""
    students = db.query(User).filter(User.role == UserRole.student).all()
    results = []

    for s in students:
        tasks = db.query(Task).filter(Task.student_id == s.id).all()
        total = len(tasks)
        completed = sum(1 for t in tasks if t.status == TaskStatus.completed)
        overdue = sum(1 for t in tasks if t.status == TaskStatus.overdue)
        rate = (completed / total * 100) if total > 0 else 100.0
        workload = min(10.0, round(((overdue * 2 + (total - completed - overdue)) / total) * 10, 1)) if total > 0 else 0.0

        from ..risk_engine import _classify
        risk = _classify(overdue, rate)

        results.append(StudentSummary(
            id=s.id,
            name=s.name,
            email=s.email,
            student_id=s.student_id,
            department=s.department,
            year=s.year,
            risk_level=risk.value,
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

    tasks = db.query(Task).filter(Task.student_id == student.id).all()
    total = len(tasks)
    completed = sum(1 for t in tasks if t.status == TaskStatus.completed)
    overdue = sum(1 for t in tasks if t.status == TaskStatus.overdue)
    rate = (completed / total * 100) if total > 0 else 100.0
    workload = min(10.0, round(((overdue * 2 + (total - completed - overdue)) / total) * 10, 1)) if total > 0 else 0.0

    from ..risk_engine import _classify
    risk = _classify(overdue, rate)

    return StudentSummary(
        id=student.id,
        name=student.name,
        email=student.email,
        student_id=student.student_id,
        department=student.department,
        year=student.year,
        risk_level=risk.value,
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
    student = db.query(User).filter(User.id == student_id, User.role == UserRole.student).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    return compute_trends(db, student.id)


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
