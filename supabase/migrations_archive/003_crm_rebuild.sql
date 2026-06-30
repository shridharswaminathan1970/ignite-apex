-- ============================================================
-- IGNITE_APEX CRM — Complete Rebuild
-- Drop old CRM tables and create new schema
-- Lead → Contact/Account → Opportunity → Cement
-- ============================================================

-- DROP OLD CRM TABLES
DROP TABLE IF EXISTS public.deal_timeline CASCADE;
DROP TABLE IF EXISTS public.tasks CASCADE;
DROP TABLE IF EXISTS public.activities CASCADE;
DROP TABLE IF EXISTS public.leads CASCADE;

-- ACCOUNTS (companies)
CREATE TABLE IF NOT EXISTS public.accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES public.organisations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  industry TEXT,
  website TEXT,
  country TEXT,
  city TEXT,
  employee_count TEXT,
  annual_revenue TEXT,
  account_owner_id UUID REFERENCES public.users(id),
  account_owner_name TEXT,
  source TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- CONTACTS (people)
CREATE TABLE IF NOT EXISTS public.contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES public.organisations(id) ON DELETE CASCADE,
  account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
  first_name TEXT NOT NULL,
  last_name TEXT,
  email TEXT,
  phone TEXT,
  whatsapp TEXT,
  title TEXT,
  department TEXT,
  linkedin_url TEXT,
  contact_owner_id UUID REFERENCES public.users(id),
  contact_owner_name TEXT,
  converted_from_lead_id UUID,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- LEADS (raw suspects before qualification)
CREATE TABLE IF NOT EXISTS public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES public.organisations(id) ON DELETE CASCADE,

  -- Basic info
  first_name TEXT NOT NULL,
  last_name TEXT,
  email TEXT,
  phone TEXT,
  whatsapp TEXT,
  title TEXT,
  company TEXT,
  industry TEXT,
  country TEXT,
  website TEXT,
  source TEXT,

  -- Status
  status TEXT DEFAULT 'new' CHECK (status IN (
    'new','contacted','in_diagnostic','mql','disqualified','converted'
  )),

  -- IGNITE diagnostic scores
  ignite_i1 TEXT CHECK (ignite_i1 IN ('yes','no','partial')),
  ignite_g  TEXT CHECK (ignite_g  IN ('yes','no','partial')),
  ignite_n  TEXT CHECK (ignite_n  IN ('yes','no','partial')),
  ignite_i2 TEXT CHECK (ignite_i2 IN ('yes','no','partial')),
  ignite_t  TEXT CHECK (ignite_t  IN ('yes','no','partial')),
  ignite_e  TEXT CHECK (ignite_e  IN ('yes','no','partial')),
  ignite_score INTEGER GENERATED ALWAYS AS (
    (CASE WHEN ignite_i1='yes' THEN 1 ELSE 0 END) +
    (CASE WHEN ignite_g ='yes' THEN 1 ELSE 0 END) +
    (CASE WHEN ignite_n ='yes' THEN 1 ELSE 0 END) +
    (CASE WHEN ignite_i2='yes' THEN 1 ELSE 0 END) +
    (CASE WHEN ignite_t ='yes' THEN 1 ELSE 0 END) +
    (CASE WHEN ignite_e ='yes' THEN 1 ELSE 0 END)
  ) STORED,

  -- Cold lead fields
  disqualification_reason TEXT,
  re_engagement_date DATE,
  nurture_sequence_active BOOLEAN DEFAULT false,

  -- Conversion tracking
  converted_at TIMESTAMPTZ,
  converted_contact_id UUID REFERENCES public.contacts(id),
  converted_account_id UUID REFERENCES public.accounts(id),
  converted_opportunity_id UUID,

  -- Ownership
  lead_owner_id UUID REFERENCES public.users(id),
  lead_owner_name TEXT,

  notes TEXT,
  last_activity_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- OPPORTUNITIES (active pipeline deals)
CREATE TABLE IF NOT EXISTS public.opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES public.organisations(id) ON DELETE CASCADE,

  -- Core
  name TEXT NOT NULL,
  account_id UUID REFERENCES public.accounts(id),
  account_name TEXT,
  contact_id UUID REFERENCES public.contacts(id),
  contact_name TEXT,
  converted_from_lead_id UUID REFERENCES public.leads(id),

  -- Stage and status
  stage INTEGER NOT NULL DEFAULT 1 CHECK (stage BETWEEN 1 AND 6),
  status TEXT DEFAULT 'active' CHECK (status IN (
    'active','closed_won','closed_lost','cement'
  )),
  probability INTEGER GENERATED ALWAYS AS (
    CASE stage
      WHEN 1 THEN 10 WHEN 2 THEN 30 WHEN 3 THEN 50
      WHEN 4 THEN 70 WHEN 5 THEN 90 WHEN 6 THEN 100
      ELSE 0 END
  ) STORED,

  -- Financials
  value NUMERIC DEFAULT 0,
  weighted_value NUMERIC GENERATED ALWAYS AS (
    value * CASE stage
      WHEN 1 THEN 0.10 WHEN 2 THEN 0.30 WHEN 3 THEN 0.50
      WHEN 4 THEN 0.70 WHEN 5 THEN 0.90 WHEN 6 THEN 1.00
      ELSE 0 END
  ) STORED,
  currency TEXT DEFAULT 'USD',
  expected_close_date DATE,

  -- MEDDPICC fields
  medd_metrics TEXT,
  medd_economic_buyer TEXT,
  medd_decision_criteria TEXT,
  medd_decision_process TEXT,
  medd_paper_process TEXT,
  medd_identify_pain TEXT,
  medd_champion TEXT,
  medd_competition TEXT,

  -- Milestone tracking
  milestone_checks JSONB DEFAULT '{}',

  -- Stage bypass log
  bypass_log JSONB DEFAULT '[]',

  -- Key dates
  qualified_date DATE,
  sql_date DATE,
  demo_date DATE,
  proposal_date DATE,
  won_date DATE,
  lost_date DATE,
  cement_start_date DATE,

  -- Won/Lost
  lost_reason TEXT,
  competitor_lost_to TEXT,

  -- Cement fields
  cement_milestones JSONB DEFAULT '{}',
  renewal_date DATE,
  expansion_value NUMERIC DEFAULT 0,
  nps_score INTEGER,
  long_term_contract_signed BOOLEAN DEFAULT false,

  -- Ownership
  owner_id UUID REFERENCES public.users(id),
  owner_name TEXT,

  notes TEXT,
  last_activity_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ACTIVITIES (unified log)
CREATE TABLE IF NOT EXISTS public.activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES public.organisations(id) ON DELETE CASCADE,

  -- Linked records
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
  opportunity_id UUID REFERENCES public.opportunities(id) ON DELETE CASCADE,
  account_id UUID REFERENCES public.accounts(id),
  contact_id UUID REFERENCES public.contacts(id),

  type TEXT NOT NULL CHECK (type IN (
    'meeting','call','email','event',
    'stage_change','lead_converted',
    'ignite_gate','bypass','task_done',
    'cement_milestone','note'
  )),

  subject TEXT,
  notes TEXT,
  outcome TEXT CHECK (outcome IN ('positive','neutral','negative','completed')),
  contact_person TEXT,
  activity_date DATE NOT NULL DEFAULT CURRENT_DATE,
  duration_minutes INTEGER,
  location TEXT,

  -- Auto-logged fields
  from_stage INTEGER,
  to_stage INTEGER,
  bypass_reason TEXT,

  -- Ownership
  owner_id UUID REFERENCES public.users(id),
  owner_name TEXT,

  is_auto_logged BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- TASKS
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES public.organisations(id) ON DELETE CASCADE,

  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
  opportunity_id UUID REFERENCES public.opportunities(id) ON DELETE CASCADE,

  title TEXT NOT NULL,
  notes TEXT,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('urgent','high','medium','low')),
  status TEXT DEFAULT 'todo' CHECK (status IN ('todo','inprogress','done')),
  due_date DATE,
  done_date DATE,
  reminder_date TIMESTAMPTZ,
  assignee_id UUID REFERENCES public.users(id),
  assignee_name TEXT,
  stage_at_creation INTEGER,
  is_suggested BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add foreign key after leads table is created
ALTER TABLE public.leads ADD CONSTRAINT leads_converted_opp_fk
  FOREIGN KEY (converted_opportunity_id) REFERENCES public.opportunities(id);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_org ON public.leads(org_id);
CREATE INDEX IF NOT EXISTS idx_leads_owner ON public.leads(lead_owner_id);
CREATE INDEX IF NOT EXISTS idx_opps_stage ON public.opportunities(stage);
CREATE INDEX IF NOT EXISTS idx_opps_status ON public.opportunities(status);
CREATE INDEX IF NOT EXISTS idx_opps_org ON public.opportunities(org_id);
CREATE INDEX IF NOT EXISTS idx_opps_owner ON public.opportunities(owner_id);
CREATE INDEX IF NOT EXISTS idx_acts_lead ON public.activities(lead_id);
CREATE INDEX IF NOT EXISTS idx_acts_opp ON public.activities(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_acts_date ON public.activities(activity_date);
CREATE INDEX IF NOT EXISTS idx_tasks_opp ON public.tasks(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_tasks_due ON public.tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_accounts_org ON public.accounts(org_id);
CREATE INDEX IF NOT EXISTS idx_contacts_account ON public.contacts(account_id);

-- UPDATED_AT TRIGGERS
CREATE OR REPLACE FUNCTION public.trigger_set_timestamp()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER set_ts_leads BEFORE UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();
CREATE TRIGGER set_ts_opps BEFORE UPDATE ON public.opportunities
  FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();
CREATE TRIGGER set_ts_accounts BEFORE UPDATE ON public.accounts
  FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();
CREATE TRIGGER set_ts_contacts BEFORE UPDATE ON public.contacts
  FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();
CREATE TRIGGER set_ts_tasks BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();

-- RLS
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Permissive policies
CREATE POLICY "org_leads" ON public.leads FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "org_opps" ON public.opportunities FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "org_accounts" ON public.accounts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "org_contacts" ON public.contacts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "org_activities" ON public.activities FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "org_tasks" ON public.tasks FOR ALL USING (true) WITH CHECK (true);
