import { createBrowserRouter, RouterProvider } from "react-router";
import { ThemeProvider } from "./lib/ThemeContext";
import { RoleSelection } from "./pages/RoleSelection";
import { StudentDashboard } from "./pages/StudentDashboard";
import { StudentTasks } from "./pages/StudentTasks";
import { StudentSubjects } from "./pages/StudentSubjects";
import { StudentSimulator } from "./pages/StudentSimulator";
import { StudentRecovery } from "./pages/StudentRecovery";
import { StudentReports } from "./pages/StudentReports";
import { FacultyDashboard } from "./pages/FacultyDashboard";
import { FacultyAnalytics } from "./pages/FacultyAnalytics";
import { FacultyReports } from "./pages/FacultyReports";
import { FacultySettings } from "./pages/FacultySettings";
import { StudentDetail } from "./pages/StudentDetail";
import { StudentsOverview } from "./pages/StudentsOverview";
import { AuthPage } from "./pages/AuthPage";

const router = createBrowserRouter([
  { path: "/", Component: RoleSelection },
  { path: "/auth/:role", Component: AuthPage },
  { path: "/student/dashboard", Component: StudentDashboard },
  { path: "/student/tasks", Component: StudentTasks },
  { path: "/student/subjects", Component: StudentSubjects },
  { path: "/student/simulator", Component: StudentSimulator },
  { path: "/student/recovery", Component: StudentRecovery },
  { path: "/student/reports", Component: StudentReports },
  { path: "/faculty/dashboard", Component: FacultyDashboard },
  { path: "/faculty/students", Component: StudentsOverview },
  { path: "/faculty/analytics", Component: FacultyAnalytics },
  { path: "/faculty/reports", Component: FacultyReports },
  { path: "/faculty/settings", Component: FacultySettings },
  { path: "/faculty/student/:id", Component: StudentDetail },
]);

export default function App() {
  return (
    <ThemeProvider>
      <RouterProvider router={router} />
    </ThemeProvider>
  );
}
