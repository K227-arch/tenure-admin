# Drizzle ORM Quick Start

## Installation Complete ✅

Drizzle ORM has been integrated into your admin application. Here's what you need to know:

## Quick Commands

```bash
# Push schema to database (development)
npm run db:push

# Generate migration files
npm run db:generate

# Run migrations (production)
npm run db:migrate

# Open Drizzle Studio (database GUI)
npm run db:studio
```

## Using Drizzle in Your Code

### Import Query Helpers

```typescript
import { 
  adminAccountQueries,
  userQueries,
  subscriptionQueries,
  transactionQueries,
  auditLogQueries 
} from '@/lib/db/queries';
```

### Common Operations

#### Find a User
```typescript
const user = await userQueries.findByEmail('user@example.com');
const user = await userQueries.findById('user-id');
```

#### Create a User
```typescript
const newUser = await userQueries.create({
  email: 'user@example.com',
  name: 'John Doe',
  status: 'active',
});
```

#### Update a User
```typescript
const updated = await userQueries.update('user-id', {
  name: 'Jane Doe',
  status: 'inactive',
});
```

#### Get All Users with Filters
```typescript
const users = await userQueries.getAll(50, 0, {
  status: 'active',
  search: 'john',
});
```

#### Create Audit Log
```typescript
await auditLogQueries.create({
  adminId: 'admin-id',
  adminEmail: 'admin@example.com',
  action: 'update',
  resource: 'user',
  resourceId: 'user-id',
  details: { field: 'status', oldValue: 'active', newValue: 'inactive' },
  ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
  userAgent: request.headers.get('user-agent') || 'unknown',
  status: 'success',
});
```

## Migrated Routes

These routes now use Drizzle ORM:
- ✅ `/api/admin-accounts` - Admin account management
- ✅ `/api/admin-accounts/[id]` - Individual admin operations
- ✅ `/api/auth/login` - Authentication
- ✅ `/api/users` - User management
- ✅ `/api/subscriptions` - Subscription management

## File Structure

```
lib/
  db/
    schema.ts      # Database schema definitions
    index.ts       # Database connection
    queries.ts     # Reusable query functions
```

## Available Query Modules

- `adminAccountQueries` - Admin account CRUD
- `adminSessionQueries` - Session management
- `twoFactorAuthQueries` - 2FA code handling
- `auditLogQueries` - Audit logging
- `userQueries` - User management
- `subscriptionQueries` - Subscription operations
- `transactionQueries` - Transaction tracking
- `payoutQueries` - Payout management
- `membershipQueueQueries` - Queue operations
- `billingScheduleQueries` - Billing schedules
- `adminAlertQueries` - Alert management

## Type Safety

All queries return properly typed data:

```typescript
import type { User, AdminAccount, Subscription } from '@/lib/db/schema';

const user: User | null = await userQueries.findById('id');
const admin: AdminAccount = await adminAccountQueries.create({...});
```

## Direct Database Access

For complex queries, use the `db` instance directly:

```typescript
import { db } from '@/lib/db';
import { users, subscriptions } from '@/lib/db/schema';
import { eq, and, gte } from 'drizzle-orm';

const result = await db
  .select()
  .from(users)
  .leftJoin(subscriptions, eq(users.id, subscriptions.userId))
  .where(and(
    eq(users.status, 'active'),
    gte(users.createdAt, new Date('2024-01-01'))
  ));
```

## Next Steps

1. **Test the migrated routes** - Verify everything works
2. **Migrate remaining routes** - See `DRIZZLE_INTEGRATION_GUIDE.md`
3. **Push schema to database** - Run `npm run db:push`
4. **Explore Drizzle Studio** - Run `npm run db:studio`

## Need Help?

- Full guide: `DRIZZLE_INTEGRATION_GUIDE.md`
- Drizzle docs: https://orm.drizzle.team/
- Schema reference: `lib/db/schema.ts`
- Query examples: `lib/db/queries.ts`
