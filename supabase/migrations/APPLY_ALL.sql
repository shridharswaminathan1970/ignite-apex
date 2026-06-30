-- ========================================
-- CONSOLIDATED MIGRATION - APPLY ALL PENDING CHANGES
-- Run this in Supabase SQL Editor
-- Date: 2026-07-01
-- ========================================

-- 1. Add team_leader_id to teams table
ALTER TABLE teams ADD COLUMN IF NOT EXISTS team_leader_id UUID REFERENCES users(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_teams_team_leader ON teams(team_leader_id);

-- 2. Add B2B0 trial tracking columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS b2b0_trial_activated_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS b2b0_enabled BOOLEAN DEFAULT false;

-- 3. Ensure status column exists with proper check constraint
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='status') THEN
    ALTER TABLE users ADD COLUMN status TEXT DEFAULT 'active';
  END IF;
END $$;

ALTER TABLE users DROP CONSTRAINT IF EXISTS users_status_check;
ALTER TABLE users ADD CONSTRAINT users_status_check CHECK (status IN ('active', 'suspended', 'deactivated'));

-- 4. Create B2B0 trial requests table (if not exists)
CREATE TABLE IF NOT EXISTS b2b0_trial_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  requested_at TIMESTAMPTZ DEFAULT now(),
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_b2b0_requests_user ON b2b0_trial_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_b2b0_requests_status ON b2b0_trial_requests(status);

-- 5. Fix RLS policies on users table (drop strict SELECT policies)
DROP POLICY IF EXISTS "super_duper_admin_select_all" ON users;
DROP POLICY IF EXISTS "super_admin_select_org" ON users;
DROP POLICY IF EXISTS "admin_select_downline" ON users;
DROP POLICY IF EXISTS "admin_m_select_org" ON users;
DROP POLICY IF EXISTS "regular_user_select_self" ON users;
DROP POLICY IF EXISTS "Users can view own profile" ON users;

-- Create simple permissive SELECT policy
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'users'
    AND policyname = 'authenticated_can_select'
  ) THEN
    CREATE POLICY "authenticated_can_select"
    ON users FOR SELECT
    TO authenticated
    USING (true);
  END IF;
END $$;

-- 6. Ensure RLS is enabled on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE organisations ENABLE ROW LEVEL SECURITY;
ALTER TABLE registration_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE b2b0_trial_requests ENABLE ROW LEVEL SECURITY;

-- 7. Grant necessary permissions
GRANT SELECT ON users TO authenticated;
GRANT UPDATE ON users TO authenticated;
GRANT DELETE ON users TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON teams TO authenticated;
GRANT SELECT ON organisations TO authenticated;
GRANT SELECT, UPDATE ON registration_requests TO authenticated;
GRANT INSERT ON registration_requests TO anon, authenticated;

-- 8. Add helpful comments
COMMENT ON COLUMN teams.team_leader_id IS 'User ID of the team leader (super_admin or admin). Defaults to super_admin if not set.';
COMMENT ON COLUMN users.b2b0_trial_activated_at IS 'Timestamp when B2B0 trial started (7-day trial + 2-day grace = 9 days total)';
COMMENT ON COLUMN users.b2b0_enabled IS 'Whether B2B0 Outreach Agent is enabled for this user';
COMMENT ON COLUMN users.status IS 'User account status: active, suspended, or deactivated';

-- 9. Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';

-- ========================================
-- VERIFICATION QUERIES (run these after)
-- ========================================

-- Verify team_leader_id column exists
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name='teams' AND column_name='team_leader_id';

-- Verify B2B0 columns exist
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name='users' AND column_name IN ('b2b0_trial_activated_at', 'b2b0_enabled', 'status');

-- Check RLS policies on users
-- SELECT policyname, cmd FROM pg_policies WHERE tablename='users' ORDER BY cmd, policyname;

-- Verify b2b0_trial_requests table
-- SELECT table_name FROM information_schema.tables WHERE table_name='b2b0_trial_requests';

SELECT 'Migration completed successfully!' as status;
