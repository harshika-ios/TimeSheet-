import { NavLink } from 'react-router-dom'
import {
  Clock,
  LayoutDashboard,
  Users,
  FolderKanban,
  FileText,
  Settings,
  Timer,
  ChevronDown,
  Building2,
} from 'lucide-react'
import { useWorkspace } from '../../contexts/WorkspaceContext'
import { ManageWorkspacesModal } from '../workspace/ManageWorkspacesModal'
import { useState } from 'react'

interface NavItem {
  to: string
  icon: React.ElementType
  label: string
}

const navItems: NavItem[] = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/timer', icon: Timer, label: 'Timer' },
  { to: '/timesheet', icon: Clock, label: 'Timesheet' },
  { to: '/clients', icon: Users, label: 'Clients' },
  { to: '/projects', icon: FolderKanban, label: 'Projects' },
  { to: '/reports', icon: FileText, label: 'Reports' },
  { to: '/settings', icon: Settings, label: 'Settings' },
]

export function Sidebar() {
  const { currentWorkspace, workspaces, setCurrentWorkspace } = useWorkspace()
  const [showWorkspaceMenu, setShowWorkspaceMenu] = useState(false)
  const [showManageModal, setShowManageModal] = useState(false)

  const getWorkspaceInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <aside className="flex w-64 flex-col border-r border-neutral-200 bg-white">
      {/* Logo */}
      <div className="flex h-16 items-center border-b border-neutral-200 px-6">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-500">
            <Clock className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-semibold text-neutral-900">Timesheet</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-4">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                isActive
                  ? 'bg-primary-50 text-primary-700 shadow-sm'
                  : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <item.icon className={`h-5 w-5 ${isActive ? 'text-primary-600' : ''}`} />
                {item.label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Workspace Selector */}
      <div className="border-t border-neutral-200 p-4">
        <div className="relative">
          <button
            onClick={() => setShowWorkspaceMenu(!showWorkspaceMenu)}
            className="flex w-full items-center gap-2 rounded-lg bg-neutral-50 px-3 py-2 text-left transition-colors hover:bg-neutral-100"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded bg-primary-100 text-xs font-semibold text-primary-700">
              {currentWorkspace ? getWorkspaceInitials(currentWorkspace.name) : '?'}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="truncate text-sm font-medium text-neutral-900">
                {currentWorkspace?.name || 'No Workspace'}
              </p>
              <p className="text-xs text-neutral-500">
                {workspaces.length} workspace{workspaces.length !== 1 ? 's' : ''}
              </p>
            </div>
            <ChevronDown className="h-4 w-4 text-neutral-400" />
          </button>

          {/* Workspace Dropdown */}
          {showWorkspaceMenu && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowWorkspaceMenu(false)}
              />
              <div className="absolute bottom-full left-0 right-0 mb-2 rounded-lg border border-neutral-200 bg-white shadow-lg z-20">
                <div className="max-h-64 overflow-y-auto p-2">
                  {workspaces.map((workspace) => (
                    <button
                      key={workspace.id}
                      onClick={() => {
                        setCurrentWorkspace(workspace)
                        setShowWorkspaceMenu(false)
                      }}
                      className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-left transition-colors ${
                        currentWorkspace?.id === workspace.id
                          ? 'bg-primary-50 text-primary-900'
                          : 'hover:bg-neutral-50'
                      }`}
                    >
                      <div className="flex h-6 w-6 items-center justify-center rounded bg-primary-100 text-xs font-semibold text-primary-700">
                        {getWorkspaceInitials(workspace.name)}
                      </div>
                      <span className="flex-1 truncate text-sm font-medium">
                        {workspace.name}
                      </span>
                    </button>
                  ))}
                  <hr className="my-2 border-neutral-100" />
                  <button
                    onClick={() => {
                      setShowWorkspaceMenu(false)
                      setShowManageModal(true)
                    }}
                    className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50"
                  >
                    <Building2 className="h-4 w-4" />
                    Manage Workspaces
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Manage Workspaces Modal */}
      <ManageWorkspacesModal
        isOpen={showManageModal}
        onClose={() => setShowManageModal(false)}
      />
    </aside>
  )
}
