import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useWorkspace } from '../contexts/WorkspaceContext'
import type { Database } from '../types/database.types'

type Project = Database['public']['Tables']['projects']['Row']
type ProjectInsert = Database['public']['Tables']['projects']['Insert']
type ProjectUpdate = Database['public']['Tables']['projects']['Update']

export interface ProjectWithClient extends Project {
  client: {
    id: string
    name: string
    is_active: boolean
  } | null
}

export function useProjects() {
  const { currentWorkspace } = useWorkspace()
  const [projects, setProjects] = useState<ProjectWithClient[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  
  const loadProjects = async () => {
    if (!currentWorkspace) {
      setProjects([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          client:clients(id, name, is_active)
        `)
        .eq('workspace_id', currentWorkspace.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setProjects((data as ProjectWithClient[]) || [])
    } catch (err: any) {
      setError(err.message)
      console.error('Error loading projects:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProjects()
  }, [currentWorkspace])

  const createProject = async (projectData: Omit<ProjectInsert, 'workspace_id'>) => {
    if (!currentWorkspace) {
      return { error: 'No workspace selected' }
    }

    try {
      const { data, error } = await supabase
        .from('projects')
        .insert({
          ...projectData,
          workspace_id: currentWorkspace.id,
        } as any)
        .select()
        .single()

      if (error) throw error

      await loadProjects()
      return { data, error: null }
    } catch (err: any) {
      return { data: null, error: err.message }
    }
  }

  const updateProject = async (id: string, updates: ProjectUpdate) => {
    try {
      const { data, error } = await (supabase
        .from('projects') as any)
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      await loadProjects()
      return { data, error: null }
    } catch (err: any) {
      return { data: null, error: err.message }
    }
  }

  const deleteProject = async (id: string) => {
    try {
      const { error } = await supabase.from('projects').delete().eq('id', id)

      if (error) throw error

      await loadProjects()
      return { error: null }
    } catch (err: any) {
      return { error: err.message }
    }
  }

  const toggleProjectActive = async (id: string, isActive: boolean) => {
    return updateProject(id, { is_active: isActive })
  }

  return {
    projects,
    loading,
    error,
    createProject,
    updateProject,
    deleteProject,
    toggleProjectActive,
    refreshProjects: loadProjects,
  }
}
