import { useState, useEffect } from "react";
import { LayoutDashboard, Users, BarChart3, FileText, Settings, Loader2, AlertTriangle, ChevronRight, Clock, BookOpen, TrendingDown } from "lucide-react";
import { Sidebar } from "../components/Sidebar";
import { TopNavbar } from "../components/TopNavbar";
import { studentsApi, type StudentSummary, type User } from "../lib/api";
import { useNavigate } from "react-router";

const facultySidebar = [
  { icon: LayoutDashboard, label: "Overview", path: "/faculty/dashboard" },
  { icon: Users, label: "Students", path: "/faculty/students" },
  { icon: BarChart3, label: "Class Analytics", path: "/faculty/analytics" },
  { icon: FileText, label: "Reports", path: "/faculty/reports" },
  { icon: Settings, label: "Settings", path: "/faculty/settings" },
];

const INTERVENTIONS: { threshold: (s: StudentSummary) => boolean; action: string; color: string }[] = [
  {
    threshold: (s) => s.missed_deadlines >= 3,
    action: "Schedule urgent one-on-one meeting to address missed deadlines",
    color: "text-red-700 dark:text-red-400",
  },
  {
    threshold: (s) => s.completion_rate < 40,
    action: "Review task load and provide structured completion plan",
    color: "text-red-700 dark:text-red-400",
  },
  {
    threshold: (s) => s.workload_score >= 8,
    action: "Consider redistributing workload — student may be overwhelmed",
    color: "text-orange-700 dark:text-orange-400",
  },
  {
    threshold: (s) => s.completion_rate >= 40 && s.completion_rate < 60,
    action: "Check in on progress and offer additional academic support resources",
    color: "text-orange-700 dark:text-orange-400",
  },
];

function getInterventions(s: StudentSummary) {
  return INTERVENTIONS.filter((i) => i.threshold(s));
}

function urgencyScore(s: StudentSummary) {
  return s.missed_deadlines * 3 + (100 - s.completion_rate) / 10 + s.workload_score;
}

export function FacultyPriority() {
  const navigate = useNavigate();
  const [students, setStudents] = useState<StudentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<"high" | "medium" | "all">("high");
  const user: User | null = JSON.parse(localStorage.getItem("user") || "null");

  useEffect(() => {
    studentsApi.list()
      .then(setStudents)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered = [...students]
    .filter((s) => filter === "all" ? s.risk_level !== "low" : s.risk_level === filter)
    .sort((a, b) => urgencyScore(b) - urgencyScore(a));

  const highCount = students.filter((s) => s.risk_level === "high").length;
  const mediumCount = students.filter((s) => s.risk_level === "medium").length;

  return (
    <div className="flex h-screen bg-[#F9FAFB] dark:bg-gray-900">
      <Sidebar role="faculty" items={facultySidebar} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopNavbar
          title="Priority Students"
          subtitle="Students requiring immediate intervention"
          userName={user?.name || "Faculty"}
        />
        <div className="flex-1 overflow-y-auto p-8">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-8 h-8 animate-spin text-red-500" />
            </div>
          ) : error ? (
            <div className="bg-red-50 dark:bg-red-900/30 text-red-700 rounded-2xl p-6 text-center">{error}</div>
          ) : (
            <div className="space-y-6">
              {/* Alert Banner */}
              {highCount > 0 && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-4 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-semibold text-red-700 dark:text-red-400">
                      {highCount} student{highCount !== 1 ? "s" : ""} at high risk
                    </p>
                    <p className="text-sm text-red-600 dark:text-red-500 mt-0.5">
                      Immediate action recommended. Review each student's profile and schedule interventions.
                    </p>
                  </div>
                </div>
              )}

              {/* Summary + Filter */}
              <div className="flex items-center justify-between">
                <div className="flex gap-3">
                  <div className="bg-white dark:bg-gray-800 rounded-xl px-4 py-2 shadow-sm text-center">
                    <p className="text-xs text-gray-500 dark:text-gray-400">High Risk</p>
                    <p className="text-xl font-bold text-red-600">{highCount}</p>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-xl px-4 py-2 shadow-sm text-center">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Medium Risk</p>
                    <p className="text-xl font-bold text-yellow-600">{mediumCount}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {(["high", "medium", "all"] as const).map((f) => (
                    <button
                      key={f}
                      onClick={() => setFilter(f)}
                      className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        filter === f
                          ? f === "high"
                            ? "bg-red-600 text-white"
                            : f === "medium"
                            ? "bg-yellow-500 text-white"
                            : "bg-gray-700 text-white"
                          : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                      }`}
                    >
                      {f === "all" ? "All At-Risk" : f.charAt(0).toUpperCase() + f.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Student Cards */}
              {filtered.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 text-center shadow-sm">
                  <p className="text-gray-500 dark:text-gray-400">No {filter === "all" ? "at-risk" : filter + " risk"} students found.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filtered.map((s, idx) => {
                    const interventions = getInterventions(s);
                    return (
                      <div
                        key={s.id}
                        className={`bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border-l-4 ${
                          s.risk_level === "high" ? "border-red-500" : "border-yellow-400"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          {/* Left: Student Info */}
                          <div className="flex items-start gap-4 flex-1">
                            {/* Rank Badge */}
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0 ${
                              s.risk_level === "high" ? "bg-red-500" : "bg-yellow-400"
                            }`}>
                              #{idx + 1}
                            </div>

                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-1">
                                <h3 className="font-bold text-gray-900 dark:text-white text-lg">{s.name}</h3>
                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                  s.risk_level === "high"
                                    ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                    : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                                }`}>
                                  {s.risk_level.toUpperCase()} RISK
                                </span>
                              </div>
                              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{s.student_id} · {s.department} · Year {s.year}</p>

                              {/* Metrics Row */}
                              <div className="flex flex-wrap gap-4 mb-4">
                                <div className="flex items-center gap-1.5 text-sm">
                                  <div className={`w-2 h-2 rounded-full ${s.completion_rate < 50 ? "bg-red-500" : "bg-yellow-500"}`} />
                                  <span className="text-gray-500 dark:text-gray-400">Completion:</span>
                                  <span className={`font-semibold ${s.completion_rate < 50 ? "text-red-600" : "text-yellow-600"}`}>{s.completion_rate}%</span>
                                </div>
                                <div className="flex items-center gap-1.5 text-sm">
                                  <Clock className="w-3.5 h-3.5 text-red-500" />
                                  <span className="text-gray-500 dark:text-gray-400">Missed:</span>
                                  <span className={`font-semibold ${s.missed_deadlines > 2 ? "text-red-600" : "text-yellow-600"}`}>{s.missed_deadlines} deadlines</span>
                                </div>
                                <div className="flex items-center gap-1.5 text-sm">
                                  <BookOpen className="w-3.5 h-3.5 text-purple-500" />
                                  <span className="text-gray-500 dark:text-gray-400">Workload:</span>
                                  <span className="font-semibold text-purple-600">{s.workload_score}/10</span>
                                </div>
                                <div className="flex items-center gap-1.5 text-sm">
                                  <TrendingDown className="w-3.5 h-3.5 text-gray-400" />
                                  <span className="text-gray-500 dark:text-gray-400">Total tasks:</span>
                                  <span className="font-semibold text-gray-700 dark:text-gray-300">{s.total_tasks}</span>
                                </div>
                              </div>

                              {/* Intervention Suggestions */}
                              {interventions.length > 0 && (
                                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 rounded-xl p-3">
                                  <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 mb-2 flex items-center gap-1">
                                    <AlertTriangle className="w-3.5 h-3.5" />
                                    Recommended Interventions
                                  </p>
                                  <ul className="space-y-1">
                                    {interventions.map((iv, i) => (
                                      <li key={i} className={`text-xs ${iv.color}`}>• {iv.action}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Right: Action Button */}
                          <button
                            onClick={() => navigate(`/faculty/student/${s.id}`)}
                            className="flex items-center gap-1.5 px-4 py-2 bg-[#2563EB] text-white text-sm font-medium rounded-xl hover:bg-[#1d4ed8] transition-colors shrink-0"
                          >
                            View Profile
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
