from datetime import datetime
from pydantic import BaseModel, EmailStr


# --- Auth ---
class UserCreate(BaseModel):
    email: str
    password: str
    name: str
    role: str  # "student" | "faculty"
    student_id: str | None = None
    department: str | None = None
    year: int | None = None


class UserOut(BaseModel):
    id: int
    email: str
    name: str
    role: str
    student_id: str | None = None
    department: str | None = None
    year: int | None = None

    model_config = {"from_attributes": True}


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class LoginRequest(BaseModel):
    email: str
    password: str


class UserMeUpdate(BaseModel):
    email: str | None = None
    password: str | None = None
    name: str | None = None
    role: str | None = None
    student_id: str | None = None
    department: str | None = None
    year: int | None = None


# --- Subjects ---
class SubjectCreate(BaseModel):
    code: str
    name: str
    semester: str | None = None


class SubjectOut(BaseModel):
    id: int
    code: str
    name: str
    semester: str | None = None
    student_id: int
    created_at: datetime

    model_config = {"from_attributes": True}


class SubjectWithRisk(SubjectOut):
    risk_level: str  # "high" | "medium" | "low"
    total_tasks: int
    completed_tasks: int
    overdue_tasks: int


# --- Tasks ---
class TaskCreate(BaseModel):
    title: str
    subject_id: int
    task_type: str = "assignment"
    due_date: datetime
    estimated_hours: float = 0.0


class TaskUpdate(BaseModel):
    title: str | None = None
    due_date: datetime | None = None
    estimated_hours: float | None = None
    status: str | None = None  # "pending" | "completed"


class TaskOut(BaseModel):
    id: int
    title: str
    subject_id: int
    student_id: int
    task_type: str
    due_date: datetime
    estimated_hours: float
    status: str
    completed_at: datetime | None = None
    created_at: datetime
    subject_code: str | None = None
    subject_name: str | None = None

    model_config = {"from_attributes": True}


# --- Risk ---
class RiskResult(BaseModel):
    risk_level: str
    completion_rate: float
    overdue_tasks: int
    total_tasks: int
    completed_tasks: int
    workload_score: float
    explanation: list[str]
    recommendations: list[str]


class RiskHistoryOut(BaseModel):
    id: int
    risk_level: str
    completion_rate: float
    overdue_tasks: int
    workload_score: float
    computed_at: datetime

    model_config = {"from_attributes": True}


# --- Trends ---
class TrendPoint(BaseModel):
    week: str
    value: float


class TrendData(BaseModel):
    completion_trend: list[TrendPoint]
    risk_trend: list[TrendPoint]
    backlog_trend: list[dict]


# --- Reports ---
class WeeklyReport(BaseModel):
    student_name: str
    student_id: str | None
    report_period: str
    total_tasks: int
    completed_tasks: int
    missed_deadlines: int
    completion_rate: float
    risk_level: str
    workload_score: float
    recommendations: list[str]


# --- Simulator ---
class SimulatorInput(BaseModel):
    complete_tasks: int = 0  # number of overdue tasks to mark complete
    add_tasks: int = 0       # hypothetical new tasks to add


class SimulatorResult(BaseModel):
    current: RiskResult
    projected: RiskResult


# --- Faculty ---
class StudentSummary(BaseModel):
    id: int
    name: str
    email: str
    student_id: str | None
    department: str | None
    year: int | None
    risk_level: str
    completion_rate: float
    missed_deadlines: int
    workload_score: float
    total_tasks: int
    faculty_notes: str | None = None

    model_config = {"from_attributes": True}


class NotesUpdate(BaseModel):
    notes: str | None = None
