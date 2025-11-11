-- Test inserting a session manually to verify table structure
-- First, get an admin ID
DO $$
DECLARE
    test_admin_id UUID;
BEGIN
    -- Get the first admin ID
    SELECT id INTO test_admin_id FROM admin LIMIT 1;
    
    IF test_admin_id IS NOT NULL THEN
        -- Insert a test session
        INSERT INTO session (
            admin_id,
            session_token,
            ip_address,
            user_agent,
            expires_at,
            last_activity,
            is_active
        ) VALUES (
            test_admin_id,
            'test_session_' || gen_random_uuid()::text,
            '127.0.0.1',
            'Test Browser',
            NOW() + INTERVAL '24 hours',
            NOW(),
            true
        );
        
        RAISE NOTICE 'Test session created successfully for admin: %', test_admin_id;
    ELSE
        RAISE NOTICE 'No admin found in the admin table';
    END IF;
END $$;

-- Verify the insert
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
LIMIT 1;
