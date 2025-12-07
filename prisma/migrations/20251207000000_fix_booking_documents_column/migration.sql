-- Fix Booking.documents column - ensure it exists
DO $$ 
BEGIN
    -- Add documents JSONB column to Booking if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'Booking' 
        AND column_name = 'documents'
    ) THEN
        ALTER TABLE "Booking" ADD COLUMN "documents" JSONB;
        RAISE NOTICE 'Added documents column to Booking table';
    ELSE
        RAISE NOTICE 'documents column already exists in Booking table';
    END IF;
END $$;

