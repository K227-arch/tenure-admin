# Fix Admin Sessions Not Showing

## Problem
The admin sessions page is not showing any sessions because the `admin_sessions` table might not exist in your Supabase database.

## Solution

### Option 1: Using Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `scripts/create-admin-sessions-table.sql`
4. Click **Run** to execute the SQL

### Option 2: Using Supabase CLI

```bash
# Make sure you're logged in
supabase login

# Link to your project (if not already linked)
supabase link --project-ref your-project-ref

# Run the migration
supabase db push --file scripts/create-admin-sessions-table.sql
```

### Option 3: Manual SQL Execution

Run this SQL in your Supabase SQL Editor:

```sql
-- Create admin_sessions table
CREATE TABLE IF NOT EXISTS admin_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES admin(id) ON DELETE CASCADE,
  session_token TEXT NOT NULL UNIQUE,
  ip_address TEXT,
  user_agent TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  last_activity TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_admin_sessions_admin_id ON admin_sessions(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_session_token ON admin_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_expires_at ON admin_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_is_active ON admin_sessions(is_active);
```

## Verification

After running the SQL:

1. Log out of the admin panel
2. Log back in
3. Go to http://localhost:3000/admin-sessions
4. You should now see your current session

## What This Does

- Creates the `admin_sessions` table to track admin logins
- Adds indexes for better performance
- Sets up Row Level Security (RLS) policies
- Enables automatic session tracking on login

## Troubleshooting

If sessions still don't show:

1. **Check if table exists:**
   ```sql
   SELECT * FROM admin_sessions;
   ```

2. **Check if sessions are being created:**
   - Log in to the admin panel
   - Run: `SELECT * FROM admin_sessions ORDER BY created_at DESC LIMIT 5;`
   - You should see your session

3. **Check browser console:**
   - Open DevTools (F12)
   - Go to Console tab
   - Look for any errors when loading the sessions page

4. **Check API response:**
   - Open DevTools Network tab
   - Refresh the sessions page
   - Look for the `/api/admin-sessions` request
   - Check the response data

## Additional Notes

- Sessions expire after 24 hours
- Expired sessions can be cleaned up using the "Cleanup Expired" button
- Each login creates a new session record
- Sessions are automatically marked as inactive when they expire
