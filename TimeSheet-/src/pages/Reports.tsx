import { useState, useMemo } from 'react'
import { Download, Calendar, TrendingUp, DollarSign, Clock } from 'lucide-react'
import { useTimeEntries } from '../hooks/useTimeEntries'
import { useProjects } from '../hooks/useProjects'
import { useClients } from '../hooks/useClients'
import { formatDurationShort, formatDate } from '../utils/time'

type DateRange = 'week' | 'month' | 'year' | 'custom'
type GroupBy = 'client' | 'project' | 'date'

export function Reports() {
  const { timeEntries, loading } = useTimeEntries()
  const { projects } = useProjects()
  const { clients } = useClients()

  const [dateRange, setDateRange] = useState<DateRange>('month')
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')
  const [groupBy, setGroupBy] = useState<GroupBy>('project')
  const [filterClientId, setFilterClientId] = useState<string>('all')
  const [filterProjectId, setFilterProjectId] = useState<string>('all')

  // Calculate date range
  const { startDate, endDate } = useMemo(() => {
    const now = new Date()
    let start = new Date()
    let end = new Date()

    if (dateRange === 'week') {
      start = new Date(now)
      start.setDate(now.getDate() - 7)
    } else if (dateRange === 'month') {
      start = new Date(now)
      start.setMonth(now.getMonth() - 1)
    } else if (dateRange === 'year') {
      start = new Date(now)
      start.setFullYear(now.getFullYear() - 1)
    } else if (dateRange === 'custom') {
      if (customStartDate) start = new Date(customStartDate)
      if (customEndDate) end = new Date(customEndDate)
    }

    return { startDate: start, endDate: end }
  }, [dateRange, customStartDate, customEndDate])

  // Filter entries
  const filteredEntries = useMemo(() => {
    return timeEntries.filter((entry) => {
      const entryDate = new Date(entry.start_time)
      const matchesDate = entryDate >= startDate && entryDate <= endDate
      const matchesClient = filterClientId === 'all' || entry.project?.client?.id === filterClientId
      const matchesProject = filterProjectId === 'all' || entry.project_id === filterProjectId
      const isComplete = entry.duration !== null && entry.duration > 0

      return matchesDate && matchesClient && matchesProject && isComplete
    })
  }, [timeEntries, startDate, endDate, filterClientId, filterProjectId])

  // Calculate statistics
  const stats = useMemo(() => {
    const totalDuration = filteredEntries.reduce((sum, e) => sum + (e.duration || 0), 0)
    const billableDuration = filteredEntries.filter(e => e.is_billable).reduce((sum, e) => sum + (e.duration || 0), 0)
    const nonBillableDuration = totalDuration - billableDuration
    const entriesCount = filteredEntries.length

    return {
      totalDuration,
      billableDuration,
      nonBillableDuration,
      entriesCount,
    }
  }, [filteredEntries])

  // Group data
  const groupedData = useMemo(() => {
    const groups: { [key: string]: { name: string; duration: number; billable: number; entries: number; color?: string } } = {}

    filteredEntries.forEach((entry) => {
      let key = ''
      let name = ''
      let color = ''

      if (groupBy === 'client') {
        key = entry.project?.client?.id || 'no-client'
        name = entry.project?.client?.name || 'No Client'
      } else if (groupBy === 'project') {
        key = entry.project?.id || 'no-project'
        name = entry.project?.name || 'No Project'
        color = entry.project?.color || '#6B7280'
      } else if (groupBy === 'date') {
        key = formatDate(entry.start_time)
        name = formatDate(entry.start_time)
      }

      if (!groups[key]) {
        groups[key] = {
          name,
          duration: 0,
          billable: 0,
          entries: 0,
          color,
        }
      }

      groups[key].duration += entry.duration || 0
      groups[key].entries += 1
      if (entry.is_billable) {
        groups[key].billable += entry.duration || 0
      }
    })

    return Object.values(groups).sort((a, b) => b.duration - a.duration)
  }, [filteredEntries, groupBy])

  // Export to CSV
  const handleExport = () => {
    const headers = ['Name', 'Total Time', 'Billable Time', 'Non-Billable Time', 'Entries']
    const rows = groupedData.map(item => [
      item.name,
      formatDurationShort(item.duration),
      formatDurationShort(item.billable),
      formatDurationShort(item.duration - item.billable),
      item.entries.toString(),
    ])

    const csv = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `timesheet-report-${formatDate(startDate.toISOString())}-to-${formatDate(endDate.toISOString())}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const activeClients = clients.filter(c => c.is_active)
  const activeProjects = projects.filter(p => p.is_active)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">Reports</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Analytics and insights for your time tracking
          </p>
        </div>
        <button
          onClick={handleExport}
          disabled={groupedData.length === 0}
          className="btn bg-primary-500 text-white hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download className="h-4 w-4" />
          Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="card">
        <h3 className="text-sm font-semibold text-neutral-900 mb-4">Filters</h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Date Range */}
          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-2">
              Date Range
            </label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as DateRange)}
              className="w-full rounded-lg border border-neutral-200 bg-white py-2 px-3 text-sm transition-colors focus:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-100"
            >
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
              <option value="year">Last Year</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>

          {/* Group By */}
          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-2">
              Group By
            </label>
            <select
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value as GroupBy)}
              className="w-full rounded-lg border border-neutral-200 bg-white py-2 px-3 text-sm transition-colors focus:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-100"
            >
              <option value="project">Project</option>
              <option value="client">Client</option>
              <option value="date">Date</option>
            </select>
          </div>

          {/* Client Filter */}
          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-2">
              Client
            </label>
            <select
              value={filterClientId}
              onChange={(e) => setFilterClientId(e.target.value)}
              className="w-full rounded-lg border border-neutral-200 bg-white py-2 px-3 text-sm transition-colors focus:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-100"
            >
              <option value="all">All Clients</option>
              {activeClients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </select>
          </div>

          {/* Project Filter */}
          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-2">
              Project
            </label>
            <select
              value={filterProjectId}
              onChange={(e) => setFilterProjectId(e.target.value)}
              className="w-full rounded-lg border border-neutral-200 bg-white py-2 px-3 text-sm transition-colors focus:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-100"
            >
              <option value="all">All Projects</option>
              {activeProjects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Custom Date Range */}
        {dateRange === 'custom' && (
          <div className="grid gap-4 md:grid-cols-2 mt-4 pt-4 border-t border-neutral-100">
            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="w-full rounded-lg border border-neutral-200 bg-white py-2 px-3 text-sm transition-colors focus:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-100"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-2">
                End Date
              </label>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="w-full rounded-lg border border-neutral-200 bg-white py-2 px-3 text-sm transition-colors focus:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-100"
              />
            </div>
          </div>
        )}
      </div>

      {/* Summary Stats */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100">
              <Clock className="h-5 w-5 text-primary-600" />
            </div>
            <div>
              <p className="text-xs text-neutral-600">Total Time</p>
              <p className="text-lg font-semibold text-neutral-900">
                {formatDurationShort(stats.totalDuration)}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success-100">
              <DollarSign className="h-5 w-5 text-success-600" />
            </div>
            <div>
              <p className="text-xs text-neutral-600">Billable</p>
              <p className="text-lg font-semibold text-neutral-900">
                {formatDurationShort(stats.billableDuration)}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-neutral-100">
              <TrendingUp className="h-5 w-5 text-neutral-600" />
            </div>
            <div>
              <p className="text-xs text-neutral-600">Non-Billable</p>
              <p className="text-lg font-semibold text-neutral-900">
                {formatDurationShort(stats.nonBillableDuration)}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-info-100">
              <Calendar className="h-5 w-5 text-info-600" />
            </div>
            <div>
              <p className="text-xs text-neutral-600">Entries</p>
              <p className="text-lg font-semibold text-neutral-900">{stats.entriesCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Report Table */}
      {loading ? (
        <div className="card text-center py-12">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600 mx-auto"></div>
          <p className="text-sm text-neutral-600">Loading report...</p>
        </div>
      ) : groupedData.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-neutral-500">
            No data available for the selected filters.
          </p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-neutral-900">
              Breakdown by {groupBy.charAt(0).toUpperCase() + groupBy.slice(1)}
            </h3>
            <p className="text-sm text-neutral-500">
              {formatDate(startDate.toISOString())} - {formatDate(endDate.toISOString())}
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-50">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-700">
                    {groupBy === 'client' ? 'Client' : groupBy === 'project' ? 'Project' : 'Date'}
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-neutral-700">
                    Total Time
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-neutral-700">
                    Billable
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-neutral-700">
                    Non-Billable
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-neutral-700">
                    Entries
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-neutral-700">
                    % of Total
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {groupedData.map((item, index) => {
                  const percentage = stats.totalDuration > 0
                    ? Math.round((item.duration / stats.totalDuration) * 100)
                    : 0

                  return (
                    <tr key={index} className="hover:bg-neutral-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {item.color && (
                            <div
                              className="h-3 w-3 rounded"
                              style={{ backgroundColor: item.color }}
                            />
                          )}
                          <span className="text-sm font-medium text-neutral-900">
                            {item.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-medium text-neutral-900">
                        {formatDurationShort(item.duration)}
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-success-700">
                        {formatDurationShort(item.billable)}
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-neutral-600">
                        {formatDurationShort(item.duration - item.billable)}
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-neutral-600">
                        {item.entries}
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-medium text-neutral-900">
                        {percentage}%
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-neutral-300 bg-neutral-50 font-semibold">
                  <td className="px-4 py-3 text-sm text-neutral-900">Total</td>
                  <td className="px-4 py-3 text-right text-sm text-neutral-900">
                    {formatDurationShort(stats.totalDuration)}
                  </td>
                  <td className="px-4 py-3 text-right text-sm text-success-700">
                    {formatDurationShort(stats.billableDuration)}
                  </td>
                  <td className="px-4 py-3 text-right text-sm text-neutral-600">
                    {formatDurationShort(stats.nonBillableDuration)}
                  </td>
                  <td className="px-4 py-3 text-right text-sm text-neutral-600">
                    {stats.entriesCount}
                  </td>
                  <td className="px-4 py-3 text-right text-sm text-neutral-900">100%</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
