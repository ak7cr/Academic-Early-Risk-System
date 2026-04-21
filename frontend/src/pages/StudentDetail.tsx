import { useState, useEffect } from "react";
import {
  LayoutDashboard, Users, BarChart3, FileText, Settings,
  ArrowLeft, Mail, Hash, Calendar, Building2,
  CheckCircle2, Clock, Zap, ListTodo, Loader2, AlertTriangle,
} from "lucide-react";
import { Sidebar } from "../components/Sidebar";
import { TopNavbar } from "../components/TopNavbar";
import { MetricCard } from "../components/MetricCard";
import { RiskBadge } from "../components/RiskBadge";
import { useNavigate, useParams } from "react-router";
import {
  PieChart, Pie, Cell, BarChart, Bar,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { studentsApi, type StudentSummary, type RiskResult, type User } from "../lib/api";
import { StickyNote } from "lucide-react";

const facultySidebar = [
  { icon: LayoutDashboard, label: "Overview", path: "/faculty/dashboard" },
  { icon: Users, label: "Students", path: "/faculty/students" },
  { icon: AlertTriangle, label: "Priority Students", path: "/faculty/priority" },
  { icon: BarChart3, label: "Class Analytics", path: "/faculty/analytics" },
  { icon: FileText, label: "Reports", path: "/faculty/reports" },
  { icon: Settings, label: "Settings", path: "/faculty/settings" },
];

interface SubjectRiskData {
  id: number;
  code: string;
  name: string;
  risk_level: string;
  total_tasks: number;
  completed_tasks: number;
  overdue_tasks: number;
}

interface TrendRow {
  label: string;
  completion: number;
  overdue: number;
  workload: number;
}

export function StudentDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [student, setStudent] = useState<StudentSummary | null>(null);
  const [risk, setRisk] = useState<RiskResult | null>(null);
  const [subjects, setSubjects] = useState<SubjectRiskData[]>([]);
  const [trends, setTrends] = useState<TrendRow[]>([]);
  const [notes, setNotes] = useState("");
  const [notesSaving, setNotesSaving] = useState(false);
  const [notesSaved, setNotesSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const currentUser: User | null = JSON.parse(localStorage.getItem("user") || "null");

  useEffect(() => {
    if (!id) return;
    const sid = Number(id);
    Promise.all([
      studentsApi.detail(sid),
      studentsApi.risk(sid),
      studentsApi.subjects(sid),
      studentsApi.trends(sid),
    ])
      .then(([s, r, subj, t]) => {
        setStudent(s);
        setNotes(s.faculty_notes || "");
        setRisk(r);
        setSubjects(subj as SubjectRiskData[]);
        const rows: TrendRow[] = (t.labels || []).map((label, i) => ({
          label,
          completion: t.completion[i] ?? 0,
          overdue: t.overdue[i] ?? 0,
          workload: t.workload[i] ?? 0,
        }));
        setTrends(rows);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  const completed = risk ? risk.completed_tasks : 0;
  const overdue = risk ? risk.overdue_tasks : 0;
  const pending = risk ? risk.total_tasks - completed - overdue : 0;

  const taskDistribution = [
    { name: "Completed", value: completed, color: "#16A34A" },
    { name: "Pending", value: pending, color: "#FACC15" },
    { name: "Overdue", value: overdue, color: "#DC2626" },
  ];

  const riskCounts = subjects.reduce(
    (acc, s) => {
      if (s.risk_level === "high") acc.high++;
      else if (s.risk_level === "medium") acc.medium++;
      else acc.low++;
      return acc;
    },
    { high: 0, medium: 0, low: 0 },
  );
  const subjectRisk = [
    { subject: "High", value: riskCounts.high },
    { subject: "Medium", value: riskCounts.medium },
    { subject: "Low", value: riskCounts.low },
  ];

  return (
    <div className="flex h-screen bg-[#F9FAFB] dark:bg-gray-900">
      <Sidebar role="faculty" items={facultySidebar} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <TopNavbar title="Student Details" subtitle="Detailed academic performance analysis" userName={currentUser?.name || "Faculty"} />

        <div className="flex-1 overflow-y-auto p-8">
          <button
            onClick={() => navigate("/faculty/students")}
            className="flex items-center gap-2 text-[#2563EB] hover:text-[#1d4ed8] mb-6 font-medium text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Students
          </button>

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-8 h-8 animate-spin text-[#6D28D9]" />
            </div>
          ) : error ? (
            <div className="bg-red-50 dark:bg-red-900/30 text-red-700 rounded-2xl p-6 text-center">{error}</div>
          ) : student && risk ? (
          <>
          {/* Profile Card */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-sm mb-8">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 rounded-full bg-linear-to-br from-[#6D28D9] to-[#9333EA] flex items-center justify-center text-white text-2xl font-bold">
                  {student.name.charAt(0)}
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">{student.name}</h1>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                      <Mail className="w-4 h-4" />
                      <span className="text-sm">{student.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                      <Hash className="w-4 h-4" />
                      <span className="text-sm">ID: {student.student_id}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <Calendar className="w-4 h-4" />
                        <span className="text-sm">Year: {student.year}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <Building2 className="w-4 h-4" />
                        <span className="text-sm">{student.department}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <RiskBadge level={student.risk_level as "high" | "medium" | "low"} size="lg" />
            </div>
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-4 gap-6 mb-8">
            <MetricCard icon={CheckCircle2} title="Completion Rate" value={`${risk.completion_rate}%`} description={`${risk.completed_tasks} of ${risk.total_tasks} tasks`} status={risk.completion_rate < 60 ? "danger" : risk.completion_rate < 80 ? "warning" : "success"} />
            <MetricCard icon={Clock} title="Missed Deadlines" value={String(risk.overdue_tasks)} description="Overdue tasks" status={risk.overdue_tasks > 2 ? "danger" : risk.overdue_tasks > 0 ? "warning" : "success"} />
            <MetricCard icon={Zap} title="Workload Pressure" value={`${risk.workload_score}/10`} description="Out of 10" status={risk.workload_score > 7 ? "danger" : risk.workload_score > 4 ? "warning" : "success"} />
            <MetricCard icon={ListTodo} title="Pending Tasks" value={String(pending)} description="Active assignments" status={pending > 4 ? "warning" : "success"} />
          </div>

          {/* Charts Row 1 */}
          <div className="grid grid-cols-2 gap-6 mb-6">
            {/* Task Distribution Pie */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Task Distribution</h2>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={taskDistribution} cx="50%" cy="50%" innerRadius={70} outerRadius={110} paddingAngle={3} dataKey="value">
                    {taskDistribution.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-6 mt-2">
                {taskDistribution.map((item) => (
                  <div key={item.name} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{item.name} ({item.value})</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Subject Risk Levels */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Subject Risk Levels</h2>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={subjectRisk}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="subject" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="value" name="Subjects">
                    {subjectRisk.map((entry, i) => (
                      <Cell key={i} fill={entry.subject === "High" ? "#DC2626" : entry.subject === "Medium" ? "#FACC15" : "#16A34A"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-4 mt-2">
                {[{ label: "High", color: "#DC2626" }, { label: "Medium", color: "#FACC15" }, { label: "Low", color: "#16A34A" }].map((l) => (
                  <div key={l.label} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: l.color }} />
                    <span className="text-xs text-gray-700 dark:text-gray-300">{l.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Historical Trends */}
          {trends.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm mb-6">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Historical Trends</h2>
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={trends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                  <YAxis yAxisId="left" tick={{ fontSize: 12 }} domain={[0, 100]} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} domain={[0, 10]} />
                  <Tooltip />
                  <Legend />
                  <Line yAxisId="left" type="monotone" dataKey="completion" name="Completion %" stroke="#2563EB" strokeWidth={2} dot={{ r: 4 }} />
                  <Line yAxisId="right" type="monotone" dataKey="workload" name="Workload /10" stroke="#8B5CF6" strokeWidth={2} dot={{ r: 4 }} strokeDasharray="4 2" />
                  <Line yAxisId="right" type="monotone" dataKey="overdue" name="Overdue Tasks" stroke="#EF4444" strokeWidth={2} dot={{ r: 4 }} strokeDasharray="2 2" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Faculty Notes */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm mb-6">
            <div className="flex items-center gap-2 mb-4">
              <StickyNote className="w-5 h-5 text-gray-400" />
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Faculty Notes</h2>
            </div>
            <textarea
              value={notes}
              onChange={(e) => { setNotes(e.target.value); setNotesSaved(false); }}
              rows={4}
              placeholder="Add private notes about this student…"
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex items-center justify-between mt-3">
              {notesSaved && <span className="text-xs text-green-600">Saved</span>}
              {!notesSaved && <span />}
              <button
                disabled={notesSaving}
                onClick={async () => {
                  setNotesSaving(true);
                  await studentsApi.updateNotes(Number(id), notes.trim() || null);
                  setNotesSaving(false);
                  setNotesSaved(true);
                }}
                className="px-4 py-1.5 bg-[#2563EB] text-white text-sm font-medium rounded-lg hover:bg-[#1d4ed8] transition-colors disabled:opacity-60"
              >
                {notesSaving ? "Saving…" : "Save Notes"}
              </button>
            </div>
          </div>

          {/* Subject Details Table */}
          {subjects.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Subject Breakdown</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-700">
                      <th className="pb-3 font-semibold">Subject</th>
                      <th className="pb-3 font-semibold">Risk</th>
                      <th className="pb-3 font-semibold">Completion</th>
                      <th className="pb-3 font-semibold">Total</th>
                      <th className="pb-3 font-semibold">Completed</th>
                      <th className="pb-3 font-semibold">Overdue</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                    {subjects.map((s) => {
                      const rate = s.total_tasks > 0 ? Math.round((s.completed_tasks / s.total_tasks) * 100) : 100;
                      return (
                        <tr key={s.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                          <td className="py-3">
                            <span className="font-medium text-gray-900 dark:text-white">{s.code}</span>
                            <span className="ml-2 text-gray-500 dark:text-gray-400">{s.name}</span>
                          </td>
                          <td className="py-3">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                              s.risk_level === "high" ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" :
                              s.risk_level === "medium" ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" :
                              "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                            }`}>{s.risk_level}</span>
                          </td>
                          <td className="py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-16 h-1.5 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                                <div className={`h-full rounded-full ${rate < 50 ? "bg-red-500" : rate < 75 ? "bg-yellow-500" : "bg-green-500"}`} style={{ width: `${rate}%` }} />
                              </div>
                              <span className="text-gray-700 dark:text-gray-300">{rate}%</span>
                            </div>
                          </td>
                          <td className="py-3 text-gray-700 dark:text-gray-300">{s.total_tasks}</td>
                          <td className="py-3 text-green-600 font-medium">{s.completed_tasks}</td>
                          <td className="py-3">
                            <span className={s.overdue_tasks > 0 ? "text-red-600 font-medium" : "text-gray-400"}>{s.overdue_tasks}</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
