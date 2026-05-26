-- Add project sharing columns
-- Run this in Supabase SQL Editor

ALTER TABLE projects
ADD COLUMN IF NOT EXISTS share_token UUID UNIQUE DEFAULT NULL,
ADD COLUMN IF NOT EXISTS is_shared BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS share_password TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS share_last_viewed_at TIMESTAMPTZ DEFAULT NULL,
ADD COLUMN IF NOT EXISTS share_view_count INTEGER DEFAULT 0;

-- Create index on share_token for fast lookups
CREATE INDEX IF NOT EXISTS idx_projects_share_token ON projects(share_token) WHERE share_token IS NOT NULL;

-- Function to generate share token for a project
CREATE OR REPLACE FUNCTION generate_project_share_token(project_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_token UUID;
BEGIN
  -- Generate new UUID token
  new_token := gen_random_uuid();

  -- Update project with token and set is_shared to true
  UPDATE projects
  SET share_token = new_token,
      is_shared = TRUE
  WHERE id = project_id;

  RETURN new_token;
END;
$$;

-- Function to revoke project share
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

-- Function to track project share views
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

COMMENT ON COLUMN projects.share_token IS 'Unique token for sharing project publicly';
COMMENT ON COLUMN projects.is_shared IS 'Whether project is currently shared';
COMMENT ON COLUMN projects.share_password IS 'Optional bcrypt hashed password for share access';
COMMENT ON COLUMN projects.share_last_viewed_at IS 'Last time the shared link was viewed';
COMMENT ON COLUMN projects.share_view_count IS 'Number of times the shared link was viewed';
