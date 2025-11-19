-- Verify addresses were added
SELECT 
  u.name,
  u.email,
  street_address
  ua.address_line_1,
  ua.address_line_2,
  ua.city,
  ua.state,
  ua.postal_code,
  ua.country
FROM user_addresses ua
JOIN users u ON ua.user_id = u.id
ORDER BY ua.created_at DESC
LIMIT 10;
