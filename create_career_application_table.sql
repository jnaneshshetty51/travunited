-- Create CareerApplication table and enum if they don't exist
-- Run this script on your production database if the table doesn't exist

-- Create enum if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'CareerApplicationStatus') THEN
        CREATE TYPE "CareerApplicationStatus" AS ENUM ('NEW', 'REVIEWED', 'SHORTLISTED', 'REJECTED', 'ON_HOLD');
    END IF;
END $$;

-- Create table if it doesn't exist
CREATE TABLE IF NOT EXISTS "CareerApplication" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "location" TEXT,
    "positionTitle" TEXT NOT NULL,
    "experience" INTEGER,
    "currentCompany" TEXT,
    "expectedCtc" TEXT,
    "coverNote" TEXT,
    "resumeUrl" TEXT NOT NULL,
    "status" "CareerApplicationStatus" NOT NULL DEFAULT 'NEW',
    "internalNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CareerApplication_pkey" PRIMARY KEY ("id")
);

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS "CareerApplication_status_idx" ON "CareerApplication"("status");
CREATE INDEX IF NOT EXISTS "CareerApplication_positionTitle_idx" ON "CareerApplication"("positionTitle");
CREATE INDEX IF NOT EXISTS "CareerApplication_email_idx" ON "CareerApplication"("email");
CREATE INDEX IF NOT EXISTS "CareerApplication_createdAt_idx" ON "CareerApplication"("createdAt");

-- Add internalNotes column if it doesn't exist (from later migration)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'CareerApplication' AND column_name = 'internalNotes'
    ) THEN
        ALTER TABLE "CareerApplication" ADD COLUMN "internalNotes" TEXT;
    END IF;
END $$;

