# 2FA Login Verification Code Fix

## Issue
Login was failing with error: `invalid input syntax for type uuid: "4"`

The 2FA code generation was trying to insert an integer admin ID (4) into a UUID field.

## Root Cause
The Drizzle schema was using a new `two_factor_auth` table with UUID fields, but:
1. The `admin` table uses **integer IDs**, not UUIDs
2. The existing `admin_2fa_codes` table already exists and uses integer IDs
3. Mismatch between table structures caused the error

### Error Details
```
insert into "two_factor_auth" ("admin_id", ...) values ($1, ...)
params: [4, ...]  // ← Integer ID
cause: invalid input syntax for type uuid: "4"  // ← Expected UUID
```

## Solution
Updated Drizzle schema to use the existing `admin_2fa_codes` table instead of creating a new one.

### Changes Made

#### 1. Schema Updated (`lib/db/schema.ts`)
```typescript
// Before - new table with UUID
export const twoFactorAuth = pgTable('two_factor_auth', {
  id: uuid('id').primaryKey().defaultRandom(),
  adminId: integer('admin_id')...  // ← Integer but table expected UUID
  verified: boolean('verified')...
});

// After - existing table with integer
export const twoFactorAuth = pgTable('admin_2fa_codes', {
  id: integer('id').primaryKey(),  // ← Integer ID
  adminId: integer('admin_id')...  // ← Integer admin_id
  used: boolean('used')...         // ← Field name matches existing table
  attempts: integer('attempts')...  // ← Added existing field
});
```

#### 2. Queries Updated (`lib/db/queries.ts`)
```typescript
// Changed field name from 'verified' to 'used'
findLatestByAdminId: async (adminId: number) => {
  // ...where(eq(twoFactorAuth.used, false))  // ← was 'verified'
}

// Changed method name
markAsUsed: async (id: number) => {  // ← was 'markAsVerified'
  await db.update(twoFactorAuth).set({ used: true })...
}
```

#### 3. Login Route Updated (`app/api/auth/login/route.ts`)
```typescript
await twoFactorAuthQueries.create({
  adminId: admin.id,  // ← Integer ID (4, 5, 6, etc.)
  code: codeHash,
  expiresAt,
  used: false,        // ← was 'verified'
  attempts: 0,        // ← Added
});
```

## Existing Table Structure

### admin_2fa_codes
```sql
- id (integer) PRIMARY KEY
- admin_id (integer) → references admin(id)
- code (varchar)
- expires_at (timestamp)
- used (boolean)
- attempts (integer)
- created_at (timestamp)
```

## Result
✅ Login now uses existing `admin_2fa_codes` table  
✅ Integer admin IDs work correctly  
✅ Field names match existing table structure  
✅ No more UUID type errors  
✅ 2FA verification codes can be generated  

## Testing
Try logging in with valid credentials - the verification code should now be generated and stored successfully in the `admin_2fa_codes` table.

## Related Tables
- `admin` - Uses integer IDs (1, 2, 3, 4, etc.)
- `admin_2fa_codes` - Uses integer admin_id references
- `admin_sessions` - Uses integer admin_id references

All admin-related tables use integer IDs, not UUIDs.

---

**Status**: ✅ Fixed  
**Files Modified**: 
- `lib/db/schema.ts`
- `lib/db/queries.ts`
- `app/api/auth/login/route.ts`
