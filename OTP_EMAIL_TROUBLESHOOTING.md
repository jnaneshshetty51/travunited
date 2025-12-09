# OTP Email Troubleshooting Guide

## Problem
Users are not receiving OTP emails when requesting password reset.

## Diagnostic Steps

### 1. Check Server Logs
Look for these log messages in your server logs:
- `[Password Reset] Attempting to send OTP email` - Email sending started
- `[Password Reset] ✅ OTP email sent successfully` - Email sent successfully
- `[Password Reset] ❌ sendPasswordResetOTPEmail returned false` - Email failed
- `[Email] ❌ Failed to send email via AWS SES` - AWS SES API error

### 2. Test Email Configuration
Use the test endpoint (admin only):
```bash
POST /api/auth/test-otp-email
{
  "email": "your-test@email.com",
  "otp": "123456"
}
```

Or check diagnostics:
```bash
GET /api/admin/email/diagnostics
```

### 3. Common Issues & Solutions

#### Issue 1: AWS SES Credentials Not Configured
**Symptoms:**
- Log shows: `Email credentials not configured`
- `emailSent: false` in API response

**Solution:**
1. Set environment variables:
   ```bash
   AWS_ACCESS_KEY_ID=your_access_key
   AWS_SECRET_ACCESS_KEY=your_secret_key
   AWS_REGION=us-east-1  # or your SES region
   EMAIL_FROM=no-reply@travunited.in
   ```

2. Or configure via Admin Settings → Email Configuration

#### Issue 2: AWS SES Sandbox Mode
**Symptoms:**
- Email sent successfully but not received
- AWS SES error: "Email address not verified"

**Solution:**
1. Verify recipient email in AWS SES Console
2. Or request production access from AWS SES
3. In sandbox mode, you can only send to verified emails

#### Issue 3: Email Template Missing or Empty
**Symptoms:**
- Log shows: `Password Reset OTP template is empty`
- `emailSent: false`

**Solution:**
1. Check Admin Settings → Email Templates
2. Ensure `passwordResetOTPEmail` template exists
3. Default template should be used if custom template is empty

#### Issue 4: Email Going to Spam
**Symptoms:**
- Email sent successfully but not in inbox

**Solution:**
1. Check spam/junk folder
2. Verify SPF/DKIM records for your domain
3. Check AWS SES reputation
4. Ask users to whitelist `no-reply@travunited.in`

#### Issue 5: AWS SES API Errors
**Symptoms:**
- Log shows AWS error codes (e.g., `MessageRejected`, `Throttling`)

**Common Errors:**
- `MessageRejected`: Email content or sender/recipient issue
- `Throttling`: Rate limit exceeded
- `InvalidParameterValue`: Invalid email format
- `AccountSendingPaused`: Account suspended

**Solution:**
1. Check AWS SES Console for account status
2. Verify sender email is verified
3. Check sending limits
4. Review AWS CloudWatch logs

### 4. Verify Email Flow

The OTP email flow:
1. User requests password reset → `/api/auth/forgot-password`
2. System generates 6-digit OTP
3. Creates `PasswordReset` record in database
4. Calls `sendPasswordResetOTPEmail()`
5. Loads email template (from DB or default)
6. Replaces `{otp}` variable in template
7. Calls AWS SES API to send email
8. Returns `resetId` and `emailSent` status

### 5. Check Database

Verify OTP was generated:
```sql
SELECT id, "userId", otp, "otpExpiresAt", "createdAt"
FROM "PasswordReset"
WHERE "createdAt" > NOW() - INTERVAL '1 hour'
ORDER BY "createdAt" DESC;
```

### 6. Manual Testing

1. **Test Email Configuration:**
   ```bash
   curl -X POST https://travunited.com/api/auth/test-otp-email \
     -H "Content-Type: application/json" \
     -H "Cookie: your-session-cookie" \
     -d '{"email": "test@example.com", "otp": "123456"}'
   ```

2. **Check Email Logs:**
   - Server logs should show detailed email sending attempts
   - AWS CloudWatch logs for SES API calls
   - Check for any error messages

3. **Verify Email Template:**
   - Default template includes `{otp}` placeholder
   - Template should render valid HTML

### 7. Quick Fixes

**If emails are not sending:**
1. Check environment variables are set correctly
2. Verify AWS SES credentials have `ses:SendEmail` permission
3. Ensure sender email is verified in AWS SES
4. Check AWS SES sending limits/quota
5. Verify email template is not empty

**If emails are sending but not received:**
1. Check spam folder
2. Verify recipient email is correct
3. Check AWS SES sandbox restrictions
4. Verify domain reputation
5. Check email provider filters

## Next Steps

1. **Check server logs** for the specific error message
2. **Run the test endpoint** to diagnose configuration issues
3. **Verify AWS SES setup** in AWS Console
4. **Check email template** in admin settings
5. **Test with a verified email** address

## Support

If issues persist:
1. Share server logs showing email sending attempts
2. Share AWS SES error messages (if any)
3. Verify AWS SES account status
4. Check CloudWatch logs for detailed errors

