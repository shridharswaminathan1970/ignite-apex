-- Migration 006: User Management Hierarchy
-- Implements proper CRM user management with role hierarchy

-- Add new columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_super_duper_admin BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id);
ALTER TABLE users ADD COLUMN IF NOT EXISTS manager_id UUID REFERENCES users(id);
ALTER TABLE users ADD COLUMN IF NOT EXISTS team_name TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Update role enum to include new roles
-- Role hierarchy: super_duper_admin > company_admin > management > admin > manager > rep
COMMENT ON COLUMN users.role IS 'User role: super_duper_admin, company_admin, management, admin, manager, rep';

-- Create super duper admins (hardcoded platform owners)
-- These users can create company admins
INSERT INTO users (id, email, name, role, is_super_duper_admin, is_active, org_id)
VALUES
  (gen_random_uuid(), 'shaamel@shaamelz.com', 'Shaamel', 'super_duper_admin', true, true, (SELECT id FROM organisations LIMIT 1)),
  (gen_random_uuid(), 'muhammad.shaamel@gmail.com', 'Muhammad Shaamel', 'super_duper_admin', true, true, (SELECT id FROM organisations LIMIT 1))
ON CONFLICT (email) DO UPDATE
SET
  role = 'super_duper_admin',
  is_super_duper_admin = true,
  is_active = true;

-- Create auth users for super duper admins
-- Note: Run this manually in Supabase SQL Editor to set password
DO $$
DECLARE
  shaamel_user_id UUID;
  muhammad_user_id UUID;
BEGIN
  -- Get user IDs
  SELECT id INTO shaamel_user_id FROM users WHERE email = 'shaamel@shaamelz.com';
  SELECT id INTO muhammad_user_id FROM users WHERE email = 'muhammad.shaamel@gmail.com';

  -- Create auth user for shaamel@shaamelz.com
  INSERT INTO auth.users (
    id,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    aud,
    role
  )
  VALUES (
    shaamel_user_id,
    'shaamel@shaamelz.com',
    crypt('ChangeThisPassword123!', gen_salt('bf')), -- Change this password after first login
    now(),
    '{"name": "Shaamel"}'::jsonb,
    now(),
    now(),
    '',
    'authenticated',
    'authenticated'
  )
  ON CONFLICT (id) DO UPDATE SET email_confirmed_at = now();

  -- Create auth user for muhammad.shaamel@gmail.com with specified password
  INSERT INTO auth.users (
    id,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    aud,
    role
  )
  VALUES (
    muhammad_user_id,
    'muhammad.shaamel@gmail.com',
    crypt('r1ngad1ngaR0535!', gen_salt('bf')),
    now(),
    '{"name": "Muhammad Shaamel"}'::jsonb,
    now(),
    now(),
    '',
    'authenticated',
    'authenticated'
  )
  ON CONFLICT (id) DO UPDATE SET email_confirmed_at = now();
END $$;

-- Create user_invitations table for tracking invites sent by admins
CREATE TABLE IF NOT EXISTS user_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  invited_by UUID NOT NULL REFERENCES users(id),
  org_id UUID NOT NULL REFERENCES organisations(id),
  role TEXT NOT NULL,
  team_name TEXT,
  manager_id UUID REFERENCES users(id),
  temp_password TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
  expires_at TIMESTAMPTZ DEFAULT (now() + interval '7 days'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(email, org_id)
);

CREATE INDEX idx_user_invitations_email ON user_invitations(email);
CREATE INDEX idx_user_invitations_status ON user_invitations(status);

-- RLS Policies for user_invitations
ALTER TABLE user_invitations ENABLE ROW LEVEL SECURITY;

-- Super duper admins can see all invitations
CREATE POLICY user_invitations_super_admin_all ON user_invitations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_super_duper_admin = true
    )
  );

-- Company admins can see their org's invitations
CREATE POLICY user_invitations_company_admin ON user_invitations
  FOR ALL USING (
    org_id IN (
      SELECT org_id FROM users
      WHERE id = auth.uid()
      AND role IN ('company_admin', 'management')
    )
  );

-- Update users table RLS for new hierarchy
DROP POLICY IF EXISTS users_select ON users;
DROP POLICY IF EXISTS users_insert ON users;
DROP POLICY IF EXISTS users_update ON users;

-- Super duper admins can see and manage ALL users across all orgs
CREATE POLICY users_super_duper_admin_all ON users
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.is_super_duper_admin = true
    )
  );

-- Company admins can see and manage users in their org
CREATE POLICY users_company_admin_org ON users
  FOR ALL USING (
    org_id IN (
      SELECT org_id FROM users
      WHERE id = auth.uid()
      AND role IN ('company_admin', 'management')
    )
  );

-- Managers can see their team members
CREATE POLICY users_manager_team ON users
  FOR SELECT USING (
    manager_id = auth.uid() OR id = auth.uid()
  );

-- Regular users can see themselves
CREATE POLICY users_self ON users
  FOR SELECT USING (id = auth.uid());

-- Helper function to check if current user can create users
CREATE OR REPLACE FUNCTION can_create_users()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND (is_super_duper_admin = true OR role IN ('company_admin', 'management', 'admin'))
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to get user's role level (for hierarchy checks)
CREATE OR REPLACE FUNCTION get_role_level(user_role TEXT)
RETURNS INT AS $$
BEGIN
  RETURN CASE user_role
    WHEN 'super_duper_admin' THEN 100
    WHEN 'company_admin' THEN 90
    WHEN 'management' THEN 80
    WHEN 'admin' THEN 70
    WHEN 'manager' THEN 60
    WHEN 'rep' THEN 50
    ELSE 0
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON TABLE user_invitations IS 'Tracks user invitations sent by admins';
COMMENT ON COLUMN users.is_super_duper_admin IS 'Platform owner - can create company admins';
COMMENT ON COLUMN users.created_by IS 'Admin who created this user';
COMMENT ON COLUMN users.manager_id IS 'Direct manager (for hierarchy)';
COMMENT ON COLUMN users.team_name IS 'Team/department name';
