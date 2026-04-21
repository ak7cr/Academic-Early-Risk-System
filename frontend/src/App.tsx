import { createBrowserRouter, RouterProvider, Navigate } from "react-router";
import { ThemeProvider } from "./lib/ThemeContext";
import { RoleSelection } from "./pages/RoleSelection";
import { StudentDashboard } from "./pages/StudentDashboard";
import { StudentTasks } from "./pages/StudentTasks";
import { StudentSubjects } from "./pages/StudentSubjects";
import { StudentSimulator } from "./pages/StudentSimulator";
import { StudentRecovery } from "./pages/StudentRecovery";
import { StudentReports } from "./pages/StudentReports";
import { StudentSettings } from "./pages/StudentSettings";
import { FacultyDashboard } from "./pages/FacultyDashboard";
import { FacultyAnalytics } from "./pages/FacultyAnalytics";
import { FacultyReports } from "./pages/FacultyReports";
import { FacultySettings } from "./pages/FacultySettings";
import { StudentDetail } from "./pages/StudentDetail";
import { StudentsOverview } from "./pages/StudentsOverview";
import { AuthPage } from "./pages/AuthPage";
import { FacultyPriority } from "./pages/FacultyPriority";

function RequireAuth({ children, role }: { children: React.ReactNode; role?: "student" | "faculty" }) {
  const token = localStorage.getItem("token");
  if (!token) return <Navigate to="/" replace />;
  if (role) {
    const user = JSON.parse(localStorage.getItem("user") || "null");
    if (user?.role && user.role !== role) {
      return <Navigate to={user.role === "faculty" ? "/faculty/dashboard" : "/student/dashboard"} replace />;
    }
  }
  return <>{children}</>;
}

const router = createBrowserRouter([
  { path: "/", Component: RoleSelection },
  { path: "/auth/:role", Component: AuthPage },
  { path: "/student/dashboard", element: <RequireAuth role="student"><StudentDashboard /></RequireAuth> },
  { path: "/student/tasks", element: <RequireAuth role="student"><StudentTasks /></RequireAuth> },
  { path: "/student/subjects", element: <RequireAuth role="student"><StudentSubjects /></RequireAuth> },
  { path: "/student/simulator", element: <RequireAuth role="student"><StudentSimulator /></RequireAuth> },
  { path: "/student/recovery", element: <RequireAuth role="student"><StudentRecovery /></RequireAuth> },
  { path: "/student/reports", element: <RequireAuth role="student"><StudentReports /></RequireAuth> },
  { path: "/student/settings", element: <RequireAuth role="student"><StudentSettings /></RequireAuth> },
  { path: "/faculty/dashboard", element: <RequireAuth role="faculty"><FacultyDashboard /></RequireAuth> },
  { path: "/faculty/students", element: <RequireAuth role="faculty"><StudentsOverview /></RequireAuth> },
  { path: "/faculty/analytics", element: <RequireAuth role="faculty"><FacultyAnalytics /></RequireAuth> },
  { path: "/faculty/reports", element: <RequireAuth role="faculty"><FacultyReports /></RequireAuth> },
  { path: "/faculty/settings", element: <RequireAuth role="faculty"><FacultySettings /></RequireAuth> },
  { path: "/faculty/student/:id", element: <RequireAuth role="faculty"><StudentDetail /></RequireAuth> },
  { path: "/faculty/priority", element: <RequireAuth role="faculty"><FacultyPriority /></RequireAuth> },
]);

export default function App() {
  return (
    <ThemeProvider>
      <RouterProvider router={router} />
    </ThemeProvider>
  );
}
