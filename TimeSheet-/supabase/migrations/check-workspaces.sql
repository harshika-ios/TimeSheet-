-- Check workspaces
SELECT 'WORKSPACES:' as section;
SELECT id, name, slug, owner_id, created_at FROM workspaces ORDER BY created_at DESC;

-- Check workspace members
SELECT 'WORKSPACE_MEMBERS:' as section;
SELECT wm.id, wm.workspace_id, wm.user_id, wm.role, w.name as workspace_name
FROM workspace_members wm
LEFT JOIN workspaces w ON w.id = wm.workspace_id
ORDER BY wm.created_at DESC;

-- Check profiles
SELECT 'PROFILES:' as section;
SELECT id, email, full_name FROM profiles;
