-- Verify registration_requests table has all required columns

SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'registration_requests'
ORDER BY ordinal_position;

-- Expected columns:
-- id (uuid)
-- full_name (text)
-- email (text)
-- phone (text)
-- country (text) <- Should be there now!
-- company (text)
-- status (text)
-- requested_at (timestamptz)
-- approved_at (timestamptz)
-- approved_by (uuid)
-- rejection_reason (text)
-- created_at (timestamptz)
-- updated_at (timestamptz)

-- Test insert
INSERT INTO registration_requests (
  full_name,
  email,
  phone,
  country,
  company
) VALUES (
  'Test User SQL',
  'test.sql@example.com',
  '+1 234 567 8900',
  'United States',
  'NA'
) ON CONFLICT (email) DO NOTHING
RETURNING id, full_name, email, country, status;
