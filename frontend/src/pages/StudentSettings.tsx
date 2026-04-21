import { useState } from "react";
import { LayoutDashboard, ListTodo, BookOpen, Calculator, HeartPulse, FileText, Settings, LogOut } from "lucide-react";
import { Sidebar } from "../components/Sidebar";
import { TopNavbar } from "../components/TopNavbar";
import { auth, type User } from "../lib/api";
import { useNavigate } from "react-router";

const sidebarItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/student/dashboard" },
  { icon: ListTodo, label: "Tasks", path: "/student/tasks" },
  { icon: BookOpen, label: "Subjects", path: "/student/subjects" },
  { icon: Calculator, label: "What-If Simulator", path: "/student/simulator" },
  { icon: HeartPulse, label: "Recovery Plan", path: "/student/recovery" },
  { icon: FileText, label: "Reports", path: "/student/reports" },
  { icon: Settings, label: "Settings", path: "/student/settings" },
];

export function StudentSettings() {
  const navigate = useNavigate();
  const user: User | null = JSON.parse(localStorage.getItem("user") || "null");
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");

  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function saveProfile() {
    setError("");
    setSuccess("");
    if (!name.trim() || !email.trim()) {
      setError("Name and email are required.");
      return;
    }

    setSaving(true);
    try {
      const updated = await auth.updateMe({
        name: name.trim(),
        email: email.trim(),
        ...(password.trim() ? { password: password.trim() } : {}),
      });
      localStorage.setItem("user", JSON.stringify(updated));
      setPassword("");
      setSuccess("Profile updated successfully.");
    } catch (e: any) {
      setError(e?.message || "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex h-screen bg-[#F9FAFB] dark:bg-gray-900">
      <Sidebar role="student" items={sidebarItems} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopNavbar title="Settings" subtitle="Manage your profile" userName={user?.name || "Student"} />
        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-xl mx-auto bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Profile</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-500 dark:text-gray-400">Name</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Enter your name"
                />
              </div>
              <div>
                <label className="text-sm text-gray-500 dark:text-gray-400">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Enter your email"
                />
              </div>

              <div>
                <label className="text-sm text-gray-500 dark:text-gray-400">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Leave blank to keep current password"
                />
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}
              {success && <p className="text-sm text-green-600">{success}</p>}

              <button
                onClick={saveProfile}
                disabled={saving}
                className="w-full mt-2 px-4 py-2.5 bg-[#2563EB] text-white rounded-lg font-medium hover:bg-[#1d4ed8] transition-colors disabled:opacity-60"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>

              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => { localStorage.clear(); navigate("/"); }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 rounded-lg font-medium hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Log Out
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
