-- Add fileSize to visa application documents
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'ApplicationDocument'
    ) THEN
        ALTER TABLE "ApplicationDocument" ADD COLUMN IF NOT EXISTS "fileSize" INTEGER;
        RAISE NOTICE 'Added fileSize column to ApplicationDocument table';
    ELSE
        RAISE NOTICE 'ApplicationDocument table does not exist, skipping';
    END IF;
END $$;

-- Add fileSize to tour booking documents (only if table exists)
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'BookingDocument'
    ) THEN
        ALTER TABLE "BookingDocument" ADD COLUMN IF NOT EXISTS "fileSize" INTEGER;
        RAISE NOTICE 'Added fileSize column to BookingDocument table';
    ELSE
        RAISE NOTICE 'BookingDocument table does not exist, skipping';
    END IF;
END $$;

