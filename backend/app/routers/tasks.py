from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Task, TaskStatus, Subject, User
from ..schemas import TaskCreate, TaskUpdate, TaskOut
from ..auth import get_current_user, require_student

router = APIRouter(prefix="/api/tasks", tags=["tasks"])


def _task_to_out(task: Task) -> dict:
    return {
        "id": task.id,
        "title": task.title,
        "subject_id": task.subject_id,
        "student_id": task.student_id,
        "task_type": task.task_type.value,
        "due_date": task.due_date,
        "estimated_hours": task.estimated_hours,
        "status": task.status.value,
        "completed_at": task.completed_at,
        "created_at": task.created_at,
        "subject_code": task.subject.code if task.subject else None,
        "subject_name": task.subject.name if task.subject else None,
    }


@router.get("", response_model=list[TaskOut])
def list_tasks(
    status: str | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = db.query(Task).filter(Task.student_id == current_user.id)
    if status:
        q = q.filter(Task.status == TaskStatus(status))
    return [_task_to_out(t) for t in q.order_by(Task.due_date).all()]


@router.post("", response_model=TaskOut)
def create_task(
    data: TaskCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_student),
):
    subj = db.query(Subject).filter(
        Subject.id == data.subject_id,
        Subject.student_id == current_user.id,
    ).first()
    if not subj:
        raise HTTPException(status_code=404, detail="Subject not found")

    task = Task(
        title=data.title,
        subject_id=data.subject_id,
        student_id=current_user.id,
        task_type=data.task_type,
        due_date=data.due_date,
        estimated_hours=data.estimated_hours,
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    return _task_to_out(task)


@router.patch("/{task_id}", response_model=TaskOut)
def update_task(
    task_id: int,
    data: TaskUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_student),
):
    task = db.query(Task).filter(
        Task.id == task_id,
        Task.student_id == current_user.id,
    ).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    if data.title is not None:
        task.title = data.title
    if data.due_date is not None:
        task.due_date = data.due_date
    if data.estimated_hours is not None:
        task.estimated_hours = data.estimated_hours
    if data.status is not None:
        task.status = TaskStatus(data.status)
        if data.status == "completed":
            task.completed_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(task)
    return _task_to_out(task)


@router.delete("/{task_id}")
def delete_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_student),
):
    task = db.query(Task).filter(
        Task.id == task_id,
        Task.student_id == current_user.id,
    ).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    db.delete(task)
    db.commit()
    return {"detail": "Task deleted"}
