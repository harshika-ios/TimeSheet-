import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { WorkspaceProvider } from './contexts/WorkspaceContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { WorkspaceRequired } from './components/WorkspaceRequired'
import { AppLayout } from './components/layout/AppLayout'
import { Login } from './pages/auth/Login'
import { SignUp } from './pages/auth/SignUp'
import { CreateWorkspace } from './pages/onboarding/CreateWorkspace'
import { Dashboard } from './pages/Dashboard'
import { Timer } from './pages/Timer'
import { Timesheet } from './pages/Timesheet'
import { Clients } from './pages/Clients'
import { Projects } from './pages/Projects'
import { ProjectDetails } from './pages/ProjectDetails'
import { Reports } from './pages/Reports'
import { Settings } from './pages/Settings'
import { PublicProjectView } from './pages/PublicProjectView'

function App() {
  return (
    <AuthProvider>
      <WorkspaceProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/share/:token" element={<PublicProjectView />} />

            {/* Onboarding Routes (Protected but no workspace required) */}
            <Route
              path="/onboarding/workspace"
              element={
                <ProtectedRoute>
                  <CreateWorkspace />
                </ProtectedRoute>
              }
            />

            {/* Protected Routes (Auth + Workspace Required) */}
            <Route
              element={
                <ProtectedRoute>
                  <WorkspaceRequired>
                    <AppLayout />
                  </WorkspaceRequired>
                </ProtectedRoute>
              }
            >
              <Route index element={<Dashboard />} />
              <Route path="/timer" element={<Timer />} />
              <Route path="/timesheet" element={<Timesheet />} />
              <Route path="/clients" element={<Clients />} />
              <Route path="/projects" element={<Projects />} />
              <Route path="/projects/:projectId" element={<ProjectDetails />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/settings" element={<Settings />} />
            </Route>

            {/* Catch all - redirect to home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </WorkspaceProvider>
    </AuthProvider>
  )
}

export default App
