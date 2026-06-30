-- 001_rbac.sql
-- Comprehensive RBAC for Ignite-Apex: helper functions, RLS on users/orgs, and data-table policies

-- ============================================================================
-- CLEANUP: Drop all existing policies and functions (idempotent)
-- ============================================================================

-- Drop all policies that depend on the helper functions
DROP POLICY IF EXISTS users_read ON public.users;
DROP POLICY IF EXISTS users_write ON public.users;
DROP POLICY IF EXISTS orgs_read ON public.organisations;
DROP POLICY IF EXISTS orgs_write ON public.organisations;

-- Drop existing functions
DROP FUNCTION IF EXISTS public.app_role();
DROP FUNCTION IF EXISTS public.app_org();
DROP FUNCTION IF EXISTS public.app_manages(uuid);

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- app_role(): returns the current user's role from public.users
CREATE OR REPLACE FUNCTION public.app_role()
RETURNS TEXT
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.users WHERE id = auth.uid();
$$;

-- app_org(): returns the current user's org_id from public.users
CREATE OR REPLACE FUNCTION public.app_org()
RETURNS UUID
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT org_id FROM public.users WHERE id = auth.uid();
$$;

-- app_manages(target_user_id): returns TRUE if current user manages target (recursive downline check)
-- Uses recursive CTE to walk manager_id chain upward from target to see if auth.uid() appears
CREATE OR REPLACE FUNCTION public.app_manages(target_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH RECURSIVE upline AS (
    -- Base: start from target user
    SELECT id, manager_id, org_id
    FROM public.users
    WHERE id = target_user_id

    UNION ALL

    -- Recursive: walk up the manager chain
    SELECT u.id, u.manager_id, u.org_id
    FROM public.users u
    INNER JOIN upline ON upline.manager_id = u.id
  )
  -- Check if auth.uid() appears anywhere in the upline (current user manages target)
  -- OR if target is the current user (self-management)
  SELECT EXISTS (
    SELECT 1 FROM upline WHERE id = auth.uid()
  ) OR target_user_id = auth.uid();
$$;

-- ============================================================================
-- RLS ON public.users (idempotent: DROP IF EXISTS, then CREATE)
-- ============================================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS users_select ON public.users;
DROP POLICY IF EXISTS users_insert ON public.users;
DROP POLICY IF EXISTS users_update ON public.users;
DROP POLICY IF EXISTS users_delete ON public.users;

-- SELECT: super_duper_admin sees all; others see users in their org that they manage (or themselves)
CREATE POLICY users_select ON public.users
  FOR SELECT
  USING (
    app_role() = 'super_duper_admin'
    OR (
      org_id = app_org()
      AND (
        app_role() IN ('super_admin', 'admin_m')
        OR app_manages(id)
      )
    )
  );

-- INSERT: super_duper_admin OR super_admin/admin/sdr creating downline users
-- (Edge Function will enforce role hierarchy and org assignment)
CREATE POLICY users_insert ON public.users
  FOR INSERT
  WITH CHECK (
    app_role() = 'super_duper_admin'
    OR (
      org_id = app_org()
      AND app_role() IN ('super_admin', 'admin', 'sdr')
    )
  );

-- UPDATE: super_duper_admin OR non-admin_m users updating their downline (or themselves)
CREATE POLICY users_update ON public.users
  FOR UPDATE
  USING (
    app_role() = 'super_duper_admin'
    OR (
      org_id = app_org()
      AND app_role() = 'super_admin'
    )
    OR (
      org_id = app_org()
      AND app_role() <> 'admin_m'
      AND app_manages(id)
    )
  );

-- DELETE: super_duper_admin OR super_admin only
CREATE POLICY users_delete ON public.users
  FOR DELETE
  USING (
    app_role() = 'super_duper_admin'
    OR (
      org_id = app_org()
      AND app_role() = 'super_admin'
    )
  );

-- ============================================================================
-- RLS ON public.organisations (idempotent)
-- ============================================================================

ALTER TABLE public.organisations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS organisations_select ON public.organisations;
DROP POLICY IF EXISTS organisations_insert ON public.organisations;
DROP POLICY IF EXISTS organisations_update ON public.organisations;
DROP POLICY IF EXISTS organisations_delete ON public.organisations;

-- SELECT: super_duper_admin sees all; company users see their own org
CREATE POLICY organisations_select ON public.organisations
  FOR SELECT
  USING (
    app_role() = 'super_duper_admin'
    OR id = app_org()
  );

-- INSERT: super_duper_admin only (via create-super-admin Edge Function)
CREATE POLICY organisations_insert ON public.organisations
  FOR INSERT
  WITH CHECK (app_role() = 'super_duper_admin');

-- UPDATE: super_duper_admin OR super_admin of the org
CREATE POLICY organisations_update ON public.organisations
  FOR UPDATE
  USING (
    app_role() = 'super_duper_admin'
    OR (id = app_org() AND app_role() = 'super_admin')
  );

-- DELETE: super_duper_admin only
CREATE POLICY organisations_delete ON public.organisations
  FOR DELETE
  USING (app_role() = 'super_duper_admin');

-- ============================================================================
-- RLS ON DATA TABLES (idempotent)
-- ============================================================================
-- Pattern: READ = super_duper_admin OR (same org AND (super_admin/admin_m OR manages owner))
--          WRITE = super_duper_admin OR (same org AND (super_admin OR (not admin_m AND manages owner)))

-- --------------------
-- accounts (org_id + account_owner_id)
-- --------------------
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS accounts_select ON public.accounts;
DROP POLICY IF EXISTS accounts_insert ON public.accounts;
DROP POLICY IF EXISTS accounts_update ON public.accounts;
DROP POLICY IF EXISTS accounts_delete ON public.accounts;

CREATE POLICY accounts_select ON public.accounts
  FOR SELECT
  USING (
    app_role() = 'super_duper_admin'
    OR (
      org_id = app_org()
      AND (
        app_role() IN ('super_admin', 'admin_m')
        OR app_manages(account_owner_id)
      )
    )
  );

CREATE POLICY accounts_insert ON public.accounts
  FOR INSERT
  WITH CHECK (
    app_role() = 'super_duper_admin'
    OR (
      org_id = app_org()
      AND (
        app_role() = 'super_admin'
        OR (app_role() <> 'admin_m' AND app_manages(account_owner_id))
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
        OR (app_role() <> 'admin_m' AND app_manages(account_owner_id))
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
        OR (app_role() <> 'admin_m' AND app_manages(account_owner_id))
      )
    )
  );

-- --------------------
-- activities (org_id + owner_id)
-- --------------------
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS activities_select ON public.activities;
DROP POLICY IF EXISTS activities_insert ON public.activities;
DROP POLICY IF EXISTS activities_update ON public.activities;
DROP POLICY IF EXISTS activities_delete ON public.activities;

CREATE POLICY activities_select ON public.activities
  FOR SELECT
  USING (
    app_role() = 'super_duper_admin'
    OR (
      org_id = app_org()
      AND (
        app_role() IN ('super_admin', 'admin_m')
        OR app_manages(owner_id)
      )
    )
  );

CREATE POLICY activities_insert ON public.activities
  FOR INSERT
  WITH CHECK (
    app_role() = 'super_duper_admin'
    OR (
      org_id = app_org()
      AND (
        app_role() = 'super_admin'
        OR (app_role() <> 'admin_m' AND app_manages(owner_id))
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
        OR (app_role() <> 'admin_m' AND app_manages(owner_id))
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
        OR (app_role() <> 'admin_m' AND app_manages(owner_id))
      )
    )
  );

-- --------------------
-- contacts (org_id + contact_owner_id)
-- --------------------
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS contacts_select ON public.contacts;
DROP POLICY IF EXISTS contacts_insert ON public.contacts;
DROP POLICY IF EXISTS contacts_update ON public.contacts;
DROP POLICY IF EXISTS contacts_delete ON public.contacts;

CREATE POLICY contacts_select ON public.contacts
  FOR SELECT
  USING (
    app_role() = 'super_duper_admin'
    OR (
      org_id = app_org()
      AND (
        app_role() IN ('super_admin', 'admin_m')
        OR app_manages(contact_owner_id)
      )
    )
  );

CREATE POLICY contacts_insert ON public.contacts
  FOR INSERT
  WITH CHECK (
    app_role() = 'super_duper_admin'
    OR (
      org_id = app_org()
      AND (
        app_role() = 'super_admin'
        OR (app_role() <> 'admin_m' AND app_manages(contact_owner_id))
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
        OR (app_role() <> 'admin_m' AND app_manages(contact_owner_id))
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
        OR (app_role() <> 'admin_m' AND app_manages(contact_owner_id))
      )
    )
  );

-- --------------------
-- deals (org_id + assigned_to)
-- --------------------
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS deals_select ON public.deals;
DROP POLICY IF EXISTS deals_insert ON public.deals;
DROP POLICY IF EXISTS deals_update ON public.deals;
DROP POLICY IF EXISTS deals_delete ON public.deals;

CREATE POLICY deals_select ON public.deals
  FOR SELECT
  USING (
    app_role() = 'super_duper_admin'
    OR (
      org_id = app_org()
      AND (
        app_role() IN ('super_admin', 'admin_m')
        OR app_manages(assigned_to)
      )
    )
  );

CREATE POLICY deals_insert ON public.deals
  FOR INSERT
  WITH CHECK (
    app_role() = 'super_duper_admin'
    OR (
      org_id = app_org()
      AND (
        app_role() = 'super_admin'
        OR (app_role() <> 'admin_m' AND app_manages(assigned_to))
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
        OR (app_role() <> 'admin_m' AND app_manages(assigned_to))
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
        OR (app_role() <> 'admin_m' AND app_manages(assigned_to))
      )
    )
  );

-- --------------------
-- leads (org_id + lead_owner_id)
-- --------------------
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS leads_select ON public.leads;
DROP POLICY IF EXISTS leads_insert ON public.leads;
DROP POLICY IF EXISTS leads_update ON public.leads;
DROP POLICY IF EXISTS leads_delete ON public.leads;

CREATE POLICY leads_select ON public.leads
  FOR SELECT
  USING (
    app_role() = 'super_duper_admin'
    OR (
      org_id = app_org()
      AND (
        app_role() IN ('super_admin', 'admin_m')
        OR app_manages(lead_owner_id)
      )
    )
  );

CREATE POLICY leads_insert ON public.leads
  FOR INSERT
  WITH CHECK (
    app_role() = 'super_duper_admin'
    OR (
      org_id = app_org()
      AND (
        app_role() = 'super_admin'
        OR (app_role() <> 'admin_m' AND app_manages(lead_owner_id))
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
        OR (app_role() <> 'admin_m' AND app_manages(lead_owner_id))
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
        OR (app_role() <> 'admin_m' AND app_manages(lead_owner_id))
      )
    )
  );

-- --------------------
-- opportunities (org_id + owner_id)
-- --------------------
ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS opportunities_select ON public.opportunities;
DROP POLICY IF EXISTS opportunities_insert ON public.opportunities;
DROP POLICY IF EXISTS opportunities_update ON public.opportunities;
DROP POLICY IF EXISTS opportunities_delete ON public.opportunities;

CREATE POLICY opportunities_select ON public.opportunities
  FOR SELECT
  USING (
    app_role() = 'super_duper_admin'
    OR (
      org_id = app_org()
      AND (
        app_role() IN ('super_admin', 'admin_m')
        OR app_manages(owner_id)
      )
    )
  );

CREATE POLICY opportunities_insert ON public.opportunities
  FOR INSERT
  WITH CHECK (
    app_role() = 'super_duper_admin'
    OR (
      org_id = app_org()
      AND (
        app_role() = 'super_admin'
        OR (app_role() <> 'admin_m' AND app_manages(owner_id))
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
        OR (app_role() <> 'admin_m' AND app_manages(owner_id))
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
        OR (app_role() <> 'admin_m' AND app_manages(owner_id))
      )
    )
  );

-- --------------------
-- tasks (org_id + assignee_id)
-- --------------------
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tasks_select ON public.tasks;
DROP POLICY IF EXISTS tasks_insert ON public.tasks;
DROP POLICY IF EXISTS tasks_update ON public.tasks;
DROP POLICY IF EXISTS tasks_delete ON public.tasks;

CREATE POLICY tasks_select ON public.tasks
  FOR SELECT
  USING (
    app_role() = 'super_duper_admin'
    OR (
      org_id = app_org()
      AND (
        app_role() IN ('super_admin', 'admin_m')
        OR app_manages(assignee_id)
      )
    )
  );

CREATE POLICY tasks_insert ON public.tasks
  FOR INSERT
  WITH CHECK (
    app_role() = 'super_duper_admin'
    OR (
      org_id = app_org()
      AND (
        app_role() = 'super_admin'
        OR (app_role() <> 'admin_m' AND app_manages(assignee_id))
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
        OR (app_role() <> 'admin_m' AND app_manages(assignee_id))
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
        OR (app_role() <> 'admin_m' AND app_manages(assignee_id))
      )
    )
  );

-- --------------------
-- weekly_reports (org_id + user_id)
-- --------------------
ALTER TABLE public.weekly_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS weekly_reports_select ON public.weekly_reports;
DROP POLICY IF EXISTS weekly_reports_insert ON public.weekly_reports;
DROP POLICY IF EXISTS weekly_reports_update ON public.weekly_reports;
DROP POLICY IF EXISTS weekly_reports_delete ON public.weekly_reports;

CREATE POLICY weekly_reports_select ON public.weekly_reports
  FOR SELECT
  USING (
    app_role() = 'super_duper_admin'
    OR (
      org_id = app_org()
      AND (
        app_role() IN ('super_admin', 'admin_m')
        OR app_manages(user_id)
      )
    )
  );

CREATE POLICY weekly_reports_insert ON public.weekly_reports
  FOR INSERT
  WITH CHECK (
    app_role() = 'super_duper_admin'
    OR (
      org_id = app_org()
      AND (
        app_role() = 'super_admin'
        OR (app_role() <> 'admin_m' AND app_manages(user_id))
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
        OR (app_role() <> 'admin_m' AND app_manages(user_id))
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
        OR (app_role() <> 'admin_m' AND app_manages(user_id))
      )
    )
  );

-- ============================================================================
-- SPECIAL CASES
-- ============================================================================

-- deal_states: child of deals, inherit access via deal_id foreign key
-- Users can access deal_states if they can access the parent deal
ALTER TABLE public.deal_states ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS deal_states_select ON public.deal_states;
DROP POLICY IF EXISTS deal_states_insert ON public.deal_states;
DROP POLICY IF EXISTS deal_states_update ON public.deal_states;
DROP POLICY IF EXISTS deal_states_delete ON public.deal_states;

CREATE POLICY deal_states_select ON public.deal_states
  FOR SELECT
  USING (
    app_role() = 'super_duper_admin'
    OR EXISTS (
      SELECT 1 FROM public.deals
      WHERE deals.id = deal_states.deal_id
      AND (
        deals.org_id = app_org()
        AND (
          app_role() IN ('super_admin', 'admin_m')
          OR app_manages(deals.assigned_to)
        )
      )
    )
  );

CREATE POLICY deal_states_insert ON public.deal_states
  FOR INSERT
  WITH CHECK (
    app_role() = 'super_duper_admin'
    OR EXISTS (
      SELECT 1 FROM public.deals
      WHERE deals.id = deal_states.deal_id
      AND (
        deals.org_id = app_org()
        AND (
          app_role() = 'super_admin'
          OR (app_role() <> 'admin_m' AND app_manages(deals.assigned_to))
        )
      )
    )
  );

CREATE POLICY deal_states_update ON public.deal_states
  FOR UPDATE
  USING (
    app_role() = 'super_duper_admin'
    OR EXISTS (
      SELECT 1 FROM public.deals
      WHERE deals.id = deal_states.deal_id
      AND (
        deals.org_id = app_org()
        AND (
          app_role() = 'super_admin'
          OR (app_role() <> 'admin_m' AND app_manages(deals.assigned_to))
        )
      )
    )
  );

CREATE POLICY deal_states_delete ON public.deal_states
  FOR DELETE
  USING (
    app_role() = 'super_duper_admin'
    OR EXISTS (
      SELECT 1 FROM public.deals
      WHERE deals.id = deal_states.deal_id
      AND (
        deals.org_id = app_org()
        AND (
          app_role() = 'super_admin'
          OR (app_role() <> 'admin_m' AND app_manages(deals.assigned_to))
        )
      )
    )
  );

-- sales_persons: legacy table, no org_id or owner
-- For now, allow all authenticated users to read; restrict write to super_duper_admin
-- TODO: migrate this table to use org_id or deprecate it
ALTER TABLE public.sales_persons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS sales_persons_select ON public.sales_persons;
DROP POLICY IF EXISTS sales_persons_insert ON public.sales_persons;
DROP POLICY IF EXISTS sales_persons_update ON public.sales_persons;
DROP POLICY IF EXISTS sales_persons_delete ON public.sales_persons;

CREATE POLICY sales_persons_select ON public.sales_persons
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY sales_persons_insert ON public.sales_persons
  FOR INSERT
  WITH CHECK (app_role() = 'super_duper_admin');

CREATE POLICY sales_persons_update ON public.sales_persons
  FOR UPDATE
  USING (app_role() = 'super_duper_admin');

CREATE POLICY sales_persons_delete ON public.sales_persons
  FOR DELETE
  USING (app_role() = 'super_duper_admin');

-- ============================================================================
-- SYSTEM TABLES (app_settings, configs)
-- ============================================================================

-- app_settings: global config, super_duper_admin only
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS app_settings_select ON public.app_settings;
DROP POLICY IF EXISTS app_settings_insert ON public.app_settings;
DROP POLICY IF EXISTS app_settings_update ON public.app_settings;
DROP POLICY IF EXISTS app_settings_delete ON public.app_settings;

CREATE POLICY app_settings_select ON public.app_settings
  FOR SELECT
  USING (app_role() = 'super_duper_admin');

CREATE POLICY app_settings_insert ON public.app_settings
  FOR INSERT
  WITH CHECK (app_role() = 'super_duper_admin');

CREATE POLICY app_settings_update ON public.app_settings
  FOR UPDATE
  USING (app_role() = 'super_duper_admin');

CREATE POLICY app_settings_delete ON public.app_settings
  FOR DELETE
  USING (app_role() = 'super_duper_admin');

-- configs: per-user settings (if it exists and has user_id/org_id, adjust as needed)
-- For now, assume it's a global lookup table accessible to all authenticated users
ALTER TABLE public.configs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS configs_select ON public.configs;

CREATE POLICY configs_select ON public.configs
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- ============================================================================
-- END OF 004_rbac.sql
-- ============================================================================
