import { useState, useEffect } from "react";
import { LayoutDashboard, ListTodo, BookOpen, Calculator, HeartPulse, FileText, Loader2, CheckCircle2, AlertTriangle, ShieldAlert } from "lucide-react";
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

export function StudentRecovery() {
  const [risk, setRisk] = useState<RiskResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const user: User | null = JSON.parse(localStorage.getItem("user") || "null");

  useEffect(() => {
    riskApi.current()
      .then(setRisk)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const riskIcon = (level: string) =>
    level === "high" ? <ShieldAlert className="w-6 h-6 text-red-500" /> :
    level === "medium" ? <AlertTriangle className="w-6 h-6 text-yellow-500" /> :
    <CheckCircle2 className="w-6 h-6 text-green-500" />;

  const riskColor = (level: string) =>
    level === "high" ? "border-red-200 bg-red-50 dark:bg-red-900/30" : level === "medium" ? "border-yellow-200 bg-yellow-50 dark:bg-yellow-900/30" : "border-green-200 bg-green-50 dark:bg-green-900/30";

  return (
    <div className="flex h-screen bg-[#F9FAFB] dark:bg-gray-900">
      <Sidebar role="student" items={sidebarItems} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopNavbar title="Recovery Plan" subtitle="Personalized academic recovery strategies" userName={user?.name || "Student"} />
        <div className="flex-1 overflow-y-auto p-8">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-8 h-8 animate-spin text-[#2563EB]" />
            </div>
          ) : error ? (
            <div className="bg-red-50 dark:bg-red-900/30 text-red-700 rounded-2xl p-6 text-center">{error}</div>
          ) : risk ? (
            <div className="max-w-2xl mx-auto space-y-6">
              {/* Risk Status Banner */}
              <div className={`rounded-2xl p-6 border ${riskColor(risk.risk_level)}`}>
                <div className="flex items-center gap-3 mb-3">
                  {riskIcon(risk.risk_level)}
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                    Current Risk: {risk.risk_level.charAt(0).toUpperCase() + risk.risk_level.slice(1)}
                  </h2>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div><span className="text-gray-500 dark:text-gray-400">Completion</span><p className="font-bold">{risk.completion_rate}%</p></div>
                  <div><span className="text-gray-500 dark:text-gray-400">Overdue</span><p className="font-bold text-red-600">{risk.overdue_tasks}</p></div>
                  <div><span className="text-gray-500 dark:text-gray-400">Workload</span><p className="font-bold">{risk.workload_score.toFixed(1)}</p></div>
                </div>
              </div>

              {/* Explanation */}
              {risk.explanation.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">Why This Risk Level?</h3>
                  <ul className="space-y-2">
                    {risk.explanation.map((e, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                        <span className="mt-1 w-1.5 h-1.5 rounded-full bg-gray-400 shrink-0" />
                        {e}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Recovery Recommendations */}
              {risk.recommendations.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
                  <div className="flex items-center gap-3 mb-4">
                    <HeartPulse className="w-5 h-5 text-[#2563EB]" />
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Recovery Steps</h3>
                  </div>
                  <div className="space-y-3">
                    {risk.recommendations.map((r, i) => (
                      <div key={i} className="flex items-start gap-3 bg-blue-50 dark:bg-blue-900/30 rounded-xl p-4">
                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#2563EB] text-white text-xs font-bold shrink-0">
                          {i + 1}
                        </span>
                        <p className="text-sm text-gray-700 dark:text-gray-300">{r}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
