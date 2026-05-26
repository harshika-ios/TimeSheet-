-- =====================================================
-- Migration: Fix Workspace & Workspace Members RLS
-- Created: 2026-02-09
-- Replaces initial recursive policies with non-recursive versions
-- Safe to run on databases that applied the original policies
-- =====================================================

-- =====================================================
-- WORKSPACE MEMBERS — drop any old policy names
-- =====================================================

DROP POLICY IF EXISTS "Users can view members of their workspaces" ON workspace_members;
DROP POLICY IF EXISTS "Users can view workspace members" ON workspace_members;
DROP POLICY IF EXISTS "Workspace admins can add members" ON workspace_members;
DROP POLICY IF EXISTS "Users can add themselves to workspaces" ON workspace_members;
DROP POLICY IF EXISTS "Workspace admins can update members" ON workspace_members;
DROP POLICY IF EXISTS "Admins can update members" ON workspace_members;
DROP POLICY IF EXISTS "Workspace admins can remove members" ON workspace_members;
DROP POLICY IF EXISTS "Admins can remove members" ON workspace_members;

-- Also drop the target policy names so CREATE below is idempotent
DROP POLICY IF EXISTS "workspace_members_select" ON workspace_members;
DROP POLICY IF EXISTS "workspace_members_insert" ON workspace_members;
DROP POLICY IF EXISTS "workspace_members_update" ON workspace_members;
DROP POLICY IF EXISTS "workspace_members_delete" ON workspace_members;

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
-- WORKSPACES — drop any old policy names
-- =====================================================

DROP POLICY IF EXISTS "Users can view workspaces they are members of" ON workspaces;
DROP POLICY IF EXISTS "Users can view their workspaces" ON workspaces;
DROP POLICY IF EXISTS "Users can create workspaces" ON workspaces;
DROP POLICY IF EXISTS "Allow authenticated users to create workspaces" ON workspaces;
DROP POLICY IF EXISTS "workspace_select_policy" ON workspaces;
DROP POLICY IF EXISTS "workspace_insert_policy" ON workspaces;
DROP POLICY IF EXISTS "Workspace owners can update their workspaces" ON workspaces;
DROP POLICY IF EXISTS "Workspace owners can update" ON workspaces;
DROP POLICY IF EXISTS "workspace_update_policy" ON workspaces;
DROP POLICY IF EXISTS "Workspace owners can delete their workspaces" ON workspaces;
DROP POLICY IF EXISTS "Workspace owners can delete" ON workspaces;
DROP POLICY IF EXISTS "workspace_delete_policy" ON workspaces;

-- Also drop the target policy names so CREATE below is idempotent
DROP POLICY IF EXISTS "workspaces_select" ON workspaces;
DROP POLICY IF EXISTS "workspaces_insert" ON workspaces;
DROP POLICY IF EXISTS "workspaces_update" ON workspaces;
DROP POLICY IF EXISTS "workspaces_delete" ON workspaces;

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
