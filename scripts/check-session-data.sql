-- Check if there's any data in the tables

-- Check admin_sessions table
SELECT 'admin_sessions' as table_name, COUNT(*) as row_count FROM admin_sessions;

-- Check admin_activity_logs table
SELECT 'admin_activity_logs' as table_name, COUNT(*) as row_count FROM admin_activity_logs;

-- Show recent sessions
SELECT 
    id,
    admin_id,
    session_token,
    created_at,
    is_active,
    logout_at
FROM admin_sessions
ORDER BY created_at DESC
LIMIT 5;

-- Show recent activity logs
SELECT 
    id,
    admin_id,
    action,
    created_at,
    success
FROM admin_activity_logs
ORDER BY created_at DESC
LIMIT 5;

-- Check if views work
SELECT COUNT(*) as active_sessions_count FROM active_admin_sessions;
SELECT COUNT(*) as session_history_count FROM admin_session_history;
