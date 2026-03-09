import {
  LayoutDashboard, Users, BarChart3, FileText, Settings,
  UserCheck, AlertTriangle, TrendingUp, Percent,
} from "lucide-react";
import { Sidebar } from "../components/Sidebar";
import { TopNavbar } from "../components/TopNavbar";
import { MetricCard } from "../components/MetricCard";
import { RiskBadge } from "../components/RiskBadge";
import { AlertBanner } from "../components/AlertBanner";
import { useNavigate } from "react-router";

const facultySidebar = [
  { icon: LayoutDashboard, label: "Overview", path: "/faculty/dashboard" },
  { icon: Users, label: "Students", path: "/faculty/students" },
  { icon: BarChart3, label: "Class Analytics", path: "/faculty/analytics" },
  { icon: FileText, label: "Reports", path: "/faculty/reports" },
  { icon: Settings, label: "Settings", path: "/faculty/settings" },
];

const students = [
  { id: 1, name: "Alice Johnson", email: "alice.johnson@university.edu", studentId: "2024001", risk: "high" as const, completion: 62, missed: 4, workload: 8.5 },
  { id: 2, name: "Bob Smith", email: "bob.smith@university.edu", studentId: "2024002", risk: "low" as const, completion: 92, missed: 0, workload: 3.2 },
  { id: 3, name: "Carol Martinez", email: "carol.martinez@university.edu", studentId: "2024003", risk: "medium" as const, completion: 75, missed: 1, workload: 5.8 },
  { id: 4, name: "David Chen", email: "david.chen@university.edu", studentId: "2024004", risk: "high" as const, completion: 45, missed: 5, workload: 9.7 },
  { id: 5, name: "Emma Wilson", email: "emma.wilson@university.edu", studentId: "2024005", risk: "medium" as const, completion: 78, missed: 1, workload: 4.5 },
];

export function StudentsOverview() {
  const navigate = useNavigate();

  return (
    <div className="flex h-screen bg-[#F9FAFB]">
      <Sidebar role="faculty" items={facultySidebar} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <TopNavbar title="Students" subtitle="Monitor all students in your class" userName="Dr. Sarah Johnson" />

        <div className="flex-1 overflow-y-auto p-8">
          {/* Summary Cards */}
          <div className="grid grid-cols-4 gap-6 mb-8">
            <MetricCard icon={UserCheck} title="Total Students" value="5" description="Active enrollments" status="neutral" />
            <MetricCard icon={AlertTriangle} title="High Risk Students" value="2" description="Requires immediate attention" status="danger" />
            <MetricCard icon={TrendingUp} title="Avg Completion Rate" value="70%" description="Class average" status="success" />
            <MetricCard icon={Percent} title="At-Risk Students" value="80%" description="High + Medium risk" status="warning" />
          </div>

          {/* Alert */}
          <div className="mb-8">
            <AlertBanner message="Intervention Required — 2 students are at high risk of academic failure. Immediate intervention recommended." type="danger" />
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Student Risk Overview</h2>
                <p className="text-sm text-gray-600 mt-0.5">Comprehensive view of all students</p>
              </div>
              <select className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700">
                <option>All Students (5)</option>
                <option>High Risk</option>
                <option>Medium Risk</option>
                <option>Low Risk</option>
              </select>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    {["Student", "Student ID", "Risk Level", "Completion Rate", "Missed Deadlines", "Workload", "Actions"].map((h) => (
                      <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {students.map((s) => (
                    <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-linear-to-br from-[#6D28D9] to-[#9333EA] flex items-center justify-center text-white font-bold">
                            {s.name.charAt(0)}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{s.name}</div>
                            <div className="text-xs text-gray-500">{s.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{s.studentId}</td>
                      <td className="px-6 py-4 whitespace-nowrap"><RiskBadge level={s.risk} size="sm" /></td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${s.completion < 50 ? "bg-red-500" : s.completion < 75 ? "bg-yellow-500" : "bg-green-500"}`}
                              style={{ width: `${s.completion}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium text-gray-700">{s.completion}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-sm font-medium ${s.missed > 2 ? "text-red-600" : s.missed > 0 ? "text-yellow-600" : "text-green-600"}`}>{s.missed}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{s.workload}/10</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => navigate(`/faculty/student/${s.id}`)}
                          className="px-4 py-2 bg-[#2563EB] text-white text-sm font-medium rounded-lg hover:bg-[#1d4ed8] transition-colors"
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
        </div>
      </div>
    </div>
  );
}
