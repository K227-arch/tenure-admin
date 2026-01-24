-- Check the actual structure of kyc_verification table
-- Run this in Supabase SQL Editor to see what columns exist

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'kyc_verification' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Also show a sample record to see the actual data structure
SELECT * FROM kyc_verification LIMIT 1;