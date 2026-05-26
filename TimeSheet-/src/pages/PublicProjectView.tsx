import { useEffect, useState, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { Clock, DollarSign, Calendar, Download, Lock, Eye, TrendingUp } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { formatDurationShort, formatDate } from '../utils/time'

interface ProjectData {
  id: string
  name: string
  description: string | null
  color: string
  billable: boolean
  client: {
    name: string
  } | null
  is_shared: boolean
  share_password: string | null
}

interface TimeEntryData {
  id: string
  description: string | null
  start_time: string
  end_time: string | null
  duration: number | null
  is_billable: boolean
  created_at: string
}

export function PublicProjectView() {
  const { token } = useParams<{ token: string }>()
  const [project, setProject] = useState<ProjectData | null>(null)
  const [timeEntries, setTimeEntries] = useState<TimeEntryData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [password, setPassword] = useState('')
  const [needsPassword, setNeedsPassword] = useState(false)
  const [passwordError, setPasswordError] = useState('')

  useEffect(() => {
    if (token) {
      loadProjectData()
    }
  }, [token])

  const loadProjectData = async () => {
    if (!token) {
      setError('Invalid share link')
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError('')

      // Track view
      await (supabase as any).rpc('track_project_share_view', { token })

      // Fetch project
      const { data: projectData, error: projectError } = await (supabase
        .from('projects')
        .select(`
          id,
          name,
          description,
          color,
          billable,
          is_shared,
          share_password,
          client:clients(name)
        `)
        .eq('share_token', token)
        .single()) as { data: any; error: any }

      if (projectError) throw new Error('Project not found or link is invalid')
      if (!projectData.is_shared) throw new Error('This project is no longer shared')

      // Check password
      if (projectData.share_password && !password) {
        setNeedsPassword(true)
        setProject(projectData)
        setLoading(false)
        return
      }

      if (projectData.share_password && password !== projectData.share_password) {
        setPasswordError('Incorrect password')
        setNeedsPassword(true)
        setLoading(false)
        return
      }

      setProject(projectData)
      setNeedsPassword(false)

      // Fetch time entries
      const { data: entriesData, error: entriesError } = await supabase
        .from('time_entries')
        .select(`
          id,
          description,
          start_time,
          end_time,
          duration,
          is_billable,
          created_at
        `)
        .eq('project_id', projectData.id)
        .not('end_time', 'is', null)
        .order('start_time', { ascending: false })

      if (entriesError) throw entriesError

      setTimeEntries(entriesData || [])
    } catch (err: any) {
      setError(err.message || 'Failed to load project')
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordError('')
    loadProjectData()
  }

  // Calculate statistics
  const stats = useMemo(() => {
    const totalDuration = timeEntries.reduce((sum, e) => sum + (e.duration || 0), 0)
    const billableDuration = timeEntries.filter(e => e.is_billable).reduce((sum, e) => sum + (e.duration || 0), 0)

    // Calculate this week and month
    const now = new Date()
    const weekAgo = new Date(now)
    weekAgo.setDate(weekAgo.getDate() - 7)
    const monthAgo = new Date(now)
    monthAgo.setMonth(monthAgo.getMonth() - 1)

    const thisWeek = timeEntries
      .filter(e => new Date(e.start_time) >= weekAgo)
      .reduce((sum, e) => sum + (e.duration || 0), 0)

    const thisMonth = timeEntries
      .filter(e => new Date(e.start_time) >= monthAgo)
      .reduce((sum, e) => sum + (e.duration || 0), 0)

    return {
      totalDuration,
      billableDuration,
      thisWeek,
      thisMonth,
      entryCount: timeEntries.length,
    }
  }, [timeEntries])

  const exportToCSV = () => {
    const headers = ['Date', 'Description', 'Hours', 'Billable']
    const rows = timeEntries.map(entry => [
      formatDate(entry.start_time),
      entry.description || 'No description',
      formatDurationShort(entry.duration || 0),
      entry.is_billable ? 'Yes' : 'No',
    ])

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${project?.name || 'project'}-timesheet.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Password screen
  if (needsPassword) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-neutral-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-lg shadow-xl p-8">
            <div className="flex justify-center mb-6">
              <div className="h-16 w-16 bg-primary-100 rounded-full flex items-center justify-center">
                <Lock className="h-8 w-8 text-primary-600" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-center text-neutral-900 mb-2">
              Password Protected
            </h1>
            <p className="text-center text-neutral-600 mb-6">
              This project requires a password to view
            </p>

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              {passwordError && (
                <div className="bg-error-50 border border-error-200 rounded-lg p-3 text-sm text-error-700">
                  {passwordError}
                </div>
              )}

              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                required
                className="w-full rounded-lg border border-neutral-200 px-4 py-3 focus:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-100"
              />

              <button
                type="submit"
                disabled={loading}
                className="w-full btn bg-primary-500 text-white hover:bg-primary-600 py-3"
              >
                {loading ? 'Verifying...' : 'Access Project'}
              </button>
            </form>
          </div>
        </div>
      </div>
    )
  }

  // Loading screen
  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600 mx-auto mb-4"></div>
          <p className="text-neutral-600">Loading project...</p>
        </div>
      </div>
    )
  }

  // Error screen
  if (error || !project) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="h-16 w-16 bg-error-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Eye className="h-8 w-8 text-error-600" />
          </div>
          <h1 className="text-2xl font-bold text-neutral-900 mb-2">Unable to Load Project</h1>
          <p className="text-neutral-600 mb-4">{error || 'Project not found'}</p>
        </div>
      </div>
    )
  }

  // Main view
  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <header className="bg-white border-b border-neutral-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-primary-500 rounded-lg flex items-center justify-center">
                <Clock className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-neutral-900">Timesheet</h1>
                <p className="text-xs text-neutral-500">Client Portal</p>
              </div>
            </div>
            <button
              onClick={exportToCSV}
              className="btn bg-primary-500 text-white hover:bg-primary-600"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Project Header */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-neutral-900">{project.name}</h2>
              {project.client && (
                <p className="text-neutral-600 mt-1">{project.client.name}</p>
              )}
              {project.description && (
                <p className="text-sm text-neutral-500 mt-2">{project.description}</p>
              )}
            </div>
            <div
              className="h-12 w-12 rounded-lg"
              style={{ backgroundColor: project.color }}
            />
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
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-neutral-200">
            <h3 className="text-lg font-semibold text-neutral-900">Time Entries</h3>
            <p className="text-sm text-neutral-500 mt-1">
              {stats.entryCount} total entries
            </p>
          </div>

          {timeEntries.length === 0 ? (
            <div className="px-6 py-12 text-center text-neutral-500">
              No time entries recorded yet
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-neutral-50 border-b border-neutral-200">
                    <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-700">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-700">
                      Description
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-neutral-700">
                      Hours
                    </th>
                    {project.billable && (
                      <th className="px-6 py-3 text-center text-xs font-semibold text-neutral-700">
                        Billable
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {timeEntries.map((entry) => (
                    <tr key={entry.id} className="hover:bg-neutral-50">
                      <td className="px-6 py-4 text-sm text-neutral-900">
                        {formatDate(entry.start_time)}
                      </td>
                      <td className="px-6 py-4 text-sm text-neutral-600">
                        {entry.description || 'No description'}
                      </td>
                      <td className="px-6 py-4 text-sm text-neutral-900 text-right font-medium">
                        {formatDurationShort(entry.duration || 0)}
                      </td>
                      {project.billable && (
                        <td className="px-6 py-4 text-center">
                          {entry.is_billable ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-success-100 text-success-700">
                              Yes
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-neutral-100 text-neutral-700">
                              No
                            </span>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-neutral-50 border-t-2 border-neutral-300 font-semibold">
                    <td className="px-6 py-4 text-sm text-neutral-900">Total</td>
                    <td className="px-6 py-4"></td>
                    <td className="px-6 py-4 text-sm text-neutral-900 text-right">
                      {formatDurationShort(stats.totalDuration)}
                    </td>
                    {project.billable && <td></td>}
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center py-8">
          <p className="text-sm text-neutral-500">
            Powered by Timesheet • This is a read-only view
          </p>
        </div>
      </main>
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
    <div className="bg-white rounded-lg shadow p-6">
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
