# Supabase Safety Guide — Prevent Accidental Data Loss

**Date:** 2026-07-01  
**Incident:** All 26 tables accidentally disabled via Dashboard notification click  
**Status:** ✅ RECOVERED

---

## What Happened

**The Incident:**
- Supabase Dashboard showed a notification about RLS (Row Level Security)
- User clicked the notification (exact button unknown)
- **ALL 26 tables in ALL projects had RLS disabled instantly**
- This made all data inaccessible to users (RLS policies blocked access)

**Recovery:**
- Ran `EMERGENCY_FIX_TABLES.sql` to re-enable RLS on all tables
- Recreated all RLS policies
- Verified via SQL that RLS is enabled (Dashboard UI still showed "Disabled" due to cache)

---

## Supabase Dashboard Danger Zones

### 🔴 NEVER CLICK THESE (Without Reading Carefully)

**1. RLS Notifications/Banners**
- Location: Top of Dashboard, Database section
- Risk: May offer "Disable RLS" or "Apply to all tables"
- **Rule:** ALWAYS read the full text before clicking any button

**2. Table Settings → Row Level Security Toggle**
- Location: Each table's Settings tab
- Risk: One click disables all protection on that table
- **Rule:** Never disable RLS on production tables

**3. SQL Editor "Quick Actions"**
- Location: SQL Editor sidebar
- Risk: Pre-written queries that may include `ALTER TABLE ... DISABLE ROW LEVEL SECURITY`
- **Rule:** Read every line of SQL before executing

**4. Database Settings → RLS**
- Location: Settings → Database → Policies
- Risk: Bulk enable/disable options
- **Rule:** Treat this like `sudo rm -rf` — only use when certain

---

## Safe Operating Procedures

### ✅ DO:

1. **Work in Staging First**
   - Create a staging Supabase project
   - Test all changes there before touching production

2. **Use SQL for RLS Changes**
   - Write explicit SQL: `ALTER TABLE users ENABLE ROW LEVEL SECURITY;`
   - Review in PR before running
   - Keep migration files versioned in Git

3. **Read Before Clicking**
   - Supabase notifications are helpful but NEVER click without reading
   - If unsure, close the notification and check docs

4. **Verify Changes**
   ```sql
   -- Always verify RLS status after changes
   SELECT tablename, rowsecurity
   FROM pg_tables
   WHERE schemaname = 'public'
   ORDER BY tablename;
   ```

5. **Backup Regularly**
   - Supabase auto-backups daily (retained 7 days)
   - For critical changes, manually export before executing

### ❌ DON'T:

1. **Don't Use Dashboard Bulk Actions**
   - No "Apply to all tables"
   - No "Quick disable for testing"
   - Exception: Read-only operations (viewing data, logs)

2. **Don't Disable RLS "Just to Test"**
   - If you need to test without RLS, use `service_role` key in Edge Function
   - Never disable RLS on production tables

3. **Don't Click Notifications in Production**
   - Supabase shows many "helpful" prompts
   - They are designed for dev environments, dangerous in production

4. **Don't Work Tired/Distracted**
   - RLS changes = high-stakes operations
   - Only make changes when focused and alert

---

## Emergency Recovery Procedures

### If You Accidentally Disable RLS:

**Step 1: Don't Panic**
- Data is NOT deleted
- Users simply can't access it (RLS policies block them)

**Step 2: Verify What Happened**
```sql
-- Check which tables are affected
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND rowsecurity = false
ORDER BY tablename;
```

**Step 3: Re-enable RLS**
```sql
-- Template for one table
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;

-- For all tables, see EMERGENCY_FIX_TABLES.sql
```

**Step 4: Restore Policies**
- Check `supabase/migrations/` for policy definitions
- Or see `EMERGENCY_FIX_TABLES.sql` for reference policies

**Step 5: Test**
```sql
-- Verify RLS is back
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- All should show rowsecurity = true
```

**Step 6: Test User Access**
- Login as non-admin user
- Verify they can see their data
- Verify they CANNOT see other orgs' data

---

## Dashboard UI vs Reality ⚠️ CRITICAL KNOWLEDGE

**CONFIRMED BUG:** Supabase Dashboard shows "Disabled" even when RLS is fully enabled and working.

**Verified Incident (2026-07-01):**
- Dashboard showed ALL 26 tables as "Disabled"
- SQL query confirmed ALL 26 tables had `rowsecurity = true`
- All tables had active RLS policies (1-3 policies each)
- User testing confirmed cross-org access was BLOCKED (RLS working)
- **Conclusion:** Dashboard UI is cosmetic bug, database is secure

**Why This Happens:**
- Dashboard caches table metadata
- After bulk RLS operations (enable/disable), cache becomes stale
- Shows "Disabled" label despite RLS being ON in database
- Supabase is aware of this bug but hasn't fixed UI refresh logic

**How to Verify Truth (Run VERIFY_RLS_TRUTH.sql):**
```sql
-- This is the ONLY source of truth (not the Dashboard UI)
SELECT
  tablename,
  rowsecurity as rls_enabled,
  COUNT(p.policyname) as policy_count
FROM pg_tables t
LEFT JOIN pg_policies p ON p.tablename = t.tablename
WHERE t.schemaname = 'public'
GROUP BY t.tablename, t.rowsecurity
ORDER BY t.tablename;

-- rowsecurity = true + policy_count > 0 → FULLY PROTECTED ✅
-- rowsecurity = false → EXPOSED (fix immediately) ❌
```

**Expected Results (Your Production Database):**
- All 26 tables should show `rls_enabled = true`
- All 26 tables should have `policy_count >= 1`
- If SQL shows this → **YOU ARE SECURE** (ignore Dashboard label)

**Don't Trust:**
- ❌ Dashboard "Disabled" labels (cosmetic bug)
- ❌ Dashboard "Enable RLS" buttons (may re-enable what's already enabled)
- ❌ Dashboard Realtime column status

**Do Trust:**
- ✅ Raw SQL queries against `pg_tables` and `pg_policies`
- ✅ Actual user behavior testing (can they see cross-org data? No = RLS working)
- ✅ `VERIFY_RLS_TRUTH.sql` output

**How to Clear the "Disabled" Label (Optional, cosmetic only):**
1. Hard refresh browser: Ctrl+Shift+R (Windows) / Cmd+Shift+R (Mac)
2. Clear browser cache for supabase.com
3. Log out of Dashboard and log back in
4. **Or ignore it** — label doesn't affect actual security

---

## Access Control for Supabase Dashboard

**Who Should Have Dashboard Access:**

| Role | Access Level | Can Do | Cannot Do |
|------|-------------|--------|-----------|
| **super_duper_admin** | Owner | Everything | N/A |
| **Developers** | Admin (limited) | View logs, run read-only SQL | Disable RLS, delete tables, change auth settings |
| **SDRs/Users** | None | N/A | No Dashboard access |

**How to Limit:**
1. Supabase Dashboard → Settings → Team
2. Invite with specific roles (not Owner)
3. Use "Developer" role for read-only access
4. **Never share Owner credentials**

---

## Pre-Flight Checklist for Production Changes

Before running ANY SQL that includes `ALTER TABLE`, `DROP`, `DISABLE`, or `DELETE`:

- [ ] Change tested in staging environment
- [ ] SQL reviewed by second person (or AI assistant)
- [ ] Backup verified (or manual export taken)
- [ ] Maintenance window scheduled (if downtime possible)
- [ ] Rollback plan written
- [ ] Change documented in migration file
- [ ] Git commit created BEFORE running
- [ ] Ran in staging, verified success
- [ ] Actually read the SQL line-by-line (not skimmed)

**Only after ALL boxes checked → Run in production**

---

## Supabase CLI Safety

**Safe Commands:**
```bash
supabase status                    # Read-only
supabase db diff                   # Read-only
supabase functions list            # Read-only
supabase secrets list              # Read-only (shows digests, not values)
```

**Dangerous Commands (Read Prompts Carefully):**
```bash
supabase db reset                  # DESTRUCTIVE: drops all tables
supabase db push                   # Applies migrations (can break things)
supabase functions deploy          # Overwrites live function code
supabase secrets set               # Changes production secrets
```

**Before Running Dangerous Commands:**
1. Check current directory (`pwd` / `cd`)
2. Check which project is linked (`supabase status`)
3. Read the command's help (`--help`)
4. If unsure, ask first

---

## Training for New Team Members

**Before Giving Someone Supabase Access:**

1. **Have them read this document**
2. **Quiz them:**
   - "What happens if you disable RLS on the users table?"
   - "How do you verify RLS is enabled after a change?"
   - "Should you click Dashboard notifications in production?"
3. **Give staging access first**
   - Let them make mistakes in staging
   - Graduate to production only after demonstrating safety

**Red Flags to Watch For:**
- "I'll just quickly disable RLS to test this"
- "I don't know what this notification means but I'll click OK"
- Skipping the pre-flight checklist

---

## Additional Resources

- **Supabase RLS Docs:** https://supabase.com/docs/guides/auth/row-level-security
- **PostgreSQL RLS:** https://www.postgresql.org/docs/current/ddl-rowsecurity.html
- **Emergency Contacts:**
  - Supabase Support: https://supabase.com/dashboard/support
  - Super Duper Admin: muhammad.shaamel@gmail.com / shaamel@shaamelz.com

---

## Incident Log

| Date | Incident | Cause | Resolution | Prevention |
|------|----------|-------|------------|------------|
| 2026-07-01 | All 26 tables disabled | Clicked Dashboard RLS notification | Ran EMERGENCY_FIX_TABLES.sql | Created this safety guide |

---

**Remember:** Supabase is powerful. With great power comes great responsibility. When in doubt, ask. When tired, wait. When unsure, test in staging first.

**The 3-Second Rule:** Before clicking ANY button in Supabase Dashboard, pause for 3 seconds and read what it actually does.

---

**Status:** ✅ GUIDE COMPLETE  
**Last Updated:** 2026-07-01
