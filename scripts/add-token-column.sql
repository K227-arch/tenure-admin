-- Add token column to admin_sessions table
ALTER TABLE admin_sessions 
ADD COLUMN IF NOT EXISTS token TEXT UNIQUE;

-- Verify the change
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'admin_sessions'
ORDER BY ordinal_position;
