-- Add fileSize to visa application documents
ALTER TABLE "ApplicationDocument"
ADD COLUMN IF NOT EXISTS "fileSize" INTEGER;

-- Add fileSize to tour booking documents
ALTER TABLE "BookingDocument"
ADD COLUMN IF NOT EXISTS "fileSize" INTEGER;

