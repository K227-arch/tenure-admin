-- ============================================
-- Recreate admin_sessions and admin_activity_logs tables
-- ============================================

BEGIN;

-- Step 1: Drop existing tables if they exist
DROP TABLE IF EXISTS admin_activity_logs CASCADE;
DROP TABLE IF EXISTS admin_sessions CASCADE;

-- Step 2: Drop existing views if they exist
DROP VIEW IF EXISTS active_admin_sessions CASCADE;
DROP VIEW IF EXISTS admin_session_history CASCADE;

-- Step 3: Drop existing functions if they exist
DROP FUNCTION IF EXISTS log_admin_activity CASCADE;
DROP FUNCTION IF EXISTS cleanup_expired_sessions CASCADE;
DROP FUNCTION IF EXISTS get_admin_session_stats CASCADE;
DROP FUNCTION IF EXISTS update_admin_sessions_updated_at CASCADE;

-- Step 4: Create new admin_sessions table
CREATE TABLE admin_sessions (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    admin_id INTEGER NOT NULL REFERENCES admin(id) ON DELETE CASCADE,
    session_token TEXT NOT NULL UNIQUE,
    ip_address TEXT,
    user_agent TEXT,
    expires_at TIMESTAMPTZ NOT NULL,
    last_activity TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE,
    logout_at TIMESTAMPTZ,
    logout_reason VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 5: Create indexes
CREATE INDEX idx_admin_sessions_admin_id ON admin_sessions(admin_id);
CREATE INDEX idx_admin_sessions_session_token ON admin_sessions(session_token);
CREATE INDEX idx_admin_sessions_expires_at ON admin_sessions(expires_at);
CREATE INDEX idx_admin_sessions_is_active ON admin_sessions(is_active);
CREATE INDEX idx_admin_sessions_logout_at ON admin_sessions(logout_at);

-- Step 6: Create admin_activity_logs table
CREATE TABLE admin_activity_logs (
    id SERIAL PRIMARY KEY,
    admin_id INTEGER REFERENCES admin(id) ON DELETE CASCADE,
    session_id TEXT REFERENCES admin_sessions(id) ON DELETE SET NULL,
    action VARCHAR(50) NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    device_info JSONB,
    location_info JSONB,
    success BOOLEAN DEFAULT TRUE,
    error_message TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 7: Create indexes for admin_activity_logs
CREATE INDEX idx_admin_activity_logs_admin_id ON admin_activity_logs(admin_id);
CREATE INDEX idx_admin_activity_logs_session_id ON admin_activity_logs(session_id);
CREATE INDEX idx_admin_activity_logs_action ON admin_activity_logs(action);
CREATE INDEX idx_admin_activity_logs_created_at ON admin_activity_logs(created_at);

-- Step 8: Create updated_at trigger
CREATE FUNCTION update_admin_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER admin_sessions_updated_at
    BEFORE UPDATE ON admin_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_admin_sessions_updated_at();

-- Step 9: Create view for active sessions
CREATE VIEW active_admin_sessions AS
SELECT 
    s.id,
    s.admin_id,
    a.email,
    a.name,
    s.session_token,
    s.ip_address,
    s.user_agent,
    s.created_at as login_at,
    s.last_activity,
    s.expires_at,
    EXTRACT(EPOCH FROM (NOW() - s.last_activity)) / 60 as minutes_inactive,
    EXTRACT(EPOCH FROM (NOW() - s.created_at)) / 60 as session_duration_minutes
FROM admin_sessions s
JOIN admin a ON a.id = s.admin_id
WHERE s.is_active = TRUE 
  AND s.logout_at IS NULL
  AND s.expires_at > NOW()
ORDER BY s.last_activity DESC;

-- Step 10: Create view for session history
CREATE VIEW admin_session_history AS
SELECT 
    s.id,
    s.admin_id,
    a.email,
    a.name,
    s.session_token,
    s.ip_address,
    s.user_agent,
    s.created_at as login_at,
    s.logout_at,
    s.logout_reason,
    s.last_activity,
    CASE 
        WHEN s.logout_at IS NOT NULL THEN EXTRACT(EPOCH FROM (s.logout_at - s.created_at)) / 60
        WHEN s.expires_at < NOW() THEN EXTRACT(EPOCH FROM (s.expires_at - s.created_at)) / 60
        ELSE EXTRACT(EPOCH FROM (NOW() - s.created_at)) / 60
    END as session_duration_minutes,
    CASE 
        WHEN s.logout_at IS NOT NULL THEN 'logged_out'
        WHEN s.expires_at < NOW() THEN 'expired'
        WHEN s.is_active = FALSE THEN 'terminated'
        ELSE 'active'
    END as session_status
FROM admin_sessions s
JOIN admin a ON a.id = s.admin_id
ORDER BY s.created_at DESC;

-- Step 11: Create function to log admin activity
CREATE FUNCTION log_admin_activity(
    p_admin_id INTEGER,
    p_session_id TEXT,
    p_action VARCHAR(50),
    p_ip_address VARCHAR(45),
    p_user_agent TEXT,
    p_success BOOLEAN DEFAULT TRUE,
    p_error_message TEXT DEFAULT NULL,
    p_metadata JSONB DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
    v_log_id INTEGER;
BEGIN
    INSERT INTO admin_activity_logs (
        admin_id,
        session_id,
        action,
        ip_address,
        user_agent,
        success,
        error_message,
        metadata
    ) VALUES (
        p_admin_id,
        p_session_id,
        p_action,
        p_ip_address,
        p_user_agent,
        p_success,
        p_error_message,
        p_metadata
    ) RETURNING id INTO v_log_id;
    
    RETURN v_log_id;
END;
$$ LANGUAGE plpgsql;

-- Step 12: Create function to cleanup expired sessions
CREATE FUNCTION cleanup_expired_sessions()
RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER;
BEGIN
    UPDATE admin_sessions
    SET is_active = FALSE,
        logout_at = NOW(),
        logout_reason = 'expired'
    WHERE expires_at < NOW()
      AND is_active = TRUE
      AND logout_at IS NULL;
    
    GET DIAGNOSTICS v_count = ROW_COUNT;
    
    IF v_count > 0 THEN
        INSERT INTO admin_activity_logs (
            admin_id,
            action,
            success,
            metadata
        )
        SELECT DISTINCT
            admin_id,
            'session_expired',
            TRUE,
            jsonb_build_object('expired_count', v_count)
        FROM admin_sessions
        WHERE expires_at < NOW()
          AND is_active = FALSE
          AND logout_at IS NOT NULL
        LIMIT 1;
    END IF;
    
    RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- Step 13: Create function to get admin session stats
CREATE FUNCTION get_admin_session_stats(p_admin_id INTEGER DEFAULT NULL)
RETURNS TABLE (
    admin_id INTEGER,
    admin_email VARCHAR,
    total_sessions BIGINT,
    active_sessions BIGINT,
    total_logins BIGINT,
    total_logouts BIGINT,
    avg_session_duration_minutes NUMERIC,
    last_login TIMESTAMPTZ,
    last_logout TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.id as admin_id,
        a.email as admin_email,
        COUNT(DISTINCT s.id) as total_sessions,
        COUNT(DISTINCT CASE WHEN s.is_active = TRUE AND s.logout_at IS NULL THEN s.id END) as active_sessions,
        COUNT(DISTINCT l.id) FILTER (WHERE l.action = 'login') as total_logins,
        COUNT(DISTINCT l.id) FILTER (WHERE l.action = 'logout') as total_logouts,
        ROUND(AVG(
            CASE 
                WHEN s.logout_at IS NOT NULL 
                THEN EXTRACT(EPOCH FROM (s.logout_at - s.created_at)) / 60
                ELSE NULL
            END
        )::numeric, 2) as avg_session_duration_minutes,
        MAX(s.created_at) as last_login,
        MAX(s.logout_at) as last_logout
    FROM admin a
    LEFT JOIN admin_sessions s ON s.admin_id = a.id
    LEFT JOIN admin_activity_logs l ON l.admin_id = a.id
    WHERE (p_admin_id IS NULL OR a.id = p_admin_id)
    GROUP BY a.id, a.email
    ORDER BY last_login DESC NULLS LAST;
END;
$$ LANGUAGE plpgsql;

COMMIT;

-- Verify tables created
SELECT '✅ admin_sessions table created' as status;
SELECT '✅ admin_activity_logs table created' as status;
SELECT '✅ Views created: active_admin_sessions, admin_session_history' as status;
SELECT '✅ Functions created: log_admin_activity, cleanup_expired_sessions, get_admin_session_stats' as status;
SELECT '🎉 Setup complete! Ready to track admin sessions.' as status;
