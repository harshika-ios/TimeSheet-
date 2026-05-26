import { useState, useEffect } from 'react'
import { Play, Square, Save, X, Clock, FolderKanban, FileText } from 'lucide-react'
import { useProjects } from '../hooks/useProjects'
import { useTimeEntries } from '../hooks/useTimeEntries'
import { formatDuration } from '../utils/time'

interface TimerState {
  isRunning: boolean
  projectId: string
  description: string
  startTime: string | null
  elapsed: number
}

export function Timer() {
  const { projects } = useProjects()
  const { createTimeEntry } = useTimeEntries()
  const [timer, setTimer] = useState<TimerState>({
    isRunning: false,
    projectId: '',
    description: '',
    startTime: null,
    elapsed: 0,
  })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  // Load timer state from localStorage
  useEffect(() => {
    const savedTimer = localStorage.getItem('activeTimer')
    if (savedTimer) {
      const parsed = JSON.parse(savedTimer)
      setTimer(parsed)
    }
  }, [])

  // Update elapsed time every second
  useEffect(() => {
    if (!timer.isRunning || !timer.startTime) return

    const interval = setInterval(() => {
      const start = new Date(timer.startTime!).getTime()
      const now = Date.now()
      const elapsed = Math.floor((now - start) / 1000)
      setTimer((prev) => ({ ...prev, elapsed }))
    }, 1000)

    return () => clearInterval(interval)
  }, [timer.isRunning, timer.startTime])

  // Save timer state to localStorage
  useEffect(() => {
    if (timer.isRunning) {
      localStorage.setItem('activeTimer', JSON.stringify(timer))
    } else {
      localStorage.removeItem('activeTimer')
    }
  }, [timer])

  const activeProjects = projects.filter((p) => p.is_active)
  const selectedProject = projects.find((p) => p.id === timer.projectId)

  const handleStart = () => {
    if (!timer.projectId) {
      setError('Please select a project')
      return
    }

    setError('')
    const startTime = new Date().toISOString()
    setTimer({
      ...timer,
      isRunning: true,
      startTime,
      elapsed: 0,
    })
  }

  const handleStop = () => {
    setTimer((prev) => ({
      ...prev,
      isRunning: false,
    }))
  }

  const handleSave = async () => {
    if (!timer.startTime) return

    setSaving(true)
    setError('')

    const endTime = new Date().toISOString()
    const duration = timer.elapsed

    const { error } = await createTimeEntry({
      project_id: timer.projectId,
      description: timer.description || null,
      start_time: timer.startTime,
      end_time: endTime,
      duration,
      is_billable: selectedProject?.billable || false,
    })

    if (error) {
      setError(error)
      setSaving(false)
      return
    }

    // Reset timer
    setTimer({
      isRunning: false,
      projectId: '',
      description: '',
      startTime: null,
      elapsed: 0,
    })
    setSaving(false)
  }

  const handleDiscard = () => {
    if (window.confirm('Are you sure you want to discard this time entry?')) {
      setTimer({
        isRunning: false,
        projectId: '',
        description: '',
        startTime: null,
        elapsed: 0,
      })
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">Timer</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Track your time in real-time
        </p>
      </div>

      {/* Timer Card */}
      <div className="card">
        {/* Timer Display */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-48 h-48 rounded-full bg-gradient-to-br from-primary-50 to-primary-100 mb-4">
            <div className="text-5xl font-bold text-primary-700 font-mono">
              {formatDuration(timer.elapsed)}
            </div>
          </div>
          {timer.isRunning && (
            <div className="flex items-center justify-center gap-2 text-sm text-neutral-600">
              <div className="h-2 w-2 rounded-full bg-error-500 animate-pulse"></div>
              Recording...
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 rounded-lg bg-error-50 border border-error-200 p-4">
            <p className="text-sm text-error-700">{error}</p>
          </div>
        )}

        {/* Project Selector */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            <FolderKanban className="inline h-4 w-4 mr-1" />
            Project *
          </label>
          <select
            value={timer.projectId}
            onChange={(e) => setTimer({ ...timer, projectId: e.target.value })}
            disabled={timer.isRunning}
            className="w-full rounded-lg border border-neutral-200 bg-white py-2.5 px-4 text-sm transition-colors focus:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-100 disabled:opacity-50"
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

        {/* Description */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            <FileText className="inline h-4 w-4 mr-1" />
            Description (Optional)
          </label>
          <textarea
            value={timer.description}
            onChange={(e) => setTimer({ ...timer, description: e.target.value })}
            disabled={timer.isRunning}
            placeholder="What are you working on?"
            rows={3}
            className="w-full rounded-lg border border-neutral-200 bg-white py-2.5 px-4 text-sm transition-colors focus:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-100 disabled:opacity-50"
          />
        </div>

        {/* Timer Controls */}
        <div className="flex gap-3">
          {!timer.isRunning && timer.elapsed === 0 && (
            <button
              onClick={handleStart}
              disabled={!timer.projectId || activeProjects.length === 0}
              className="btn flex-1 bg-primary-500 text-white hover:bg-primary-600 disabled:opacity-50"
            >
              <Play className="h-5 w-5" />
              Start Timer
            </button>
          )}

          {timer.isRunning && (
            <button
              onClick={handleStop}
              className="btn flex-1 bg-error-500 text-white hover:bg-error-600"
            >
              <Square className="h-5 w-5" />
              Stop Timer
            </button>
          )}

          {!timer.isRunning && timer.elapsed > 0 && (
            <>
              <button
                onClick={handleDiscard}
                disabled={saving}
                className="btn flex-1 border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50"
              >
                <X className="h-5 w-5" />
                Discard
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="btn flex-1 bg-success-500 text-white hover:bg-success-600 disabled:opacity-50"
              >
                <Save className="h-5 w-5" />
                {saving ? 'Saving...' : 'Save Entry'}
              </button>
            </>
          )}
        </div>

        {/* Project Info */}
        {selectedProject && (
          <div className="mt-6 pt-6 border-t border-neutral-100">
            <div className="flex items-center gap-3">
              <div
                className="h-4 w-4 rounded"
                style={{ backgroundColor: selectedProject.color }}
              />
              <div>
                <p className="text-sm font-medium text-neutral-900">
                  {selectedProject.name}
                </p>
                <p className="text-xs text-neutral-500">
                  {selectedProject.client?.name || 'No Client'} • {selectedProject.billable ? 'Billable' : 'Non-billable'}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Quick Tips */}
      <div className="card bg-primary-50 border border-primary-100">
        <div className="flex items-start gap-3">
          <Clock className="h-5 w-5 text-primary-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-primary-900 mb-1">Quick Tips</h3>
            <ul className="text-sm text-primary-700 space-y-1">
              <li>• Your timer continues running even if you close this page</li>
              <li>• Add a description to help track what you worked on</li>
              <li>• Time entries are automatically marked as billable based on the project</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
