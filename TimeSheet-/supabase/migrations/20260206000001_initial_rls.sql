-- =====================================================
-- Migration: Initial Row Level Security
-- Created: 2026-02-06
-- Enables RLS and sets up access policies for all tables
-- =====================================================

-- =====================================================
-- ENABLE RLS
-- =====================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_entry_tags ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- PROFILES
-- =====================================================

CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- =====================================================
-- WORKSPACE MEMBERS
-- All authenticated users can view members (avoids recursive policy issues)
-- Users may only add themselves; admins/owners manage updates and deletes
-- =====================================================

CREATE POLICY "workspace_members_select" ON workspace_members
  FOR SELECT
  USING (true);

CREATE POLICY "workspace_members_insert" ON workspace_members
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "workspace_members_update" ON workspace_members
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = workspace_members.workspace_id
        AND wm.user_id = auth.uid()
        AND wm.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "workspace_members_delete" ON workspace_members
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = workspace_members.workspace_id
        AND wm.user_id = auth.uid()
        AND wm.role IN ('owner', 'admin')
    )
  );

-- =====================================================
-- WORKSPACES
-- =====================================================

CREATE POLICY "workspaces_select" ON workspaces
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_members.workspace_id = workspaces.id
        AND workspace_members.user_id = auth.uid()
    )
  );

CREATE POLICY "workspaces_insert" ON workspaces
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "workspaces_update" ON workspaces
  FOR UPDATE
  USING (owner_id = auth.uid());

CREATE POLICY "workspaces_delete" ON workspaces
  FOR DELETE
  USING (owner_id = auth.uid());

-- =====================================================
-- CLIENTS
-- =====================================================

CREATE POLICY "Users can view clients in their workspaces"
  ON clients FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create clients in their workspaces"
  ON clients FOR INSERT
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update clients in their workspaces"
  ON clients FOR UPDATE
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete clients in their workspaces"
  ON clients FOR DELETE
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
    )
  );

-- =====================================================
-- PROJECTS
-- =====================================================

CREATE POLICY "Users can view projects in their workspaces"
  ON projects FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create projects in their workspaces"
  ON projects FOR INSERT
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update projects in their workspaces"
  ON projects FOR UPDATE
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete projects in their workspaces"
  ON projects FOR DELETE
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
    )
  );

-- =====================================================
-- TAGS
-- =====================================================

CREATE POLICY "Users can view tags in their workspaces"
  ON tags FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create tags in their workspaces"
  ON tags FOR INSERT
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update tags in their workspaces"
  ON tags FOR UPDATE
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete tags in their workspaces"
  ON tags FOR DELETE
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
    )
  );

-- =====================================================
-- TIME ENTRIES
-- =====================================================

CREATE POLICY "Users can view time entries in their workspaces"
  ON time_entries FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create their own time entries"
  ON time_entries FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own time entries"
  ON time_entries FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own time entries"
  ON time_entries FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- TIME ENTRY TAGS
-- =====================================================

CREATE POLICY "Users can view time entry tags in their workspaces"
  ON time_entry_tags FOR SELECT
  USING (
    time_entry_id IN (
      SELECT id FROM time_entries
      WHERE workspace_id IN (
        SELECT workspace_id FROM workspace_members
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can manage tags on their time entries"
  ON time_entry_tags FOR ALL
  USING (
    time_entry_id IN (
      SELECT id FROM time_entries
      WHERE user_id = auth.uid()
    )
  );
