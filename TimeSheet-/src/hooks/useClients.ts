import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useWorkspace } from '../contexts/WorkspaceContext'
import type { Database } from '../types/database.types'

type Client = Database['public']['Tables']['clients']['Row']
type ClientInsert = Database['public']['Tables']['clients']['Insert']
type ClientUpdate = Database['public']['Tables']['clients']['Update']

export function useClients() {
  const { currentWorkspace } = useWorkspace()
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadClients = async () => {
    if (!currentWorkspace) {
      setClients([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('workspace_id', currentWorkspace.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setClients(data || [])
    } catch (err: any) {
      setError(err.message)
      console.error('Error loading clients:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadClients()
  }, [currentWorkspace])

  const createClient = async (clientData: Omit<ClientInsert, 'workspace_id'>) => {
    if (!currentWorkspace) {
      return { error: 'No workspace selected' }
    }

    try {
      const { data, error } = await supabase
        .from('clients')
        .insert({
          ...clientData,
          workspace_id: currentWorkspace.id,
        } as any)
        .select()
        .single()

      if (error) throw error

      await loadClients()
      return { data, error: null }
    } catch (err: any) {
      return { data: null, error: err.message }
    }
  }

  const updateClient = async (id: string, updates: ClientUpdate) => {
    try {
      const { data, error } = await (supabase
        .from('clients') as any)
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      await loadClients()
      return { data, error: null }
    } catch (err: any) {
      return { data: null, error: err.message }
    }
  }

  const deleteClient = async (id: string) => {
    try {
      const { error } = await supabase.from('clients').delete().eq('id', id)

      if (error) throw error

      await loadClients()
      return { error: null }
    } catch (err: any) {
      return { error: err.message }
    }
  }

  const toggleClientActive = async (id: string, isActive: boolean) => {
    return updateClient(id, { is_active: isActive })
  }

  return {
    clients,
    loading,
    error,
    createClient,
    updateClient,
    deleteClient,
    toggleClientActive,
    refreshClients: loadClients,
  }
}
