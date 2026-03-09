import { LayoutDashboard, ListTodo, BookOpen, Calculator, HeartPulse, FileText } from "lucide-react";
import { Sidebar } from "../components/Sidebar";
import { TopNavbar } from "../components/TopNavbar";

const sidebarItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/student/dashboard" },
  { icon: ListTodo, label: "Tasks", path: "/student/tasks" },
  { icon: BookOpen, label: "Subjects", path: "/student/subjects" },
  { icon: Calculator, label: "What-If Simulator", path: "/student/simulator" },
  { icon: HeartPulse, label: "Recovery Plan", path: "/student/recovery" },
  { icon: FileText, label: "Reports", path: "/student/reports" },
];

export function StudentSimulator() {
  return (
    <div className="flex h-screen bg-[#F9FAFB]">
      <Sidebar role="student" items={sidebarItems} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopNavbar title="What-If Simulator" subtitle="Simulate grade scenarios" userName="Student Name" />
        <div className="flex-1 overflow-y-auto p-8">
          <div className="bg-white rounded-2xl p-8 shadow-sm text-center">
            <div className="max-w-md mx-auto">
              <Calculator className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">What-If Simulator</h2>
              <p className="text-gray-600">This feature is coming soon. You'll be able to run grade simulations and explore different scenarios here.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
