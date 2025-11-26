-- Add requiresPassport column to Tour table if it doesn't exist
-- This fixes the production database error: "The column Tour.requiresPassport does not exist"

-- Check if column exists and add it if not
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'Tour' 
        AND column_name = 'requiresPassport'
    ) THEN
        ALTER TABLE "Tour" ADD COLUMN "requiresPassport" BOOLEAN NOT NULL DEFAULT false;
        RAISE NOTICE 'Column requiresPassport added to Tour table';
    ELSE
        RAISE NOTICE 'Column requiresPassport already exists in Tour table';
    END IF;
END $$;

