import { useState, useEffect } from "react";
import {
  LayoutDashboard, ListTodo, BookOpen, Calculator, HeartPulse, FileText,
  AlertCircle, CheckCircle2, Clock, TrendingUp, Loader2,
} from "lucide-react";
import { Sidebar } from "../components/Sidebar";
import { TopNavbar } from "../components/TopNavbar";
import { MetricCard } from "../components/MetricCard";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { riskApi, subjectsApi, type RiskResult, type TrendPoint, type BacklogPoint, type User } from "../lib/api";

const sidebarItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/student/dashboard" },
  { icon: ListTodo, label: "Tasks", path: "/student/tasks" },
  { icon: BookOpen, label: "Subjects", path: "/student/subjects" },
  { icon: Calculator, label: "What-If Simulator", path: "/student/simulator" },
  { icon: HeartPulse, label: "Recovery Plan", path: "/student/recovery" },
  { icon: FileText, label: "Reports", path: "/student/reports" },
];

interface SubjectWithRisk { code: string; name: string; risk_level: string; }

export function StudentDashboard() {
  const [risk, setRisk] = useState<RiskResult | null>(null);
  const [subjects, setSubjects] = useState<SubjectWithRisk[]>([]);
  const [completionTrend, setCompletionTrend] = useState<TrendPoint[]>([]);
  const [riskTrend, setRiskTrend] = useState<TrendPoint[]>([]);
  const [backlogTrend, setBacklogTrend] = useState<BacklogPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const user: User | null = JSON.parse(localStorage.getItem("user") || "null");

  useEffect(() => {
    Promise.all([
      riskApi.current(),
      subjectsApi.withRisk(),
      riskApi.trends(),
    ])
      .then(([r, s, t]) => {
        setRisk(r);
        setSubjects(s as SubjectWithRisk[]);
        setCompletionTrend(t.completion_trend || []);
        setRiskTrend(t.risk_trend || []);
        setBacklogTrend(t.backlog_trend || []);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const pending = risk ? risk.total_tasks - risk.completed_tasks - risk.overdue_tasks : 0;

  return (
    <div className="flex h-screen bg-[#F9FAFB] dark:bg-gray-900">
      <Sidebar role="student" items={sidebarItems} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <TopNavbar title="Dashboard" subtitle="Real-time Academic Health Monitoring" userName={user?.name || "Student"} />

        <div className="flex-1 overflow-y-auto p-8">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-8 h-8 animate-spin text-[#2563EB]" />
            </div>
          ) : error ? (
            <div className="bg-red-50 dark:bg-red-900/30 text-red-700 rounded-2xl p-6 text-center">{error}</div>
          ) : risk ? (
          <>
          {/* Metric Cards */}
          <div className="grid grid-cols-4 gap-6 mb-8">
            <MetricCard icon={AlertCircle} title="Current Risk Level" value={risk.risk_level.charAt(0).toUpperCase() + risk.risk_level.slice(1)} description={risk.risk_level === "high" ? "Trending Up" : risk.risk_level === "medium" ? "Moderate" : "Stable"} status={risk.risk_level === "high" ? "danger" : risk.risk_level === "medium" ? "warning" : "success"} />
            <MetricCard icon={CheckCircle2} title="Completion Rate" value={`${risk.completion_rate}%`} description={`${risk.completed_tasks} of ${risk.total_tasks} tasks`} status={risk.completion_rate < 60 ? "danger" : risk.completion_rate < 80 ? "warning" : "success"} />
            <MetricCard icon={Clock} title="Missed Deadlines" value={String(risk.overdue_tasks)} description={risk.overdue_tasks > 2 ? "Requires immediate attention" : "Keep it up"} status={risk.overdue_tasks > 2 ? "danger" : risk.overdue_tasks > 0 ? "warning" : "success"} />
            <MetricCard icon={TrendingUp} title="Workload Pressure" value={risk.workload_score > 7 ? "High" : risk.workload_score > 4 ? "Medium" : "Low"} description={`${pending} pending tasks`} status={risk.workload_score > 7 ? "danger" : risk.workload_score > 4 ? "warning" : "success"} />
          </div>

          {/* Explainable Risk Analysis */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm mb-8">
            <div className="flex items-start gap-3 mb-6">
              <div className={`p-2 rounded-lg ${risk.risk_level === "high" ? "bg-red-50 dark:bg-red-900/30" : risk.risk_level === "medium" ? "bg-yellow-50 dark:bg-yellow-900/30" : "bg-green-50 dark:bg-green-900/30"}`}>
                <AlertCircle className={`w-5 h-5 ${risk.risk_level === "high" ? "text-[#DC2626]" : risk.risk_level === "medium" ? "text-yellow-600" : "text-green-600"}`} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Explainable Risk Analysis</h2>
              </div>
            </div>

            <div className="space-y-4">
              {risk.explanation.map((line, i) => (
                <p key={i} className="text-sm text-gray-700 dark:text-gray-300">{line}</p>
              ))}
            </div>

            {risk.recommendations.length > 0 && (
              <div className="mt-6 bg-blue-50 dark:bg-blue-900/30 rounded-lg p-4">
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">Recommendations:</p>
                <ul className="space-y-1">
                  {risk.recommendations.map((rec, i) => (
                    <li key={i} className="text-sm text-gray-700 dark:text-gray-300">• {rec}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-2 gap-6 mb-8">
            {/* Subject Risk Heatmap */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-6">
                <span className="text-xl">🔥</span>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Subject-wise Risk Heatmap</h2>
              </div>
              <div className="space-y-3">
                {subjects.map((s) => (
                  <div key={s.code} className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{s.code} — {s.name}</span>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        s.risk_level === "high" ? "bg-red-100 dark:bg-red-900/40 text-red-700" :
                        s.risk_level === "medium" ? "bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700" :
                        "bg-green-100 dark:bg-green-900/40 text-green-700"
                      }`}
                    >
                      {s.risk_level.toUpperCase()} RISK
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Risk Trend Forecast */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-6">
                <span className="text-xl">📈</span>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Risk Trend Forecast</h2>
              </div>
              {riskTrend.length > 0 ? (
                <ResponsiveContainer width="100%" height={180}>
                  <LineChart data={riskTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="week" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="value" stroke="#DC2626" strokeWidth={2} name="Risk Score" />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">Not enough data yet.</p>
              )}
              <div className="mt-4 bg-red-50 dark:bg-red-900/30 rounded-lg p-3">
                <p className="text-xs text-gray-700 dark:text-gray-300">
                  <span className="font-semibold">Forecast:</span> {risk.risk_level === "high" ? "If current missed rate continues → risk will keep increasing." : risk.risk_level === "medium" ? "Maintain progress to move to Low Risk." : "You're on track — keep it up!"}
                </p>
              </div>
            </div>
          </div>

          {/* Bottom Charts */}
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-6">
                <span className="text-xl">📊</span>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Task Completion Trend</h2>
              </div>
              {completionTrend.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={completionTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="week" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="value" stroke="#2563EB" strokeWidth={2} name="Completion %" />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">Not enough data yet.</p>
              )}
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-6">
                <span className="text-xl">⚠️</span>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Backlog Growth</h2>
              </div>
              {backlogTrend.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={backlogTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="week" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: "12px" }} />
                    <Bar dataKey="overdue" fill="#DC2626" name="Overdue Tasks" />
                    <Bar dataKey="pending" fill="#FB923C" name="Pending Tasks" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">Not enough data yet.</p>
              )}
            </div>
          </div>
          </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
