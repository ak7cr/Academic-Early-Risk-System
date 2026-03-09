import { useState, useEffect } from "react";
import {
  LayoutDashboard, Users, BarChart3, FileText, Settings,
  AlertTriangle, Loader2,
} from "lucide-react";
import { Sidebar } from "../components/Sidebar";
import { TopNavbar } from "../components/TopNavbar";
import { RiskBadge } from "../components/RiskBadge";
import { useNavigate } from "react-router";
import { studentsApi, type StudentSummary, type User } from "../lib/api";

const facultySidebar = [
  { icon: LayoutDashboard, label: "Overview", path: "/faculty/dashboard" },
  { icon: Users, label: "Students", path: "/faculty/students" },
  { icon: BarChart3, label: "Class Analytics", path: "/faculty/analytics" },
  { icon: FileText, label: "Reports", path: "/faculty/reports" },
  { icon: Settings, label: "Settings", path: "/faculty/settings" },
];

export function FacultyDashboard() {
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

  return (
    <div className="flex h-screen bg-[#F9FAFB]">
      <Sidebar role="faculty" items={facultySidebar} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <TopNavbar title="Dashboard" subtitle="Real-time Academic Health Monitoring" userName={user?.name || "Faculty"} />

        <div className="flex-1 overflow-y-auto p-8">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-8 h-8 animate-spin text-[#6D28D9]" />
            </div>
          ) : error ? (
            <div className="bg-red-50 text-red-700 rounded-2xl p-6 text-center">{error}</div>
          ) : (
          <>
          {/* Student List */}
          <div className="space-y-4">
            {students.map((student) => (
              <div
                key={student.id}
                className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => navigate(`/faculty/student/${student.id}`)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-12 h-12 rounded-full bg-linear-to-br from-[#6D28D9] to-[#9333EA] flex items-center justify-center text-white font-bold text-lg">
                      {student.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">{student.name}</h3>
                      <p className="text-sm text-gray-500">{student.email}</p>
                    </div>
                  </div>

                  <div className="text-center px-6">
                    <p className="text-xs text-gray-500">Student ID</p>
                    <p className="text-sm font-medium text-gray-700">{student.student_id}</p>
                  </div>

                  <div className="px-6">
                    <RiskBadge level={student.risk_level as "high" | "medium" | "low"} size="md" />
                  </div>

                  <div className="px-6">
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            student.completion_rate < 50 ? "bg-red-500" :
                            student.completion_rate < 75 ? "bg-yellow-500" :
                            "bg-green-500"
                          }`}
                          style={{ width: `${student.completion_rate}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-700 min-w-12">{student.completion_rate}%</span>
                    </div>
                  </div>

                  <div className="text-center px-6">
                    <p className={`text-lg font-bold ${
                      student.missed_deadlines > 2 ? "text-red-600" :
                      student.missed_deadlines > 0 ? "text-yellow-600" :
                      "text-green-600"
                    }`}>
                      {student.missed_deadlines}
                    </p>
                  </div>

                  <div className="text-center px-6">
                    <p className="text-sm font-medium text-gray-700">{student.workload_score}/10</p>
                  </div>

                  <button
                    onClick={(e) => { e.stopPropagation(); navigate(`/faculty/student/${student.id}`); }}
                    className="px-5 py-2.5 bg-[#2563EB] text-white text-sm font-medium rounded-lg hover:bg-[#1d4ed8] transition-colors"
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Action Cards */}
          <div className="grid grid-cols-3 gap-6 mt-8">
            <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <BarChart3 className="w-6 h-6 text-[#2563EB]" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-1">Class Analytics</h3>
                  <p className="text-sm text-gray-600">View detailed performance metrics and trends</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-green-50 rounded-lg">
                  <FileText className="w-6 h-6 text-[#16A34A]" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-1">Generate Reports</h3>
                  <p className="text-sm text-gray-600">Create comprehensive reports for individual students or entire class</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-red-50 rounded-lg">
                  <AlertTriangle className="w-6 h-6 text-[#DC2626]" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-1">Priority Students</h3>
                  <p className="text-sm text-gray-600">Focus on high-risk students requiring immediate intervention</p>
                </div>
              </div>
            </div>
          </div>
          </>
          )}
        </div>
      </div>
    </div>
  );
}
