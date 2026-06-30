-- 020_user_management_access.sql
-- Enhanced user management with registration invites and access control

-- Add user invitation tracking fields
DO $$
BEGIN
  -- Invitation fields
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'invited_by') THEN
    ALTER TABLE public.users ADD COLUMN invited_by UUID REFERENCES public.users(id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'invited_at') THEN
    ALTER TABLE public.users ADD COLUMN invited_at TIMESTAMPTZ;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'invitation_accepted_at') THEN
    ALTER TABLE public.users ADD COLUMN invitation_accepted_at TIMESTAMPTZ;
  END IF;

  -- Access control
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'last_login_at') THEN
    ALTER TABLE public.users ADD COLUMN last_login_at TIMESTAMPTZ;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'login_count') THEN
    ALTER TABLE public.users ADD COLUMN login_count INTEGER DEFAULT 0;
  END IF;

  -- Subscription/license fields
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'license_type') THEN
    ALTER TABLE public.users ADD COLUMN license_type TEXT DEFAULT 'free';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'license_expires_at') THEN
    ALTER TABLE public.users ADD COLUMN license_expires_at TIMESTAMPTZ;
  END IF;
END $$;

-- Create user_invitations table for tracking pending invites
CREATE TABLE IF NOT EXISTS public.user_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL,
  crm_enabled BOOLEAN DEFAULT false,
  invited_by UUID REFERENCES public.users(id),
  invitation_token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create license_types enum
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'license_type') THEN
    CREATE TYPE license_type AS ENUM ('free', 'professional', 'enterprise');
  END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_users_license_type ON public.users(license_type);
CREATE INDEX IF NOT EXISTS idx_users_invited_by ON public.users(invited_by);
CREATE INDEX IF NOT EXISTS idx_user_invitations_token ON public.user_invitations(invitation_token);
CREATE INDEX IF NOT EXISTS idx_user_invitations_email ON public.user_invitations(email);
CREATE INDEX IF NOT EXISTS idx_user_invitations_org ON public.user_invitations(org_id);

-- RLS policies for user_invitations
ALTER TABLE public.user_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their org's invitations"
  ON public.user_invitations FOR SELECT
  USING (org_id = (SELECT app_org()));

CREATE POLICY "Admins can manage invitations"
  ON public.user_invitations FOR ALL
  USING (
    org_id = (SELECT app_org()) AND
    (SELECT app_role()) IN ('super_duper_admin', 'super_admin', 'admin', 'admin_m')
  );

-- Function to generate invitation token
CREATE OR REPLACE FUNCTION generate_invitation_token()
RETURNS TEXT AS $$
BEGIN
  RETURN encode(gen_random_bytes(32), 'base64');
END;
$$ LANGUAGE plpgsql;

-- Function to check if user can access CRM
CREATE OR REPLACE FUNCTION can_access_crm(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  user_crm_enabled BOOLEAN;
  user_license TEXT;
BEGIN
  SELECT crm_enabled, license_type INTO user_crm_enabled, user_license
  FROM public.users
  WHERE id = user_id;

  -- Free users with crm_enabled=false can only use Sales OS
  -- Professional/Enterprise users can use both
  RETURN user_crm_enabled = true OR user_license IN ('professional', 'enterprise');
END;
$$ LANGUAGE plpgsql;

-- Update user activity (call on login)
CREATE OR REPLACE FUNCTION update_user_login(user_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.users
  SET
    last_login_at = now(),
    login_count = COALESCE(login_count, 0) + 1
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE public.user_invitations IS 'Pending user invitations with tokens for email verification';
COMMENT ON COLUMN public.users.license_type IS 'User license: free (Sales OS only), professional (Sales OS + CRM), enterprise (all features)';
COMMENT ON COLUMN public.users.invited_by IS 'User who sent the invitation';
COMMENT ON FUNCTION can_access_crm(UUID) IS 'Check if user has CRM access based on license and crm_enabled flag';
