-- Fix ContactMessage: Add name and phone columns (with backfill for existing data)
-- Only proceed if the table exists
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ContactMessage') THEN
        -- Step 1: Add name column as nullable first
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ContactMessage' AND column_name = 'name') THEN
            ALTER TABLE "ContactMessage" ADD COLUMN "name" TEXT;
        END IF;

        -- Step 2: Backfill name from email for existing rows
        UPDATE "ContactMessage" 
        SET "name" = COALESCE(
          SPLIT_PART("email", '@', 1), 
          'Unknown'
        )
        WHERE "name" IS NULL;

        -- Step 3: Add phone column (nullable)
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ContactMessage' AND column_name = 'phone') THEN
            ALTER TABLE "ContactMessage" ADD COLUMN "phone" TEXT;
        END IF;

        -- Step 4: Make name NOT NULL after backfill (only if column is currently nullable)
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ContactMessage' AND column_name = 'name' AND is_nullable = 'YES') THEN
            ALTER TABLE "ContactMessage" ALTER COLUMN "name" SET NOT NULL;
        END IF;
    END IF;
END $$;

-- Ensure BookingTraveller has travellerType (should already exist, but safe to add if missing)
ALTER TABLE "BookingTraveller" ADD COLUMN IF NOT EXISTS "travellerType" TEXT;

-- Add source field to Booking for tracking where bookings come from (optional, defaults to WEBSITE)
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "source" TEXT DEFAULT 'WEBSITE';

