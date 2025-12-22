-- Alter table Booking to store add-on selections, preferences, and policy consent
-- Add columns only if they don't already exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Booking' 
        AND column_name = 'foodPreference'
    ) THEN
        ALTER TABLE "Booking" ADD COLUMN "foodPreference" TEXT;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Booking' 
        AND column_name = 'foodPreferenceNotes'
    ) THEN
        ALTER TABLE "Booking" ADD COLUMN "foodPreferenceNotes" TEXT;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Booking' 
        AND column_name = 'languagePreference'
    ) THEN
        ALTER TABLE "Booking" ADD COLUMN "languagePreference" TEXT;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Booking' 
        AND column_name = 'languagePreferenceOther'
    ) THEN
        ALTER TABLE "Booking" ADD COLUMN "languagePreferenceOther" TEXT;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Booking' 
        AND column_name = 'driverPreference'
    ) THEN
        ALTER TABLE "Booking" ADD COLUMN "driverPreference" TEXT;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Booking' 
        AND column_name = 'specialRequests'
    ) THEN
        ALTER TABLE "Booking" ADD COLUMN "specialRequests" TEXT;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Booking' 
        AND column_name = 'policyAccepted'
    ) THEN
        ALTER TABLE "Booking" ADD COLUMN "policyAccepted" BOOLEAN NOT NULL DEFAULT false;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Booking' 
        AND column_name = 'policyAcceptedAt'
    ) THEN
        ALTER TABLE "Booking" ADD COLUMN "policyAcceptedAt" TIMESTAMP(3);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Booking' 
        AND column_name = 'policyAcceptedByUserId'
    ) THEN
        ALTER TABLE "Booking" ADD COLUMN "policyAcceptedByUserId" TEXT;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Booking' 
        AND column_name = 'policyVersion'
    ) THEN
        ALTER TABLE "Booking" ADD COLUMN "policyVersion" TEXT;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Booking' 
        AND column_name = 'policyAcceptedIp'
    ) THEN
        ALTER TABLE "Booking" ADD COLUMN "policyAcceptedIp" TEXT;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Booking' 
        AND column_name = 'policyAcceptedUserAgent'
    ) THEN
        ALTER TABLE "Booking" ADD COLUMN "policyAcceptedUserAgent" TEXT;
    END IF;
END $$;

-- Extend BookingTraveller with per-booking traveller + passport metadata
DO $$ 
BEGIN
    -- Drop NOT NULL constraint only if column exists and is NOT NULL
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'BookingTraveller' 
        AND column_name = 'travellerId'
        AND is_nullable = 'NO'
    ) THEN
        ALTER TABLE "BookingTraveller" ALTER COLUMN "travellerId" DROP NOT NULL;
    END IF;
    
    -- Add columns only if they don't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'BookingTraveller' 
        AND column_name = 'firstName'
    ) THEN
        ALTER TABLE "BookingTraveller" ADD COLUMN "firstName" TEXT NOT NULL DEFAULT '';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'BookingTraveller' 
        AND column_name = 'lastName'
    ) THEN
        ALTER TABLE "BookingTraveller" ADD COLUMN "lastName" TEXT NOT NULL DEFAULT '';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'BookingTraveller' 
        AND column_name = 'dateOfBirth'
    ) THEN
        ALTER TABLE "BookingTraveller" ADD COLUMN "dateOfBirth" TIMESTAMP(3);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'BookingTraveller' 
        AND column_name = 'age'
    ) THEN
        ALTER TABLE "BookingTraveller" ADD COLUMN "age" INTEGER;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'BookingTraveller' 
        AND column_name = 'gender'
    ) THEN
        ALTER TABLE "BookingTraveller" ADD COLUMN "gender" TEXT;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'BookingTraveller' 
        AND column_name = 'nationality'
    ) THEN
        ALTER TABLE "BookingTraveller" ADD COLUMN "nationality" TEXT;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'BookingTraveller' 
        AND column_name = 'passportNumber'
    ) THEN
        ALTER TABLE "BookingTraveller" ADD COLUMN "passportNumber" TEXT;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'BookingTraveller' 
        AND column_name = 'passportExpiry'
    ) THEN
        ALTER TABLE "BookingTraveller" ADD COLUMN "passportExpiry" TIMESTAMP(3);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'BookingTraveller' 
        AND column_name = 'passportIssuingCountry'
    ) THEN
        ALTER TABLE "BookingTraveller" ADD COLUMN "passportIssuingCountry" TEXT;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'BookingTraveller' 
        AND column_name = 'passportFileKey'
    ) THEN
        ALTER TABLE "BookingTraveller" ADD COLUMN "passportFileKey" TEXT;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'BookingTraveller' 
        AND column_name = 'isPassportRequired'
    ) THEN
        ALTER TABLE "BookingTraveller" ADD COLUMN "isPassportRequired" BOOLEAN NOT NULL DEFAULT false;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'BookingTraveller' 
        AND column_name = 'updatedAt'
    ) THEN
        ALTER TABLE "BookingTraveller" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
    END IF;
END $$;

