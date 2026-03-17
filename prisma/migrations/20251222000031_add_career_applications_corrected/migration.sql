-- CreateEnum
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'CareerApplicationStatus') THEN
        CREATE TYPE "CareerApplicationStatus" AS ENUM ('NEW', 'REVIEWED', 'SHORTLISTED', 'REJECTED', 'ON_HOLD');
    END IF;
END $$;

-- CreateTable
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
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CareerApplication_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "CareerApplication_status_idx" ON "CareerApplication"("status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "CareerApplication_positionTitle_idx" ON "CareerApplication"("positionTitle");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "CareerApplication_email_idx" ON "CareerApplication"("email");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "CareerApplication_createdAt_idx" ON "CareerApplication"("createdAt");

