-- Update super admin email from super@travunited.com to travunited3@gmail.com
-- This migration updates the existing super admin user's email address
-- Made idempotent: only updates if the target email doesn't already exist as SUPER_ADMIN

DO $$
BEGIN
  -- Only update if:
  -- 1. The source email (super@travunited.com) exists with SUPER_ADMIN role
  -- 2. The target email (travunited3@gmail.com) does NOT exist with SUPER_ADMIN role
  IF EXISTS (
    SELECT 1 FROM "User" 
    WHERE email = 'super@travunited.com' 
    AND role = 'SUPER_ADMIN'
  ) AND NOT EXISTS (
    SELECT 1 FROM "User" 
    WHERE email = 'travunited3@gmail.com' 
    AND role = 'SUPER_ADMIN'
  ) THEN
    UPDATE "User"
    SET email = 'travunited3@gmail.com'
    WHERE email = 'super@travunited.com' AND role = 'SUPER_ADMIN';
  END IF;
  
  -- Safety check - if travunited3@gmail.com exists but is not SUPER_ADMIN,
  -- we should not update to avoid conflicts
  IF EXISTS (
    SELECT 1 FROM "User" 
    WHERE email = 'travunited3@gmail.com' 
    AND role != 'SUPER_ADMIN'
  ) THEN
    RAISE NOTICE 'Warning: travunited3@gmail.com already exists with a different role. Manual intervention may be required.';
  END IF;
END $$;

