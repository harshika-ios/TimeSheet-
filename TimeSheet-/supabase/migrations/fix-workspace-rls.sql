-- Fix Workspace RLS Policies
-- Run this in your Supabase SQL Editor

-- Drop existing policies
DROP POLICY IF EXISTS "Users can create workspaces" ON workspaces;
DROP POLICY IF EXISTS "Workspace owners can update their workspaces" ON workspaces;
DROP POLICY IF EXISTS "Workspace owners can delete their workspaces" ON workspaces;

-- Recreate INSERT policy - allow authenticated users to create workspaces where they are the owner
CREATE POLICY "Allow authenticated users to create workspaces"
  ON workspaces FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = owner_id);

-- Recreate UPDATE policy
CREATE POLICY "Workspace owners can update"
  ON workspaces FOR UPDATE
  TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

-- Recreate DELETE policy
CREATE POLICY "Workspace owners can delete"
  ON workspaces FOR DELETE
  TO authenticated
  USING (auth.uid() = owner_id);
