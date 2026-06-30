# B2B Outreach Agent Integration Plan

**Date:** 2026-06-25  
**GitHub Repo:** https://github.com/shridharswaminathan1970/b2b-outreach-agent  
**New Supabase Project:** `esbadmmbwvdnjuhrbnse`  
**Main Project Supabase:** `gokslnrvxqledagcwghq`

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    IGNITE_APEX Platform                      │
│                 (Supabase: gokslnrvxqledagcwghq)            │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────┐  │
│  │  Sales OS    │  │     CRM      │  │  B2B Outreach   │  │
│  │              │  │              │  │                 │  │
│  │   FREE ✅    │  │ 99-day trial │  │  Paid Add-on    │  │
│  │              │  │  Then $9-30  │  │    +$6-12/mo    │  │
│  └──────────────┘  └──────────────┘  └─────────────────┘  │
│                                            │                 │
│                                            ▼                 │
│                    ┌──────────────────────────────────┐    │
│                    │   B2B Outreach Agent Backend     │    │
│                    │  (Supabase: esbadmmbwvdnjuhrbnse)│    │
│                    │                                  │    │
│                    │  - Node.js + Express + TypeScript│    │
│                    │  - React Frontend (Vite)         │    │
│                    │  - BullMQ + Redis (workers)      │    │
│                    │  - Resend (email delivery)       │    │
│                    │  - Apollo.io (enrichment)        │    │
│                    │  - Claude AI (personalization)   │    │
│                    └──────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

---

## Deployment Architecture

### Setup 1: IGNITE_APEX (Existing - Netlify)
- **URL:** https://shaamelz.com
- **Hosting:** Netlify
- **Database:** Supabase (`gokslnrvxqledagcwghq`)
- **Modules:**
  - `/` - Marketing site
  - `/app/` - Authentication & Admin
  - `/system/` - Sales OS
  - `/crm/` - CRM
  - `/pricing.html` - Pricing page

### Setup 2: B2B Outreach Agent (New)
- **URL:** https://b2b.shaamelz.com OR https://shaamelz.com/outreach
- **Hosting:** Netlify OR Render/Railway (for Node.js backend)
- **Database:** Supabase (`esbadmmbwvdnjuhrbnse`)
- **Services:**
  - `/outreach/` - React frontend
  - `/api/` - Express API backend
  - Background workers (BullMQ + Redis)

---

## Integration Points

### 1. Authentication (Shared SSO)
**Goal:** User logs in once, accesses all modules

**Implementation:**
- Main login happens at `shaamelz.com/app/auth.html`
- After login, JWT token stored in localStorage
- B2B Outreach Agent validates same JWT
- User records synced between both Supabase projects

**Code:**
```javascript
// In B2B Outreach Agent - validate IGNITE_APEX token
const { data: user } = await mainSupabase.auth.getUser(token);
if (user) {
  // Create/sync user in B2B database
  await b2bSupabase.from('users').upsert({
    id: user.id,
    email: user.email,
    // ... other fields
  });
}
```

### 2. Access Control (Subscription Gate)
**Goal:** Only users with `b2b_outreach_addon = true` can access

**Database Check:**
```sql
-- In main Supabase (gokslnrvxqledagcwghq)
SELECT 
  b2b_outreach_addon,
  status,
  plan
FROM org_subscriptions
WHERE org_id = (SELECT org_id FROM users WHERE id = $user_id)
  AND status = 'active'
  AND b2b_outreach_addon = true;
```

**Gate Implementation:**
```javascript
// At /outreach/index.html entry point
async function checkB2BAccess() {
  const { data: sub } = await mainSupabase
    .from('org_subscriptions')
    .select('b2b_outreach_addon, status')
    .eq('org_id', currentUser.org_id)
    .single();

  if (!sub || !sub.b2b_outreach_addon || sub.status !== 'active') {
    window.location.href = 'https://shaamelz.com/pricing.html?addon=b2b';
    return false;
  }
  return true;
}
```

### 3. CRM Data Sync (Bi-directional)
**Goal:** Leads/Contacts flow between CRM and B2B Outreach

**Push to B2B Outreach:**
```javascript
// When user exports leads from CRM to outreach
async function exportLeadToOutreach(leadId) {
  const { data: lead } = await mainSupabase
    .from('opportunities')
    .select('*, accounts(*), contacts(*)')
    .eq('id', leadId)
    .single();

  // Push to B2B Outreach API
  await fetch('https://b2b.shaamelz.com/api/leads/import', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: lead.contacts.name,
      email: lead.contacts.email,
      company: lead.accounts.name,
      // ... other fields
    })
  });
}
```

**Pull from B2B Outreach:**
```javascript
// When outreach agent creates activity, sync back to CRM
async function syncActivityToCRM(activityData) {
  await mainSupabase
    .from('activities')
    .insert({
      org_id: activityData.org_id,
      opportunity_id: activityData.crm_opportunity_id,
      type: 'email',
      subject: activityData.email_subject,
      notes: activityData.email_body,
      status: 'completed',
      created_at: activityData.sent_at
    });
}
```

### 4. Navigation (Unified Menu)
**Goal:** Seamless navigation between all 3 modules

**Add to CRM navigation:**
```html
<!-- In /crm/index.html topbar -->
<nav class="tb-nav">
  <a href="./index.html">Dashboard</a>
  <a href="./pipeline.html">Pipeline</a>
  <a href="./accounts.html">Accounts</a>
  <a href="./contacts.html">Contacts</a>
  
  <!-- B2B Outreach link (conditional) -->
  <a href="https://b2b.shaamelz.com" 
     id="b2b-nav-link" 
     style="display:none;color:var(--purple);font-weight:700">
    🚀 B2B Outreach
  </a>
</nav>

<script>
// Show link only if user has addon
const { data: sub } = await supabaseClient
  .from('org_subscriptions')
  .select('b2b_outreach_addon')
  .eq('org_id', currentUser.org_id)
  .single();

if (sub?.b2b_outreach_addon) {
  document.getElementById('b2b-nav-link').style.display = 'inline-block';
}
</script>
```

---

## Deployment Steps

### Phase 1: Set Up B2B Outreach Agent (Separate Deployment)

1. **Create new Supabase project** (Already done: `esbadmmbwvdnjuhrbnse`)
   - Run `SCHEMA.sql` to create tables
   - Set environment variables

2. **Deploy Backend API** (Recommend: Render.com or Railway.app)
   ```bash
   # Push to Render
   git remote add render <render-git-url>
   git push render main
   ```

3. **Deploy Frontend** (Recommend: Netlify subdomain)
   ```bash
   # Deploy to b2b.shaamelz.com
   netlify deploy --site=b2b-outreach --prod
   ```

4. **Set up Redis + Workers**
   - Use Render Redis addon OR Upstash (free tier)
   - Deploy worker service

### Phase 2: Integrate with IGNITE_APEX

5. **Add Access Gate**
   - Create `/outreach/index.html` landing page in main project
   - Gate checks `b2b_outreach_addon = true`
   - If false → redirect to pricing
   - If true → redirect to `https://b2b.shaamelz.com`

6. **Add Navigation Links**
   - Update CRM topbar to show B2B Outreach link (if addon enabled)
   - Update admin dashboard

7. **Sync User Authentication**
   - Share JWT tokens between projects
   - Create user sync webhook

8. **Enable CRM Sync**
   - Add "Export to Outreach" button in CRM contacts/leads
   - Webhook from B2B → CRM for activity sync

### Phase 3: Update Subscription Flow

9. **Update Pricing Page**
   - Already has B2B addon pricing
   - Make "Subscribe with B2B" buttons functional

10. **Update Paddle Checkout**
    - Add B2B addon product IDs
    - On successful payment, set `b2b_outreach_addon = true`

---

## Environment Variables Needed

### B2B Outreach Agent (.env)
```env
# Database
DATABASE_URL=postgresql://postgres:[password]@db.esbadmmbwvdnjuhrbnse.supabase.co:5432/postgres
REDIS_URL=redis://...

# Auth (from main IGNITE_APEX)
MAIN_SUPABASE_URL=https://gokslnrvxqledagcwghq.supabase.co
MAIN_SUPABASE_ANON_KEY=eyJhbGc...

# B2B Services
ANTHROPIC_API_KEY=sk-ant-api03-W3fLgUFq... (same as main)
RESEND_API_KEY=re_... (already have this)
APOLLO_API_KEY=... (need to get)
HUBSPOT_API_KEY=... (optional, can skip)

# Feature Flags
USE_MOCK_EMAIL=false
USE_MOCK_APOLLO=true (until you get API key)
```

---

## Access Control Logic

```
User Login
    ↓
Check crm_enabled?
    ├─ No → Redirect to Sales OS (free)
    └─ Yes → Continue
         ↓
    Check trial status
         ├─ Trial active → Allow CRM
         ├─ Trial expired < 150 days → Allow CRM + reminder
         ├─ Trial expired > 150 days → Block CRM
         └─ Subscription active → Allow CRM
              ↓
         Check b2b_outreach_addon?
              ├─ No → Hide B2B nav link
              └─ Yes → Show B2B nav link + allow access
```

---

## Implementation Checklist

### Backend (B2B Outreach Agent)
- [ ] Deploy to Render/Railway
- [ ] Connect to Supabase `esbadmmbwvdnjuhrbnse`
- [ ] Set up Redis (Upstash free tier)
- [ ] Deploy worker service
- [ ] Set environment variables
- [ ] Run migrations
- [ ] Seed initial data
- [ ] Test API endpoints

### Frontend (B2B Outreach)
- [ ] Build React app (`npm run build`)
- [ ] Deploy to Netlify subdomain
- [ ] Configure custom domain: `b2b.shaamelz.com`
- [ ] Test authentication flow
- [ ] Test access gate

### Integration (IGNITE_APEX)
- [ ] Add B2B nav link to CRM (conditional)
- [ ] Add B2B nav link to admin dashboard
- [ ] Create `/outreach/` landing page with gate
- [ ] Add "Export to Outreach" in CRM contacts
- [ ] Set up webhook for activity sync
- [ ] Test end-to-end flow

### Subscription
- [ ] Get Paddle account
- [ ] Create B2B addon products in Paddle
- [ ] Update checkout.html with addon product IDs
- [ ] Test subscription flow
- [ ] Verify addon flag gets set correctly

---

## Timeline Estimate

- **Phase 1 (B2B Setup):** 1-2 days
- **Phase 2 (Integration):** 1 day
- **Phase 3 (Subscription):** 1 day
- **Testing:** 1 day

**Total:** 4-5 days

---

## Next Steps

1. ✅ Confirm B2B Outreach Agent should be deployed separately
2. ⏳ Choose hosting for Node.js backend (Render? Railway?)
3. ⏳ Get Apollo.io API key (for lead enrichment)
4. ⏳ Deploy B2B Outreach Agent to new Supabase project
5. ⏳ Integrate with main IGNITE_APEX system
6. ⏳ Update pricing/checkout flow

**Ready to proceed?** Let me know and I'll start the integration!
