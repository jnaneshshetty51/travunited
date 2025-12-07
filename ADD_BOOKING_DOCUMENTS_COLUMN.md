# Add Missing Booking.documents Column

## Problem
The `Booking` table is missing the `documents` column, which is causing payment errors:
```
Invalid `prisma.booking.create()` invocation: The column 'Booking.documents' does not exist in the current database.
```

## Solution

### Option 1: Run Prisma Migration (Recommended)

If your database is accessible, run:

```bash
npx prisma migrate deploy
```

Or use the fix script:

```bash
./fix-booking-documents.sh
```

### Option 2: Run SQL Directly

If Prisma migration doesn't work, you can run the SQL directly:

1. Connect to your PostgreSQL database:
   ```bash
   psql -h localhost -p 5433 -U your_username -d travunited_db
   ```

2. Run the SQL file:
   ```bash
   psql -h localhost -p 5433 -U your_username -d travunited_db -f add_booking_documents_column.sql
   ```

   Or copy and paste the SQL from `add_booking_documents_column.sql` into your database client.

### Option 3: Manual SQL Command

Run this SQL directly in your database:

```sql
-- Add documents column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'Booking' 
        AND column_name = 'documents'
    ) THEN
        ALTER TABLE "Booking" ADD COLUMN "documents" JSONB;
    END IF;
END $$;
```

## After Adding the Column

1. Regenerate Prisma Client:
   ```bash
   npx prisma generate
   ```

2. Restart your application

3. Test the payment flow again

## Verification

To verify the column was added, run:

```sql
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'Booking' 
AND column_name = 'documents';
```

You should see:
- `column_name`: documents
- `data_type`: jsonb
- `is_nullable`: YES

