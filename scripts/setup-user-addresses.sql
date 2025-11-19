-- Create user_addresses table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  address_line1 VARCHAR(255),
  address_line2 VARCHAR(255),
  city VARCHAR(100),
  state VARCHAR(100),
  postal_code VARCHAR(20),
  country VARCHAR(100),
  address_type VARCHAR(50),
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_addresses_user_id ON user_addresses(user_id);

-- Add sample addresses for users who don't have one
INSERT INTO user_addresses (user_id, address_line1, city, state, postal_code, country, address_type, is_primary)
SELECT 
  id,
  CASE 
    WHEN RANDOM() < 0.5 THEN '123 Main Street'
    ELSE '456 Oak Avenue'
  END,
  CASE 
    WHEN RANDOM() < 0.33 THEN 'Kampala'
    WHEN RANDOM() < 0.66 THEN 'Entebbe'
    ELSE 'Jinja'
  END,
  'Central Region',
  LPAD(FLOOR(RANDOM() * 100000)::text, 5, '0'),
  'Uganda',
  'home',
  true
FROM users
WHERE id NOT IN (SELECT user_id FROM user_addresses)
LIMIT 10;

-- Show results
SELECT 
  u.email,
  u.name,
  ua.address_line1,
  ua.city,
  ua.state,
  ua.postal_code,
  ua.country,
  ua.is_primary
FROM user_addresses ua
JOIN users u ON ua.user_id = u.id
ORDER BY u.email
LIMIT 20;
