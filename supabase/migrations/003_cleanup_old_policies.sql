-- 003_cleanup_old_policies.sql
-- Remove old policies created manually via dashboard

DROP POLICY IF EXISTS org_accounts ON public.accounts;
DROP POLICY IF EXISTS org_activities ON public.activities;
DROP POLICY IF EXISTS org_contacts ON public.contacts;
DROP POLICY IF EXISTS org_deals ON public.deals;
DROP POLICY IF EXISTS org_leads ON public.leads;
DROP POLICY IF EXISTS org_opportunities ON public.opportunities;
DROP POLICY IF EXISTS org_tasks ON public.tasks;
DROP POLICY IF EXISTS org_weekly_reports ON public.weekly_reports;
DROP POLICY IF EXISTS open_settings ON public.app_settings;
DROP POLICY IF EXISTS org_configs ON public.configs;
