import { useState, useEffect } from "react";
import { LayoutDashboard, Users, BarChart3, FileText, Settings, Loader2 } from "lucide-react";
import { Sidebar } from "../components/Sidebar";
import { TopNavbar } from "../components/TopNavbar";
import { studentsApi, reportsApi, type StudentSummary, type WeeklyReport, type User } from "../lib/api";

const facultySidebar = [
  { icon: LayoutDashboard, label: "Overview", path: "/faculty/dashboard" },
  { icon: Users, label: "Students", path: "/faculty/students" },
  { icon: BarChart3, label: "Class Analytics", path: "/faculty/analytics" },
  { icon: FileText, label: "Reports", path: "/faculty/reports" },
  { icon: Settings, label: "Settings", path: "/faculty/settings" },
];

export function FacultyReports() {
  const [students, setStudents] = useState<StudentSummary[]>([]);
  const [reports, setReports] = useState<Record<number, WeeklyReport>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const user: User | null = JSON.parse(localStorage.getItem("user") || "null");

  useEffect(() => {
    studentsApi.list()
      .then(async (list) => {
        setStudents(list);
        const reportMap: Record<number, WeeklyReport> = {};
        await Promise.all(list.map(async (s) => {
          try {
            reportMap[s.id] = await reportsApi.studentWeekly(s.id);
          } catch { /* skip */ }
        }));
        setReports(reportMap);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const riskColor = (level: string) =>
    level === "high" ? "text-red-600 bg-red-50" : level === "medium" ? "text-yellow-600 bg-yellow-50" : "text-green-600 bg-green-50";

  return (
    <div className="flex h-screen bg-[#F9FAFB]">
      <Sidebar role="faculty" items={facultySidebar} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopNavbar title="Reports" subtitle="Generate and view student reports" userName={user?.name || "Faculty"} />
        <div className="flex-1 overflow-y-auto p-8">
          {loading ? (
            <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-[#2563EB]" /></div>
          ) : error ? (
            <div className="bg-red-50 text-red-700 rounded-2xl p-6 text-center">{error}</div>
          ) : (
            <div className="space-y-4">
              {students.map((s) => {
                const r = reports[s.id];
                return (
                  <div key={s.id} className="bg-white rounded-2xl p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">{s.name}</h3>
                        <p className="text-sm text-gray-500">{s.student_id} · {s.department}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${riskColor(s.risk_level)}`}>
                        {s.risk_level.charAt(0).toUpperCase() + s.risk_level.slice(1)}
                      </span>
                    </div>
                    {r ? (
                      <div>
                        <p className="text-xs text-gray-400 mb-2">Week: {r.week_start} — {r.week_end}</p>
                        <div className="grid grid-cols-4 gap-3 text-sm mb-3">
                          <div className="bg-gray-50 rounded-xl p-3"><span className="text-gray-500 text-xs">Completion</span><p className="font-bold">{r.completion_rate}%</p></div>
                          <div className="bg-gray-50 rounded-xl p-3"><span className="text-gray-500 text-xs">Completed</span><p className="font-bold text-green-600">{r.tasks_completed}</p></div>
                          <div className="bg-gray-50 rounded-xl p-3"><span className="text-gray-500 text-xs">Overdue</span><p className="font-bold text-red-600">{r.tasks_overdue}</p></div>
                          <div className="bg-gray-50 rounded-xl p-3"><span className="text-gray-500 text-xs">Pending</span><p className="font-bold text-yellow-600">{r.tasks_pending}</p></div>
                        </div>
                        {r.recommendations.length > 0 && (
                          <div className="bg-blue-50 rounded-xl p-3">
                            <p className="text-xs font-semibold text-gray-700 mb-1">Recommendations</p>
                            {r.recommendations.map((rec, i) => <p key={i} className="text-xs text-gray-600">• {rec}</p>)}
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-400">No report data available</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
