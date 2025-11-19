# User Payment Information Update

## Overview
Added payment history and membership queue information to the user profile cards in the User Management page (http://localhost:3000/users).

## Changes Made

### 1. Database Schema Updated

#### `/lib/db/schema.ts`
- Added `userContacts` table definition with fields:
  - `id`, `user_id`, `contact_type`, `contact_value`
  - `is_primary`, `is_verified`, `created_at`, `updated_at`
- Added TypeScript types: `UserContact` and `NewUserContact`

### 2. API Routes Updated

#### `/app/api/users/route.ts`
- Added imports for `billingSchedules`, `membershipQueue`, and `userContacts`
- Enhanced user data fetching to include:
  - Last monthly payment date and amount
  - Next monthly payment date
  - Last annual payment date and amount
  - Next annual payment date
  - Membership queue position (if eligible)
  - Queue status
  - Phone number from user_contacts table

#### `/app/api/users/[id]/route.ts`
- Added same payment, queue, and contact information for individual user fetches
- Ensures consistency when viewing user details

### 2. User Management Component Updated

#### `/components/pages/UserManagement.tsx`
- Added new "Payment Information" section in user details modal showing:
  - **Last Monthly Payment**: Date and amount of last monthly subscription payment
  - **Next Monthly Payment**: Date of next scheduled monthly payment
  - **Last Annual Payment**: Date and amount of last annual subscription payment
  - **Next Annual Payment**: Date of next scheduled annual payment

- Added new "Membership Queue" section (conditionally displayed) showing:
  - **Queue Position**: User's position in the membership queue (e.g., #5)
  - **Queue Status**: Current status (waiting, notified, etc.)

## Data Sources

The payment information is pulled from:
- `user_billing_schedules` table (also known as `billingSchedules` in the schema)
- `billing_cycle` field - filtered for 'monthly' or 'yearly'/'annual'
- `created_at` - for last payment dates
- `next_billing_date` - for next payment dates
- `amount` - for payment amounts
- `is_active` - to determine if the schedule is currently active

The queue information is pulled from:
- `membership_queue` table
- `position` - queue position number
- `status` - current queue status

The contact information is pulled from:
- `user_contacts` table
- `contact_type` - filtered for 'phone'
- `contact_value` - the actual phone number
- `is_primary` - prioritizes primary phone numbers

## Display Logic

- Payment amounts are formatted as currency (e.g., $29.99)
- Dates are formatted using `toLocaleDateString()`
- "No monthly/annual payments" shown when no subscription exists
- "No upcoming payment" shown when no active subscription
- Membership Queue section only displays if user has a queue position

## Testing

To test the new features:
1. Navigate to http://localhost:3000/users
2. Click on any user card to open their profile
3. Scroll down to see the new "Payment Information" section
4. If the user is in the membership queue, you'll see the "Membership Queue" section

## Notes

- The feature gracefully handles users without subscriptions or queue positions
- All payment data is fetched efficiently with error handling
- The UI maintains consistency with the existing design system
- If the `membership_queue` table doesn't exist or has schema issues, the queue information will simply not display (graceful degradation)
- Each data fetch (subscriptions and queue) is wrapped in separate try-catch blocks to ensure one failure doesn't break the entire user list

## Known Issues

### Membership Queue Table
The `membership_queue` table may not exist in your database or may have a different schema than expected. The code handles this gracefully by:
- Catching errors when querying the table
- Returning null values for queue_position and queue_status
- Logging errors to the console for debugging
- Not breaking the user list display

If you want to enable the membership queue feature, ensure the table exists with this structure:
```sql
CREATE TABLE "membership_queue" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "position" integer NOT NULL,
  "status" varchar(50) DEFAULT 'waiting' NOT NULL,
  "joined_at" timestamp DEFAULT now() NOT NULL,
  "notified_at" timestamp,
  "metadata" jsonb,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);
```
