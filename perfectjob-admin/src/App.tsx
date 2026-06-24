import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useEffect } from 'react'
import { useAuthStore } from './store/useAuthStore'
import { isAdminRole } from './services/api/authApi'
import { Layout } from './components/Layout'
import { LoginPage } from './pages/LoginPage'
import { Dashboard } from './pages/Dashboard'
import { JobsPage } from './pages/JobsPage'
import { CompaniesPage } from './pages/CompaniesPage'
import './styles/design-system.css'

const queryClient = new QueryClient()

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user, loadToken, logout } = useAuthStore()

  useEffect(() => {
    loadToken()
  }, [loadToken])

  useEffect(() => {
    if (user && !isAdminRole(user.role)) {
      logout()
    }
  }, [user, logout])

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (user && !isAdminRole(user.role)) {
    return <Navigate to="/login" replace />
  }

  return <Layout>{children}</Layout>
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/jobs"
            element={
              <ProtectedRoute>
                <JobsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/companies"
            element={
              <ProtectedRoute>
                <CompaniesPage />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App
