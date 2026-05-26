import { useState, useEffect } from 'react'
import { X, Clock, FolderKanban, FileText, AlertCircle, Calendar, DollarSign } from 'lucide-react'
import { useProjects } from '../../hooks/useProjects'
import type { Database } from '../../types/database.types'

type TimeEntry = Database['public']['Tables']['time_entries']['Row']

interface TimeEntryWithProject extends TimeEntry {
  project: {
    id: string
    name: string
    color: string
    client: {
      id: string
      name: string
    } | null
  } | null
}

interface TimeEntryFormData {
  project_id: string
  description: string
  start_time: string
  end_time: string
  duration: number
  is_billable: boolean
}

interface TimeEntryModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: TimeEntryFormData) => Promise<{ error: string | null }>
  timeEntry?: TimeEntryWithProject | null
  mode: 'create' | 'edit'
}

export function TimeEntryModal({ isOpen, onClose, onSubmit, timeEntry, mode }: TimeEntryModalProps) {
  const { projects } = useProjects()
  const [formData, setFormData] = useState<TimeEntryFormData>({
    project_id: '',
    description: '',
    start_time: '',
    end_time: '',
    duration: 0,
    is_billable: true,
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const activeProjects = projects.filter((p) => p.is_active)

  useEffect(() => {
    if (timeEntry && mode === 'edit') {
      // Format datetime-local input value (YYYY-MM-DDTHH:MM)
      const formatForInput = (isoString: string) => {
        const date = new Date(isoString)
        return date.toISOString().slice(0, 16)
      }

      setFormData({
        project_id: timeEntry.project_id ?? '',
        description: timeEntry.description ?? '',
        start_time: formatForInput(timeEntry.start_time),
        end_time: timeEntry.end_time ? formatForInput(timeEntry.end_time) : '',
        duration: timeEntry.duration ?? 0,
        is_billable: timeEntry.is_billable,
      })
    } else {
      // Default to current time (NOW)
      const now = new Date()

      
      setFormData({
        project_id: activeProjects[0]?.id || '',
        description: '',
        start_time: now.toISOString().slice(0, 16),
        end_time: '', // Empty for ongoing task
        duration: 0,
        is_billable: activeProjects[0]?.billable ?? true,
      })
    }
    setError('')
  }, [timeEntry, mode, isOpen, activeProjects])

  // Calculate duration when start/end times change
  useEffect(() => {
    if (formData.start_time && formData.end_time) {
      const start = new Date(formData.start_time).getTime()
      const end = new Date(formData.end_time).getTime()
      const duration = Math.floor((end - start) / 1000)

      if (duration > 0) {
        setFormData((prev) => ({ ...prev, duration }))
      } else if (duration < 0) {
        setFormData((prev) => ({ ...prev, duration: 0 }))
      }
    } else if (formData.start_time && !formData.end_time) {
      // Ongoing task - duration is 0
      setFormData((prev) => ({ ...prev, duration: 0 }))
    }
  }, [formData.start_time, formData.end_time])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (!formData.project_id) {
      setError('Please select a project')
      setLoading(false)
      return
    }

    if (!formData.start_time) {
      setError('Please enter start time')
      setLoading(false)
      return
    }

    // If end time exists, validate it's after start time
    if (formData.end_time) {
      const start = new Date(formData.start_time).getTime()
      const end = new Date(formData.end_time).getTime()
      if (end <= start) {
        setError('End time must be after start time')
        setLoading(false)
        return
      }
    }

    // Prepare data for submission
    const submitData: any = {
      project_id: formData.project_id,
      description: formData.description || null,
      start_time: new Date(formData.start_time).toISOString(),
      end_time: formData.end_time ? new Date(formData.end_time).toISOString() : null,
      duration: formData.end_time ? formData.duration : null,
      is_billable: formData.is_billable,
    }

    const { error } = await onSubmit(submitData)

    if (error) {
      setError(error)
      setLoading(false)
    } else {
      handleClose()
    }
  }

  const handleClose = () => {
    setFormData({
      project_id: '',
      description: '',
      start_time: '',
      end_time: '',
      duration: 0,
      is_billable: true,
    })
    setError('')
    setLoading(false)
    onClose()
  }

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return `${hours}h ${minutes}m`
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-neutral-900">
            {mode === 'create' ? 'Add Time Entry' : 'Edit Time Entry'}
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

          {/* Project */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              <FolderKanban className="inline h-4 w-4 mr-1" />
              Project *
            </label>
            <select
              value={formData.project_id}
              onChange={(e) => {
                const project = projects.find(p => p.id === e.target.value)
                setFormData({
                  ...formData,
                  project_id: e.target.value,
                  is_billable: project?.billable ?? formData.is_billable
                })
              }}
              required
              className="w-full rounded-lg border border-neutral-200 bg-white py-2.5 px-4 text-sm transition-colors focus:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-100"
            >
              <option value="">Select a project</option>
              {activeProjects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name} {project.client ? `- ${project.client.name}` : ''}
                </option>
              ))}
            </select>
            {activeProjects.length === 0 && (
              <p className="mt-2 text-xs text-error-600">
                No active projects. Please create a project first.
              </p>
            )}
          </div>

          {/* Start & End Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                <Calendar className="inline h-4 w-4 mr-1" />
                Start Time *
              </label>
              <input
                type="datetime-local"
                value={formData.start_time}
                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                required
                className="w-full rounded-lg border border-neutral-200 bg-white py-2.5 px-4 text-sm transition-colors focus:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                <Clock className="inline h-4 w-4 mr-1" />
                End Time <span className="text-neutral-400 font-normal">(Optional)</span>
              </label>
              <input
                type="datetime-local"
                value={formData.end_time}
                onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                className="w-full rounded-lg border border-neutral-200 bg-white py-2.5 px-4 text-sm transition-colors focus:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-100"
              />
            </div>
          </div>

          {/* Duration Display */}
          {formData.end_time ? (
            formData.duration > 0 && (
              <div className="rounded-lg bg-primary-50 border border-primary-100 p-3">
                <p className="text-sm text-primary-900">
                  <strong>Duration:</strong> {formatDuration(formData.duration)}
                </p>
              </div>
            )
          ) : (
            <div className="rounded-lg bg-warning-50 border border-warning-200 p-3 flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-warning-500 animate-pulse"></div>
              <p className="text-sm text-warning-900">
                <strong>Ongoing Task</strong> - Add end time when finished
              </p>
            </div>
          )}

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              <FileText className="inline h-4 w-4 mr-1" />
              Description (Optional)
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="What did you work on?"
              rows={3}
              className="w-full rounded-lg border border-neutral-200 bg-white py-2.5 px-4 text-sm transition-colors focus:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-100"
            />
          </div>

          {/* Billable Toggle */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="is_billable"
              checked={formData.is_billable}
              onChange={(e) => setFormData({ ...formData, is_billable: e.target.checked })}
              className="h-4 w-4 rounded border-neutral-300 text-primary-600 focus:ring-2 focus:ring-primary-100"
            />
            <label htmlFor="is_billable" className="flex items-center gap-2 text-sm font-medium text-neutral-700">
              <DollarSign className="h-4 w-4 text-success-600" />
              Billable Time
            </label>
          </div>

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
              disabled={loading || activeProjects.length === 0}
              className="btn flex-1 bg-primary-500 text-white hover:bg-primary-600 disabled:opacity-50"
            >
              {loading ? 'Saving...' : mode === 'create' ? 'Add Entry' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
