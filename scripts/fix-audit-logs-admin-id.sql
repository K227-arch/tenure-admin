-- Change admin_id from UUID to INTEGER in audit_logs table
ALTER TABLE audit_logs 
ALTER COLUMN admin_id TYPE INTEGER USING admin_id::text::integer;

-- Verify the change
SELECT column_name, data_type 
FROM information_schema.columns
WHERE table_name = 'audit_logs' AND column_name = 'admin_id';
