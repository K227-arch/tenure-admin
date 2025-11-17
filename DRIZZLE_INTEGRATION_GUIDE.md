# Drizzle ORM Integration Guide

## Overview

This guide documents the integration of Drizzle ORM into the admin application, replacing direct Supabase queries with a type-safe ORM layer.

## What's Been Done

### 1. Schema Definition (`lib/db/schema.ts`)

Created comprehensive database schema with:
- Admin accounts and sessions
- Two-factor authentication
- Audit logs
- Users and subscriptions
- Transactions and payouts
- Membership queue
- Billing schedules
- Admin alerts

All tables include proper TypeScript types and relationships.

### 2. Database Connection (`lib/db/index.ts`)

Set up Drizzle connection using postgres-js driver with schema integration.

### 3. Query Helpers (`lib/db/queries.ts`)

Created reusable query functions for all entities:
- `adminAccountQueries` - CRUD operations for admin accounts
- `adminSessionQueries` - Session management
- `twoFactorAuthQueries` - 2FA code handling
- `auditLogQueries` - Audit log creation and retrieval
- `userQueries` - User management
- `subscriptionQueries` - Subscription operations
- `transactionQueries` - Transaction tracking
- `payoutQueries` - Payout management
- `membershipQueueQueries` - Queue management
- `billingScheduleQueries` - Billing operations
- `adminAlertQueries` - Alert management

### 4. Migrated API Routes

The following routes have been migrated to use Drizzle:
- ✅ `/api/admin-accounts` (GET, POST)
- ✅ `/api/admin-accounts/[id]` (PUT, DELETE)
- ✅ `/api/auth/login` (POST)

## Database Setup

### Generate Migration Files

```bash
npm run db:generate
```

This creates migration SQL files in the `drizzle` directory based on your schema.

### Push Schema to Database

For development, you can push the schema directly without migrations:

```bash
npm run db:push
```

### Run Migrations (Production)

```bash
npm run db:migrate
```

### Open Drizzle Studio

Drizzle Studio provides a GUI for viewing and editing your database:

```bash
npm run db:studio
```

## Migration Strategy

### Existing Tables

Your Supabase database already has tables. Here's how to handle the migration:

1. **Backup your database** before making any changes
2. **Review existing schema** - Check if your current tables match the Drizzle schema
3. **Adjust schema if needed** - Modify `lib/db/schema.ts` to match existing tables
4. **Use `db:push` carefully** - This will alter existing tables

### Table Mapping

Drizzle schema → Existing Supabase tables:
- `admin_accounts` → `admin` (needs migration)
- `admin_sessions` → `admin_sessions` (may exist)
- `two_factor_auth` → `admin_2fa_codes` (needs migration)
- `audit_logs` → `user_audit_logs` (needs migration)
- `users` → `users` (may exist)
- `subscriptions` → `subscriptions` (may exist)
- `transactions` → `transactions` (may exist)

### Handling Schema Differences

If your existing tables have different column names:

1. Update `lib/db/schema.ts` to match existing columns
2. Or create a migration script to rename columns
3. Update query functions in `lib/db/queries.ts` accordingly

## Remaining Routes to Migrate

### High Priority
- `/api/auth/verify-login` - Login verification
- `/api/auth/logout` - Session cleanup
- `/api/admin-sessions/*` - Session management
- `/api/audit-logs` - Audit log retrieval

### Medium Priority
- `/api/users/*` - User management
- `/api/subscriptions/*` - Subscription management
- `/api/transactions` - Transaction listing
- `/api/payouts` - Payout management

### Low Priority
- `/api/membership-queue` - Queue management
- `/api/billing-schedules` - Billing operations
- `/api/admin-alerts/*` - Alert management
- `/api/dashboard/stats` - Dashboard statistics

## Usage Examples

### Creating an Admin Account

```typescript
import { adminAccountQueries } from '@/lib/db/queries';
import bcrypt from 'bcryptjs';

const hashedPassword = await bcrypt.hash(password, 10);
const admin = await adminAccountQueries.create({
  email: 'admin@example.com',
  password: hashedPassword,
  name: 'Admin User',
  role: 'admin',
  status: 'active',
});
```

### Finding an Admin by Email

```typescript
const admin = await adminAccountQueries.findByEmail('admin@example.com');
```

### Creating an Audit Log

```typescript
import { auditLogQueries } from '@/lib/db/queries';

await auditLogQueries.create({
  adminId: admin.id,
  adminEmail: admin.email,
  action: 'create',
  resource: 'user',
  resourceId: user.id,
  details: { name: user.name },
  ipAddress: '192.168.1.1',
  userAgent: 'Mozilla/5.0...',
  status: 'success',
});
```

### Querying with Filters

```typescript
const transactions = await transactionQueries.getAll(50, 0, {
  userId: 'user-id',
  status: 'completed',
  startDate: new Date('2024-01-01'),
  endDate: new Date('2024-12-31'),
});
```

## Benefits of Drizzle ORM

1. **Type Safety** - Full TypeScript support with inferred types
2. **Better DX** - Autocomplete and type checking in your IDE
3. **Performance** - Efficient queries with minimal overhead
4. **Flexibility** - Easy to write complex queries when needed
5. **Migrations** - Built-in migration system
6. **Relations** - Easy to define and query relationships

## Next Steps

1. **Test migrated routes** - Ensure all functionality works correctly
2. **Migrate remaining routes** - Continue replacing Supabase queries
3. **Add relations** - Define relationships between tables for easier joins
4. **Optimize queries** - Use Drizzle's query builder for complex operations
5. **Add indexes** - Improve query performance with proper indexes
6. **Set up CI/CD** - Automate migrations in deployment pipeline

## Troubleshooting

### Connection Issues

If you get connection errors, check:
- `DATABASE_URL` in `.env.local` is correct
- Database is accessible from your network
- Using the correct port (6543 for transaction mode)

### Type Errors

If you get TypeScript errors:
- Run `npm run db:generate` to regenerate types
- Restart your TypeScript server
- Check that schema matches database structure

### Migration Conflicts

If migrations fail:
- Check existing table structure
- Manually adjust schema to match
- Use `db:push` for development (careful in production)

## Resources

- [Drizzle ORM Documentation](https://orm.drizzle.team/)
- [Drizzle with PostgreSQL](https://orm.drizzle.team/docs/get-started-postgresql)
- [Drizzle Kit](https://orm.drizzle.team/kit-docs/overview)
