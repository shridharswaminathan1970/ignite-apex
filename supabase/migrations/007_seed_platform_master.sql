-- Seed Platform Master (super_duper_admin)
-- This creates the initial platform admin user: muhammad.shaamel@gmail.com
-- Run this ONCE after creating the auth user in Supabase dashboard

-- First, check if super_duper_admin already exists to avoid duplicates
DO $$
DECLARE
  v_auth_uid UUID;
  v_user_exists BOOLEAN;
BEGIN
  -- Get the auth.users ID for muhammad.shaamel@gmail.com
  -- This assumes the auth user was created manually in Supabase dashboard
  SELECT id INTO v_auth_uid
  FROM auth.users
  WHERE email = 'muhammad.shaamel@gmail.com'
  LIMIT 1;

  IF v_auth_uid IS NULL THEN
    RAISE NOTICE 'Auth user muhammad.shaamel@gmail.com not found in auth.users. Please create this user in Supabase Auth dashboard first.';
    RAISE EXCEPTION 'Cannot seed platform master - auth user does not exist';
  END IF;

  -- Check if user profile already exists
  SELECT EXISTS(
    SELECT 1 FROM public.users WHERE id = v_auth_uid
  ) INTO v_user_exists;

  IF v_user_exists THEN
    RAISE NOTICE 'User profile already exists for muhammad.shaamel@gmail.com';
  ELSE
    -- Create the platform master user profile
    INSERT INTO public.users (
      id,
      email,
      name,
      role,
      org_id,
      manager_id,
      crm_enabled,
      is_active,
      account_type,
      created_at
    ) VALUES (
      v_auth_uid,
      'muhammad.shaamel@gmail.com',
      'Muhammad Shaamel',
      'super_duper_admin',
      NULL, -- Platform master has no org
      NULL, -- Platform master has no manager
      true, -- Can access everything
      true, -- Active
      'platform_master',
      NOW()
    );

    RAISE NOTICE 'Platform master user profile created successfully for muhammad.shaamel@gmail.com';
  END IF;
END $$;
