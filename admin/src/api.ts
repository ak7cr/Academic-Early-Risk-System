const API_BASE = import.meta.env.VITE_API_URL || "https://academic-early-risk-system.vercel.app";

let _password = "";

export function setAdminPassword(p: string) {
  _password = p;
}

export function getAdminPassword() {
  return _password;
}

async function request<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      "X-Admin-Password": _password,
      ...(opts.headers || {}),
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || `HTTP ${res.status}`);
  }
  return res.json();
}

export const api = {
  login: () => request<{ ok: boolean }>("/api/admin/login", { method: "POST" }),
  stats: () => request<Record<string, number>>("/api/admin/stats"),

  // Users
  users: () => request<any[]>("/api/admin/users"),
  updateUser: (id: number, data: Record<string, unknown>) =>
    request<any>(`/api/admin/users/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteUser: (id: number) =>
    request<any>(`/api/admin/users/${id}`, { method: "DELETE" }),

  // Subjects
  subjects: () => request<any[]>("/api/admin/subjects"),
  updateSubject: (id: number, data: Record<string, unknown>) =>
    request<any>(`/api/admin/subjects/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteSubject: (id: number) =>
    request<any>(`/api/admin/subjects/${id}`, { method: "DELETE" }),

  // Tasks
  tasks: () => request<any[]>("/api/admin/tasks"),
  updateTask: (id: number, data: Record<string, unknown>) =>
    request<any>(`/api/admin/tasks/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteTask: (id: number) =>
    request<any>(`/api/admin/tasks/${id}`, { method: "DELETE" }),

  // Risk History
  riskHistory: () => request<any[]>("/api/admin/risk_history"),
  deleteRisk: (id: number) =>
    request<any>(`/api/admin/risk_history/${id}`, { method: "DELETE" }),
};
