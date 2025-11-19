-- Insert complete user addresses with all details
-- This matches users by email and adds their full address information

-- John M Doe
INSERT INTO user_addresses (user_id, address_line_1, city, state, postal_code, country, address_type, is_primary)
SELECT id, '12374 58th Ave SE', 'Snohomish', 'CA', '98296', 'Uganda', 'home', true
FROM users WHERE email = 'roger.kayongo@gmail.com'
ON CONFLICT DO NOTHING;

-- Tyrone Bartonny
INSERT INTO user_addresses (user_id, address_line_1, city, state, postal_code, country, address_type, is_primary)
SELECT id, '123 edenrd', 'Kaplaiaza', 'AZ', '12334', 'Uganda', 'home', true
FROM users WHERE email = 'tyronebartonny@gmail.com'
ON CONFLICT DO NOTHING;

-- David Muwonge
INSERT INTO user_addresses (user_id, address_line_1, city, state, postal_code, country, address_type, is_primary)
SELECT id, '123 eden', 'Kalazi', 'CT', '12312', 'Uganda', 'home', true
FROM users WHERE email = 'davidmuwonge14@gmail.com'
ON CONFLICT DO NOTHING;

-- Short animated Series
INSERT INTO user_addresses (user_id, address_line_1, city, state, postal_code, country, address_type, is_primary)
SELECT id, '123 eden road', 'Klampis', 'AR', '12453', 'Uganda', 'home', true
FROM users WHERE email = 'tyronmuwonge7@gmail.com'
ON CONFLICT DO NOTHING;

-- Muhumuza Robert
INSERT INTO user_addresses (user_id, address_line_1, city, state, postal_code, country, address_type, is_primary)
SELECT id, '123 mainstreet', 'new york', 'GA', '10001', 'Uganda', 'home', true
FROM users WHERE email = 'robertmuhumuza624@gmail.com'
ON CONFLICT DO NOTHING;

-- ahumuza Bob
INSERT INTO user_addresses (user_id, address_line_1, city, state, postal_code, country, address_type, is_primary)
SELECT id, 'Kyaliwajjala along eden road', 'Kyaliwajjala', 'FL', '12344', 'Uganda', 'home', true
FROM users WHERE email = 'bobmuhumuza503@gmail.com'
ON CONFLICT DO NOTHING;

-- Dan Trevor Matovu
INSERT INTO user_addresses (user_id, address_line_1, city, state, postal_code, country, address_type, is_primary)
SELECT id, 'Kyaliwajjala along eden road', 'Kyaliwajjala', 'GA', '12324', 'United States', 'home', true
FROM users WHERE email = 'trevorsdanny@gmail.com'
ON CONFLICT DO NOTHING;

-- John Micheal doe
INSERT INTO user_addresses (user_id, address_line_1, city, state, postal_code, country, address_type, is_primary)
SELECT id, '123 Main', 'New York', 'AR', '10001', 'Uganda', 'home', true
FROM users WHERE email = 'gictafricatech@gmail.com'
ON CONFLICT DO NOTHING;

-- Dan Trevor Matovu (second account)
INSERT INTO user_addresses (user_id, address_line_1, city, state, postal_code, country, address_type, is_primary)
SELECT id, 'along eden road', 'kiira', 'FL', '12445', 'Uganda', 'home', true
FROM users WHERE email = 'trevor@treppantechnologies.com'
ON CONFLICT DO NOTHING;

-- keith twesigye
INSERT INTO user_addresses (user_id, address_line_1, city, state, postal_code, country, address_type, is_primary)
SELECT id, '123 eden', 'crolina', 'CO', '12345', 'Uganda', 'home', true
FROM users WHERE email = 'keithtwesigye74@gmail.com'
ON CONFLICT DO NOTHING;

-- Verify the addresses were added with full details
SELECT 
  u.name,
  u.email,
  ua.address_line_1,
  ua.city,
  ua.state,
  ua.postal_code,
  ua.country
FROM user_addresses ua
JOIN users u ON ua.user_id = u.id
ORDER BY ua.created_at DESC;
