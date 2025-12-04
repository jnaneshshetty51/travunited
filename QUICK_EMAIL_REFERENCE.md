# Quick Email Reference Card

## 🚀 Get Started in 3 Steps

### 1. Add to `.env`
```env
SES_SMTP_HOST="email-smtp.ap-south-1.amazonaws.com"
SES_SMTP_PORT="465"
SES_SMTP_SECURE="true"
SES_SMTP_USER="AKIARRFI2Q3MUPWV5AJM"
SES_SMTP_PASS="your-password-here"
EMAIL_PROVIDER="smtp"
EMAIL_FROM="no-reply@travunited.in"
```

### 2. Run Migration
```bash
npx prisma migrate deploy
```

### 3. Test
```bash
# Via Admin UI
http://localhost:3000/admin/email-test

# Via cURL
curl -X POST http://localhost:3000/api/email/test \
  -H "Content-Type: application/json" \
  -d '{"to":"your-email@example.com"}'
```

---

## 📧 Send Email (Code)

### Simple Email
```typescript
import { sendMailSMTP } from "@/lib/email-smtp";

await sendMailSMTP({
  to: "user@example.com",
  subject: "Hello",
  html: "<h1>Hello World</h1>"
});
```

### With All Options
```typescript
await sendMailSMTP({
  to: ["user1@example.com", "user2@example.com"],
  cc: "manager@example.com",
  bcc: "archive@example.com",
  replyTo: "support@travunited.in",
  from: "tours@travunited.in",
  subject: "Booking Confirmed",
  html: "<p>Your booking is confirmed!</p>",
  text: "Your booking is confirmed!"
});
```

### Use Existing Functions (Auto SMTP)
```typescript
import { sendVerificationEmail } from "@/lib/email";

await sendVerificationEmail(email, link, name);
// Automatically uses SMTP when EMAIL_PROVIDER="smtp"
```

---

## 🔧 API Endpoints

### Send Email
```bash
POST /api/email/send
Body: {
  "to": "user@example.com",
  "subject": "Test",
  "html": "<p>Test</p>",
  "provider": "smtp"  # optional
}
```

### Test Email
```bash
POST /api/email/test
Body: {
  "to": "your-email@example.com",
  "provider": "smtp"  # optional
}
```

### SNS Webhook (Configure in AWS)
```
POST /api/webhooks/ses-sns
(Receives bounce/complaint notifications)
```

---

## 🔍 Check Status

### SMTP Connection
```typescript
import { verifySmtpConnection } from "@/lib/email-smtp";

const ok = await verifySmtpConnection();
console.log(ok ? "✓ Connected" : "✗ Failed");
```

### View Bounces
```sql
SELECT * FROM email_events 
WHERE type = 'bounce' 
ORDER BY last_occurred DESC;
```

### View Complaints
```sql
SELECT * FROM email_events 
WHERE type = 'complaint' 
ORDER BY last_occurred DESC;
```

---

## 🛠️ Common Tasks

### Switch to AWS SDK
```env
EMAIL_PROVIDER="sdk"
```

### Switch to SMTP
```env
EMAIL_PROVIDER="smtp"
```

### Change FROM Address
```env
EMAIL_FROM="custom@travunited.in"
```

### Test Different Provider
```typescript
// Test SMTP
await fetch('/api/email/test', {
  method: 'POST',
  body: JSON.stringify({ provider: 'smtp' })
});

// Test SDK
await fetch('/api/email/test', {
  method: 'POST',
  body: JSON.stringify({ provider: 'sdk' })
});
```

---

## 🐛 Quick Fixes

| Problem | Solution |
|---------|----------|
| Auth failed | Check `SES_SMTP_USER` and `SES_SMTP_PASS` |
| Not verified | Verify sender email in SES console |
| Goes to spam | Configure SPF, DKIM, DMARC |
| Webhook not working | Check HTTPS endpoint is public |
| High bounce rate | Remove bounced emails from lists |

---

## 📚 Full Documentation

- **Complete Setup:** `SES_SETUP_GUIDE.md`
- **Implementation Details:** `SES_IMPLEMENTATION_SUMMARY.md`
- **Environment Variables:** `ENV_SETUP.md`

---

## ✅ Pre-flight Checklist

Before production:
- [ ] SMTP credentials in production `.env`
- [ ] Database migration applied
- [ ] Test email sent successfully
- [ ] SNS topics created
- [ ] Webhook subscribed and confirmed
- [ ] SPF/DKIM/DMARC configured
- [ ] Bounce handling tested
- [ ] Team trained on monitoring

---

**Need Help?** Check admin panel: `/admin/email-test`

