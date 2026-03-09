import { useState, useEffect } from "react";
import {
  LayoutDashboard, Users, BarChart3, FileText, Settings,
  ArrowLeft, Mail, Hash, Calendar, Building2,
  CheckCircle2, Clock, Zap, ListTodo, Loader2,
} from "lucide-react";
import { Sidebar } from "../components/Sidebar";
import { TopNavbar } from "../components/TopNavbar";
import { MetricCard } from "../components/MetricCard";
import { RiskBadge } from "../components/RiskBadge";
import { useNavigate, useParams } from "react-router";
import {
  PieChart, Pie, Cell, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { studentsApi, type StudentSummary, type RiskResult, type User } from "../lib/api";

const facultySidebar = [
  { icon: LayoutDashboard, label: "Overview", path: "/faculty/dashboard" },
  { icon: Users, label: "Students", path: "/faculty/students" },
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

export function StudentDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [student, setStudent] = useState<StudentSummary | null>(null);
  const [risk, setRisk] = useState<RiskResult | null>(null);
  const [subjects, setSubjects] = useState<SubjectRiskData[]>([]);
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
    ])
      .then(([s, r, subj]) => {
        setStudent(s);
        setRisk(r);
        setSubjects(subj as SubjectRiskData[]);
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
    <div className="flex h-screen bg-[#F9FAFB]">
      <Sidebar role="faculty" items={facultySidebar} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <TopNavbar title="Student Details" subtitle="Detailed academic performance analysis" userName={currentUser?.name || "Faculty"} />

        <div className="flex-1 overflow-y-auto p-8">
          {/* Back */}
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
            <div className="bg-red-50 text-red-700 rounded-2xl p-6 text-center">{error}</div>
          ) : student && risk ? (
          <>
          {/* Profile Card */}
          <div className="bg-white rounded-2xl p-8 shadow-sm mb-8">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 rounded-full bg-linear-to-br from-[#6D28D9] to-[#9333EA] flex items-center justify-center text-white text-2xl font-bold">
                  {student.name.charAt(0)}
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 mb-3">{student.name}</h1>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Mail className="w-4 h-4" />
                      <span className="text-sm">{student.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Hash className="w-4 h-4" />
                      <span className="text-sm">ID: {student.student_id}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Calendar className="w-4 h-4" />
                        <span className="text-sm">Year: {student.year}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
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

          {/* Charts */}
          <div className="grid grid-cols-2 gap-6">
            {/* Task Distribution */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h2 className="text-lg font-bold text-gray-900 mb-6">Task Distribution</h2>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={taskDistribution} cx="50%" cy="50%" innerRadius={70} outerRadius={110} paddingAngle={3} dataKey="value">
                    {taskDistribution.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-6 mt-4">
                {taskDistribution.map((item) => (
                  <div key={item.name} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-sm text-gray-700">{item.name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Subject Risk Levels */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h2 className="text-lg font-bold text-gray-900 mb-6">Subject Risk Levels</h2>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={subjectRisk}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="subject" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="value" name="Risk Level">
                    {subjectRisk.map((entry, i) => (
                      <Cell
                        key={i}
                        fill={entry.subject === "High" ? "#DC2626" : entry.subject === "Medium" ? "#FACC15" : "#16A34A"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-4 mt-4">
                {[
                  { label: "High", color: "#DC2626" },
                  { label: "Medium", color: "#FACC15" },
                  { label: "Low", color: "#16A34A" },
                ].map((l) => (
                  <div key={l.label} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: l.color }} />
                    <span className="text-xs text-gray-700">{l.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
