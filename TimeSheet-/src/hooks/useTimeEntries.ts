import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useWorkspace } from '../contexts/WorkspaceContext'
import { useAuth } from '../contexts/AuthContext'
import type { Database } from '../types/database.types'

type TimeEntry = Database['public']['Tables']['time_entries']['Row']
type TimeEntryInsert = Database['public']['Tables']['time_entries']['Insert']
type TimeEntryUpdate = Database['public']['Tables']['time_entries']['Update']

export interface TimeEntryWithProject extends TimeEntry {
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

export function useTimeEntries() {
  const { currentWorkspace } = useWorkspace()
  const { user } = useAuth()
  const [timeEntries, setTimeEntries] = useState<TimeEntryWithProject[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadTimeEntries = async () => {
    if (!currentWorkspace || !user) {
      setTimeEntries([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('time_entries')
        .select(`
          *,
          project:projects(
            id,
            name,
            color,
            client:clients(id, name)
          )
        `)
        .eq('workspace_id', currentWorkspace.id)
        .eq('user_id', user.id)
        .order('start_time', { ascending: false })

      if (error) throw error
      setTimeEntries((data as TimeEntryWithProject[]) || [])
    } catch (err: any) {
      setError(err.message)
      console.error('Error loading time entries:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTimeEntries()
  }, [currentWorkspace, user])

  const createTimeEntry = async (entryData: Omit<TimeEntryInsert, 'workspace_id' | 'user_id'>) => {
    if (!currentWorkspace || !user) {
      return { error: 'No workspace or user' }
    }

    try {
      const { data, error } = await supabase
        .from('time_entries')
        .insert({
          ...entryData,
          workspace_id: currentWorkspace.id,
          user_id: user.id,
        } as any)
        .select()
        .single()

      if (error) throw error

      await loadTimeEntries()
      return { data, error: null }
    } catch (err: any) {
      return { data: null, error: err.message }
    }
  }

  const updateTimeEntry = async (id: string, updates: TimeEntryUpdate) => {
    try {
      const { data, error } = await (supabase
        .from('time_entries') as any)
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      await loadTimeEntries()
      return { data, error: null }
    } catch (err: any) {
      return { data: null, error: err.message }
    }
  }

  const deleteTimeEntry = async (id: string) => {
    try {
      const { error } = await supabase.from('time_entries').delete().eq('id', id)

      if (error) throw error

      await loadTimeEntries()
      return { error: null }
    } catch (err: any) {
      return { error: err.message }
    }
  }

  return {
    timeEntries,
    loading,
    error,
    createTimeEntry,
    updateTimeEntry,
    deleteTimeEntry,
    refreshTimeEntries: loadTimeEntries,
  }
}
