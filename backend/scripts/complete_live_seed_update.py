import json
import random
import urllib.error
import urllib.request
from datetime import datetime, timedelta, timezone

BASE = "https://academic-early-risk-system.vercel.app"
ADMIN_PASSWORD = "0000"
TARGET_RDB_STUDENTS = 20
random.seed(20260314)

SUBJECT_CATALOG = [
    ("CS201", "Data Structures"),
    ("CS202", "Database Systems"),
    ("CS203", "Computer Networks"),
    ("CS204", "Operating Systems"),
    ("CS205", "Software Engineering"),
    ("CS206", "Machine Learning"),
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


def req(method, path, data=None, retries=4):
    body = None if data is None else json.dumps(data).encode("utf-8")
    last_error = None
    for _ in range(retries):
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
            with urllib.request.urlopen(request, timeout=45) as response:
                text = response.read().decode("utf-8")
                return json.loads(text) if text else None
        except Exception as exc:  # noqa: BLE001
            last_error = exc
    raise RuntimeError(f"{method} {path} failed after retries: {last_error}")


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
    users = req("GET", "/api/admin/users")
    current_rdb = [u for u in users if (u.get("student_id") or "").startswith("RDB")]
    to_add = max(0, TARGET_RDB_STUDENTS - len(current_rdb))

    if to_add == 0:
        print(json.dumps({"message": "No additional RDB students needed", "current_rdb_students": len(current_rdb)}, indent=2))
        return

    print(f"Adding {to_add} additional students to reach {TARGET_RDB_STUDENTS} tagged RDB students...", flush=True)

    created_students = 0
    created_subject_rows = 0
    created_tasks = 0
    created_risk_rows = 0
    batch_tag = datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S")

    for i in range(to_add):
        idx = len(current_rdb) + i
        name_idx = idx % 20
        first = FIRST_NAMES[name_idx]
        last = LAST_NAMES[name_idx]

        student = req("POST", "/api/admin/users", {
            "email": f"{first.lower()}.{last.lower()}.{batch_tag}.rdb.{i+1}@university.edu",
            "password": "student123",
            "name": f"{first} {last}",
            "role": "student",
            "student_id": f"RDB{batch_tag[-6:]}{i+1:03d}",
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

        profile = "high" if i < max(1, to_add // 3) else "medium" if i < max(2, (to_add * 2) // 3) else "low"

        total = 0
        completed = 0
        overdue = 0
        now = datetime.now(timezone.utc)

        for subject_id, code in subject_ids:
            for task_idx in range(random.randint(2, 4)):
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

        print(f"Created student {created_students}/{to_add} (id={student_id})", flush=True)

    stats = req("GET", "/api/admin/stats")
    users_after = req("GET", "/api/admin/users")
    rdb_after = len([u for u in users_after if (u.get("student_id") or "").startswith("RDB")])

    print(json.dumps({
        "created_students": created_students,
        "created_subject_rows": created_subject_rows,
        "created_tasks": created_tasks,
        "created_risk_rows": created_risk_rows,
        "rdb_students_after": rdb_after,
        "stats_after": stats,
    }, indent=2))


if __name__ == "__main__":
    main()
