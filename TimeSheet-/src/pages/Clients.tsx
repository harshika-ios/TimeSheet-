import { useState } from 'react'
import { Plus, Search, Mail, MoreVertical, Edit, Archive, Trash2, ArchiveRestore } from 'lucide-react'
import { useClients } from '../hooks/useClients'
import { ClientModal } from '../components/clients/ClientModal'
import type { Database } from '../types/database.types'

type Client = Database['public']['Tables']['clients']['Row']

interface ClientFormData {
  name: string
  email: string
  notes: string
  is_active: boolean
}

export function Clients() {
  const { clients, loading, createClient, updateClient, deleteClient, toggleClientActive } = useClients()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create')
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showArchived, setShowArchived] = useState(false)
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)

  const handleCreateClient = async (data: ClientFormData) => {
    const { error } = await createClient(data)
    return { error }
  }

  const handleUpdateClient = async (data: ClientFormData) => {
    if (!selectedClient) return { error: 'No client selected' }
    const { error } = await updateClient(selectedClient.id, data)
    return { error }
  }

  const handleDelete = async (client: Client) => {
    if (window.confirm(`Are you sure you want to delete "${client.name}"? This action cannot be undone.`)) {
      await deleteClient(client.id)
    }
    setActiveDropdown(null)
  }

  const handleToggleArchive = async (client: Client) => {
    await toggleClientActive(client.id, !client.is_active)
    setActiveDropdown(null)
  }

  const openCreateModal = () => {
    setSelectedClient(null)
    setModalMode('create')
    setIsModalOpen(true)
  }

  const openEditModal = (client: Client) => {
    setSelectedClient(client)
    setModalMode('edit')
    setIsModalOpen(true)
    setActiveDropdown(null)
  }

  // Filter clients
  const filteredClients = clients.filter((client) => {
    const matchesSearch = client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.email?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesArchived = showArchived ? !client.is_active : client.is_active
    return matchesSearch && matchesArchived
  })

  const activeCount = clients.filter((c) => c.is_active).length
  const archivedCount = clients.filter((c) => !c.is_active).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">Clients</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Manage your clients and customers
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="btn bg-primary-500 text-white hover:bg-primary-600"
        >
          <Plus className="h-4 w-4" />
          Add Client
        </button>
      </div>

      {/* Stats & Filters */}
      <div className="flex items-center justify-between gap-4">
        {/* Stats */}
        <div className="flex gap-4">
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

        {/* Search */}
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder="Search clients..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-neutral-200 bg-white py-2 pl-10 pr-4 text-sm transition-colors focus:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-100"
          />
        </div>
      </div>

      {/* Client List */}
      {loading ? (
        <div className="card text-center py-12">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600 mx-auto"></div>
          <p className="text-sm text-neutral-600">Loading clients...</p>
        </div>
      ) : filteredClients.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-neutral-500">
            {searchQuery
              ? 'No clients found matching your search.'
              : showArchived
              ? 'No archived clients yet.'
              : 'No clients yet. Add your first client!'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredClients.map((client) => (
            <div
              key={client.id}
              className="card-hover relative"
            >
              {/* Dropdown Menu */}
              <div className="absolute right-4 top-4">
                <button
                  onClick={() => setActiveDropdown(activeDropdown === client.id ? null : client.id)}
                  className="rounded-lg p-2 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600"
                >
                  <MoreVertical className="h-4 w-4" />
                </button>

                {activeDropdown === client.id && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setActiveDropdown(null)}
                    />
                    <div className="absolute right-0 top-full mt-2 w-48 rounded-lg border border-neutral-200 bg-white shadow-lg z-20">
                      <div className="p-2">
                        <button
                          onClick={() => openEditModal(client)}
                          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-neutral-700 transition-colors hover:bg-neutral-50"
                        >
                          <Edit className="h-4 w-4" />
                          Edit
                        </button>
                        <button
                          onClick={() => handleToggleArchive(client)}
                          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-neutral-700 transition-colors hover:bg-neutral-50"
                        >
                          {client.is_active ? (
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
                          onClick={() => handleDelete(client)}
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

              {/* Client Info */}
              <div className="pr-8">
                <h3 className="text-lg font-semibold text-neutral-900">{client.name}</h3>
                {client.email && (
                  <div className="mt-2 flex items-center gap-2 text-sm text-neutral-600">
                    <Mail className="h-4 w-4" />
                    {client.email}
                  </div>
                )}
                {client.notes && (
                  <p className="mt-3 text-sm text-neutral-600 line-clamp-2">
                    {client.notes}
                  </p>
                )}
                <div className="mt-4 flex items-center gap-2">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      client.is_active
                        ? 'bg-success-100 text-success-700'
                        : 'bg-neutral-100 text-neutral-600'
                    }`}
                  >
                    {client.is_active ? 'Active' : 'Archived'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Client Modal */}
      <ClientModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={modalMode === 'create' ? handleCreateClient : handleUpdateClient}
        client={selectedClient}
        mode={modalMode}
      />
    </div>
  )
}
