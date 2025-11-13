# 2FA Implementation Checklist

## ✅ Pre-Implementation (Already Done)

- [x] Install nodemailer package
- [x] Install @types/nodemailer package
- [x] Create 2FA utility functions
- [x] Create email sending utility
- [x] Update login API route
- [x] Create verify-login API route
- [x] Create 2FA setup API routes
- [x] Update Login UI component
- [x] Create 2FA Setup UI component
- [x] Create database migration script
- [x] Create test scripts
- [x] Write documentation

## 📋 Setup Checklist (You Need To Do)

### 1. SMTP Configuration (5 minutes)

- [ ] Choose an SMTP provider:
  - [ ] Gmail (easiest for testing)
  - [ ] SendGrid (recommended for production)
  - [ ] AWS SES (if using AWS)
  - [ ] Mailgun
  - [ ] Other

- [ ] Get SMTP credentials:
  - [ ] SMTP host
  - [ ] SMTP port
  - [ ] SMTP username/email
  - [ ] SMTP password/API key

- [ ] Add to `.env.local`:
  ```env
  SMTP_HOST=smtp.gmail.com
  SMTP_PORT=587
  SMTP_USER=your_email@gmail.com
  SMTP_PASSWORD=your_app_password
  ```

#### Gmail Setup Steps:
- [ ] Enable 2-Step Verification in Google Account
- [ ] Go to https://myaccount.google.com/apppasswords
- [ ] Generate App Password for "Mail"
- [ ] Copy 16-character password
- [ ] Add to `.env.local` as `SMTP_PASSWORD`

### 2. Database Setup (2 minutes)

- [ ] Open Supabase SQL Editor
- [ ] Copy contents from `scripts/setup-2fa-tables.sql`
- [ ] Execute the SQL script
- [ ] Verify tables created:
  ```sql
  SELECT table_name FROM information_schema.tables 
  WHERE table_name = 'admin_2fa_codes';
  ```
- [ ] Verify admin columns added:
  ```sql
  SELECT column_name FROM information_schema.columns 
  WHERE table_name = 'admin' 
  AND column_name IN ('two_factor_enabled', 'backup_codes');
  ```

### 3. Testing (5 minutes)

- [ ] Test SMTP configuration:
  ```bash
  npx ts-node scripts/test-email.ts
  ```
  - [ ] Email received successfully
  - [ ] Email looks correct
  - [ ] Code is visible

- [ ] Test login flow:
  - [ ] Start dev server: `npm run dev`
  - [ ] Go to http://localhost:3000/login
  - [ ] Enter admin credentials
  - [ ] Receive 5-digit code via email
  - [ ] Enter code successfully
  - [ ] Redirected to 2FA setup

- [ ] Test 2FA setup:
  - [ ] Click "Send Verification Code"
  - [ ] Receive 6-digit code via email
  - [ ] Enter code successfully
  - [ ] See backup codes displayed
  - [ ] Download backup codes
  - [ ] Redirected to dashboard

- [ ] Test subsequent login:
  - [ ] Logout
  - [ ] Login again with same credentials
  - [ ] Receive 5-digit code
  - [ ] Enter code
  - [ ] Redirected directly to dashboard (no setup)

### 4. Verification (2 minutes)

- [ ] Check 2FA status:
  ```bash
  npx ts-node scripts/check-2fa-status.ts
  ```
  - [ ] Admin shows 2FA enabled
  - [ ] Backup codes count is 10

- [ ] Check database:
  ```sql
  SELECT email, two_factor_enabled FROM admin;
  ```
  - [ ] `two_factor_enabled` is `true`

- [ ] Check session created:
  ```sql
  SELECT * FROM session ORDER BY created_at DESC LIMIT 1;
  ```
  - [ ] Session exists with correct admin_id

### 5. Error Handling (3 minutes)

- [ ] Test wrong password:
  - [ ] Enter incorrect password
  - [ ] See error message
  - [ ] No code sent

- [ ] Test wrong 5-digit code:
  - [ ] Enter incorrect code
  - [ ] See error message
  - [ ] Attempts counter incremented

- [ ] Test expired code:
  - [ ] Wait 11 minutes after receiving code
  - [ ] Try to use code
  - [ ] See "expired" error

- [ ] Test rate limiting:
  - [ ] Enter wrong code 3 times
  - [ ] See "too many attempts" error
  - [ ] Request new code works

### 6. Production Preparation (Optional)

- [ ] Configure production SMTP:
  - [ ] Use dedicated email service (SendGrid, AWS SES)
  - [ ] Set up SPF/DKIM records
  - [ ] Configure email monitoring

- [ ] Set up email logging:
  - [ ] Create `email_logs` table
  - [ ] Log all sent emails
  - [ ] Monitor delivery rates

- [ ] Configure backup SMTP:
  - [ ] Add fallback SMTP provider
  - [ ] Implement retry logic

- [ ] Security hardening:
  - [ ] Review rate limiting
  - [ ] Add IP-based blocking
  - [ ] Implement account lockout
  - [ ] Add CAPTCHA for repeated failures

## 🔧 Troubleshooting Checklist

### Email Not Sending

- [ ] Check SMTP credentials in `.env.local`
- [ ] Run test script: `npx ts-node scripts/test-email.ts`
- [ ] Check firewall/network (port 587 or 465)
- [ ] Try different SMTP port (587 vs 465)
- [ ] Check email provider logs
- [ ] Verify email not in spam folder

### Code Not Working

- [ ] Check code hasn't expired (10 minutes)
- [ ] Check attempts not exceeded (3 max)
- [ ] Verify code format (5 or 6 digits)
- [ ] Check database for code record:
  ```sql
  SELECT * FROM admin_2fa_codes 
  WHERE admin_id = 'your-admin-id' 
  ORDER BY created_at DESC LIMIT 1;
  ```

### Database Errors

- [ ] Verify tables exist
- [ ] Check column types match schema
- [ ] Verify foreign key constraints
- [ ] Check Supabase connection
- [ ] Review database logs

### UI Issues

- [ ] Clear browser cache
- [ ] Check browser console for errors
- [ ] Verify all components imported correctly
- [ ] Check TypeScript compilation
- [ ] Run `npm run build` to check for errors

## 📊 Success Criteria

### Functional Requirements
- [x] ✅ User can login with email/password
- [x] ✅ 5-digit code sent to email
- [x] ✅ User can verify 5-digit code
- [x] ✅ First-time users redirected to 2FA setup
- [x] ✅ 6-digit code sent for setup
- [x] ✅ User can complete 2FA setup
- [x] ✅ 10 backup codes generated
- [x] ✅ User can download backup codes
- [x] ✅ Subsequent logins skip setup
- [x] ✅ Session created after verification
- [x] ✅ User redirected to dashboard

### Security Requirements
- [x] ✅ Codes hashed before storage
- [x] ✅ Codes expire after 10 minutes
- [x] ✅ Rate limiting (3 attempts)
- [x] ✅ One-time use codes
- [x] ✅ Backup codes hashed with bcrypt
- [x] ✅ Session tracking with IP/user agent
- [x] ✅ Audit logging for attempts

### User Experience
- [x] ✅ Clean, modern UI
- [x] ✅ Clear error messages
- [x] ✅ Toast notifications
- [x] ✅ Loading states
- [x] ✅ Input validation
- [x] ✅ Auto-formatting for codes
- [x] ✅ Responsive design

## 🎯 Next Steps After Setup

### Immediate (Week 1)
- [ ] Test with real users
- [ ] Monitor email delivery
- [ ] Check error logs
- [ ] Gather user feedback

### Short-term (Month 1)
- [ ] Implement backup code usage
- [ ] Add account recovery flow
- [ ] Create admin 2FA management
- [ ] Add email delivery monitoring

### Long-term (Quarter 1)
- [ ] Add TOTP authenticator app support
- [ ] Add SMS 2FA option (Twilio)
- [ ] Implement remember device feature
- [ ] Add biometric authentication

## 📝 Documentation Checklist

- [x] ✅ Quick start guide created
- [x] ✅ Setup guide created
- [x] ✅ Flow diagram created
- [x] ✅ API documentation created
- [x] ✅ Troubleshooting guide created
- [x] ✅ Test scripts created
- [ ] Update main README.md
- [ ] Create video tutorial (optional)
- [ ] Create user guide for admins

## 🎉 Ready to Launch!

Once all items in the "Setup Checklist" section are complete, your 2FA system is ready to use!

**Final Steps:**
1. ✅ Complete SMTP configuration
2. ✅ Run database migration
3. ✅ Test email sending
4. ✅ Test complete flow
5. ✅ Deploy to production
6. 🎊 Celebrate!

---

**Need Help?**
- Review: `2FA_SETUP_GUIDE.md`
- Quick Start: `2FA_QUICK_START.md`
- Flow Diagram: `2FA_FLOW_DIAGRAM.md`
- Test Email: `npx ts-node scripts/test-email.ts`
- Check Status: `npx ts-node scripts/check-2fa-status.ts`
