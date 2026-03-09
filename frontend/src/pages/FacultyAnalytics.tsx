import { LayoutDashboard, Users, BarChart3, FileText, Settings } from "lucide-react";
import { Sidebar } from "../components/Sidebar";
import { TopNavbar } from "../components/TopNavbar";

const facultySidebar = [
  { icon: LayoutDashboard, label: "Overview", path: "/faculty/dashboard" },
  { icon: Users, label: "Students", path: "/faculty/students" },
  { icon: BarChart3, label: "Class Analytics", path: "/faculty/analytics" },
  { icon: FileText, label: "Reports", path: "/faculty/reports" },
  { icon: Settings, label: "Settings", path: "/faculty/settings" },
];

export function FacultyAnalytics() {
  return (
    <div className="flex h-screen bg-[#F9FAFB]">
      <Sidebar role="faculty" items={facultySidebar} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopNavbar title="Class Analytics" subtitle="Detailed analytics for your class" userName="Dr. Sarah Johnson" />
        <div className="flex-1 overflow-y-auto p-8">
          <div className="bg-white rounded-2xl p-8 shadow-sm text-center">
            <div className="max-w-md mx-auto">
              <BarChart3 className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Class Analytics</h2>
              <p className="text-gray-600">This feature is coming soon. You'll be able to view detailed class-wide analytics here.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
