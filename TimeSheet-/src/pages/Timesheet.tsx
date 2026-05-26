import { useState, useMemo } from 'react'
import { Plus, Search, MoreVertical, Edit, Trash2, Calendar, Clock, DollarSign } from 'lucide-react'
import { useTimeEntries } from '../hooks/useTimeEntries'
import { useProjects } from '../hooks/useProjects'
import { useClients } from '../hooks/useClients'
import { TimeEntryModal } from '../components/timesheet/TimeEntryModal'
import { formatDurationShort, formatTimeRange, formatDate, getRelativeDateLabel } from '../utils/time'
import type { Database } from '../types/database.types'

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

type DateFilter = 'today' | 'yesterday' | 'week' | 'month' | 'all'

export function Timesheet() {
  const { timeEntries, loading, createTimeEntry, updateTimeEntry, deleteTimeEntry } = useTimeEntries()
  const { projects } = useProjects()
  const { clients } = useClients()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create')
  const [selectedEntry, setSelectedEntry] = useState<TimeEntryWithProject | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [dateFilter, setDateFilter] = useState<DateFilter>('week')
  const [filterProjectId, setFilterProjectId] = useState<string>('all')
  const [filterClientId, setFilterClientId] = useState<string>('all')
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)

  const handleCreateEntry = async (data: TimeEntryFormData) => {
    const { error } = await createTimeEntry(data)
    return { error }
  }

  const handleUpdateEntry = async (data: TimeEntryFormData) => {
    if (!selectedEntry) return { error: 'No entry selected' }
    const { error } = await updateTimeEntry(selectedEntry.id, data)
    return { error }
  }

  const handleDelete = async (entry: TimeEntryWithProject) => {
    if (window.confirm('Are you sure you want to delete this time entry?')) {
      await deleteTimeEntry(entry.id)
    }
    setActiveDropdown(null)
  }

  const openCreateModal = () => {
    setSelectedEntry(null)
    setModalMode('create')
    setIsModalOpen(true)
  }

  const openEditModal = (entry: TimeEntryWithProject) => {
    setSelectedEntry(entry)
    setModalMode('edit')
    setIsModalOpen(true)
    setActiveDropdown(null)
  }

  // Filter time entries
  const filteredEntries = useMemo(() => {
    return timeEntries.filter((entry) => {
      // Date filter
      const entryDate = new Date(entry.start_time)
      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)
      const weekAgo = new Date(today)
      weekAgo.setDate(weekAgo.getDate() - 7)
      const monthAgo = new Date(today)
      monthAgo.setMonth(monthAgo.getMonth() - 1)

      let matchesDate = true
      if (dateFilter === 'today') {
        matchesDate = entryDate >= today
      } else if (dateFilter === 'yesterday') {
        matchesDate = entryDate >= yesterday && entryDate < today
      } else if (dateFilter === 'week') {
        matchesDate = entryDate >= weekAgo
      } else if (dateFilter === 'month') {
        matchesDate = entryDate >= monthAgo
      }

      // Search filter
      const matchesSearch =
        entry.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.project?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.project?.client?.name.toLowerCase().includes(searchQuery.toLowerCase())

      // Project filter
      const matchesProject = filterProjectId === 'all' || entry.project_id === filterProjectId

      // Client filter
      const matchesClient = filterClientId === 'all' || entry.project?.client?.id === filterClientId

      return matchesDate && matchesSearch && matchesProject && matchesClient
    })
  }, [timeEntries, dateFilter, searchQuery, filterProjectId, filterClientId])

  // Group entries by date
  const groupedEntries = useMemo(() => {
    const groups: { [key: string]: TimeEntryWithProject[] } = {}

    filteredEntries.forEach((entry) => {
      const dateKey = formatDate(entry.start_time)
      if (!groups[dateKey]) {
        groups[dateKey] = []
      }
      groups[dateKey].push(entry)
    })

    return Object.entries(groups).sort((a, b) =>
      new Date(b[1][0].start_time).getTime() - new Date(a[1][0].start_time).getTime()
    )
  }, [filteredEntries])

  // Calculate totals
  const totalDuration = filteredEntries.reduce((sum, entry) => sum + (entry.duration || 0), 0)
  const billableDuration = filteredEntries.filter(e => e.is_billable).reduce((sum, entry) => sum + (entry.duration || 0), 0)

  const activeProjects = projects.filter((p) => p.is_active)
  const activeClients = clients.filter((c) => c.is_active)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">Timesheet</h1>
          <p className="mt-1 text-sm text-neutral-500">
            View and manage your time entries
          </p>
        </div>
        <button
          onClick={openCreateModal}
          disabled={activeProjects.length === 0}
          className="btn bg-primary-500 text-white hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus className="h-4 w-4" />
          Add Entry
        </button>
      </div>

      {activeProjects.length === 0 && (
        <div className="card bg-warning-50 border border-warning-200">
          <p className="text-sm text-warning-900">
            ⚠️ You need to create at least one project before adding time entries.
          </p>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        {/* Date Filter */}
        <div className="flex gap-2">
          {(['today', 'yesterday', 'week', 'month', 'all'] as DateFilter[]).map((filter) => (
            <button
              key={filter}
              onClick={() => setDateFilter(filter)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors capitalize ${
                dateFilter === filter
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-neutral-600 hover:bg-neutral-50'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>

        {/* Client Filter */}
        <select
          value={filterClientId}
          onChange={(e) => setFilterClientId(e.target.value)}
          className="rounded-lg border border-neutral-200 bg-white py-2 px-3 text-sm transition-colors focus:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-100"
        >
          <option value="all">All Clients</option>
          {activeClients.map((client) => (
            <option key={client.id} value={client.id}>
              {client.name}
            </option>
          ))}
        </select>

        {/* Project Filter */}
        <select
          value={filterProjectId}
          onChange={(e) => setFilterProjectId(e.target.value)}
          className="rounded-lg border border-neutral-200 bg-white py-2 px-3 text-sm transition-colors focus:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-100"
        >
          <option value="all">All Projects</option>
          {activeProjects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </select>

        {/* Search */}
        <div className="relative flex-1 max-w-xs ml-auto">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder="Search entries..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-neutral-200 bg-white py-2 pl-10 pr-4 text-sm transition-colors focus:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-100"
          />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100">
              <Clock className="h-5 w-5 text-primary-600" />
            </div>
            <div>
              <p className="text-sm text-neutral-600">Total Time</p>
              <p className="text-xl font-semibold text-neutral-900">{formatDurationShort(totalDuration)}</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success-100">
              <DollarSign className="h-5 w-5 text-success-600" />
            </div>
            <div>
              <p className="text-sm text-neutral-600">Billable Time</p>
              <p className="text-xl font-semibold text-neutral-900">{formatDurationShort(billableDuration)}</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-neutral-100">
              <Calendar className="h-5 w-5 text-neutral-600" />
            </div>
            <div>
              <p className="text-sm text-neutral-600">Entries</p>
              <p className="text-xl font-semibold text-neutral-900">{filteredEntries.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Time Entries List */}
      {loading ? (
        <div className="card text-center py-12">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600 mx-auto"></div>
          <p className="text-sm text-neutral-600">Loading entries...</p>
        </div>
      ) : groupedEntries.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-neutral-500">
            {searchQuery || filterProjectId !== 'all' || filterClientId !== 'all'
              ? 'No entries found matching your filters.'
              : 'No time entries yet. Start tracking your time!'}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {groupedEntries.map(([date, entries]) => {
            const dayTotal = entries.reduce((sum, entry) => sum + (entry.duration || 0), 0)

            return (
              <div key={date} className="card">
                {/* Date Header */}
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-neutral-100">
                  <h3 className="text-lg font-semibold text-neutral-900">
                    {getRelativeDateLabel(entries[0].start_time)}
                  </h3>
                  <span className="text-sm font-medium text-neutral-600">
                    {formatDurationShort(dayTotal)}
                  </span>
                </div>

                {/* Entries */}
                <div className="space-y-3">
                  {entries.map((entry) => (
                    <div
                      key={entry.id}
                      className="flex items-center gap-4 rounded-lg border border-neutral-100 p-4 transition-colors hover:bg-neutral-50"
                    >
                      {/* Project Color */}
                      <div
                        className="h-10 w-1 rounded-full flex-shrink-0"
                        style={{ backgroundColor: entry.project?.color || '#6B7280' }}
                      />

                      {/* Entry Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-medium text-neutral-900">
                            {entry.project?.name || 'Unknown Project'}
                          </p>
                          {entry.duration === 0 || entry.duration === null ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-warning-50 px-2 py-0.5 text-xs font-medium text-warning-700">
                              <div className="h-1.5 w-1.5 rounded-full bg-warning-500 animate-pulse"></div>
                              In Progress
                            </span>
                          ) : entry.is_billable ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-success-50 px-2 py-0.5 text-xs font-medium text-success-700">
                              <DollarSign className="h-3 w-3" />
                              Billable
                            </span>
                          ) : null}
                        </div>
                        <p className="text-xs text-neutral-500">
                          {entry.project?.client?.name || 'No Client'}
                        </p>
                        {entry.description && (
                          <p className="mt-2 text-sm text-neutral-700">{entry.description}</p>
                        )}
                      </div>

                      {/* Time Info */}
                      <div className="text-right flex-shrink-0">
                        {entry.duration === 0 || entry.duration === null ? (
                          <>
                            <p className="text-sm font-medium text-warning-700">
                              Ongoing
                            </p>
                            <p className="text-xs text-neutral-500">
                              Started {new Date(entry.start_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                            </p>
                          </>
                        ) : (
                          <>
                            <p className="text-sm font-medium text-neutral-900">
                              {formatDurationShort(entry.duration)}
                            </p>
                            <p className="text-xs text-neutral-500">
                              {entry.end_time && formatTimeRange(entry.start_time, entry.end_time)}
                            </p>
                          </>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="relative flex-shrink-0">
                        <button
                          onClick={() => setActiveDropdown(activeDropdown === entry.id ? null : entry.id)}
                          className="rounded-lg p-2 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>

                        {activeDropdown === entry.id && (
                          <>
                            <div
                              className="fixed inset-0 z-10"
                              onClick={() => setActiveDropdown(null)}
                            />
                            <div className="absolute right-0 top-full mt-2 w-40 rounded-lg border border-neutral-200 bg-white shadow-lg z-20">
                              <div className="p-2">
                                <button
                                  onClick={() => openEditModal(entry)}
                                  className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-neutral-700 transition-colors hover:bg-neutral-50"
                                >
                                  <Edit className="h-4 w-4" />
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDelete(entry)}
                                  className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-error-600 transition-colors hover:bg-error-50"
                                >
                                  <Trash2 className="h-4 w-4" />
                                  Delete
                                </button>
                              </div>
                            </div>
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

      {/* Time Entry Modal */}
      <TimeEntryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={modalMode === 'create' ? handleCreateEntry : handleUpdateEntry}
        timeEntry={selectedEntry}
        mode={modalMode}
      />
    </div>
  )
}
