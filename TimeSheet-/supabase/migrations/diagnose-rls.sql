-- Diagnose RLS Issues
-- Run this in Supabase SQL Editor to see what's wrong

-- 1. Check if RLS is enabled on workspaces table
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public' AND tablename = 'workspaces';

-- 2. List all policies on workspaces table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'workspaces';

-- 3. Check current user
SELECT auth.uid() as current_user_id;

-- 4. Test if we can see any workspaces
SELECT * FROM workspaces LIMIT 5;
