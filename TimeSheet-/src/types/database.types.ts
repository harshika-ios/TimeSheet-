/**
 * Database TypeScript Types
 *
 * These types match the schema defined in SCHEMA.md
 * Generate automatically from Supabase CLI with:
 * `npx supabase gen types typescript --project-id your-project-ref > src/types/database.types.ts`
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      workspaces: {
        Row: {
          id: string
          name: string
          slug: string
          owner_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          owner_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          owner_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      workspace_members: {
        Row: {
          id: string
          workspace_id: string
          user_id: string
          role: 'owner' | 'admin' | 'member'
          joined_at: string
        }
        Insert: {
          id?: string
          workspace_id: string
          user_id: string
          role?: 'owner' | 'admin' | 'member'
          joined_at?: string
        }
        Update: {
          id?: string
          workspace_id?: string
          user_id?: string
          role?: 'owner' | 'admin' | 'member'
          joined_at?: string
        }
      }
      clients: {
        Row: {
          id: string
          workspace_id: string
          name: string
          email: string | null
          notes: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          workspace_id: string
          name: string
          email?: string | null
          notes?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          workspace_id?: string
          name?: string
          email?: string | null
          notes?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      projects: {
        Row: {
          id: string
          workspace_id: string
          client_id: string
          name: string
          description: string | null
          color: string
          is_active: boolean
          billable: boolean
          created_at: string
          updated_at: string
          share_token: string | null
          is_shared: boolean
          share_password: string | null
          share_last_viewed_at: string | null
          share_view_count: number
        }
        Insert: {
          id?: string
          workspace_id: string
          client_id: string
          name: string
          description?: string | null
          color?: string
          is_active?: boolean
          billable?: boolean
          created_at?: string
          updated_at?: string
          share_token?: string | null
          is_shared?: boolean
          share_password?: string | null
          share_last_viewed_at?: string | null
          share_view_count?: number
        }
        Update: {
          id?: string
          workspace_id?: string
          client_id?: string
          name?: string
          description?: string | null
          color?: string
          is_active?: boolean
          billable?: boolean
          created_at?: string
          updated_at?: string
          share_token?: string | null
          is_shared?: boolean
          share_password?: string | null
          share_last_viewed_at?: string | null
          share_view_count?: number
        }
      }
      tags: {
        Row: {
          id: string
          workspace_id: string
          name: string
          color: string
          created_at: string
        }
        Insert: {
          id?: string
          workspace_id: string
          name: string
          color?: string
          created_at?: string
        }
        Update: {
          id?: string
          workspace_id?: string
          name?: string
          color?: string
          created_at?: string
        }
      }
      time_entries: {
        Row: {
          id: string
          workspace_id: string
          user_id: string
          project_id: string | null
          description: string | null
          start_time: string
          end_time: string | null
          duration: number | null
          is_billable: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          workspace_id: string
          user_id: string
          project_id?: string | null
          description?: string | null
          start_time: string
          end_time?: string | null
          duration?: number | null
          is_billable?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          workspace_id?: string
          user_id?: string
          project_id?: string | null
          description?: string | null
          start_time?: string
          end_time?: string | null
          duration?: number | null
          is_billable?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      time_entry_tags: {
        Row: {
          id: string
          time_entry_id: string
          tag_id: string
        }
        Insert: {
          id?: string
          time_entry_id: string
          tag_id: string
        }
        Update: {
          id?: string
          time_entry_id?: string
          tag_id?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
