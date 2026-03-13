import { useState, useEffect } from "react";
import { LayoutDashboard, ListTodo, BookOpen, Calculator, HeartPulse, FileText, Settings, Loader2 } from "lucide-react";
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

export function StudentSubjects() {
  const [subjects, setSubjects] = useState<SubjectRisk[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const user: User | null = JSON.parse(localStorage.getItem("user") || "null");

  useEffect(() => {
    subjectsApi.withRisk()
      .then((data) => setSubjects(data as SubjectRisk[]))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex h-screen bg-[#F9FAFB] dark:bg-gray-900">
      <Sidebar role="student" items={sidebarItems} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopNavbar title="Subjects" subtitle="View your enrolled courses" userName={user?.name || "Student"} />
        <div className="flex-1 overflow-y-auto p-8">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-8 h-8 animate-spin text-[#2563EB]" />
            </div>
          ) : error ? (
            <div className="bg-red-50 dark:bg-red-900/30 text-red-700 rounded-2xl p-6 text-center">{error}</div>
          ) : subjects.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-sm text-center">
              <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-400 dark:text-gray-500" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">No Subjects</h2>
              <p className="text-gray-600 dark:text-gray-400">You don't have any enrolled subjects.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {subjects.map((s) => {
                const rate = s.total_tasks > 0 ? Math.round((s.completed_tasks / s.total_tasks) * 100) : 100;
                return (
                  <div key={s.id} className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-4">
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
        </div>
      </div>
    </div>
  );
}
