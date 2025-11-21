# Fix Failed Migration on VPS

## Problem
Migration `20251121032017_align_visa_with_csv_template` failed on production. Prisma won't apply new migrations until this is resolved.

## Step 1: Check Migration Status

SSH into your VPS and run:

```bash
cd /var/www/travunited/travunitedlatest
set -a; source .env; set +a
npx prisma migrate status
```

This will show you the current migration state.

## Step 2: Check if Columns Already Exist

Connect to your database and check if the columns were partially created:

```bash
# Connect to PostgreSQL
psql $DATABASE_URL

# Or if using direct connection:
# psql -h localhost -U your_user -d travunited_db

# Check if columns exist
\d "Visa"
```

Look for these columns:
- `stayDurationDays`
- `validityDays`
- `govtFee`
- `serviceFee`
- `currency`

## Step 3: Resolve the Failed Migration

### Option A: Columns DON'T exist (migration failed before adding them)

Mark the migration as rolled back, then reapply:

```bash
cd /var/www/travunited/travunitedlatest
set -a; source .env; set +a

# Mark as rolled back
npx prisma migrate resolve --rolled-back 20251121032017_align_visa_with_csv_template

# Now apply migrations again
npx prisma migrate deploy
```

### Option B: Columns DO exist (migration partially succeeded)

Mark the migration as applied since the changes are already in the database:

```bash
cd /var/www/travunited/travunitedlatest
set -a; source .env; set +a

# Mark as applied (since columns already exist)
npx prisma migrate resolve --applied 20251121032017_align_visa_with_csv_template

# Verify status
npx prisma migrate status
```

### Option C: Manual Fix (if above don't work)

If the migration is stuck, you can manually fix it:

1. **Check the migration file on VPS:**
   ```bash
   cat prisma/migrations/20251121032017_align_visa_with_csv_template/migration.sql
   ```

2. **If columns don't exist, manually add them:**
   ```sql
   ALTER TABLE "Visa" 
   ADD COLUMN IF NOT EXISTS "stayDurationDays" INTEGER,
   ADD COLUMN IF NOT EXISTS "validityDays" INTEGER,
   ADD COLUMN IF NOT EXISTS "govtFee" INTEGER,
   ADD COLUMN IF NOT EXISTS "serviceFee" INTEGER,
   ADD COLUMN IF NOT EXISTS "currency" TEXT DEFAULT 'INR';
   ```

3. **Then mark migration as applied:**
   ```bash
   npx prisma migrate resolve --applied 20251121032017_align_visa_with_csv_template
   ```

## Step 4: Verify and Continue

After resolving the failed migration:

```bash
# Check migration status (should show all migrations applied)
npx prisma migrate status

# Regenerate Prisma Client
npx prisma generate

# Rebuild and restart
npm run build
pm2 restart travunited --update-env
```

## Prevention

**Important:** Always use `prisma migrate deploy` in production, NOT `prisma migrate dev`.

- `migrate dev` - Creates new migrations (use in development only)
- `migrate deploy` - Applies existing migrations (use in production)

Make sure your deployment script uses `migrate deploy`.

## Quick Fix Script

If you want to automate this, here's a script you can run on VPS:

```bash
#!/bin/bash
cd /var/www/travunited/travunitedlatest
set -a; source .env; set +a

# Check if columns exist
COLUMNS_EXIST=$(psql $DATABASE_URL -t -c "SELECT COUNT(*) FROM information_schema.columns WHERE table_name='Visa' AND column_name IN ('stayDurationDays', 'validityDays', 'govtFee', 'serviceFee', 'currency');" | xargs)

if [ "$COLUMNS_EXIST" -ge "5" ]; then
  echo "Columns exist - marking migration as applied"
  npx prisma migrate resolve --applied 20251121032017_align_visa_with_csv_template
else
  echo "Columns don't exist - marking migration as rolled back"
  npx prisma migrate resolve --rolled-back 20251121032017_align_visa_with_csv_template
  npx prisma migrate deploy
fi

npx prisma generate
npm run build
pm2 restart travunited --update-env
```

