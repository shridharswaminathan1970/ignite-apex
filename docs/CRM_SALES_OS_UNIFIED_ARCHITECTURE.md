# CRM and Sales OS Unified Architecture

## CRITICAL: Not Two Separate Apps - Two Views of Same Data

### The Fundamental Architecture

**Sales OS** and **CRM** are **TWO LENSES** viewing the **SAME underlying data**:

```
┌─────────────────────────────────────────────────────┐
│           IGNITE-APEX Data Layer                    │
│  (Leads/Opportunities with IGNITE stages + fields)  │
└─────────────────────────────────────────────────────┘
           ↑                           ↑
           │                           │
    ┌──────┴──────┐           ┌───────┴────────┐
    │  Sales OS   │           │      CRM       │
    │  (Lens 1)   │           │    (Lens 2)    │
    └─────────────┘           └────────────────┘
```

### Sales OS Lens (IGNITE Framework View)

**Purpose**: Methodical, diagnostic-driven qualification

**Features**:
- IGNITE Diagnostic questionnaire (I-G-N-I-T-E scoring)
- 3-Tier Qualification Gates (T1, T2, T3)
- Structured progression through stages
- Educational/training mode
- Framework adherence

### CRM Lens (Pipeline Management View)

**Purpose**: Visual pipeline, team management, reporting

**Features**:
- **USES THE SAME IGNITE DATA** underneath
- Shows same leads/opportunities in traditional pipeline view
- Visual kanban boards (6 stages or IGNITE stages)
- Team dashboards with drill-down (3-4 levels)
- Forecasting and reports
- Admin/manager oversight

## Current Data Model Issues

### ❌ What's Wrong Now

1. **Separate data tables**: 
   - Sales OS has its own leads tracking
   - CRM has separate opportunities
   - **Data doesn't sync between them**

2. **No shared IGNITE fields**:
   - CRM doesn't have IGNITE diagnostic scores
   - Sales OS data isn't visible in CRM pipeline

3. **Duplicate work**:
   - User enters lead in Sales OS
   - Has to re-enter in CRM
   - No continuity

### ✅ What Needs to Be Built

1. **Unified Data Model**:
   ```sql
   -- Single table for all opportunities/leads
   CREATE TABLE opportunities (
     id UUID PRIMARY KEY,
     
     -- Basic fields
     company_name TEXT,
     contact_name TEXT,
     contact_email TEXT,
     value NUMERIC,
     
     -- IGNITE Diagnostic scores (from Sales OS)
     ignite_i_score TEXT, -- yes/partial/no
     ignite_g_score TEXT,
     ignite_n_score TEXT,
     ignite_i2_score TEXT,
     ignite_t_score TEXT,
     ignite_e_score TEXT,
     ignite_total_score INTEGER, -- 0-6
     
     -- Qualification tier (from IGNITE gates)
     qualification_tier TEXT, -- T1/T2/T3/Not Qualified
     
     -- Stage (unified - works for both views)
     stage TEXT, -- Lead/Qualified/Proposal/Negotiation/Closed
     ignite_stage TEXT, -- I/G/N/I2/T/E stages
     
     -- Traditional CRM fields
     pipeline_stage TEXT,
     probability INTEGER,
     close_date DATE,
     
     -- Assignment
     owner_id UUID REFERENCES users(id),
     team_id UUID REFERENCES teams(id),
     
     -- Tracking
     created_at TIMESTAMPTZ,
     updated_at TIMESTAMPTZ
   );
   ```

2. **Sales OS Creates → CRM Shows**:
   - User runs IGNITE diagnostic in Sales OS
   - Scores are saved to `opportunities` table
   - CRM dashboard **immediately shows** that opportunity
   - Manager can see IGNITE scores in CRM view

3. **CRM Updates → Sales OS Reflects**:
   - Manager moves opportunity in CRM pipeline
   - Stage updates in database
   - Sales OS shows updated stage when user returns

4. **Both Use IGNITE Framework**:
   - **CRM MUST show IGNITE diagnostic data**
   - Pipeline stages map to IGNITE stages
   - Reports show IGNITE qualification metrics
   - Dashboards drill down into IGNITE scoring

## Required Features in CRM (Currently Missing)

### 1. IGNITE Diagnostic View in CRM
- When viewing an opportunity, show IGNITE scores
- Display which gate (T1/T2/T3) it passed
- Show diagnostic breakdown (I-G-N-I-T-E individual scores)

### 2. Unified Pipeline Stages
- Traditional view: Lead → Qualified → Proposal → Negotiation → Closed
- IGNITE view: I → G → N → I2 → T → E stages
- **Toggle between views** or show both

### 3. Dashboard with Drill-Down (3-4 levels)
```
Level 1: Overall pipeline value by stage
  ↓ Click on stage
Level 2: Opportunities in that stage
  ↓ Click on opportunity
Level 3: Opportunity details + IGNITE scores
  ↓ Click on diagnostic
Level 4: Full IGNITE diagnostic breakdown
```

### 4. Team Reports Including IGNITE Metrics
- **Not just** "opportunities by stage"
- **Include**: "Avg IGNITE score by rep", "T1/T2/T3 pass rates", "Time in each IGNITE stage"

### 5. Forecasting Based on IGNITE Qualification
- T3 qualified = 80% probability
- T2 qualified = 50% probability
- T1 qualified = 20% probability
- Use IGNITE data to predict close rates

## Activities & Tasks System (Salesforce-Style)

### Required Throughout Entire Lifecycle

From **first contact** → through **all stages** → **Closed Won/Lost** → **Cement Phase** (post-sale), users need:

### Activities (Past/Completed Records)
**What**: Historical log of what happened with this opportunity

**Types**:
- 📞 **Calls** - phone calls made (date, duration, notes, outcome)
- 📧 **Emails** - emails sent (subject, body, when sent)
- 🤝 **Meetings** - meetings held (date, attendees, notes, outcomes)
- 📝 **Notes** - general notes/observations
- 📄 **Documents** - proposals sent, contracts signed
- 🎯 **IGNITE Diagnostics** - diagnostic sessions completed (if using IGNITE framework)

**Features**:
- Timeline view (chronological activity feed)
- Filter by type, date range, user
- Attach to opportunity/lead
- Link to contacts involved
- Export activity history

### Tasks (Future/Scheduled Items)
**What**: Pre-set actions that need to happen

**Types**:
- 📞 **Call Task** - "Call John on Friday to discuss pricing"
- 📧 **Email Task** - "Send proposal by end of week"
- 🤝 **Meeting Task** - "Schedule demo for next Tuesday"
- ✅ **Follow-up Task** - "Check in 2 weeks after trial starts"
- 📋 **Checklist Items** - "Get executive buy-in before proposal"

**Features**:
- Due dates with reminders
- Priority levels (High/Medium/Low)
- Assignment (assign task to team member)
- Status tracking (Not Started/In Progress/Completed/Cancelled)
- Recurring tasks (e.g., "Monthly check-in call")
- Task dependencies ("Cannot send contract until demo completed")
- Overdue alerts

### Activity & Task Data Model

```sql
-- Activities table (completed actions)
CREATE TABLE activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id UUID REFERENCES opportunities(id),
  contact_id UUID REFERENCES contacts(id),
  
  type TEXT NOT NULL, -- call/email/meeting/note/document
  subject TEXT,
  description TEXT,
  outcome TEXT, -- positive/neutral/negative/no-answer
  
  activity_date TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER, -- for calls/meetings
  
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tasks table (future actions)
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id UUID REFERENCES opportunities(id),
  contact_id UUID REFERENCES contacts(id),
  
  type TEXT NOT NULL, -- call/email/meeting/follow-up
  subject TEXT NOT NULL,
  description TEXT,
  
  due_date DATE,
  due_time TIME,
  priority TEXT DEFAULT 'medium', -- high/medium/low
  status TEXT DEFAULT 'not_started', -- not_started/in_progress/completed/cancelled
  
  assigned_to UUID REFERENCES users(id),
  created_by UUID REFERENCES users(id),
  
  is_recurring BOOLEAN DEFAULT false,
  recurrence_pattern TEXT, -- daily/weekly/monthly
  
  completed_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### Integration with Opportunity Stages

**At each stage**, prompt user to log activities and schedule next tasks:

**Example: IGNITE "N" Stage (Need + Urgency)**
- **Activity logged**: "Had call with VP Sales, confirmed Q4 budget cycle creates urgency"
- **Task created**: "Schedule follow-up demo with full exec team by end of month"

**Example: Traditional "Proposal" Stage**
- **Activity logged**: "Sent pricing proposal via email"
- **Task created**: "Follow up on proposal in 3 days if no response"

**Example: Cement Phase (Post-Sale)**
- **Activity logged**: "Onboarding kickoff meeting completed"
- **Task created**: "Monthly check-in call - first Friday of each month"

### UI Requirements

1. **Opportunity Detail Page** shows:
   - Activity Timeline (reverse chronological)
   - Open Tasks section (upcoming/overdue)
   - "Log Activity" button
   - "Create Task" button

2. **My Tasks Dashboard**:
   - Today's tasks
   - This week's tasks
   - Overdue tasks (red alert)
   - Completed tasks

3. **Activity Feed** (Team View):
   - See team's recent activities
   - Filter by rep, type, date
   - Manager oversight

4. **Task Reminders**:
   - Email reminders for upcoming tasks
   - In-app notifications
   - Mobile push notifications (future)

### Cement Phase Specifics

**What**: Post-sale relationship management to ensure customer success and prevent churn

**Activities**:
- Onboarding sessions
- Training calls
- Check-in meetings
- Issue resolution logs

**Tasks**:
- Quarterly business reviews (QBRs)
- Annual renewal reminders
- Upsell/cross-sell opportunities
- NPS survey follow-ups

## Implementation Priority

### Phase 1: Unify Data Model ✅ (CRITICAL - DO THIS FIRST)
- Create unified opportunities table with IGNITE fields
- Migrate Sales OS to use this table
- Migrate CRM to use this table

### Phase 2: CRM Shows IGNITE Data
- Add IGNITE score display to opportunity detail view
- Show qualification tier (T1/T2/T3) in pipeline cards
- Add IGNITE metrics to reports

### Phase 3: Interactive Dashboards
- Clickable charts with drill-down
- Filter by IGNITE scores
- Customizable views

### Phase 4: Advanced Forecasting
- IGNITE-based probability calculations
- Predictive close date based on stage velocity
- Team performance metrics using IGNITE data

## Key Principles

1. **One Source of Truth**: Single database table for opportunities
2. **IGNITE Everywhere**: Both Sales OS and CRM use IGNITE framework
3. **No Data Silos**: Changes in one view immediately visible in the other
4. **Manager Visibility**: CRM shows all IGNITE diagnostic data from Sales OS
5. **User Choice**: Let users pick which view (lens) they prefer

## Current Status

❌ **NOT IMPLEMENTED**: Still using separate data systems
⏳ **NEXT STEP**: Create unified opportunities table with IGNITE fields
📋 **AFTER THAT**: Update both Sales OS and CRM to use unified table

---

**This is the architecture that must be built.** Stop treating CRM and Sales OS as separate apps.
