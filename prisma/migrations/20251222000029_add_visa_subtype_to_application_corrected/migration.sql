-- AlterTable
ALTER TABLE "Application" ADD COLUMN IF NOT EXISTS "visaSubTypeId" TEXT;

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'Application_visaSubTypeId_fkey'
    ) THEN
        ALTER TABLE "Application" ADD CONSTRAINT "Application_visaSubTypeId_fkey" 
        FOREIGN KEY ("visaSubTypeId") REFERENCES "VisaSubType"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;
