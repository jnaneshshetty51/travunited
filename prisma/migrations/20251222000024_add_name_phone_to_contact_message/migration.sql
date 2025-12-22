-- Add required name column and optional phone column to ContactMessage.
-- Make name nullable during backfill to avoid NOT NULL violations, then enforce NOT NULL.

ALTER TABLE "ContactMessage"
ADD COLUMN "name" TEXT,
ADD COLUMN "phone" TEXT;

-- Backfill name from email (or fallback text) for existing rows
UPDATE "ContactMessage"
SET "name" = COALESCE("name", "email", 'Unknown');

-- Enforce NOT NULL on name after backfill
ALTER TABLE "ContactMessage"
ALTER COLUMN "name" SET NOT NULL;

