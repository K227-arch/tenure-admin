# 2FA Quick Start Guide

## 🚀 Quick Setup (5 minutes)

### 1. Configure SMTP Email

Add to `.env.local`:
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password_here
```

**Gmail Users**: Get an App Password at https://myaccount.google.com/apppasswords

### 2. Setup Database

Run in Supabase SQL Editor:
```bash
# Copy and paste the contents of scripts/setup-2fa-tables.sql
```

Or via command line:
```bash
psql -h your-db-host -U postgres -d your-database -f scripts/setup-2fa-tables.sql
```

### 3. Test Email (Optional)

```bash
npm install
npx ts-node scripts/test-email.ts
```

### 4. Try It Out!

1. Go to http://localhost:3000/login
2. Enter your admin credentials
3. Check your email for a 5-digit code
4. Enter the code
5. Complete 2FA setup with the 6-digit code
6. Save your backup codes!

## 📋 How It Works

### Login Flow
```
User enters email/password
    ↓
5-digit code sent to email
    ↓
User enters code
    ↓
First time? → 2FA Setup
Already setup? → Dashboard
```

### 2FA Setup Flow
```
Click "Send Verification Code"
    ↓
6-digit code sent to email
    ↓
User enters code
    ↓
Backup codes generated
    ↓
User downloads backup codes
    ↓
Redirect to dashboard
```

## 🔑 Key Features

- ✅ **5-digit login code** - Quick verification on every login
- ✅ **6-digit setup code** - One-time 2FA activation
- ✅ **Email delivery** - Codes sent via SMTP
- ✅ **10-minute expiration** - Codes expire automatically
- ✅ **3 attempts limit** - Rate limiting for security
- ✅ **Backup codes** - 10 recovery codes for emergencies
- ✅ **Session tracking** - IP and user agent logging

## 📁 Files Created

### API Routes
- `app/api/auth/login/route.ts` - Login with email/password
- `app/api/auth/verify-login/route.ts` - Verify 5-digit code
- `app/api/auth/2fa-setup/send-code/route.ts` - Send 6-digit setup code
- `app/api/auth/2fa-setup/verify/route.ts` - Verify setup and enable 2FA

### UI Components
- `components/pages/Login.tsx` - Updated login page with code verification
- `components/pages/TwoFactorSetup.tsx` - 2FA setup page
- `app/verify/page.tsx` - 2FA setup route

### Utilities
- `lib/utils/2fa.ts` - 2FA helper functions (updated)
- `lib/utils/send-email.ts` - Email sending utility

### Database
- `scripts/setup-2fa-tables.sql` - Database schema (updated)

### Documentation
- `2FA_SETUP_GUIDE.md` - Complete setup guide
- `2FA_QUICK_START.md` - This file

## 🔧 Configuration

### Environment Variables

```env
# Required for 2FA
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password

# Already configured
NEXT_PUBLIC_SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
JWT_SECRET=...
```

### Database Tables

The setup script creates:
- `admin.two_factor_enabled` - Boolean flag
- `admin.backup_codes` - Array of hashed codes
- `admin_2fa_codes` - Temporary verification codes

## 🐛 Troubleshooting

### Email not sending?
```bash
# Test your SMTP configuration
npx ts-node scripts/test-email.ts
```

### Code not working?
- Check if code expired (10 minutes)
- Check if you exceeded 3 attempts
- Request a new code

### Database errors?
```sql
-- Verify tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_name = 'admin_2fa_codes';

-- Check admin columns
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'admin' 
AND column_name IN ('two_factor_enabled', 'backup_codes');
```

## 📞 Support

- Full documentation: `2FA_SETUP_GUIDE.md`
- Test email: `npx ts-node scripts/test-email.ts`
- Database setup: `scripts/setup-2fa-tables.sql`

## 🎯 Next Steps

1. ✅ Setup SMTP credentials
2. ✅ Run database migration
3. ✅ Test email sending
4. ✅ Try logging in
5. ✅ Complete 2FA setup
6. ✅ Save backup codes
7. 🔄 Configure production SMTP
8. 🔄 Set up email monitoring
9. 🔄 Add backup code usage
10. 🔄 Implement account recovery

## 🔐 Security Notes

- Codes are hashed before storage (SHA-256)
- Backup codes are hashed with bcrypt
- Sessions expire after 24 hours
- All login attempts are logged
- IP addresses and user agents tracked
- Rate limiting prevents brute force

---

**Ready to go!** Start your dev server and visit `/login` to test the new 2FA flow.
