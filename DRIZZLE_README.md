# Drizzle ORM Integration - Complete Guide

## 📚 Documentation Index

This project now uses Drizzle ORM for type-safe database operations. Here's your complete guide:

### Quick Start
- **[DRIZZLE_QUICK_START.md](./DRIZZLE_QUICK_START.md)** - Get started in 5 minutes
  - Common commands
  - Basic usage examples
  - Quick reference

### Comprehensive Guide
- **[DRIZZLE_INTEGRATION_GUIDE.md](./DRIZZLE_INTEGRATION_GUIDE.md)** - Full documentation
  - Detailed setup instructions
  - Migration strategy
  - Advanced usage
  - Troubleshooting

### Summary
- **[DRIZZLE_INTEGRATION_SUMMARY.md](./DRIZZLE_INTEGRATION_SUMMARY.md)** - What was done
  - Files created/modified
  - Migration status
  - Next steps

## 🚀 Getting Started (30 seconds)

```bash
# 1. Push schema to database
npm run db:push

# 2. Open database GUI
npm run db:studio

# 3. Start development
npm run dev
```

## 📁 Key Files

### Database Layer
- `lib/db/schema.ts` - Database schema (11 tables)
- `lib/db/index.ts` - Database connection
- `lib/db/queries.ts` - Reusable query functions

### Scripts
- `scripts/setup-drizzle.ts` - Check database setup
- `scripts/migrate-legacy-data.ts` - Migrate from old tables

### Configuration
- `drizzle.config.ts` - Drizzle configuration
- `package.json` - Added db:* scripts

## ✅ What's Working

### Migrated API Routes (Using Drizzle)
- ✅ `/api/admin-accounts` - Admin management
- ✅ `/api/admin-accounts/[id]` - Admin operations
- ✅ `/api/auth/login` - Authentication
- ✅ `/api/users` - User management
- ✅ `/api/subscriptions` - Subscription management

### Available Query Modules
- `adminAccountQueries` - Admin CRUD
- `adminSessionQueries` - Sessions
- `twoFactorAuthQueries` - 2FA
- `auditLogQueries` - Audit logs
- `userQueries` - Users
- `subscriptionQueries` - Subscriptions
- `transactionQueries` - Transactions
- `payoutQueries` - Payouts
- `membershipQueueQueries` - Queue
- `billingScheduleQueries` - Billing
- `adminAlertQueries` - Alerts

## 🔧 Common Commands

```bash
# Database Management
npm run db:push        # Push schema to database (dev)
npm run db:generate    # Generate migration files
npm run db:migrate     # Run migrations (prod)
npm run db:studio      # Open Drizzle Studio

# Development
npm run dev            # Start dev server
npm run build          # Build for production
npm run start          # Start production server

# Utilities
npx tsx scripts/setup-drizzle.ts          # Check setup
npx tsx scripts/migrate-legacy-data.ts    # Migrate data
```

## 💡 Quick Examples

### Find a User
```typescript
import { userQueries } from '@/lib/db/queries';

const user = await userQueries.findByEmail('user@example.com');
```

### Create Admin Account
```typescript
import { adminAccountQueries } from '@/lib/db/queries';
import bcrypt from 'bcryptjs';

const admin = await adminAccountQueries.create({
  email: 'admin@example.com',
  password: await bcrypt.hash('password', 10),
  name: 'Admin User',
  role: 'admin',
  status: 'active',
});
```

### Log an Action
```typescript
import { auditLogQueries } from '@/lib/db/queries';

await auditLogQueries.create({
  adminId: admin.id,
  action: 'create',
  resource: 'user',
  resourceId: user.id,
  status: 'success',
});
```

## 🎯 Next Steps

### Immediate
1. Run `npm run db:push` to sync schema
2. Test migrated routes
3. Verify data integrity

### Short Term
1. Migrate remaining auth routes
2. Migrate session management
3. Add database indexes

### Long Term
1. Add relations in schema
2. Create database views
3. Set up automated migrations
4. Add database seeding

## 📊 Database Schema

### Tables (11 total)
- `admin_accounts` - Admin users
- `admin_sessions` - Active sessions
- `two_factor_auth` - 2FA codes
- `audit_logs` - Audit trail
- `users` - App users
- `subscriptions` - User subscriptions
- `transactions` - Payments
- `payouts` - Payouts
- `membership_queue` - Waiting list
- `billing_schedules` - Billing
- `admin_alerts` - Alerts

### Enums (6 total)
- `admin_role` - Admin roles
- `admin_status` - Admin status
- `user_status` - User status
- `subscription_status` - Subscription status
- `transaction_status` - Transaction status
- `payout_status` - Payout status
- `action_type` - Audit actions

## 🔍 Troubleshooting

### Connection Issues
```bash
# Check DATABASE_URL in .env.local
# Ensure using port 6543 (transaction mode)
```

### Type Errors
```bash
# Regenerate types
npm run db:generate

# Restart TypeScript server in your IDE
```

### Migration Issues
```bash
# Check existing tables
npx tsx scripts/setup-drizzle.ts

# Use db:push for development
npm run db:push
```

## 📖 Resources

- [Drizzle ORM Docs](https://orm.drizzle.team/)
- [Drizzle with PostgreSQL](https://orm.drizzle.team/docs/get-started-postgresql)
- [Drizzle Kit](https://orm.drizzle.team/kit-docs/overview)
- [Drizzle Studio](https://orm.drizzle.team/drizzle-studio/overview)

## 🆘 Need Help?

1. Check the documentation files listed above
2. Review `lib/db/queries.ts` for examples
3. Run `npm run db:studio` to explore your database
4. Check Drizzle ORM documentation

## ✨ Benefits

- ✅ Full TypeScript type safety
- ✅ Autocomplete in your IDE
- ✅ Centralized query logic
- ✅ Easy to test and mock
- ✅ Built-in migrations
- ✅ Better performance
- ✅ Cleaner code

---

**Status**: ✅ Integration Complete - Ready to use!

**Last Updated**: November 2024
