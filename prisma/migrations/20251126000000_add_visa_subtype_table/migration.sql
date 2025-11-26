-- CreateTable: VisaSubType
CREATE TABLE IF NOT EXISTS "VisaSubType" (
    "id" TEXT NOT NULL,
    "visaId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "code" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VisaSubType_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "VisaSubType_visaId_idx" ON "VisaSubType"("visaId");

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'VisaSubType_visaId_fkey'
    ) THEN
        ALTER TABLE "VisaSubType" ADD CONSTRAINT "VisaSubType_visaId_fkey" 
        FOREIGN KEY ("visaId") REFERENCES "Visa"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

