import { useEffect, useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Clock, DollarSign, Calendar, TrendingUp, Edit, Share, Archive, ArchiveRestore, Trash2, Plus } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useWorkspace } from '../contexts/WorkspaceContext'
import { formatDurationShort, formatDate, formatTimeRange } from '../utils/time'
import type { Database } from '../types/database.types'

type Project = Database['public']['Tables']['projects']['Row']
type TimeEntry = Database['public']['Tables']['time_entries']['Row']

interface ProjectWithClient extends Project {
  client: {
    id: string
    name: string
    is_active: boolean
  } | null
}

interface TimeEntryData extends TimeEntry {
  user: {
    full_name: string | null
    email: string
  } | null
}

export function ProjectDetails() {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const { currentWorkspace } = useWorkspace()
  const [project, setProject] = useState<ProjectWithClient | null>(null)
  const [timeEntries, setTimeEntries] = useState<TimeEntryData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (projectId && currentWorkspace) {
      loadProjectData()
    }
  }, [projectId, currentWorkspace])

  const loadProjectData = async () => {
    if (!projectId || !currentWorkspace) return

    try {
      setLoading(true)
      setError('')

      // Fetch project
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select(`
          *,
          client:clients(id, name, is_active)
        `)
        .eq('id', projectId)
        .eq('workspace_id', currentWorkspace.id)
        .single()

      if (projectError) throw new Error('Project not found')
      setProject(projectData)

      // Fetch time entries for this project
      const { data: entriesData, error: entriesError } = await supabase
        .from('time_entries')
        .select(`
          *,
          user:profiles(full_name, email)
        `)
        .eq('project_id', projectId)
        .eq('workspace_id', currentWorkspace.id)
        .order('start_time', { ascending: false })

      if (entriesError) throw entriesError
      setTimeEntries(entriesData || [])
    } catch (err: any) {
      setError(err.message || 'Failed to load project')
      console.error('Error loading project:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleArchive = async () => {
    if (!project) return

    const confirmMessage = project.is_active
      ? 'Are you sure you want to archive this project?'
      : 'Are you sure you want to restore this project?'

    if (!window.confirm(confirmMessage)) return

    try {
      const { error } = await (supabase
        .from('projects') as any)
        .update({ is_active: !project.is_active })
        .eq('id', project.id)

      if (error) throw error
      await loadProjectData()
    } catch (err: any) {
      alert('Failed to update project: ' + err.message)
    }
  }

  const handleDelete = async () => {
    if (!project) return

    if (!window.confirm(`Are you sure you want to delete "${project.name}"?\n\nThis will also delete all associated time entries. This action cannot be undone.`)) {
      return
    }

    try {
      const { error } = await supabase.from('projects').delete().eq('id', project.id)
      if (error) throw error
      navigate('/projects')
    } catch (err: any) {
      alert('Failed to delete project: ' + err.message)
    }
  }

  // Calculate statistics
  const stats = useMemo(() => {
    const completedEntries = timeEntries.filter(e => e.end_time && e.duration)
    const totalDuration = completedEntries.reduce((sum, e) => sum + (e.duration || 0), 0)
    const billableDuration = completedEntries
      .filter(e => e.is_billable)
      .reduce((sum, e) => sum + (e.duration || 0), 0)

    // Calculate this week and month
    const now = new Date()
    const weekAgo = new Date(now)
    weekAgo.setDate(weekAgo.getDate() - 7)
    const monthAgo = new Date(now)
    monthAgo.setMonth(monthAgo.getMonth() - 1)

    const thisWeek = completedEntries
      .filter(e => new Date(e.start_time) >= weekAgo)
      .reduce((sum, e) => sum + (e.duration || 0), 0)

    const thisMonth = completedEntries
      .filter(e => new Date(e.start_time) >= monthAgo)
      .reduce((sum, e) => sum + (e.duration || 0), 0)

    const ongoingCount = timeEntries.filter(e => !e.end_time || !e.duration).length

    return {
      totalDuration,
      billableDuration,
      thisWeek,
      thisMonth,
      entryCount: completedEntries.length,
      ongoingCount,
    }
  }, [timeEntries])

  // Group entries by date
  const groupedEntries = useMemo(() => {
    const groups: { [key: string]: TimeEntryData[] } = {}

    timeEntries.forEach((entry) => {
      const dateKey = formatDate(entry.start_time)
      if (!groups[dateKey]) {
        groups[dateKey] = []
      }
      groups[dateKey].push(entry)
    })

    return Object.entries(groups).sort((a, b) =>
      new Date(b[1][0].start_time).getTime() - new Date(a[1][0].start_time).getTime()
    )
  }, [timeEntries])

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600 mx-auto"></div>
          <p className="text-sm text-neutral-600">Loading project...</p>
        </div>
      </div>
    )
  }

  if (error || !project) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => navigate('/projects')}
          className="flex items-center gap-2 text-sm text-neutral-600 hover:text-neutral-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Projects
        </button>
        <div className="card text-center py-12">
          <p className="text-error-600">{error || 'Project not found'}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <button
        onClick={() => navigate('/projects')}
        className="flex items-center gap-2 text-sm text-neutral-600 hover:text-neutral-900 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Projects
      </button>

      {/* Project Header */}
      <div className="card">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4 flex-1">
            <div
              className="h-16 w-16 rounded-lg flex-shrink-0"
              style={{ backgroundColor: project.color }}
            />
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-neutral-900">{project.name}</h1>
              {project.client && (
                <p className="text-neutral-600 mt-1">{project.client.name}</p>
              )}
              {project.description && (
                <p className="text-sm text-neutral-500 mt-3">{project.description}</p>
              )}
              <div className="mt-4 flex items-center gap-2 flex-wrap">
                <span
                  className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
                    project.is_active
                      ? 'bg-success-100 text-success-700'
                      : 'bg-neutral-100 text-neutral-600'
                  }`}
                >
                  {project.is_active ? 'Active' : 'Archived'}
                </span>
                {project.billable && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-success-50 px-3 py-1 text-xs font-medium text-success-700">
                    <DollarSign className="h-3 w-3" />
                    Billable
                  </span>
                )}
                {project.is_shared && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-info-50 px-3 py-1 text-xs font-medium text-info-700">
                    <Share className="h-3 w-3" />
                    Shared
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate(`/projects`)}
              className="btn border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50"
            >
              <Edit className="h-4 w-4" />
              Edit
            </button>
            <button
              onClick={handleToggleArchive}
              className="btn border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50"
            >
              {project.is_active ? <Archive className="h-4 w-4" /> : <ArchiveRestore className="h-4 w-4" />}
              {project.is_active ? 'Archive' : 'Restore'}
            </button>
            <button
              onClick={handleDelete}
              className="btn bg-error-500 text-white hover:bg-error-600"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Hours"
          value={formatDurationShort(stats.totalDuration)}
          icon={Clock}
          color="primary"
        />
        <StatCard
          title="This Week"
          value={formatDurationShort(stats.thisWeek)}
          icon={TrendingUp}
          color="success"
        />
        <StatCard
          title="This Month"
          value={formatDurationShort(stats.thisMonth)}
          icon={Calendar}
          color="info"
        />
        {project.billable && (
          <StatCard
            title="Billable Hours"
            value={formatDurationShort(stats.billableDuration)}
            icon={DollarSign}
            color="warning"
          />
        )}
      </div>

      {/* Time Entries */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-neutral-900">Time Entries</h2>
            <p className="text-sm text-neutral-500 mt-1">
              {stats.entryCount} completed entries
              {stats.ongoingCount > 0 && ` • ${stats.ongoingCount} ongoing`}
            </p>
          </div>
          <button
            onClick={() => navigate('/timesheet')}
            className="btn bg-primary-500 text-white hover:bg-primary-600"
          >
            <Plus className="h-4 w-4" />
            Add Entry
          </button>
        </div>

        {groupedEntries.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-neutral-200 rounded-lg">
            <Clock className="h-12 w-12 text-neutral-300 mx-auto mb-3" />
            <p className="text-neutral-500">No time entries recorded yet</p>
            <button
              onClick={() => navigate('/timesheet')}
              className="mt-4 btn bg-primary-500 text-white hover:bg-primary-600"
            >
              <Plus className="h-4 w-4" />
              Add First Entry
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {groupedEntries.map(([date, entries]) => {
              const dayTotal = entries
                .filter(e => e.duration)
                .reduce((sum, entry) => sum + (entry.duration || 0), 0)

              return (
                <div key={date}>
                  {/* Date Header */}
                  <div className="flex items-center justify-between mb-3 pb-2 border-b border-neutral-100">
                    <h3 className="text-sm font-semibold text-neutral-900">{date}</h3>
                    <span className="text-sm font-medium text-neutral-600">
                      {formatDurationShort(dayTotal)}
                    </span>
                  </div>

                  {/* Entries */}
                  <div className="space-y-2">
                    {entries.map((entry) => (
                      <div
                        key={entry.id}
                        className="flex items-center justify-between p-3 rounded-lg border border-neutral-100 hover:bg-neutral-50 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-sm text-neutral-600">
                              {entry.user?.full_name || entry.user?.email || 'Unknown User'}
                            </p>
                            {(!entry.end_time || !entry.duration) && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-warning-50 px-2 py-0.5 text-xs font-medium text-warning-700">
                                <div className="h-1.5 w-1.5 rounded-full bg-warning-500 animate-pulse"></div>
                                In Progress
                              </span>
                            )}
                            {entry.is_billable && entry.duration && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-success-50 px-2 py-0.5 text-xs font-medium text-success-700">
                                <DollarSign className="h-3 w-3" />
                                Billable
                              </span>
                            )}
                          </div>
                          {entry.description && (
                            <p className="text-sm text-neutral-700">{entry.description}</p>
                          )}
                        </div>

                        {/* Time Info */}
                        <div className="text-right flex-shrink-0 ml-4">
                          {entry.duration && entry.end_time ? (
                            <>
                              <p className="text-sm font-medium text-neutral-900">
                                {formatDurationShort(entry.duration)}
                              </p>
                              <p className="text-xs text-neutral-500">
                                {formatTimeRange(entry.start_time, entry.end_time)}
                              </p>
                            </>
                          ) : (
                            <>
                              <p className="text-sm font-medium text-warning-700">Ongoing</p>
                              <p className="text-xs text-neutral-500">
                                Started {new Date(entry.start_time).toLocaleTimeString('en-US', {
                                  hour: 'numeric',
                                  minute: '2-digit'
                                })}
                              </p>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

interface StatCardProps {
  title: string
  value: string
  icon: React.ElementType
  color: 'primary' | 'success' | 'warning' | 'info'
}

function StatCard({ title, value, icon: Icon, color }: StatCardProps) {
  const colorClasses = {
    primary: 'bg-primary-50 text-primary-600',
    success: 'bg-success-50 text-success-600',
    warning: 'bg-warning-50 text-warning-600',
    info: 'bg-info-50 text-info-600',
  }

  return (
    <div className="card">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-neutral-500">{title}</p>
          <p className="mt-2 text-3xl font-semibold text-neutral-900">{value}</p>
        </div>
        <div className={`rounded-lg p-3 ${colorClasses[color]}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  )
}
