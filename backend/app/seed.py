"""Seed the database with richer demo data for testing."""

from datetime import datetime, timedelta, timezone
import random

from sqlalchemy.orm import Session

from .models import RiskHistory, RiskLevel, Subject, Task, TaskStatus, TaskType, User, UserRole
from .auth import hash_password


SUBJECT_CATALOG = [
    ("CS201", "Data Structures"),
    ("CS202", "Database Systems"),
    ("CS203", "Computer Networks"),
    ("CS204", "Operating Systems"),
    ("CS205", "Software Engineering"),
    ("CS206", "Machine Learning"),
]

FACULTY_FOR_SUBJECT = [
    ("Dr. Maya Carter", "maya.carter@university.edu", "Data Structures"),
    ("Dr. Ethan Brooks", "ethan.brooks@university.edu", "Database Systems"),
    ("Dr. Lina Flores", "lina.flores@university.edu", "Computer Networks"),
    ("Dr. Omar Singh", "omar.singh@university.edu", "Operating Systems"),
    ("Dr. Zoe Kim", "zoe.kim@university.edu", "Software Engineering"),
    ("Dr. Noah Patel", "noah.patel@university.edu", "Machine Learning"),
]

FIRST_NAMES = [
    "Ava", "Liam", "Mia", "Noah", "Emma", "Lucas", "Olivia", "Ethan", "Isabella", "Mason",
    "Sophia", "James", "Amelia", "Benjamin", "Harper", "Elijah", "Evelyn", "Alexander", "Abigail", "Daniel",
]

LAST_NAMES = [
    "Johnson", "Smith", "Martinez", "Brown", "Davis", "Wilson", "Anderson", "Thomas", "Jackson", "White",
    "Harris", "Martin", "Thompson", "Garcia", "Clark", "Lewis", "Walker", "Allen", "Young", "King",
]

TASK_PATTERNS = [
    "Assignment", "Lab", "Quiz", "Project", "Case Study", "Presentation", "Worksheet", "Review",
]


def _pick_task_status(rng: random.Random, risk_profile: str) -> TaskStatus:
    roll = rng.random()
    if risk_profile == "high":
        if roll < 0.45:
            return TaskStatus.overdue
        if roll < 0.85:
            return TaskStatus.pending
        return TaskStatus.completed
    if risk_profile == "medium":
        if roll < 0.2:
            return TaskStatus.overdue
        if roll < 0.55:
            return TaskStatus.pending
        return TaskStatus.completed
    if roll < 0.08:
        return TaskStatus.overdue
    if roll < 0.3:
        return TaskStatus.pending
    return TaskStatus.completed


def _risk_level_from_snapshot(completion_rate: float, overdue_tasks: int) -> RiskLevel:
    if overdue_tasks > 3 and completion_rate < 60:
        return RiskLevel.high
    if overdue_tasks >= 1 and completion_rate < 60:
        return RiskLevel.high
    if overdue_tasks > 3 and completion_rate < 80:
        return RiskLevel.high
    if 1 <= overdue_tasks <= 3 and 60 <= completion_rate <= 80:
        return RiskLevel.medium
    if overdue_tasks == 0 and completion_rate > 80:
        return RiskLevel.low
    return RiskLevel.medium


def seed_database(db: Session):
    """Insert demo faculty, students, subject enrollments, tasks, and risk history."""
    if db.query(User).first():
        return

    rng = random.Random(20260314)
    now = datetime.now(timezone.utc)

    # Add one faculty for each of the 6 subjects.
    for name, email, subject_name in FACULTY_FOR_SUBJECT:
        db.add(User(
            email=email,
            password_hash=hash_password("faculty123"),
            password_plain="faculty123",
            name=name,
            role=UserRole.faculty,
            department=f"Computer Science - {subject_name}",
        ))
    db.flush()

    for idx in range(20):
        first = FIRST_NAMES[idx]
        last = LAST_NAMES[idx]
        email = f"{first.lower()}.{last.lower()}{idx + 1}@university.edu"
        student = User(
            email=email,
            password_hash=hash_password("student123"),
            password_plain="student123",
            name=f"{first} {last}",
            role=UserRole.student,
            student_id=f"2026{idx + 1:03d}",
            department="Computer Science",
            year=2026,
        )
        db.add(student)
        db.flush()

        # Every student takes multiple subjects at once (3 to 5).
        enrolled = rng.sample(SUBJECT_CATALOG, rng.randint(3, 5))
        subject_rows: list[Subject] = []
        for code, name in enrolled:
            subj = Subject(
                code=code,
                name=name,
                student_id=student.id,
                semester="Spring 2026",
            )
            db.add(subj)
            db.flush()
            subject_rows.append(subj)

        # Mix risk profiles to create realistic class distribution.
        if idx < 6:
            profile = "high"
        elif idx < 14:
            profile = "medium"
        else:
            profile = "low"

        total_tasks = 0
        completed_tasks = 0
        overdue_tasks = 0

        for subj in subject_rows:
            for task_idx in range(rng.randint(3, 5)):
                status = _pick_task_status(rng, profile)
                task_type = rng.choice([TaskType.assignment, TaskType.exam, TaskType.task])
                due_delta_days = rng.randint(-20, 21)
                due_date = now + timedelta(days=due_delta_days)
                completed_at = None
                if status == TaskStatus.completed:
                    complete_offset = min(-1, due_delta_days - rng.randint(0, 3))
                    completed_at = now + timedelta(days=complete_offset)

                db.add(Task(
                    title=f"{subj.code} {rng.choice(TASK_PATTERNS)} {task_idx + 1}",
                    subject_id=subj.id,
                    student_id=student.id,
                    task_type=task_type,
                    due_date=due_date,
                    estimated_hours=round(rng.uniform(1.5, 8.0), 1),
                    status=status,
                    completed_at=completed_at,
                ))

                total_tasks += 1
                if status == TaskStatus.completed:
                    completed_tasks += 1
                elif status == TaskStatus.overdue:
                    overdue_tasks += 1

        completion_rate = (completed_tasks / total_tasks * 100) if total_tasks else 100.0
        pending_tasks = max(0, total_tasks - completed_tasks - overdue_tasks)
        workload_score = min(10.0, round(((overdue_tasks * 2 + pending_tasks) / max(1, total_tasks)) * 10, 1))

        # Add several history points so trends endpoints have meaningful data.
        for week in range(4, 0, -1):
            completion_noise = rng.uniform(-8.0, 8.0)
            overdue_shift = rng.randint(-2, 2)
            hist_completion = min(100.0, max(20.0, round(completion_rate + completion_noise, 1)))
            hist_overdue = max(0, overdue_tasks + overdue_shift)
            hist_workload = min(10.0, max(0.0, round(workload_score + rng.uniform(-1.2, 1.2), 1)))
            db.add(RiskHistory(
                student_id=student.id,
                risk_level=_risk_level_from_snapshot(hist_completion, hist_overdue),
                completion_rate=hist_completion,
                overdue_tasks=hist_overdue,
                workload_score=hist_workload,
                computed_at=now - timedelta(days=7 * week),
            ))

    db.commit()
    print("Database seeded: 6 faculty, 20 students, multi-subject enrollments, tasks, and risk history.")
