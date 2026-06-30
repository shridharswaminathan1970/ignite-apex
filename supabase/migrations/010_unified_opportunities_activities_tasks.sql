-- 010_unified_opportunities_activities_tasks.sql
-- Unified data model: Sales OS and CRM share the same opportunities, activities, and tasks

-- ══════════════════════════════════════════════════════════════════════════════
-- OPPORTUNITIES TABLE - ALTER existing table to add IGNITE fields
-- ══════════════════════════════════════════════════════════════════════════════

-- Add columns if they don't exist (safe for re-running migration)

-- Organization & Assignment
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'opportunities' AND column_name = 'org_id') THEN
    ALTER TABLE public.opportunities ADD COLUMN org_id UUID REFERENCES public.organisations(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'opportunities' AND column_name = 'owner_id') THEN
    ALTER TABLE public.opportunities ADD COLUMN owner_id UUID REFERENCES public.users(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'opportunities' AND column_name = 'team_id') THEN
    ALTER TABLE public.opportunities ADD COLUMN team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL;
  END IF;

  -- Basic Information
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'opportunities' AND column_name = 'company_name') THEN
    ALTER TABLE public.opportunities ADD COLUMN company_name TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'opportunities' AND column_name = 'contact_name') THEN
    ALTER TABLE public.opportunities ADD COLUMN contact_name TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'opportunities' AND column_name = 'contact_email') THEN
    ALTER TABLE public.opportunities ADD COLUMN contact_email TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'opportunities' AND column_name = 'contact_phone') THEN
    ALTER TABLE public.opportunities ADD COLUMN contact_phone TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'opportunities' AND column_name = 'contact_title') THEN
    ALTER TABLE public.opportunities ADD COLUMN contact_title TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'opportunities' AND column_name = 'industry') THEN
    ALTER TABLE public.opportunities ADD COLUMN industry TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'opportunities' AND column_name = 'company_size') THEN
    ALTER TABLE public.opportunities ADD COLUMN company_size TEXT;
  END IF;

  -- Financial
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'opportunities' AND column_name = 'estimated_value') THEN
    ALTER TABLE public.opportunities ADD COLUMN estimated_value NUMERIC(12,2);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'opportunities' AND column_name = 'currency') THEN
    ALTER TABLE public.opportunities ADD COLUMN currency TEXT DEFAULT 'USD';
  END IF;

  -- ═══ IGNITE FRAMEWORK FIELDS ═══

  -- 4U Demand Conditions
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'opportunities' AND column_name = 'demand_4u_unworkable') THEN
    ALTER TABLE public.opportunities ADD COLUMN demand_4u_unworkable TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'opportunities' AND column_name = 'demand_4u_unavoidable') THEN
    ALTER TABLE public.opportunities ADD COLUMN demand_4u_unavoidable TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'opportunities' AND column_name = 'demand_4u_urgent') THEN
    ALTER TABLE public.opportunities ADD COLUMN demand_4u_urgent TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'opportunities' AND column_name = 'demand_4u_underserved') THEN
    ALTER TABLE public.opportunities ADD COLUMN demand_4u_underserved TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'opportunities' AND column_name = 'demand_4u_validated') THEN
    ALTER TABLE public.opportunities ADD COLUMN demand_4u_validated BOOLEAN DEFAULT false;
  END IF;

  -- IGNITE Stage Completion
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'opportunities' AND column_name = 'ignite_stage_i_complete') THEN
    ALTER TABLE public.opportunities ADD COLUMN ignite_stage_i_complete BOOLEAN DEFAULT false;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'opportunities' AND column_name = 'ignite_stage_g_complete') THEN
    ALTER TABLE public.opportunities ADD COLUMN ignite_stage_g_complete BOOLEAN DEFAULT false;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'opportunities' AND column_name = 'ignite_stage_n_complete') THEN
    ALTER TABLE public.opportunities ADD COLUMN ignite_stage_n_complete BOOLEAN DEFAULT false;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'opportunities' AND column_name = 'ignite_stage_i2_complete') THEN
    ALTER TABLE public.opportunities ADD COLUMN ignite_stage_i2_complete BOOLEAN DEFAULT false;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'opportunities' AND column_name = 'ignite_stage_t_complete') THEN
    ALTER TABLE public.opportunities ADD COLUMN ignite_stage_t_complete BOOLEAN DEFAULT false;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'opportunities' AND column_name = 'ignite_stage_e_complete') THEN
    ALTER TABLE public.opportunities ADD COLUMN ignite_stage_e_complete BOOLEAN DEFAULT false;
  END IF;

  -- IGNITE Stage Data
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'opportunities' AND column_name = 'ignite_trigger_event') THEN
    ALTER TABLE public.opportunities ADD COLUMN ignite_trigger_event TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'opportunities' AND column_name = 'ignite_strategic_priorities') THEN
    ALTER TABLE public.opportunities ADD COLUMN ignite_strategic_priorities TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'opportunities' AND column_name = 'ignite_individual_research') THEN
    ALTER TABLE public.opportunities ADD COLUMN ignite_individual_research TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'opportunities' AND column_name = 'ignite_competitive_pressure') THEN
    ALTER TABLE public.opportunities ADD COLUMN ignite_competitive_pressure TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'opportunities' AND column_name = 'ignite_reference_outcome') THEN
    ALTER TABLE public.opportunities ADD COLUMN ignite_reference_outcome TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'opportunities' AND column_name = 'ignite_reframe_opener') THEN
    ALTER TABLE public.opportunities ADD COLUMN ignite_reframe_opener TEXT;
  END IF;

  -- Current IGNITE Stage
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'opportunities' AND column_name = 'ignite_current_stage') THEN
    ALTER TABLE public.opportunities ADD COLUMN ignite_current_stage TEXT DEFAULT 'I';
  END IF;

  -- PROBE Qualification
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'opportunities' AND column_name = 'probe_tier') THEN
    ALTER TABLE public.opportunities ADD COLUMN probe_tier TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'opportunities' AND column_name = 'probe_t1_score') THEN
    ALTER TABLE public.opportunities ADD COLUMN probe_t1_score INTEGER DEFAULT 0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'opportunities' AND column_name = 'probe_t2_score') THEN
    ALTER TABLE public.opportunities ADD COLUMN probe_t2_score INTEGER DEFAULT 0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'opportunities' AND column_name = 'probe_t3_score') THEN
    ALTER TABLE public.opportunities ADD COLUMN probe_t3_score INTEGER DEFAULT 0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'opportunities' AND column_name = 'probe_t1_passed') THEN
    ALTER TABLE public.opportunities ADD COLUMN probe_t1_passed BOOLEAN DEFAULT false;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'opportunities' AND column_name = 'probe_t2_passed') THEN
    ALTER TABLE public.opportunities ADD COLUMN probe_t2_passed BOOLEAN DEFAULT false;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'opportunities' AND column_name = 'probe_t3_passed') THEN
    ALTER TABLE public.opportunities ADD COLUMN probe_t3_passed BOOLEAN DEFAULT false;
  END IF;

  -- ═══ TRADITIONAL CRM FIELDS ═══

  -- Pipeline Stage
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'opportunities' AND column_name = 'pipeline_stage') THEN
    ALTER TABLE public.opportunities ADD COLUMN pipeline_stage TEXT DEFAULT 'Lead';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'opportunities' AND column_name = 'pipeline_status') THEN
    ALTER TABLE public.opportunities ADD COLUMN pipeline_status TEXT DEFAULT 'Open';
  END IF;

  -- Forecasting
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'opportunities' AND column_name = 'probability') THEN
    ALTER TABLE public.opportunities ADD COLUMN probability INTEGER DEFAULT 0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'opportunities' AND column_name = 'expected_close_date') THEN
    ALTER TABLE public.opportunities ADD COLUMN expected_close_date DATE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'opportunities' AND column_name = 'actual_close_date') THEN
    ALTER TABLE public.opportunities ADD COLUMN actual_close_date DATE;
  END IF;

  -- Loss/Win tracking
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'opportunities' AND column_name = 'close_reason') THEN
    ALTER TABLE public.opportunities ADD COLUMN close_reason TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'opportunities' AND column_name = 'competitor') THEN
    ALTER TABLE public.opportunities ADD COLUMN competitor TEXT;
  END IF;

  -- Methodology Choice
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'opportunities' AND column_name = 'methodology') THEN
    ALTER TABLE public.opportunities ADD COLUMN methodology TEXT DEFAULT 'IGNITE';
  END IF;

  -- Metadata
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'opportunities' AND column_name = 'source') THEN
    ALTER TABLE public.opportunities ADD COLUMN source TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'opportunities' AND column_name = 'tags') THEN
    ALTER TABLE public.opportunities ADD COLUMN tags TEXT[];
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'opportunities' AND column_name = 'notes') THEN
    ALTER TABLE public.opportunities ADD COLUMN notes TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'opportunities' AND column_name = 'created_by') THEN
    ALTER TABLE public.opportunities ADD COLUMN created_by UUID REFERENCES public.users(id);
  END IF;
END $$;

-- Create indexes (IF NOT EXISTS supported in Postgres 9.5+)
CREATE INDEX IF NOT EXISTS idx_opportunities_org ON public.opportunities(org_id);
CREATE INDEX IF NOT EXISTS idx_opportunities_owner ON public.opportunities(owner_id);
CREATE INDEX IF NOT EXISTS idx_opportunities_team ON public.opportunities(team_id);
CREATE INDEX IF NOT EXISTS idx_opportunities_pipeline_stage ON public.opportunities(pipeline_stage);
CREATE INDEX IF NOT EXISTS idx_opportunities_ignite_stage ON public.opportunities(ignite_current_stage);
CREATE INDEX IF NOT EXISTS idx_opportunities_status ON public.opportunities(pipeline_status);
CREATE INDEX IF NOT EXISTS idx_opportunities_close_date ON public.opportunities(expected_close_date);

-- Auto-update updated_at timestamp (create function if doesn't exist)
CREATE OR REPLACE FUNCTION update_opportunities_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop and recreate trigger to ensure it's correct
DROP TRIGGER IF EXISTS opportunities_updated_at ON public.opportunities;
CREATE TRIGGER opportunities_updated_at
  BEFORE UPDATE ON public.opportunities
  FOR EACH ROW
  EXECUTE FUNCTION update_opportunities_updated_at();

-- ══════════════════════════════════════════════════════════════════════════════
-- ACTIVITIES TABLE - DROP and recreate to ensure correct schema
-- ══════════════════════════════════════════════════════════════════════════════

-- Drop and recreate activities table (safe since it's new)
DROP TABLE IF EXISTS public.activities CASCADE;

CREATE TABLE public.activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  opportunity_id UUID REFERENCES public.opportunities(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('call', 'email', 'meeting', 'note', 'document', 'ignite_diagnostic')),
  subject TEXT,
  description TEXT,
  outcome TEXT,
  activity_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  duration_minutes INTEGER,
  contact_name TEXT,
  contact_email TEXT,
  attendees TEXT[],
  created_by UUID NOT NULL REFERENCES public.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_activities_org ON public.activities(org_id);
CREATE INDEX idx_activities_opportunity ON public.activities(opportunity_id);
CREATE INDEX idx_activities_created_by ON public.activities(created_by);
CREATE INDEX idx_activities_date ON public.activities(activity_date DESC);
CREATE INDEX idx_activities_type ON public.activities(type);

-- ══════════════════════════════════════════════════════════════════════════════
-- TASKS TABLE - DROP and recreate to ensure correct schema
-- ══════════════════════════════════════════════════════════════════════════════

DROP TABLE IF EXISTS public.tasks CASCADE;

CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  opportunity_id UUID REFERENCES public.opportunities(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('call', 'email', 'meeting', 'follow_up', 'proposal', 'demo', 'other')),
  subject TEXT NOT NULL,
  description TEXT,
  due_date DATE,
  due_time TIME,
  reminder_minutes INTEGER,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
  status TEXT DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed', 'cancelled')),
  assigned_to UUID NOT NULL REFERENCES public.users(id),
  created_by UUID NOT NULL REFERENCES public.users(id),
  is_recurring BOOLEAN DEFAULT false,
  recurrence_pattern TEXT,
  recurrence_interval INTEGER DEFAULT 1,
  completed_at TIMESTAMPTZ,
  completed_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_tasks_org ON public.tasks(org_id);
CREATE INDEX idx_tasks_opportunity ON public.tasks(opportunity_id);
CREATE INDEX idx_tasks_assigned_to ON public.tasks(assigned_to);
CREATE INDEX idx_tasks_created_by ON public.tasks(created_by);
CREATE INDEX idx_tasks_due_date ON public.tasks(due_date);
CREATE INDEX idx_tasks_status ON public.tasks(status);
CREATE INDEX idx_tasks_priority ON public.tasks(priority);

-- Auto-update updated_at
DROP TRIGGER IF EXISTS tasks_updated_at ON public.tasks;
CREATE TRIGGER tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_opportunities_updated_at();

-- ══════════════════════════════════════════════════════════════════════════════
-- OPPORTUNITIES TABLE - Add IGNITE fields to existing table
-- ══════════════════════════════════════════════════════════════════════════════

DO $$
BEGIN
  -- Create table if doesn't exist (with bare minimum for first creation)
  CREATE TABLE IF NOT EXISTS public.opportunities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
    owner_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
  );

  -- Add columns if they don't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'activities' AND column_name = 'opportunity_id') THEN
    ALTER TABLE public.activities ADD COLUMN opportunity_id UUID REFERENCES public.opportunities(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'activities' AND column_name = 'subject') THEN
    ALTER TABLE public.activities ADD COLUMN subject TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'activities' AND column_name = 'description') THEN
    ALTER TABLE public.activities ADD COLUMN description TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'activities' AND column_name = 'outcome') THEN
    ALTER TABLE public.activities ADD COLUMN outcome TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'activities' AND column_name = 'activity_date') THEN
    ALTER TABLE public.activities ADD COLUMN activity_date TIMESTAMPTZ NOT NULL DEFAULT now();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'activities' AND column_name = 'duration_minutes') THEN
    ALTER TABLE public.activities ADD COLUMN duration_minutes INTEGER;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'activities' AND column_name = 'contact_name') THEN
    ALTER TABLE public.activities ADD COLUMN contact_name TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'activities' AND column_name = 'contact_email') THEN
    ALTER TABLE public.activities ADD COLUMN contact_email TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'activities' AND column_name = 'attendees') THEN
    ALTER TABLE public.activities ADD COLUMN attendees TEXT[];
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'activities' AND column_name = 'created_by') THEN
    ALTER TABLE public.activities ADD COLUMN created_by UUID REFERENCES public.users(id);
  END IF;

  -- Create indexes (need to check if columns exist first)
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'activities' AND column_name = 'created_by') THEN
    CREATE INDEX IF NOT EXISTS idx_activities_created_by ON public.activities(created_by);
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'activities' AND column_name = 'opportunity_id') THEN
    CREATE INDEX IF NOT EXISTS idx_activities_opportunity ON public.activities(opportunity_id);
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'activities' AND column_name = 'activity_date') THEN
    CREATE INDEX IF NOT EXISTS idx_activities_date ON public.activities(activity_date DESC);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_activities_org ON public.activities(org_id);
CREATE INDEX IF NOT EXISTS idx_activities_type ON public.activities(type);

-- ══════════════════════════════════════════════════════════════════════════════
-- TASKS TABLE - ALTER existing table to add missing columns
-- ══════════════════════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY
-- ══════════════════════════════════════════════════════════════════════════════

ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS opportunities_select ON public.opportunities;
DROP POLICY IF EXISTS opportunities_insert ON public.opportunities;
DROP POLICY IF EXISTS opportunities_update ON public.opportunities;
DROP POLICY IF EXISTS opportunities_delete ON public.opportunities;

DROP POLICY IF EXISTS activities_select ON public.activities;
DROP POLICY IF EXISTS activities_insert ON public.activities;
DROP POLICY IF EXISTS activities_update ON public.activities;
DROP POLICY IF EXISTS activities_delete ON public.activities;

DROP POLICY IF EXISTS tasks_select ON public.tasks;
DROP POLICY IF EXISTS tasks_insert ON public.tasks;
DROP POLICY IF EXISTS tasks_update ON public.tasks;
DROP POLICY IF EXISTS tasks_delete ON public.tasks;

-- ═══ OPPORTUNITIES POLICIES ═══

CREATE POLICY opportunities_select ON public.opportunities
  FOR SELECT
  USING (
    app_role() = 'super_duper_admin'
    OR org_id = app_org()
  );

CREATE POLICY opportunities_insert ON public.opportunities
  FOR INSERT
  WITH CHECK (
    app_role() = 'super_duper_admin'
    OR (
      org_id = app_org()
      AND app_role() IN ('super_admin', 'admin', 'sdr', 'account_executive')
    )
  );

CREATE POLICY opportunities_update ON public.opportunities
  FOR UPDATE
  USING (
    app_role() = 'super_duper_admin'
    OR (org_id = app_org() AND app_role() = 'super_admin')
    OR (org_id = app_org() AND app_role() IN ('admin', 'sdr') AND app_manages(owner_id))
    OR (org_id = app_org() AND owner_id = auth.uid())
  )
  WITH CHECK (
    app_role() = 'super_duper_admin'
    OR (org_id = app_org() AND app_role() = 'super_admin')
    OR (org_id = app_org() AND app_role() IN ('admin', 'sdr') AND app_manages(owner_id))
    OR (org_id = app_org() AND owner_id = auth.uid())
  );

CREATE POLICY opportunities_delete ON public.opportunities
  FOR DELETE
  USING (
    app_role() = 'super_duper_admin'
    OR (org_id = app_org() AND app_role() = 'super_admin')
    OR (org_id = app_org() AND app_role() = 'admin')
    OR (org_id = app_org() AND owner_id = auth.uid())
  );

-- ═══ ACTIVITIES POLICIES ═══

CREATE POLICY activities_select ON public.activities
  FOR SELECT
  USING (
    app_role() = 'super_duper_admin'
    OR org_id = app_org()
  );

CREATE POLICY activities_insert ON public.activities
  FOR INSERT
  WITH CHECK (
    app_role() = 'super_duper_admin'
    OR (
      org_id = app_org()
      AND created_by = auth.uid()
    )
  );

CREATE POLICY activities_update ON public.activities
  FOR UPDATE
  USING (
    app_role() = 'super_duper_admin'
    OR (org_id = app_org() AND created_by = auth.uid())
    OR (org_id = app_org() AND app_role() IN ('super_admin', 'admin'))
  );

CREATE POLICY activities_delete ON public.activities
  FOR DELETE
  USING (
    app_role() = 'super_duper_admin'
    OR (org_id = app_org() AND created_by = auth.uid())
    OR (org_id = app_org() AND app_role() IN ('super_admin', 'admin'))
  );

-- ═══ TASKS POLICIES ═══

CREATE POLICY tasks_select ON public.tasks
  FOR SELECT
  USING (
    app_role() = 'super_duper_admin'
    OR org_id = app_org()
  );

CREATE POLICY tasks_insert ON public.tasks
  FOR INSERT
  WITH CHECK (
    app_role() = 'super_duper_admin'
    OR (
      org_id = app_org()
      AND created_by = auth.uid()
    )
  );

CREATE POLICY tasks_update ON public.tasks
  FOR UPDATE
  USING (
    app_role() = 'super_duper_admin'
    OR (org_id = app_org() AND app_role() = 'super_admin')
    OR (org_id = app_org() AND (assigned_to = auth.uid() OR created_by = auth.uid()))
    OR (org_id = app_org() AND app_role() IN ('admin', 'sdr') AND app_manages(assigned_to))
  )
  WITH CHECK (
    app_role() = 'super_duper_admin'
    OR (org_id = app_org() AND app_role() = 'super_admin')
    OR (org_id = app_org() AND (assigned_to = auth.uid() OR created_by = auth.uid()))
    OR (org_id = app_org() AND app_role() IN ('admin', 'sdr') AND app_manages(assigned_to))
  );

CREATE POLICY tasks_delete ON public.tasks
  FOR DELETE
  USING (
    app_role() = 'super_duper_admin'
    OR (org_id = app_org() AND app_role() = 'super_admin')
    OR (org_id = app_org() AND (assigned_to = auth.uid() OR created_by = auth.uid()))
    OR (org_id = app_org() AND app_role() = 'admin')
  );

-- ══════════════════════════════════════════════════════════════════════════════
-- COMMENTS
-- ══════════════════════════════════════════════════════════════════════════════

COMMENT ON TABLE public.opportunities IS 'Unified opportunities table - shared by Sales OS and CRM. Supports both IGNITE framework and traditional pipeline.';
COMMENT ON TABLE public.activities IS 'Activity log - past actions (calls, emails, meetings, notes).';
COMMENT ON TABLE public.tasks IS 'Task tracking - future scheduled actions with due dates and assignments.';
