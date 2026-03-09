const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:8000").replace(/\/+$/, "");

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
  const token = localStorage.getItem("token");
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || "Request failed");
  }

  return res.json();
}

export const api = {
  get: <T>(path: string) => request<T>("GET", path),
  post: <T>(path: string, body?: unknown) => request<T>("POST", path, body),
  patch: <T>(path: string, body?: unknown) => request<T>("PATCH", path, body),
  delete: <T>(path: string) => request<T>("DELETE", path),
};

// --- Auth ---
export interface User {
  id: number;
  email: string;
  name: string;
  role: "student" | "faculty";
  student_id: string | null;
  department: string | null;
  year: number | null;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export const auth = {
  login: (email: string, password: string) =>
    api.post<AuthResponse>("/api/auth/login", { email, password }),
  register: (data: {
    email: string;
    password: string;
    name: string;
    role: string;
    student_id?: string;
    department?: string;
    year?: number;
  }) => api.post<AuthResponse>("/api/auth/register", data),
  me: () => api.get<User>("/api/auth/me"),
};

// --- Risk ---
export interface RiskResult {
  risk_level: string;
  completion_rate: number;
  overdue_tasks: number;
  total_tasks: number;
  completed_tasks: number;
  workload_score: number;
  explanation: string[];
  recommendations: string[];
}

export interface RiskHistoryEntry {
  id: number;
  risk_level: string;
  completion_rate: number;
  overdue_tasks: number;
  workload_score: number;
  computed_at: string;
}

export interface TrendPoint { week: string; value: number; }
export interface BacklogPoint { week: string; overdue: number; pending: number; }
export interface TrendData { completion_trend: TrendPoint[]; risk_trend: TrendPoint[]; backlog_trend: BacklogPoint[]; }
export interface SimulatorResult { current: RiskResult; projected: RiskResult; }

export const riskApi = {
  current: () => api.get<RiskResult>("/api/risk/current"),
  history: () => api.get<RiskHistoryEntry[]>("/api/risk/history"),
  trends: () => api.get<TrendData>("/api/risk/trends"),
  simulate: (data: { complete_tasks: number; add_tasks: number }) =>
    api.post<SimulatorResult>("/api/risk/simulate", data),
};

// --- Subjects ---
export interface Subject {
  id: number;
  code: string;
  name: string;
  semester: string | null;
}

export const subjectsApi = {
  list: () => api.get<Subject[]>("/api/subjects"),
  withRisk: () => api.get<(Subject & { risk_level: string; total_tasks: number; completed_tasks: number; overdue_tasks: number; student_id: number; created_at: string })[]>("/api/subjects/with-risk"),
  create: (data: { code: string; name: string; semester?: string }) =>
    api.post<Subject>("/api/subjects", data),
  delete: (id: number) => api.delete<void>(`/api/subjects/${id}`),
};

// --- Tasks ---
export interface Task {
  id: number;
  title: string;
  subject_id: number;
  student_id: number;
  task_type: string;
  due_date: string;
  estimated_hours: number;
  status: string;
  completed_at: string | null;
  subject_name: string;
}

export const tasksApi = {
  list: (status?: string) =>
    api.get<Task[]>(`/api/tasks${status ? `?status=${status}` : ""}`),
  create: (data: {
    title: string;
    subject_id: number;
    task_type?: string;
    due_date: string;
    estimated_hours?: number;
  }) => api.post<Task>("/api/tasks", data),
  update: (id: number, data: { status?: string; title?: string }) =>
    api.patch<Task>(`/api/tasks/${id}`, data),
  delete: (id: number) => api.delete<void>(`/api/tasks/${id}`),
};

// --- Students (faculty) ---
export interface StudentSummary {
  id: number;
  name: string;
  email: string;
  student_id: string;
  department: string;
  year: number;
  risk_level: string;
  completion_rate: number;
  missed_deadlines: number;
  workload_score: number;
  total_tasks: number;
}

export const studentsApi = {
  list: () => api.get<StudentSummary[]>("/api/students"),
  detail: (id: number) => api.get<StudentSummary>(`/api/students/${id}`),
  risk: (id: number) => api.get<RiskResult>(`/api/students/${id}/risk`),
  trends: (id: number) => api.get<{ labels: string[]; completion: number[]; overdue: number[]; workload: number[] }>(`/api/students/${id}/trends`),
  subjects: (id: number) => api.get<(Subject & { risk_level: string; total_tasks: number; completed_tasks: number; overdue_tasks: number; student_id: number; created_at: string })[]>(`/api/students/${id}/subjects`),
};

// --- Reports ---
export interface WeeklyReport {
  student_name: string;
  student_id: string | null;
  report_period: string;
  total_tasks: number;
  completed_tasks: number;
  missed_deadlines: number;
  completion_rate: number;
  risk_level: string;
  workload_score: number;
  recommendations: string[];
}

export const reportsApi = {
  weekly: () => api.get<WeeklyReport>("/api/reports/weekly"),
  studentWeekly: (id: number) => api.get<WeeklyReport>(`/api/reports/student/${id}/weekly`),
};
