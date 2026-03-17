-- AlterEnum
-- Add new values to VisaMode enum
-- Note: ALTER TYPE ADD VALUE cannot be rolled back, but we check if values exist first

DO $$ 
BEGIN
  -- Add PRE_ENROLLMENT if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'PRE_ENROLLMENT' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'VisaMode')
  ) THEN
    ALTER TYPE "VisaMode" ADD VALUE 'PRE_ENROLLMENT';
  END IF;
END $$;

DO $$ 
BEGIN
  -- Add ARRIVAL_CARD if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'ARRIVAL_CARD' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'VisaMode')
  ) THEN
    ALTER TYPE "VisaMode" ADD VALUE 'ARRIVAL_CARD';
  END IF;
END $$;

DO $$ 
BEGIN
  -- Add VISA_FREE_ENTRY if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'VISA_FREE_ENTRY' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'VisaMode')
  ) THEN
    ALTER TYPE "VisaMode" ADD VALUE 'VISA_FREE_ENTRY';
  END IF;
END $$;

DO $$ 
BEGIN
  -- Add SCHENGEN_VISA if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'SCHENGEN_VISA' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'VisaMode')
  ) THEN
    ALTER TYPE "VisaMode" ADD VALUE 'SCHENGEN_VISA';
  END IF;
END $$;

DO $$ 
BEGIN
  -- Add APPOINTMENTS if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'APPOINTMENTS' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'VisaMode')
  ) THEN
    ALTER TYPE "VisaMode" ADD VALUE 'APPOINTMENTS';
  END IF;
END $$;

