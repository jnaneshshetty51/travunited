-- AlterTable: Add panNumber and aadharFileKey to BookingTraveller
ALTER TABLE "BookingTraveller" ADD COLUMN IF NOT EXISTS "panNumber" TEXT;
ALTER TABLE "BookingTraveller" ADD COLUMN IF NOT EXISTS "aadharFileKey" TEXT;

-- CreateEnum: CustomTourRequestStatus
DO $$ BEGIN
 CREATE TYPE "CustomTourRequestStatus" AS ENUM('NEW', 'REVIEWED', 'QUOTED', 'CLOSED');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

-- CreateTable: CustomTourRequest
CREATE TABLE IF NOT EXISTS "CustomTourRequest" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "preferredDates" TEXT,
    "pax" INTEGER,
    "budget" INTEGER,
    "message" TEXT,
    "attachments" JSONB,
    "status" "CustomTourRequestStatus" NOT NULL DEFAULT 'NEW',
    "internalNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomTourRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "CustomTourRequest_status_idx" ON "CustomTourRequest"("status");
CREATE INDEX IF NOT EXISTS "CustomTourRequest_email_idx" ON "CustomTourRequest"("email");
CREATE INDEX IF NOT EXISTS "CustomTourRequest_createdAt_idx" ON "CustomTourRequest"("createdAt");

