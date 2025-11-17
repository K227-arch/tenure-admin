# Subscription Amount Type Fix

## Issue
Frontend was throwing error: `TypeError: subscription.amount.toFixed is not a function`

## Root Cause
The `amount` field from the database was being returned as a **string** (`"25.00"`) instead of a **number** (`25`), because PostgreSQL `decimal` type returns strings by default.

## Solution
Updated the API route to parse the amount string to a number:

```typescript
// Before
amount: schedule.amount,  // Returns "25.00" (string)

// After
amount: schedule.amount ? parseFloat(schedule.amount) : 0,  // Returns 25 (number)
```

## Result
✅ Amount is now a proper number type  
✅ Frontend can call `.toFixed(2)` successfully  
✅ Displays as: `USD 25.00`  

## API Response
```json
{
  "amount": 25,  // ← Now a number, not "25.00" string
  "currency": "USD"
}
```

## Frontend Code (Working)
```typescript
{subscription.currency} {subscription.amount?.toFixed(2) || '0.00'}
// Now works: 25.toFixed(2) → "25.00"
```

---

**Status**: ✅ Fixed  
**File**: `app/api/subscriptions/route.ts`  
**Change**: Added `parseFloat()` conversion
