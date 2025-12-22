-- AlterTable
-- Add columns to Application table only if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Application' 
        AND column_name = 'invoiceUrl'
    ) THEN
        ALTER TABLE "Application" ADD COLUMN "invoiceUrl" TEXT;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Application' 
        AND column_name = 'invoiceUploadedAt'
    ) THEN
        ALTER TABLE "Application" ADD COLUMN "invoiceUploadedAt" TIMESTAMP(3);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Application' 
        AND column_name = 'invoiceUploadedByAdminId'
    ) THEN
        ALTER TABLE "Application" ADD COLUMN "invoiceUploadedByAdminId" TEXT;
    END IF;
END $$;

-- AlterTable
-- Add columns to Booking table only if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Booking' 
        AND column_name = 'invoiceUrl'
    ) THEN
        ALTER TABLE "Booking" ADD COLUMN "invoiceUrl" TEXT;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Booking' 
        AND column_name = 'invoiceUploadedAt'
    ) THEN
        ALTER TABLE "Booking" ADD COLUMN "invoiceUploadedAt" TIMESTAMP(3);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Booking' 
        AND column_name = 'invoiceUploadedByAdminId'
    ) THEN
        ALTER TABLE "Booking" ADD COLUMN "invoiceUploadedByAdminId" TEXT;
    END IF;
END $$;

