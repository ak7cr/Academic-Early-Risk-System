import { useState, useEffect } from "react";
import { LayoutDashboard, Users, BarChart3, FileText, Settings, Loader2, TrendingUp, TrendingDown, AlertTriangle } from "lucide-react";
import { Sidebar } from "../components/Sidebar";
import { TopNavbar } from "../components/TopNavbar";
import { studentsApi, type StudentSummary, type User } from "../lib/api";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

const facultySidebar = [
  { icon: LayoutDashboard, label: "Overview", path: "/faculty/dashboard" },
  { icon: Users, label: "Students", path: "/faculty/students" },
  { icon: BarChart3, label: "Class Analytics", path: "/faculty/analytics" },
  { icon: FileText, label: "Reports", path: "/faculty/reports" },
  { icon: Settings, label: "Settings", path: "/faculty/settings" },
];

const RISK_COLORS: Record<string, string> = { high: "#EF4444", medium: "#F59E0B", low: "#22C55E" };

export function FacultyAnalytics() {
  const [students, setStudents] = useState<StudentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const user: User | null = JSON.parse(localStorage.getItem("user") || "null");

  useEffect(() => {
    studentsApi.list()
      .then(setStudents)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const riskDistribution = ["high", "medium", "low"].map((level) => ({
    name: level.charAt(0).toUpperCase() + level.slice(1),
    value: students.filter((s) => s.risk_level === level).length,
  })).filter((d) => d.value > 0);

  const completionData = students.map((s) => ({
    name: s.name.split(" ")[0],
    completion: s.completion_rate,
    missed: s.missed_deadlines,
  }));

  const avgCompletion = students.length ? Math.round(students.reduce((a, s) => a + s.completion_rate, 0) / students.length) : 0;
  const avgWorkload = students.length ? (students.reduce((a, s) => a + s.workload_score, 0) / students.length).toFixed(1) : "0";

    const highRiskCount = students.filter((s) => s.risk_level === "high").length;
    const totalMissed = students.reduce((a, s) => a + s.missed_deadlines, 0);
    const workloadData = students.map((s) => ({
      name: s.name.split(" ")[0],
      workload: s.workload_score,
      missed: s.missed_deadlines,
    })).sort((a, b) => b.workload - a.workload);

  return (
    <div className="flex h-screen bg-[#F9FAFB] dark:bg-gray-900">
      <Sidebar role="faculty" items={facultySidebar} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopNavbar title="Class Analytics" subtitle="Detailed analytics for your class" userName={user?.name || "Faculty"} />
        <div className="flex-1 overflow-y-auto p-8">
          {loading ? (
            <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-[#2563EB]" /></div>
          ) : error ? (
            <div className="bg-red-50 dark:bg-red-900/30 text-red-700 rounded-2xl p-6 text-center">{error}</div>
          ) : (
            <div className="space-y-6">
                {/* Summary Cards */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Total Students</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{students.length}</p>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Avg Completion</p>
                    <p className="text-2xl font-bold text-[#2563EB]">{avgCompletion}%</p>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Avg Workload</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{avgWorkload}</p>
                  </div>
                </div>

                {/* Risk & Alert Cards */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-red-50 dark:bg-red-900/20 rounded-2xl p-6 shadow-sm border border-red-100 dark:border-red-800">
                    <div className="flex items-center gap-2 mb-1">
                      <AlertTriangle className="w-4 h-4 text-red-500" />
                      <p className="text-xs text-red-600 dark:text-red-400">High Risk Students</p>
                    </div>
                    <p className="text-2xl font-bold text-red-600 dark:text-red-400">{highRiskCount}</p>
                    <p className="text-xs text-red-400 dark:text-red-500 mt-1">
                      {students.length ? Math.round((highRiskCount / students.length) * 100) : 0}% of class
                    </p>
                  </div>
                  <div className="bg-orange-50 dark:bg-orange-900/20 rounded-2xl p-6 shadow-sm border border-orange-100 dark:border-orange-800">
                    <div className="flex items-center gap-2 mb-1">
                      <TrendingDown className="w-4 h-4 text-orange-500" />
                      <p className="text-xs text-orange-600 dark:text-orange-400">Total Missed Deadlines</p>
                    </div>
                    <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{totalMissed}</p>
                    <p className="text-xs text-orange-400 dark:text-orange-500 mt-1">across all students</p>
                  </div>
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-2xl p-6 shadow-sm border border-green-100 dark:border-green-800">
                    <div className="flex items-center gap-2 mb-1">
                      <TrendingUp className="w-4 h-4 text-green-500" />
                      <p className="text-xs text-green-600 dark:text-green-400">Low Risk Students</p>
                    </div>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">{students.filter((s) => s.risk_level === "low").length}</p>
                    <p className="text-xs text-green-400 dark:text-green-500 mt-1">on track</p>
                  </div>
                </div>

                {/* Charts Row */}
                <div className="grid grid-cols-2 gap-6">
                  {/* Risk Pie */}
                  <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Risk Distribution</h3>
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie data={riskDistribution} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, value }) => `${name}: ${value}`}>
                          {riskDistribution.map((d) => (
                            <Cell key={d.name} fill={RISK_COLORS[d.name.toLowerCase()] || "#94A3B8"} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Completion Bar */}
                  <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Completion Rate by Student</h3>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={completionData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="completion" name="Completion %" fill="#2563EB" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="missed" name="Missed Deadlines" fill="#EF4444" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Workload Chart */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Workload vs Missed Deadlines</h3>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={workloadData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="workload" name="Workload Score" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="missed" name="Missed Deadlines" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Per-Student Table */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Student Performance Breakdown</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-xs text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-700">
                          <th className="pb-3 font-semibold">Student</th>
                          <th className="pb-3 font-semibold">Risk</th>
                          <th className="pb-3 font-semibold">Completion</th>
                          <th className="pb-3 font-semibold">Missed</th>
                          <th className="pb-3 font-semibold">Workload</th>
                          <th className="pb-3 font-semibold">Total Tasks</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                        {[...students].sort((a, b) => {
                          const order = { high: 0, medium: 1, low: 2 };
                          return (order[a.risk_level as keyof typeof order] ?? 3) - (order[b.risk_level as keyof typeof order] ?? 3);
                        }).map((s) => (
                          <tr key={s.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                            <td className="py-3 font-medium text-gray-900 dark:text-white">{s.name}</td>
                            <td className="py-3">
                              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                                s.risk_level === "high" ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" :
                                s.risk_level === "medium" ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" :
                                "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                              }`}>{s.risk_level.charAt(0).toUpperCase() + s.risk_level.slice(1)}</span>
                            </td>
                            <td className="py-3">
                              <div className="flex items-center gap-2">
                                <div className="w-16 h-1.5 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                                  <div className={`h-full rounded-full ${s.completion_rate < 50 ? "bg-red-500" : s.completion_rate < 75 ? "bg-yellow-500" : "bg-green-500"}`} style={{ width: `${s.completion_rate}%` }} />
                                </div>
                                <span className="text-gray-700 dark:text-gray-300">{s.completion_rate}%</span>
                              </div>
                            </td>
                            <td className={`py-3 font-semibold ${s.missed_deadlines > 2 ? "text-red-600" : s.missed_deadlines > 0 ? "text-yellow-600" : "text-green-600"}`}>{s.missed_deadlines}</td>
                            <td className="py-3 text-gray-700 dark:text-gray-300">{s.workload_score}/10</td>
                            <td className="py-3 text-gray-700 dark:text-gray-300">{s.total_tasks}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
          )}
        </div>
      </div>
    </div>
  );
}
