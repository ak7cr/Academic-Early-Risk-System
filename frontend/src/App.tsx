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

function RequireAuth({ children }: { children: React.ReactNode }) {
  return localStorage.getItem("token") ? <>{children}</> : <Navigate to="/" replace />;
}

const router = createBrowserRouter([
  { path: "/", Component: RoleSelection },
  { path: "/auth/:role", Component: AuthPage },
  { path: "/student/dashboard", element: <RequireAuth><StudentDashboard /></RequireAuth> },
  { path: "/student/tasks", element: <RequireAuth><StudentTasks /></RequireAuth> },
  { path: "/student/subjects", element: <RequireAuth><StudentSubjects /></RequireAuth> },
  { path: "/student/simulator", element: <RequireAuth><StudentSimulator /></RequireAuth> },
  { path: "/student/recovery", element: <RequireAuth><StudentRecovery /></RequireAuth> },
  { path: "/student/reports", element: <RequireAuth><StudentReports /></RequireAuth> },
  { path: "/student/settings", element: <RequireAuth><StudentSettings /></RequireAuth> },
  { path: "/faculty/dashboard", element: <RequireAuth><FacultyDashboard /></RequireAuth> },
  { path: "/faculty/students", element: <RequireAuth><StudentsOverview /></RequireAuth> },
  { path: "/faculty/analytics", element: <RequireAuth><FacultyAnalytics /></RequireAuth> },
  { path: "/faculty/reports", element: <RequireAuth><FacultyReports /></RequireAuth> },
  { path: "/faculty/settings", element: <RequireAuth><FacultySettings /></RequireAuth> },
  { path: "/faculty/student/:id", element: <RequireAuth><StudentDetail /></RequireAuth> },
  { path: "/faculty/priority", element: <RequireAuth><FacultyPriority /></RequireAuth> },
]);

export default function App() {
  return (
    <ThemeProvider>
      <RouterProvider router={router} />
    </ThemeProvider>
  );
}
