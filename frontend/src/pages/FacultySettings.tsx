import { LayoutDashboard, Users, BarChart3, FileText, Settings } from "lucide-react";
import { Sidebar } from "../components/Sidebar";
import { TopNavbar } from "../components/TopNavbar";
import type { User } from "../lib/api";

const facultySidebar = [
  { icon: LayoutDashboard, label: "Overview", path: "/faculty/dashboard" },
  { icon: Users, label: "Students", path: "/faculty/students" },
  { icon: BarChart3, label: "Class Analytics", path: "/faculty/analytics" },
  { icon: FileText, label: "Reports", path: "/faculty/reports" },
  { icon: Settings, label: "Settings", path: "/faculty/settings" },
];

export function FacultySettings() {
  const user: User | null = JSON.parse(localStorage.getItem("user") || "null");

  return (
    <div className="flex h-screen bg-[#F9FAFB] dark:bg-gray-900">
      <Sidebar role="faculty" items={facultySidebar} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopNavbar title="Settings" subtitle="Manage your preferences" userName={user?.name || "Faculty"} />
        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-xl mx-auto bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Profile</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-500 dark:text-gray-400">Name</label>
                <p className="text-gray-900 dark:text-white font-medium">{user?.name || "—"}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500 dark:text-gray-400">Email</label>
                <p className="text-gray-900 dark:text-white font-medium">{user?.email || "—"}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500 dark:text-gray-400">Role</label>
                <p className="text-gray-900 dark:text-white font-medium capitalize">{user?.role || "—"}</p>
              </div>
              {user?.department && (
                <div>
                  <label className="text-sm text-gray-500 dark:text-gray-400">Department</label>
                  <p className="text-gray-900 dark:text-white font-medium">{user.department}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
