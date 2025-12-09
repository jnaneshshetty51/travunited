# OTP Email Fix Summary

## Problem
All other emails work fine, but password reset OTP emails are not being received by users.

## Changes Made

### 1. Enhanced Error Handling (`src/lib/email.ts`)
- Added try-catch around template loading
- Force fallback to default template if custom template is empty
- Added hardcoded fallback template as last resort
- Enhanced logging with template previews and detailed error messages

### 2. Improved Logging (`src/app/api/auth/forgot-password/route.ts`)
- Added detailed logging for email sending attempts
- Logs include success/failure, error messages, and timestamps
- Errors are included in API responses for debugging

### 3. Created Test Endpoint (`src/app/api/auth/test-otp-email/route.ts`)
- Admin-only endpoint to test OTP email sending
- Returns detailed diagnostics about email configuration

## Possible Root Causes (Since Other Emails Work)

### 1. **Empty/Corrupted Custom Template in Database**
- If a custom `emailPasswordResetOTP` template exists in the database but is empty
- **Fix**: The code now forces fallback to default template

### 2. **Template Variable Replacement Failing**
- The `{otp}` variable might not be replaced correctly
- **Fix**: Enhanced logging shows template preview before/after replacement

### 3. **Email Content Filtering**
- Email providers might be filtering OTP emails as spam
- **Check**: Look for emails in spam folder
- **Fix**: Verify SPF/DKIM records

### 4. **Silent Failure in Template Loading**
- Database query for templates might be failing silently
- **Fix**: Added try-catch with fallback to default

## Next Steps to Diagnose

1. **Check Server Logs** for these messages:
   ```
   [Email] sendPasswordResetOTPEmail called
   [Email] Password Reset OTP template loaded
   [Email] Password Reset OTP HTML generated
   [Email] Calling sendEmail for Password Reset OTP
   [Email] sendEmail result for Password Reset OTP
   ```

2. **Look for Error Messages**:
   - `❌ Password Reset OTP template is empty`
   - `❌ Generated HTML for Password Reset OTP is empty`
   - `❌ Failed to send email via AWS SES`

3. **Test the Email**:
   ```bash
   POST /api/auth/test-otp-email
   {
     "email": "your-test@email.com",
     "otp": "123456"
   }
   ```

4. **Check Database**:
   ```sql
   SELECT value->>'emailPasswordResetOTP' as otp_template
   FROM "Setting"
   WHERE key = 'EMAIL_SNIPPETS';
   ```
   - If this returns a non-empty value, it might be corrupted
   - Delete it to force use of default template

5. **Verify Email is Actually Sent**:
   - Check AWS SES Console → Sending Statistics
   - Look for successful sends vs bounces/rejects
   - Check CloudWatch logs for detailed errors

## Quick Fix

If the issue persists, you can temporarily bypass template loading by modifying the function to always use the default template:

```typescript
// In sendPasswordResetOTPEmail, replace:
const templates = await loadEmailTemplates();
const template = getEmailTemplate("passwordResetOTPEmail", templates.emailPasswordResetOTP);

// With:
const template = getDefaultEmailTemplate("passwordResetOTPEmail");
```

This will force use of the default template and help isolate if the issue is with template loading.

## Expected Behavior After Fix

1. Template loads successfully (or falls back to default)
2. HTML is generated with OTP replaced
3. Email is sent via AWS SES
4. Server logs show success message
5. User receives email (check spam if not in inbox)

