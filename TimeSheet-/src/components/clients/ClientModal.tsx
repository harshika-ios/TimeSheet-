import { useState, useEffect } from 'react'
import { X, Mail, FileText, AlertCircle } from 'lucide-react'
import type { Database } from '../../types/database.types'

type Client = Database['public']['Tables']['clients']['Row']

interface ClientFormData {
  name: string
  email: string
  notes: string
  is_active: boolean
}

interface ClientModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: ClientFormData) => Promise<{ error: string | null }>
  client?: Client | null
  mode: 'create' | 'edit'
}

export function ClientModal({ isOpen, onClose, onSubmit, client, mode }: ClientModalProps) {
  const [formData, setFormData] = useState<ClientFormData>({
    name: '',
    email: '',
    notes: '',
    is_active: true,
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (client && mode === 'edit') {
      setFormData({
        name: client.name,
        email: client.email || '',
        notes: client.notes || '',
        is_active: client.is_active,
      })
    } else {
      setFormData({
        name: '',
        email: '',
        notes: '',
        is_active: true,
      })
    }
    setError('')
  }, [client, mode, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (formData.name.trim().length < 2) {
      setError('Client name must be at least 2 characters')
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
    setFormData({ name: '', email: '', notes: '', is_active: true })
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
            {mode === 'create' ? 'Add New Client' : 'Edit Client'}
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

          {/* Client Name */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Client Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              placeholder="ABC Corporation"
              className="w-full rounded-lg border border-neutral-200 bg-white py-2.5 px-4 text-sm transition-colors focus:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-100"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Email (Optional)
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="contact@client.com"
                className="w-full rounded-lg border border-neutral-200 bg-white py-2.5 pl-10 pr-4 text-sm transition-colors focus:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-100"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Notes (Optional)
            </label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 h-4 w-4 text-neutral-400" />
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional information about this client..."
                rows={3}
                className="w-full rounded-lg border border-neutral-200 bg-white py-2.5 pl-10 pr-4 text-sm transition-colors focus:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-100"
              />
            </div>
          </div>

          {/* Active Status */}
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
                Active Client
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
              disabled={loading}
              className="btn flex-1 bg-primary-500 text-white hover:bg-primary-600 disabled:opacity-50"
            >
              {loading ? 'Saving...' : mode === 'create' ? 'Add Client' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
