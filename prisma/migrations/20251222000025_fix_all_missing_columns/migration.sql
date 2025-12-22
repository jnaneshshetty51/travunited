-- Fix ContactMessage: Add name and phone columns (with backfill for existing data)
-- Step 1: Add name column as nullable first
ALTER TABLE "ContactMessage" ADD COLUMN IF NOT EXISTS "name" TEXT;

-- Step 2: Backfill name from email for existing rows
UPDATE "ContactMessage" 
SET "name" = COALESCE(
  SPLIT_PART("email", '@', 1), 
  'Unknown'
)
WHERE "name" IS NULL;

-- Step 3: Add phone column (nullable)
ALTER TABLE "ContactMessage" ADD COLUMN IF NOT EXISTS "phone" TEXT;

-- Step 4: Make name NOT NULL after backfill
ALTER TABLE "ContactMessage" ALTER COLUMN "name" SET NOT NULL;

-- Ensure BookingTraveller has travellerType (should already exist, but safe to add if missing)
ALTER TABLE "BookingTraveller" ADD COLUMN IF NOT EXISTS "travellerType" TEXT;

-- Add source field to Booking for tracking where bookings come from (optional, defaults to WEBSITE)
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "source" TEXT DEFAULT 'WEBSITE';

