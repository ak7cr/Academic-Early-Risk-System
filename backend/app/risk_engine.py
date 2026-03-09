"""
Risk Intelligence Engine
========================
Rule-based, explainable risk classification.

Rules:
  HIGH:   overdue_tasks > 3 AND completion_rate < 60%
  MEDIUM: overdue_tasks BETWEEN 1-3 AND completion_rate BETWEEN 60-80%
  LOW:    overdue_tasks == 0 AND completion_rate > 80%

  Edge cases fall into the nearest tier based on severity weighting.
"""

from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from .models import Task, TaskStatus, RiskLevel, RiskHistory, User


def compute_risk(db: Session, student_id: int) -> dict:
    """Compute current risk for a student and persist to history."""
    tasks = db.query(Task).filter(Task.student_id == student_id).all()
    now = datetime.now(timezone.utc)

    # Auto-mark overdue tasks
    for t in tasks:
        if t.status == TaskStatus.pending and t.due_date < now:
            t.status = TaskStatus.overdue
    db.flush()

    total = len(tasks)
    completed = sum(1 for t in tasks if t.status == TaskStatus.completed)
    overdue = sum(1 for t in tasks if t.status == TaskStatus.overdue)
    pending = sum(1 for t in tasks if t.status == TaskStatus.pending)

    completion_rate = (completed / total * 100) if total > 0 else 100.0

    # Workload score: 0-10 based on pending + overdue relative weight
    if total > 0:
        workload_score = min(10.0, round(((overdue * 2 + pending) / total) * 10, 1))
    else:
        workload_score = 0.0

    # --- Rule-based classification ---
    risk_level = _classify(overdue, completion_rate)

    # Build explanations
    explanation = _build_explanation(overdue, completion_rate, workload_score, total, completed)
    recommendations = _build_recommendations(risk_level, overdue, completion_rate, pending)

    # Persist to history
    entry = RiskHistory(
        student_id=student_id,
        risk_level=risk_level,
        completion_rate=round(completion_rate, 1),
        overdue_tasks=overdue,
        workload_score=workload_score,
    )
    db.add(entry)
    db.commit()

    return {
        "risk_level": risk_level.value,
        "completion_rate": round(completion_rate, 1),
        "overdue_tasks": overdue,
        "total_tasks": total,
        "completed_tasks": completed,
        "workload_score": workload_score,
        "explanation": explanation,
        "recommendations": recommendations,
    }


def _classify(overdue: int, completion_rate: float) -> RiskLevel:
    """Deterministic rule-based classification."""
    if overdue > 3 and completion_rate < 60:
        return RiskLevel.high
    if overdue >= 1 and completion_rate < 60:
        return RiskLevel.high
    if overdue > 3 and completion_rate < 80:
        return RiskLevel.high
    if 1 <= overdue <= 3 and 60 <= completion_rate <= 80:
        return RiskLevel.medium
    if overdue == 0 and completion_rate > 80:
        return RiskLevel.low
    # Edge cases
    if overdue > 0 and completion_rate > 80:
        return RiskLevel.medium
    if overdue == 0 and 60 <= completion_rate <= 80:
        return RiskLevel.medium
    if overdue == 0 and completion_rate < 60:
        return RiskLevel.medium
    return RiskLevel.medium


def _build_explanation(overdue: int, completion_rate: float, workload: float, total: int, completed: int) -> list[str]:
    lines = []
    if completion_rate < 60:
        lines.append(f"Completion rate is critically low at {completion_rate:.0f}% (target: ≥80%).")
    elif completion_rate < 80:
        lines.append(f"Completion rate is {completion_rate:.0f}%, below the healthy threshold of 80%.")
    else:
        lines.append(f"Completion rate is healthy at {completion_rate:.0f}%.")

    if overdue > 3:
        lines.append(f"{overdue} tasks are overdue — requires immediate attention.")
    elif overdue > 0:
        lines.append(f"{overdue} task(s) overdue — address soon to prevent escalation.")
    else:
        lines.append("No overdue tasks — great time management.")

    if workload > 7:
        lines.append(f"Workload pressure is high ({workload}/10).")
    elif workload > 4:
        lines.append(f"Workload pressure is moderate ({workload}/10).")
    else:
        lines.append(f"Workload pressure is manageable ({workload}/10).")

    lines.append(f"Total: {total} tasks, {completed} completed.")
    return lines


def _build_recommendations(risk: RiskLevel, overdue: int, completion_rate: float, pending: int) -> list[str]:
    recs = []
    if risk == RiskLevel.high:
        recs.append("Prioritize completing overdue tasks immediately.")
        recs.append("Break large tasks into smaller subtasks to build momentum.")
        recs.append("Consider meeting with your academic advisor.")
        if overdue > 3:
            recs.append(f"Focus on the {min(overdue, 3)} most critical overdue items first.")
    elif risk == RiskLevel.medium:
        recs.append("Complete pending tasks before their due dates to avoid escalation.")
        recs.append("Review your weekly schedule and allocate study blocks.")
        if overdue > 0:
            recs.append(f"Clear {overdue} overdue task(s) this week to move to Low Risk.")
    else:
        recs.append("Maintain your current pace — you're doing well.")
        recs.append("Consider helping peers or taking on stretch goals.")

    if pending > 5:
        recs.append(f"You have {pending} pending tasks — consider time-boxing each one.")
    return recs


def compute_trends(db: Session, student_id: int, weeks: int = 5) -> dict:
    """Compute weekly trends from risk history."""
    history = (
        db.query(RiskHistory)
        .filter(RiskHistory.student_id == student_id)
        .order_by(RiskHistory.computed_at.desc())
        .limit(weeks * 2)  # get enough entries
        .all()
    )
    history.reverse()

    if not history:
        return {
            "completion_trend": [],
            "risk_trend": [],
            "backlog_trend": [],
        }

    # Group by week
    completion_trend = []
    risk_trend = []
    backlog_trend = []

    risk_map = {"low": 20, "medium": 50, "high": 85}

    for i, entry in enumerate(history[-weeks:]):
        label = f"Week {i + 1}" if i < len(history) - 1 else "Current"
        completion_trend.append({"week": label, "value": entry.completion_rate})
        risk_trend.append({"week": label, "value": risk_map.get(entry.risk_level.value, 50)})
        backlog_trend.append({
            "week": label,
            "overdue": entry.overdue_tasks,
            "pending": max(0, round((10 - entry.workload_score) * 0.5 + entry.overdue_tasks)),
        })

    return {
        "completion_trend": completion_trend,
        "risk_trend": risk_trend,
        "backlog_trend": backlog_trend,
    }


def compute_subject_risk(db: Session, student_id: int) -> list[dict]:
    """Compute per-subject risk levels."""
    from .models import Subject
    subjects = db.query(Subject).filter(Subject.student_id == student_id).all()
    now = datetime.now(timezone.utc)
    results = []

    for subj in subjects:
        tasks = db.query(Task).filter(Task.subject_id == subj.id).all()
        total = len(tasks)
        completed = sum(1 for t in tasks if t.status == TaskStatus.completed)
        overdue = sum(1 for t in tasks if t.status == TaskStatus.overdue or (t.status == TaskStatus.pending and t.due_date < now))
        rate = (completed / total * 100) if total > 0 else 100.0
        risk = _classify(overdue, rate)

        results.append({
            "id": subj.id,
            "code": subj.code,
            "name": subj.name,
            "semester": subj.semester,
            "student_id": subj.student_id,
            "created_at": subj.created_at,
            "risk_level": risk.value,
            "total_tasks": total,
            "completed_tasks": completed,
            "overdue_tasks": overdue,
        })
    return results
