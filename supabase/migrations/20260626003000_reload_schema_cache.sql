-- Force PostgREST to reload schema cache
-- This fixes PGRST204 "Could not find column" errors when schema cache is stale

-- Send notification to PostgREST to reload schema
NOTIFY pgrst, 'reload schema';

-- Also verify the registration_requests table has all required columns
DO $$
DECLARE
    missing_columns TEXT[];
BEGIN
    -- Check for required columns
    SELECT ARRAY_AGG(col) INTO missing_columns
    FROM (
        VALUES
            ('full_name'),
            ('email'),
            ('phone'),
            ('country'),
            ('company')
    ) AS required(col)
    WHERE NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'registration_requests'
          AND column_name = required.col
    );

    IF missing_columns IS NOT NULL AND array_length(missing_columns, 1) > 0 THEN
        RAISE NOTICE 'Missing columns in registration_requests: %', array_to_string(missing_columns, ', ');
        RAISE EXCEPTION 'Registration table schema is incomplete';
    ELSE
        RAISE NOTICE 'All required columns exist in registration_requests table';
    END IF;
END $$;

-- Verify table structure
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'registration_requests'
ORDER BY ordinal_position;
