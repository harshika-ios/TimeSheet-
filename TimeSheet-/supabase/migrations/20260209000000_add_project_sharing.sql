-- =====================================================
-- Migration: Add Project Sharing
-- Created: 2026-02-09
-- Adds share token, password, and view tracking to projects
-- =====================================================

ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS share_token UUID UNIQUE DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS is_shared BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS share_password TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS share_last_viewed_at TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS share_view_count INTEGER NOT NULL DEFAULT 0;

-- Fast lookup by share token for public project views
CREATE INDEX IF NOT EXISTS idx_projects_share_token ON projects(share_token) WHERE share_token IS NOT NULL;

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Generate a share token and enable sharing for a project
CREATE OR REPLACE FUNCTION generate_project_share_token(project_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_token UUID;
BEGIN
  new_token := gen_random_uuid();

  UPDATE projects
  SET share_token = new_token,
      is_shared = TRUE
  WHERE id = project_id;

  RETURN new_token;
END;
$$;

-- Revoke sharing for a project
CREATE OR REPLACE FUNCTION revoke_project_share(project_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE projects
  SET share_token = NULL,
      is_shared = FALSE,
      share_password = NULL
  WHERE id = project_id;
END;
$$;

-- Record a view of a shared project link
CREATE OR REPLACE FUNCTION track_project_share_view(token UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE projects
  SET share_last_viewed_at = NOW(),
      share_view_count = COALESCE(share_view_count, 0) + 1
  WHERE share_token = token;
END;
$$;

-- =====================================================
-- COLUMN COMMENTS
-- =====================================================

COMMENT ON COLUMN projects.share_token IS 'Unique token for public project share link';
COMMENT ON COLUMN projects.is_shared IS 'Whether the project share link is active';
COMMENT ON COLUMN projects.share_password IS 'Optional bcrypt-hashed password for share access';
COMMENT ON COLUMN projects.share_last_viewed_at IS 'Timestamp of the most recent share link view';
COMMENT ON COLUMN projects.share_view_count IS 'Total number of share link views';
