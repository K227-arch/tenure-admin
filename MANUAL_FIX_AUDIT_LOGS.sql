-- Run this in Supabase SQL Editor to fix audit_logs.admin_id

-- Drop the UUID column
ALTER TABLE audit_logs DROP COLUMN IF EXISTS admin_id CASCADE;

-- Add it back as INTEGER
ALTER TABLE audit_logs ADD COLUMN admin_id INTEGER REFERENCES admin(id) ON DELETE SET NULL;

-- Verify the change
SELECT column_name, data_type 
FROM information_schema.columns
WHERE table_name = 'audit_logs' AND column_name = 'admin_id';
