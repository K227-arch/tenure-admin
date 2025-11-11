-- Test script to manually insert a session
-- Replace 'YOUR_ADMIN_ID' with an actual admin ID from your admin table

-- First, get an admin ID
SELECT id, email FROM admin LIMIT 1;

-- Then insert a test session (replace the admin_id value with the ID from above)
INSERT INTO admin_sessions (
  admin_id,
  session_token,
  ip_address,
  user_agent,
  expires_at,
  last_activity,
  is_active
) VALUES (
  (SELECT id FROM admin LIMIT 1), -- This will use the first admin's ID
  'test_session_' || gen_random_uuid()::text,
  '127.0.0.1',
  'Mozilla/5.0 (Test Browser)',
  NOW() + INTERVAL '24 hours',
  NOW(),
  true
);

-- Verify the insert worked
SELECT * FROM admin_sessions ORDER BY created_at DESC LIMIT 1;
