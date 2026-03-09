from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Subject, User
from ..schemas import SubjectCreate, SubjectOut, SubjectWithRisk
from ..auth import get_current_user, require_student
from ..risk_engine import compute_subject_risk

router = APIRouter(prefix="/api/subjects", tags=["subjects"])


@router.get("", response_model=list[SubjectOut])
def list_subjects(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return db.query(Subject).filter(Subject.student_id == current_user.id).all()


@router.get("/with-risk", response_model=list[SubjectWithRisk])
def list_subjects_with_risk(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return compute_subject_risk(db, current_user.id)


@router.post("", response_model=SubjectOut)
def create_subject(
    data: SubjectCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_student),
):
    subj = Subject(
        code=data.code,
        name=data.name,
        semester=data.semester,
        student_id=current_user.id,
    )
    db.add(subj)
    db.commit()
    db.refresh(subj)
    return subj


@router.delete("/{subject_id}")
def delete_subject(
    subject_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_student),
):
    subj = db.query(Subject).filter(
        Subject.id == subject_id,
        Subject.student_id == current_user.id,
    ).first()
    if not subj:
        raise HTTPException(status_code=404, detail="Subject not found")
    db.delete(subj)
    db.commit()
    return {"detail": "Subject deleted"}
