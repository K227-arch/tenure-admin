-- Check if user_contacts table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'user_contacts'
);

-- If table doesn't exist, create it
CREATE TABLE IF NOT EXISTS user_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  contact_type VARCHAR(50),
  contact_value VARCHAR(255),
  is_primary BOOLEAN DEFAULT false,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Add sample phone numbers for existing users
INSERT INTO user_contacts (user_id, contact_type, contact_value, is_primary, is_verified)
SELECT 
  id,
  'phone',
  '+256-' || LPAD(FLOOR(RANDOM() * 10000)::text, 4, '0'),
  true,
  true
FROM users
WHERE id NOT IN (SELECT user_id FROM user_contacts WHERE contact_type = 'phone')
LIMIT 10;

-- Show results
SELECT 
  uc.id,
  u.name as user_name,
  u.email,
  uc.contact_type,
  uc.contact_value,
  uc.is_primary
FROM user_contacts uc
JOIN users u ON uc.user_id = u.id
WHERE uc.contact_type = 'phone'
LIMIT 10;
