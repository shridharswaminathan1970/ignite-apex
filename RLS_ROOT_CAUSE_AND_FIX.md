# RLS Login Issue - Root Cause & Permanent Fix

**Date:** 2026-07-01  
**Issue:** Users could not login - "Error loading user profile"  
**Status:** ✅ RESOLVED

---

## Root Cause (The REAL Problem)

**It was NOT an RLS policy issue.**

**The actual problem:** `auth.users.id` did not match `users.id`

### How Login Works
1. User logs in → Supabase Auth creates JWT token with `auth.users.id`
2. launcher.html queries: `SELECT * FROM users WHERE id = auth.uid()`
3. `auth.uid()` returns the ID from JWT token
4. If `users.id` != `auth.users.id` → query returns 0 rows
5. `.single()` expects 1 row → throws "Cannot coerce to single JSON object"

### Why IDs Didn't Match

**4 users had orphaned auth accounts:**
- `cazueluzeru@proton.me` - auth record but no users record
- `accountexecutive1@proton.me` - auth record but no users record  
- `harharmahadev_bond90@yahoo.com` - auth record but no users record
- `nirmal.pandey008@yahoo.com` - users record had OLD auth ID from June 29, but auth.users had NEW ID from June 30

**Root cause of orphans:**
1. `handle_new_auth_user()` trigger only creates users record IF user has org_id metadata (invited users)
2. Public signups have NO metadata → trigger creates placeholder with role='public'
3. `approve_individual_registration()` creates org but doesn't update the users record with correct auth.users.id
4. Users get stuck with no valid users record or mismatched IDs

---

## The Fix (Applied)

### Step 1: Fixed Nirmal's ID Mismatch
```sql
UPDATE users
SET id = 'd3191810-5e01-4483-96bc-61e0dec8a79d'
WHERE email = 'nirmal.pandey008@yahoo.com';
```

### Step 2: Created Users Records for 3 Orphaned Auth Accounts
```sql
-- For each orphaned auth.users record, created matching users table record
-- With same ID, assigned to org "NA", team "Team Alpha", role "sdr"
```

### Result
- ✅ All 17 users now have matching auth.users.id and users.id
- ✅ All users have org_id and team_id (except super_duper_admins - expected)
- ✅ All users can login successfully

---

## RLS Policies (Were Actually Correct)

The RLS policies on users table were FINE:

```sql
-- Policy 1: SELECT for authenticated users
CREATE POLICY "users_authenticated_select"
ON users FOR SELECT
TO authenticated
USING (true);

-- Policy 2: UPDATE self only
CREATE POLICY "users_self_update"
ON users FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Policy 3: Service role full access
CREATE POLICY "users_service_role_all"
ON users FOR ALL
TO service_role
USING (true)
WITH CHECK (true);
```

**These policies work correctly.** The problem was the data mismatch, not the policies.

---

## Permanent Prevention

### 1. Update handle_new_auth_user() Trigger

**Current behavior:** Only creates users record for invited users (with metadata)

**New behavior:** Always creates users record with matching ID

```sql
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Always create users record with matching ID
  INSERT INTO public.users (
    id,
    email,
    name,
    role,
    org_id,
    team_id,
    status,
    account_type
  )
  VALUES (
    NEW.id,  -- CRITICAL: Use auth.users.id
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'public'),  -- Placeholder until approved
    (NEW.raw_user_meta_data->>'org_id')::UUID,  -- NULL for public signups
    (NEW.raw_user_meta_data->>'team_id')::UUID,  -- NULL for public signups
    CASE 
      WHEN (NEW.raw_user_meta_data->>'org_id') IS NOT NULL THEN 'active'
      ELSE 'pending_approval'
    END,
    'company'
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;
```

### 2. Update approve_individual_registration()

**Current behavior:** Creates org but doesn't properly link to auth.users.id

**New behavior:** Uses existing auth.users.id and updates users record

```sql
CREATE OR REPLACE FUNCTION approve_individual_registration(request_id UUID)
RETURNS JSON AS $$
DECLARE
  req RECORD;
  org_uuid UUID;
  team_uuid UUID;
  auth_user_id UUID;
BEGIN
  SELECT * INTO req FROM registration_requests WHERE id = request_id AND status = 'pending';
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Request not found');
  END IF;

  -- Create org
  INSERT INTO organisations (name, slug, domain, status)
  VALUES (
    'NA',
    LOWER(REPLACE(req.email, '@', '_at_')) || '_' || SUBSTRING(MD5(req.email) FROM 1 FOR 8),
    LOWER(REPLACE(req.email, '@', '_at_')) || '.individual',
    'active'
  )
  RETURNING id INTO org_uuid;

  -- Create team
  INSERT INTO teams (name, org_id)
  VALUES ('Team Alpha', org_uuid)
  RETURNING id INTO team_uuid;

  -- Get auth.users.id
  SELECT id INTO auth_user_id FROM auth.users WHERE email = req.email;

  IF auth_user_id IS NOT NULL THEN
    -- Update existing users record (created by trigger)
    UPDATE users
    SET
      org_id = org_uuid,
      team_id = team_uuid,
      role = 'sdr',
      status = 'active',
      crm_enabled = true
    WHERE id = auth_user_id;  -- CRITICAL: Use auth.users.id
  END IF;

  -- Create subscription
  INSERT INTO org_subscriptions (org_id, status, plan, billing_cycle, max_users, crm_enabled, b2b0_enabled)
  VALUES (org_uuid, 'free', 'team_mini', 'monthly', 1, false, false);

  -- Update request
  UPDATE registration_requests
  SET status = 'approved', approved_at = now(), approved_by = auth.uid()
  WHERE id = request_id;

  RETURN json_build_object('success', true, 'email', req.email, 'org_id', org_uuid);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 3. Monitoring Script (Run Hourly)

```sql
-- Find and auto-fix orphaned auth users
-- Add this to monitor-rls Edge Function or create new cron job

DO $$
DECLARE
  orphan_count INT;
  default_org_id UUID;
  default_team_id UUID;
BEGIN
  -- Count orphans
  SELECT COUNT(*) INTO orphan_count
  FROM auth.users au
  LEFT JOIN users u ON au.id = u.id
  WHERE u.id IS NULL;

  IF orphan_count > 0 THEN
    -- Get default org/team
    SELECT id INTO default_org_id FROM organisations WHERE slug = 'na';
    SELECT id INTO default_team_id FROM teams WHERE org_id = default_org_id LIMIT 1;

    -- Fix orphans
    INSERT INTO users (id, email, name, role, org_id, team_id, status, crm_enabled, account_type)
    SELECT 
      au.id,
      au.email,
      COALESCE(au.raw_user_meta_data->>'name', split_part(au.email, '@', 1)),
      'sdr',
      default_org_id,
      default_team_id,
      'active',
      true,
      'company'
    FROM auth.users au
    LEFT JOIN users u ON au.id = u.id
    WHERE u.id IS NULL;

    RAISE NOTICE 'Fixed % orphaned users', orphan_count;
  END IF;
END $$;
```

---

## Lessons Learned

### What We Did Wrong Initially

1. **Assumed RLS was the problem** without checking if IDs matched
2. **Created multiple "fixes"** without verifying the actual issue
3. **Didn't check auth.users.id vs users.id** as first diagnostic step
4. **Fixed symptoms (policies) instead of root cause (ID mismatch)**

### Correct Diagnostic Order

1. ✅ Check if user record exists in both auth.users AND users table
2. ✅ Check if IDs match between auth.users and users
3. ✅ Check RLS policies only after confirming IDs match
4. ✅ Test as authenticated role to verify policies work
5. ✅ Fix root cause, not symptoms

### Key Principle

**"Cannot coerce to single JSON object" = query returned 0 or 2+ rows**

Always check:
1. Does the record exist? (0 rows = missing data)
2. Is there a duplicate? (2+ rows = duplicate data)
3. Is RLS blocking it? (only check this AFTER confirming data exists)

---

## Testing Checklist

Before marking user login as "fixed":

- [x] SQL: Verify auth.users.id matches users.id for test user
- [x] SQL: Check no orphaned auth users exist
- [x] SQL: Verify RLS policies exist and are correct
- [x] Browser: Test user can login successfully
- [x] Browser: Test reaches launcher.html without errors
- [x] Browser: Test different user also works
- [x] Browser: Test in incognito/private window
- [x] SQL: Verify anonymous role blocked (security check)

---

## Files Changed

1. ✅ Created RLS_ROOT_CAUSE_AND_FIX.md (this document)
2. ⏳ Need to apply: Updated handle_new_auth_user() trigger
3. ⏳ Need to apply: Updated approve_individual_registration() function
4. ⏳ Need to apply: Add orphan monitoring to cron

---

**Status:** All users can login now ✅  
**Next:** Apply permanent prevention measures to avoid future ID mismatches
