import { createBrowserRouter, RouterProvider } from "react-router";
import { RoleSelection } from "./pages/RoleSelection";
import { StudentDashboard } from "./pages/StudentDashboard";
import { StudentTasks } from "./pages/StudentTasks";
import { StudentSubjects } from "./pages/StudentSubjects";
import { StudentSimulator } from "./pages/StudentSimulator";
import { StudentRecovery } from "./pages/StudentRecovery";
import { StudentReports } from "./pages/StudentReports";
import { TeacherDashboard } from "./pages/TeacherDashboard";
import { TeacherAnalytics } from "./pages/TeacherAnalytics";
import { TeacherReports } from "./pages/TeacherReports";
import { TeacherSettings } from "./pages/TeacherSettings";
import { StudentDetail } from "./pages/StudentDetail";
import { StudentsOverview } from "./pages/StudentsOverview";

const router = createBrowserRouter([
  { path: "/", Component: RoleSelection },
  { path: "/student/dashboard", Component: StudentDashboard },
  { path: "/student/tasks", Component: StudentTasks },
  { path: "/student/subjects", Component: StudentSubjects },
  { path: "/student/simulator", Component: StudentSimulator },
  { path: "/student/recovery", Component: StudentRecovery },
  { path: "/student/reports", Component: StudentReports },
  { path: "/teacher/dashboard", Component: TeacherDashboard },
  { path: "/teacher/students", Component: StudentsOverview },
  { path: "/teacher/analytics", Component: TeacherAnalytics },
  { path: "/teacher/reports", Component: TeacherReports },
  { path: "/teacher/settings", Component: TeacherSettings },
  { path: "/teacher/student/:id", Component: StudentDetail },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
