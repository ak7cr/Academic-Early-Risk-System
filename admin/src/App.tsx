import { useState, useEffect, useCallback } from "react";
import { api, setAdminPassword, getAdminPassword } from "./api";

// ── Login Gate ──────────────────────────────────────────────

function LoginGate({ onAuth }: { onAuth: () => void }) {
  const [pw, setPw] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    setAdminPassword(pw);
    try {
      await api.login();
      onAuth();
    } catch (err: any) {
      setError(err?.message || "Wrong password");
      setAdminPassword("");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <form onSubmit={handleSubmit} className="bg-gray-900 rounded-2xl p-8 w-full max-w-sm shadow-xl border border-gray-800">
        <h1 className="text-2xl font-bold text-white mb-1">AREWS Admin</h1>
        <p className="text-gray-400 text-sm mb-6">Enter admin password to continue</p>
        {error && <p className="text-red-400 text-sm mb-3 bg-red-900/30 rounded-lg px-3 py-2">{error}</p>}
        <input
          type="password"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          placeholder="Password"
          autoFocus
          className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
        />
        <button
          type="submit"
          disabled={loading || !pw}
          className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-lg transition-colors"
        >
          {loading ? "Verifying…" : "Enter"}
        </button>
      </form>
    </div>
  );
}

// ── DataTable ───────────────────────────────────────────────

type Column = {
  key: string;
  label: string;
  editable?: boolean;
  type?: "text" | "select" | "secret";
  options?: string[];
  /** For secret columns: the key used when sending edits (e.g. "password" instead of "password_hash") */
  editKey?: string;
};

function DataTable({
  title,
  columns,
  rows,
  onSave,
  onDelete,
  onRefresh,
}: {
  title: string;
  columns: Column[];
  rows: Record<string, any>[];
  onSave?: (id: number, data: Record<string, unknown>) => Promise<void>;
  onDelete?: (id: number) => Promise<void>;
  onRefresh: () => void;
}) {
  const [editId, setEditId] = useState<number | null>(null);
  const [editData, setEditData] = useState<Record<string, any>>({});
  const [busy, setBusy] = useState(false);
  const [revealedSecrets, setRevealedSecrets] = useState<Record<string, boolean>>({});

  function startEdit(row: Record<string, any>) {
    setEditId(row.id);
    const data: Record<string, any> = {};
    columns.forEach((c) => {
      if (c.editable) {
        if (c.type === "secret") {
          data[c.editKey || c.key] = "";
        } else {
          data[c.key] = row[c.key] ?? "";
        }
      }
    });
    setEditData(data);
  }

  async function save() {
    if (editId == null || !onSave) return;
    setBusy(true);
    try {
      // Filter out empty secret fields so we don't overwrite with blank
      const payload = { ...editData };
      columns.forEach((c) => {
        if (c.type === "secret") {
          const sendKey = c.editKey || c.key;
          if (!payload[sendKey]) delete payload[sendKey];
        }
      });
      await onSave(editId, payload);
      setEditId(null);
      onRefresh();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: number) {
    if (!onDelete || !confirm("Delete this row?")) return;
    setBusy(true);
    try {
      await onDelete(id);
      onRefresh();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
        <h2 className="text-lg font-bold text-white">{title} <span className="text-gray-500 font-normal text-sm">({rows.length})</span></h2>
        <button onClick={onRefresh} className="text-sm text-blue-400 hover:text-blue-300 transition-colors">Refresh</button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800">
              {columns.map((c) => (
                <th key={c.key} className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">{c.label}</th>
              ))}
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {rows.map((row) => (
              <tr key={row.id} className="hover:bg-gray-800/50 transition-colors">
                {columns.map((c) => (
                  <td key={c.key} className="px-4 py-3 text-gray-300 whitespace-nowrap">
                    {editId === row.id && c.editable ? (
                      c.type === "select" ? (
                        <select
                          value={editData[c.key] || ""}
                          onChange={(e) => setEditData({ ...editData, [c.key]: e.target.value })}
                          className="bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white text-sm"
                        >
                          {c.options?.map((o) => <option key={o} value={o}>{o}</option>)}
                        </select>
                      ) : c.type === "secret" ? (
                        <input
                          type="text"
                          value={editData[c.editKey || c.key] || ""}
                          onChange={(e) => setEditData({ ...editData, [c.editKey || c.key]: e.target.value })}
                          placeholder="leave blank to keep"
                          className="bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white text-sm w-full min-w-[80px] placeholder-gray-500"
                        />
                      ) : (
                        <input
                          value={editData[c.key] || ""}
                          onChange={(e) => setEditData({ ...editData, [c.key]: e.target.value })}
                          className="bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white text-sm w-full min-w-[80px]"
                        />
                      )
                    ) : c.type === "secret" ? (
                      <span className="inline-flex items-center gap-1">
                        <span className="font-mono text-xs">
                          {revealedSecrets[`${row.id}-${c.key}`]
                            ? String(row[c.key] ?? "—")
                            : "••••••••"}
                        </span>
                        <button
                          onClick={() => setRevealedSecrets((prev) => ({ ...prev, [`${row.id}-${c.key}`]: !prev[`${row.id}-${c.key}`] }))}
                          className="text-gray-500 hover:text-gray-300 transition-colors ml-1"
                          title={revealedSecrets[`${row.id}-${c.key}`] ? "Hide" : "Show"}
                        >
                          {revealedSecrets[`${row.id}-${c.key}`] ? "🙈" : "👁"}
                        </button>
                      </span>
                    ) : (
                      <span className={c.key === "id" ? "text-gray-500" : ""}>{formatCell(c.key, row[c.key])}</span>
                    )}
                  </td>
                ))}
                <td className="px-4 py-3 whitespace-nowrap text-right space-x-2">
                  {editId === row.id ? (
                    <>
                      <button onClick={save} disabled={busy} className="text-green-400 hover:text-green-300 text-xs font-medium">Save</button>
                      <button onClick={() => setEditId(null)} className="text-gray-400 hover:text-gray-300 text-xs font-medium">Cancel</button>
                    </>
                  ) : (
                    <>
                      {onSave && columns.some((c) => c.editable) && (
                        <button onClick={() => startEdit(row)} className="text-blue-400 hover:text-blue-300 text-xs font-medium">Edit</button>
                      )}
                      {onDelete && (
                        <button onClick={() => remove(row.id)} disabled={busy} className="text-red-400 hover:text-red-300 text-xs font-medium">Delete</button>
                      )}
                    </>
                  )}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={columns.length + 1} className="px-4 py-8 text-center text-gray-500">No data</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function formatCell(key: string, value: unknown): string {
  if (value == null) return "—";
  if (typeof value === "string" && (key.includes("_at") || key === "due_date" || key === "computed_at")) {
    try {
      return new Date(value).toLocaleString();
    } catch {
      return value;
    }
  }
  if (typeof value === "number") return String(value);
  return String(value);
}

// ── Column Definitions ──────────────────────────────────────

const userCols: Column[] = [
  { key: "id", label: "ID" },
  { key: "email", label: "Email", editable: true },
  { key: "password_hash", label: "Password", editable: true, type: "secret", editKey: "password" },
  { key: "name", label: "Name", editable: true },
  { key: "role", label: "Role", editable: true, type: "select", options: ["student", "faculty"] },
  { key: "student_id", label: "ID", editable: true },
  { key: "department", label: "Dept", editable: true },
  { key: "year", label: "Year", editable: true },
  { key: "created_at", label: "Created" },
];

const subjectCols: Column[] = [
  { key: "id", label: "ID" },
  { key: "code", label: "Code", editable: true },
  { key: "name", label: "Name", editable: true },
  { key: "student_id", label: "Student ID", editable: true },
  { key: "semester", label: "Semester", editable: true },
  { key: "created_at", label: "Created" },
];

const taskCols: Column[] = [
  { key: "id", label: "ID" },
  { key: "title", label: "Title", editable: true },
  { key: "subject_id", label: "Subject ID" },
  { key: "student_id", label: "Student ID" },
  { key: "task_type", label: "Type", editable: true, type: "select", options: ["assignment", "exam", "task"] },
  { key: "status", label: "Status", editable: true, type: "select", options: ["pending", "completed", "overdue"] },
  { key: "due_date", label: "Due Date", editable: true },
  { key: "estimated_hours", label: "Hours", editable: true },
  { key: "completed_at", label: "Completed At" },
  { key: "created_at", label: "Created" },
];

const riskCols: Column[] = [
  { key: "id", label: "ID" },
  { key: "student_id", label: "Student ID" },
  { key: "risk_level", label: "Risk Level" },
  { key: "completion_rate", label: "Completion %" },
  { key: "overdue_tasks", label: "Overdue" },
  { key: "workload_score", label: "Workload" },
  { key: "computed_at", label: "Computed At" },
];

// ── Tabs ────────────────────────────────────────────────────

type Tab = "users" | "subjects" | "tasks" | "risk_history";

// ── Main App ────────────────────────────────────────────────

export default function App() {
  const [authed, setAuthed] = useState(false);
  const [tab, setTab] = useState<Tab>("users");
  const [stats, setStats] = useState<Record<string, number>>({});
  const [data, setData] = useState<Record<Tab, any[]>>({ users: [], subjects: [], tasks: [], risk_history: [] });
  const [loading, setLoading] = useState(false);

  // Check if already authed (page refresh)
  useEffect(() => {
    if (getAdminPassword()) setAuthed(true);
  }, []);

  const loadStats = useCallback(async () => {
    try {
      setStats(await api.stats());
    } catch { /* ignore */ }
  }, []);

  const loadTab = useCallback(async (t: Tab) => {
    setLoading(true);
    try {
      const fetchers: Record<Tab, () => Promise<any[]>> = {
        users: api.users,
        subjects: api.subjects,
        tasks: api.tasks,
        risk_history: api.riskHistory,
      };
      const rows = await fetchers[t]();
      setData((prev) => ({ ...prev, [t]: rows }));
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authed) {
      loadStats();
      loadTab(tab);
    }
  }, [authed, tab, loadStats, loadTab]);

  if (!authed) return <LoginGate onAuth={() => setAuthed(true)} />;

  const tabs: { key: Tab; label: string }[] = [
    { key: "users", label: "Users" },
    { key: "subjects", label: "Subjects" },
    { key: "tasks", label: "Tasks" },
    { key: "risk_history", label: "Risk History" },
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">AREWS Admin</h1>
          <p className="text-gray-500 text-xs">Database Management Console</p>
        </div>
        <div className="flex items-center gap-6 text-sm">
          {Object.entries(stats).map(([k, v]) => (
            <div key={k} className="text-center">
              <p className="text-xl font-bold text-white">{v}</p>
              <p className="text-gray-500 text-xs capitalize">{k.replace("_", " ")}</p>
            </div>
          ))}
          <button
            onClick={() => { setAdminPassword(""); setAuthed(false); }}
            className="ml-4 text-gray-400 hover:text-red-400 text-sm transition-colors"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div className="border-b border-gray-800 px-6 flex gap-1">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
              tab === t.key
                ? "text-blue-400 border-blue-400"
                : "text-gray-400 border-transparent hover:text-gray-300"
            }`}
          >
            {t.label}
            {stats[t.key] != null && <span className="ml-1.5 text-xs text-gray-500">({stats[t.key]})</span>}
          </button>
        ))}
      </div>

      {/* Content */}
      <main className="p-6">
        {loading && (
          <div className="text-center py-8 text-gray-500">Loading…</div>
        )}

        {!loading && tab === "users" && (
          <DataTable
            title="Users"
            columns={userCols}
            rows={data.users}
            onSave={async (id, d) => { await api.updateUser(id, d); }}
            onDelete={async (id) => { await api.deleteUser(id); }}
            onRefresh={() => { loadTab("users"); loadStats(); }}
          />
        )}

        {!loading && tab === "subjects" && (
          <DataTable
            title="Subjects"
            columns={subjectCols}
            rows={data.subjects}
            onSave={async (id, d) => { await api.updateSubject(id, d); }}
            onDelete={async (id) => { await api.deleteSubject(id); }}
            onRefresh={() => { loadTab("subjects"); loadStats(); }}
          />
        )}

        {!loading && tab === "tasks" && (
          <DataTable
            title="Tasks"
            columns={taskCols}
            rows={data.tasks}
            onSave={async (id, d) => { await api.updateTask(id, d); }}
            onDelete={async (id) => { await api.deleteTask(id); }}
            onRefresh={() => { loadTab("tasks"); loadStats(); }}
          />
        )}

        {!loading && tab === "risk_history" && (
          <DataTable
            title="Risk History"
            columns={riskCols}
            rows={data.risk_history}
            onDelete={async (id) => { await api.deleteRisk(id); }}
            onRefresh={() => { loadTab("risk_history"); loadStats(); }}
          />
        )}
      </main>
    </div>
  );
}
