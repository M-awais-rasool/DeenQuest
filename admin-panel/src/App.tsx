import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Layout from "./components/Layout";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import ContentListPage from "./pages/ContentListPage";
import ContentEditorPage from "./pages/ContentEditorPage";
import ThemesPage from "./pages/ThemesPage";
import RewardsPage from "./pages/RewardsPage";
import EventsPage from "./pages/EventsPage";
import AuditLogPage from "./pages/AuditLogPage";
import SettingsPage from "./pages/SettingsPage";
import LearningAgentPage from "./pages/LearningAgentPage";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="dq-spinner h-8 w-8" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/*"
        element={
          // <ProtectedRoute>
            <Layout>
              <Routes>
                <Route path="/" element={<DashboardPage />} />
                <Route
                  path="/tasks"
                  element={<ContentListPage type="task" />}
                />
                <Route
                  path="/tasks/new"
                  element={<ContentEditorPage kind="task" />}
                />
                <Route
                  path="/tasks/:id"
                  element={<ContentEditorPage kind="task" />}
                />
                <Route
                  path="/levels"
                  element={<ContentListPage type="level" />}
                />
                <Route
                  path="/levels/new"
                  element={<ContentEditorPage kind="level" />}
                />
                <Route
                  path="/levels/:id"
                  element={<ContentEditorPage kind="level" />}
                />
                <Route path="/learning-agent" element={<LearningAgentPage />} />
                <Route path="/themes" element={<ThemesPage />} />
                <Route path="/rewards" element={<RewardsPage />} />
                <Route path="/events" element={<EventsPage />} />
                <Route path="/audit-logs" element={<AuditLogPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Layout>
          // </ProtectedRoute>
        }
      />
    </Routes>
  );
}
