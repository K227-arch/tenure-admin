-- Fix existing admin accounts that don't have status or role set
-- Run this in your Supabase SQL editor

-- Add status column if it doesn't exist (with default value)
ALTER TABLE admin 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

-- Add role column if it doesn't exist (with default value)
ALTER TABLE admin 
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'viewer';

-- Add name column if it doesn't exist
ALTER TABLE admin 
ADD COLUMN IF NOT EXISTS name TEXT;

-- Update existing records to have active status if null
UPDATE admin 
SET status = 'active' 
WHERE status IS NULL;

-- Update existing records to have a default role if null
-- Change 'super_admin' to the role you want for existing accounts
-- Options: 'super_admin', 'admin', 'manager', 'viewer'
UPDATE admin 
SET role = 'super_admin' 
WHERE role IS NULL;

-- Set name from email if name is null
UPDATE admin 
SET name = split_part(email, '@', 1)
WHERE name IS NULL OR name = '';

-- Optional: Set specific roles for specific email addresses
-- Uncomment and modify these lines as needed:

-- UPDATE admin SET role = 'super_admin' WHERE email = 'your-email@example.com';
-- UPDATE admin SET role = 'manager' WHERE email = 'manager@example.com';
-- UPDATE admin SET role = 'viewer' WHERE email = 'viewer@example.com';
