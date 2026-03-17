-- AlterTable
-- Add columns only if they don't already exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'BlogPost' 
        AND column_name = 'metaTitle'
    ) THEN
        ALTER TABLE "BlogPost" ADD COLUMN "metaTitle" TEXT;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'BlogPost' 
        AND column_name = 'metaDescription'
    ) THEN
        ALTER TABLE "BlogPost" ADD COLUMN "metaDescription" TEXT;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'BlogPost' 
        AND column_name = 'focusKeyword'
    ) THEN
        ALTER TABLE "BlogPost" ADD COLUMN "focusKeyword" TEXT;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'BlogPost' 
        AND column_name = 'author'
    ) THEN
        ALTER TABLE "BlogPost" ADD COLUMN "author" TEXT;
    END IF;
END $$;

