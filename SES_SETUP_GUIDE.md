# Amazon SES Email Setup Guide

Complete guide to set up Amazon SES with SMTP for TravUnited email notifications.

## 🎯 Quick Start Checklist

- [ ] Add SMTP credentials to `.env`
- [ ] Run database migration for email events tracking
- [ ] Test email sending via API route
- [ ] Configure SNS topics for bounces/complaints
- [ ] Set up webhook endpoint in SNS
- [ ] Monitor SES sending metrics
- [ ] Customize email templates in Admin Settings

---

## 1️⃣ Environment Variables Setup

### Add to your `.env` file:

```env
# AWS SES SMTP Configuration
SES_SMTP_HOST="email-smtp.ap-south-1.amazonaws.com"
SES_SMTP_PORT="465"
SES_SMTP_SECURE="true"
SES_SMTP_USER="AKIARRFI2Q3MUPWV5AJM"
SES_SMTP_PASS="your-smtp-password-here"  # Replace with actual password

# Email addresses
EMAIL_FROM="no-reply@travunited.in"
EMAIL_FROM_GENERAL="no-reply@travunited.in"
EMAIL_FROM_VISA="visa@travunited.in"
EMAIL_FROM_TOURS="tours@travunited.in"
ADMIN_EMAIL="admin@travunited.in"

# Choose email provider: 'smtp' or 'sdk'
EMAIL_PROVIDER="smtp"
```

### Security Notes:
- ⚠️ **NEVER** commit `.env` to git
- ✅ Use secrets manager in production (Vercel secrets, AWS Secrets Manager)
- 🔄 Rotate credentials if exposed
- 🔒 Store in hosting provider's environment variables

---

## 2️⃣ Database Migration

Run the email events migration:

```bash
npx prisma migrate deploy
```

Or if in development:

```bash
npx prisma migrate dev
```

This creates the `email_events` table to track bounces and complaints.

---

## 3️⃣ Test Email Sending

### Method 1: Using cURL

```bash
# Test email endpoint
curl -X POST "http://localhost:3000/api/email/test" \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d '{"to":"your-email@example.com","provider":"smtp"}'
```

### Method 2: Using the Admin Panel

1. Login as admin
2. Navigate to Settings → Email Test
3. Click "Send Test Email"
4. Check your inbox for the test email

### Method 3: Using Browser DevTools

```javascript
// Open browser console
fetch('/api/email/test', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ to: 'your-email@example.com' })
})
.then(r => r.json())
.then(console.log);
```

---

## 4️⃣ Configure SNS for Bounces & Complaints

### Step 1: Create SNS Topics

1. Go to AWS Console → SNS → Topics
2. Create topic: `ses-bounces-travunited`
3. Create topic: `ses-complaints-travunited`

### Step 2: Configure SES to Use SNS Topics

1. Go to AWS Console → SES → Verified Identities
2. Select `travunited.in`
3. Click **Notifications** tab
4. Click **Edit** on Configuration Set or Identity notifications
5. Set:
   - **Bounce notifications**: Select `ses-bounces-travunited` topic
   - **Complaint notifications**: Select `ses-complaints-travunited` topic

### Step 3: Subscribe Webhook to SNS Topics

For **EACH** topic (bounces and complaints):

1. Click on the topic
2. Click **Create subscription**
3. Set:
   - **Protocol**: HTTPS
   - **Endpoint**: `https://travunited.in/api/webhooks/ses-sns`
   - **Enable raw message delivery**: OFF (leave unchecked)
4. Click **Create subscription**
5. The endpoint will automatically confirm the subscription

### Step 4: Verify Webhook is Working

Check your application logs for:
```
[SES SNS] Subscription confirmed successfully
```

---

## 5️⃣ Email Usage Examples

### Send OTP Email

```typescript
import { sendMailSMTP } from "@/lib/email-smtp";

await sendMailSMTP({
  to: user.email,
  subject: "Your TravUnited OTP",
  html: `
    <h1>Verification Code</h1>
    <p>Your OTP is <strong>${otp}</strong></p>
    <p>Expires in 5 minutes.</p>
  `,
  text: `Your OTP is ${otp}. Expires in 5 minutes.`
});
```

### Send Booking Confirmation

```typescript
await sendMailSMTP({
  to: booking.customerEmail,
  subject: `Booking Confirmed - ${booking.id}`,
  html: `
    <h1>Booking Confirmed! 🎉</h1>
    <p>Your booking for ${booking.tourName} is confirmed.</p>
    <p>Booking ID: <strong>${booking.id}</strong></p>
    <p>Date: ${booking.date}</p>
  `
});
```

### Send Contact Form Response

```typescript
// 1. Notify admin
await sendMailSMTP({
  to: process.env.ADMIN_EMAIL,
  subject: `New Contact Form Submission`,
  html: `<p>Name: ${form.name}<br>Email: ${form.email}<br>Message: ${form.message}</p>`
});

// 2. Auto-reply to user
await sendMailSMTP({
  to: form.email,
  subject: "Thanks for contacting TravUnited",
  html: `<p>We received your message and will get back to you within 24 hours.</p>`
});
```

### Using Existing Email Functions

The existing email functions in `src/lib/email.ts` automatically use the SMTP provider when `EMAIL_PROVIDER=smtp`. No code changes needed for:

- `sendVerificationEmail()`
- `sendPasswordResetEmail()`
- `sendWelcomeEmail()`
- `sendBookingConfirmationEmail()`
- `sendPaymentConfirmationEmail()`
- And all other 18 email functions

---

## 6️⃣ Bounce & Complaint Handling

### What Happens Automatically

When a bounce or complaint occurs:

1. SNS sends notification to `/api/webhooks/ses-sns`
2. Webhook logs event to `email_events` table
3. Console logs the event for monitoring
4. You can build custom logic to:
   - Mark user email as bounced/complained
   - Unsubscribe user automatically
   - Notify admin
   - Update user preferences

### View Email Events

```sql
-- View all bounces
SELECT * FROM email_events WHERE type = 'bounce' ORDER BY last_occurred DESC;

-- View all complaints
SELECT * FROM email_events WHERE type = 'complaint' ORDER BY last_occurred DESC;

-- Count bounces per email
SELECT email, count FROM email_events WHERE type = 'bounce' ORDER BY count DESC;
```

### Add Custom Logic

Edit `src/app/api/webhooks/ses-sns/route.ts`:

```typescript
// In handleBounce() function
if (bounce.bounceType === "Permanent") {
  // Mark user email as bounced
  await prisma.user.updateMany({
    where: { email },
    data: { 
      emailBounced: true, 
      emailBouncedAt: new Date() 
    }
  });
  
  // Create admin notification
  await prisma.notification.create({
    data: {
      type: "EMAIL_BOUNCE",
      message: `Permanent bounce for ${email}`,
      userId: adminId
    }
  });
}
```

---

## 7️⃣ Monitoring & Best Practices

### Monitor SES Metrics

1. Go to AWS Console → SES → Reputation metrics
2. Watch for:
   - **Bounce rate**: Should be < 5%
   - **Complaint rate**: Should be < 0.1%
   - **Sending rate**: Monitor for throttling

### Set Up CloudWatch Alarms

Create alarms for:
- Bounce rate > 5%
- Complaint rate > 0.1%
- Sending failures

### Best Practices

✅ **DO:**
- Use verified domain email addresses (`@travunited.in`)
- Include unsubscribe links in marketing emails
- Monitor bounce/complaint rates daily
- Test emails before bulk sends
- Use clear, recognizable sender names
- Honor unsubscribe requests immediately

❌ **DON'T:**
- Send to purchased email lists
- Send without user consent
- Ignore bounce notifications
- Use misleading subject lines
- Send high-frequency marketing without opt-in
- Mix transactional and marketing emails from same address

### Email Deliverability Tips

1. **Warm up new domains**: Start with low volume, gradually increase
2. **Maintain clean lists**: Remove bounced emails immediately
3. **Authenticate**: Ensure SPF, DKIM, DMARC are configured
4. **Content quality**: Avoid spam trigger words
5. **Engagement**: Send to engaged users, suppress inactive ones

---

## 8️⃣ Switching Between Providers

### Use SMTP (Nodemailer)

```env
EMAIL_PROVIDER="smtp"
```

### Use AWS SDK

```env
EMAIL_PROVIDER="sdk"
```

### Both methods are available in the codebase:
- **SMTP**: `sendMailSMTP()` in `src/lib/email-smtp.ts`
- **SDK**: `sendEmail()` in `src/lib/email.ts`

---

## 9️⃣ Troubleshooting

### Error: "SMTP credentials not configured"

**Solution**: Add `SES_SMTP_USER` and `SES_SMTP_PASS` to `.env`

### Error: "Authentication failed"

**Solution**: 
1. Verify SMTP username/password are correct
2. Ensure credentials are for correct region (ap-south-1)
3. Check if credentials are still active in IAM

### Error: "Email address not verified"

**Solution**: Verify the sender email in SES console (or verify domain)

### Emails not being received

**Check:**
1. Spam folder
2. SES sandbox mode (verify recipient email if in sandbox)
3. Bounce logs in `email_events` table
4. CloudWatch logs for errors
5. SNS subscription status

### Webhook not receiving notifications

**Check:**
1. HTTPS endpoint is publicly accessible
2. SNS subscription is confirmed
3. SES identity has correct SNS topics configured
4. Application logs for incoming webhook requests

---

## 🔟 Production Deployment

### Vercel / Netlify

Add environment variables in dashboard:
```
SES_SMTP_HOST=email-smtp.ap-south-1.amazonaws.com
SES_SMTP_PORT=465
SES_SMTP_SECURE=true
SES_SMTP_USER=AKIARRFI2Q3MUPWV5AJM
SES_SMTP_PASS=<your-password>
EMAIL_PROVIDER=smtp
EMAIL_FROM=no-reply@travunited.in
ADMIN_EMAIL=admin@travunited.in
```

### Docker

Add to `docker-compose.yml`:
```yaml
environment:
  - SES_SMTP_HOST=email-smtp.ap-south-1.amazonaws.com
  - SES_SMTP_PORT=465
  - SES_SMTP_SECURE=true
  - SES_SMTP_USER=${SES_SMTP_USER}
  - SES_SMTP_PASS=${SES_SMTP_PASS}
```

### AWS Secrets Manager (Recommended)

1. Store credentials in Secrets Manager
2. Fetch at runtime:

```typescript
import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";

async function getSmtpCredentials() {
  const client = new SecretsManagerClient({ region: "ap-south-1" });
  const response = await client.send(
    new GetSecretValueCommand({ SecretId: "ses-smtp-credentials" })
  );
  return JSON.parse(response.SecretString);
}
```

---

## 📞 Support

- AWS SES Documentation: https://docs.aws.amazon.com/ses/
- Nodemailer Documentation: https://nodemailer.com/
- TravUnited Support: Check admin panel or contact development team

---

## ✅ Final Checklist

Before going live:

- [ ] SMTP credentials configured in production environment
- [ ] Database migration applied
- [ ] Test email sent successfully
- [ ] SNS topics created and configured
- [ ] Webhook subscriptions confirmed
- [ ] Bounce/complaint handling tested
- [ ] SES out of sandbox mode
- [ ] Sending limits increased (if needed)
- [ ] Domain verification complete
- [ ] SPF/DKIM/DMARC records configured
- [ ] CloudWatch alarms set up
- [ ] Email templates customized
- [ ] Unsubscribe mechanism implemented
- [ ] Privacy policy updated
- [ ] Team trained on monitoring metrics

---

**🎉 You're all set! Your email system is ready to send transactional and notification emails reliably.**

