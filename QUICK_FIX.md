# 🚨 QUICK FIX: Complete Migration Fix

## The Problem
The migration `20251125163000_booking_customizations` was marked as "applied" but the SQL never actually ran. This causes:
- Missing `requiresPassport` column in `Tour` table
- Missing `BookingAddOn` table
- Missing `TourAddOn` table  
- Missing Booking and BookingTraveller columns
- 500 errors on booking routes, tour imports, and bulk operations

## The Solution (Run on VPS) - RECOMMENDED

**Use the complete migration fix script:**

```bash
cd /var/www/travunited/travunitedlatest
bash scripts/fix-complete-migration.sh
```

This will:
1. ✅ Apply ALL missing tables and columns from the migration
2. ✅ Regenerate Prisma Client
3. ✅ Restart PM2

## Alternative: Manual SQL Fix

If you prefer to run SQL manually:

```bash
cd /var/www/travunited/travunitedlatest
source .env

# Apply the complete migration SQL
psql "$DATABASE_URL" -f scripts/apply-booking-customizations-migration.sql

# Regenerate Prisma Client
npx prisma generate

# Restart the app
pm2 restart travunited --update-env
```

## Quick Fix (Only requiresPassport column)

If you only need the `requiresPassport` column fixed quickly:

```bash
cd /var/www/travunited/travunitedlatest
bash scripts/fix-requires-passport.sh
```

**Note:** This only fixes the `requiresPassport` column. You'll still get errors for `BookingAddOn` table. Use the complete fix above instead.

## Verify It Worked

After running the fix, check:
1. ✅ No more 500 errors in browser console
2. ✅ Booking detail pages load
3. ✅ Tour imports work
4. ✅ PM2 logs show no Prisma errors

## Why This Happened

The migration `20251125163000_booking_customizations` exists but was marked as "applied" in Prisma's migration tracking table (`_prisma_migrations`) even though the SQL didn't actually run. This is called "schema drift."

The fix adds the column directly, which is safe because the migration uses `IF NOT EXISTS`.

