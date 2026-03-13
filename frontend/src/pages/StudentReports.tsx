import { useState, useEffect } from "react";
import { LayoutDashboard, ListTodo, BookOpen, Calculator, HeartPulse, FileText, Settings, Loader2 } from "lucide-react";
import { Sidebar } from "../components/Sidebar";
import { TopNavbar } from "../components/TopNavbar";
import { reportsApi, type WeeklyReport, type User } from "../lib/api";

const sidebarItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/student/dashboard" },
  { icon: ListTodo, label: "Tasks", path: "/student/tasks" },
  { icon: BookOpen, label: "Subjects", path: "/student/subjects" },
  { icon: Calculator, label: "What-If Simulator", path: "/student/simulator" },
  { icon: HeartPulse, label: "Recovery Plan", path: "/student/recovery" },
  { icon: FileText, label: "Reports", path: "/student/reports" },
  { icon: Settings, label: "Settings", path: "/student/settings" },
];

export function StudentReports() {
  const [report, setReport] = useState<WeeklyReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const user: User | null = JSON.parse(localStorage.getItem("user") || "null");

  useEffect(() => {
    reportsApi.weekly()
      .then(setReport)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex h-screen bg-[#F9FAFB] dark:bg-gray-900">
      <Sidebar role="student" items={sidebarItems} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopNavbar title="Reports" subtitle="View your academic progress reports" userName={user?.name || "Student"} />
        <div className="flex-1 overflow-y-auto p-8">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-8 h-8 animate-spin text-[#2563EB]" />
            </div>
          ) : error ? (
            <div className="bg-red-50 dark:bg-red-900/30 text-red-700 rounded-2xl p-6 text-center">{error}</div>
          ) : report ? (
            <div className="max-w-2xl mx-auto">
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <FileText className="w-6 h-6 text-[#2563EB]" />
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">Weekly Report</h2>
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                  {report.report_period}
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Risk Level</p>
                    <p className={`text-lg font-bold ${report.risk_level === "high" ? "text-red-600" : report.risk_level === "medium" ? "text-yellow-600" : "text-green-600"}`}>
                      {report.risk_level.charAt(0).toUpperCase() + report.risk_level.slice(1)}
                    </p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Completion Rate</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">{report.completion_rate}%</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Tasks Completed</p>
                    <p className="text-lg font-bold text-green-600">{report.completed_tasks}</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Tasks Overdue</p>
                    <p className="text-lg font-bold text-red-600">{report.missed_deadlines}</p>
                  </div>
                </div>

                {report.recommendations.length > 0 && (
                  <div className="bg-blue-50 dark:bg-blue-900/30 rounded-xl p-4">
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">Recommendations</p>
                    <ul className="space-y-1">
                      {report.recommendations.map((r, i) => (
                        <li key={i} className="text-sm text-gray-700 dark:text-gray-300">• {r}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
