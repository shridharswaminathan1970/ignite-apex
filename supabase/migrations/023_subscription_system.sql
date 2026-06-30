-- 023_subscription_system.sql
-- Subscription, licensing, and trial tracking system

-- Create subscription_plans enum
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'subscription_plan') THEN
    CREATE TYPE subscription_plan AS ENUM ('free_trial', 'team_mini', 'team_midi', 'team_maxi');
  END IF;
END $$;

-- Create subscription_status enum
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'subscription_status') THEN
    CREATE TYPE subscription_status AS ENUM ('trial', 'active', 'past_due', 'expired', 'cancelled');
  END IF;
END $$;

-- Create payment_method enum
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_method') THEN
    CREATE TYPE payment_method AS ENUM ('paddle', 'stripe', 'manual_invoice');
  END IF;
END $$;

-- Organization subscriptions table
CREATE TABLE IF NOT EXISTS public.org_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,

  -- Subscription details
  plan subscription_plan NOT NULL DEFAULT 'free_trial',
  status subscription_status NOT NULL DEFAULT 'trial',

  -- Trial tracking
  trial_started_at TIMESTAMPTZ,
  trial_ends_at TIMESTAMPTZ,
  crm_first_accessed_at TIMESTAMPTZ,

  -- Paid subscription
  subscription_started_at TIMESTAMPTZ,
  subscription_ends_at TIMESTAMPTZ,
  billing_cycle TEXT, -- 'monthly' or 'yearly'

  -- Payment
  payment_method payment_method,
  paddle_subscription_id TEXT,
  stripe_subscription_id TEXT,

  -- Pricing
  base_price_monthly DECIMAL(10,2),
  base_price_yearly DECIMAL(10,2),
  b2b_outreach_addon BOOLEAN DEFAULT false,
  addon_price_monthly DECIMAL(10,2),
  addon_price_yearly DECIMAL(10,2),

  -- User limits
  max_users INTEGER NOT NULL DEFAULT 3,
  current_user_count INTEGER DEFAULT 0,

  -- Reminder tracking
  last_reminder_sent_at TIMESTAMPTZ,
  reminder_count INTEGER DEFAULT 0,
  login_count_since_trial_end INTEGER DEFAULT 0,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(org_id)
);

-- Payment transactions table (for manual invoicing and payment history)
CREATE TABLE IF NOT EXISTS public.payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES public.org_subscriptions(id) ON DELETE SET NULL,

  -- Transaction details
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  payment_method payment_method NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'paid', 'failed', 'refunded'

  -- External references
  paddle_transaction_id TEXT,
  stripe_payment_intent_id TEXT,
  invoice_number TEXT,

  -- Invoice details (for manual invoicing)
  invoice_pdf_url TEXT,
  invoice_due_date TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,

  -- Metadata
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Subscription reminder log
CREATE TABLE IF NOT EXISTS public.subscription_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES public.org_subscriptions(id) ON DELETE SET NULL,

  -- Reminder details
  reminder_type TEXT NOT NULL, -- 'trial_ending', 'trial_ended', 'payment_due', 'access_locked'
  sent_via TEXT NOT NULL, -- 'email', 'in_app', 'both'
  email_sent_to TEXT,

  -- Metadata
  sent_at TIMESTAMPTZ DEFAULT now(),
  dismissed_at TIMESTAMPTZ,
  action_taken TEXT -- 'subscribed', 'dismissed', 'contacted_admin', null
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_org_subscriptions_org_id ON public.org_subscriptions(org_id);
CREATE INDEX IF NOT EXISTS idx_org_subscriptions_status ON public.org_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_org_subscriptions_trial_ends ON public.org_subscriptions(trial_ends_at);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_org_id ON public.payment_transactions(org_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON public.payment_transactions(status);
CREATE INDEX IF NOT EXISTS idx_subscription_reminders_org_id ON public.subscription_reminders(org_id);

-- RLS Policies
ALTER TABLE public.org_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_reminders ENABLE ROW LEVEL SECURITY;

-- Users can view their org's subscription
CREATE POLICY "Users can view their org subscription"
  ON public.org_subscriptions FOR SELECT
  USING (org_id = (SELECT app_org()));

-- Only admins can update subscriptions
CREATE POLICY "Admins can manage subscriptions"
  ON public.org_subscriptions FOR ALL
  USING (
    org_id = (SELECT app_org()) AND
    (SELECT app_role()) IN ('super_duper_admin', 'super_admin', 'admin')
  );

-- Users can view their org's transactions
CREATE POLICY "Users can view their org transactions"
  ON public.payment_transactions FOR SELECT
  USING (org_id = (SELECT app_org()));

-- Users can view their org's reminders
CREATE POLICY "Users can view their org reminders"
  ON public.subscription_reminders FOR SELECT
  USING (org_id = (SELECT app_org()));

-- Function to initialize trial when CRM first accessed
CREATE OR REPLACE FUNCTION initialize_crm_trial(org_uuid UUID)
RETURNS VOID AS $$
BEGIN
  -- Check if subscription already exists
  IF EXISTS (SELECT 1 FROM public.org_subscriptions WHERE org_id = org_uuid) THEN
    -- Update CRM first access if not set
    UPDATE public.org_subscriptions
    SET
      crm_first_accessed_at = COALESCE(crm_first_accessed_at, now()),
      trial_started_at = COALESCE(trial_started_at, now()),
      trial_ends_at = COALESCE(trial_ends_at, now() + INTERVAL '99 days')
    WHERE org_id = org_uuid AND crm_first_accessed_at IS NULL;
  ELSE
    -- Create new subscription with trial
    INSERT INTO public.org_subscriptions (
      org_id,
      plan,
      status,
      trial_started_at,
      trial_ends_at,
      crm_first_accessed_at,
      max_users
    ) VALUES (
      org_uuid,
      'free_trial',
      'trial',
      now(),
      now() + INTERVAL '99 days',
      now(),
      3
    );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing function if exists (may have different return type)
DROP FUNCTION IF EXISTS can_access_crm(UUID);

-- Function to check if user can access CRM
CREATE OR REPLACE FUNCTION can_access_crm(user_id UUID)
RETURNS JSONB AS $$
DECLARE
  user_org UUID;
  sub RECORD;
  result JSONB;
BEGIN
  -- Get user's org
  SELECT org_id INTO user_org FROM public.users WHERE id = user_id;

  IF user_org IS NULL THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'reason', 'no_org',
      'message', 'User not assigned to organization'
    );
  END IF;

  -- Get subscription
  SELECT * INTO sub FROM public.org_subscriptions WHERE org_id = user_org;

  -- If no subscription, allow (Sales OS free, no CRM access tracking yet)
  IF sub IS NULL THEN
    RETURN jsonb_build_object(
      'allowed', true,
      'status', 'no_subscription',
      'message', 'Sales OS access (no CRM)'
    );
  END IF;

  -- Check if trial or paid subscription is active
  IF sub.status = 'trial' THEN
    IF now() < sub.trial_ends_at THEN
      RETURN jsonb_build_object(
        'allowed', true,
        'status', 'trial',
        'days_remaining', EXTRACT(DAY FROM (sub.trial_ends_at - now())),
        'trial_ends_at', sub.trial_ends_at,
        'message', 'CRM trial active'
      );
    ELSIF now() < sub.trial_ends_at + INTERVAL '51 days' THEN
      -- Grace period 105-150 days: show reminders but allow access
      RETURN jsonb_build_object(
        'allowed', true,
        'status', 'trial_expired_grace',
        'days_since_expiry', EXTRACT(DAY FROM (now() - sub.trial_ends_at)),
        'show_reminder', true,
        'message', 'Trial expired - please subscribe'
      );
    ELSE
      -- After 150 days: block access
      RETURN jsonb_build_object(
        'allowed', false,
        'status', 'trial_expired_blocked',
        'days_since_expiry', EXTRACT(DAY FROM (now() - sub.trial_ends_at)),
        'message', 'Trial expired. Contact admin to subscribe.'
      );
    END IF;
  ELSIF sub.status = 'active' THEN
    -- Check user count limit
    IF sub.current_user_count >= sub.max_users THEN
      RETURN jsonb_build_object(
        'allowed', false,
        'status', 'user_limit_reached',
        'max_users', sub.max_users,
        'message', 'User limit reached. Upgrade plan or remove users.'
      );
    END IF;

    RETURN jsonb_build_object(
      'allowed', true,
      'status', 'active',
      'plan', sub.plan,
      'message', 'CRM access active'
    );
  ELSE
    -- expired, cancelled, past_due
    RETURN jsonb_build_object(
      'allowed', false,
      'status', sub.status,
      'message', 'Subscription ' || sub.status || '. Please update payment.'
    );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to track login and increment counter
CREATE OR REPLACE FUNCTION track_crm_login(user_id UUID)
RETURNS VOID AS $$
DECLARE
  user_org UUID;
  sub RECORD;
BEGIN
  -- Get user's org
  SELECT org_id INTO user_org FROM public.users WHERE id = user_id;

  IF user_org IS NULL THEN
    RETURN;
  END IF;

  -- Get subscription
  SELECT * INTO sub FROM public.org_subscriptions WHERE org_id = user_org;

  IF sub IS NULL THEN
    -- Initialize trial on first CRM access
    PERFORM initialize_crm_trial(user_org);
    RETURN;
  END IF;

  -- If in grace period, increment login counter
  IF sub.status = 'trial' AND now() > sub.trial_ends_at THEN
    UPDATE public.org_subscriptions
    SET login_count_since_trial_end = login_count_since_trial_end + 1
    WHERE org_id = user_org;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON TABLE public.org_subscriptions IS 'Organization subscription plans and trial tracking';
COMMENT ON TABLE public.payment_transactions IS 'Payment history for subscriptions and invoices';
COMMENT ON TABLE public.subscription_reminders IS 'Log of subscription reminder notifications sent';
COMMENT ON FUNCTION initialize_crm_trial(UUID) IS 'Start 99-day CRM trial when org first accesses CRM';
COMMENT ON FUNCTION can_access_crm(UUID) IS 'Check if user can access CRM based on subscription status';
COMMENT ON FUNCTION track_crm_login(UUID) IS 'Track CRM login and increment counter for reminder logic';
