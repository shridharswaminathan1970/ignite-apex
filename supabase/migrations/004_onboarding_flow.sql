-- ONBOARDING FLOW MIGRATION
-- 1. Add company contact fields to organisations
-- 2. Update RLS policies to exclude 'sdr' from WRITE operations (make them read-only)

-- Add company contact fields
ALTER TABLE public.organisations
ADD COLUMN IF NOT EXISTS address text,
ADD COLUMN IF NOT EXISTS contact_email text,
ADD COLUMN IF NOT EXISTS contact_phone text;

-- Drop existing INSERT/UPDATE/DELETE policies on all data tables
DROP POLICY IF EXISTS "users_insert" ON public.users;
DROP POLICY IF EXISTS "users_update" ON public.users;
DROP POLICY IF EXISTS "users_delete" ON public.users;
DROP POLICY IF EXISTS "accounts_insert" ON public.accounts;
DROP POLICY IF EXISTS "accounts_update" ON public.accounts;
DROP POLICY IF EXISTS "accounts_delete" ON public.accounts;
DROP POLICY IF EXISTS "activities_insert" ON public.activities;
DROP POLICY IF EXISTS "activities_update" ON public.activities;
DROP POLICY IF EXISTS "activities_delete" ON public.activities;
DROP POLICY IF EXISTS "contacts_insert" ON public.contacts;
DROP POLICY IF EXISTS "contacts_update" ON public.contacts;
DROP POLICY IF EXISTS "contacts_delete" ON public.contacts;
DROP POLICY IF EXISTS "deals_insert" ON public.deals;
DROP POLICY IF EXISTS "deals_update" ON public.deals;
DROP POLICY IF EXISTS "deals_delete" ON public.deals;
DROP POLICY IF EXISTS "leads_insert" ON public.leads;
DROP POLICY IF EXISTS "leads_update" ON public.leads;
DROP POLICY IF EXISTS "leads_delete" ON public.leads;
DROP POLICY IF EXISTS "opportunities_insert" ON public.opportunities;
DROP POLICY IF EXISTS "opportunities_update" ON public.opportunities;
DROP POLICY IF EXISTS "opportunities_delete" ON public.opportunities;
DROP POLICY IF EXISTS "tasks_insert" ON public.tasks;
DROP POLICY IF EXISTS "tasks_update" ON public.tasks;
DROP POLICY IF EXISTS "tasks_delete" ON public.tasks;
DROP POLICY IF EXISTS "weekly_reports_insert" ON public.weekly_reports;
DROP POLICY IF EXISTS "weekly_reports_update" ON public.weekly_reports;
DROP POLICY IF EXISTS "weekly_reports_delete" ON public.weekly_reports;
DROP POLICY IF EXISTS "deal_states_insert" ON public.deal_states;
DROP POLICY IF EXISTS "deal_states_update" ON public.deal_states;
DROP POLICY IF EXISTS "deal_states_delete" ON public.deal_states;
DROP POLICY IF EXISTS "sales_persons_insert" ON public.sales_persons;
DROP POLICY IF EXISTS "sales_persons_update" ON public.sales_persons;
DROP POLICY IF EXISTS "sales_persons_delete" ON public.sales_persons;

-- USERS: exclude sdr from INSERT
CREATE POLICY users_insert ON public.users
  FOR INSERT
  WITH CHECK (
    app_role() = 'super_duper_admin'
    OR (org_id = app_org() AND app_role() IN ('super_admin', 'admin'))
  );

CREATE POLICY users_update ON public.users
  FOR UPDATE
  USING (
    app_role() = 'super_duper_admin'
    OR (org_id = app_org() AND app_role() = 'super_admin')
    OR (org_id = app_org() AND app_role() NOT IN ('admin_m', 'sdr') AND app_manages(id))
  );

CREATE POLICY users_delete ON public.users
  FOR DELETE
  USING (
    app_role() = 'super_duper_admin'
    OR (org_id = app_org() AND app_role() = 'super_admin')
  );

-- ACCOUNTS: exclude sdr
CREATE POLICY accounts_insert ON public.accounts
  FOR INSERT
  WITH CHECK (
    app_role() = 'super_duper_admin'
    OR (org_id = app_org() AND (app_role() = 'super_admin' OR (app_role() NOT IN ('admin_m', 'sdr') AND app_manages(account_owner_id))))
  );

CREATE POLICY accounts_update ON public.accounts
  FOR UPDATE
  USING (
    app_role() = 'super_duper_admin'
    OR (org_id = app_org() AND (app_role() = 'super_admin' OR (app_role() NOT IN ('admin_m', 'sdr') AND app_manages(account_owner_id))))
  );

CREATE POLICY accounts_delete ON public.accounts
  FOR DELETE
  USING (
    app_role() = 'super_duper_admin'
    OR (org_id = app_org() AND (app_role() = 'super_admin' OR (app_role() NOT IN ('admin_m', 'sdr') AND app_manages(account_owner_id))))
  );

-- ACTIVITIES: exclude sdr (column: owner_id)
CREATE POLICY activities_insert ON public.activities
  FOR INSERT
  WITH CHECK (
    app_role() = 'super_duper_admin'
    OR (org_id = app_org() AND (app_role() = 'super_admin' OR (app_role() NOT IN ('admin_m', 'sdr') AND app_manages(owner_id))))
  );

CREATE POLICY activities_update ON public.activities
  FOR UPDATE
  USING (
    app_role() = 'super_duper_admin'
    OR (org_id = app_org() AND (app_role() = 'super_admin' OR (app_role() NOT IN ('admin_m', 'sdr') AND app_manages(owner_id))))
  );

CREATE POLICY activities_delete ON public.activities
  FOR DELETE
  USING (
    app_role() = 'super_duper_admin'
    OR (org_id = app_org() AND (app_role() = 'super_admin' OR (app_role() NOT IN ('admin_m', 'sdr') AND app_manages(owner_id))))
  );

-- CONTACTS: exclude sdr
CREATE POLICY contacts_insert ON public.contacts
  FOR INSERT
  WITH CHECK (
    app_role() = 'super_duper_admin'
    OR (org_id = app_org() AND (app_role() = 'super_admin' OR (app_role() NOT IN ('admin_m', 'sdr') AND app_manages(contact_owner_id))))
  );

CREATE POLICY contacts_update ON public.contacts
  FOR UPDATE
  USING (
    app_role() = 'super_duper_admin'
    OR (org_id = app_org() AND (app_role() = 'super_admin' OR (app_role() NOT IN ('admin_m', 'sdr') AND app_manages(contact_owner_id))))
  );

CREATE POLICY contacts_delete ON public.contacts
  FOR DELETE
  USING (
    app_role() = 'super_duper_admin'
    OR (org_id = app_org() AND (app_role() = 'super_admin' OR (app_role() NOT IN ('admin_m', 'sdr') AND app_manages(contact_owner_id))))
  );

-- DEALS: exclude sdr (column: assigned_to)
CREATE POLICY deals_insert ON public.deals
  FOR INSERT
  WITH CHECK (
    app_role() = 'super_duper_admin'
    OR (org_id = app_org() AND (app_role() = 'super_admin' OR (app_role() NOT IN ('admin_m', 'sdr') AND app_manages(assigned_to))))
  );

CREATE POLICY deals_update ON public.deals
  FOR UPDATE
  USING (
    app_role() = 'super_duper_admin'
    OR (org_id = app_org() AND (app_role() = 'super_admin' OR (app_role() NOT IN ('admin_m', 'sdr') AND app_manages(assigned_to))))
  );

CREATE POLICY deals_delete ON public.deals
  FOR DELETE
  USING (
    app_role() = 'super_duper_admin'
    OR (org_id = app_org() AND (app_role() = 'super_admin' OR (app_role() NOT IN ('admin_m', 'sdr') AND app_manages(assigned_to))))
  );

-- LEADS: exclude sdr
CREATE POLICY leads_insert ON public.leads
  FOR INSERT
  WITH CHECK (
    app_role() = 'super_duper_admin'
    OR (org_id = app_org() AND (app_role() = 'super_admin' OR (app_role() NOT IN ('admin_m', 'sdr') AND app_manages(lead_owner_id))))
  );

CREATE POLICY leads_update ON public.leads
  FOR UPDATE
  USING (
    app_role() = 'super_duper_admin'
    OR (org_id = app_org() AND (app_role() = 'super_admin' OR (app_role() NOT IN ('admin_m', 'sdr') AND app_manages(lead_owner_id))))
  );

CREATE POLICY leads_delete ON public.leads
  FOR DELETE
  USING (
    app_role() = 'super_duper_admin'
    OR (org_id = app_org() AND (app_role() = 'super_admin' OR (app_role() NOT IN ('admin_m', 'sdr') AND app_manages(lead_owner_id))))
  );

-- OPPORTUNITIES: exclude sdr (column: owner_id)
CREATE POLICY opportunities_insert ON public.opportunities
  FOR INSERT
  WITH CHECK (
    app_role() = 'super_duper_admin'
    OR (org_id = app_org() AND (app_role() = 'super_admin' OR (app_role() NOT IN ('admin_m', 'sdr') AND app_manages(owner_id))))
  );

CREATE POLICY opportunities_update ON public.opportunities
  FOR UPDATE
  USING (
    app_role() = 'super_duper_admin'
    OR (org_id = app_org() AND (app_role() = 'super_admin' OR (app_role() NOT IN ('admin_m', 'sdr') AND app_manages(owner_id))))
  );

CREATE POLICY opportunities_delete ON public.opportunities
  FOR DELETE
  USING (
    app_role() = 'super_duper_admin'
    OR (org_id = app_org() AND (app_role() = 'super_admin' OR (app_role() NOT IN ('admin_m', 'sdr') AND app_manages(owner_id))))
  );

-- TASKS: exclude sdr (column: assignee_id)
CREATE POLICY tasks_insert ON public.tasks
  FOR INSERT
  WITH CHECK (
    app_role() = 'super_duper_admin'
    OR (org_id = app_org() AND (app_role() = 'super_admin' OR (app_role() NOT IN ('admin_m', 'sdr') AND app_manages(assignee_id))))
  );

CREATE POLICY tasks_update ON public.tasks
  FOR UPDATE
  USING (
    app_role() = 'super_duper_admin'
    OR (org_id = app_org() AND (app_role() = 'super_admin' OR (app_role() NOT IN ('admin_m', 'sdr') AND app_manages(assignee_id))))
  );

CREATE POLICY tasks_delete ON public.tasks
  FOR DELETE
  USING (
    app_role() = 'super_duper_admin'
    OR (org_id = app_org() AND (app_role() = 'super_admin' OR (app_role() NOT IN ('admin_m', 'sdr') AND app_manages(assignee_id))))
  );

-- WEEKLY_REPORTS: exclude sdr (column: user_id)
CREATE POLICY weekly_reports_insert ON public.weekly_reports
  FOR INSERT
  WITH CHECK (
    app_role() = 'super_duper_admin'
    OR (org_id = app_org() AND (app_role() = 'super_admin' OR (app_role() NOT IN ('admin_m', 'sdr') AND app_manages(user_id))))
  );

CREATE POLICY weekly_reports_update ON public.weekly_reports
  FOR UPDATE
  USING (
    app_role() = 'super_duper_admin'
    OR (org_id = app_org() AND (app_role() = 'super_admin' OR (app_role() NOT IN ('admin_m', 'sdr') AND app_manages(user_id))))
  );

CREATE POLICY weekly_reports_delete ON public.weekly_reports
  FOR DELETE
  USING (
    app_role() = 'super_duper_admin'
    OR (org_id = app_org() AND (app_role() = 'super_admin' OR (app_role() NOT IN ('admin_m', 'sdr') AND app_manages(user_id))))
  );

-- DEAL_STATES: super_admin only (uses EXISTS via deals table)
CREATE POLICY deal_states_insert ON public.deal_states
  FOR INSERT
  WITH CHECK (
    app_role() = 'super_duper_admin'
    OR EXISTS (
      SELECT 1 FROM public.deals
      WHERE deals.id = deal_states.deal_id
      AND deals.org_id = app_org()
      AND app_role() = 'super_admin'
    )
  );

CREATE POLICY deal_states_update ON public.deal_states
  FOR UPDATE
  USING (
    app_role() = 'super_duper_admin'
    OR EXISTS (
      SELECT 1 FROM public.deals
      WHERE deals.id = deal_states.deal_id
      AND deals.org_id = app_org()
      AND app_role() = 'super_admin'
    )
  );

CREATE POLICY deal_states_delete ON public.deal_states
  FOR DELETE
  USING (
    app_role() = 'super_duper_admin'
    OR EXISTS (
      SELECT 1 FROM public.deals
      WHERE deals.id = deal_states.deal_id
      AND deals.org_id = app_org()
      AND app_role() = 'super_admin'
    )
  );

-- SALES_PERSONS: super_duper_admin only (no org_id column)
CREATE POLICY sales_persons_insert ON public.sales_persons
  FOR INSERT
  WITH CHECK (app_role() = 'super_duper_admin');

CREATE POLICY sales_persons_update ON public.sales_persons
  FOR UPDATE
  USING (app_role() = 'super_duper_admin');

CREATE POLICY sales_persons_delete ON public.sales_persons
  FOR DELETE
  USING (app_role() = 'super_duper_admin');
