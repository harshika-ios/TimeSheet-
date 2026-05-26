-- Disable RLS on both tables for development
-- We'll fix this properly later

ALTER TABLE workspaces DISABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_members DISABLE ROW LEVEL SECURITY;

-- Verify they're disabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('workspaces', 'workspace_members')
ORDER BY tablename;
