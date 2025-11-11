-- Check if session table exists and has data
SELECT COUNT(*) as total_sessions FROM session;

-- Show all sessions
SELECT 
    id,
    admin_id,
    session_token,
    ip_address,
    expires_at,
    is_active,
    created_at
FROM session
ORDER BY created_at DESC
LIMIT 10;

-- Check if there are any active sessions
SELECT COUNT(*) as active_sessions 
FROM session 
WHERE expires_at > NOW();

-- Check if there are any expired sessions
SELECT COUNT(*) as expired_sessions 
FROM session 
WHERE expires_at <= NOW();
