from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import User, Task, TaskStatus
from ..schemas import RiskResult, RiskHistoryOut, TrendData, SimulatorInput, SimulatorResult
from ..auth import get_current_user
from ..risk_engine import compute_risk, compute_trends

router = APIRouter(prefix="/api/risk", tags=["risk"])


@router.get("/current", response_model=RiskResult)
def get_current_risk(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return compute_risk(db, current_user.id)


@router.get("/history", response_model=list[RiskHistoryOut])
def get_risk_history(
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    from ..models import RiskHistory
    entries = (
        db.query(RiskHistory)
        .filter(RiskHistory.student_id == current_user.id)
        .order_by(RiskHistory.computed_at.desc())
        .limit(limit)
        .all()
    )
    return entries


@router.get("/trends", response_model=TrendData)
def get_trends(
    weeks: int = 5,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return compute_trends(db, current_user.id, weeks)


@router.post("/simulate", response_model=SimulatorResult)
def simulate(
    data: SimulatorInput,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """What-If Simulator: project risk if N overdue tasks are completed or N new tasks are added."""
    # Get current risk
    current = compute_risk(db, current_user.id)

    # Simulate: clone current metrics and adjust
    tasks = db.query(Task).filter(Task.student_id == current_user.id).all()
    total = len(tasks)
    completed = sum(1 for t in tasks if t.status == TaskStatus.completed)
    overdue = sum(1 for t in tasks if t.status == TaskStatus.overdue)

    # Apply simulation
    sim_completed = min(completed + data.complete_tasks, total)
    sim_overdue = max(0, overdue - data.complete_tasks)
    sim_total = total + data.add_tasks
    sim_pending = sim_total - sim_completed - sim_overdue

    sim_rate = (sim_completed / sim_total * 100) if sim_total > 0 else 100.0
    sim_workload = min(10.0, round(((sim_overdue * 2 + sim_pending) / sim_total) * 10, 1)) if sim_total > 0 else 0.0

    from ..risk_engine import _classify, _build_explanation, _build_recommendations
    sim_risk = _classify(sim_overdue, sim_rate)
    sim_explanation = _build_explanation(sim_overdue, sim_rate, sim_workload, sim_total, sim_completed)
    sim_recommendations = _build_recommendations(sim_risk, sim_overdue, sim_rate, sim_pending)

    projected = {
        "risk_level": sim_risk.value,
        "completion_rate": round(sim_rate, 1),
        "overdue_tasks": sim_overdue,
        "total_tasks": sim_total,
        "completed_tasks": sim_completed,
        "workload_score": sim_workload,
        "explanation": sim_explanation,
        "recommendations": sim_recommendations,
    }

    return SimulatorResult(current=current, projected=projected)
