import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Clock, DollarSign, FolderKanban, PlayCircle, Plus, TrendingUp, Calendar } from 'lucide-react'
import { useTimeEntries } from '../hooks/useTimeEntries'
import { useProjects } from '../hooks/useProjects'
import { useClients } from '../hooks/useClients'
import { formatDurationShort, isToday } from '../utils/time'

export function Dashboard() {
  const navigate = useNavigate()
  const { timeEntries, loading } = useTimeEntries()
  const { projects } = useProjects()
  const { clients } = useClients()

  // Calculate statistics
  const stats = useMemo(() => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const weekAgo = new Date(today)
    weekAgo.setDate(weekAgo.getDate() - 7)

    const todayEntries = timeEntries.filter(e => new Date(e.start_time) >= today)
    const weekEntries = timeEntries.filter(e => new Date(e.start_time) >= weekAgo)
    const ongoingEntries = timeEntries.filter(e => e.duration === 0)

    const todayDuration = todayEntries.reduce((sum, e) => sum + (e.duration || 0), 0)
    const weekDuration = weekEntries.reduce((sum, e) => sum + (e.duration || 0), 0)
    const billableDuration = weekEntries.filter(e => e.is_billable).reduce((sum, e) => sum + (e.duration || 0), 0)

    return {
      todayDuration,
      weekDuration,
      billableDuration,
      ongoingCount: ongoingEntries.length,
      activeProjects: projects.filter(p => p.is_active).length,
      activeClients: clients.filter(c => c.is_active).length,
    }
  }, [timeEntries, projects, clients])

  // Get recent entries (last 10)
  const recentEntries = useMemo(() => {
    return timeEntries.slice(0, 10)
  }, [timeEntries])

  // Get project breakdown for this week
  const projectBreakdown = useMemo(() => {
    const now = new Date()
    const weekAgo = new Date(now)
    weekAgo.setDate(weekAgo.getDate() - 7)

    const weekEntries = timeEntries.filter(e => new Date(e.start_time) >= weekAgo)

    const breakdown: { [key: string]: { name: string; duration: number; color: string } } = {}

    weekEntries.forEach(entry => {
      if (entry.project) {
        const key = entry.project.id
        if (!breakdown[key]) {
          breakdown[key] = {
            name: entry.project.name,
            duration: 0,
            color: entry.project.color,
          }
        }
        breakdown[key].duration += entry.duration || 0
      }
    })

    return Object.values(breakdown)
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 5) // Top 5 projects
  }, [timeEntries])

  const ongoingEntries = useMemo(() => {
    return timeEntries.filter(e => e.duration === 0)
  }, [timeEntries])

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">Dashboard</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Overview of your time tracking and activities
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => navigate('/timesheet')}
            className="btn border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50"
          >
            <Plus className="h-4 w-4" />
            Add Entry
          </button>
          <button
            onClick={() => navigate('/timer')}
            className="btn bg-primary-500 text-white hover:bg-primary-600"
          >
            <PlayCircle className="h-4 w-4" />
            Start Timer
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Today's Time"
          value={formatDurationShort(stats.todayDuration)}
          icon={Clock}
          color="primary"
        />
        <StatCard
          title="This Week"
          value={formatDurationShort(stats.weekDuration)}
          icon={TrendingUp}
          color="success"
        />
        <StatCard
          title="Billable (Week)"
          value={formatDurationShort(stats.billableDuration)}
          icon={DollarSign}
          color="warning"
        />
        <StatCard
          title="Active Projects"
          value={stats.activeProjects.toString()}
          icon={FolderKanban}
          color="info"
        />
      </div>

      {/* Ongoing Tasks */}
      {ongoingEntries.length > 0 && (
        <div className="card bg-warning-50 border border-warning-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-warning-900">
              Ongoing Tasks ({ongoingEntries.length})
            </h2>
          </div>
          <div className="space-y-3">
            {ongoingEntries.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center gap-4 rounded-lg bg-white border border-warning-200 p-3 cursor-pointer hover:border-warning-300 transition-colors"
                onClick={() => navigate('/timesheet')}
              >
                <div className="h-2 w-2 rounded-full bg-warning-500 animate-pulse"></div>
                <div
                  className="h-8 w-1 rounded-full"
                  style={{ backgroundColor: entry.project?.color || '#6B7280' }}
                />
                <div className="flex-1">
                  <p className="text-sm font-medium text-neutral-900">
                    {entry.project?.name || 'Unknown Project'}
                  </p>
                  <p className="text-xs text-neutral-500">
                    Started {new Date(entry.start_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                  </p>
                </div>
                <span className="text-sm font-medium text-warning-700">In Progress</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Activity */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-neutral-900">Recent Activity</h2>
            <button
              onClick={() => navigate('/timesheet')}
              className="text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              View All
            </button>
          </div>
          {recentEntries.length === 0 ? (
            <div className="text-center py-8 text-neutral-500 text-sm">
              No time entries yet. Start tracking your time!
            </div>
          ) : (
            <div className="space-y-3">
              {recentEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center gap-4 rounded-lg border border-neutral-100 p-3 transition-colors hover:bg-neutral-50 cursor-pointer"
                  onClick={() => navigate('/timesheet')}
                >
                  <div
                    className="h-8 w-1 rounded-full"
                    style={{ backgroundColor: entry.project?.color || '#6B7280' }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-neutral-900 truncate">
                      {entry.project?.name || 'Unknown Project'}
                    </p>
                    <p className="text-xs text-neutral-500">
                      {entry.project?.client?.name || 'No Client'}
                      {entry.description && ` • ${entry.description}`}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    {entry.duration === 0 ? (
                      <span className="text-xs text-warning-700 font-medium">Ongoing</span>
                    ) : (
                      <>
                        <p className="text-sm font-medium text-neutral-900">
                          {formatDurationShort(entry.duration || 0)}
                        </p>
                        <p className="text-xs text-neutral-500">
                          {isToday(entry.start_time) ? 'Today' : new Date(entry.start_time).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </p>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Project Breakdown */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-neutral-900">This Week by Project</h2>
            <button
              onClick={() => navigate('/projects')}
              className="text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              View Projects
            </button>
          </div>
          {projectBreakdown.length === 0 ? (
            <div className="text-center py-8 text-neutral-500 text-sm">
              No project activity this week
            </div>
          ) : (
            <div className="space-y-4">
              {projectBreakdown.map((project, index) => {
                const totalWeek = stats.weekDuration
                const percentage = totalWeek > 0 ? Math.round((project.duration / totalWeek) * 100) : 0

                return (
                  <div key={index}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div
                          className="h-3 w-3 rounded"
                          style={{ backgroundColor: project.color }}
                        />
                        <span className="text-sm font-medium text-neutral-900">
                          {project.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-neutral-600">
                          {formatDurationShort(project.duration)}
                        </span>
                        <span className="text-xs text-neutral-500 w-10 text-right">
                          {percentage}%
                        </span>
                      </div>
                    </div>
                    <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${percentage}%`,
                          backgroundColor: project.color,
                        }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-6 md:grid-cols-3">
        <div className="card">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100">
              <Calendar className="h-5 w-5 text-primary-600" />
            </div>
            <div>
              <p className="text-sm text-neutral-600">Total Entries</p>
              <p className="text-xl font-semibold text-neutral-900">{timeEntries.length}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success-100">
              <FolderKanban className="h-5 w-5 text-success-600" />
            </div>
            <div>
              <p className="text-sm text-neutral-600">Active Clients</p>
              <p className="text-xl font-semibold text-neutral-900">{stats.activeClients}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning-100">
              <Clock className="h-5 w-5 text-warning-600" />
            </div>
            <div>
              <p className="text-sm text-neutral-600">Ongoing Tasks</p>
              <p className="text-xl font-semibold text-neutral-900">{stats.ongoingCount}</p>
            </div>
          </div>
        </div>
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
    <div className="card-hover">
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
