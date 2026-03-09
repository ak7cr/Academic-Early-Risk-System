import { useState, useEffect } from "react";
import { LayoutDashboard, Users, BarChart3, FileText, Settings, Loader2 } from "lucide-react";
import { Sidebar } from "../components/Sidebar";
import { TopNavbar } from "../components/TopNavbar";
import { studentsApi, type StudentSummary, type User } from "../lib/api";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

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

  return (
    <div className="flex h-screen bg-[#F9FAFB]">
      <Sidebar role="faculty" items={facultySidebar} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopNavbar title="Class Analytics" subtitle="Detailed analytics for your class" userName={user?.name || "Faculty"} />
        <div className="flex-1 overflow-y-auto p-8">
          {loading ? (
            <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-[#2563EB]" /></div>
          ) : error ? (
            <div className="bg-red-50 text-red-700 rounded-2xl p-6 text-center">{error}</div>
          ) : (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-white rounded-2xl p-6 shadow-sm">
                  <p className="text-xs text-gray-500 mb-1">Total Students</p>
                  <p className="text-2xl font-bold text-gray-900">{students.length}</p>
                </div>
                <div className="bg-white rounded-2xl p-6 shadow-sm">
                  <p className="text-xs text-gray-500 mb-1">Avg Completion</p>
                  <p className="text-2xl font-bold text-[#2563EB]">{avgCompletion}%</p>
                </div>
                <div className="bg-white rounded-2xl p-6 shadow-sm">
                  <p className="text-xs text-gray-500 mb-1">Avg Workload</p>
                  <p className="text-2xl font-bold text-gray-900">{avgWorkload}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                {/* Risk Pie */}
                <div className="bg-white rounded-2xl p-6 shadow-sm">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Risk Distribution</h3>
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
                <div className="bg-white rounded-2xl p-6 shadow-sm">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Completion by Student</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={completionData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="completion" fill="#2563EB" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="missed" fill="#EF4444" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
