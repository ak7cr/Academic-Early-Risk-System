import { useEffect, useMemo, useRef, useState } from "react";
import { Bell, Moon, Sun, AlertTriangle, Clock, BookOpen } from "lucide-react";
import { useNavigate } from "react-router";
import { useTheme } from "../lib/ThemeContext";
import { studentsApi, tasksApi, subjectsApi, type StudentSummary, type Task, type User } from "../lib/api";

interface TopNavbarProps {
  title: string;
  subtitle?: string;
  userName?: string;
}

interface StudentNotification {
  id: string;
  type: "overdue" | "deadline" | "subject";
  title: string;
  description: string;
  severity: "high" | "medium" | "low";
  link: string;
}

export function TopNavbar({ title, subtitle, userName = "User" }: TopNavbarProps) {
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [openNotifications, setOpenNotifications] = useState(false);
  const [students, setStudents] = useState<StudentSummary[]>([]);
  const [studentTasks, setStudentTasks] = useState<Task[]>([]);
  const [studentSubjects, setStudentSubjects] = useState<{ code: string; name: string; risk_level: string }[]>([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const user: User | null = JSON.parse(localStorage.getItem("user") || "null");
  const isFaculty = user?.role === "faculty";
  const isStudent = user?.role === "student";

  // Faculty: fetch at-risk students
  useEffect(() => {
    if (!isFaculty) return;
    setLoadingNotifications(true);
    studentsApi.list()
      .then(setStudents)
      .catch(() => setStudents([]))
      .finally(() => setLoadingNotifications(false));
  }, [isFaculty]);

  // Student: fetch tasks & subjects for notifications
  useEffect(() => {
    if (!isStudent) return;
    setLoadingNotifications(true);
    Promise.all([
      tasksApi.list(),
      subjectsApi.withRisk(),
    ])
      .then(([tasks, subjects]) => {
        setStudentTasks(tasks);
        setStudentSubjects(subjects as { code: string; name: string; risk_level: string }[]);
      })
      .catch(() => {
        setStudentTasks([]);
        setStudentSubjects([]);
      })
      .finally(() => setLoadingNotifications(false));
  }, [isStudent]);

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

  // Faculty notifications
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

  // Student notifications
  const studentNotifications = useMemo<StudentNotification[]>(() => {
    if (!isStudent) return [];
    const notifications: StudentNotification[] = [];
    const now = new Date();
    const twoDaysMs = 2 * 24 * 60 * 60 * 1000;

    // Overdue tasks (also catch pending tasks that are past their due date)
    const overdueTasks = studentTasks.filter(
      (t) => t.status === "overdue" || (t.status === "pending" && new Date(t.due_date) < now)
    );
    overdueTasks.forEach((t) => {
      const dueDate = new Date(t.due_date);
      const daysOverdue = Math.floor((now.getTime() - dueDate.getTime()) / (24 * 60 * 60 * 1000));
      notifications.push({
        id: `overdue-${t.id}`,
        type: "overdue",
        title: t.title,
        description: `Overdue by ${daysOverdue} day${daysOverdue !== 1 ? "s" : ""} · ${t.subject_name}`,
        severity: daysOverdue > 3 ? "high" : "medium",
        link: "/student/tasks",
      });
    });

    // Upcoming deadlines (within 2 days)
    const upcomingTasks = studentTasks.filter((t) => {
      if (t.status === "completed" || t.status === "overdue") return false;
      const dueDate = new Date(t.due_date);
      const diff = dueDate.getTime() - now.getTime();
      return diff >= 0 && diff <= twoDaysMs;
    });
    upcomingTasks.forEach((t) => {
      const dueDate = new Date(t.due_date);
      const hoursLeft = Math.max(0, Math.floor((dueDate.getTime() - now.getTime()) / (60 * 60 * 1000)));
      const label = hoursLeft < 24 ? `${hoursLeft}h left` : `${Math.floor(hoursLeft / 24)}d left`;
      notifications.push({
        id: `deadline-${t.id}`,
        type: "deadline",
        title: t.title,
        description: `Due soon (${label}) · ${t.subject_name}`,
        severity: hoursLeft < 24 ? "high" : "medium",
        link: "/student/tasks",
      });
    });

    // At-risk subjects
    const riskySubjects = studentSubjects.filter(
      (s) => s.risk_level === "high" || s.risk_level === "medium"
    );
    riskySubjects.forEach((s) => {
      notifications.push({
        id: `subject-${s.code}`,
        type: "subject",
        title: `${s.code} — ${s.name}`,
        description: `${s.risk_level.toUpperCase()} RISK — needs attention`,
        severity: s.risk_level === "high" ? "high" : "medium",
        link: "/student/subjects",
      });
    });

    // Sort: high severity first
    notifications.sort((a, b) => {
      const order = { high: 0, medium: 1, low: 2 };
      return order[a.severity] - order[b.severity];
    });

    return notifications;
  }, [isStudent, studentTasks, studentSubjects]);

  const totalBadgeCount = isFaculty ? atRiskStudents.length : studentNotifications.length;

  const notificationIcon = (type: StudentNotification["type"]) => {
    switch (type) {
      case "overdue":
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case "deadline":
        return <Clock className="w-4 h-4 text-amber-500" />;
      case "subject":
        return <BookOpen className="w-4 h-4 text-orange-500" />;
    }
  };

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
            onClick={() => setOpenNotifications((v) => !v)}
            className="relative p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            {totalBadgeCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 bg-red-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center">
                {totalBadgeCount > 99 ? "99+" : totalBadgeCount}
              </span>
            )}
          </button>

          {openNotifications && (
            <div className="absolute right-0 mt-2 w-96 max-h-[28rem] overflow-y-auto bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl z-50">

              {/* --- Faculty notification panel --- */}
              {isFaculty && (
                <>
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
                </>
              )}

              {/* --- Student notification panel --- */}
              {isStudent && (
                <>
                  <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">Notifications</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Missed deadlines, upcoming tasks & at-risk subjects</p>
                  </div>

                  {loadingNotifications ? (
                    <div className="px-4 py-6 text-sm text-gray-500 dark:text-gray-400 text-center">Loading...</div>
                  ) : studentNotifications.length === 0 ? (
                    <div className="px-4 py-8 text-center">
                      <p className="text-sm text-gray-500 dark:text-gray-400">🎉 You're all caught up!</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">No missed deadlines or at-risk subjects.</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-100 dark:divide-gray-700">
                      {studentNotifications.map((n) => (
                        <button
                          key={n.id}
                          onClick={() => {
                            setOpenNotifications(false);
                            navigate(n.link);
                          }}
                          className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors group"
                        >
                          <div className="flex items-start gap-3">
                            <div className={`mt-0.5 p-1.5 rounded-lg ${
                              n.severity === "high"
                                ? "bg-red-50 dark:bg-red-900/30"
                                : "bg-amber-50 dark:bg-amber-900/30"
                            }`}>
                              {notificationIcon(n.type)}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{n.title}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{n.description}</p>
                            </div>
                            <span className={`mt-1 px-2 py-0.5 rounded-full text-[10px] font-semibold whitespace-nowrap ${
                              n.severity === "high"
                                ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
                                : "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
                            }`}>
                              {n.type === "overdue" ? "OVERDUE" : n.type === "deadline" ? "DUE SOON" : "AT RISK"}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </>
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
