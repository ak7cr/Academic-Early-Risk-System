import { useState, useEffect } from "react";
import {
  LayoutDashboard, Users, BarChart3, FileText, Settings,
  UserCheck, AlertTriangle, TrendingUp, Percent, Loader2,
} from "lucide-react";
import { Sidebar } from "../components/Sidebar";
import { TopNavbar } from "../components/TopNavbar";
import { MetricCard } from "../components/MetricCard";
import { RiskBadge } from "../components/RiskBadge";
import { AlertBanner } from "../components/AlertBanner";
import { useNavigate } from "react-router";
import { studentsApi, type StudentSummary, type User } from "../lib/api";

const facultySidebar = [
  { icon: LayoutDashboard, label: "Overview", path: "/faculty/dashboard" },
  { icon: Users, label: "Students", path: "/faculty/students" },
  { icon: BarChart3, label: "Class Analytics", path: "/faculty/analytics" },
  { icon: FileText, label: "Reports", path: "/faculty/reports" },
  { icon: Settings, label: "Settings", path: "/faculty/settings" },
];

export function StudentsOverview() {
  const navigate = useNavigate();
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

  const highRisk = students.filter((s) => s.risk_level === "high").length;
  const atRisk = students.filter((s) => s.risk_level !== "low").length;
  const avgCompletion = students.length > 0
    ? Math.round(students.reduce((sum, s) => sum + s.completion_rate, 0) / students.length)
    : 0;
  const atRiskPct = students.length > 0 ? Math.round((atRisk / students.length) * 100) : 0;

  return (
    <div className="flex h-screen bg-[#F9FAFB] dark:bg-gray-900">
      <Sidebar role="faculty" items={facultySidebar} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <TopNavbar title="Students" subtitle="Monitor all students in your class" userName={user?.name || "Faculty"} />

        <div className="flex-1 overflow-y-auto p-8">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-8 h-8 animate-spin text-[#6D28D9]" />
            </div>
          ) : error ? (
            <div className="bg-red-50 dark:bg-red-900/30 text-red-700 rounded-2xl p-6 text-center">{error}</div>
          ) : (
          <>
          {/* Summary Cards */}
          <div className="grid grid-cols-4 gap-6 mb-8">
            <MetricCard icon={UserCheck} title="Total Students" value={String(students.length)} description="Active enrollments" status="neutral" />
            <MetricCard icon={AlertTriangle} title="High Risk Students" value={String(highRisk)} description="Requires immediate attention" status="danger" />
            <MetricCard icon={TrendingUp} title="Avg Completion Rate" value={`${avgCompletion}%`} description="Class average" status="success" />
            <MetricCard icon={Percent} title="At-Risk Students" value={`${atRiskPct}%`} description="High + Medium risk" status="warning" />
          </div>

          {highRisk > 0 && (
          <div className="mb-8">
            <AlertBanner message={`Intervention Required — ${highRisk} student${highRisk > 1 ? "s are" : " is"} at high risk of academic failure. Immediate intervention recommended.`} type="danger" />
          </div>
          )}

          {/* Table */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Student Risk Overview</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">Comprehensive view of all students</p>
              </div>
              <select className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700">
                <option>All Students ({students.length})</option>
                <option>High Risk</option>
                <option>Medium Risk</option>
                <option>Low Risk</option>
              </select>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full table-fixed min-w-[980px]">
                <colgroup>
                  <col className="w-[300px]" />
                  <col className="w-[120px]" />
                  <col className="w-[120px]" />
                  <col className="w-[180px]" />
                  <col className="w-[140px]" />
                  <col className="w-[100px]" />
                  <col className="w-[140px]" />
                </colgroup>
                <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-700">
                  <tr>
                    {["Student", "Student ID", "Risk Level", "Completion Rate", "Missed Deadlines", "Workload", "Actions"].map((h) => (
                      <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {students.map((s) => (
                    <tr key={s.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-linear-to-br from-[#6D28D9] to-[#9333EA] flex items-center justify-center text-white font-bold">
                            {s.name.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm font-medium text-gray-900 dark:text-white truncate">{s.name}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{s.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300 truncate">{s.student_id}</td>
                      <td className="px-6 py-4 whitespace-nowrap"><RiskBadge level={s.risk_level as "high" | "medium" | "low"} size="sm" /></td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${s.completion_rate < 50 ? "bg-red-500" : s.completion_rate < 75 ? "bg-yellow-500" : "bg-green-500"}`}
                              style={{ width: `${s.completion_rate}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{s.completion_rate}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-sm font-medium ${s.missed_deadlines > 2 ? "text-red-600" : s.missed_deadlines > 0 ? "text-yellow-600" : "text-green-600"}`}>{s.missed_deadlines}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">{s.workload_score}/10</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => navigate(`/faculty/student/${s.id}`)}
                          className="px-4 py-2 bg-[#2563EB] text-white text-sm font-medium rounded-lg hover:bg-[#1d4ed8] transition-colors whitespace-nowrap"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          </>
          )}
        </div>
      </div>
    </div>
  );
}
