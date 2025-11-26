# 🚨 QUICK FIX: Missing requiresPassport Column

## The Problem
Your production database is missing the `requiresPassport` column in the `Tour` table, causing 500 errors on:
- `/api/admin/bookings/[id]` 
- `/api/admin/content/tours/*`
- Tour imports
- Any query that touches the Tour model

## The Solution (Run on VPS)

**SSH into your VPS and run:**

```bash
cd /var/www/travunited/travunitedlatest
source .env

# Add the missing column
psql "$DATABASE_URL" -c "ALTER TABLE \"Tour\" ADD COLUMN IF NOT EXISTS \"requiresPassport\" BOOLEAN NOT NULL DEFAULT false;"

# CRITICAL: Regenerate Prisma Client
npx prisma generate

# Restart the app
pm2 restart travunited --update-env

# Check logs to verify
pm2 logs travunited --lines 20
```

## Or Use the Automated Script

```bash
cd /var/www/travunited/travunitedlatest
bash scripts/fix-requires-passport.sh
```

## Verify It Worked

After running the fix, check:
1. ✅ No more 500 errors in browser console
2. ✅ Booking detail pages load
3. ✅ Tour imports work
4. ✅ PM2 logs show no Prisma errors

## Why This Happened

The migration `20251125163000_booking_customizations` exists but was marked as "applied" in Prisma's migration tracking table (`_prisma_migrations`) even though the SQL didn't actually run. This is called "schema drift."

The fix adds the column directly, which is safe because the migration uses `IF NOT EXISTS`.

