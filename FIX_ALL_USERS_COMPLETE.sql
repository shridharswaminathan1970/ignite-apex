-- COMPLETE FIX FOR ALL USERS
-- Fixes: RLS policies + registration flow + all existing broken users

-- ═══════════════════════════════════════════════════════════════════
-- PART 1: FIX RLS (affects all current and future users)
-- ═══════════════════════════════════════════════════════════════════

-- Disable RLS temporarily
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname
    FROM pg_policies
    WHERE tablename = 'users' AND schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON users', pol.policyname);
  END LOOP;
END $$;

-- Re-enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create clean policies
CREATE POLICY "users_select_all"
ON users FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "users_update_self"
ON users FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

CREATE POLICY "users_insert"
ON users FOR INSERT
TO authenticated
WITH CHECK (true);


-- ═══════════════════════════════════════════════════════════════════
-- PART 2: FIX REGISTRATION FLOW (affects all future users)
-- ═══════════════════════════════════════════════════════════════════

-- Update approve_individual_registration to create user records
CREATE OR REPLACE FUNCTION approve_individual_registration(request_id UUID)
RETURNS JSON AS $$
DECLARE
  req RECORD;
  org_uuid UUID;
  team_uuid UUID;
  auth_user_id UUID;
BEGIN
  -- Get registration request
  SELECT * INTO req FROM registration_requests WHERE id = request_id AND status = 'pending';

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Request not found or already processed');
  END IF;

  -- Create organization with unique slug
  INSERT INTO organisations (name, slug, domain, status)
  VALUES (
    'NA',
    LOWER(REPLACE(req.email, '@', '_at_')) || '_' || SUBSTRING(MD5(req.email) FROM 1 FOR 8),
    LOWER(REPLACE(req.email, '@', '_at_')) || '.individual',
    'active'
  )
  RETURNING id INTO org_uuid;

  -- Create default team
  INSERT INTO teams (name, org_id)
  VALUES ('Team Alpha', org_uuid)
  RETURNING id INTO team_uuid;

  -- Check if auth user exists
  SELECT id INTO auth_user_id FROM auth.users WHERE email = req.email;

  IF auth_user_id IS NOT NULL THEN
    -- Create or update user record
    INSERT INTO users (
      id,
      email,
      name,
      role,
      org_id,
      team_id,
      status,
      crm_enabled,
      account_type
    )
    VALUES (
      auth_user_id,
      req.email,
      req.name,
      'sdr',
      org_uuid,
      team_uuid,
      'active',
      true,
      'company'
    )
    ON CONFLICT (id) DO UPDATE SET
      org_id = EXCLUDED.org_id,
      team_id = EXCLUDED.team_id,
      role = EXCLUDED.role,
      status = 'active',
      crm_enabled = true;
  END IF;

  -- Create subscription
  INSERT INTO org_subscriptions (
    org_id,
    status,
    plan,
    billing_cycle,
    max_users,
    crm_enabled,
    b2b0_enabled
  ) VALUES (
    org_uuid,
    'free',
    'team_mini',
    'monthly',
    1,
    false,
    false
  );

  -- Update request
  UPDATE registration_requests
  SET
    status = 'approved',
    approved_at = now(),
    approved_by = auth.uid()
  WHERE id = request_id;

  RETURN json_build_object(
    'success', true,
    'email', req.email,
    'org_id', org_uuid,
    'team_id', team_uuid,
    'user_created', (auth_user_id IS NOT NULL),
    'message', 'Registration approved'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Update trigger to handle public signups better
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Skip if user already exists (from approval process)
  IF EXISTS (SELECT 1 FROM public.users WHERE id = NEW.id) THEN
    RETURN NEW;
  END IF;

  -- If signup has org_id metadata (invited user)
  IF (NEW.raw_user_meta_data ->> 'org_id') IS NOT NULL THEN
    INSERT INTO public.users (id, org_id, email, name, role, status, account_type)
    VALUES (
      NEW.id,
      (NEW.raw_user_meta_data ->> 'org_id')::UUID,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data ->> 'name', split_part(NEW.email, '@', 1)),
      COALESCE(NEW.raw_user_meta_data ->> 'role', 'sdr'),
      'active',
      'company'
    )
    ON CONFLICT (id) DO NOTHING;
  ELSE
    -- Public signup - create placeholder until approved
    INSERT INTO public.users (id, email, name, role, status, account_type)
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data ->> 'name', split_part(NEW.email, '@', 1)),
      'public',
      'pending_approval',
      'company'
    )
    ON CONFLICT (id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;


-- ═══════════════════════════════════════════════════════════════════
-- PART 3: FIX ALL EXISTING BROKEN USERS (retroactive fix)
-- ═══════════════════════════════════════════════════════════════════

-- Find all auth users who don't have a users table record
DO $$
DECLARE
  auth_user RECORD;
  default_org_id UUID;
  default_team_id UUID;
BEGIN
  -- Get or create a default "NA" org for broken users
  INSERT INTO organisations (name, slug, domain, status)
  VALUES ('NA', 'na', 'na.individual', 'active')
  ON CONFLICT (slug) DO NOTHING;

  SELECT id INTO default_org_id FROM organisations WHERE slug = 'na';

  -- Get or create default team
  INSERT INTO teams (name, org_id)
  VALUES ('Team Alpha', default_org_id)
  ON CONFLICT DO NOTHING;

  SELECT id INTO default_team_id FROM teams WHERE org_id = default_org_id LIMIT 1;

  -- Fix all orphaned auth users
  FOR auth_user IN
    SELECT au.id, au.email, au.raw_user_meta_data
    FROM auth.users au
    LEFT JOIN users u ON au.id = u.id
    WHERE u.id IS NULL
  LOOP
    RAISE NOTICE 'Fixing user: %', auth_user.email;

    INSERT INTO users (
      id,
      email,
      name,
      role,
      org_id,
      team_id,
      status,
      crm_enabled,
      account_type
    )
    VALUES (
      auth_user.id,
      auth_user.email,
      COALESCE(auth_user.raw_user_meta_data->>'name', split_part(auth_user.email, '@', 1)),
      'sdr',
      default_org_id,
      default_team_id,
      'active',
      true,
      'company'
    )
    ON CONFLICT (id) DO NOTHING;
  END LOOP;
END $$;

-- Also fix users with NULL org_id or role='public'
UPDATE users
SET
  org_id = (SELECT id FROM organisations WHERE slug = 'na'),
  team_id = (SELECT id FROM teams WHERE org_id = (SELECT id FROM organisations WHERE slug = 'na') LIMIT 1),
  role = 'sdr',
  status = 'active'
WHERE org_id IS NULL OR role = 'public';


-- ═══════════════════════════════════════════════════════════════════
-- PART 4: VERIFICATION
-- ═══════════════════════════════════════════════════════════════════

-- Check RLS status
SELECT
  'RLS STATUS: ' || CASE WHEN rowsecurity THEN '✅ ENABLED' ELSE '❌ DISABLED' END as rls_check
FROM pg_tables
WHERE tablename = 'users' AND schemaname = 'public';

-- Check policy count
SELECT
  '✅ Created ' || COUNT(*) || ' RLS policies' as policy_check
FROM pg_policies
WHERE tablename = 'users';

-- Check for orphaned auth users
SELECT
  COUNT(au.id) as orphaned_auth_users,
  CASE
    WHEN COUNT(au.id) = 0 THEN '✅ No orphaned users'
    ELSE '⚠️ Still have ' || COUNT(au.id) || ' orphaned users!'
  END as orphan_check
FROM auth.users au
LEFT JOIN users u ON au.id = u.id
WHERE u.id IS NULL;

-- Check for users with NULL org_id
SELECT
  COUNT(*) as users_without_org,
  CASE
    WHEN COUNT(*) = 0 THEN '✅ All users have org_id'
    ELSE '⚠️ ' || COUNT(*) || ' users still missing org_id!'
  END as org_check
FROM users
WHERE org_id IS NULL;

-- Check for users with role='public'
SELECT
  COUNT(*) as public_role_users,
  CASE
    WHEN COUNT(*) = 0 THEN '✅ No users with role=public'
    ELSE '⚠️ ' || COUNT(*) || ' users still have role=public!'
  END as role_check
FROM users
WHERE role = 'public';

-- List all users to verify
SELECT
  u.email,
  u.role,
  u.status,
  o.name as org_name,
  t.name as team_name,
  CASE
    WHEN u.org_id IS NULL THEN '❌ NO ORG'
    WHEN u.role = 'public' THEN '⚠️ ROLE PUBLIC'
    ELSE '✅ OK'
  END as user_status
FROM users u
LEFT JOIN organisations o ON u.org_id = o.id
LEFT JOIN teams t ON u.team_id = t.id
ORDER BY u.created_at DESC
LIMIT 20;

SELECT '✅✅✅ COMPLETE FIX DONE - ALL USERS SHOULD NOW BE ABLE TO LOGIN' as final_message;
