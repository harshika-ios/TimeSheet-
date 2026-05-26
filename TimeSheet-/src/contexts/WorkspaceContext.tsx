import { createContext, useContext, useEffect, useState } from 'react'
import { useAuth } from './AuthContext'
import { supabase } from '../lib/supabase'
import type { Database } from '../types/database.types'

type Workspace = Database['public']['Tables']['workspaces']['Row']

interface WorkspaceContextType {
  currentWorkspace: Workspace | null
  workspaces: Workspace[]
  loading: boolean
  hasChecked: boolean
  setCurrentWorkspace: (workspace: Workspace) => void
  createWorkspace: (name: string) => Promise<{ workspace: Workspace | null; error: string | null }>
  refreshWorkspaces: () => Promise<void>
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined)

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth()
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null)
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [loading, setLoading] = useState(true)
  const [hasChecked, setHasChecked] = useState(false)

  // Load user's workspaces
  const loadWorkspaces = async () => {
    if (!user) {
      setWorkspaces([])
      setCurrentWorkspace(null)
      setLoading(false)
      setHasChecked(true)
      return
    }

    try {
      setLoading(true)
      console.log('Loading workspaces for user:', user.id)

      // Get all workspaces user is a member of
      const { data: members, error } = await supabase
        .from('workspace_members')
        .select('workspace_id, workspaces(*)')
        .eq('user_id', user.id)

      console.log('Workspace members query result:', { members, error })

      if (error) throw error

      const userWorkspaces = members
        ?.map((m: any) => m.workspaces)
        .filter(Boolean) as Workspace[]

      console.log('User workspaces:', userWorkspaces)
      setWorkspaces(userWorkspaces || [])

      // Auto-select first workspace or load saved preference
      const savedWorkspaceId = localStorage.getItem('currentWorkspaceId')
      const savedWorkspace = userWorkspaces?.find((w) => w.id === savedWorkspaceId)

      if (savedWorkspace) {
        console.log('Using saved workspace:', savedWorkspace.name)
        setCurrentWorkspace(savedWorkspace)
      } else if (userWorkspaces && userWorkspaces.length > 0) {
        console.log('Auto-selecting first workspace:', userWorkspaces[0].name)
        setCurrentWorkspace(userWorkspaces[0])
        localStorage.setItem('currentWorkspaceId', userWorkspaces[0].id)
      } else {
        console.log('No workspaces found')
      }
    } catch (error) {
      console.error('Error loading workspaces:', error)
    } finally {
      setLoading(false)
      setHasChecked(true)
    }
  }

  useEffect(() => {
    // Don't load workspaces until auth is done loading
    if (!authLoading) {
      loadWorkspaces()
    }
  }, [user, authLoading])

  const handleSetCurrentWorkspace = (workspace: Workspace) => {
    setCurrentWorkspace(workspace)
    localStorage.setItem('currentWorkspaceId', workspace.id)
  }

  const createWorkspace = async (name: string) => {
    if (!user) {
      return { workspace: null, error: 'User not authenticated' }
    }

    try {
      // Generate a slug from the name
      const slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')

      // Create workspace
      const { data: workspace, error: workspaceError } = await supabase
        .from('workspaces')
        .insert({
          name,
          slug: `${slug}-${Date.now()}`, // Add timestamp to ensure uniqueness
          owner_id: user.id,
        } as any)
        .select()
        .single() as { data: Workspace | null; error: any }

      if (workspaceError || !workspace) throw workspaceError

      // Add user as owner member
      const { error: memberError } = await supabase
        .from('workspace_members')
        .insert({
          workspace_id: workspace.id,
          user_id: user.id,
          role: 'owner',
        } as any)

      if (memberError) throw memberError

      // Refresh workspaces list
      await loadWorkspaces()

      return { workspace, error: null }
    } catch (error: any) {
      console.error('Error creating workspace:', error)
      return { workspace: null, error: error.message || 'Failed to create workspace' }
    }
  }

  const refreshWorkspaces = async () => {
    await loadWorkspaces()
  }

  const value = {
    currentWorkspace,
    workspaces,
    loading,
    hasChecked,
    setCurrentWorkspace: handleSetCurrentWorkspace,
    createWorkspace,
    refreshWorkspaces,
  }

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext)
  if (context === undefined) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider')
  }
  return context
}
