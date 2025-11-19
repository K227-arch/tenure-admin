-- Check if user_billing_schedules table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'user_billing_schedules'
);

-- Add sample monthly billing schedules for users
INSERT INTO user_billing_schedules (
  user_id, 
  billing_cycle, 
  amount, 
  currency,
  next_billing_date, 
  is_active,
  created_at,
  updated_at
)
SELECT 
  id,
  'monthly',
  29.99,
  'USD',
  NOW() + INTERVAL '30 days',
  true,
  NOW() - INTERVAL '30 days',
  NOW()
FROM users
WHERE id NOT IN (
  SELECT user_id FROM user_billing_schedules WHERE billing_cycle = 'monthly'
)
LIMIT 5;

-- Add sample yearly billing schedules for some users
INSERT INTO user_billing_schedules (
  user_id, 
  billing_cycle, 
  amount, 
  currency,
  next_billing_date, 
  is_active,
  created_at,
  updated_at
)
SELECT 
  id,
  'yearly',
  299.99,
  'USD',
  NOW() + INTERVAL '365 days',
  true,
  NOW() - INTERVAL '180 days',
  NOW()
FROM users
WHERE id NOT IN (
  SELECT user_id FROM user_billing_schedules WHERE billing_cycle = 'yearly'
)
LIMIT 3;

-- Show results
SELECT 
  u.email,
  u.name,
  bs.billing_cycle,
  bs.amount,
  bs.currency,
  bs.next_billing_date,
  bs.is_active,
  bs.created_at as last_payment
FROM user_billing_schedules bs
JOIN users u ON bs.user_id = u.id
ORDER BY u.email, bs.billing_cycle;
