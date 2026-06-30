-- 002_fix_configs_policies.sql
-- Fix configs table policies to use correct helper functions and enforce org-wide read, super_admin write

-- Drop old policies that use incorrect function names
DROP POLICY IF EXISTS configs_read_own_org ON public.configs;
DROP POLICY IF EXISTS configs_insert_admin ON public.configs;
DROP POLICY IF EXISTS configs_update_admin ON public.configs;
DROP POLICY IF EXISTS configs_delete ON public.configs;

-- configs: per-company settings
-- READ: org-wide (anyone in the org can read their org's config)
-- WRITE: super_duper_admin OR super_admin of the org
CREATE POLICY configs_select_v2 ON public.configs
  FOR SELECT
  USING (
    app_role() = 'super_duper_admin'
    OR org_id = app_org()
  );

CREATE POLICY configs_insert ON public.configs
  FOR INSERT
  WITH CHECK (
    app_role() = 'super_duper_admin'
    OR (org_id = app_org() AND app_role() = 'super_admin')
  );

CREATE POLICY configs_update ON public.configs
  FOR UPDATE
  USING (
    app_role() = 'super_duper_admin'
    OR (org_id = app_org() AND app_role() = 'super_admin')
  );

CREATE POLICY configs_delete ON public.configs
  FOR DELETE
  USING (
    app_role() = 'super_duper_admin'
    OR (org_id = app_org() AND app_role() = 'super_admin')
  );
