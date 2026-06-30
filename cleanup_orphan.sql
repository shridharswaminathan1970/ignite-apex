-- Clean up orphaned auth record for josrogzvilla@yahoo.com
-- First check if users table record exists
SELECT id, email, name, role FROM users WHERE email = 'josrogzvilla@yahoo.com';

-- Check auth.users record
SELECT id, email FROM auth.users WHERE email = 'josrogzvilla@yahoo.com';

-- If users table is empty but auth.users has record, delete from auth
-- You'll need to run this via Supabase Dashboard SQL Editor with service role:
-- DELETE FROM auth.users WHERE email = 'josrogzvilla@yahoo.com';
