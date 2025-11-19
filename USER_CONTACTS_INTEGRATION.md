# User Contacts Integration

## Overview
Added phone number display from the `user_contacts` table to the user profile cards in the User Management page.

## Changes Made

### 1. Database Schema (`lib/db/schema.ts`)
Added the `userContacts` table definition:
```typescript
export const userContacts = pgTable('user_contacts', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  contactType: varchar('contact_type', { length: 50 }),
  contactValue: varchar('contact_value', { length: 255 }),
  isPrimary: boolean('is_primary').default(false),
  isVerified: boolean('is_verified').default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});
```

### 2. API Routes

#### `/app/api/users/route.ts`
- Imports `userContacts` from schema
- Fetches phone numbers for each user from `user_contacts` table
- Prioritizes primary phone numbers (`is_primary = true`)
- Falls back to any phone contact if no primary is set
- Returns phone number in user object

#### `/app/api/users/[id]/route.ts`
- Same logic for individual user fetches
- Ensures phone numbers display in user detail modal

## How It Works

1. **Query Logic**: For each user, the API queries the `user_contacts` table
2. **Filtering**: Looks for contacts where `contact_type = 'phone'`
3. **Priority**: 
   - First tries to find a primary phone (`is_primary = true`)
   - If no primary, uses the first phone contact found
   - Returns `null` if no phone contacts exist
4. **Display**: Phone number appears in the user profile card under the "Phone Number" field

## Data Structure

The `user_contacts` table stores various contact types:
- **contact_type**: 'phone', 'email', 'address', etc.
- **contact_value**: The actual contact information (phone number, email, etc.)
- **is_primary**: Boolean flag to mark the primary contact
- **is_verified**: Boolean flag to indicate if contact is verified

## Error Handling

- Wrapped in try-catch to prevent failures if table doesn't exist
- Logs errors to console for debugging
- Returns `null` for phone if query fails
- Doesn't break user list display on errors

## Example Data

```sql
-- Example user_contacts records
INSERT INTO user_contacts (user_id, contact_type, contact_value, is_primary) VALUES
('user-uuid-1', 'phone', '+1-555-0123', true),
('user-uuid-1', 'phone', '+1-555-0456', false),
('user-uuid-2', 'phone', '+44-20-1234-5678', true);
```

## Testing

To verify the integration:
1. Navigate to http://localhost:3000/users
2. Click on a user to view their profile
3. Check the "Phone Number" field in the profile modal
4. Should display the phone number from `user_contacts` table

## Notes

- If a user has multiple phone numbers, only the primary (or first) one is displayed
- The phone field gracefully shows "Not provided" if no phone contacts exist
- All contact queries are wrapped in error handling for stability
