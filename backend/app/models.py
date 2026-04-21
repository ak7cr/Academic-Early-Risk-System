from datetime import datetime, timezone

from sqlalchemy import Integer, String, Float, DateTime, Boolean, ForeignKey, Enum as SAEnum, func
from sqlalchemy.orm import relationship, Mapped, mapped_column
import enum

from .database import Base


def _utcnow():
    return datetime.now(timezone.utc)


class UserRole(str, enum.Enum):
    student = "student"
    faculty = "faculty"


class TaskStatus(str, enum.Enum):
    pending = "pending"
    completed = "completed"
    overdue = "overdue"


class TaskType(str, enum.Enum):
    assignment = "assignment"
    exam = "exam"
    task = "task"
    quiz = "quiz"
    project = "project"
    lab = "lab"
    other = "other"


class RiskLevel(str, enum.Enum):
    low = "low"
    medium = "medium"
    high = "high"


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    email: Mapped[str] = mapped_column(String(320), unique=True, index=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(256), nullable=False)
    password_plain: Mapped[str | None] = mapped_column(String(256), nullable=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    role: Mapped[UserRole] = mapped_column(SAEnum(UserRole, name="userrole", native_enum=False), nullable=False)
    student_id: Mapped[str | None] = mapped_column(String(50), unique=True, nullable=True)
    department: Mapped[str | None] = mapped_column(String(200), nullable=True)
    year: Mapped[int | None] = mapped_column(Integer, nullable=True)
    faculty_notes: Mapped[str | None] = mapped_column(String(2000), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow, onupdate=_utcnow)
    pending_sync: Mapped[bool] = mapped_column(Boolean, default=True)

    subjects = relationship("Subject", back_populates="student", cascade="all, delete-orphan")
    tasks = relationship("Task", back_populates="student", cascade="all, delete-orphan")
    risk_history = relationship("RiskHistory", back_populates="student", cascade="all, delete-orphan")


class Subject(Base):
    __tablename__ = "subjects"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    code: Mapped[str] = mapped_column(String(20), nullable=False)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    student_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    semester: Mapped[str | None] = mapped_column(String(50), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow, onupdate=_utcnow)
    pending_sync: Mapped[bool] = mapped_column(Boolean, default=True)

    student = relationship("User", back_populates="subjects")
    tasks = relationship("Task", back_populates="subject", cascade="all, delete-orphan")


class Task(Base):
    __tablename__ = "tasks"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String(300), nullable=False)
    subject_id: Mapped[int] = mapped_column(Integer, ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False)
    student_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    task_type: Mapped[TaskType] = mapped_column(SAEnum(TaskType, name="tasktype", native_enum=False), default=TaskType.assignment)
    due_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    estimated_hours: Mapped[float] = mapped_column(Float, default=0.0)
    status: Mapped[TaskStatus] = mapped_column(SAEnum(TaskStatus, name="taskstatus", native_enum=False), default=TaskStatus.pending)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow, onupdate=_utcnow)
    pending_sync: Mapped[bool] = mapped_column(Boolean, default=True)

    subject = relationship("Subject", back_populates="tasks")
    student = relationship("User", back_populates="tasks")


class RiskHistory(Base):
    __tablename__ = "risk_history"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    student_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    risk_level: Mapped[RiskLevel] = mapped_column(SAEnum(RiskLevel, name="risklevel", native_enum=False), nullable=False)
    completion_rate: Mapped[float] = mapped_column(Float, nullable=False)
    overdue_tasks: Mapped[int] = mapped_column(Integer, nullable=False)
    workload_score: Mapped[float] = mapped_column(Float, nullable=False)
    computed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow, onupdate=_utcnow)
    pending_sync: Mapped[bool] = mapped_column(Boolean, default=True)

    student = relationship("User", back_populates="risk_history")


