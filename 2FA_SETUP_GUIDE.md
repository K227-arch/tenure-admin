# Two-Factor Authentication Setup Guide

This guide explains how to set up and use the 2FA system for admin authentication.

## Overview

The 2FA system uses a two-step verification process:
1. **Login**: Admin enters email/password → receives a 5-digit code via email
2. **2FA Setup** (first-time only): Admin verifies with a 6-digit code → receives backup codes
3. **Dashboard Access**: After verification, admin is logged in

## Features

- ✅ 5-digit login verification code (expires in 10 minutes)
- ✅ 6-digit 2FA setup code (expires in 10 minutes)
- ✅ Email delivery via SMTP
- ✅ Backup codes for account recovery
- ✅ Rate limiting (3 attempts per code)
- ✅ Automatic code expiration
- ✅ Session management

## Setup Instructions

### 1. Database Setup

Run the SQL script to create the necessary tables:

```bash
psql -h your-db-host -U postgres -d your-database -f scripts/setup-2fa-tables.sql
```

Or execute in Supabase SQL Editor:
```sql
-- See scripts/setup-2fa-tables.sql for the full script
```

This creates:
- `two_factor_enabled` column in `admin` table
- `two_factor_secret` column in `admin` table
- `backup_codes` column in `admin` table
- `admin_2fa_codes` table for temporary verification codes

### 2. SMTP Configuration

Add these environment variables to your `.env.local`:

```env
# SMTP Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password_here
```

#### Gmail Setup:
1. Enable 2-Step Verification in your Google Account
2. Generate an App Password:
   - Go to https://myaccount.google.com/apppasswords
   - Select "Mail" and your device
   - Copy the 16-character password
3. Use this password as `SMTP_PASSWORD`

#### Other SMTP Providers:
- **SendGrid**: Use API key as password
- **Mailgun**: Use SMTP credentials from dashboard
- **AWS SES**: Use SMTP credentials from SES console

### 3. Test the System

1. **Login Flow**:
   ```
   1. Go to /login
   2. Enter email and password
   3. Receive 5-digit code via email
   4. Enter code to verify
   5. If first login → redirect to 2FA setup
   6. If 2FA enabled → redirect to dashboard
   ```

2. **2FA Setup Flow**:
   ```
   1. Click "Send Verification Code"
   2. Receive 6-digit code via email
   3. Enter code to verify
   4. Save backup codes (10 codes)
   5. Redirect to dashboard
   ```

## API Endpoints

### POST /api/auth/login
Login with email and password, sends 5-digit code.

**Request:**
```json
{
  "email": "admin@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "requiresVerification": true,
  "adminId": "uuid",
  "email": "admin@example.com",
  "message": "Verification code sent to your email"
}
```

### POST /api/auth/verify-login
Verify 5-digit login code.

**Request:**
```json
{
  "adminId": "uuid",
  "code": "12345"
}
```

**Response (2FA not setup):**
```json
{
  "success": true,
  "requires2FASetup": true,
  "adminId": "uuid",
  "email": "admin@example.com"
}
```

**Response (2FA enabled):**
```json
{
  "success": true,
  "token": "jwt_token",
  "user": {
    "id": "uuid",
    "email": "admin@example.com",
    "name": "Admin Name",
    "role": "admin"
  }
}
```

### POST /api/auth/2fa-setup/send-code
Send 6-digit setup verification code.

**Request:**
```json
{
  "adminId": "uuid"
}
```

**Response:**
```json
{
  "success": true,
  "message": "6-digit verification code sent to your email"
}
```

### POST /api/auth/2fa-setup/verify
Verify 6-digit setup code and enable 2FA.

**Request:**
```json
{
  "adminId": "uuid",
  "code": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "token": "jwt_token",
  "backupCodes": ["CODE1", "CODE2", ...],
  "user": {
    "id": "uuid",
    "email": "admin@example.com",
    "name": "Admin Name",
    "role": "admin"
  }
}
```

## Security Features

### Code Expiration
- All codes expire after 10 minutes
- Expired codes are automatically rejected

### Rate Limiting
- Maximum 3 attempts per code
- After 3 failed attempts, user must request a new code

### Code Hashing
- Codes are hashed using SHA-256 before storage
- Plain text codes are never stored in the database

### Backup Codes
- 10 backup codes generated during setup
- Hashed using bcrypt before storage
- Can be used for account recovery

### Session Management
- JWT tokens expire after 24 hours
- Sessions tracked in database
- IP address and user agent logged

## Troubleshooting

### Email Not Sending

1. **Check SMTP credentials**:
   ```bash
   # Test SMTP connection
   node -e "const nodemailer = require('nodemailer'); const t = nodemailer.createTransport({host: process.env.SMTP_HOST, port: process.env.SMTP_PORT, auth: {user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD}}); t.verify().then(console.log).catch(console.error);"
   ```

2. **Check firewall/network**:
   - Ensure port 587 is not blocked
   - Try port 465 with `secure: true`

3. **Check email logs**:
   ```sql
   SELECT * FROM email_logs ORDER BY sent_at DESC LIMIT 10;
   ```

### Code Not Working

1. **Check code expiration**:
   ```sql
   SELECT * FROM admin_2fa_codes 
   WHERE admin_id = 'your-admin-id' 
   ORDER BY created_at DESC LIMIT 5;
   ```

2. **Check attempts**:
   - Codes are limited to 3 attempts
   - Request a new code if exceeded

3. **Check code format**:
   - Login code: 5 digits
   - Setup code: 6 digits

### Database Issues

1. **Verify tables exist**:
   ```sql
   SELECT table_name FROM information_schema.tables 
   WHERE table_name IN ('admin_2fa_codes');
   ```

2. **Check admin columns**:
   ```sql
   SELECT column_name FROM information_schema.columns 
   WHERE table_name = 'admin' 
   AND column_name IN ('two_factor_enabled', 'backup_codes');
   ```

## Maintenance

### Cleanup Expired Codes

Run periodically to remove old codes:

```sql
DELETE FROM admin_2fa_codes 
WHERE expires_at < NOW() OR used = TRUE;
```

Or use the built-in function:
```sql
SELECT cleanup_expired_2fa_codes();
```

### Monitor Failed Attempts

```sql
SELECT 
  a.email,
  c.attempts,
  c.created_at,
  c.expires_at
FROM admin_2fa_codes c
JOIN admin a ON a.id = c.admin_id
WHERE c.attempts >= 3
ORDER BY c.created_at DESC;
```

## User Guide

### For Admins

1. **First Login**:
   - Enter your email and password
   - Check your email for a 5-digit code
   - Enter the code to verify
   - You'll be redirected to 2FA setup
   - Check your email for a 6-digit code
   - Enter the code to complete setup
   - **IMPORTANT**: Download and save your backup codes

2. **Subsequent Logins**:
   - Enter your email and password
   - Check your email for a 5-digit code
   - Enter the code to access the dashboard

3. **If You Lose Access**:
   - Contact your system administrator
   - They can disable 2FA or reset your account

### For System Administrators

1. **Disable 2FA for a user**:
   ```sql
   UPDATE admin 
   SET two_factor_enabled = FALSE 
   WHERE email = 'user@example.com';
   ```

2. **Reset backup codes**:
   ```sql
   UPDATE admin 
   SET backup_codes = NULL 
   WHERE email = 'user@example.com';
   ```

3. **View 2FA status**:
   ```sql
   SELECT email, two_factor_enabled, 
          CASE WHEN backup_codes IS NOT NULL 
               THEN array_length(backup_codes, 1) 
               ELSE 0 
          END as backup_codes_count
   FROM admin;
   ```

## Next Steps

- [ ] Set up email monitoring
- [ ] Configure backup SMTP provider
- [ ] Implement backup code usage
- [ ] Add SMS 2FA option (using Twilio)
- [ ] Add authenticator app support (TOTP)
- [ ] Implement account recovery flow
- [ ] Add admin dashboard for 2FA management

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review server logs
3. Check email delivery logs
4. Contact your development team
