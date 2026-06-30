-- Fix registration_requests table - add missing country column
-- The table was created earlier without this column

-- Add country column if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'registration_requests'
    AND column_name = 'country'
  ) THEN
    ALTER TABLE registration_requests ADD COLUMN country TEXT NOT NULL DEFAULT 'Unknown';
    RAISE NOTICE 'Added country column to registration_requests';
  ELSE
    RAISE NOTICE 'Country column already exists';
  END IF;
END $$;

-- Update status enum if needed
DO $$
BEGIN
  -- Check if 'free' status exists in subscription_status enum
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'free'
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'subscription_status')
  ) THEN
    ALTER TYPE subscription_status ADD VALUE 'free';
    RAISE NOTICE 'Added free status to subscription_status enum';
  END IF;
END $$;

-- Verify table structure
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'registration_requests'
ORDER BY ordinal_position;
