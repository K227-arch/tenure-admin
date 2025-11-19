# Setup Phone Numbers for Users

## Issue
Phone numbers are not showing on user profile cards because the `user_contacts` table either doesn't exist or has no data.

## Solution

### Option 1: Run SQL Directly (Recommended)

Copy and paste this SQL into your Supabase SQL Editor or database client:

```sql
-- Step 1: Create the user_contacts table if it doesn't exist
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

-- Step 2: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_contacts_user_id ON user_contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_user_contacts_type ON user_contacts(contact_type);

-- Step 3: Add sample phone numbers for all users who don't have one
INSERT INTO user_contacts (user_id, contact_type, contact_value, is_primary, is_verified)
SELECT 
  u.id,
  'phone',
  '+1-555-' || LPAD(FLOOR(RANDOM() * 10000)::text, 4, '0'),
  true,
  true
FROM users u
WHERE NOT EXISTS (
  SELECT 1 FROM user_contacts uc 
  WHERE uc.user_id = u.id AND uc.contact_type = 'phone'
);

-- Step 4: Verify the data
SELECT 
  u.email,
  u.name,
  uc.contact_value as phone_number,
  uc.is_primary
FROM user_contacts uc
JOIN users u ON uc.user_id = u.id
WHERE uc.contact_type = 'phone'
ORDER BY u.email
LIMIT 20;
```

### Option 2: Run TypeScript Script

```bash
npx tsx scripts/setup-user-contacts.ts
```

### Option 3: Add Phone Numbers Manually

If you want to add specific phone numbers for specific users:

```sql
-- Replace USER_EMAIL and PHONE_NUMBER with actual values
INSERT INTO user_contacts (user_id, contact_type, contact_value, is_primary, is_verified)
SELECT 
  id,
  'phone',
  '+1-234-567-8900',  -- Replace with actual phone number
  true,
  true
FROM users
WHERE email = 'user@example.com';  -- Replace with actual email
```

## Verify It's Working

1. Run one of the SQL scripts above
2. Restart your dev server: `npm run dev`
3. Navigate to http://localhost:3000/users
4. Click on a user profile
5. You should now see the phone number displayed

## Troubleshooting

### If phone numbers still don't show:

1. **Check the API logs** - Look for console.log messages about contacts
2. **Check the browser console** - Look for any errors
3. **Verify the data exists**:
   ```sql
   SELECT COUNT(*) FROM user_contacts WHERE contact_type = 'phone';
   ```
4. **Check the API response** - Open browser DevTools > Network tab > Click on the `/api/users` request > Check if `phone` field is in the response

### Common Issues:

- **Table doesn't exist**: Run the CREATE TABLE statement above
- **No data**: Run the INSERT statement above
- **Wrong column names**: The table must have `contact_type` and `contact_value` columns
- **Foreign key constraint**: Make sure the `users` table exists first

## Data Format

The `user_contacts` table stores contacts like this:

| user_id | contact_type | contact_value | is_primary | is_verified |
|---------|--------------|---------------|------------|-------------|
| uuid-1  | phone        | +1-555-1234   | true       | true        |
| uuid-1  | email        | user@mail.com | false      | true        |
| uuid-2  | phone        | +1-555-5678   | true       | false       |

The API will:
1. Look for contacts where `contact_type = 'phone'`
2. Prioritize contacts where `is_primary = true`
3. Fall back to any phone contact if no primary exists
4. Return `null` if no phone contacts exist
