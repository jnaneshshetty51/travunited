-- Add required name column and optional phone column to ContactMessage.
-- Make name nullable during backfill to avoid NOT NULL violations, then enforce NOT NULL.

-- Only proceed if the table exists
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ContactMessage') THEN
        -- Add name column if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ContactMessage' AND column_name = 'name') THEN
            ALTER TABLE "ContactMessage" ADD COLUMN "name" TEXT;
        END IF;
        
        -- Add phone column if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ContactMessage' AND column_name = 'phone') THEN
            ALTER TABLE "ContactMessage" ADD COLUMN "phone" TEXT;
        END IF;

        -- Backfill name from email (or fallback text) for existing rows
        UPDATE "ContactMessage"
        SET "name" = COALESCE("name", "email", 'Unknown')
        WHERE "name" IS NULL;

        -- Enforce NOT NULL on name after backfill (only if column exists and has values)
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ContactMessage' AND column_name = 'name' AND is_nullable = 'YES') THEN
            ALTER TABLE "ContactMessage" ALTER COLUMN "name" SET NOT NULL;
        END IF;
    END IF;
END $$;

