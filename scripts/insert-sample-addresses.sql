-- Insert sample addresses for users who don't have addresses yet
INSERT INTO user_addresses (
  user_id,
  address_line_1,
  address_line_2,
  city,
  state,
  postal_code,
  country,
  address_type,
  is_primary
)
SELECT 
  u.id,
  CASE 
    WHEN ROW_NUMBER() OVER (ORDER BY u.created_at) % 5 = 0 THEN '123 Main Street'
    WHEN ROW_NUMBER() OVER (ORDER BY u.created_at) % 5 = 1 THEN '456 Oak Avenue'
    WHEN ROW_NUMBER() OVER (ORDER BY u.created_at) % 5 = 2 THEN '789 Pine Road'
    WHEN ROW_NUMBER() OVER (ORDER BY u.created_at) % 5 = 3 THEN '321 Elm Boulevard'
    ELSE '654 Maple Drive'
  END,
  CASE 
    WHEN ROW_NUMBER() OVER (ORDER BY u.created_at) % 3 = 0 THEN 'Apt 101'
    WHEN ROW_NUMBER() OVER (ORDER BY u.created_at) % 3 = 1 THEN 'Suite 200'
    ELSE NULL
  END,
  CASE 
    WHEN ROW_NUMBER() OVER (ORDER BY u.created_at) % 4 = 0 THEN 'New York'
    WHEN ROW_NUMBER() OVER (ORDER BY u.created_at) % 4 = 1 THEN 'Los Angeles'
    WHEN ROW_NUMBER() OVER (ORDER BY u.created_at) % 4 = 2 THEN 'Chicago'
    ELSE 'Houston'
  END,
  CASE 
    WHEN ROW_NUMBER() OVER (ORDER BY u.created_at) % 4 = 0 THEN 'NY'
    WHEN ROW_NUMBER() OVER (ORDER BY u.created_at) % 4 = 1 THEN 'CA'
    WHEN ROW_NUMBER() OVER (ORDER BY u.created_at) % 4 = 2 THEN 'IL'
    ELSE 'TX'
  END,
  CASE 
    WHEN ROW_NUMBER() OVER (ORDER BY u.created_at) % 4 = 0 THEN '10001'
    WHEN ROW_NUMBER() OVER (ORDER BY u.created_at) % 4 = 1 THEN '90001'
    WHEN ROW_NUMBER() OVER (ORDER BY u.created_at) % 4 = 2 THEN '60601'
    ELSE '77001'
  END,
  'United States',
  'home',
  true
FROM users u
WHERE NOT EXISTS (
  SELECT 1 FROM user_addresses ua WHERE ua.user_id = u.id
)
LIMIT 100;
