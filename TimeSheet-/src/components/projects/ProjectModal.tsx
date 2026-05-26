import { useState, useEffect } from 'react'
import { X, Palette, FileText, AlertCircle, DollarSign } from 'lucide-react'
import { useClients } from '../../hooks/useClients'
import type { Database } from '../../types/database.types'

type Project = Database['public']['Tables']['projects']['Row']

interface ProjectWithClient extends Project {
  client: {
    id: string
    name: string
    is_active: boolean
  } | null
}

interface ProjectFormData {
  name: string
  client_id: string
  description: string
  color: string
  billable: boolean
  is_active: boolean
}

interface ProjectModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: ProjectFormData) => Promise<{ error: string | null }>
  project?: ProjectWithClient | null
  mode: 'create' | 'edit'
}

const PROJECT_COLORS = [
  '#3B82F6', // Blue
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#EF4444', // Red
  '#F59E0B', // Amber
  '#10B981', // Green
  '#06B6D4', // Cyan
  '#6366F1', // Indigo
]

export function ProjectModal({ isOpen, onClose, onSubmit, project, mode }: ProjectModalProps) {
  const { clients } = useClients()
  const [formData, setFormData] = useState<ProjectFormData>({
    name: '',
    client_id: '',
    description: '',
    color: PROJECT_COLORS[0],
    billable: true,
    is_active: true,
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Filter only active clients
  const activeClients = clients.filter((c) => c.is_active)

  useEffect(() => {
    if (project && mode === 'edit') {
      setFormData({
        name: project.name,
        client_id: project.client_id,
        description: project.description || '',
        color: project.color,
        billable: project.billable,
        is_active: project.is_active,
      })
    } else {
      setFormData({
        name: '',
        client_id: activeClients[0]?.id || '',
        description: '',
        color: PROJECT_COLORS[0],
        billable: true,
        is_active: true,
      })
    }
    setError('')
  }, [project, mode, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (formData.name.trim().length < 2) {
      setError('Project name must be at least 2 characters')
      setLoading(false)
      return
    }

    if (!formData.client_id) {
      setError('Please select a client')
      setLoading(false)
      return
    }

    const { error } = await onSubmit(formData)

    if (error) {
      setError(error)
      setLoading(false)
    } else {
      handleClose()
    }
  }

  const handleClose = () => {
    setFormData({
      name: '',
      client_id: '',
      description: '',
      color: PROJECT_COLORS[0],
      billable: true,
      is_active: true,
    })
    setError('')
    setLoading(false)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-neutral-900">
            {mode === 'create' ? 'Add New Project' : 'Edit Project'}
          </h2>
          <button
            onClick={handleClose}
            className="rounded-lg p-2 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Error Message */}
          {error && (
            <div className="flex items-start gap-3 rounded-lg bg-error-50 border border-error-200 p-4">
              <AlertCircle className="h-5 w-5 text-error-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-error-700">{error}</p>
            </div>
          )}

          {/* Project Name */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Project Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              placeholder="Website Redesign"
              className="w-full rounded-lg border border-neutral-200 bg-white py-2.5 px-4 text-sm transition-colors focus:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-100"
            />
          </div>

          {/* Client */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Client *
            </label>
            <select
              value={formData.client_id}
              onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
              required
              className="w-full rounded-lg border border-neutral-200 bg-white py-2.5 px-4 text-sm transition-colors focus:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-100"
            >
              <option value="">Select a client</option>
              {activeClients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </select>
            {activeClients.length === 0 && (
              <p className="mt-2 text-xs text-error-600">
                No active clients. Please create a client first.
              </p>
            )}
          </div>

          {/* Color Picker */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              <Palette className="inline h-4 w-4 mr-1" />
              Project Color
            </label>
            <div className="flex gap-2">
              {PROJECT_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setFormData({ ...formData, color })}
                  className={`h-10 w-10 rounded-lg transition-all ${
                    formData.color === color
                      ? 'ring-2 ring-offset-2 ring-neutral-400 scale-110'
                      : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Description (Optional)
            </label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 h-4 w-4 text-neutral-400" />
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Project details and objectives..."
                rows={3}
                className="w-full rounded-lg border border-neutral-200 bg-white py-2.5 pl-10 pr-4 text-sm transition-colors focus:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-100"
              />
            </div>
          </div>

          {/* Billable Toggle */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="billable"
              checked={formData.billable}
              onChange={(e) => setFormData({ ...formData, billable: e.target.checked })}
              className="h-4 w-4 rounded border-neutral-300 text-primary-600 focus:ring-2 focus:ring-primary-100"
            />
            <label htmlFor="billable" className="flex items-center gap-2 text-sm font-medium text-neutral-700">
              <DollarSign className="h-4 w-4 text-success-600" />
              Billable Project
            </label>
          </div>

          {/* Active Status (Edit mode only) */}
          {mode === 'edit' && (
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="h-4 w-4 rounded border-neutral-300 text-primary-600 focus:ring-2 focus:ring-primary-100"
              />
              <label htmlFor="is_active" className="text-sm font-medium text-neutral-700">
                Active Project
              </label>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="btn flex-1 border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || activeClients.length === 0}
              className="btn flex-1 bg-primary-500 text-white hover:bg-primary-600 disabled:opacity-50"
            >
              {loading ? 'Saving...' : mode === 'create' ? 'Add Project' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
