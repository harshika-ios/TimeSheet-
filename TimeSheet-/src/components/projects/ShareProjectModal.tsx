import { useState, useEffect } from 'react'
import { X, Link as LinkIcon, Copy, Lock, Check, Eye, RefreshCw, Trash2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import type { Project } from '../../types'

interface ShareProjectModalProps {
  isOpen: boolean
  onClose: () => void
  project: Project
  onUpdate: () => void
}

export function ShareProjectModal({ isOpen, onClose, project, onUpdate }: ShareProjectModalProps) {
  const [shareUrl, setShareUrl] = useState('')
  const [password, setPassword] = useState('')
  const [usePassword, setUsePassword] = useState(false)
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isOpen && project.share_token) {
      const url = `${window.location.origin}/share/${project.share_token}`
      setShareUrl(url)
      setUsePassword(!!project.share_password)
    }
  }, [isOpen, project])

  const generateShareLink = async () => {
    setLoading(true)
    setError('')

    try {
      const { data, error: rpcError } = await (supabase as any)
        .rpc('generate_project_share_token', { project_id: project.id })

      if (rpcError) throw rpcError

      const token = data as string
      const url = `${window.location.origin}/share/${token}`
      setShareUrl(url)
      onUpdate()
    } catch (err: any) {
      setError(err.message || 'Failed to generate share link')
    } finally {
      setLoading(false)
    }
  }

  const updatePassword = async () => {
    setLoading(true)
    setError('')

    try {
      const { error: updateError } = await (supabase
        .from('projects') as any)
        .update({
          share_password: usePassword && password ? password : null
        })
        .eq('id', project.id)

      if (updateError) throw updateError

      onUpdate()
      alert('Password updated successfully')
    } catch (err: any) {
      setError(err.message || 'Failed to update password')
    } finally {
      setLoading(false)
    }
  }

  const revokeAccess = async () => {
    if (!confirm('Are you sure you want to revoke share access? The current link will stop working.')) {
      return
    }

    setLoading(true)
    setError('')

    try {
      const { error: rpcError } = await (supabase as any)
        .rpc('revoke_project_share', { project_id: project.id })

      if (rpcError) throw rpcError

      setShareUrl('')
      setPassword('')
      setUsePassword(false)
      onUpdate()
      alert('Share access revoked successfully')
    } catch (err: any) {
      setError(err.message || 'Failed to revoke access')
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-lg rounded-lg bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-neutral-900">Share Project</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Project Info */}
          <div className="rounded-lg bg-neutral-50 p-4">
            <p className="text-sm font-medium text-neutral-900">{project.name}</p>
            <p className="text-xs text-neutral-500 mt-1">
              {project.client?.name || 'No Client'} • {project.billable ? 'Billable' : 'Non-billable'}
            </p>
          </div>

          {error && (
            <div className="rounded-lg bg-error-50 border border-error-200 p-3 text-sm text-error-700">
              {error}
            </div>
          )}

          {/* Share Link Section */}
          {shareUrl ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Shareable Link
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={shareUrl}
                    readOnly
                    className="flex-1 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm font-mono"
                  />
                  <button
                    onClick={copyToClipboard}
                    className="btn bg-primary-500 text-white hover:bg-primary-600"
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-xs text-neutral-500 mt-2">
                  Anyone with this link can view time entries for this project
                </p>
              </div>

              {/* Password Protection */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <input
                    type="checkbox"
                    id="usePassword"
                    checked={usePassword}
                    onChange={(e) => setUsePassword(e.target.checked)}
                    className="h-4 w-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                  />
                  <label htmlFor="usePassword" className="text-sm font-medium text-neutral-700">
                    Password Protection
                  </label>
                </div>

                {usePassword && (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter password"
                      className="flex-1 rounded-lg border border-neutral-200 px-3 py-2 text-sm"
                    />
                    <button
                      onClick={updatePassword}
                      disabled={loading || !password}
                      className="btn bg-neutral-100 text-neutral-700 hover:bg-neutral-200 disabled:opacity-50"
                    >
                      <Lock className="h-4 w-4" />
                      Set
                    </button>
                  </div>
                )}
              </div>

              {/* Stats */}
              {project.share_view_count !== undefined && project.share_view_count > 0 && (
                <div className="rounded-lg bg-info-50 border border-info-200 p-3">
                  <div className="flex items-center gap-2 text-sm text-info-900">
                    <Eye className="h-4 w-4" />
                    <span>Viewed {project.share_view_count} time(s)</span>
                    {project.share_last_viewed_at && (
                      <span className="text-info-700">
                        • Last: {new Date(project.share_last_viewed_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={generateShareLink}
                  disabled={loading}
                  className="btn flex-1 border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50"
                >
                  <RefreshCw className="h-4 w-4" />
                  Regenerate Link
                </button>
                <button
                  onClick={revokeAccess}
                  disabled={loading}
                  className="btn flex-1 bg-error-500 text-white hover:bg-error-600"
                >
                  <Trash2 className="h-4 w-4" />
                  Revoke Access
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <LinkIcon className="h-12 w-12 text-neutral-300 mx-auto mb-4" />
              <p className="text-sm text-neutral-600 mb-4">
                This project hasn't been shared yet
              </p>
              <button
                onClick={generateShareLink}
                disabled={loading}
                className="btn bg-primary-500 text-white hover:bg-primary-600 disabled:opacity-50"
              >
                <LinkIcon className="h-4 w-4" />
                {loading ? 'Generating...' : 'Generate Share Link'}
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-neutral-200 px-6 py-4">
          <button
            onClick={onClose}
            className="btn w-full border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
