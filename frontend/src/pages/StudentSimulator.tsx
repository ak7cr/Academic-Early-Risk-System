import { useState } from "react";
import { LayoutDashboard, ListTodo, BookOpen, Calculator, HeartPulse, FileText, Loader2, Play } from "lucide-react";
import { Sidebar } from "../components/Sidebar";
import { TopNavbar } from "../components/TopNavbar";
import { riskApi, type User } from "../lib/api";

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
  const [overdueTasks, setOverdueTasks] = useState(2);
  const [completionRate, setCompletionRate] = useState(70);
  const [workloadScore, setWorkloadScore] = useState(5);
  const [result, setResult] = useState<{ risk_level: string; explanation: string[]; recommendations: string[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const simulate = () => {
    setLoading(true);
    setError("");
    riskApi.simulate({ overdue_tasks: overdueTasks, completion_rate: completionRate, workload_score: workloadScore })
      .then(setResult)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  const riskColor = (level: string) =>
    level === "high" ? "text-red-600 bg-red-50" : level === "medium" ? "text-yellow-600 bg-yellow-50" : "text-green-600 bg-green-50";

  return (
    <div className="flex h-screen bg-[#F9FAFB]">
      <Sidebar role="student" items={sidebarItems} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopNavbar title="What-If Simulator" subtitle="Simulate grade scenarios" userName={user?.name || "Student"} />
        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="bg-white rounded-2xl p-8 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <Calculator className="w-6 h-6 text-[#2563EB]" />
                <h2 className="text-xl font-bold text-gray-900">Scenario Parameters</h2>
              </div>

              <div className="space-y-6">
                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700">Overdue Tasks</label>
                    <span className="text-sm font-bold text-gray-900">{overdueTasks}</span>
                  </div>
                  <input type="range" min={0} max={10} value={overdueTasks} onChange={(e) => setOverdueTasks(Number(e.target.value))}
                    className="w-full accent-[#2563EB]" />
                  <div className="flex justify-between text-xs text-gray-400 mt-1"><span>0</span><span>10</span></div>
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700">Completion Rate</label>
                    <span className="text-sm font-bold text-gray-900">{completionRate}%</span>
                  </div>
                  <input type="range" min={0} max={100} value={completionRate} onChange={(e) => setCompletionRate(Number(e.target.value))}
                    className="w-full accent-[#2563EB]" />
                  <div className="flex justify-between text-xs text-gray-400 mt-1"><span>0%</span><span>100%</span></div>
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700">Workload Score</label>
                    <span className="text-sm font-bold text-gray-900">{workloadScore}</span>
                  </div>
                  <input type="range" min={0} max={10} step={0.5} value={workloadScore} onChange={(e) => setWorkloadScore(Number(e.target.value))}
                    className="w-full accent-[#2563EB]" />
                  <div className="flex justify-between text-xs text-gray-400 mt-1"><span>0</span><span>10</span></div>
                </div>
              </div>

              <button onClick={simulate} disabled={loading}
                className="mt-6 w-full flex items-center justify-center gap-2 bg-[#2563EB] text-white py-3 rounded-xl font-semibold hover:bg-[#1D4ED8] transition disabled:opacity-50">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                Run Simulation
              </button>
            </div>

            {error && <div className="bg-red-50 text-red-700 rounded-2xl p-6 text-center">{error}</div>}

            {result && (
              <div className="bg-white rounded-2xl p-8 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Simulation Result</h3>
                <div className={`inline-block px-4 py-2 rounded-full text-sm font-bold mb-4 ${riskColor(result.risk_level)}`}>
                  {result.risk_level.charAt(0).toUpperCase() + result.risk_level.slice(1)} Risk
                </div>

                {result.explanation.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm font-semibold text-gray-700 mb-2">Analysis</p>
                    <ul className="space-y-1">
                      {result.explanation.map((e, i) => <li key={i} className="text-sm text-gray-600">• {e}</li>)}
                    </ul>
                  </div>
                )}

                {result.recommendations.length > 0 && (
                  <div className="bg-blue-50 rounded-xl p-4">
                    <p className="text-sm font-semibold text-gray-800 mb-2">Recommendations</p>
                    <ul className="space-y-1">
                      {result.recommendations.map((r, i) => <li key={i} className="text-sm text-gray-700">• {r}</li>)}
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
