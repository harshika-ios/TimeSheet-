-- =====================================================
-- Complete RLS Fix for Workspaces & Members
-- Run this entire script in Supabase SQL Editor
-- =====================================================

-- =====================================================
-- PART 1: Fix workspace_members policies (no recursion)
-- =====================================================

-- Drop old workspace_members policies
DROP POLICY IF EXISTS "Users can view members of their workspaces" ON workspace_members;
DROP POLICY IF EXISTS "Users can view workspace members" ON workspace_members;
DROP POLICY IF EXISTS "Workspace admins can add members" ON workspace_members;
DROP POLICY IF EXISTS "Users can add themselves to workspaces" ON workspace_members;
DROP POLICY IF EXISTS "Workspace admins can update members" ON workspace_members;
DROP POLICY IF EXISTS "Admins can update members" ON workspace_members;
DROP POLICY IF EXISTS "Workspace admins can remove members" ON workspace_members;
DROP POLICY IF EXISTS "Admins can remove members" ON workspace_members;

-- Create new workspace_members policies
CREATE POLICY "workspace_members_select" ON workspace_members
  FOR SELECT
  USING (true);  -- All authenticated users can view members

CREATE POLICY "workspace_members_insert" ON workspace_members
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);  -- Users can only add themselves

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
-- PART 2: Fix workspaces policies (depends on workspace_members)
-- =====================================================

-- Drop ALL old workspace policies
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

-- Create new workspace policies
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
  WITH CHECK (auth.uid() IS NOT NULL);  -- Any authenticated user can create

CREATE POLICY "workspaces_update" ON workspaces
  FOR UPDATE
  USING (owner_id = auth.uid());  -- Only owner can update

CREATE POLICY "workspaces_delete" ON workspaces
  FOR DELETE
  USING (owner_id = auth.uid());  -- Only owner can delete

-- =====================================================
-- Verification Queries
-- =====================================================

-- Check if policies were created
SELECT schemaname, tablename, policyname, cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('workspaces', 'workspace_members')
ORDER BY tablename, policyname;

-- =====================================================
-- Done!
-- =====================================================
