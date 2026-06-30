-- FIX SDR PERMISSIONS
-- sdr should be able to CRUD their OWN records (like account_executive)
-- sdr has READ visibility into team (via app_manages) but no WRITE on team records
-- sdr is READ-ONLY on reports/forecasts

-- Drop existing policies on core data tables
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

-- ============================================================================
-- CORE DATA TABLES - sdr can WRITE their OWN records
-- Pattern: super_duper_admin OR (same org AND (super_admin OR (admin manages owner) OR (sdr/AE owns record)))
-- ============================================================================

-- ACCOUNTS
CREATE POLICY accounts_insert ON public.accounts
  FOR INSERT
  WITH CHECK (
    app_role() = 'super_duper_admin'
    OR (
      org_id = app_org()
      AND (
        app_role() = 'super_admin'
        OR (app_role() = 'admin' AND app_manages(account_owner_id))
        OR (app_role() IN ('sdr', 'account_executive') AND account_owner_id = auth.uid())
      )
    )
  );

CREATE POLICY accounts_update ON public.accounts
  FOR UPDATE
  USING (
    app_role() = 'super_duper_admin'
    OR (
      org_id = app_org()
      AND (
        app_role() = 'super_admin'
        OR (app_role() = 'admin' AND app_manages(account_owner_id))
        OR (app_role() IN ('sdr', 'account_executive') AND account_owner_id = auth.uid())
      )
    )
  );

CREATE POLICY accounts_delete ON public.accounts
  FOR DELETE
  USING (
    app_role() = 'super_duper_admin'
    OR (
      org_id = app_org()
      AND (
        app_role() = 'super_admin'
        OR (app_role() = 'admin' AND app_manages(account_owner_id))
        OR (app_role() IN ('sdr', 'account_executive') AND account_owner_id = auth.uid())
      )
    )
  );

-- ACTIVITIES
CREATE POLICY activities_insert ON public.activities
  FOR INSERT
  WITH CHECK (
    app_role() = 'super_duper_admin'
    OR (
      org_id = app_org()
      AND (
        app_role() = 'super_admin'
        OR (app_role() = 'admin' AND app_manages(owner_id))
        OR (app_role() IN ('sdr', 'account_executive') AND owner_id = auth.uid())
      )
    )
  );

CREATE POLICY activities_update ON public.activities
  FOR UPDATE
  USING (
    app_role() = 'super_duper_admin'
    OR (
      org_id = app_org()
      AND (
        app_role() = 'super_admin'
        OR (app_role() = 'admin' AND app_manages(owner_id))
        OR (app_role() IN ('sdr', 'account_executive') AND owner_id = auth.uid())
      )
    )
  );

CREATE POLICY activities_delete ON public.activities
  FOR DELETE
  USING (
    app_role() = 'super_duper_admin'
    OR (
      org_id = app_org()
      AND (
        app_role() = 'super_admin'
        OR (app_role() = 'admin' AND app_manages(owner_id))
        OR (app_role() IN ('sdr', 'account_executive') AND owner_id = auth.uid())
      )
    )
  );

-- CONTACTS
CREATE POLICY contacts_insert ON public.contacts
  FOR INSERT
  WITH CHECK (
    app_role() = 'super_duper_admin'
    OR (
      org_id = app_org()
      AND (
        app_role() = 'super_admin'
        OR (app_role() = 'admin' AND app_manages(contact_owner_id))
        OR (app_role() IN ('sdr', 'account_executive') AND contact_owner_id = auth.uid())
      )
    )
  );

CREATE POLICY contacts_update ON public.contacts
  FOR UPDATE
  USING (
    app_role() = 'super_duper_admin'
    OR (
      org_id = app_org()
      AND (
        app_role() = 'super_admin'
        OR (app_role() = 'admin' AND app_manages(contact_owner_id))
        OR (app_role() IN ('sdr', 'account_executive') AND contact_owner_id = auth.uid())
      )
    )
  );

CREATE POLICY contacts_delete ON public.contacts
  FOR DELETE
  USING (
    app_role() = 'super_duper_admin'
    OR (
      org_id = app_org()
      AND (
        app_role() = 'super_admin'
        OR (app_role() = 'admin' AND app_manages(contact_owner_id))
        OR (app_role() IN ('sdr', 'account_executive') AND contact_owner_id = auth.uid())
      )
    )
  );

-- DEALS
CREATE POLICY deals_insert ON public.deals
  FOR INSERT
  WITH CHECK (
    app_role() = 'super_duper_admin'
    OR (
      org_id = app_org()
      AND (
        app_role() = 'super_admin'
        OR (app_role() = 'admin' AND app_manages(assigned_to))
        OR (app_role() IN ('sdr', 'account_executive') AND assigned_to = auth.uid())
      )
    )
  );

CREATE POLICY deals_update ON public.deals
  FOR UPDATE
  USING (
    app_role() = 'super_duper_admin'
    OR (
      org_id = app_org()
      AND (
        app_role() = 'super_admin'
        OR (app_role() = 'admin' AND app_manages(assigned_to))
        OR (app_role() IN ('sdr', 'account_executive') AND assigned_to = auth.uid())
      )
    )
  );

CREATE POLICY deals_delete ON public.deals
  FOR DELETE
  USING (
    app_role() = 'super_duper_admin'
    OR (
      org_id = app_org()
      AND (
        app_role() = 'super_admin'
        OR (app_role() = 'admin' AND app_manages(assigned_to))
        OR (app_role() IN ('sdr', 'account_executive') AND assigned_to = auth.uid())
      )
    )
  );

-- LEADS
CREATE POLICY leads_insert ON public.leads
  FOR INSERT
  WITH CHECK (
    app_role() = 'super_duper_admin'
    OR (
      org_id = app_org()
      AND (
        app_role() = 'super_admin'
        OR (app_role() = 'admin' AND app_manages(lead_owner_id))
        OR (app_role() IN ('sdr', 'account_executive') AND lead_owner_id = auth.uid())
      )
    )
  );

CREATE POLICY leads_update ON public.leads
  FOR UPDATE
  USING (
    app_role() = 'super_duper_admin'
    OR (
      org_id = app_org()
      AND (
        app_role() = 'super_admin'
        OR (app_role() = 'admin' AND app_manages(lead_owner_id))
        OR (app_role() IN ('sdr', 'account_executive') AND lead_owner_id = auth.uid())
      )
    )
  );

CREATE POLICY leads_delete ON public.leads
  FOR DELETE
  USING (
    app_role() = 'super_duper_admin'
    OR (
      org_id = app_org()
      AND (
        app_role() = 'super_admin'
        OR (app_role() = 'admin' AND app_manages(lead_owner_id))
        OR (app_role() IN ('sdr', 'account_executive') AND lead_owner_id = auth.uid())
      )
    )
  );

-- OPPORTUNITIES
CREATE POLICY opportunities_insert ON public.opportunities
  FOR INSERT
  WITH CHECK (
    app_role() = 'super_duper_admin'
    OR (
      org_id = app_org()
      AND (
        app_role() = 'super_admin'
        OR (app_role() = 'admin' AND app_manages(owner_id))
        OR (app_role() IN ('sdr', 'account_executive') AND owner_id = auth.uid())
      )
    )
  );

CREATE POLICY opportunities_update ON public.opportunities
  FOR UPDATE
  USING (
    app_role() = 'super_duper_admin'
    OR (
      org_id = app_org()
      AND (
        app_role() = 'super_admin'
        OR (app_role() = 'admin' AND app_manages(owner_id))
        OR (app_role() IN ('sdr', 'account_executive') AND owner_id = auth.uid())
      )
    )
  );

CREATE POLICY opportunities_delete ON public.opportunities
  FOR DELETE
  USING (
    app_role() = 'super_duper_admin'
    OR (
      org_id = app_org()
      AND (
        app_role() = 'super_admin'
        OR (app_role() = 'admin' AND app_manages(owner_id))
        OR (app_role() IN ('sdr', 'account_executive') AND owner_id = auth.uid())
      )
    )
  );

-- TASKS
CREATE POLICY tasks_insert ON public.tasks
  FOR INSERT
  WITH CHECK (
    app_role() = 'super_duper_admin'
    OR (
      org_id = app_org()
      AND (
        app_role() = 'super_admin'
        OR (app_role() = 'admin' AND app_manages(assignee_id))
        OR (app_role() IN ('sdr', 'account_executive') AND assignee_id = auth.uid())
      )
    )
  );

CREATE POLICY tasks_update ON public.tasks
  FOR UPDATE
  USING (
    app_role() = 'super_duper_admin'
    OR (
      org_id = app_org()
      AND (
        app_role() = 'super_admin'
        OR (app_role() = 'admin' AND app_manages(assignee_id))
        OR (app_role() IN ('sdr', 'account_executive') AND assignee_id = auth.uid())
      )
    )
  );

CREATE POLICY tasks_delete ON public.tasks
  FOR DELETE
  USING (
    app_role() = 'super_duper_admin'
    OR (
      org_id = app_org()
      AND (
        app_role() = 'super_admin'
        OR (app_role() = 'admin' AND app_manages(assignee_id))
        OR (app_role() IN ('sdr', 'account_executive') AND assignee_id = auth.uid())
      )
    )
  );

-- ============================================================================
-- REPORT/FORECAST TABLES - sdr is READ-ONLY (excluded from WRITE)
-- Pattern: super_duper_admin OR (same org AND (super_admin OR (admin manages owner) OR (AE owns record)))
-- Note: sdr is excluded from WRITE on reports
-- ============================================================================

-- WEEKLY_REPORTS
CREATE POLICY weekly_reports_insert ON public.weekly_reports
  FOR INSERT
  WITH CHECK (
    app_role() = 'super_duper_admin'
    OR (
      org_id = app_org()
      AND (
        app_role() = 'super_admin'
        OR (app_role() = 'admin' AND app_manages(user_id))
        OR (app_role() = 'account_executive' AND user_id = auth.uid())
      )
    )
  );

CREATE POLICY weekly_reports_update ON public.weekly_reports
  FOR UPDATE
  USING (
    app_role() = 'super_duper_admin'
    OR (
      org_id = app_org()
      AND (
        app_role() = 'super_admin'
        OR (app_role() = 'admin' AND app_manages(user_id))
        OR (app_role() = 'account_executive' AND user_id = auth.uid())
      )
    )
  );

CREATE POLICY weekly_reports_delete ON public.weekly_reports
  FOR DELETE
  USING (
    app_role() = 'super_duper_admin'
    OR (
      org_id = app_org()
      AND (
        app_role() = 'super_admin'
        OR (app_role() = 'admin' AND app_manages(user_id))
        OR (app_role() = 'account_executive' AND user_id = auth.uid())
      )
    )
  );

-- READ policies remain unchanged (sdr can READ via app_manages)
-- USER table policies remain unchanged (sdr cannot manage users)
