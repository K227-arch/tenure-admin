# Setup Payment Dates for Users

## Issue
Payment dates are not showing on user profile cards because the `user_billing_schedules` table has no data.

## Quick Fix - Run This SQL

Copy and paste this into your Supabase SQL Editor:

```sql
-- Add sample monthly billing schedules (last payment 30 days ago, next in 30 days)
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

-- Add sample yearly billing schedules (last payment 6 months ago, next in 6 months)
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
  NOW() + INTERVAL '6 months',
  true,
  NOW() - INTERVAL '6 months',
  NOW()
FROM users
WHERE id NOT IN (
  SELECT user_id FROM user_billing_schedules WHERE billing_cycle = 'yearly'
)
LIMIT 3;

-- Verify the data
SELECT 
  u.email,
  u.name,
  bs.billing_cycle,
  bs.amount,
  bs.next_billing_date,
  bs.created_at as last_payment_date,
  bs.is_active
FROM user_billing_schedules bs
JOIN users u ON bs.user_id = u.id
ORDER BY u.email;
```

## Alternative: Run TypeScript Script

```bash
npx tsx scripts/setup-billing-schedules.ts
```

## What This Does

The script will add:
- **5 monthly billing schedules** ($29.99/month)
  - Last payment: 30 days ago
  - Next payment: 30 days from now
  
- **3 yearly billing schedules** ($299.99/year)
  - Last payment: 6 months ago
  - Next payment: 6 months from now

## After Running

1. Refresh your browser (Ctrl+Shift+R)
2. Go to http://localhost:3000/users
3. Click on a user profile
4. You should now see:
   - **Last Monthly Payment**: Date + Amount
   - **Next Monthly Payment**: Date
   - **Last Annual Payment**: Date + Amount
   - **Next Annual Payment**: Date

## Expected Display

```
Payment Information
┌─────────────────────────────────────────────┐
│ Last Monthly Payment: 12/20/2024            │
│                      $29.99                 │
│ Next Monthly Payment: 1/19/2025             │
│                                             │
│ Last Annual Payment:  7/19/2024             │
│                      $299.99                │
│ Next Annual Payment:  7/19/2025             │
└─────────────────────────────────────────────┘
```

## Troubleshooting

### If dates still don't show:

1. **Check if data exists**:
   ```sql
   SELECT COUNT(*) FROM user_billing_schedules;
   ```

2. **Check the API response**:
   - Open DevTools > Network tab
   - Go to /users page
   - Click on `/api/users` request
   - Check if these fields exist in the response:
     - `last_monthly_payment`
     - `next_monthly_payment`
     - `last_annual_payment`
     - `next_annual_payment`
     - `monthly_amount`
     - `annual_amount`

3. **Check server logs**:
   Look for errors like "Error fetching billing schedule data"

4. **Verify table structure**:
   ```sql
   SELECT column_name, data_type 
   FROM information_schema.columns 
   WHERE table_name = 'user_billing_schedules';
   ```
   
   Required columns:
   - `user_id` (uuid)
   - `billing_cycle` (varchar)
   - `amount` (decimal/numeric)
   - `next_billing_date` (timestamp)
   - `is_active` (boolean)
   - `created_at` (timestamp)

## Add Custom Billing Schedules

To add a specific billing schedule for a specific user:

```sql
-- Replace values as needed
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
  'monthly',              -- or 'yearly'
  49.99,                  -- amount
  'USD',
  '2025-02-15',          -- next billing date
  true,
  '2024-12-15',          -- last payment date (created_at)
  NOW()
FROM users
WHERE email = 'user@example.com';  -- replace with actual email
```

## Data Format

The `user_billing_schedules` table stores:

| Field | Purpose |
|-------|---------|
| `billing_cycle` | 'monthly' or 'yearly' |
| `amount` | Payment amount (e.g., 29.99) |
| `created_at` | Used as "last payment date" |
| `next_billing_date` | Next scheduled payment |
| `is_active` | Whether schedule is active |

## How the API Uses This Data

1. Fetches all billing schedules for a user
2. Filters by `billing_cycle`:
   - `'monthly'` → monthly payments
   - `'yearly'` or `'annual'` → annual payments
3. Uses `created_at` as the last payment date
4. Uses `next_billing_date` for next payment (only if `is_active = true`)
5. Returns `amount` for display
