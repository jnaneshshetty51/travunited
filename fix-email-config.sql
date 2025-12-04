-- Fix Email Configuration in Database
-- This script clears the old email configuration from the database
-- so the system will use the .env file values instead

-- Delete the cached email configuration
DELETE FROM "Setting" WHERE key = 'EMAIL_CONFIG';

-- Verify it's deleted
SELECT * FROM "Setting" WHERE key = 'EMAIL_CONFIG';

-- After running this, restart your application and it will use the .env values

