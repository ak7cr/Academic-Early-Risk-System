import {
  LayoutDashboard, ListTodo, BookOpen, Calculator, HeartPulse, FileText,
  AlertCircle, CheckCircle2, Clock, TrendingUp,
} from "lucide-react";
import { Sidebar } from "../components/Sidebar";
import { TopNavbar } from "../components/TopNavbar";
import { MetricCard } from "../components/MetricCard";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

const sidebarItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/student/dashboard" },
  { icon: ListTodo, label: "Tasks", path: "/student/tasks" },
  { icon: BookOpen, label: "Subjects", path: "/student/subjects" },
  { icon: Calculator, label: "What-If Simulator", path: "/student/simulator" },
  { icon: HeartPulse, label: "Recovery Plan", path: "/student/recovery" },
  { icon: FileText, label: "Reports", path: "/student/reports" },
];

const trendData = [
  { week: "Week 1", completion: 75 },
  { week: "Week 2", completion: 72 },
  { week: "Week 3", completion: 68 },
  { week: "Week 4", completion: 65 },
  { week: "Week 5", completion: 62 },
];

const riskForecast = [
  { week: "Week 1", risk: 30 },
  { week: "Week 2", risk: 45 },
  { week: "Week 3", risk: 60 },
  { week: "Week 4", risk: 75 },
  { week: "Current", risk: 85 },
];

const backlogData = [
  { week: "Week 1", overdue: 1, pending: 3 },
  { week: "Week 2", overdue: 2, pending: 4 },
  { week: "Week 3", overdue: 2, pending: 6 },
  { week: "Week 4", overdue: 3, pending: 7 },
];

const subjects = [
  { code: "CS201", risk: "HIGH RISK" },
  { code: "CS301", risk: "MEDIUM RISK" },
  { code: "CS202", risk: "LOW RISK" },
  { code: "CS302", risk: "MEDIUM RISK" },
  { code: "CS401", risk: "LOW RISK" },
];

export function StudentDashboard() {
  return (
    <div className="flex h-screen bg-[#F9FAFB]">
      <Sidebar role="student" items={sidebarItems} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <TopNavbar title="Dashboard" subtitle="Real-time Academic Health Monitoring" userName="Student Name" />

        <div className="flex-1 overflow-y-auto p-8">
          {/* Metric Cards */}
          <div className="grid grid-cols-4 gap-6 mb-8">
            <MetricCard icon={AlertCircle} title="Current Risk Level" value="High" description="Trending Up" status="danger" />
            <MetricCard icon={CheckCircle2} title="Completion Rate" value="13%" description="1 of 8 tasks" status="danger" />
            <MetricCard icon={Clock} title="Missed Deadlines" value="3" description="Requires immediate attention" status="danger" />
            <MetricCard icon={TrendingUp} title="Workload Pressure" value="Low" description="4 pending tasks" status="success" />
          </div>

          {/* Explainable Risk Analysis */}
          <div className="bg-white rounded-2xl p-6 shadow-sm mb-8">
            <div className="flex items-start gap-3 mb-6">
              <div className="p-2 bg-red-50 rounded-lg">
                <AlertCircle className="w-5 h-5 text-[#DC2626]" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Explainable Risk Analysis</h2>
              </div>
            </div>

            <div className="space-y-5">
              <RiskBar label="Completion Rate" value="13%" percent={13} hint="Below target (80%). Complete pending tasks to improve." />
              <RiskBar label="Missed Deadlines" value="3 tasks" percent={85} hint="Above acceptable threshold. Prioritize overdue items." />
              <RiskBar label="Workload Pressure Score" value="10/10" percent={100} hint="High workload detected. Consider time management adjustments." />
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Trend Direction</span>
                  <span className="text-sm font-bold text-[#DC2626]">Worsening</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-[#DC2626] rounded-full" style={{ width: "75%" }} />
                </div>
                <p className="text-xs text-gray-500 mt-1">Performance declining. Intervention recommended.</p>
              </div>
            </div>
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-2 gap-6 mb-8">
            {/* Subject Risk Heatmap */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-6">
                <span className="text-xl">🔥</span>
                <h2 className="text-lg font-bold text-gray-900">Subject-wise Risk Heatmap</h2>
              </div>
              <div className="space-y-3">
                {subjects.map((s) => (
                  <div key={s.code} className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">{s.code}</span>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        s.risk === "HIGH RISK" ? "bg-red-100 text-red-700" :
                        s.risk === "MEDIUM RISK" ? "bg-yellow-100 text-yellow-700" :
                        "bg-green-100 text-green-700"
                      }`}
                    >
                      {s.risk}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Risk Trend Forecast */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-6">
                <span className="text-xl">📈</span>
                <h2 className="text-lg font-bold text-gray-900">Risk Trend Forecast</h2>
              </div>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={riskForecast}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="week" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="risk" stroke="#DC2626" strokeWidth={2} name="Risk Score" />
                </LineChart>
              </ResponsiveContainer>
              <div className="mt-4 bg-red-50 rounded-lg p-3">
                <p className="text-xs text-gray-700">
                  <span className="font-semibold">Forecast:</span> If current missed rate continues &rarr; risk will keep increasing.
                </p>
                <p className="text-xs text-gray-700 mt-1">
                  💡 <span className="font-medium">Complete 3-5 overdue tasks this week to move to Low Risk.</span>
                </p>
              </div>
            </div>
          </div>

          {/* Bottom Charts */}
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-6">
                <span className="text-xl">📊</span>
                <h2 className="text-lg font-bold text-gray-900">Task Completion Trend</h2>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="week" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="completion" stroke="#2563EB" strokeWidth={2} name="Completion %" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-6">
                <span className="text-xl">⚠️</span>
                <h2 className="text-lg font-bold text-gray-900">Backlog Growth</h2>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={backlogData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="week" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: "12px" }} />
                  <Bar dataKey="overdue" fill="#DC2626" name="Overdue Tasks" />
                  <Bar dataKey="pending" fill="#FB923C" name="Pending Tasks" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function RiskBar({ label, value, percent, hint }: { label: string; value: string; percent: number; hint: string }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <span className="text-sm font-bold text-[#DC2626]">{value}</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full bg-[#DC2626] rounded-full" style={{ width: `${percent}%` }} />
      </div>
      <p className="text-xs text-gray-500 mt-1">{hint}</p>
    </div>
  );
}
