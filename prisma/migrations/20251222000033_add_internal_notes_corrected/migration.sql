-- Add internalNotes to CareerApplication
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'CareerApplication' 
        AND column_name = 'internalNotes'
    ) THEN
        ALTER TABLE "CareerApplication" ADD COLUMN "internalNotes" TEXT;
    END IF;
END $$;

-- Add internalNotes to CorporateLead
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'CorporateLead' 
        AND column_name = 'internalNotes'
    ) THEN
        ALTER TABLE "CorporateLead" ADD COLUMN "internalNotes" TEXT;
    END IF;
END $$;

