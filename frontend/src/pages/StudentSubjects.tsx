import { useState, useEffect } from "react";
import { LayoutDashboard, ListTodo, BookOpen, Calculator, HeartPulse, FileText, Settings, Loader2, Plus, Trash2, X } from "lucide-react";
import { Sidebar } from "../components/Sidebar";
import { TopNavbar } from "../components/TopNavbar";
import { subjectsApi, type User } from "../lib/api";

const sidebarItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/student/dashboard" },
  { icon: ListTodo, label: "Tasks", path: "/student/tasks" },
  { icon: BookOpen, label: "Subjects", path: "/student/subjects" },
  { icon: Calculator, label: "What-If Simulator", path: "/student/simulator" },
  { icon: HeartPulse, label: "Recovery Plan", path: "/student/recovery" },
  { icon: FileText, label: "Reports", path: "/student/reports" },
  { icon: Settings, label: "Settings", path: "/student/settings" },
];

interface SubjectRisk {
  id: number;
  code: string;
  name: string;
  semester: string | null;
  risk_level: string;
  total_tasks: number;
  completed_tasks: number;
  overdue_tasks: number;
}

const inputClass = "mt-1 w-full px-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors";
const labelClass = "text-sm font-medium text-gray-700 dark:text-gray-300";

export function StudentSubjects() {
  const [subjects, setSubjects] = useState<SubjectRisk[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const user: User | null = JSON.parse(localStorage.getItem("user") || "null");

  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ code: "", name: "", semester: "" });
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  function loadSubjects() {
    return subjectsApi.withRisk()
      .then((data) => setSubjects(data as SubjectRisk[]))
      .catch((e) => setError(e.message));
  }

  useEffect(() => {
    loadSubjects().finally(() => setLoading(false));
  }, []);

  async function handleCreate() {
    setFormError("");
    if (!form.code.trim()) { setFormError("Subject code is required."); return; }
    if (!form.name.trim()) { setFormError("Subject name is required."); return; }
    setSaving(true);
    try {
      await subjectsApi.create({
        code: form.code.trim().toUpperCase(),
        name: form.name.trim(),
        semester: form.semester.trim() || undefined,
      });
      await loadSubjects();
      setShowModal(false);
      setForm({ code: "", name: "", semester: "" });
    } catch (e: any) {
      setFormError(e?.message || "Failed to create subject.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    try {
      await subjectsApi.delete(id);
      setDeletingId(null);
      await loadSubjects();
    } catch (e: any) {
      setError(e?.message || "Failed to delete subject.");
      setDeletingId(null);
    }
  }

  return (
    <div className="flex h-screen bg-[#F9FAFB] dark:bg-gray-900">
      <Sidebar role="student" items={sidebarItems} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopNavbar title="Subjects" subtitle="View and manage your enrolled courses" userName={user?.name || "Student"} />
        <div className="flex-1 overflow-y-auto p-8">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-8 h-8 animate-spin text-[#2563EB]" />
            </div>
          ) : error ? (
            <div className="bg-red-50 dark:bg-red-900/30 text-red-700 rounded-2xl p-6 text-center">{error}</div>
          ) : (
            <>
              <div className="flex justify-end mb-6">
                <button
                  onClick={() => { setShowModal(true); setFormError(""); setForm({ code: "", name: "", semester: "" }); }}
                  className="flex items-center gap-2 px-5 py-2.5 bg-[#2563EB] text-white rounded-lg font-medium hover:bg-[#1d4ed8] transition-colors shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  Add Subject
                </button>
              </div>

              {subjects.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-sm text-center">
                  <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-400 dark:text-gray-500" />
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">No Subjects</h2>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">Add your enrolled courses to start tracking tasks.</p>
                  <button
                    onClick={() => { setShowModal(true); setFormError(""); }}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#2563EB] text-white rounded-lg font-medium hover:bg-[#1d4ed8] transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Add Subject
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {subjects.map((s) => {
                    const rate = s.total_tasks > 0 ? Math.round((s.completed_tasks / s.total_tasks) * 100) : 100;
                    return (
                      <div key={s.id} className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow group relative">
                        <button
                          onClick={() => setDeletingId(s.id)}
                          className="absolute top-4 right-4 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 transition-all"
                          title="Delete subject"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <div className="flex items-start justify-between mb-4 pr-8">
                          <div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">{s.code}</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{s.name}</p>
                            {s.semester && <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{s.semester}</p>}
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            s.risk_level === "high" ? "bg-red-100 dark:bg-red-900/40 text-red-700" :
                            s.risk_level === "medium" ? "bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700" :
                            "bg-green-100 dark:bg-green-900/40 text-green-700"
                          }`}>
                            {s.risk_level.toUpperCase()}
                          </span>
                        </div>
                        <div className="space-y-3">
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-gray-600 dark:text-gray-400">Completion</span>
                              <span className="font-medium text-gray-900 dark:text-white">{rate}%</span>
                            </div>
                            <div className="w-full h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                              <div className={`h-full rounded-full ${rate < 50 ? "bg-red-500" : rate < 75 ? "bg-yellow-500" : "bg-green-500"}`} style={{ width: `${rate}%` }} />
                            </div>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600 dark:text-gray-400">Tasks: {s.completed_tasks}/{s.total_tasks}</span>
                            {s.overdue_tasks > 0 && <span className="text-red-600 font-medium">{s.overdue_tasks} overdue</span>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Add Subject Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 mx-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Add Subject</h2>
              <button onClick={() => setShowModal(false)} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className={labelClass}>Subject Code</label>
                <input
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                  className={inputClass}
                  placeholder="e.g. CS101"
                />
              </div>
              <div>
                <label className={labelClass}>Subject Name</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className={inputClass}
                  placeholder="e.g. Introduction to Computer Science"
                />
              </div>
              <div>
                <label className={labelClass}>Semester <span className="text-gray-400 font-normal">(optional)</span></label>
                <input
                  value={form.semester}
                  onChange={(e) => setForm({ ...form, semester: e.target.value })}
                  className={inputClass}
                  placeholder="e.g. Spring 2025"
                />
              </div>
              {formError && <p className="text-sm text-red-600 dark:text-red-400">{formError}</p>}
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowModal(false)} className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  Cancel
                </button>
                <button onClick={handleCreate} disabled={saving} className="flex-1 px-4 py-2.5 bg-[#2563EB] text-white rounded-lg font-medium hover:bg-[#1d4ed8] transition-colors disabled:opacity-60">
                  {saving ? "Saving..." : "Add Subject"}
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
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Delete Subject?</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">All tasks for this subject will also be deleted. This cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeletingId(null)} className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                Cancel
              </button>
              <button onClick={() => handleDelete(deletingId)} className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
