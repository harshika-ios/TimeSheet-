-- Simple RLS Fix for Development
-- Run this in Supabase SQL Editor

-- Drop ALL existing policies on workspaces
DROP POLICY IF EXISTS "Users can view workspaces they are members of" ON workspaces;
DROP POLICY IF EXISTS "Users can view their workspaces" ON workspaces;
DROP POLICY IF EXISTS "Users can create workspaces" ON workspaces;
DROP POLICY IF EXISTS "Allow authenticated users to create workspaces" ON workspaces;
DROP POLICY IF EXISTS "Workspace owners can update their workspaces" ON workspaces;
DROP POLICY IF EXISTS "Workspace owners can update" ON workspaces;
DROP POLICY IF EXISTS "Workspace owners can delete their workspaces" ON workspaces;
DROP POLICY IF EXISTS "Workspace owners can delete" ON workspaces;

-- Create simple, permissive policies for development
-- SELECT: Users can see workspaces they're members of
CREATE POLICY "workspace_select_policy" ON workspaces
  FOR SELECT
  USING (
    id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
    )
  );

-- INSERT: Any authenticated user can create a workspace
CREATE POLICY "workspace_insert_policy" ON workspaces
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- UPDATE: Only workspace owner can update
CREATE POLICY "workspace_update_policy" ON workspaces
  FOR UPDATE
  USING (owner_id = auth.uid());

-- DELETE: Only workspace owner can delete
CREATE POLICY "workspace_delete_policy" ON workspaces
  FOR DELETE
  USING (owner_id = auth.uid());
