import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Building2, AlertCircle } from 'lucide-react'
import { useWorkspace } from '../../contexts/WorkspaceContext'

export function CreateWorkspace() {
  const [workspaceName, setWorkspaceName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { createWorkspace } = useWorkspace()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (workspaceName.trim().length < 2) {
      setError('Workspace name must be at least 2 characters')
      setLoading(false)
      return
    }

    const { workspace, error } = await createWorkspace(workspaceName.trim())

    if (error) {
      setError(error)
      setLoading(false)
    } else if (workspace) {
      // Success! Redirect to dashboard
      navigate('/')
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary-50 to-neutral-50 px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-500 shadow-lg">
            <Building2 className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-neutral-900">Create Your Workspace</h1>
          <p className="mt-2 text-sm text-neutral-600">
            Get started by creating your first workspace
          </p>
        </div>

        {/* Form */}
        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Error Message */}
            {error && (
              <div className="flex items-start gap-3 rounded-lg bg-error-50 border border-error-200 p-4">
                <AlertCircle className="h-5 w-5 text-error-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-error-900">Error</p>
                  <p className="mt-1 text-sm text-error-700">{error}</p>
                </div>
              </div>
            )}

            {/* Workspace Name */}
            <div>
              <label
                htmlFor="workspaceName"
                className="block text-sm font-medium text-neutral-700 mb-2"
              >
                Workspace Name
              </label>
              <input
                id="workspaceName"
                type="text"
                value={workspaceName}
                onChange={(e) => setWorkspaceName(e.target.value)}
                required
                placeholder="My Company"
                className="w-full rounded-lg border border-neutral-200 bg-white py-3 px-4 text-sm transition-colors focus:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-100"
              />
              <p className="mt-2 text-xs text-neutral-500">
                This could be your company name, team name, or personal workspace
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="btn w-full bg-primary-500 py-3 text-base font-semibold text-white hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create Workspace'}
            </button>
          </form>

          {/* Info */}
          <div className="mt-6 rounded-lg bg-info-50 border border-info-100 p-4">
            <p className="text-sm text-info-900">
              💡 <strong>What's a workspace?</strong>
            </p>
            <p className="mt-1 text-xs text-info-700">
              A workspace is where you'll manage your clients, projects, and time
              tracking. You can create multiple workspaces and switch between them.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
