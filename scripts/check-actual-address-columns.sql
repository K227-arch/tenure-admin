-- Check the actual column names in user_addresses table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'user_addresses'
ORDER BY ordinal_position;
