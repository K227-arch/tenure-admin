# Debug Admin Sessions Not Showing

## Step 1: Verify Table Exists and Has Data

Run this SQL in Supabase SQL Editor (`scripts/check-admin-sessions.sql`):

```sql
-- Check if admin_sessions table exists and has data
SELECT 
  COUNT(*) as total_sessions,
  COUNT(CASE WHEN is_active = true THEN 1 END) as active_sessions,
  COUNT(CASE WHEN expires_at > NOW() THEN 1 END) as non_expired_sessions
FROM admin_sessions;

-- Show all sessions
SELECT * FROM admin_sessions ORDER BY created_at DESC LIMIT 10;
```

**Expected Result:** You should see at least one session if you've logged in.

**If you see 0 sessions:** Sessions are not being created during login. Continue to Step 2.

## Step 2: Test Manual Session Insert

Run this SQL (`scripts/test-insert-session.sql`):

```sql
-- Insert a test session
INSERT INTO admin_sessions (
  admin_id,
  session_token,
  ip_address,
  user_agent,
  expires_at,
  last_activity,
  is_active
) VALUES (
  (SELECT id FROM admin LIMIT 1),
  'test_session_' || gen_random_uuid()::text,
  '127.0.0.1',
  'Mozilla/5.0 (Test Browser)',
  NOW() + INTERVAL '24 hours',
  NOW(),
  true
);

-- Verify
SELECT * FROM admin_sessions ORDER BY created_at DESC LIMIT 1;
```

**If this works:** The table is fine, but the login API isn't creating sessions. Continue to Step 3.

**If this fails:** There's a permissions issue. Continue to Step 5.

## Step 3: Check Browser Console for Errors

1. Open your browser DevTools (F12)
2. Go to the **Console** tab
3. Navigate to http://localhost:3000/admin-sessions
4. Look for any errors (red text)

Common errors:
- `Failed to fetch sessions` - API error
- `Network error` - Connection issue
- `401 Unauthorized` - Authentication issue

## Step 4: Check Network Tab

1. Open DevTools (F12)
2. Go to **Network** tab
3. Refresh the admin-sessions page
4. Look for the request to `/api/admin-sessions`
5. Click on it and check:
   - **Status**: Should be 200
   - **Response**: Should show `{"sessions": [...]}`

**If status is 500:** Check server logs (Step 6)
**If response is empty array:** Sessions aren't being created (Step 7)

## Step 5: Fix Permissions

Run this SQL to ensure proper permissions:

```sql
-- Grant all permissions
GRANT ALL ON admin_sessions TO authenticated;
GRANT ALL ON admin_sessions TO service_role;
GRANT ALL ON admin_sessions TO anon;

-- Update RLS policy
DROP POLICY IF EXISTS "Allow all for authenticated users" ON admin_sessions;
CREATE POLICY "Allow all for authenticated users" ON admin_sessions
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Also allow service_role to bypass RLS
ALTER TABLE admin_sessions FORCE ROW LEVEL SECURITY;
```

## Step 6: Check Server Logs

When you log in, check your terminal/console where Next.js is running.

Look for:
- `Session created successfully: [session-id]` ✅ Good!
- `Error creating session:` ❌ Problem!

If you see errors, they will tell you what's wrong.

## Step 7: Force Session Creation

After logging in, manually check if a session was created:

```sql
-- Check sessions created in last 5 minutes
SELECT * FROM admin_sessions 
WHERE created_at > NOW() - INTERVAL '5 minutes'
ORDER BY created_at DESC;
```

**If no sessions:** The login API isn't creating them. Check Step 8.

## Step 8: Verify Login API is Updated

Make sure your `app/api/auth/login/route.ts` has the updated session creation code.

The code should include:
```typescript
const { data: sessionData, error: sessionError } = await supabaseAdmin
  .from('admin_sessions')
  .insert({
    admin_id: admin.id,
    session_token: sessionId,
    ip_address: ip,
    user_agent: userAgent,
    expires_at: expiresAt.toISOString(),
    last_activity: new Date().toISOString(),
    is_active: true,
  })
  .select()
  .single();
```

## Step 9: Restart Development Server

Sometimes changes don't take effect until you restart:

```bash
# Stop the server (Ctrl+C)
# Then restart
npm run dev
```

## Step 10: Test Complete Flow

1. **Clear existing sessions:**
   ```sql
   DELETE FROM admin_sessions;
   ```

2. **Log out** from admin panel

3. **Check terminal** - it should be running without errors

4. **Log in** to admin panel

5. **Check terminal** for "Session created successfully" message

6. **Check database:**
   ```sql
   SELECT * FROM admin_sessions ORDER BY created_at DESC LIMIT 1;
   ```

7. **Visit** http://localhost:3000/admin-sessions

8. **You should see your session!**

## Quick Test API Endpoint

You can test the API directly:

```bash
# In your browser or using curl
curl http://localhost:3000/api/admin-sessions
```

Should return JSON with sessions array.

## Still Not Working?

If none of the above works, provide:
1. Output from Step 1 (session count)
2. Any errors from browser console
3. Any errors from terminal/server logs
4. Output from: `SELECT * FROM admin LIMIT 1;`

This will help identify the exact issue!
