# IGNITE_APEX CRM

A full-featured CRM system built on the IGNITE_APEX sales methodology with Salesforce-like features.

## 🚀 Quick Start

### 1. Deploy Database (First Time Only)

1. Open [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **SQL Editor**
4. Open `../supabase/migrations/002_crm_tables.sql`
5. Copy the entire file contents
6. Paste into SQL Editor
7. Click **Run**

You should see success messages confirming all tables were created.

### 2. Access the CRM

Visit: `https://shaamelz.com/crm/index.html`

Or locally: `C:\Projects\ignite-apex\crm\index.html`

## 📁 File Structure

```
crm/
├── index.html              # Dashboard (pipeline, metrics, recent activity)
├── leads.html              # Lead management & list
├── opportunities.html      # Opportunity pipeline
├── tasks.html              # Task manager with reminders
├── crm-client.js           # Main CRM data layer
├── activity-logger.js      # Auto-activity logging
├── task-reminder.js        # Multi-channel reminders
└── README.md               # This file
```

## 🎯 Features

### Lead Management
- ✅ Create and track leads
- ✅ IGNITE stage progression (I1 → G → N → I2 → T → E)
- ✅ T1 Demand Gate qualification (4/5 to pass → MQL)
- ✅ Convert leads to opportunities
- ✅ Lead status tracking (open, working, nurture, mql, disqualified, converted)

### Opportunity Pipeline
- ✅ View all opportunities with filters
- ✅ Forecast categories (COMMIT, BEST CASE, PIPELINE+, PIPELINE ONLY)
- ✅ Hardcoded probabilities (90%, 65%, 40%, 20%)
- ✅ T2/T3 qualification tracking
- ✅ Stage progression through APEX

### Task Management
- ✅ Create tasks linked to leads/opportunities
- ✅ Priority levels (low, normal, high, urgent)
- ✅ Due dates and reminders
- ✅ Filter by: overdue, today, this week, completed
- ✅ One-click task completion
- ✅ Browser push notifications
- ✅ Badge counters on navigation

### Activity Tracking
- ✅ **Auto-logged** system events:
  - Lead stage changes
  - Lead conversions
  - Qualification results (T1, T2, T3)
  - Task completions
  - Deal verdict changes
- ✅ **Manual logging** for:
  - Calls, Emails, Meetings
  - Demos, Proposals
  - LinkedIn interactions, Notes

### Role-Based Access
- **Rep**: See own leads, opportunities, tasks
- **Manager**: See all team data
- **Admin**: See entire org + manage users

## 🔧 How It Works

### Script Load Order (All CRM Pages)

```html
<!-- Supabase -->
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js"></script>

<!-- Core -->
<script src="../supabase-client.js"></script>
<script src="../auth.js"></script>

<!-- CRM -->
<script src="./crm-client.js"></script>
<script src="./activity-logger.js"></script>
<script src="./task-reminder.js"></script>

<!-- Page-specific code -->
<script>
document.addEventListener('ia:ready', async (event) => {
  // Your page logic here
});
</script>
```

### Data Flow

1. **User logs in** → `auth.js` handles authentication
2. **Supabase connects** → `supabase-client.js` initializes
3. **CRM loads** → `crm-client.js` provides data methods
4. **Activities auto-log** → `activity-logger.js` tracks events
5. **Tasks remind** → `task-reminder.js` checks every 5 mins

## 📊 Database Tables

| Table | Purpose |
|-------|---------|
| `leads` | Lead contacts through IGNITE stages |
| `activities` | Activity log (calls, emails, system events) |
| `tasks` | Task management with reminders |
| `deal_timeline` | Audit trail for opportunities |
| `deals` | Opportunities (enhanced with CRM columns) |

## 🎨 Customization

### Add New Activity Types

Edit `crm-client.js`, line ~89:
```javascript
activity_type: TEXT NOT NULL 
  CHECK (activity_type IN ('call','email','meeting','demo','proposal','linkedin','note','system_event','YOUR_NEW_TYPE'))
```

### Change Task Reminder Frequency

Edit `task-reminder.js`, line ~52:
```javascript
// Current: check every 5 minutes
setInterval(() => this.checkReminders(), 5 * 60 * 1000);

// Change to 10 minutes:
setInterval(() => this.checkReminders(), 10 * 60 * 1000);
```

### Modify Pipeline Stages

IGNITE stages are hardcoded: `I1, G, N, I2, T, E`

To change, update:
1. Database: `002_crm_tables.sql` line 25
2. Frontend: Each page that displays stages

## 🐛 Troubleshooting

### "Not authenticated" error
- Ensure user is logged in via `/app/index.html`
- Check browser console for `[IA] Supabase connected` message

### Tasks not showing up
- Check RLS policies in Supabase Dashboard
- Verify `org_id` and `assigned_to_id` are set correctly

### Reminders not working
- Grant browser notification permission
- Check console for `[TaskReminder] Task reminder system initialized`

### Activities not auto-logging
- Ensure `activity-logger.js` is loaded AFTER `crm-client.js`
- Check that functions call `ActivityLogger.logXXX()` methods

## 📈 Next Steps

### Optional Enhancements
1. **Detail Pages**: Build individual lead/opportunity detail views
2. **Activity Timeline Component**: Reusable timeline for detail pages
3. **Advanced Filters**: Search by name, date range, custom fields
4. **Bulk Actions**: Assign multiple leads, update statuses
5. **Email Integration**: Auto-log emails from Gmail/Outlook
6. **Mobile Responsive**: Optimize for phone/tablet views

### Integration with IGNITE_APEX Methodology
The CRM is separate from the methodology pages (`/system`, `/configure`, etc.) but uses the same database.

- **Methodology pages**: Learn the framework, practice diagnosis
- **CRM pages**: Day-to-day sales operations

Both share the same user accounts and organizations.

## 📝 License

Part of IGNITE_APEX Sales Operating System
