-- ============================================================
-- IGNITE_APEX — Migration 001: Initial Schema
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================================

-- ── EXTENSIONS ────────────────────────────────────────────────────────────────
-- gen_random_uuid() is built into Postgres 14+ (Supabase default).
-- pgcrypto is included for any future hashing needs.
CREATE EXTENSION IF NOT EXISTS pgcrypto;


-- ══════════════════════════════════════════════════════════════
-- TABLES
-- ══════════════════════════════════════════════════════════════

-- ── ORGANISATIONS ─────────────────────────────────────────────────────────────
-- One row per customer organisation. The slug is used in URLs and as a
-- human-readable identifier (e.g. "acme-corp").
CREATE TABLE IF NOT EXISTS public.organisations (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT        NOT NULL,
  slug        TEXT        NOT NULL,
  plan        TEXT        NOT NULL DEFAULT 'free'
                          CHECK (plan IN ('free', 'pro', 'enterprise')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT organisations_slug_unique UNIQUE (slug)
);

COMMENT ON TABLE  public.organisations        IS 'Customer organisations — one per tenant.';
COMMENT ON COLUMN public.organisations.slug   IS 'URL-safe unique identifier, e.g. acme-corp.';
COMMENT ON COLUMN public.organisations.plan   IS 'Subscription tier: free | pro | enterprise.';


-- ── USERS ─────────────────────────────────────────────────────────────────────
-- Extends auth.users with org membership and role.
-- id FK → auth.users ensures this row is deleted when the auth account is deleted.
CREATE TABLE IF NOT EXISTS public.users (
  id          UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id      UUID        NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  email       TEXT        NOT NULL,
  name        TEXT,
  role        TEXT        NOT NULL DEFAULT 'rep'
                          CHECK (role IN ('admin', 'manager', 'rep')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE  public.users       IS 'User profiles — extends auth.users, scoped to one org.';
COMMENT ON COLUMN public.users.role  IS 'admin: full org control. manager: see all deals. rep: own deals only.';

CREATE INDEX IF NOT EXISTS idx_users_org_id ON public.users (org_id);


-- ── CONFIGS ───────────────────────────────────────────────────────────────────
-- One config row per organisation. Stores the product definition, 4U framework,
-- and all AI-generated content (questions, objections, prompts).
-- UNIQUE on org_id enforces the one-config-per-org rule; upsert uses this.
CREATE TABLE IF NOT EXISTS public.configs (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          UUID        NOT NULL UNIQUE
                              REFERENCES public.organisations(id) ON DELETE CASCADE,

  -- Core product identity
  product         TEXT,
  icp_name        TEXT,
  industry        TEXT,
  buyer_title     TEXT,
  competitors     TEXT,
  differentiator  TEXT,

  -- 4U Demand Framework
  unworkable      TEXT,
  unavoidable     TEXT,
  urgent          TEXT,
  underserved     TEXT,

  -- AI-generated qualification structures (JSONB arrays/objects)
  t1_questions    JSONB,   -- Tier 1 demand gate (5 questions)
  t2_questions    JSONB,   -- Tier 2 opportunity qualifier (10 questions)
  t3_questions    JSONB,   -- Tier 3 forecast commit gate (5 questions)
  objections      JSONB,   -- Objection handler scripts keyed by objection type
  layer_prompts   JSONB,   -- PROBE 3-layer diagnostic prompts
  opener          TEXT,    -- AI-generated reframe opener
  kpis            JSONB,   -- KPI metrics (payback_days, roi_multiple, etc.)
  ignite_scripts  JSONB,   -- IGNITE stage guidance text

  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.configs IS 'One product config per org. Contains 4U framework, qualification questions, and all AI content.';


-- ── DEALS ─────────────────────────────────────────────────────────────────────
-- One row per deal opportunity. Stores the scored metadata derived from the
-- full qualification state. The full state blob lives in deal_states.
CREATE TABLE IF NOT EXISTS public.deals (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id            UUID        NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  user_id           UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  -- Deal identity
  prospect          TEXT,

  -- Qualification outputs (system-derived, never rep-entered)
  verdict           TEXT,
  probability       INTEGER     DEFAULT 0 CHECK (probability BETWEEN 0 AND 100),
  forecast_category TEXT,       -- COMMIT | BEST CASE | PIPELINE+ | PIPELINE ONLY | DISQUALIFIED
  ignite_stage      TEXT,       -- Last confirmed IGNITE stage

  -- Tier scores
  t1_yes            SMALLINT    DEFAULT 0 CHECK (t1_yes BETWEEN 0 AND 5),
  t2_yes            SMALLINT    DEFAULT 0 CHECK (t2_yes BETWEEN 0 AND 10),
  t3_yes            SMALLINT    DEFAULT 0 CHECK (t3_yes BETWEEN 0 AND 5),

  -- Module scores
  icp_score         SMALLINT    DEFAULT 0 CHECK (icp_score BETWEEN 0 AND 100),
  cement_pct        SMALLINT    DEFAULT 0 CHECK (cement_pct BETWEEN 0 AND 100),

  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.deals IS 'Deal metadata derived from the qualification system. Full state in deal_states.';

CREATE INDEX IF NOT EXISTS idx_deals_org_id    ON public.deals (org_id);
CREATE INDEX IF NOT EXISTS idx_deals_user_id   ON public.deals (user_id);
CREATE INDEX IF NOT EXISTS idx_deals_org_user  ON public.deals (org_id, user_id);


-- ── DEAL_STATES ───────────────────────────────────────────────────────────────
-- Versioned snapshots of the full deal state (all textareas, checkbox states,
-- qualification answers, probe layers, etc.). One insert per save — the latest
-- row is the current state. Old rows provide change history.
CREATE TABLE IF NOT EXISTS public.deal_states (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id     UUID        NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  full_state  JSONB       NOT NULL,
  saved_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.deal_states IS 'Versioned full-state snapshots per deal. Latest row = current state.';

-- Index on (deal_id, saved_at DESC) makes "latest state" lookups fast.
CREATE INDEX IF NOT EXISTS idx_deal_states_deal_saved
  ON public.deal_states (deal_id, saved_at DESC);


-- ── WEEKLY_REPORTS ────────────────────────────────────────────────────────────
-- One row per rep per week. Stores the full weekly pipeline snapshot.
-- UNIQUE on (org_id, user_id, week_num, year) allows upsert.
CREATE TABLE IF NOT EXISTS public.weekly_reports (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      UUID        NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  user_id     UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  week_num    SMALLINT    NOT NULL CHECK (week_num BETWEEN 1 AND 53),
  year        SMALLINT    NOT NULL CHECK (year > 2020),
  data        JSONB       NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT weekly_reports_unique_week UNIQUE (org_id, user_id, week_num, year)
);

COMMENT ON TABLE public.weekly_reports IS 'Weekly pipeline snapshots per rep. Upsert on (org_id, user_id, week_num, year).';

CREATE INDEX IF NOT EXISTS idx_weekly_org_user
  ON public.weekly_reports (org_id, user_id, year DESC, week_num DESC);


-- ══════════════════════════════════════════════════════════════
-- TRIGGERS
-- ══════════════════════════════════════════════════════════════

-- ── UPDATED_AT auto-touch ─────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_configs_updated_at
  BEFORE UPDATE ON public.configs
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TRIGGER trg_deals_updated_at
  BEFORE UPDATE ON public.deals
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();


-- ── NEW AUTH USER → auto-create profile ──────────────────────────────────────
-- When an invited user signs up (org_id present in metadata), this trigger
-- immediately creates their profile row. For new admin signups (no org yet),
-- the client calls create_org_and_claim_admin() after auth.
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only auto-create profile if the signup carries an org_id in metadata
  -- (i.e. the user was invited to an existing org).
  IF (NEW.raw_user_meta_data ->> 'org_id') IS NOT NULL THEN
    INSERT INTO public.users (id, org_id, email, name, role)
    VALUES (
      NEW.id,
      (NEW.raw_user_meta_data ->> 'org_id')::UUID,
      NEW.email,
      COALESCE(
        NEW.raw_user_meta_data ->> 'name',
        split_part(NEW.email, '@', 1)
      ),
      COALESCE(NEW.raw_user_meta_data ->> 'role', 'rep')
    )
    ON CONFLICT (id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();


-- ══════════════════════════════════════════════════════════════
-- RLS HELPER FUNCTIONS
-- These are SECURITY DEFINER so they execute as the definer
-- (bypassing RLS on the users table) — this prevents infinite
-- recursion when RLS policies themselves query public.users.
-- ══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.my_org_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT org_id FROM public.users WHERE id = auth.uid() LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.my_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.users WHERE id = auth.uid() LIMIT 1
$$;


-- ══════════════════════════════════════════════════════════════
-- SIGNUP RPC
-- Called by auth.js immediately after supabase.auth.signUp()
-- to atomically create the organisation and admin user profile.
-- SECURITY DEFINER so it can write to both tables regardless of
-- who is calling — safe because it validates auth.uid() internally.
-- ══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.create_org_and_claim_admin(
  p_org_name  TEXT,
  p_slug      TEXT,
  p_name      TEXT DEFAULT NULL,
  p_email     TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org_id UUID;
BEGIN
  -- Must be called by an authenticated user
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Prevent duplicate org claims for the same auth user
  IF EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid()) THEN
    RAISE EXCEPTION 'User already has an organisation profile';
  END IF;

  -- Slug must be unique (the UNIQUE constraint will also enforce this,
  -- but a friendly error is nicer than a constraint violation)
  IF EXISTS (SELECT 1 FROM public.organisations WHERE slug = p_slug) THEN
    RAISE EXCEPTION 'Organisation slug "%" is already taken', p_slug;
  END IF;

  -- Create org
  INSERT INTO public.organisations (name, slug)
  VALUES (p_org_name, p_slug)
  RETURNING id INTO v_org_id;

  -- Create admin profile
  INSERT INTO public.users (id, org_id, email, name, role)
  VALUES (
    auth.uid(),
    v_org_id,
    COALESCE(p_email, ''),
    COALESCE(p_name, split_part(COALESCE(p_email, ''), '@', 1)),
    'admin'
  );

  RETURN jsonb_build_object(
    'org_id',  v_org_id,
    'role',    'admin',
    'email',   COALESCE(p_email, '')
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_org_and_claim_admin TO authenticated;


-- ══════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY
-- ══════════════════════════════════════════════════════════════

ALTER TABLE public.organisations   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.configs         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deals           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deal_states     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_reports  ENABLE ROW LEVEL SECURITY;


-- ── ORGANISATIONS ─────────────────────────────────────────────────────────────
-- Any org member can read their own org. No one can insert/update/delete
-- directly — use the create_org_and_claim_admin() RPC instead.
CREATE POLICY "org_members_read_own"
  ON public.organisations
  FOR SELECT
  USING (id = public.my_org_id());


-- ── USERS ─────────────────────────────────────────────────────────────────────
-- Any org member can read all profiles in their org (needed for manager views).
CREATE POLICY "users_read_same_org"
  ON public.users
  FOR SELECT
  USING (org_id = public.my_org_id());

-- Reps can update their own profile; managers/admins can update anyone in the org.
CREATE POLICY "users_update"
  ON public.users
  FOR UPDATE
  USING (
    id = auth.uid()
    OR (org_id = public.my_org_id() AND public.my_role() IN ('admin', 'manager'))
  );


-- ── CONFIGS ───────────────────────────────────────────────────────────────────
-- All org members can read. Only admins can write.
CREATE POLICY "configs_read_own_org"
  ON public.configs
  FOR SELECT
  USING (org_id = public.my_org_id());

CREATE POLICY "configs_insert_admin"
  ON public.configs
  FOR INSERT
  WITH CHECK (org_id = public.my_org_id() AND public.my_role() = 'admin');

CREATE POLICY "configs_update_admin"
  ON public.configs
  FOR UPDATE
  USING (org_id = public.my_org_id() AND public.my_role() = 'admin');


-- ── DEALS ─────────────────────────────────────────────────────────────────────
-- Reps see and edit only their own deals.
-- Managers and admins see all deals in their org, but only reps/admins can delete.
CREATE POLICY "deals_select"
  ON public.deals
  FOR SELECT
  USING (
    org_id = public.my_org_id()
    AND (
      user_id = auth.uid()
      OR public.my_role() IN ('manager', 'admin')
    )
  );

CREATE POLICY "deals_insert"
  ON public.deals
  FOR INSERT
  WITH CHECK (
    org_id = public.my_org_id()
    AND user_id = auth.uid()
  );

CREATE POLICY "deals_update"
  ON public.deals
  FOR UPDATE
  USING (
    org_id = public.my_org_id()
    AND (
      user_id = auth.uid()
      OR public.my_role() IN ('manager', 'admin')
    )
  );

CREATE POLICY "deals_delete"
  ON public.deals
  FOR DELETE
  USING (
    user_id = auth.uid()
    OR (org_id = public.my_org_id() AND public.my_role() = 'admin')
  );


-- ── DEAL_STATES ───────────────────────────────────────────────────────────────
-- Inherits the same visibility rules as the parent deal.
CREATE POLICY "deal_states_select"
  ON public.deal_states
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.deals d
      WHERE d.id = deal_id
        AND d.org_id = public.my_org_id()
        AND (
          d.user_id = auth.uid()
          OR public.my_role() IN ('manager', 'admin')
        )
    )
  );

CREATE POLICY "deal_states_insert"
  ON public.deal_states
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.deals d
      WHERE d.id = deal_id
        AND d.org_id = public.my_org_id()
        AND d.user_id = auth.uid()
    )
  );

CREATE POLICY "deal_states_delete"
  ON public.deal_states
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.deals d
      WHERE d.id = deal_id
        AND (
          d.user_id = auth.uid()
          OR (d.org_id = public.my_org_id() AND public.my_role() = 'admin')
        )
    )
  );


-- ── WEEKLY_REPORTS ────────────────────────────────────────────────────────────
-- Reps see and own only their own reports; managers/admins see all in the org.
CREATE POLICY "weekly_reports_select"
  ON public.weekly_reports
  FOR SELECT
  USING (
    org_id = public.my_org_id()
    AND (
      user_id = auth.uid()
      OR public.my_role() IN ('manager', 'admin')
    )
  );

CREATE POLICY "weekly_reports_insert"
  ON public.weekly_reports
  FOR INSERT
  WITH CHECK (
    org_id = public.my_org_id()
    AND user_id = auth.uid()
  );

CREATE POLICY "weekly_reports_update"
  ON public.weekly_reports
  FOR UPDATE
  USING (
    org_id = public.my_org_id()
    AND user_id = auth.uid()
  );


-- ══════════════════════════════════════════════════════════════
-- DONE
-- Verify with:
--   SELECT tablename, rowsecurity FROM pg_tables
--   WHERE schemaname = 'public';
-- ══════════════════════════════════════════════════════════════
