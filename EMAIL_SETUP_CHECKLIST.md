# TravUnited Email Setup Checklist

Complete these steps to activate your Amazon SES email system.

---

## Phase 1: Local Setup & Testing ⏱️ 15 minutes

### Step 1: Add SMTP Credentials
- [ ] Open your `.env` file (create if doesn't exist)
- [ ] Add the following variables:
```env
SES_SMTP_HOST="email-smtp.ap-south-1.amazonaws.com"
SES_SMTP_PORT="465"
SES_SMTP_SECURE="true"
SES_SMTP_USER="AKIARRFI2Q3MUPWV5AJM"
SES_SMTP_PASS="<<PASTE YOUR SMTP PASSWORD HERE>>"
EMAIL_PROVIDER="smtp"
EMAIL_FROM="no-reply@travunited.in"
ADMIN_EMAIL="admin@travunited.in"
```
- [ ] Replace `<<PASTE YOUR SMTP PASSWORD HERE>>` with your actual SMTP password
- [ ] Verify `.env` is in `.gitignore` (it should be)

### Step 2: Install Dependencies
```bash
npm install
```
- [ ] Verify `nodemailer` and `@types/nodemailer` are installed
- [ ] Check `package.json` shows the new dependencies

### Step 3: Run Database Migration
```bash
npx prisma migrate deploy
```
- [ ] Migration creates `email_events` table
- [ ] No errors in migration output
- [ ] Verify table exists:
```sql
SELECT * FROM email_events LIMIT 1;
```

### Step 4: Start Development Server
```bash
npm run dev
```
- [ ] Server starts without errors
- [ ] No SMTP-related errors in console

### Step 5: Test Email Sending
- [ ] Open browser: `http://localhost:3000/admin/email-test`
- [ ] Login as admin
- [ ] Enter your email address
- [ ] Select "SMTP (Nodemailer)"
- [ ] Click "Send Test Email"
- [ ] Check for success message
- [ ] Check your inbox (and spam folder)
- [ ] Verify test email received

**✅ If test email received, Phase 1 is complete!**

---

## Phase 2: Production Deployment ⏱️ 30 minutes

### Step 6: Deploy Environment Variables

#### For Vercel:
```bash
vercel env add SES_SMTP_HOST
# Enter: email-smtp.ap-south-1.amazonaws.com

vercel env add SES_SMTP_PORT
# Enter: 465

vercel env add SES_SMTP_SECURE
# Enter: true

vercel env add SES_SMTP_USER
# Enter: AKIARRFI2Q3MUPWV5AJM

vercel env add SES_SMTP_PASS
# Enter: <<your-smtp-password>>

vercel env add EMAIL_PROVIDER
# Enter: smtp

vercel env add EMAIL_FROM
# Enter: no-reply@travunited.in

vercel env add ADMIN_EMAIL
# Enter: admin@travunited.in
```

#### For Other Platforms:
- [ ] Add all environment variables to your hosting platform's dashboard
- [ ] Verify variables are set for production environment
- [ ] Redeploy application

### Step 7: Run Production Migration
```bash
# SSH into production server or use platform CLI
npx prisma migrate deploy
```
- [ ] Migration successful
- [ ] `email_events` table created in production database

### Step 8: Test Production Email
- [ ] Open: `https://travunited.in/admin/email-test`
- [ ] Login as admin
- [ ] Send test email
- [ ] Verify email received
- [ ] Check message ID in response

**✅ If production test email received, Phase 2 is complete!**

---

## Phase 3: SNS Bounce/Complaint Handling ⏱️ 20 minutes

### Step 9: Create SNS Topics

1. Go to AWS Console → SNS → Topics
2. Create two topics:

**Topic 1: Bounces**
- [ ] Click "Create topic"
- [ ] Type: Standard
- [ ] Name: `ses-bounces-travunited`
- [ ] Click "Create topic"
- [ ] Copy Topic ARN

**Topic 2: Complaints**
- [ ] Click "Create topic"
- [ ] Type: Standard
- [ ] Name: `ses-complaints-travunited`
- [ ] Click "Create topic"
- [ ] Copy Topic ARN

### Step 10: Configure SES to Use SNS Topics

1. Go to AWS Console → SES → Verified identities
2. Click on `travunited.in`
3. Click "Notifications" tab
4. Click "Edit" on "Feedback notifications"

- [ ] Bounce feedback: Select `ses-bounces-travunited`
- [ ] Complaint feedback: Select `ses-complaints-travunited`
- [ ] Click "Save changes"

### Step 11: Subscribe Webhook to SNS Topics

**For Bounces Topic:**
1. Go to SNS → Topics → `ses-bounces-travunited`
2. Click "Create subscription"
- [ ] Protocol: HTTPS
- [ ] Endpoint: `https://travunited.in/api/webhooks/ses-sns`
- [ ] Click "Create subscription"
- [ ] Wait for "Confirmed" status (auto-confirms)

**For Complaints Topic:**
1. Go to SNS → Topics → `ses-complaints-travunited`
2. Click "Create subscription"
- [ ] Protocol: HTTPS
- [ ] Endpoint: `https://travunited.in/api/webhooks/ses-sns`
- [ ] Click "Create subscription"
- [ ] Wait for "Confirmed" status (auto-confirms)

### Step 12: Verify Webhook is Working

Check application logs for:
```
[SES SNS] Subscription confirmed successfully
```

- [ ] Bounce subscription confirmed
- [ ] Complaint subscription confirmed
- [ ] No errors in logs

**✅ If both subscriptions confirmed, Phase 3 is complete!**

---

## Phase 4: Monitoring & Optimization ⏱️ 30 minutes

### Step 13: Set Up CloudWatch Alarms

1. Go to AWS Console → CloudWatch → Alarms
2. Create alarms:

**Alarm 1: High Bounce Rate**
- [ ] Metric: SES → Reputation → Bounce Rate
- [ ] Threshold: > 5%
- [ ] Action: SNS notification to your email

**Alarm 2: High Complaint Rate**
- [ ] Metric: SES → Reputation → Complaint Rate
- [ ] Threshold: > 0.1%
- [ ] Action: SNS notification to your email

**Alarm 3: Sending Failures**
- [ ] Metric: SES → Sending → Rejects
- [ ] Threshold: > 10 in 5 minutes
- [ ] Action: SNS notification to your email

### Step 14: Configure Email Domain Authentication

1. Go to AWS Console → SES → Verified identities → `travunited.in`
2. Click "DKIM" tab
- [ ] Enable DKIM signing
- [ ] Copy CNAME records
- [ ] Add CNAME records to your DNS provider
- [ ] Wait for verification (up to 72 hours)
- [ ] Verify DKIM status shows "Successful"

3. Configure SPF Record
- [ ] Add to DNS: `v=spf1 include:amazonses.com ~all`
- [ ] Verify SPF record: `dig TXT travunited.in`

4. Configure DMARC Record
- [ ] Add to DNS: `v=DMARC1; p=quarantine; rua=mailto:dmarc@travunited.in`
- [ ] Verify DMARC record: `dig TXT _dmarc.travunited.in`

### Step 15: Test Bounce Handling

1. Send test email to: `bounce@simulator.amazonses.com`
```bash
curl -X POST https://travunited.in/api/email/send \
  -H "Content-Type: application/json" \
  -d '{"to":"bounce@simulator.amazonses.com","subject":"Bounce Test","html":"<p>Test</p>"}'
```

- [ ] Email sent
- [ ] Bounce notification received by webhook
- [ ] Entry created in `email_events` table
- [ ] Check: `SELECT * FROM email_events WHERE type='bounce';`

### Step 16: Test Complaint Handling

1. Send test email to: `complaint@simulator.amazonses.com`
```bash
curl -X POST https://travunited.in/api/email/send \
  -H "Content-Type: application/json" \
  -d '{"to":"complaint@simulator.amazonses.com","subject":"Complaint Test","html":"<p>Test</p>"}'
```

- [ ] Email sent
- [ ] Complaint notification received by webhook
- [ ] Entry created in `email_events` table
- [ ] Check: `SELECT * FROM email_events WHERE type='complaint';`

**✅ If bounce and complaint handling works, Phase 4 is complete!**

---

## Phase 5: Team Training & Documentation ⏱️ 15 minutes

### Step 17: Document for Team

- [ ] Share `SES_SETUP_GUIDE.md` with team
- [ ] Share `QUICK_EMAIL_REFERENCE.md` for quick access
- [ ] Add credentials to team password manager
- [ ] Document emergency contacts

### Step 18: Train Team on Monitoring

- [ ] Show team how to access `/admin/email-test`
- [ ] Explain how to check `email_events` table
- [ ] Show AWS SES console metrics
- [ ] Explain bounce/complaint thresholds
- [ ] Document escalation procedures

### Step 19: Create Runbook

Create a runbook with:
- [ ] How to check email sending status
- [ ] How to investigate bounces
- [ ] How to handle complaints
- [ ] How to rotate credentials
- [ ] Emergency contacts

**✅ Phase 5 complete!**

---

## Phase 6: Go Live! 🚀

### Final Checks Before Go-Live

- [ ] All environment variables set in production
- [ ] Database migration applied
- [ ] Test email sent and received
- [ ] SNS topics configured
- [ ] Webhooks confirmed
- [ ] CloudWatch alarms active
- [ ] DKIM/SPF/DMARC configured
- [ ] Team trained
- [ ] Runbook created
- [ ] Backup plan documented

### Launch!

- [ ] Enable email notifications in application
- [ ] Monitor first 100 emails closely
- [ ] Check bounce/complaint rates daily for first week
- [ ] Review CloudWatch metrics
- [ ] Verify all 18 email types work:
  - [ ] Email verification
  - [ ] Password reset
  - [ ] Welcome email
  - [ ] Booking confirmation
  - [ ] Payment confirmation
  - [ ] Application status updates
  - [ ] Tour notifications
  - [ ] Contact form responses
  - [ ] And 10 more...

### Post-Launch (First Week)

- [ ] Day 1: Check metrics every 2 hours
- [ ] Day 2-3: Check metrics every 4 hours
- [ ] Day 4-7: Check metrics daily
- [ ] Week 2+: Check metrics weekly

**🎉 Congratulations! Your email system is live!**

---

## Troubleshooting Quick Reference

| Issue | Quick Fix |
|-------|-----------|
| Auth failed | Check `SES_SMTP_PASS` in `.env` |
| Not verified | Verify sender in SES console |
| Goes to spam | Configure DKIM/SPF/DMARC |
| Webhook 404 | Check endpoint is deployed |
| High bounces | Clean email list, verify addresses |
| Slow sending | Check SES sending limits |

---

## Support Contacts

- **AWS Support:** https://console.aws.amazon.com/support/
- **SES Documentation:** https://docs.aws.amazon.com/ses/
- **Internal Docs:** `SES_SETUP_GUIDE.md`
- **Quick Reference:** `QUICK_EMAIL_REFERENCE.md`

---

## Success Criteria ✅

Your email system is ready when:
- ✅ Test emails send successfully
- ✅ Production emails send successfully
- ✅ Bounces are tracked in database
- ✅ Complaints are tracked in database
- ✅ CloudWatch alarms are active
- ✅ DKIM/SPF/DMARC configured
- ✅ Team is trained
- ✅ Monitoring is in place

---

**Current Status:** 
- [ ] Phase 1: Local Setup (0/5 steps)
- [ ] Phase 2: Production (0/3 steps)
- [ ] Phase 3: SNS Setup (0/4 steps)
- [ ] Phase 4: Monitoring (0/4 steps)
- [ ] Phase 5: Training (0/3 steps)
- [ ] Phase 6: Go Live (0/3 steps)

**Estimated Total Time:** 2 hours

**Start Date:** ___________
**Completion Date:** ___________
**Completed By:** ___________

---

**Good luck! 🚀**

