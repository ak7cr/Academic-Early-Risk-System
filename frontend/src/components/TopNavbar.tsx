import { useEffect, useMemo, useRef, useState } from "react";
import { Bell, Moon, Sun } from "lucide-react";
import { useNavigate } from "react-router";
import { useTheme } from "../lib/ThemeContext";
import { studentsApi, type StudentSummary, type User } from "../lib/api";

interface TopNavbarProps {
  title: string;
  subtitle?: string;
  userName?: string;
}

export function TopNavbar({ title, subtitle, userName = "User" }: TopNavbarProps) {
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [openNotifications, setOpenNotifications] = useState(false);
  const [students, setStudents] = useState<StudentSummary[]>([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const user: User | null = JSON.parse(localStorage.getItem("user") || "null");
  const isFaculty = user?.role === "faculty";

  useEffect(() => {
    if (!isFaculty) return;
    setLoadingNotifications(true);
    studentsApi.list()
      .then(setStudents)
      .catch(() => setStudents([]))
      .finally(() => setLoadingNotifications(false));
  }, [isFaculty]);

  useEffect(() => {
    if (!openNotifications) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!panelRef.current) return;
      if (!panelRef.current.contains(event.target as Node)) {
        setOpenNotifications(false);
      }
    };
    window.addEventListener("mousedown", onPointerDown);
    return () => window.removeEventListener("mousedown", onPointerDown);
  }, [openNotifications]);

  const atRiskStudents = useMemo(
    () => students
      .filter((s) => s.risk_level === "high" || s.risk_level === "medium")
      .sort((a, b) => {
        const order = { high: 0, medium: 1, low: 2 };
        const av = order[a.risk_level as keyof typeof order] ?? 3;
        const bv = order[b.risk_level as keyof typeof order] ?? 3;
        return av - bv;
      }),
    [students],
  );

  return (
    <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-8 py-6 flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{title}</h1>
        {subtitle && <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-4">
        {/* Dark Mode Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          aria-label="Toggle dark mode"
        >
          {theme === "dark" ? (
            <Sun className="w-5 h-5 text-yellow-400" />
          ) : (
            <Moon className="w-5 h-5 text-gray-600" />
          )}
        </button>

        {/* Notification */}
        <div className="relative" ref={panelRef}>
          <button
            onClick={() => isFaculty && setOpenNotifications((v) => !v)}
            className="relative p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            {isFaculty && atRiskStudents.length > 0 && (
              <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 bg-red-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center">
                {atRiskStudents.length > 99 ? "99+" : atRiskStudents.length}
              </span>
            )}
          </button>

          {isFaculty && openNotifications && (
            <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl z-50">
              <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">At-Risk Students</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">High and medium risk learners</p>
              </div>

              {loadingNotifications ? (
                <div className="px-4 py-6 text-sm text-gray-500 dark:text-gray-400 text-center">Loading...</div>
              ) : atRiskStudents.length === 0 ? (
                <div className="px-4 py-6 text-sm text-gray-500 dark:text-gray-400 text-center">No at-risk students right now.</div>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                  {atRiskStudents.map((student) => (
                    <button
                      key={student.id}
                      onClick={() => {
                        setOpenNotifications(false);
                        navigate(`/faculty/student/${student.id}`);
                      }}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{student.name}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{student.student_id}</p>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold whitespace-nowrap ${
                          student.risk_level === "high"
                            ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
                            : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300"
                        }`}>
                          {student.risk_level.toUpperCase()}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Profile */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm font-medium text-gray-900 dark:text-white">{userName}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-linear-to-br from-[#2563EB] to-[#9333EA] flex items-center justify-center text-white font-bold">
            {userName.charAt(0)}
          </div>
        </div>
      </div>
    </div>
  );
}
