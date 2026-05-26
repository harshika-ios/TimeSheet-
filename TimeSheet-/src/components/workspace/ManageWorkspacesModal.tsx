import { useState } from 'react'
import { X, Trash2, AlertCircle } from 'lucide-react'
import { useWorkspace } from '../../contexts/WorkspaceContext'
import { supabase } from '../../lib/supabase'

interface ManageWorkspacesModalProps {
  isOpen: boolean
  onClose: () => void
}

export function ManageWorkspacesModal({ isOpen, onClose }: ManageWorkspacesModalProps) {
  const { workspaces, currentWorkspace, setCurrentWorkspace, refreshWorkspaces } = useWorkspace()
  const [deleting, setDeleting] = useState<string | null>(null)
  const [error, setError] = useState('')

  const handleDelete = async (workspaceId: string, workspaceName: string) => {
    if (!window.confirm(`Are you sure you want to delete "${workspaceName}"?\n\nThis will permanently delete:\n• All clients\n• All projects\n• All time entries\n\nThis action cannot be undone!`)) {
      return
    }

    setError('')
    setDeleting(workspaceId)

    try {
      // Delete workspace (cascade will handle related records)
      const { error: deleteError } = await supabase
        .from('workspaces')
        .delete()
        .eq('id', workspaceId)

      if (deleteError) throw deleteError

      // If we deleted the current workspace, switch to another one
      if (currentWorkspace?.id === workspaceId) {
        const remainingWorkspaces = workspaces.filter(w => w.id !== workspaceId)
        if (remainingWorkspaces.length > 0) {
          setCurrentWorkspace(remainingWorkspaces[0])
        }
      }

      await refreshWorkspaces()
    } catch (err: any) {
      setError(err.message || 'Failed to delete workspace')
      console.error('Error deleting workspace:', err)
    } finally {
      setDeleting(null)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl rounded-xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-neutral-900">
            Manage Workspaces
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-lg bg-error-50 border border-error-200 p-4">
            <AlertCircle className="h-5 w-5 text-error-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-error-700">{error}</p>
          </div>
        )}

        {/* Workspace List */}
        <div className="space-y-3">
          {workspaces.map((workspace) => (
            <div
              key={workspace.id}
              className={`flex items-center justify-between rounded-lg border p-4 transition-colors ${
                currentWorkspace?.id === workspace.id
                  ? 'border-primary-200 bg-primary-50'
                  : 'border-neutral-200 bg-white hover:bg-neutral-50'
              }`}
            >
              <div className="flex-1">
                <h3 className="font-medium text-neutral-900">{workspace.name}</h3>
                <p className="text-sm text-neutral-500">
                  {workspace.slug}
                </p>
                {currentWorkspace?.id === workspace.id && (
                  <span className="mt-2 inline-block rounded-full bg-primary-100 px-2 py-0.5 text-xs font-medium text-primary-700">
                    Current
                  </span>
                )}
              </div>

              <button
                onClick={() => handleDelete(workspace.id, workspace.name)}
                disabled={deleting === workspace.id || workspaces.length === 1}
                className="btn bg-error-500 text-white hover:bg-error-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleting === workspace.id ? (
                  'Deleting...'
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </>
                )}
              </button>
            </div>
          ))}
        </div>

        {/* Info */}
        {workspaces.length === 1 && (
          <div className="mt-4 rounded-lg bg-info-50 border border-info-100 p-4">
            <p className="text-sm text-info-900">
              💡 You need at least one workspace. Create another workspace before deleting this one.
            </p>
          </div>
        )}

        {/* Close Button */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="btn border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
