# Admin Accounts Fixed - Using Existing Table

## Issue
Admin accounts page was showing empty - no admins were displayed.

## Root Cause
Drizzle was configured to use a new `admin_accounts` table, but all existing admin data was in the `admin` table.

## Solution
Updated Drizzle schema to use the existing `admin` table instead of creating a new one.

### Key Changes

#### 1. Schema Updated (`lib/db/schema.ts`)
```typescript
// Changed from 'admin_accounts' to 'admin'
export const adminAccounts = pgTable('admin', {
  id: integer('id').primaryKey(),  // Changed from uuid to integer
  email: varchar('email', { length: 255 }).notNull().unique(),
  hash: varchar('hash', { length: 255 }),  // Changed from 'password'
  salt: varchar('salt', { length: 255 }),  // Added salt field
  name: text('name'),
  role: text('role').notNull().default('admin'),  // Changed from enum to text
  status: text('status').default('active'),  // Changed from enum to text
  twoFactorEnabled: boolean('two_factor_enabled').default(false),
  // ... other existing fields
});
```

#### 2. Queries Updated (`lib/db/queries.ts`)
- Changed all ID parameters from `string` to `number`
- Updated to work with `hash`/`salt` instead of `password`

#### 3. API Routes Updated
**`app/api/admin-accounts/route.ts`**
- Generate `hash` and `salt` instead of hashing password directly
- Remove sensitive fields: `hash`, `salt`, `resetPasswordToken`, `twoFactorSecret`, `backupCodes`

**`app/api/admin-accounts/[id]/route.ts`**
- Parse ID as integer: `parseInt(params.id)`
- Update hash/salt when password is changed
- Convert ID to string for audit logs

**`app/api/auth/login/route.ts`**
- Verify password using hash and salt comparison

## Result

✅ Admin accounts now display correctly
✅ 6 admins loaded from existing `admin` table
✅ All CRUD operations working
✅ Password hashing/verification working with hash/salt

## Test Results

```bash
curl 'http://localhost:3000/api/admin-accounts'
```

Returns 6 admins:
- dantetrevordrex@gmail.com (admin)
- keith@gmail.com (admin)
- keithtwesigye74@gmail.com (super_admin)
- Bagumaandrew5@gmail.com (admin)
- roger.kayongo@gmail.com (admin)
- mugishamoses999@gmail.com (admin)

## Database Structure Matched

The existing `admin` table has:
- `id` (integer, auto-increment)
- `hash` and `salt` (for password storage)
- `role` and `status` (text fields, not enums)
- Additional fields: `reset_password_token`, `login_attempts`, `lock_until`, etc.

## Benefits

1. **No data migration needed** - Uses existing data
2. **Backward compatible** - Works with existing authentication
3. **Type-safe** - Full Drizzle ORM benefits
4. **Maintains security** - Hash/salt password storage preserved

## Next Steps

Apply the same approach to other tables:
1. Check existing table structure
2. Update Drizzle schema to match
3. Update queries and API routes
4. Test thoroughly

## Lesson Learned

When integrating Drizzle with existing databases:
- **Always use existing tables** when possible
- **Match exact column names and types**
- **Preserve existing authentication mechanisms**
- **Test with real data** before deploying
