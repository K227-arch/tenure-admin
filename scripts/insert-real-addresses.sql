-- Insert real user addresses based on the provided data
-- This matches users by email and adds their street addresses

-- John M Doe
INSERT INTO user_addresses (user_id, address_line_1, city, state, postal_code, country, address_type, is_primary)
SELECT id, '12374 58th Ave SE', NULL, NULL, NULL, 'United States', 'home', true
FROM users WHERE email = 'roger.kayongo@gmail.com'
ON CONFLICT DO NOTHING;

-- Tyrone Bartonny
INSERT INTO user_addresses (user_id, address_line_1, city, state, postal_code, country, address_type, is_primary)
SELECT id, '123 edenrd', NULL, NULL, NULL, 'Uganda', 'home', true
FROM users WHERE email = 'tyronebartonny@gmail.com'
ON CONFLICT DO NOTHING;

-- David Muwonge
INSERT INTO user_addresses (user_id, address_line_1, city, state, postal_code, country, address_type, is_primary)
SELECT id, '123 eden', NULL, NULL, NULL, 'Uganda', 'home', true
FROM users WHERE email = 'davidmuwonge14@gmail.com'
ON CONFLICT DO NOTHING;

-- Short animated Series
INSERT INTO user_addresses (user_id, address_line_1, city, state, postal_code, country, address_type, is_primary)
SELECT id, '123 eden road', NULL, NULL, NULL, 'Uganda', 'home', true
FROM users WHERE email = 'tyronmuwonge7@gmail.com'
ON CONFLICT DO NOTHING;

-- Muhumuza Robert
INSERT INTO user_addresses (user_id, address_line_1, city, state, postal_code, country, address_type, is_primary)
SELECT id, '123 mainstreet', NULL, NULL, NULL, 'Uganda', 'home', true
FROM users WHERE email = 'robertmuhumuza624@gmail.com'
ON CONFLICT DO NOTHING;

-- ahumuza Bob
INSERT INTO user_addresses (user_id, address_line_1, city, state, postal_code, country, address_type, is_primary)
SELECT id, 'Kyaliwajjala along eden road', NULL, NULL, NULL, 'Uganda', 'home', true
FROM users WHERE email = 'bobmuhumuza503@gmail.com'
ON CONFLICT DO NOTHING;

-- Dan Trevor Matovu
INSERT INTO user_addresses (user_id, address_line_1, city, state, postal_code, country, address_type, is_primary)
SELECT id, 'Kyaliwajjala along eden road', NULL, NULL, NULL, 'Uganda', 'home', true
FROM users WHERE email = 'trevorsdanny@gmail.com'
ON CONFLICT DO NOTHING;

-- John Micheal doe
INSERT INTO user_addresses (user_id, address_line_1, city, state, postal_code, country, address_type, is_primary)
SELECT id, '123 Main', NULL, NULL, NULL, 'Uganda', 'home', true
FROM users WHERE email = 'gictafricatech@gmail.com'
ON CONFLICT DO NOTHING;

-- Dan Trevor Matovu (second account)
INSERT INTO user_addresses (user_id, address_line_1, city, state, postal_code, country, address_type, is_primary)
SELECT id, 'along eden road', NULL, NULL, NULL, 'Uganda', 'home', true
FROM users WHERE email = 'trevor@treppantechnologies.com'
ON CONFLICT DO NOTHING;

-- keith twesigye
INSERT INTO user_addresses (user_id, address_line_1, city, state, postal_code, country, address_type, is_primary)
SELECT id, '123 eden', NULL, NULL, NULL, 'Uganda', 'home', true
FROM users WHERE email = 'keithtwesigye74@gmail.com'
ON CONFLICT DO NOTHING;

-- Verify the addresses were added
SELECT 
  u.name,
  u.email,
  ua.address_line_1,
  ua.city,
  ua.country
FROM user_addresses ua
JOIN users u ON ua.user_id = u.id
ORDER BY ua.created_at DESC;
