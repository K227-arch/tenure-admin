-- Check if user_addresses table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'user_addresses'
);

-- Check current addresses
SELECT COUNT(*) as address_count FROM user_addresses;

-- Show sample addresses if any exist
SELECT 
  ua.id,
  ua.user_id,
  u.name as user_name,
  u.email,
  ua.address_line_1,
  ua.address_line_2,
  ua.city,
  ua.state,
  ua.postal_code,
  ua.country,
  ua.is_primary
FROM user_addresses ua
LEFT JOIN users u ON ua.user_id = u.id
LIMIT 5;

-- If no addresses exist, let's see what users we have
SELECT id, name, email FROM users LIMIT 10;
