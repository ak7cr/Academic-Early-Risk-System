import { useState, useEffect } from "react";
import {
  LayoutDashboard, ListTodo, BookOpen, Calculator, HeartPulse, FileText, Settings,
  Loader2, CheckCircle2, Clock, AlertTriangle, Plus, Pencil, Trash2, X,
} from "lucide-react";
import { Sidebar } from "../components/Sidebar";
import { TopNavbar } from "../components/TopNavbar";
import { tasksApi, subjectsApi, type Task, type Subject, type User } from "../lib/api";

const sidebarItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/student/dashboard" },
  { icon: ListTodo, label: "Tasks", path: "/student/tasks" },
  { icon: BookOpen, label: "Subjects", path: "/student/subjects" },
  { icon: Calculator, label: "What-If Simulator", path: "/student/simulator" },
  { icon: HeartPulse, label: "Recovery Plan", path: "/student/recovery" },
  { icon: FileText, label: "Reports", path: "/student/reports" },
  { icon: Settings, label: "Settings", path: "/student/settings" },
];

const TASK_TYPES = ["assignment", "quiz", "exam", "project", "lab", "other"];

interface TaskFormData {
  title: string;
  subject_id: number | "";
  task_type: string;
  due_date: string;
  estimated_hours: number;
}

const emptyForm: TaskFormData = {
  title: "",
  subject_id: "",
  task_type: "assignment",
  due_date: "",
  estimated_hours: 1,
};

export function StudentTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [form, setForm] = useState<TaskFormData>(emptyForm);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  // Delete confirmation
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Filter
  const [filter, setFilter] = useState<"all" | "pending" | "completed" | "overdue">("all");

  const user: User | null = JSON.parse(localStorage.getItem("user") || "null");

  function loadTasks() {
    return tasksApi.list().then(setTasks).catch((e) => setError(e.message));
  }

  useEffect(() => {
    Promise.all([tasksApi.list(), subjectsApi.list()])
      .then(([t, s]) => { setTasks(t); setSubjects(s); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  // Filtered tasks (use effectiveStatus so past-due pending tasks show as overdue)
  const filteredTasks = filter === "all" ? tasks : tasks.filter((t) => effectiveStatus(t) === filter);

  const counts = {
    all: tasks.length,
    pending: tasks.filter((t) => effectiveStatus(t) === "pending").length,
    completed: tasks.filter((t) => effectiveStatus(t) === "completed").length,
    overdue: tasks.filter((t) => effectiveStatus(t) === "overdue").length,
  };

  // Open add modal
  function openAdd() {
    setEditingTask(null);
    setForm(emptyForm);
    setFormError("");
    setShowModal(true);
  }

  // Open edit modal
  function openEdit(task: Task) {
    setEditingTask(task);
    setForm({
      title: task.title,
      subject_id: task.subject_id,
      task_type: task.task_type,
      due_date: task.due_date.split("T")[0],
      estimated_hours: task.estimated_hours,
    });
    setFormError("");
    setShowModal(true);
  }

  // Save (create or update)
  async function handleSave() {
    setFormError("");
    if (!form.title.trim()) { setFormError("Title is required."); return; }
    if (!form.subject_id) { setFormError("Please select a subject."); return; }
    if (!form.due_date) { setFormError("Due date is required."); return; }

    setSaving(true);
    try {
      if (editingTask) {
        // Update – send all editable fields
        await tasksApi.update(editingTask.id, {
          title: form.title.trim(),
          due_date: form.due_date,
          estimated_hours: form.estimated_hours,
        });
      } else {
        // Create
        await tasksApi.create({
          title: form.title.trim(),
          subject_id: form.subject_id as number,
          task_type: form.task_type,
          due_date: form.due_date,
          estimated_hours: form.estimated_hours,
        });
      }
      await loadTasks();
      setShowModal(false);
    } catch (e: any) {
      setFormError(e?.message || "Failed to save task.");
    } finally {
      setSaving(false);
    }
  }

  // Mark as completed
  async function markComplete(task: Task) {
    try {
      await tasksApi.update(task.id, { status: "completed" });
      await loadTasks();
    } catch (e: any) {
      setError(e?.message || "Failed to update task.");
    }
  }

  // Delete
  async function handleDelete(id: number) {
    try {
      await tasksApi.delete(id);
      setDeletingId(null);
      await loadTasks();
    } catch (e: any) {
      setError(e?.message || "Failed to delete task.");
      setDeletingId(null);
    }
  }

  function effectiveStatus(t: Task): string {
    if (t.status === "pending" && new Date(t.due_date) < new Date()) return "overdue";
    return t.status;
  }

  const statusIcon = (status: string) => {
    if (status === "completed") return <CheckCircle2 className="w-5 h-5 text-green-600" />;
    if (status === "overdue") return <AlertTriangle className="w-5 h-5 text-red-600" />;
    return <Clock className="w-5 h-5 text-yellow-600" />;
  };

  const statusBadge = (status: string) => {
    const colors = status === "completed" ? "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300" : status === "overdue" ? "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300" : "bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300";
    return <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${colors}`}>{status.charAt(0).toUpperCase() + status.slice(1)}</span>;
  };

  const typeBadge = (type: string) => {
    return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">{type.charAt(0).toUpperCase() + type.slice(1)}</span>;
  };

  const inputClass = "mt-1 w-full px-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors";
  const labelClass = "text-sm font-medium text-gray-700 dark:text-gray-300";

  return (
    <div className="flex h-screen bg-[#F9FAFB] dark:bg-gray-900">
      <Sidebar role="student" items={sidebarItems} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopNavbar title="Tasks" subtitle="Manage your assignments and deadlines" userName={user?.name || "Student"} />
        <div className="flex-1 overflow-y-auto p-8">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-8 h-8 animate-spin text-[#2563EB]" />
            </div>
          ) : error ? (
            <div className="bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-2xl p-6 text-center">{error}</div>
          ) : (
            <>
              {/* Header with Add button and filter tabs */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  {(["all", "pending", "overdue", "completed"] as const).map((f) => (
                    <button
                      key={f}
                      onClick={() => setFilter(f)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        filter === f
                          ? "bg-[#2563EB] text-white shadow-sm"
                          : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700"
                      }`}
                    >
                      {f.charAt(0).toUpperCase() + f.slice(1)}
                      <span className={`ml-1.5 text-xs ${filter === f ? "text-blue-200" : "text-gray-400 dark:text-gray-500"}`}>
                        {counts[f]}
                      </span>
                    </button>
                  ))}
                </div>

                <button
                  onClick={openAdd}
                  className="flex items-center gap-2 px-5 py-2.5 bg-[#2563EB] text-white rounded-lg font-medium hover:bg-[#1d4ed8] transition-colors shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  Add Task
                </button>
              </div>

              {filteredTasks.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-sm text-center">
                  <ListTodo className="w-16 h-16 mx-auto mb-4 text-gray-400 dark:text-gray-500" />
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    {filter === "all" ? "No Tasks Yet" : `No ${filter} tasks`}
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    {filter === "all"
                      ? "Create your first task to start tracking your assignments."
                      : `You don't have any ${filter} tasks right now.`}
                  </p>
                  {filter === "all" && (
                    <button
                      onClick={openAdd}
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#2563EB] text-white rounded-lg font-medium hover:bg-[#1d4ed8] transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      Create Task
                    </button>
                  )}
                </div>
              ) : (
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-700">
                        <tr>
                          {["Status", "Title", "Subject", "Type", "Due Date", "Est. Hours", "Actions"].map((h) => (
                            <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {filteredTasks.map((t) => (
                          <tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group">
                            <td className="px-6 py-4 whitespace-nowrap">{statusIcon(effectiveStatus(t))}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900 dark:text-white">{t.title}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">{t.subject_name}</td>
                            <td className="px-6 py-4 whitespace-nowrap">{typeBadge(t.task_type)}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">{new Date(t.due_date).toLocaleDateString()}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">{t.estimated_hours}h</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                {t.status !== "completed" && (
                                  <button
                                    onClick={() => markComplete(t)}
                                    title="Mark as completed"
                                    className="p-1.5 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 text-green-600 transition-colors"
                                  >
                                    <CheckCircle2 className="w-4 h-4" />
                                  </button>
                                )}
                                <button
                                  onClick={() => openEdit(t)}
                                  title="Edit task"
                                  className="p-1.5 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-600 transition-colors"
                                >
                                  <Pencil className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => setDeletingId(t.id)}
                                  title="Delete task"
                                  className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative w-full max-w-lg bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 mx-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                {editingTask ? "Edit Task" : "Add New Task"}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Title */}
              <div>
                <label className={labelClass}>Title</label>
                <input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className={inputClass}
                  placeholder="e.g. Chapter 5 Assignment"
                />
              </div>

              {/* Subject */}
              <div>
                <label className={labelClass}>Subject</label>
                <select
                  value={form.subject_id}
                  onChange={(e) => setForm({ ...form, subject_id: e.target.value ? Number(e.target.value) : "" })}
                  className={inputClass}
                  disabled={!!editingTask}
                >
                  <option value="">Select a subject</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>{s.code} — {s.name}</option>
                  ))}
                </select>
                {editingTask && (
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Subject cannot be changed after creation.</p>
                )}
              </div>

              {/* Type + Due Date row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Task Type</label>
                  <select
                    value={form.task_type}
                    onChange={(e) => setForm({ ...form, task_type: e.target.value })}
                    className={inputClass}
                    disabled={!!editingTask}
                  >
                    {TASK_TYPES.map((t) => (
                      <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Due Date</label>
                  <input
                    type="date"
                    value={form.due_date}
                    onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                    className={inputClass}
                  />
                </div>
              </div>

              {/* Estimated Hours */}
              <div>
                <label className={labelClass}>Estimated Hours</label>
                <input
                  type="number"
                  min="0.5"
                  step="0.5"
                  value={form.estimated_hours}
                  onChange={(e) => setForm({ ...form, estimated_hours: Number(e.target.value) })}
                  className={inputClass}
                />
              </div>

              {formError && <p className="text-sm text-red-600 dark:text-red-400">{formError}</p>}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 px-4 py-2.5 bg-[#2563EB] text-white rounded-lg font-medium hover:bg-[#1d4ed8] transition-colors disabled:opacity-60"
                >
                  {saving ? "Saving..." : editingTask ? "Save Changes" : "Create Task"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setDeletingId(null)} />
          <div className="relative w-full max-w-sm bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 mx-4 text-center">
            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <Trash2 className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Delete Task?</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              This action cannot be undone. The task will be permanently removed.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeletingId(null)}
                className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deletingId)}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
