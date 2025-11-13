-- Check the data type of admin.id column
SELECT 
    column_name,
    data_type,
    udt_name
FROM information_schema.columns
WHERE table_name = 'admin' 
    AND column_name = 'id';

-- Also check a sample admin record
SELECT id, email FROM admin LIMIT 1;
