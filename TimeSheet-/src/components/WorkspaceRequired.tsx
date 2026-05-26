import { Navigate } from 'react-router-dom'
import { useWorkspace } from '../contexts/WorkspaceContext'

export function WorkspaceRequired({ children }: { children: React.ReactNode }) {
  const { currentWorkspace, workspaces, loading, hasChecked } = useWorkspace()

  // Show loading while checking for workspaces
  if (loading || !hasChecked) {
    return (
      <div className="flex h-screen items-center justify-center bg-neutral-50">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600 mx-auto"></div>
          <p className="text-sm text-neutral-600">Loading workspace...</p>
        </div>
      </div>
    )
  }

  // Only redirect to onboarding if we've confirmed there are no workspaces
  if (!currentWorkspace && workspaces.length === 0) {
    return <Navigate to="/onboarding/workspace" replace />
  }

  return <>{children}</>
}
