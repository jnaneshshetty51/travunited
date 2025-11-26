# Fix Missing Database Tables/Columns (BookingAddOn & requiresPassport)

## Problem
- `BookingAddOn` table doesn't exist (P2021 error)
- `Tour.requiresPassport` column doesn't exist (P2022 error)
- This causes 500 errors on booking detail pages and bulk delete operations

## Root Cause
The migration `20251125163000_booking_customizations` failed on the VPS and Prisma marked it as failed, preventing it from running again.

## Solution

### Step 1: SSH into VPS and navigate to project
```bash
cd /var/www/travunited/travunitedlatest
```

### Step 2: Load environment variables
```bash
set -a; source .env; set +a
echo $DATABASE_URL  # Verify it's loaded
```

### Step 3: Check migration status
```bash
npx prisma migrate status
```

You should see the `20251125163000_booking_customizations` migration marked as failed.

### Step 4: Mark the migration as resolved
Since the migration SQL is already idempotent (uses `IF NOT EXISTS`), we can safely mark it as resolved:

```bash
npx prisma migrate resolve --applied "20251125163000_booking_customizations"
```

### Step 5: Deploy the migration
```bash
npx prisma migrate deploy
```

This will run the migration SQL which includes:
- Creating `BookingAddOn` table (if not exists)
- Adding `Tour.requiresPassport` column (if not exists)
- All other booking customization fields

### Step 6: Regenerate Prisma Client
```bash
npx prisma generate
```

### Step 7: Rebuild and restart
```bash
npm run build
pm2 restart travunited
```

## Verification

After applying the fix, verify the tables/columns exist:

```bash
# Connect to PostgreSQL
psql $DATABASE_URL

# Check if BookingAddOn table exists
\dt "BookingAddOn"

# Check if requiresPassport column exists
\d "Tour" | grep requiresPassport

# Exit
\q
```

## Alternative: Manual SQL Fix (if migrate resolve doesn't work)

If the above doesn't work, you can manually run the migration SQL:

```bash
psql $DATABASE_URL -f prisma/migrations/20251125163000_booking_customizations/migration.sql
```

Then mark it as applied:
```bash
npx prisma migrate resolve --applied "20251125163000_booking_customizations"
```

## Notes

- The migration file is already idempotent (uses `IF NOT EXISTS` and `IF NOT EXISTS` checks)
- It's safe to run multiple times
- The migration creates:
  - `BookingAddOn` table with proper foreign keys
  - `Tour.requiresPassport` column
  - Various booking preference fields
  - BookingTraveller passport fields

