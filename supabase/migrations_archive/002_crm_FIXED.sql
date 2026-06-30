-- ============================================================
-- IGNITE_APEX — Migration 002: CRM Tables (FIXED)
-- ============================================================

-- ══════════════════════════════════════════════════════════════
-- STEP 1: Clean up any partial CRM tables
-- ══════════════════════════════════════════════════════════════

DROP TABLE IF EXISTS public.deal_timeline CASCADE;
DROP TABLE IF EXISTS public.tasks CASCADE;
DROP TABLE IF EXISTS public.activities CASCADE;
DROP TABLE IF EXISTS public.leads CASCADE;


-- ══════════════════════════════════════════════════════════════
-- STEP 2: Add missing columns to DEALS table first
-- ══════════════════════════════════════════════════════════════

-- Add org_id if it doesn't exist (needed for RLS policies)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'deals'
    AND column_name = 'org_id'
  ) THEN
    ALTER TABLE public.deals ADD COLUMN org_id UUID REFERENCES public.organisations(id) ON DELETE CASCADE;

    -- Populate org_id from user's org_id
    UPDATE public.deals d
    SET org_id = u.org_id
    FROM public.users u
    WHERE d.user_id = u.id;

    -- Make it NOT NULL after populating
    ALTER TABLE public.deals ALTER COLUMN org_id SET NOT NULL;

    -- Add index
    CREATE INDEX idx_deals_org ON public.deals(org_id);
  END IF;
END $$;

-- Add CRM tracking columns
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS converted_from_lead_id UUID;
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS sql_date TIMESTAMPTZ;
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS last_activity_date TIMESTAMPTZ;
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS next_task_date TIMESTAMPTZ;


-- ══════════════════════════════════════════════════════════════
-- STEP 3: Create LEADS table
-- ══════════════════════════════════════════════════════════════

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
  lead_score      INT         CHECK (lead_score >= 0 AND lead_score <= 100),
  budget_range    TEXT,
  referral_source TEXT,

  -- IGNITE stage progression
  ignite_stage    TEXT        CHECK (ignite_stage IN ('I1','G','N','I2','T','E')),
  stage_progress  JSONB,

  -- T1 Demand Gate qualification
  t1_score        INT         DEFAULT 0,
  t1_passed       BOOLEAN     DEFAULT false,
  t1_details      JSONB,

  -- Lead status lifecycle
  status          TEXT        DEFAULT 'open' CHECK (status IN ('open','working','nurture','mql','disqualified','converted')),
  disqualified_reason TEXT,
  converted_to_opportunity_id UUID,
  converted_at    TIMESTAMPTZ,

  -- Activity tracking
  last_activity_date TIMESTAMPTZ,
  next_task_date     TIMESTAMPTZ,

  -- Metadata
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_leads_org_owner  ON public.leads (org_id, owner_id);
CREATE INDEX idx_leads_status     ON public.leads (status);
CREATE INDEX idx_leads_updated    ON public.leads (updated_at DESC);


-- ══════════════════════════════════════════════════════════════
-- STEP 4: Create ACTIVITIES table
-- ══════════════════════════════════════════════════════════════

CREATE TABLE public.activities (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          UUID        NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  owner_id        UUID        NOT NULL REFERENCES public.users(id),

  activity_type   TEXT        NOT NULL CHECK (activity_type IN ('call','email','meeting','demo','proposal','linkedin','note','system_event')),

  lead_id         UUID        REFERENCES public.leads(id) ON DELETE CASCADE,
  deal_id         UUID        REFERENCES public.deals(id) ON DELETE CASCADE,

  subject         TEXT        NOT NULL,
  description     TEXT,
  outcome         TEXT,
  duration_mins   INT,
  participants    JSONB,

  activity_date   TIMESTAMPTZ NOT NULL DEFAULT now(),
  auto_logged     BOOLEAN     DEFAULT false,

  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_activities_org   ON public.activities (org_id);
CREATE INDEX idx_activities_lead  ON public.activities (lead_id) WHERE lead_id IS NOT NULL;
CREATE INDEX idx_activities_deal  ON public.activities (deal_id) WHERE deal_id IS NOT NULL;
CREATE INDEX idx_activities_date  ON public.activities (activity_date DESC);


-- ══════════════════════════════════════════════════════════════
-- STEP 5: Create TASKS table
-- ══════════════════════════════════════════════════════════════

CREATE TABLE public.tasks (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          UUID        NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  owner_id        UUID        NOT NULL REFERENCES public.users(id),
  assigned_to_id  UUID        REFERENCES public.users(id),

  subject         TEXT        NOT NULL,
  description     TEXT,
  priority        TEXT        DEFAULT 'normal' CHECK (priority IN ('low','normal','high','urgent')),

  lead_id         UUID        REFERENCES public.leads(id) ON DELETE CASCADE,
  deal_id         UUID        REFERENCES public.deals(id) ON DELETE CASCADE,
  activity_id     UUID        REFERENCES public.activities(id) ON DELETE SET NULL,

  status          TEXT        DEFAULT 'pending' CHECK (status IN ('pending','in_progress','completed','cancelled')),

  due_date        TIMESTAMPTZ,
  reminder_date   TIMESTAMPTZ,
  reminder_sent   BOOLEAN     DEFAULT false,
  completed_at    TIMESTAMPTZ,

  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_tasks_assigned   ON public.tasks (assigned_to_id, status);
CREATE INDEX idx_tasks_due        ON public.tasks (due_date) WHERE status NOT IN ('completed', 'cancelled');


-- ══════════════════════════════════════════════════════════════
-- STEP 6: Create DEAL_TIMELINE table
-- ══════════════════════════════════════════════════════════════

CREATE TABLE public.deal_timeline (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id         UUID        NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  user_id         UUID        REFERENCES public.users(id),

  event_type      TEXT        NOT NULL CHECK (event_type IN ('created','stage_change','verdict_change','activity_logged','task_created','note_added','field_updated','converted_from_lead')),

  event_data      JSONB,
  description     TEXT,

  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_timeline_deal  ON public.deal_timeline (deal_id, created_at DESC);


-- ══════════════════════════════════════════════════════════════
-- STEP 7: Add foreign key from leads to deals (now that both exist)
-- ══════════════════════════════════════════════════════════════

ALTER TABLE public.leads ADD CONSTRAINT leads_converted_fk
  FOREIGN KEY (converted_to_opportunity_id) REFERENCES public.deals(id);

ALTER TABLE public.deals ADD CONSTRAINT deals_lead_fk
  FOREIGN KEY (converted_from_lead_id) REFERENCES public.leads(id) ON DELETE SET NULL;


-- ══════════════════════════════════════════════════════════════
-- STEP 8: Enable RLS and create policies
-- ══════════════════════════════════════════════════════════════

-- LEADS RLS
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY leads_select ON public.leads
  FOR SELECT USING (
    org_id = my_org_id() AND
    (my_role() IN ('admin', 'manager') OR owner_id = auth.uid())
  );

CREATE POLICY leads_insert ON public.leads
  FOR INSERT WITH CHECK (org_id = my_org_id() AND owner_id = auth.uid());

CREATE POLICY leads_update ON public.leads
  FOR UPDATE USING (
    org_id = my_org_id() AND
    (my_role() IN ('admin', 'manager') OR owner_id = auth.uid())
  );

CREATE POLICY leads_delete ON public.leads
  FOR DELETE USING (org_id = my_org_id() AND my_role() = 'admin');


-- ACTIVITIES RLS
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY activities_select ON public.activities
  FOR SELECT USING (
    org_id = my_org_id() AND
    (my_role() IN ('admin', 'manager') OR owner_id = auth.uid())
  );

CREATE POLICY activities_insert ON public.activities
  FOR INSERT WITH CHECK (org_id = my_org_id() AND owner_id = auth.uid());

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


-- TASKS RLS
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY tasks_select ON public.tasks
  FOR SELECT USING (
    org_id = my_org_id() AND
    (my_role() IN ('admin', 'manager') OR owner_id = auth.uid() OR assigned_to_id = auth.uid())
  );

CREATE POLICY tasks_insert ON public.tasks
  FOR INSERT WITH CHECK (org_id = my_org_id() AND owner_id = auth.uid());

CREATE POLICY tasks_update ON public.tasks
  FOR UPDATE USING (
    org_id = my_org_id() AND
    (my_role() IN ('admin', 'manager') OR owner_id = auth.uid() OR assigned_to_id = auth.uid())
  );

CREATE POLICY tasks_delete ON public.tasks
  FOR DELETE USING (org_id = my_org_id() AND (my_role() = 'admin' OR owner_id = auth.uid()));


-- DEAL_TIMELINE RLS
ALTER TABLE public.deal_timeline ENABLE ROW LEVEL SECURITY;

CREATE POLICY timeline_select ON public.deal_timeline
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.deals
      WHERE deals.id = deal_timeline.deal_id
        AND deals.org_id = my_org_id()
        AND (my_role() IN ('admin', 'manager') OR deals.user_id = auth.uid())
    )
  );

CREATE POLICY timeline_insert ON public.deal_timeline
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.deals
      WHERE deals.id = deal_timeline.deal_id AND deals.org_id = my_org_id()
    )
  );


-- ══════════════════════════════════════════════════════════════
-- STEP 9: Create triggers for auto-timestamps
-- ══════════════════════════════════════════════════════════════

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
