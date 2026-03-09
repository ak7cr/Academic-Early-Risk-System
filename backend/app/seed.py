"""Seed the database with demo data for testing."""

from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from .models import User, UserRole, Subject, Task, TaskType, TaskStatus
from .auth import hash_password


def seed_database(db: Session):
    """Insert demo students, faculty, subjects, and tasks."""
    # Skip if already seeded
    if db.query(User).first():
        return

    now = datetime.now(timezone.utc)

    # Faculty (2 members)
    faculty1 = User(
        email="sarah.johnson@university.edu",
        password_hash=hash_password("faculty123"),
        name="Dr. Sarah Johnson",
        role=UserRole.faculty,
        department="Computer Science",
    )
    faculty2 = User(
        email="james.patel@university.edu",
        password_hash=hash_password("faculty123"),
        name="Dr. James Patel",
        role=UserRole.faculty,
        department="Computer Science",
    )
    db.add_all([faculty1, faculty2])
    db.flush()

    # Students with varying risk profiles (3 students)
    students_data = [
        {
            "email": "alice.johnson@university.edu",
            "name": "Alice Johnson",
            "student_id": "2024001",
            "department": "Computer Science",
            "year": 2024,
            "subjects": [
                ("CS201", "Data Structures"),
                ("CS301", "Operating Systems"),
                ("CS202", "Database Systems"),
                ("CS302", "Software Engineering"),
                ("CS401", "Machine Learning"),
            ],
            # HIGH RISK: low completion, many overdue
            "tasks": [
                ("DS Assignment 1", 0, "assignment", -14, "completed", -10),
                ("DS Lab Report", 0, "assignment", -7, "overdue", None),
                ("DS Midterm Prep", 0, "exam", -3, "overdue", None),
                ("OS Project Phase 1", 1, "assignment", -10, "overdue", None),
                ("OS Quiz 2", 1, "exam", -5, "overdue", None),
                ("DB ER Diagram", 2, "assignment", -2, "pending", None),
                ("SE Sprint Report", 3, "assignment", 3, "pending", None),
                ("ML Dataset Analysis", 4, "assignment", 7, "pending", None),
            ],
        },
        {
            "email": "bob.smith@university.edu",
            "name": "Bob Smith",
            "student_id": "2024002",
            "department": "Computer Science",
            "year": 2024,
            "subjects": [
                ("CS201", "Data Structures"),
                ("CS202", "Database Systems"),
                ("CS301", "Operating Systems"),
            ],
            # LOW RISK: high completion, no overdue
            "tasks": [
                ("DS Assignment 1", 0, "assignment", -14, "completed", -15),
                ("DS Lab Report", 0, "assignment", -7, "completed", -8),
                ("DS Midterm Prep", 0, "exam", -3, "completed", -4),
                ("DB ER Diagram", 1, "assignment", -2, "completed", -3),
                ("DB Normalization HW", 1, "assignment", 2, "pending", None),
                ("OS Project Phase 1", 2, "assignment", -10, "completed", -11),
                ("OS Quiz 2", 2, "exam", 5, "pending", None),
            ],
        },
        {
            "email": "carol.martinez@university.edu",
            "name": "Carol Martinez",
            "student_id": "2024003",
            "department": "Computer Science",
            "year": 2024,
            "subjects": [
                ("CS201", "Data Structures"),
                ("CS301", "Operating Systems"),
                ("CS202", "Database Systems"),
                ("CS401", "Machine Learning"),
            ],
            # MEDIUM RISK: moderate completion, 1 overdue
            "tasks": [
                ("DS Assignment 1", 0, "assignment", -14, "completed", -13),
                ("DS Lab Report", 0, "assignment", -7, "completed", -6),
                ("OS Project Phase 1", 1, "assignment", -10, "completed", -9),
                ("OS Quiz 2", 1, "exam", -5, "overdue", None),
                ("DB ER Diagram", 2, "assignment", -2, "completed", -1),
                ("ML Dataset Analysis", 3, "assignment", 5, "pending", None),
                ("DS Midterm Review", 0, "exam", 3, "pending", None),
                ("OS Lab 3", 1, "assignment", 7, "pending", None),
            ],
        },
    ]

    for sdata in students_data:
        student = User(
            email=sdata["email"],
            password_hash=hash_password("student123"),
            name=sdata["name"],
            role=UserRole.student,
            student_id=sdata["student_id"],
            department=sdata["department"],
            year=sdata["year"],
        )
        db.add(student)
        db.flush()

        # Create subjects
        subject_objs = []
        for code, name in sdata["subjects"]:
            subj = Subject(
                code=code,
                name=name,
                student_id=student.id,
                semester="Spring 2026",
            )
            db.add(subj)
            db.flush()
            subject_objs.append(subj)

        # Create tasks
        for title, subj_idx, ttype, days_offset, status, completed_offset in sdata["tasks"]:
            due = now + timedelta(days=days_offset)
            completed_at = (now + timedelta(days=completed_offset)) if completed_offset is not None else None
            task = Task(
                title=title,
                subject_id=subject_objs[subj_idx].id,
                student_id=student.id,
                task_type=TaskType(ttype),
                due_date=due,
                estimated_hours=round(2 + abs(days_offset) * 0.3, 1),
                status=TaskStatus(status),
                completed_at=completed_at,
            )
            db.add(task)

    db.commit()
    print("Database seeded with demo data.")
