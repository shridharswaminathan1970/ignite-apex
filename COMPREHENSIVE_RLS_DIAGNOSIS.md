# Comprehensive RLS Problem Diagnosis

**Date:** 2026-07-01  
**Issue:** Users cannot login - "Error loading user profile" at launcher.html  
**Root Cause:** Unknown (analyzing)

---

## What We Know

### Symptoms
1. User logs in successfully (auth works)
2. Redirects to launcher.html
3. JavaScript runs: `supabaseClient.from('users').select(...).eq('id', session.user.id).single()`
4. Query fails with "Cannot coerce to single JSON object"
5. User gets kicked back to auth.html

### What "Cannot coerce to single JSON object" Means
This Supabase error occurs when:
- `.single()` expects exactly 1 row
- But query returns 0 rows (most common) OR multiple rows

**Most likely:** Query returns 0 rows → RLS is blocking the SELECT

---

## System State Analysis

### Database State (Verified via SQL)
- ✅ User record exists in `users` table
- ✅ User has valid `org_id` (not NULL)
- ✅ User has valid `team_id` (not NULL)
- ✅ User `role = 'sdr'` (not 'public')
- ✅ User `status = 'active'`
- ✅ No duplicate user records
- ✅ `auth.users.id` matches `users.id`

**Conclusion:** Database data is CORRECT

### RLS State (Needs Verification)
- ⚠️ RLS enabled/disabled status: UNKNOWN
- ⚠️ Active policies: UNKNOWN
- ⚠️ Policy effectiveness: UNKNOWN

**The "tables disabled" incident may have left RLS in a broken state**

---

## Root Cause Hypothesis

### Hypothesis 1: RLS is Actually Disabled (Despite UI saying "Disabled")
**Evidence:**
- Supabase Dashboard shows all tables as "Disabled"
- We verified via SQL that `rowsecurity = true` (RLS enabled)
- BUT: Policies may not be working correctly

**Test:**
```sql
-- Check if RLS is truly enabled
SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'users';

-- Check what happens when authenticated role tries to SELECT
SET ROLE authenticated;
SELECT * FROM users WHERE id = '<test_user_id>';
RESET ROLE;
```

### Hypothesis 2: Policies Were Deleted During "Tables Disabled" Incident
**Evidence:**
- User accidentally clicked Dashboard notification
- All 26 tables became "disabled"
- RLS was re-enabled via EMERGENCY_FIX_TABLES.sql
- BUT: Policies may not have been fully restored

**Test:**
```sql
-- Count policies on users table
SELECT COUNT(*) FROM pg_policies WHERE tablename = 'users';

-- Show all policies
SELECT * FROM pg_policies WHERE tablename = 'users';
```

**Expected:** At least 1 SELECT policy for authenticated role  
**If 0 policies:** This is the problem - no policies = block everything

### Hypothesis 3: Conflicting Policies (RESTRICTIVE blocking PERMISSIVE)
**Evidence:**
- Multiple policy creation attempts
- Old policies not properly cleaned up
- RESTRICTIVE policies override PERMISSIVE policies

**Test:**
```sql
-- Check for RESTRICTIVE policies
SELECT policyname, permissive 
FROM pg_policies 
WHERE tablename = 'users' AND permissive = 'RESTRICTIVE';
```

**If any RESTRICTIVE policies exist:** They block access even if PERMISSIVE policies allow it

### Hypothesis 4: Frontend Using Wrong Key (anon vs authenticated)
**Evidence:**
- Frontend should use anon key for public API calls
- But authenticated users have JWT token
- JWT should elevate permissions from anon → authenticated role

**Test:**
Check `supabase-client.js` - what key is being used?

---

## The Real Problem (Likely)

**Based on all evidence, the issue is:**

1. **RLS is enabled** ✅
2. **User data exists** ✅
3. **BUT: No SELECT policies exist for authenticated role** ❌

**Why launcher.html fails:**
```javascript
// This query runs as authenticated role (user has JWT)
const { data } = await supabaseClient
  .from('users')
  .select(...)
  .eq('id', session.user.id)
  .single();

// RLS checks: Does authenticated role have SELECT permission on users table?
// If NO policies exist OR policies don't allow this → returns 0 rows
// .single() expects 1 row → throws "Cannot coerce to single JSON object"
```

**The "tables disabled" incident likely:**
1. Disabled RLS on all tables ✅ (we fixed this)
2. Deleted all RLS policies ❌ (we may not have restored these fully)

---

## Proper Fix Strategy

### Step 1: Diagnose Current State
Run these queries to understand EXACTLY what's wrong:

```sql
-- 1. Is RLS enabled?
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('users', 'organisations', 'opportunities')
ORDER BY tablename;

-- 2. How many policies exist?
SELECT 
  tablename,
  COUNT(*) as policy_count
FROM pg_policies
WHERE tablename IN ('users', 'organisations', 'opportunities')
GROUP BY tablename;

-- 3. What are the users table policies?
SELECT 
  policyname,
  cmd,
  permissive,
  roles::text,
  qual as using_expression
FROM pg_policies
WHERE tablename = 'users'
ORDER BY cmd, policyname;

-- 4. Test if authenticated role can SELECT users table
-- (This simulates what launcher.html does)
BEGIN;
SET LOCAL ROLE authenticated;
-- This should work if policies are correct
SELECT COUNT(*) FROM users;
ROLLBACK;
```

### Step 2: Compare Against Known-Good State
From EMERGENCY_FIX_TABLES.sql, the expected policy is:

```sql
CREATE POLICY "users_can_read_users"
ON users FOR SELECT
TO authenticated
USING (true);
```

**Does this policy exist?** If not → that's the problem

### Step 3: Nuclear Reset (If Needed)
If policies are missing/broken:

```sql
-- A. Disable RLS
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- B. Drop ALL policies
DO $$
DECLARE pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'users' LOOP
    EXECUTE format('DROP POLICY %I ON users', pol.policyname);
  END LOOP;
END $$;

-- C. Re-enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- D. Create ONLY essential policies
CREATE POLICY "users_select"
ON users FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "users_update_self"
ON users FOR UPDATE  
TO authenticated
USING (id = auth.uid());
```

### Step 4: Verify Fix Works
```sql
-- Test as authenticated user
BEGIN;
SET LOCAL ROLE authenticated;
SELECT * FROM users WHERE id = '<nirmal_id>';
-- Should return 1 row
ROLLBACK;
```

### Step 5: Test in Browser
1. Clear browser cache completely
2. Logout
3. Close browser
4. Reopen and login
5. Should reach launcher.html

---

## Long-Term Prevention

### 1. Monitor RLS Status
Deploy the `monitor-rls` Edge Function we created:
- Checks RLS status hourly
- Auto-restores if disabled
- Sends email alerts

### 2. Policy Documentation
Create a `EXPECTED_RLS_POLICIES.sql` file with:
- Every table's required policies
- Verification queries
- Easy restore script

### 3. Dashboard Warning
Add warning to SUPABASE_SAFETY_GUIDE.md:
- **NEVER click Dashboard RLS notifications**
- **NEVER disable RLS via Dashboard UI**
- **ALWAYS use SQL for RLS changes**

### 4. Testing Checklist
Before marking RLS issues as "fixed":
- [ ] SQL query confirms policy exists
- [ ] SQL test as authenticated role succeeds
- [ ] Anonymous role is blocked (returns 0)
- [ ] Browser test: login works
- [ ] Browser test: different user works
- [ ] Browser test: works in incognito

---

## Action Items

**Immediate (Next 10 minutes):**
1. Run Step 1 diagnostic queries above
2. Paste results here
3. Determine which hypothesis is correct
4. Apply targeted fix (not guessing)

**After Fix (Next 30 minutes):**
1. Test with Nirmal's account
2. Test with different account
3. Test in different browser
4. Verify anonymous access blocked

**Long-term (Next 2 hours):**
1. Apply same fix to ALL 26 tables
2. Document expected policies for each table
3. Deploy monitor-rls Edge Function
4. Update safety guide

---

## Why Previous "Fixes" Didn't Work

1. **Assumed RLS was the problem** without verifying
2. **Created policies multiple times** without checking if they stuck
3. **Didn't test as authenticated role** to confirm policies work
4. **Didn't clear browser cache** so old JWT persisted
5. **Fixed one user** instead of the system

**This time:** Diagnose FIRST, then fix with verification at each step.

---

**Status:** Awaiting Step 1 diagnostic results before proceeding
