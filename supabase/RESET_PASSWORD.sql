-- Manual Password Reset for shaame@shaamelz.com
-- Run this in Supabase SQL Editor

-- Option 1: Send password reset email (uses Supabase's built-in email)
SELECT auth.send_password_reset_email('shaame@shaamelz.com');

-- Option 2: Generate a magic link (one-time login link)
-- Copy the generated link and send it to the user manually
SELECT auth.generate_magic_link('shaame@shaamelz.com');

-- Note: You CANNOT view existing passwords (they're hashed)
-- You can only reset them
