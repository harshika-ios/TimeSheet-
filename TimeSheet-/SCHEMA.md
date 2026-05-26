# Database Schema Design

## Overview

This schema follows a **workspace-first** architecture where all data is scoped to workspaces.
The hierarchy is: **Workspace → Client → Project → Time Entry**

---

## Tables

### 1. `profiles`
Extends Supabase Auth users with additional profile information.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK, FK → auth.users | User ID from Supabase Auth |
| email | text | NOT NULL | User email (synced from auth) |
| full_name | text | | User's display name |
| avatar_url | text | | Profile picture URL |
| created_at | timestamptz | NOT NULL, DEFAULT now() | Account creation timestamp |
| updated_at | timestamptz | NOT NULL, DEFAULT now() | Last update timestamp |

**Indexes:**
- Primary key on `id`

**RLS:**
- Users can read their own profile
- Users can update their own profile

---

### 2. `workspaces`
Represents a company, team, or organization.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK, DEFAULT uuid_generate_v4() | Workspace ID |
| name | text | NOT NULL | Workspace name (e.g., "Acme Inc") |
| slug | text | UNIQUE, NOT NULL | URL-friendly identifier |
| owner_id | uuid | NOT NULL, FK → profiles(id) | Workspace owner |
| created_at | timestamptz | NOT NULL, DEFAULT now() | Creation timestamp |
| updated_at | timestamptz | NOT NULL, DEFAULT now() | Last update timestamp |

**Indexes:**
- Primary key on `id`
- Unique index on `slug`
- Index on `owner_id`

**RLS:**
- Users can read workspaces they are members of
- Only owners can update/delete workspaces

---

### 3. `workspace_members`
Junction table for workspace membership (many-to-many).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK, DEFAULT uuid_generate_v4() | Member ID |
| workspace_id | uuid | NOT NULL, FK → workspaces(id) ON DELETE CASCADE | Workspace reference |
| user_id | uuid | NOT NULL, FK → profiles(id) ON DELETE CASCADE | User reference |
| role | text | NOT NULL, DEFAULT 'member' | Role: 'owner', 'admin', 'member' |
| joined_at | timestamptz | NOT NULL, DEFAULT now() | When user joined workspace |

**Indexes:**
- Primary key on `id`
- Unique index on `(workspace_id, user_id)` - prevent duplicate membership
- Index on `user_id`

**RLS:**
- Users can read memberships for workspaces they belong to
- Only workspace admins/owners can manage memberships

---

### 4. `clients`
Represents a client/customer within a workspace.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK, DEFAULT uuid_generate_v4() | Client ID |
| workspace_id | uuid | NOT NULL, FK → workspaces(id) ON DELETE CASCADE | Workspace reference |
| name | text | NOT NULL | Client name (e.g., "ABC Corp") |
| email | text | | Client contact email |
| notes | text | | Additional notes |
| is_active | boolean | NOT NULL, DEFAULT true | Active/archived status |
| created_at | timestamptz | NOT NULL, DEFAULT now() | Creation timestamp |
| updated_at | timestamptz | NOT NULL, DEFAULT now() | Last update timestamp |

**Indexes:**
- Primary key on `id`
- Index on `workspace_id`
- Index on `(workspace_id, is_active)` - for filtering active clients

**RLS:**
- Users can read clients in workspaces they are members of
- Users can create/update/delete clients in their workspaces

---

### 5. `projects`
Represents a project under a client.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK, DEFAULT uuid_generate_v4() | Project ID |
| workspace_id | uuid | NOT NULL, FK → workspaces(id) ON DELETE CASCADE | Workspace reference |
| client_id | uuid | NOT NULL, FK → clients(id) ON DELETE CASCADE | Client reference |
| name | text | NOT NULL | Project name |
| description | text | | Project description |
| color | text | DEFAULT '#3B82F6' | Project color (hex) for UI |
| is_active | boolean | NOT NULL, DEFAULT true | Active/archived status |
| billable | boolean | NOT NULL, DEFAULT true | Is this project billable? |
| created_at | timestamptz | NOT NULL, DEFAULT now() | Creation timestamp |
| updated_at | timestamptz | NOT NULL, DEFAULT now() | Last update timestamp |

**Indexes:**
- Primary key on `id`
- Index on `workspace_id`
- Index on `client_id`
- Index on `(workspace_id, is_active)` - for filtering active projects

**RLS:**
- Users can read projects in workspaces they are members of
- Users can create/update/delete projects in their workspaces

---

### 6. `tags`
Optional tags for categorizing time entries.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK, DEFAULT uuid_generate_v4() | Tag ID |
| workspace_id | uuid | NOT NULL, FK → workspaces(id) ON DELETE CASCADE | Workspace reference |
| name | text | NOT NULL | Tag name (e.g., "Design", "Meeting") |
| color | text | DEFAULT '#6B7280' | Tag color (hex) |
| created_at | timestamptz | NOT NULL, DEFAULT now() | Creation timestamp |

**Indexes:**
- Primary key on `id`
- Unique index on `(workspace_id, name)` - prevent duplicate tag names
- Index on `workspace_id`

**RLS:**
- Users can read tags in workspaces they are members of
- Users can create/update/delete tags in their workspaces

---

### 7. `time_entries`
Individual time tracking records.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK, DEFAULT uuid_generate_v4() | Entry ID |
| workspace_id | uuid | NOT NULL, FK → workspaces(id) ON DELETE CASCADE | Workspace reference |
| user_id | uuid | NOT NULL, FK → profiles(id) ON DELETE CASCADE | User who tracked this time |
| project_id | uuid | FK → projects(id) ON DELETE SET NULL | Project reference (nullable) |
| description | text | | What was worked on |
| start_time | timestamptz | NOT NULL | When timer started |
| end_time | timestamptz | | When timer stopped (NULL = running) |
| duration | integer | | Duration in seconds (computed) |
| is_billable | boolean | NOT NULL, DEFAULT true | Is this entry billable? |
| created_at | timestamptz | NOT NULL, DEFAULT now() | Creation timestamp |
| updated_at | timestamptz | NOT NULL, DEFAULT now() | Last update timestamp |

**Indexes:**
- Primary key on `id`
- Index on `workspace_id`
- Index on `user_id`
- Index on `project_id`
- Index on `(workspace_id, user_id, start_time)` - for timesheet queries
- Index on `(workspace_id, project_id)` - for project reports
- Partial index on `(user_id, end_time)` WHERE `end_time IS NULL` - for active timers

**RLS:**
- Users can read time entries in workspaces they are members of
- Users can only create/update/delete their own time entries
- Workspace admins can read all time entries in their workspace

---

### 8. `time_entry_tags`
Junction table for many-to-many relationship between time entries and tags.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK, DEFAULT uuid_generate_v4() | ID |
| time_entry_id | uuid | NOT NULL, FK → time_entries(id) ON DELETE CASCADE | Time entry reference |
| tag_id | uuid | NOT NULL, FK → tags(id) ON DELETE CASCADE | Tag reference |

**Indexes:**
- Primary key on `id`
- Unique index on `(time_entry_id, tag_id)` - prevent duplicate tags on entry
- Index on `tag_id`

**RLS:**
- Inherits access from time_entries

---

## Relationships Summary

```
profiles (users)
  └─ workspace_members ─┐
                        │
workspaces ─────────────┘
  ├─ clients
  │   └─ projects
  │       └─ time_entries ─┐
  │                        │
  ├─ tags ─────────────────┤
  │                        │
  └─ time_entry_tags ──────┘
```

---

## Key Design Decisions

### 1. Workspace-Scoped Data
All primary entities (clients, projects, time_entries, tags) include `workspace_id` for:
- Faster queries (single workspace filter)
- Clearer RLS policies
- Data isolation

### 2. Cascade Deletes
When a workspace is deleted, all related data (clients, projects, time entries) is automatically deleted.
When a client is deleted, all its projects and related time entries cascade.

### 3. Nullable Project ID
Time entries can exist without a project (for internal work, breaks, etc.).
This matches Excel flexibility where users might track time without assigning it.

### 4. Duration Field
While `duration` can be computed from `start_time` and `end_time`, storing it:
- Speeds up aggregation queries
- Allows manual adjustments (matching Excel behavior)
- Handles edge cases (manual entries without timer)

### 5. Running Timer Detection
Active timer = `end_time IS NULL`
Partial index optimizes "get my running timer" queries.

### 6. Soft Deletes via `is_active`
Clients and projects use `is_active` instead of hard deletes:
- Preserves historical time entry relationships
- Allows "archive and restore" workflow
- Matches Excel behavior (hide/unhide rows)

---

## Row Level Security (RLS) Policies

### General Rules
1. All tables MUST have RLS enabled
2. Users can only access data in workspaces they are members of
3. Users can only modify their own time entries
4. Workspace admins have elevated permissions

### Implementation Notes
RLS policies will be created in Supabase SQL editor after tables are created.
Example policy structure:

```sql
-- Example: Users can read clients in their workspaces
CREATE POLICY "Users can read clients in their workspaces"
ON clients FOR SELECT
USING (
  workspace_id IN (
    SELECT workspace_id
    FROM workspace_members
    WHERE user_id = auth.uid()
  )
);
```

---

## Database Functions

### 1. `calculate_duration()`
Trigger function to auto-calculate duration when `end_time` is set.

### 2. `get_active_timer(user_id)`
Returns currently running timer for a user.

### 3. `update_updated_at()`
Trigger function to automatically update `updated_at` timestamp.

---

## Indexes Strategy

Indexes are designed for:
1. **Workspace filtering** - Most queries filter by workspace first
2. **Time range queries** - Timesheet views query by date range
3. **Active timer lookups** - Partial index for performance
4. **Report generation** - Composite indexes for aggregations

---

## Migration Strategy

1. Create tables in order (respect foreign key dependencies)
2. Enable RLS on all tables
3. Create policies
4. Add indexes
5. Create database functions
6. Add triggers
7. Seed with test data

---

## Next Steps

After schema approval:
1. Create SQL migration file for Supabase
2. Set up TypeScript types matching schema
3. Create Supabase client with type safety
