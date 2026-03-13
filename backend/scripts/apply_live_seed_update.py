import json
import random
import urllib.error
import urllib.request
from datetime import datetime, timedelta, timezone

BASE = "https://academic-early-risk-system.vercel.app"
ADMIN_PASSWORD = "0000"

random.seed(20260314)

SUBJECT_CATALOG = [
    ("CS201", "Data Structures"),
    ("CS202", "Database Systems"),
    ("CS203", "Computer Networks"),
    ("CS204", "Operating Systems"),
    ("CS205", "Software Engineering"),
    ("CS206", "Machine Learning"),
]

FACULTY_DATA = [
    ("Dr. Maya Carter", "maya.carter.realdb@university.edu", "Data Structures"),
    ("Dr. Ethan Brooks", "ethan.brooks.realdb@university.edu", "Database Systems"),
    ("Dr. Lina Flores", "lina.flores.realdb@university.edu", "Computer Networks"),
    ("Dr. Omar Singh", "omar.singh.realdb@university.edu", "Operating Systems"),
    ("Dr. Zoe Kim", "zoe.kim.realdb@university.edu", "Software Engineering"),
    ("Dr. Noah Patel", "noah.patel.realdb@university.edu", "Machine Learning"),
]

FIRST_NAMES = [
    "Ava", "Liam", "Mia", "Noah", "Emma", "Lucas", "Olivia", "Ethan", "Isabella", "Mason",
    "Sophia", "James", "Amelia", "Benjamin", "Harper", "Elijah", "Evelyn", "Alexander", "Abigail", "Daniel",
]

LAST_NAMES = [
    "Johnson", "Smith", "Martinez", "Brown", "Davis", "Wilson", "Anderson", "Thomas", "Jackson", "White",
    "Harris", "Martin", "Thompson", "Garcia", "Clark", "Lewis", "Walker", "Allen", "Young", "King",
]

TASK_PATTERNS = ["Assignment", "Lab", "Quiz", "Project", "Case Study", "Presentation", "Worksheet", "Review"]


def req(method, path, data=None):
    body = None if data is None else json.dumps(data).encode("utf-8")
    request = urllib.request.Request(
        BASE + path,
        data=body,
        method=method,
        headers={
            "Content-Type": "application/json",
            "X-Admin-Password": ADMIN_PASSWORD,
        },
    )
    try:
        with urllib.request.urlopen(request, timeout=60) as response:
            text = response.read().decode("utf-8")
            return json.loads(text) if text else None
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", "ignore")
        raise RuntimeError(f"{method} {path} -> HTTP {exc.code}: {detail}") from exc


def pick_task_status(profile):
    roll = random.random()
    if profile == "high":
        if roll < 0.45:
            return "overdue"
        if roll < 0.85:
            return "pending"
        return "completed"
    if profile == "medium":
        if roll < 0.2:
            return "overdue"
        if roll < 0.55:
            return "pending"
        return "completed"
    if roll < 0.08:
        return "overdue"
    if roll < 0.3:
        return "pending"
    return "completed"


def risk_level_from_snapshot(completion_rate, overdue_tasks):
    if overdue_tasks > 3 and completion_rate < 60:
        return "high"
    if overdue_tasks >= 1 and completion_rate < 60:
        return "high"
    if overdue_tasks > 3 and completion_rate < 80:
        return "high"
    if 1 <= overdue_tasks <= 3 and 60 <= completion_rate <= 80:
        return "medium"
    if overdue_tasks == 0 and completion_rate > 80:
        return "low"
    return "medium"


def main():
    stats_before = req("GET", "/api/admin/stats")
    users_before = req("GET", "/api/admin/users")
    subjects_before = req("GET", "/api/admin/subjects")

    subjects_to_delete = sorted(subjects_before, key=lambda s: s["id"])[:6]
    for subject in subjects_to_delete:
        req("DELETE", f"/api/admin/subjects/{subject['id']}")

    existing_emails = {user["email"] for user in users_before}
    created_faculty = 0
    for name, email, subject_name in FACULTY_DATA:
        if email in existing_emails:
            continue
        req("POST", "/api/admin/users", {
            "email": email,
            "password": "faculty123",
            "name": name,
            "role": "faculty",
            "department": f"Computer Science - {subject_name}",
        })
        created_faculty += 1

    batch_tag = datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S")
    created_students = 0
    created_subject_rows = 0
    created_tasks = 0
    created_risk_rows = 0

    for idx in range(20):
        first = FIRST_NAMES[idx]
        last = LAST_NAMES[idx]
        student = req("POST", "/api/admin/users", {
            "email": f"{first.lower()}.{last.lower()}.{batch_tag}.{idx+1}@university.edu",
            "password": "student123",
            "name": f"{first} {last}",
            "role": "student",
            "student_id": f"RDB{batch_tag[-6:]}{idx+1:03d}",
            "department": "Computer Science",
            "year": 2026,
        })
        student_id = student["id"]
        created_students += 1

        enrolled = random.sample(SUBJECT_CATALOG, random.randint(3, 5))
        subject_ids = []
        for code, name in enrolled:
            subject = req("POST", "/api/admin/subjects", {
                "code": code,
                "name": name,
                "student_id": student_id,
                "semester": "Spring 2026",
            })
            subject_ids.append((subject["id"], code))
            created_subject_rows += 1

        profile = "high" if idx < 6 else "medium" if idx < 14 else "low"
        total = 0
        completed = 0
        overdue = 0
        now = datetime.now(timezone.utc)

        for subject_id, code in subject_ids:
            for task_idx in range(random.randint(3, 5)):
                status = pick_task_status(profile)
                req("POST", "/api/admin/tasks", {
                    "title": f"{code} {random.choice(TASK_PATTERNS)} {task_idx + 1}",
                    "subject_id": subject_id,
                    "student_id": student_id,
                    "task_type": random.choice(["assignment", "exam", "task"]),
                    "due_date": (now + timedelta(days=random.randint(-20, 21))).isoformat(),
                    "estimated_hours": round(random.uniform(1.5, 8.0), 1),
                    "status": status,
                })
                created_tasks += 1
                total += 1
                if status == "completed":
                    completed += 1
                elif status == "overdue":
                    overdue += 1

        completion_rate = (completed / total * 100) if total else 100.0
        pending = max(0, total - completed - overdue)
        workload = min(10.0, round(((overdue * 2 + pending) / max(1, total)) * 10, 1))

        for week in range(4, 0, -1):
            hist_completion = min(100.0, max(20.0, round(completion_rate + random.uniform(-8.0, 8.0), 1)))
            hist_overdue = max(0, overdue + random.randint(-2, 2))
            hist_workload = min(10.0, max(0.0, round(workload + random.uniform(-1.2, 1.2), 1)))
            req("POST", "/api/admin/risk_history", {
                "student_id": student_id,
                "risk_level": risk_level_from_snapshot(hist_completion, hist_overdue),
                "completion_rate": hist_completion,
                "overdue_tasks": hist_overdue,
                "workload_score": hist_workload,
            })
            created_risk_rows += 1

    stats_after = req("GET", "/api/admin/stats")

    print(json.dumps({
        "deleted_subject_ids": [s["id"] for s in subjects_to_delete],
        "created_faculty": created_faculty,
        "created_students": created_students,
        "created_subject_rows": created_subject_rows,
        "created_tasks": created_tasks,
        "created_risk_rows": created_risk_rows,
        "stats_before": stats_before,
        "stats_after": stats_after,
    }, indent=2))


if __name__ == "__main__":
    main()
