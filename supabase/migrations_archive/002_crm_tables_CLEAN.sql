-- ============================================================
-- IGNITE_APEX — Migration 002: CRM Tables (CLEAN VERSION)
-- Drops existing tables first, then recreates fresh
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================================

-- ══════════════════════════════════════════════════════════════
-- CLEAN SLATE - Drop existing CRM tables if they exist
-- ══════════════════════════════════════════════════════════════

DROP TABLE IF EXISTS public.deal_timeline CASCADE;
DROP TABLE IF EXISTS public.tasks CASCADE;
DROP TABLE IF EXISTS public.activities CASCADE;
DROP TABLE IF EXISTS public.leads CASCADE;

-- Note: We don't drop deals table, just alter it later


-- ══════════════════════════════════════════════════════════════
-- CREATE NEW TABLES
-- ══════════════════════════════════════════════════════════════

-- ── LEADS ─────────────────────────────────────────────────────────────────────
CREATE TABLE public.leads (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          UUID        NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  owner_id        UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  -- Lead contact information
  name            TEXT        NOT NULL,
  company         TEXT,
  title           TEXT,
  email           TEXT,
  phone           TEXT,
  source          TEXT,

  -- Custom fields
  industry        TEXT,
  lead_score      INT,
  budget_range    TEXT,
  referral_source TEXT,

  -- IGNITE stage progression
  ignite_stage    TEXT,
  stage_progress  JSONB,

  -- T1 Demand Gate qualification
  t1_score        INT         DEFAULT 0,
  t1_passed       BOOLEAN     DEFAULT false,
  t1_details      JSONB,

  -- Lead status lifecycle
  status          TEXT        DEFAULT 'open',
  disqualified_reason TEXT,
  converted_to_opportunity_id UUID,
  converted_at    TIMESTAMPTZ,

  -- Activity tracking
  last_activity_date TIMESTAMPTZ,
  next_task_date     TIMESTAMPTZ,

  -- Metadata
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Constraints
  CONSTRAINT leads_ignite_stage_check CHECK (ignite_stage IN ('I1','G','N','I2','T','E')),
  CONSTRAINT leads_status_check CHECK (status IN ('open','working','nurture','mql','disqualified','converted')),
  CONSTRAINT leads_score_check CHECK (lead_score >= 0 AND lead_score <= 100)
);

COMMENT ON TABLE  public.leads              IS 'Lead management — raw contacts through IGNITE methodology to MQL.';
COMMENT ON COLUMN public.leads.ignite_stage IS 'Current IGNITE stage: I1 (Identify) → G (Go Deep) → N (Nail) → I2 (Initiate) → T (Track) → E (Escalate).';
COMMENT ON COLUMN public.leads.status       IS 'open: new lead | working: actively engaging | nurture: long-term follow-up | mql: passed T1, ready to convert | disqualified | converted: became opportunity.';
COMMENT ON COLUMN public.leads.t1_passed    IS 'True when lead scores 4/5 or better on T1 Demand Gate → eligible for MQL status.';

CREATE INDEX idx_leads_org_owner  ON public.leads (org_id, owner_id);
CREATE INDEX idx_leads_status     ON public.leads (status);
CREATE INDEX idx_leads_stage      ON public.leads (ignite_stage) WHERE status NOT IN ('disqualified', 'converted');
CREATE INDEX idx_leads_updated    ON public.leads (updated_at DESC);


-- ── ACTIVITIES ────────────────────────────────────────────────────────────────
CREATE TABLE public.activities (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          UUID        NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  owner_id        UUID        NOT NULL REFERENCES public.users(id),

  -- Activity classification
  activity_type   TEXT        NOT NULL,

  -- Linked records
  lead_id         UUID        REFERENCES public.leads(id) ON DELETE CASCADE,
  deal_id         UUID        REFERENCES public.deals(id) ON DELETE CASCADE,

  -- Activity details
  subject         TEXT        NOT NULL,
  description     TEXT,
  outcome         TEXT,
  duration_mins   INT,

  -- Participants
  participants    JSONB,

  -- Timing
  activity_date   TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Auto-logged vs manual
  auto_logged     BOOLEAN     DEFAULT false,

  -- Metadata
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT activities_type_check CHECK (activity_type IN ('call','email','meeting','demo','proposal','linkedin','note','system_event'))
);

COMMENT ON TABLE  public.activities              IS 'Activity log — calls, emails, meetings, system events for leads and opportunities.';
COMMENT ON COLUMN public.activities.activity_type IS 'call|email|meeting|demo|proposal|linkedin|note|system_event';
COMMENT ON COLUMN public.activities.auto_logged   IS 'True for system-generated activities (stage changes, conversions); false for manual user logs.';

CREATE INDEX idx_activities_org   ON public.activities (org_id);
CREATE INDEX idx_activities_lead  ON public.activities (lead_id) WHERE lead_id IS NOT NULL;
CREATE INDEX idx_activities_deal  ON public.activities (deal_id) WHERE deal_id IS NOT NULL;
CREATE INDEX idx_activities_date  ON public.activities (activity_date DESC);
CREATE INDEX idx_activities_owner ON public.activities (owner_id, activity_date DESC);


-- ── TASKS ─────────────────────────────────────────────────────────────────────
CREATE TABLE public.tasks (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          UUID        NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  owner_id        UUID        NOT NULL REFERENCES public.users(id),
  assigned_to_id  UUID        REFERENCES public.users(id),

  -- Task details
  subject         TEXT        NOT NULL,
  description     TEXT,
  priority        TEXT        DEFAULT 'normal',

  -- Linked records
  lead_id         UUID        REFERENCES public.leads(id) ON DELETE CASCADE,
  deal_id         UUID        REFERENCES public.deals(id) ON DELETE CASCADE,
  activity_id     UUID        REFERENCES public.activities(id) ON DELETE SET NULL,

  -- Task lifecycle
  status          TEXT        DEFAULT 'pending',

  -- Timing
  due_date        TIMESTAMPTZ,
  reminder_date   TIMESTAMPTZ,
  reminder_sent   BOOLEAN     DEFAULT false,
  completed_at    TIMESTAMPTZ,

  -- Metadata
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT tasks_priority_check CHECK (priority IN ('low','normal','high','urgent')),
  CONSTRAINT tasks_status_check CHECK (status IN ('pending','in_progress','completed','cancelled'))
);

COMMENT ON TABLE  public.tasks              IS 'Task management — follow-up actions linked to leads, deals, or standalone.';
COMMENT ON COLUMN public.tasks.assigned_to_id IS 'Who is responsible for completing this task (can differ from owner for delegation).';
COMMENT ON COLUMN public.tasks.reminder_sent  IS 'Prevents duplicate notifications — set to true after first reminder fires.';

CREATE INDEX idx_tasks_assigned   ON public.tasks (assigned_to_id, status);
CREATE INDEX idx_tasks_due        ON public.tasks (due_date) WHERE status NOT IN ('completed', 'cancelled');
CREATE INDEX idx_tasks_reminder   ON public.tasks (reminder_date) WHERE reminder_sent = false AND status = 'pending';
CREATE INDEX idx_tasks_lead       ON public.tasks (lead_id) WHERE lead_id IS NOT NULL;
CREATE INDEX idx_tasks_deal       ON public.tasks (deal_id) WHERE deal_id IS NOT NULL;


-- ── DEAL_TIMELINE ─────────────────────────────────────────────────────────────
CREATE TABLE public.deal_timeline (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id         UUID        NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  user_id         UUID        REFERENCES public.users(id),

  -- Event classification
  event_type      TEXT        NOT NULL,

  -- Event payload
  event_data      JSONB,
  description     TEXT,

  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT timeline_event_check CHECK (event_type IN ('created','stage_change','verdict_change','activity_logged','task_created','note_added','field_updated','converted_from_lead'))
);

COMMENT ON TABLE  public.deal_timeline IS 'Audit trail — all significant events in opportunity lifecycle.';
COMMENT ON COLUMN public.deal_timeline.event_data IS 'JSONB payload with event-specific details for reconstruction/reporting.';

CREATE INDEX idx_timeline_deal  ON public.deal_timeline (deal_id, created_at DESC);
CREATE INDEX idx_timeline_type  ON public.deal_timeline (event_type);


-- ══════════════════════════════════════════════════════════════
-- MODIFY EXISTING DEALS TABLE
-- ══════════════════════════════════════════════════════════════

ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS converted_from_lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL;
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS sql_date TIMESTAMPTZ;
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS last_activity_date TIMESTAMPTZ;
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS next_task_date TIMESTAMPTZ;

COMMENT ON COLUMN public.deals.converted_from_lead_id IS 'Link to original lead record that was converted to this opportunity.';
COMMENT ON COLUMN public.deals.sql_date               IS 'Date when opportunity qualified as SQL (passed T2 7/10 threshold).';
COMMENT ON COLUMN public.deals.last_activity_date     IS 'Most recent activity logged against this opportunity.';
COMMENT ON COLUMN public.deals.next_task_date         IS 'Earliest upcoming task due date for this opportunity.';


-- ══════════════════════════════════════════════════════════════
-- ROW-LEVEL SECURITY (RLS) POLICIES
-- ══════════════════════════════════════════════════════════════

-- ── LEADS RLS ─────────────────────────────────────────────────────────────────
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY leads_select ON public.leads
  FOR SELECT USING (
    org_id = my_org_id() AND
    (my_role() IN ('admin', 'manager') OR owner_id = auth.uid())
  );

CREATE POLICY leads_insert ON public.leads
  FOR INSERT WITH CHECK (
    org_id = my_org_id() AND owner_id = auth.uid()
  );

CREATE POLICY leads_update ON public.leads
  FOR UPDATE USING (
    org_id = my_org_id() AND
    (my_role() IN ('admin', 'manager') OR owner_id = auth.uid())
  );

CREATE POLICY leads_delete ON public.leads
  FOR DELETE USING (
    org_id = my_org_id() AND my_role() = 'admin'
  );


-- ── ACTIVITIES RLS ────────────────────────────────────────────────────────────
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY activities_select ON public.activities
  FOR SELECT USING (
    org_id = my_org_id() AND
    (my_role() IN ('admin', 'manager') OR owner_id = auth.uid())
  );

CREATE POLICY activities_insert ON public.activities
  FOR INSERT WITH CHECK (
    org_id = my_org_id() AND owner_id = auth.uid()
  );

CREATE POLICY activities_update ON public.activities
  FOR UPDATE USING (
    org_id = my_org_id() AND
    (my_role() IN ('admin', 'manager') OR owner_id = auth.uid())
  );

CREATE POLICY activities_delete ON public.activities
  FOR DELETE USING (
    org_id = my_org_id() AND
    (my_role() = 'admin' OR owner_id = auth.uid())
  );


-- ── TASKS RLS ─────────────────────────────────────────────────────────────────
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY tasks_select ON public.tasks
  FOR SELECT USING (
    org_id = my_org_id() AND
    (
      my_role() IN ('admin', 'manager') OR
      owner_id = auth.uid() OR
      assigned_to_id = auth.uid()
    )
  );

CREATE POLICY tasks_insert ON public.tasks
  FOR INSERT WITH CHECK (
    org_id = my_org_id() AND owner_id = auth.uid()
  );

CREATE POLICY tasks_update ON public.tasks
  FOR UPDATE USING (
    org_id = my_org_id() AND
    (
      my_role() IN ('admin', 'manager') OR
      owner_id = auth.uid() OR
      assigned_to_id = auth.uid()
    )
  );

CREATE POLICY tasks_delete ON public.tasks
  FOR DELETE USING (
    org_id = my_org_id() AND
    (my_role() = 'admin' OR owner_id = auth.uid())
  );


-- ── DEAL_TIMELINE RLS ─────────────────────────────────────────────────────────
ALTER TABLE public.deal_timeline ENABLE ROW LEVEL SECURITY;

CREATE POLICY timeline_select ON public.deal_timeline
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.deals
      WHERE deals.id = deal_timeline.deal_id
        AND deals.org_id = my_org_id()
        AND (
          my_role() IN ('admin', 'manager') OR
          deals.user_id = auth.uid()
        )
    )
  );

CREATE POLICY timeline_insert ON public.deal_timeline
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.deals
      WHERE deals.id = deal_timeline.deal_id
        AND deals.org_id = my_org_id()
    )
  );


-- ══════════════════════════════════════════════════════════════
-- TRIGGERS & FUNCTIONS
-- ══════════════════════════════════════════════════════════════

-- Auto-update updated_at timestamps
CREATE OR REPLACE FUNCTION public.trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_timestamp_leads
  BEFORE UPDATE ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_set_timestamp();

CREATE TRIGGER set_timestamp_tasks
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_set_timestamp();


-- ══════════════════════════════════════════════════════════════
-- MIGRATION COMPLETE
-- ══════════════════════════════════════════════════════════════

-- Migration 002 applied successfully
-- Tables created: leads, activities, tasks, deal_timeline
-- RLS policies, indexes, and triggers enabled
