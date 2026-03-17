-- AlterTable: Add homepage review fields to Review model
-- Make userId optional for admin-created reviews
DO $$ 
BEGIN
    -- Drop NOT NULL constraint only if column exists and is NOT NULL
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Review' 
        AND column_name = 'userId'
        AND is_nullable = 'NO'
    ) THEN
        ALTER TABLE "Review" ALTER COLUMN "userId" DROP NOT NULL;
    END IF;
    
    -- Add columns only if they don't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Review' 
        AND column_name = 'reviewerName'
    ) THEN
        ALTER TABLE "Review" ADD COLUMN "reviewerName" TEXT;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Review' 
        AND column_name = 'imageKey'
    ) THEN
        ALTER TABLE "Review" ADD COLUMN "imageKey" TEXT;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Review' 
        AND column_name = 'imageUrl'
    ) THEN
        ALTER TABLE "Review" ADD COLUMN "imageUrl" TEXT;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Review' 
        AND column_name = 'isFeatured'
    ) THEN
        ALTER TABLE "Review" ADD COLUMN "isFeatured" BOOLEAN NOT NULL DEFAULT false;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Review' 
        AND column_name = 'link'
    ) THEN
        ALTER TABLE "Review" ADD COLUMN "link" TEXT;
    END IF;
END $$;

-- Add index for featured reviews query
CREATE INDEX IF NOT EXISTS "Review_isFeatured_idx" ON "Review"("isFeatured");

-- Add index for active featured reviews (isFeatured + isVisible)
CREATE INDEX IF NOT EXISTS "Review_isFeatured_isVisible_idx" ON "Review"("isFeatured", "isVisible");

