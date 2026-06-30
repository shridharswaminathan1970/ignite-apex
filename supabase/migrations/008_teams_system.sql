-- 008_teams_system.sql
-- Add teams table and update users table to include team_id

-- ============================================================================
-- CREATE teams TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  org_id UUID NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- Constraints
  UNIQUE(org_id, name) -- Team names must be unique within an org
);

-- Enable RLS on teams
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

-- RLS Policies for teams
-- SELECT: Anyone in the org can see their org's teams
CREATE POLICY teams_select ON public.teams
  FOR SELECT
  USING (
    app_role() = 'super_duper_admin'
    OR org_id = app_org()
  );

-- INSERT: Only super_duper_admin and super_admin can create teams
CREATE POLICY teams_insert ON public.teams
  FOR INSERT
  WITH CHECK (
    app_role() IN ('super_duper_admin', 'super_admin')
    AND (
      app_role() = 'super_duper_admin'
      OR org_id = app_org()
    )
  );

-- UPDATE: Only super_duper_admin and super_admin can rename teams
CREATE POLICY teams_update ON public.teams
  FOR UPDATE
  USING (
    app_role() IN ('super_duper_admin', 'super_admin')
    AND (
      app_role() = 'super_duper_admin'
      OR org_id = app_org()
    )
  )
  WITH CHECK (
    app_role() IN ('super_duper_admin', 'super_admin')
    AND (
      app_role() = 'super_duper_admin'
      OR org_id = app_org()
    )
  );

-- DELETE: Only super_duper_admin and super_admin can delete teams
CREATE POLICY teams_delete ON public.teams
  FOR DELETE
  USING (
    app_role() IN ('super_duper_admin', 'super_admin')
    AND (
      app_role() = 'super_duper_admin'
      OR org_id = app_org()
    )
  );

-- ============================================================================
-- ADD team_id TO users TABLE
-- ============================================================================

-- Add team_id column to users (nullable for now, will backfill)
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_users_team_id ON public.users(team_id);

-- ============================================================================
-- SEED "Team Alpha" FOR EXISTING ORGANISATIONS
-- ============================================================================

-- For each existing organisation that doesn't have a "Team Alpha", create one
INSERT INTO public.teams (name, org_id)
SELECT 'Team Alpha', o.id
FROM public.organisations o
WHERE NOT EXISTS (
  SELECT 1 FROM public.teams t
  WHERE t.org_id = o.id AND t.name = 'Team Alpha'
)
ON CONFLICT (org_id, name) DO NOTHING;

-- Assign all users without a team to their org's "Team Alpha"
UPDATE public.users u
SET team_id = (
  SELECT t.id
  FROM public.teams t
  WHERE t.org_id = u.org_id
  AND t.name = 'Team Alpha'
  LIMIT 1
)
WHERE u.team_id IS NULL
  AND u.org_id IS NOT NULL;

-- ============================================================================
-- HELPER FUNCTION: Get user's team_id
-- ============================================================================

CREATE OR REPLACE FUNCTION public.app_team()
RETURNS UUID
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT team_id FROM public.users WHERE id = auth.uid();
$$;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE public.teams IS 'Teams within organizations. Default team is "Team Alpha".';
COMMENT ON COLUMN public.teams.name IS 'Team name (unique within org)';
COMMENT ON COLUMN public.teams.org_id IS 'Organisation this team belongs to';
COMMENT ON COLUMN public.users.team_id IS 'Team assignment for this user';
