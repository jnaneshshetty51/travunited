-- CreateTable
CREATE TABLE IF NOT EXISTS "SitePolicy" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SitePolicy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "BookingDocument" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "travellerId" TEXT,
    "type" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "fileName" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "rejectionReason" TEXT,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BookingDocument_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "SitePolicy_key_key" ON "SitePolicy"("key");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "SitePolicy_key_idx" ON "SitePolicy"("key");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "BookingDocument_bookingId_idx" ON "BookingDocument"("bookingId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "BookingDocument_travellerId_idx" ON "BookingDocument"("travellerId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "BookingDocument_status_idx" ON "BookingDocument"("status");

-- AddForeignKey
ALTER TABLE "BookingDocument" ADD CONSTRAINT IF NOT EXISTS "BookingDocument_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingDocument" ADD CONSTRAINT IF NOT EXISTS "BookingDocument_travellerId_fkey" FOREIGN KEY ("travellerId") REFERENCES "BookingTraveller"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddColumn (idempotent - only add if not exists)
DO $$ 
BEGIN
    -- Add travellerType to BookingTraveller
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='BookingTraveller' AND column_name='travellerType') THEN
        ALTER TABLE "BookingTraveller" ADD COLUMN "travellerType" TEXT;
    END IF;

    -- Add documents JSON to Booking
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Booking' AND column_name='documents') THEN
        ALTER TABLE "Booking" ADD COLUMN "documents" JSONB;
    END IF;

    -- Add child pricing fields to Tour
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Tour' AND column_name='childPricingType') THEN
        ALTER TABLE "Tour" ADD COLUMN "childPricingType" TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Tour' AND column_name='childPricingValue') THEN
        ALTER TABLE "Tour" ADD COLUMN "childPricingValue" INTEGER;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Tour' AND column_name='childAgeLimit') THEN
        ALTER TABLE "Tour" ADD COLUMN "childAgeLimit" INTEGER DEFAULT 12;
    END IF;

    -- Add requiredDocuments to Tour
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Tour' AND column_name='requiredDocuments') THEN
        ALTER TABLE "Tour" ADD COLUMN "requiredDocuments" JSONB;
    END IF;
END $$;

