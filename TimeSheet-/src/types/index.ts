/**
 * Application Types
 *
 * These are the domain models used throughout the application.
 * They match the database schema but are more ergonomic for frontend use.
 */

export interface Profile {
  id: string
  email: string
  fullName: string | null
  avatarUrl: string | null
  createdAt: string
  updatedAt: string
}

export interface Workspace {
  id: string
  name: string
  slug: string
  ownerId: string
  createdAt: string
  updatedAt: string
}

export type WorkspaceRole = 'owner' | 'admin' | 'member'

export interface WorkspaceMember {
  id: string
  workspaceId: string
  userId: string
  role: WorkspaceRole
  joinedAt: string
  user?: Profile // Optional joined user data
}

export interface Client {
  id: string
  workspaceId: string
  name: string
  email: string | null
  notes: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface Project {
  id: string
  workspaceId: string
  clientId: string
  name: string
  description: string | null
  color: string
  isActive: boolean
  billable: boolean
  createdAt: string
  updatedAt: string
  client?: Client // Optional joined client data
  share_token?: string | null
  is_shared?: boolean
  share_password?: string | null
  share_last_viewed_at?: string | null
  share_view_count?: number
}

export interface Tag {
  id: string
  workspaceId: string
  name: string
  color: string
  createdAt: string
}

export interface TimeEntry {
  id: string
  workspaceId: string
  userId: string
  projectId: string | null
  description: string | null
  startTime: string
  endTime: string | null
  duration: number | null // in seconds
  isBillable: boolean
  createdAt: string
  updatedAt: string
  project?: Project | null // Optional joined project data
  tags?: Tag[] // Optional joined tags
}

export interface TimeEntryWithRelations extends TimeEntry {
  project: Project | null
  tags: Tag[]
}

// UI-specific types

export interface TimerState {
  isRunning: boolean
  currentEntry: TimeEntry | null
  elapsedSeconds: number
}

export interface TimeEntryFormData {
  projectId: string | null
  description: string
  startTime: Date
  endTime: Date | null
  isBillable: boolean
  tagIds: string[]
}

// Report types

export interface ProjectTimeReport {
  projectId: string
  projectName: string
  clientName: string
  totalSeconds: number
  totalBillableSeconds: number
  entryCount: number
}

export interface ClientTimeReport {
  clientId: string
  clientName: string
  totalSeconds: number
  totalBillableSeconds: number
  projectCount: number
  entryCount: number
}

export interface UserTimeReport {
  userId: string
  userName: string
  totalSeconds: number
  totalBillableSeconds: number
  entryCount: number
}

export interface DateRange {
  startDate: Date
  endDate: Date
}
