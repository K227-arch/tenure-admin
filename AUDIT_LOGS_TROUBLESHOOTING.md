# Audit Logs Troubleshooting Guide

## Issue Fixed ✅

The `user_audit_logs` table has been verified and is working correctly.

## What Was Done

1. **Created the audit logs table setup script**: `scripts/create-audit-logs-table.sql`
2. **Verified table exists**: The table is present with 5 existing logs
3. **Improved error handling**: Better error messages in both API and UI
4. **Added detailed error display**: Shows specific error messages and troubleshooting steps

## Common Issues & Solutions

### 1. "Unauthorized" Error
**Cause**: Your admin session has expired or you're not logged in.

**Solution**: 
- Log out and log back in
- Check that your JWT token is valid
- Verify `JWT_SECRET` in `.env.local` matches what was used to create the token

### 2. "Failed to fetch logs" Error
**Cause**: Database query error or missing table.

**Solution**:
- Run the setup script: `npm run tsx scripts/setup-audit-logs.ts`
- Check Supabase connection in `.env.local`
- Verify the table exists in Supabase SQL Editor

### 3. Empty Audit Logs
**Cause**: No logs have been created yet.

**Solution**:
- Logs are created automatically when users/admins perform actions
- You can manually insert test logs using the setup script

## Manual Table Creation

If the automated setup fails, run this SQL in your Supabase SQL Editor:

```sql
-- Create user_audit_logs table
CREATE TABLE IF NOT EXISTS user_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES admin(id) ON DELETE SET NULL,
  action VARCHAR(255) NOT NULL,
  entity_type VARCHAR(100),
  entity_id VARCHAR(255),
  metadata JSONB DEFAULT '{}',
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_audit_logs_user_id ON user_audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_user_audit_logs_action ON user_audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_user_audit_logs_entity_type ON user_audit_logs(entity_type);
CREATE INDEX IF NOT EXISTS idx_user_audit_logs_created_at ON user_audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_audit_logs_success ON user_audit_logs(success);

-- Enable RLS
ALTER TABLE user_audit_logs ENABLE ROW LEVEL SECURITY;

-- Create policy
CREATE POLICY "Service role can access all audit logs" ON user_audit_logs
  FOR ALL USING (true) WITH CHECK (true);

-- Grant permissions
GRANT ALL ON user_audit_logs TO service_role;
GRANT SELECT ON user_audit_logs TO authenticated;
```

## Verify Setup

Run this command to verify everything is working:

```bash
export $(cat .env.local | grep -v '^#' | xargs) && npx tsx scripts/setup-audit-logs.ts
```

Expected output:
```
✅ user_audit_logs table is ready!
✅ Found X audit log(s)
```

## Current Status

- ✅ Table exists: `user_audit_logs`
- ✅ Has data: 5 logs found
- ✅ Indexes created
- ✅ RLS enabled
- ✅ API route working
- ✅ Error handling improved

## Next Steps

1. **Log in to the admin panel** at http://localhost:3000/login
2. **Navigate to the Audit Logs page**
3. **Check browser console** for any error messages
4. If you see "Unauthorized", your session expired - log in again
5. The page should now show your audit logs with better error messages if anything fails
