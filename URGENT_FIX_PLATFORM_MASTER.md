# URGENT FIX: Platform Master User Missing

**Date**: 2026-06-20  
**Status**: CRITICAL - System cannot function without this  
**Issue**: muhammad.shaamel@gmail.com can login but has no user profile in database

---

## ROOT CAUSE

The UAT test failures are ALL caused by one issue:

**The `users` table is empty.** Muhammad can authenticate with Supabase Auth, but there's no corresponding record in the `public.users` table with `role='super_duper_admin'`.

When the master console tries to load:
```javascript
const { data: user } = await sb
  .from('users')
  .select('name, email, role')
  .eq('id', session.user.id)
  .single();
// Returns NULL because no user profile exists
```

This causes:
- ❌ "Loading Platform Master" forever (user.name is undefined)
- ❌ "Loading companies" forever (query fails silently)
- ❌ "Cannot read properties of undefined (reading 'auth')" (sb is undefined on admin.html)
- ❌ All other failures cascade from this

---

## IMMEDIATE FIX (5 minutes)

### Option A: Run SQL in Supabase Dashboard (RECOMMENDED)

1. **Go to Supabase SQL Editor**:
   https://supabase.com/dashboard/project/gokslnrvxqledagcwghq/sql

2. **Find Muhammad's auth UUID**:
   ```sql
   SELECT id, email, created_at
   FROM auth.users
   WHERE email = 'muhammad.shaamel@gmail.com';
   ```
   Copy the `id` (UUID format like `123e4567-e89b-12d3-a456-426614174000`)

3. **Create user profile** (replace `YOUR-UUID-HERE` with the ID from step 2):
   ```sql
   INSERT INTO public.users (
     id,
     email,
     name,
     role,
     org_id,
     manager_id,
     crm_enabled,
     is_active,
     account_type,
     created_at
   ) VALUES (
     'YOUR-UUID-HERE',  -- ⚠️ PASTE UUID FROM STEP 2 HERE
     'muhammad.shaamel@gmail.com',
     'Muhammad Shaamel',
     'super_duper_admin',
     NULL,
     NULL,
     true,
     true,
     'platform_master',
     NOW()
   );
   ```

4. **Verify it worked**:
   ```sql
   SELECT id, email, name, role, is_active
   FROM public.users
   WHERE email = 'muhammad.shaamel@gmail.com';
   ```
   Should show one row with `role = 'super_duper_admin'`

5. **Test immediately**:
   - Clear browser cache
   - Go to https://shaamelz.com/app/auth.html
   - Login as muhammad.shaamel@gmail.com
   - Should now work perfectly

---

### Option B: If Auth User Doesn't Exist Either

If step 2 above returns **no rows**, the auth user also doesn't exist. Create it:

1. **Go to Supabase Authentication**:
   https://supabase.com/dashboard/project/gokslnrvxqledagcwghq/auth/users

2. **Click "Add User" → "Create new user"**

3. **Fill form**:
   - Email: `muhammad.shaamel@gmail.com`
   - Password: `[choose a strong password]`
   - Auto Confirm: ✅ YES (check this box)
   - Click "Create user"

4. **Copy the generated UUID** from the users list

5. **Go back to Option A, step 3** and run the INSERT with this UUID

---

## WHY THIS HAPPENED

The Supabase project was likely reset or migrated, and the seed data wasn't re-applied. The schema tables exist (users, organisations, etc.) but they're empty.

**Normal flow**:
1. Create auth user in Supabase Auth dashboard
2. Create corresponding profile in `public.users` table
3. Both must exist for login to work

**What actually exists**:
- ✅ Schema (tables, columns, RLS policies)
- ✅ Auth user (muhammad.shaamel@gmail.com in `auth.users`)
- ❌ User profile (missing from `public.users`)

---

## AFTER THE FIX

Once the user profile exists, the master console will:

1. ✅ Show "Muhammad Shaamel" instead of "Loading Platform Master"
2. ✅ Load companies list (will be empty at first - normal)
3. ✅ "Pending Registrations" tab will work
4. ✅ "+ Provision New Company" will work
5. ✅ Sign out will work

---

## FILES CREATED

1. **`MANUAL_SEED_PLATFORM_MASTER.sql`** - Copy/paste SQL script
2. **`supabase/migrations/007_seed_platform_master.sql`** - Automated version (needs `supabase db push`)

---

## VERIFICATION CHECKLIST

After running the SQL:

- [ ] SQL query returned 1 row for muhammad.shaamel@gmail.com
- [ ] Role shows as `super_duper_admin`
- [ ] is_active shows as `true`
- [ ] Cleared browser cache
- [ ] Login works without "Loading Platform Master" stuck
- [ ] User badge shows "Muhammad Shaamel"
- [ ] Companies dropdown loads (shows empty state - normal)
- [ ] Tabs are clickable
- [ ] No console errors

---

## NEXT STEPS AFTER FIX

Once platform master exists:

1. ✅ Test Suite 1 (Super Duper Admin) - should ALL PASS
2. Create first company via "+ Provision New Company"
3. Test Suite 2 (Super Admin)
4. Continue UAT testing

---

## IF STILL FAILING AFTER THIS FIX

If the user profile exists but it's still failing:

1. **Check browser console** (F12 → Console tab)
2. **Look for errors** mentioning:
   - `auth` (authentication errors)
   - `from` (query errors)
   - `undefined` or `null` (data errors)
3. **Take screenshot** and share the exact error message
4. **Check Supabase logs**: https://supabase.com/dashboard/project/gokslnrvxqledagcwghq/logs/explorer

---

**This is the #1 blocker. Fix this first before any other testing.**
