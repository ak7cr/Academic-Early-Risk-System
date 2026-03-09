import {
  LayoutDashboard, Users, BarChart3, FileText, Settings,
  ArrowLeft, Mail, Hash, Calendar, Building2,
  CheckCircle2, Clock, Zap, ListTodo,
} from "lucide-react";
import { Sidebar } from "../components/Sidebar";
import { TopNavbar } from "../components/TopNavbar";
import { MetricCard } from "../components/MetricCard";
import { RiskBadge } from "../components/RiskBadge";
import { useNavigate } from "react-router";
import {
  PieChart, Pie, Cell, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

const teacherSidebar = [
  { icon: LayoutDashboard, label: "Overview", path: "/teacher/dashboard" },
  { icon: Users, label: "Students", path: "/teacher/students" },
  { icon: BarChart3, label: "Class Analytics", path: "/teacher/analytics" },
  { icon: FileText, label: "Reports", path: "/teacher/reports" },
  { icon: Settings, label: "Settings", path: "/teacher/settings" },
];

const taskDistribution = [
  { name: "Completed", value: 1, color: "#16A34A" },
  { name: "Pending", value: 5, color: "#FACC15" },
  { name: "Overdue", value: 3, color: "#DC2626" },
];

const subjectRisk = [
  { subject: "High", value: 2 },
  { subject: "Medium", value: 2 },
  { subject: "Low", value: 1 },
];

export function StudentDetail() {
  const navigate = useNavigate();

  return (
    <div className="flex h-screen bg-[#F9FAFB]">
      <Sidebar role="teacher" items={teacherSidebar} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <TopNavbar title="Student Details" subtitle="Detailed academic performance analysis" userName="Dr. Sarah Johnson" />

        <div className="flex-1 overflow-y-auto p-8">
          {/* Back */}
          <button
            onClick={() => navigate("/teacher/students")}
            className="flex items-center gap-2 text-[#2563EB] hover:text-[#1d4ed8] mb-6 font-medium text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Students
          </button>

          {/* Profile Card */}
          <div className="bg-white rounded-2xl p-8 shadow-sm mb-8">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#6D28D9] to-[#9333EA] flex items-center justify-center text-white text-2xl font-bold">
                  A
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 mb-3">Alice Johnson</h1>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Mail className="w-4 h-4" />
                      <span className="text-sm">alice.johnson@university.edu</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Hash className="w-4 h-4" />
                      <span className="text-sm">ID: 2024001</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Calendar className="w-4 h-4" />
                        <span className="text-sm">Year: 2024</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Building2 className="w-4 h-4" />
                        <span className="text-sm">Computer Science</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <RiskBadge level="high" size="lg" />
            </div>
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-4 gap-6 mb-8">
            <MetricCard icon={CheckCircle2} title="Completion Rate" value="62%" description="1 of 8 tasks" status="danger" />
            <MetricCard icon={Clock} title="Missed Deadlines" value="4" description="Overdue tasks" status="danger" />
            <MetricCard icon={Zap} title="Workload Pressure" value="8.5/10" description="Out of 10" status="warning" />
            <MetricCard icon={ListTodo} title="Pending Tasks" value="3" description="Active assignments" status="warning" />
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
        </div>
      </div>
    </div>
  );
}
