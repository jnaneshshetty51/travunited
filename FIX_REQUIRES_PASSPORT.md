# Fix: Missing `requiresPassport` Column Error

## Problem
The production database is missing the `requiresPassport` column in the `Tour` table, causing errors:
```
The column `Tour.requiresPassport` does not exist in the current database.
```

## Root Cause
The migration `20251125163000_booking_customizations` exists locally but hasn't been applied to production.

## Solution Options

### Option 1: Quick Fix Script (Fastest) ⚡
SSH into your VPS and run the automated fix script:

```bash
ssh user@your-vps-ip
cd /var/www/travunited/travunitedlatest
bash scripts/fix-requires-passport.sh
```

This script will:
- ✅ Add the missing column to the database
- ✅ Regenerate Prisma Client
- ✅ Restart PM2

### Option 2: Run Migration (Recommended for full sync)
SSH into your VPS and run the migration:

```bash
ssh user@your-vps-ip
cd /var/www/travunited/travunitedlatest

# Load environment variables
source .env

# Run pending migrations
npx prisma migrate deploy

# Regenerate Prisma Client
npx prisma generate

# Restart the application
pm2 restart travunited --update-env
```

### Option 3: Quick SQL Fix (If migration fails)
If the migration fails for any reason, you can run the SQL directly:

```bash
ssh user@your-vps-ip
cd /var/www/travunited/travunitedlatest

# Load environment variables
source .env

# Run the SQL script
psql $DATABASE_URL -f scripts/add-requires-passport-column.sql

# Regenerate Prisma Client
npx prisma generate

# Restart the application
pm2 restart travunited --update-env
```

### Option 4: Manual SQL Command
Connect to your database and run:

```sql
ALTER TABLE "Tour" ADD COLUMN IF NOT EXISTS "requiresPassport" BOOLEAN NOT NULL DEFAULT false;
```

Then regenerate Prisma Client:
```bash
npx prisma generate
pm2 restart travunited --update-env
```

## Verification

After applying the fix, verify the column exists:

```bash
# Connect to database
psql $DATABASE_URL

# Check if column exists
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'Tour' 
AND column_name = 'requiresPassport';

# Should show:
# column_name      | data_type | column_default
# requiresPassport | boolean   | false
```

## Prevention

To prevent this in the future:
1. Always commit migrations to Git before deploying
2. Ensure `deploy-vps.sh` runs `npx prisma migrate deploy`
3. Check migration status after deployment: `npx prisma migrate status`

