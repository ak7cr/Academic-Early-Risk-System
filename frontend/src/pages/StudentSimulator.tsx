import { useState } from "react";
import { LayoutDashboard, ListTodo, BookOpen, Calculator, HeartPulse, FileText, Loader2, Play } from "lucide-react";
import { Sidebar } from "../components/Sidebar";
import { TopNavbar } from "../components/TopNavbar";
import { riskApi, type RiskResult, type User } from "../lib/api";

const sidebarItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/student/dashboard" },
  { icon: ListTodo, label: "Tasks", path: "/student/tasks" },
  { icon: BookOpen, label: "Subjects", path: "/student/subjects" },
  { icon: Calculator, label: "What-If Simulator", path: "/student/simulator" },
  { icon: HeartPulse, label: "Recovery Plan", path: "/student/recovery" },
  { icon: FileText, label: "Reports", path: "/student/reports" },
];

export function StudentSimulator() {
  const user: User | null = JSON.parse(localStorage.getItem("user") || "null");
  const [completeTasks, setCompleteTasks] = useState(0);
  const [addTasks, setAddTasks] = useState(0);
  const [result, setResult] = useState<{ current: RiskResult; projected: RiskResult } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const simulate = () => {
    setLoading(true);
    setError("");
    riskApi.simulate({ complete_tasks: completeTasks, add_tasks: addTasks })
      .then(setResult)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  const riskColor = (level: string) =>
    level === "high" ? "text-red-600 bg-red-50 dark:bg-red-900/30" : level === "medium" ? "text-yellow-600 bg-yellow-50 dark:bg-yellow-900/30" : "text-green-600 bg-green-50 dark:bg-green-900/30";

  return (
    <div className="flex h-screen bg-[#F9FAFB] dark:bg-gray-900">
      <Sidebar role="student" items={sidebarItems} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopNavbar title="What-If Simulator" subtitle="Simulate grade scenarios" userName={user?.name || "Student"} />
        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <Calculator className="w-6 h-6 text-[#2563EB]" />
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Scenario Parameters</h2>
              </div>

              <div className="space-y-6">
                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Overdue Tasks to Complete</label>
                    <span className="text-sm font-bold text-gray-900 dark:text-white">{completeTasks}</span>
                  </div>
                  <input type="range" min={0} max={10} value={completeTasks} onChange={(e) => setCompleteTasks(Number(e.target.value))}
                    className="w-full accent-[#2563EB]" />
                  <div className="flex justify-between text-xs text-gray-400 dark:text-gray-500 mt-1"><span>0</span><span>10</span></div>
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">New Tasks to Add</label>
                    <span className="text-sm font-bold text-gray-900 dark:text-white">{addTasks}</span>
                  </div>
                  <input type="range" min={0} max={10} value={addTasks} onChange={(e) => setAddTasks(Number(e.target.value))}
                    className="w-full accent-[#2563EB]" />
                  <div className="flex justify-between text-xs text-gray-400 dark:text-gray-500 mt-1"><span>0</span><span>10</span></div>
                </div>
              </div>

              <button onClick={simulate} disabled={loading}
                className="mt-6 w-full flex items-center justify-center gap-2 bg-[#2563EB] text-white py-3 rounded-xl font-semibold hover:bg-[#1D4ED8] transition disabled:opacity-50">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                Run Simulation
              </button>
            </div>

            {error && <div className="bg-red-50 dark:bg-red-900/30 text-red-700 rounded-2xl p-6 text-center">{error}</div>}

            {result && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Simulation Result</h3>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="border rounded-xl p-4">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Current Risk</p>
                    <div className={`inline-block px-3 py-1 rounded-full text-sm font-bold ${riskColor(result.current.risk_level)}`}>
                      {result.current.risk_level.charAt(0).toUpperCase() + result.current.risk_level.slice(1)}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Completion: {result.current.completion_rate}%</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Overdue: {result.current.overdue_tasks}</p>
                  </div>
                  <div className="border-2 border-[#2563EB] rounded-xl p-4">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Projected Risk</p>
                    <div className={`inline-block px-3 py-1 rounded-full text-sm font-bold ${riskColor(result.projected.risk_level)}`}>
                      {result.projected.risk_level.charAt(0).toUpperCase() + result.projected.risk_level.slice(1)}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Completion: {result.projected.completion_rate}%</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Overdue: {result.projected.overdue_tasks}</p>
                  </div>
                </div>

                {result.projected.explanation.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Projected Analysis</p>
                    <ul className="space-y-1">
                      {result.projected.explanation.map((e, i) => <li key={i} className="text-sm text-gray-600 dark:text-gray-400">• {e}</li>)}
                    </ul>
                  </div>
                )}

                {result.projected.recommendations.length > 0 && (
                  <div className="bg-blue-50 dark:bg-blue-900/30 rounded-xl p-4">
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">Recommendations</p>
                    <ul className="space-y-1">
                      {result.projected.recommendations.map((r, i) => <li key={i} className="text-sm text-gray-700 dark:text-gray-300">• {r}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
