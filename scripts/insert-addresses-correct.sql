-- Insert complete user addresses with correct column names
-- This matches users by email and adds their full address information

-- John M Doe
INSERT INTO user_addresses (user_id, street_address, address_line_2, city, state, postal_code, country_code, address_type, is_primary)
SELECT id, '12374 58th Ave SE', NULL, 'Snohomish', 'CA', '98296', 'UG', 'home', true
FROM users WHERE email = 'roger.kayongo@gmail.com';

-- Tyrone Bartonny
INSERT INTO user_addresses (user_id, street_address, address_line_2, city, state, postal_code, country_code, address_type, is_primary)
SELECT id, '123 edenrd', NULL, 'Kaplaiaza', 'AZ', '12334', 'UG', 'home', true
FROM users WHERE email = 'tyronebartonny@gmail.com';

-- David Muwonge
INSERT INTO user_addresses (user_id, street_address, address_line_2, city, state, postal_code, country_code, address_type, is_primary)
SELECT id, '123 eden', NULL, 'Kalazi', 'CT', '12312', 'UG', 'home', true
FROM users WHERE email = 'davidmuwonge14@gmail.com';

-- Short animated Series
INSERT INTO user_addresses (user_id, street_address, address_line_2, city, state, postal_code, country_code, address_type, is_primary)
SELECT id, '123 eden road', NULL, 'Klampis', 'AR', '12453', 'UG', 'home', true
FROM users WHERE email = 'tyronmuwonge7@gmail.com';

-- Muhumuza Robert
INSERT INTO user_addresses (user_id, street_address, address_line_2, city, state, postal_code, country_code, address_type, is_primary)
SELECT id, '123 mainstreet', NULL, 'new york', 'GA', '10001', 'UG', 'home', true
FROM users WHERE email = 'robertmuhumuza624@gmail.com';

-- ahumuza Bob
INSERT INTO user_addresses (user_id, street_address, address_line_2, city, state, postal_code, country_code, address_type, is_primary)
SELECT id, 'Kyaliwajjala along eden road', NULL, 'Kyaliwajjala', 'FL', '12344', 'UG', 'home', true
FROM users WHERE email = 'bobmuhumuza503@gmail.com';

-- Dan Trevor Matovu
INSERT INTO user_addresses (user_id, street_address, address_line_2, city, state, postal_code, country_code, address_type, is_primary)
SELECT id, 'Kyaliwajjala along eden road', NULL, 'Kyaliwajjala', 'GA', '12324', 'US', 'home', true
FROM users WHERE email = 'trevorsdanny@gmail.com';

-- John Micheal doe
INSERT INTO user_addresses (user_id, street_address, address_line_2, city, state, postal_code, country_code, address_type, is_primary)
SELECT id, '123 Main', NULL, 'New York', 'AR', '10001', 'UG', 'home', true
FROM users WHERE email = 'gictafricatech@gmail.com';

-- Dan Trevor Matovu (second account)
INSERT INTO user_addresses (user_id, street_address, address_line_2, city, state, postal_code, country_code, address_type, is_primary)
SELECT id, 'along eden road', NULL, 'kiira', 'FL', '12445', 'UG', 'home', true
FROM users WHERE email = 'trevor@treppantechnologies.com';

-- keith twesigye
INSERT INTO user_addresses (user_id, street_address, address_line_2, city, state, postal_code, country_code, address_type, is_primary)
SELECT id, '123 eden', NULL, 'crolina', 'CO', '12345', 'UG', 'home', true
FROM users WHERE email = 'keithtwesigye74@gmail.com';

-- Verify the addresses were added with full details
SELECT 
  u.name,
  u.email,
  ua.street_address,
  ua.city,
  ua.state,
  ua.postal_code,
  ua.country_code
FROM user_addresses ua
JOIN users u ON ua.user_id = u.id
ORDER BY ua.created_at DESC;
