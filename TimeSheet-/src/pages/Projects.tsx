import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, MoreVertical, Edit, Archive, Trash2, ArchiveRestore, DollarSign, Share } from 'lucide-react'
import { useProjects } from '../hooks/useProjects'
import { useClients } from '../hooks/useClients'
import { ProjectModal } from '../components/projects/ProjectModal'
import { ShareProjectModal } from '../components/projects/ShareProjectModal'
import type { Database } from '../types/database.types'

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

export function Projects() {
  const navigate = useNavigate()
  const { projects, loading, createProject, updateProject, deleteProject, toggleProjectActive, refreshProjects } = useProjects()
  const { clients } = useClients()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create')
  const [selectedProject, setSelectedProject] = useState<ProjectWithClient | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showArchived, setShowArchived] = useState(false)
  const [filterClientId, setFilterClientId] = useState<string>('all')
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)
  const [projectToShare, setProjectToShare] = useState<ProjectWithClient | null>(null)

  const handleCreateProject = async (data: ProjectFormData) => {
    const { error } = await createProject(data)
    return { error }
  }

  const handleUpdateProject = async (data: ProjectFormData) => {
    if (!selectedProject) return { error: 'No project selected' }
    const { error } = await updateProject(selectedProject.id, data)
    return { error }
  }

  const handleDelete = async (project: ProjectWithClient) => {
    if (window.confirm(`Are you sure you want to delete "${project.name}"?\n\nThis will also delete all associated time entries. This action cannot be undone.`)) {
      await deleteProject(project.id)
    }
    setActiveDropdown(null)
  }

  const handleToggleArchive = async (project: ProjectWithClient) => {
    await toggleProjectActive(project.id, !project.is_active)
    setActiveDropdown(null)
  }

  const openCreateModal = () => {
    setSelectedProject(null)
    setModalMode('create')
    setIsModalOpen(true)
  }

  const openEditModal = (project: ProjectWithClient) => {
    setSelectedProject(project)
    setModalMode('edit')
    setIsModalOpen(true)
    setActiveDropdown(null)
  }

  const openShareModal = (project: ProjectWithClient) => {
    setProjectToShare(project)
    setIsShareModalOpen(true)
    setActiveDropdown(null)
  }

  const handleShareModalUpdate = () => {
    // Refresh projects to get updated share data
    refreshProjects()
  }

  // Filter projects
  const filteredProjects = projects.filter((project) => {
    const matchesSearch = project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.client?.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesArchived = showArchived ? !project.is_active : project.is_active
    const matchesClient = filterClientId === 'all' || project.client_id === filterClientId
    return matchesSearch && matchesArchived && matchesClient
  })

  const activeCount = projects.filter((p) => p.is_active).length
  const archivedCount = projects.filter((p) => !p.is_active).length
  const activeClients = clients.filter((c) => c.is_active)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">Projects</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Manage your projects and tasks
          </p>
        </div>
        <button
          onClick={openCreateModal}
          disabled={activeClients.length === 0}
          className="btn bg-primary-500 text-white hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus className="h-4 w-4" />
          Add Project
        </button>
      </div>

      {activeClients.length === 0 && (
        <div className="card bg-warning-50 border border-warning-200">
          <p className="text-sm text-warning-900">
            ⚠️ You need to create at least one client before adding projects.
          </p>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        {/* Active/Archived Toggle */}
        <div className="flex gap-2">
          <button
            onClick={() => setShowArchived(false)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              !showArchived
                ? 'bg-primary-50 text-primary-700'
                : 'text-neutral-600 hover:bg-neutral-50'
            }`}
          >
            Active ({activeCount})
          </button>
          <button
            onClick={() => setShowArchived(true)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              showArchived
                ? 'bg-primary-50 text-primary-700'
                : 'text-neutral-600 hover:bg-neutral-50'
            }`}
          >
            Archived ({archivedCount})
          </button>
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

        {/* Search */}
        <div className="relative flex-1 max-w-xs ml-auto">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-neutral-200 bg-white py-2 pl-10 pr-4 text-sm transition-colors focus:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-100"
          />
        </div>
      </div>

      {/* Project List */}
      {loading ? (
        <div className="card text-center py-12">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600 mx-auto"></div>
          <p className="text-sm text-neutral-600">Loading projects...</p>
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-neutral-500">
            {searchQuery
              ? 'No projects found matching your search.'
              : showArchived
              ? 'No archived projects yet.'
              : 'No projects yet. Add your first project!'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredProjects.map((project) => (
            <div
              key={project.id}
              onClick={() => navigate(`/projects/${project.id}`)}
              className="card-hover relative border-l-4 cursor-pointer"
              style={{ borderLeftColor: project.color }}
            >
              {/* Dropdown Menu */}
              <div className="absolute right-4 top-4" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => setActiveDropdown(activeDropdown === project.id ? null : project.id)}
                  className="rounded-lg p-2 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600"
                >
                  <MoreVertical className="h-4 w-4" />
                </button>

                {activeDropdown === project.id && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setActiveDropdown(null)}
                    />
                    <div className="absolute right-0 top-full mt-2 w-48 rounded-lg border border-neutral-200 bg-white shadow-lg z-20">
                      <div className="p-2">
                        <button
                          onClick={() => openEditModal(project)}
                          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-neutral-700 transition-colors hover:bg-neutral-50"
                        >
                          <Edit className="h-4 w-4" />
                          Edit
                        </button>
                        <button
                          onClick={() => openShareModal(project)}
                          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-neutral-700 transition-colors hover:bg-neutral-50"
                        >
                          <Share className="h-4 w-4" />
                          Share with Client
                        </button>
                        <button
                          onClick={() => handleToggleArchive(project)}
                          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-neutral-700 transition-colors hover:bg-neutral-50"
                        >
                          {project.is_active ? (
                            <>
                              <Archive className="h-4 w-4" />
                              Archive
                            </>
                          ) : (
                            <>
                              <ArchiveRestore className="h-4 w-4" />
                              Restore
                            </>
                          )}
                        </button>
                        <hr className="my-2 border-neutral-100" />
                        <button
                          onClick={() => handleDelete(project)}
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

              {/* Project Info */}
              <div className="pr-8">
                <h3 className="text-lg font-semibold text-neutral-900">{project.name}</h3>
                <p className="mt-1 text-sm text-neutral-600">
                  {project.client?.name || 'No Client'}
                </p>
                {project.description && (
                  <p className="mt-3 text-sm text-neutral-600 line-clamp-2">
                    {project.description}
                  </p>
                )}
                <div className="mt-4 flex items-center gap-2 flex-wrap">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      project.is_active
                        ? 'bg-success-100 text-success-700'
                        : 'bg-neutral-100 text-neutral-600'
                    }`}
                  >
                    {project.is_active ? 'Active' : 'Archived'}
                  </span>
                  {project.billable && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-success-50 px-2.5 py-0.5 text-xs font-medium text-success-700">
                      <DollarSign className="h-3 w-3" />
                      Billable
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Project Modal */}
      <ProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={modalMode === 'create' ? handleCreateProject : handleUpdateProject}
        project={selectedProject}
        mode={modalMode}
      />

      {/* Share Project Modal */}
      {projectToShare && (
        <ShareProjectModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          project={projectToShare as any}
          onUpdate={handleShareModalUpdate}
        />
      )}
    </div>
  )
}
