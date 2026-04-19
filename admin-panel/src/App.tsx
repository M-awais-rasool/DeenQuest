import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import ContentListPage from './pages/ContentListPage'
import ContentEditorPage from './pages/ContentEditorPage'
import ThemesPage from './pages/ThemesPage'
import RewardsPage from './pages/RewardsPage'
import EventsPage from './pages/EventsPage'
import AuditLogPage from './pages/AuditLogPage'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-navy-950">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <Layout>
              <Routes>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/tasks" element={<ContentListPage type="task" />} />
                <Route path="/levels" element={<ContentListPage type="level" />} />
                <Route path="/content/new" element={<ContentEditorPage />} />
                <Route path="/content/:id" element={<ContentEditorPage />} />
                <Route path="/themes" element={<ThemesPage />} />
                <Route path="/rewards" element={<RewardsPage />} />
                <Route path="/events" element={<EventsPage />} />
                <Route path="/audit-logs" element={<AuditLogPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Layout>
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}
