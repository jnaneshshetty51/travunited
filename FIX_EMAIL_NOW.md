# 🚨 URGENT: Fix Email Configuration NOW

## Problem
Your database has **cached old email addresses** (`travunited.com`) that are overriding the environment variables.

## Error You're Seeing
```
Message failed: 554 Message rejected: Email address is not verified. 
The following identities failed the check in region AP-SOUTH-1: 
noreply@travunited.com, Travunited <noreply@travunited.com>, travunited3@gmail.com
```

---

## 🔧 SOLUTION (3 Steps - 5 Minutes)

### Step 1: Clear Database Cache

Run this SQL query in your database:

```sql
DELETE FROM "Setting" WHERE key = 'EMAIL_CONFIG';
```

**How to run:**

#### Option A: Using Prisma Studio
```bash
npx prisma studio
# Navigate to Setting table
# Find row where key = 'EMAIL_CONFIG'
# Delete that row
```

#### Option B: Using Database Client (pgAdmin, DBeaver, etc.)
```sql
-- Connect to your database
-- Run this query:
DELETE FROM "Setting" WHERE key = 'EMAIL_CONFIG';

-- Verify it's deleted:
SELECT * FROM "Setting" WHERE key = 'EMAIL_CONFIG';
-- Should return no rows
```

#### Option C: Using Command Line
```bash
# If using PostgreSQL
psql -U your_username -d your_database_name -c "DELETE FROM \"Setting\" WHERE key = 'EMAIL_CONFIG';"

# Or using Prisma migrate
cd /Users/jnaneshshetty/Desktop/Travunited
npx prisma db execute --file fix-email-config.sql
```

---

### Step 2: Update .env File

Make sure your `.env` file has these correct values:

```env
# Email Configuration - CORRECT DOMAIN
EMAIL_FROM="no-reply@travunited.in"
EMAIL_FROM_GENERAL="no-reply@travunited.in"
EMAIL_FROM_VISA="visa@travunited.in"
EMAIL_FROM_TOURS="tours@travunited.in"

# SMTP Configuration
SES_SMTP_HOST="email-smtp.ap-south-1.amazonaws.com"
SES_SMTP_PORT="465"
SES_SMTP_SECURE="true"
SES_SMTP_USER="AKIARRFI2Q3MUPWV5AJM"
SES_SMTP_PASS="your-smtp-password-here"
EMAIL_PROVIDER="smtp"

# AWS Region
AWS_REGION="ap-south-1"

# App URL
NEXTAUTH_URL="https://travunited.in"
NEXT_PUBLIC_APP_URL="https://travunited.in"
```

---

### Step 3: Restart Application

```bash
# Stop the application (Ctrl+C if running)
# Then restart:
npm run dev

# Or for production:
pm2 restart all
# or
systemctl restart your-app-service
```

---

## 🧪 Test Email Immediately

After completing steps 1-3:

```bash
# Test via API
curl -X POST http://localhost:3000/api/email/test \
  -H "Content-Type: application/json" \
  -d '{"to":"your-email@example.com"}'

# Or visit admin panel:
# http://localhost:3000/admin/email-test
```

---

## 🔍 Why This Happened

The system has **two places** where email configuration is stored:

1. **Environment Variables** (`.env` file) ✅ We fixed this
2. **Database Cache** (`Setting` table) ❌ This still had old values

The database cache takes **priority** over environment variables, so even though we fixed the code, the old values were being used from the database.

---

## 📊 Verify It's Fixed

After restarting, check the logs:

```bash
# Look for this in logs:
[Email] Using SMTP provider for email sending

# And NOT this:
noreply@travunited.com
```

---

## 🆘 Still Not Working?

### Check 1: Environment Variables Loaded?
```bash
# In your application, check if .env is loaded:
node -e "console.log(process.env.EMAIL_FROM)"
# Should output: no-reply@travunited.in
```

### Check 2: Database Setting Deleted?
```sql
SELECT * FROM "Setting" WHERE key = 'EMAIL_CONFIG';
-- Should return 0 rows
```

### Check 3: Application Restarted?
```bash
# Check process uptime
ps aux | grep node
# Should show recent start time
```

### Check 4: SES Domain Verified?
1. Go to: https://console.aws.amazon.com/ses/
2. Click "Verified identities"
3. Check if `travunited.in` is verified
4. Status should be "Verified" ✓

---

## 🎯 Quick Fix Script

Run this all at once:

```bash
# 1. Clear database cache
echo "DELETE FROM \"Setting\" WHERE key = 'EMAIL_CONFIG';" | psql -U your_username -d your_database_name

# 2. Verify environment variables
cat .env | grep EMAIL_FROM

# 3. Restart application
pm2 restart all

# 4. Test email
sleep 5
curl -X POST http://localhost:3000/api/email/test \
  -H "Content-Type: application/json" \
  -d '{"to":"your-email@example.com"}'
```

---

## ✅ Success Indicators

You'll know it's working when:
- ✅ No more "554 Message rejected" error
- ✅ Logs show: `[Email] SMTP email sent successfully`
- ✅ Test email arrives in your inbox
- ✅ All from addresses show `@travunited.in`

---

## 📞 Emergency Support

If still not working after all steps:

1. **Check database directly:**
   ```sql
   SELECT * FROM "Setting" WHERE key = 'EMAIL_CONFIG';
   ```

2. **Check what email system is using:**
   - Look at application logs
   - Search for: `[Email]` in logs
   - Should show `no-reply@travunited.in`

3. **Manually set in database (temporary):**
   ```sql
   INSERT INTO "Setting" (id, key, value, "createdAt", "updatedAt")
   VALUES (
     'email-config-fix',
     'EMAIL_CONFIG',
     '{"emailFromGeneral":"no-reply@travunited.in","emailFromVisa":"visa@travunited.in","emailFromTours":"tours@travunited.in"}',
     NOW(),
     NOW()
   );
   ```

---

## 🎉 After It's Working

Once emails are sending successfully:

1. ✅ Test forgot password
2. ✅ Test booking confirmation
3. ✅ Test all 20 email functions
4. ✅ Configure SNS webhooks for bounces
5. ✅ Monitor SES metrics in AWS Console

---

**⚡ ACTION REQUIRED NOW:**
1. Delete `EMAIL_CONFIG` from database
2. Restart application
3. Test email sending

**This will fix your email issue immediately!**

