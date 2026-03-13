import { useState, useEffect } from "react";
import { LayoutDashboard, ListTodo, BookOpen, Calculator, HeartPulse, FileText, Settings, Loader2, CheckCircle2, Clock, AlertTriangle } from "lucide-react";
import { Sidebar } from "../components/Sidebar";
import { TopNavbar } from "../components/TopNavbar";
import { tasksApi, type Task, type User } from "../lib/api";

const sidebarItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/student/dashboard" },
  { icon: ListTodo, label: "Tasks", path: "/student/tasks" },
  { icon: BookOpen, label: "Subjects", path: "/student/subjects" },
  { icon: Calculator, label: "What-If Simulator", path: "/student/simulator" },
  { icon: HeartPulse, label: "Recovery Plan", path: "/student/recovery" },
  { icon: FileText, label: "Reports", path: "/student/reports" },
  { icon: Settings, label: "Settings", path: "/student/settings" },
];

export function StudentTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const user: User | null = JSON.parse(localStorage.getItem("user") || "null");

  useEffect(() => {
    tasksApi.list()
      .then(setTasks)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const statusIcon = (status: string) => {
    if (status === "completed") return <CheckCircle2 className="w-5 h-5 text-green-600" />;
    if (status === "overdue") return <AlertTriangle className="w-5 h-5 text-red-600" />;
    return <Clock className="w-5 h-5 text-yellow-600" />;
  };

  const statusBadge = (status: string) => {
    const colors = status === "completed" ? "bg-green-100 dark:bg-green-900/40 text-green-700" : status === "overdue" ? "bg-red-100 dark:bg-red-900/40 text-red-700" : "bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700";
    return <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${colors}`}>{status.charAt(0).toUpperCase() + status.slice(1)}</span>;
  };

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
            <div className="bg-red-50 dark:bg-red-900/30 text-red-700 rounded-2xl p-6 text-center">{error}</div>
          ) : tasks.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-sm text-center">
              <ListTodo className="w-16 h-16 mx-auto mb-4 text-gray-400 dark:text-gray-500" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">No Tasks Yet</h2>
              <p className="text-gray-600 dark:text-gray-400">You don't have any tasks assigned.</p>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">All Tasks ({tasks.length})</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-700">
                    <tr>
                      {["Status", "Title", "Subject", "Type", "Due Date", "Est. Hours"].map((h) => (
                        <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {tasks.map((t) => (
                      <tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">{statusIcon(t.status)}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">{t.title}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">{t.subject_name}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{statusBadge(t.task_type)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">{new Date(t.due_date).toLocaleDateString()}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">{t.estimated_hours}h</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
