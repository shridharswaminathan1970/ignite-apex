-- AUTO-RESTORE RLS: Run this to ensure all tables have RLS enabled
-- Use this if you suspect tables were accidentally disabled
-- Safe to run repeatedly (idempotent)

-- ===================================================================
-- PART 1: DIAGNOSTIC CHECK
-- ===================================================================

-- Check current RLS status
SELECT
  tablename,
  CASE
    WHEN rowsecurity = true THEN '✅ ENABLED'
    ELSE '❌ DISABLED'
  END as rls_status
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- Count disabled tables
SELECT
  COUNT(*) FILTER (WHERE rowsecurity = false) as disabled_count,
  COUNT(*) FILTER (WHERE rowsecurity = true) as enabled_count,
  COUNT(*) as total_tables
FROM pg_tables
WHERE schemaname = 'public';


-- ===================================================================
-- PART 2: ENABLE RLS ON ALL TABLES
-- ===================================================================

-- Core tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE organisations ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;

-- CRM tables
ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

-- Task/Activity templates
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_templates ENABLE ROW LEVEL SECURITY;

-- Admin/Registration tables
ALTER TABLE registration_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_registration_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE b2b0_trial_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_invitations ENABLE ROW LEVEL SECURITY;

-- Subscription/Payment tables
ALTER TABLE org_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;

-- Reminder tables
ALTER TABLE subscription_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE trial_reminders_sent ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_reminders ENABLE ROW LEVEL SECURITY;

-- Settings/Config tables
ALTER TABLE configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE deal_states ENABLE ROW LEVEL SECURITY;

-- Support tables
ALTER TABLE sales_persons ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_reports ENABLE ROW LEVEL SECURITY;


-- ===================================================================
-- PART 3: VERIFY ALL TABLES NOW ENABLED
-- ===================================================================

SELECT
  tablename,
  CASE
    WHEN rowsecurity = true THEN '✅ ENABLED'
    ELSE '❌ STILL DISABLED (CHECK MANUALLY!)'
  END as rls_status
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- Final count
SELECT
  CASE
    WHEN COUNT(*) FILTER (WHERE rowsecurity = false) = 0
    THEN '✅ ALL TABLES HAVE RLS ENABLED'
    ELSE '⚠️ WARNING: ' || COUNT(*) FILTER (WHERE rowsecurity = false) || ' tables still disabled'
  END as final_status
FROM pg_tables
WHERE schemaname = 'public';


-- ===================================================================
-- PART 4: RESTORE CRITICAL POLICIES (if missing)
-- ===================================================================

-- Users table policies
DO $$
BEGIN
  -- Check if users_can_read_users exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'users' AND policyname = 'users_can_read_users'
  ) THEN
    CREATE POLICY "users_can_read_users"
    ON users FOR SELECT
    TO authenticated
    USING (true);
  END IF;

  -- Check if users_can_update_self exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'users' AND policyname = 'users_can_update_self'
  ) THEN
    CREATE POLICY "users_can_update_self"
    ON users FOR UPDATE
    TO authenticated
    USING (id = auth.uid());
  END IF;
END $$;

-- Organisations table policy
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'organisations' AND policyname = 'org_read_policy'
  ) THEN
    CREATE POLICY "org_read_policy"
    ON organisations FOR SELECT
    TO authenticated
    USING (true);
  END IF;
END $$;

-- Teams table policy
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'teams' AND policyname = 'teams_read_policy'
  ) THEN
    CREATE POLICY "teams_read_policy"
    ON teams FOR SELECT
    TO authenticated
    USING (true);
  END IF;
END $$;

-- Opportunities table policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'opportunities' AND policyname = 'opportunities_all'
  ) THEN
    CREATE POLICY "opportunities_all"
    ON opportunities FOR ALL
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM users u
        WHERE u.id = auth.uid()
        AND u.org_id = opportunities.org_id
      )
    );
  END IF;
END $$;

-- Accounts table policy
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'accounts' AND policyname = 'accounts_policy'
  ) THEN
    CREATE POLICY "accounts_policy"
    ON accounts FOR ALL
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM users u
        WHERE u.id = auth.uid()
        AND u.org_id = accounts.org_id
      )
    );
  END IF;
END $$;

-- Contacts table policy
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'contacts' AND policyname = 'contacts_policy'
  ) THEN
    CREATE POLICY "contacts_policy"
    ON contacts FOR ALL
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM users u
        WHERE u.id = auth.uid()
        AND u.org_id = contacts.org_id
      )
    );
  END IF;
END $$;

-- Sales persons table policy (no org_id column)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'sales_persons' AND policyname = 'sales_persons_select'
  ) THEN
    CREATE POLICY "sales_persons_select"
    ON sales_persons FOR SELECT
    TO authenticated
    USING (true);
  END IF;
END $$;


-- ===================================================================
-- FINAL STATUS
-- ===================================================================

SELECT '✅ RLS RESTORE COMPLETE' as status;

-- Show policy count per table
SELECT
  schemaname,
  tablename,
  COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY schemaname, tablename
ORDER BY tablename;
