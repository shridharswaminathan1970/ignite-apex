-- Fix registration flow to work for ALL users
-- Problem: approve_individual_registration creates org but NOT user record
-- Solution: Update function to also create user in users table

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

  -- Create organization with slug
  INSERT INTO organisations (name, slug, domain, status)
  VALUES (
    'NA',
    LOWER(REPLACE(req.email, '@', '_at_')) || '_individual',  -- Unique slug
    LOWER(REPLACE(req.email, '@', '_at_')) || '.individual',
    'active'
  )
  RETURNING id INTO org_uuid;

  -- Create default team
  INSERT INTO teams (name, org_id)
  VALUES ('Team Alpha', org_uuid)
  RETURNING id INTO team_uuid;

  -- Create auth user (this triggers handle_new_auth_user, but it won't create users record without metadata)
  -- So we'll create the users record manually below

  -- Check if auth user already exists (user may have signed up but not been approved)
  SELECT id INTO auth_user_id FROM auth.users WHERE email = req.email;

  IF auth_user_id IS NULL THEN
    -- User doesn't exist in auth yet - they registered via form only
    -- We'll need to send them a password-set email
    -- For now, mark request as approved and let admin send invite
    NULL; -- No auth user yet
  ELSE
    -- Auth user exists - create users table record
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
      'sdr',  -- Default role for individual registration
      org_uuid,
      team_uuid,
      'active',
      true,  -- CRM enabled (trial activation happens separately)
      'company'
    )
    ON CONFLICT (id) DO UPDATE SET
      org_id = EXCLUDED.org_id,
      team_id = EXCLUDED.team_id,
      role = EXCLUDED.role,
      status = 'active';
  END IF;

  -- Create subscription record
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
    false,  -- CRM disabled until trial activated
    false
  );

  -- Update request status
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
    'auth_user_exists', (auth_user_id IS NOT NULL),
    'message', 'Registration approved. Send password-set email to user.'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION approve_individual_registration IS 'Approve individual registration - creates org, team, and user record';


-- Also update the trigger to handle users WITHOUT org_id metadata
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if user already exists (from approval process)
  IF EXISTS (SELECT 1 FROM public.users WHERE id = NEW.id) THEN
    -- User record already created by approval process, skip
    RETURN NEW;
  END IF;

  -- If signup has org_id metadata (invited user), create profile
  IF (NEW.raw_user_meta_data ->> 'org_id') IS NOT NULL THEN
    INSERT INTO public.users (id, org_id, email, name, role, status, account_type)
    VALUES (
      NEW.id,
      (NEW.raw_user_meta_data ->> 'org_id')::UUID,
      NEW.email,
      COALESCE(
        NEW.raw_user_meta_data ->> 'name',
        split_part(NEW.email, '@', 1)
      ),
      COALESCE(NEW.raw_user_meta_data ->> 'role', 'sdr'),
      'active',
      'company'
    )
    ON CONFLICT (id) DO NOTHING;
  ELSE
    -- No org_id metadata - this is a public signup
    -- Create placeholder record with role 'public' until approved
    INSERT INTO public.users (id, email, name, role, status, account_type)
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(
        NEW.raw_user_meta_data ->> 'name',
        split_part(NEW.email, '@', 1)
      ),
      'public',  -- Temporary role until approved
      'pending_approval',
      'company'
    )
    ON CONFLICT (id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION handle_new_auth_user IS 'Auto-create user profile on signup - handles invited users and public signups';
