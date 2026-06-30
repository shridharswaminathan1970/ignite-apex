# IGNITE_APEX CRM - Deployment Checklist

## ✅ Pre-Deployment Checklist

### 1. Database Migration (Required - Do First!)

- [ ] Open Supabase Dashboard: https://supabase.com/dashboard
- [ ] Select project: `gokslnrvxqledagcwghq`
- [ ] Navigate to **SQL Editor**
- [ ] Open file: `C:\Projects\ignite-apex\supabase\migrations\002_crm_tables.sql`
- [ ] Copy entire file contents (Ctrl+A, Ctrl+C)
- [ ] Paste into SQL Editor
- [ ] Click **Run** button
- [ ] Verify success messages:
  - ✓ leads table created
  - ✓ activities table created  
  - ✓ tasks table created
  - ✓ deal_timeline table created
  - ✓ deals table enhanced with CRM columns
  - ✓ RLS policies applied to all tables
  - ✓ Indexes created for performance
  - ✓ Triggers set for auto-timestamps

### 2. Upload CRM Files to Netlify

Upload these files to your Netlify site (shaamelz.com):

**New `/crm` directory:**
```
crm/
├── index.html
├── leads.html
├── opportunities.html
├── tasks.html
├── crm-client.js
├── activity-logger.js
├── task-reminder.js
└── README.md
```

**Existing files (no changes needed):**
- `supabase-client.js` (already exists)
- `auth.js` (already exists)
- `app/index.html` (login page - already exists)

### 3. Test User Access

- [ ] Visit: https://shaamelz.com/app/index.html
- [ ] Create test account or login with existing account
- [ ] Verify role displays correctly (REP/MANAGER/ADMIN)

### 4. Test CRM Dashboard

- [ ] Visit: https://shaamelz.com/crm/index.html
- [ ] Should redirect to login if not authenticated
- [ ] After login, verify:
  - [ ] Dashboard loads without errors
  - [ ] Metrics show (even if 0)
  - [ ] Pipeline chart displays
  - [ ] Navigation works (Leads, Opportunities, Tasks)

### 5. Test Lead Management

- [ ] Click "Leads" in navigation
- [ ] Click "+ New Lead" button
- [ ] Fill in lead form:
  - Name: Test Lead
  - Company: Test Company
  - Source: Inbound
- [ ] Click "Create Lead"
- [ ] Verify lead appears in table
- [ ] Check Supabase → Table Editor → leads table
- [ ] Should see new record with your user as owner_id

### 6. Test Task Creation

- [ ] Click "Tasks" in navigation
- [ ] Click "+ New Task" button
- [ ] Fill in task form:
  - Subject: Test task
  - Priority: Normal
  - Due Date: Tomorrow
- [ ] Click "Create Task"
- [ ] Verify task appears in list
- [ ] Wait 5 minutes, verify reminder system initializes

### 7. Test Browser Notifications (Optional)

- [ ] When prompted, click "Allow" for notifications
- [ ] Create a task with reminder in 1 minute
- [ ] Wait 1 minute
- [ ] Should see browser notification popup

### 8. Test Role-Based Access

**As Rep:**
- [ ] Can only see own leads
- [ ] Can only see own tasks
- [ ] Can create leads/tasks

**As Manager** (if available):
- [ ] Can see all team leads
- [ ] Can see all team tasks
- [ ] Filters work (My/Team)

**As Admin** (if available):
- [ ] Can see all org data
- [ ] Can manage users (future feature)

---

## 🎯 Post-Deployment Verification

### Database Health Check

Run in Supabase SQL Editor:

```sql
-- Verify tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('leads', 'activities', 'tasks', 'deal_timeline')
ORDER BY table_name;

-- Should return 4 rows

-- Verify RLS is enabled
SELECT tablename, rowsecurity FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('leads', 'activities', 'tasks', 'deal_timeline');

-- All should show rowsecurity = true

-- Check for test data
SELECT 'leads' as table_name, count(*) as count FROM leads
UNION ALL
SELECT 'activities', count(*) FROM activities
UNION ALL
SELECT 'tasks', count(*) FROM tasks
UNION ALL
SELECT 'deal_timeline', count(*) FROM deal_timeline;
```

### Browser Console Check

Open browser Developer Tools (F12) → Console

Should see:
```
[IA] Supabase connected — org <uuid>, role <rep/manager/admin>
[CRM] CRM client loaded successfully
[ActivityLogger] Activity auto-logger loaded successfully
[TaskReminder] Task reminder system initialized
```

Should NOT see:
- ❌ "Not authenticated"
- ❌ "Permission denied"
- ❌ "RLS policy violation"
- ❌ JavaScript errors

---

## 🐛 Troubleshooting

### Error: "IAdb not found"
**Fix:** Ensure `supabase-client.js` loads BEFORE `crm-client.js`

### Error: "Permission denied" or "RLS policy"
**Fix:** 
1. Check user is logged in
2. Verify RLS policies ran in migration
3. Check org_id matches in users table

### Error: "Table does not exist"
**Fix:** Re-run migration 002_crm_tables.sql

### Tasks not showing in list
**Check:**
1. `assigned_to_id` matches current user
2. Filter is set to "All Tasks"
3. Check Supabase Table Editor → tasks table

### Notifications not working
**Check:**
1. Browser permission granted (chrome://settings/content/notifications)
2. Console shows "Task reminder system initialized"
3. Task has `reminder_date` set

### Activities not auto-logging
**Check:**
1. `activity-logger.js` loaded after `crm-client.js`
2. Functions call `ActivityLogger.logXXX()` methods
3. Check Supabase → activities table for entries

---

## 📋 Rollback Plan (If Needed)

If migration causes issues:

```sql
-- Remove CRM tables (WARNING: Deletes all CRM data!)
DROP TABLE IF EXISTS deal_timeline CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS activities CASCADE;
DROP TABLE IF EXISTS leads CASCADE;

-- Revert deals table changes
ALTER TABLE deals DROP COLUMN IF EXISTS converted_from_lead_id;
ALTER TABLE deals DROP COLUMN IF EXISTS sql_date;
ALTER TABLE deals DROP COLUMN IF EXISTS last_activity_date;
ALTER TABLE deals DROP COLUMN IF EXISTS next_task_date;
```

Then remove `/crm` folder from Netlify.

---

## ✅ Success Criteria

CRM is successfully deployed when:

- [x] All database tables created without errors
- [x] Dashboard loads and shows metrics
- [x] Can create leads and they appear in list
- [x] Can create tasks and they appear in list  
- [x] Role-based filtering works (rep sees own, manager sees team)
- [x] Task reminders initialize without errors
- [x] No JavaScript console errors
- [x] Navigation between pages works

---

## 📞 Support

If issues persist:
1. Check browser console for errors
2. Check Supabase logs (Dashboard → Logs)
3. Verify all files uploaded to Netlify
4. Review `crm/README.md` for detailed docs

## 🎉 Next Steps After Successful Deployment

1. **Create sample data** for testing workflows
2. **Train team** on lead creation and task management
3. **Set up email reminders** (requires backend service)
4. **Build detail pages** (optional enhancement)
5. **Customize for your workflow** (add fields, change stages)

---

**Date Created:** 2026-05-31  
**Migration Version:** 002  
**Status:** Ready for Deployment
