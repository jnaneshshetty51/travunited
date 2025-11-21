# Tour Import Fix - Schema Mismatch & Audit Log Issues

## Issues Fixed

### 1. Prisma Schema Mismatch (shortDescription error)

**Problem:** The import code was trying to use `shortDescription` and other fields that don't exist in the Prisma Client on the VPS server.

**Root Cause:** 
- The migration `20251120185544_add_tour_fields` adds `shortDescription` and other fields
- This migration hasn't been applied on the VPS database, OR
- `npx prisma generate` wasn't run after the migration, so Prisma Client is outdated

**Fix Applied:**
- Updated `deploy-vps.sh` to automatically run migrations and regenerate Prisma Client
- Updated `VPS_DEPLOYMENT.md` with troubleshooting steps for schema mismatches
- Improved error messages in import route to clearly indicate schema mismatch issues

**Action Required on VPS:**
```bash
cd /var/www/travunited/travunitedlatest
set -a; source .env; set +a
npx prisma migrate deploy
npx prisma generate
npm run build
pm2 restart travunited --update-env
```

### 2. Audit Log Foreign Key Constraint Violation

**Problem:** When creating audit logs, the `adminId` from `session.user.id` was causing FK constraint failures because the user ID didn't exist in the User table.

**Root Cause:** 
- The audit log was using `session.user.id` directly without verifying it exists in the database
- This could happen if there's a mismatch between session user ID and database user ID

**Fix Applied:**
- Updated `src/lib/audit.ts` to verify the admin user exists before using their ID
- If the admin ID doesn't exist, it now uses `null` instead (which is allowed by the schema)
- Added warning logs when admin ID validation fails

**Code Changes:**
- `src/lib/audit.ts`: Added user existence check before creating audit log
- `src/app/api/admin/content/tours/import/route.ts`: Improved error messages for better debugging

## Files Modified

1. `src/lib/audit.ts` - Added admin ID validation
2. `src/app/api/admin/content/tours/import/route.ts` - Better error handling
3. `deploy-vps.sh` - Added migration steps
4. `VPS_DEPLOYMENT.md` - Added troubleshooting section

## Testing

After applying the fixes on VPS:

1. **Verify migrations are applied:**
   ```bash
   npx prisma migrate status
   ```
   Should show all migrations as applied.

2. **Test tour import:**
   - Go to Admin → Content → Tours → Import
   - Upload a CSV file
   - Click "Validate" - should show valid rows
   - Click "Import" - should successfully create tours without errors

3. **Check audit logs:**
   - Go to Admin → Settings → Audit Logs
   - Should see import events without FK errors

## Prevention

The updated `deploy-vps.sh` script now automatically:
- Applies database migrations
- Regenerates Prisma Client
- This prevents future schema mismatches

Always use the deploy script or follow the manual steps in `VPS_DEPLOYMENT.md` when deploying code that includes schema changes.

