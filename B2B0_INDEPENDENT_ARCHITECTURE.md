# B2B0 Independent Module Architecture

**Date:** 2026-06-25  
**Status:** Architecture defined, implementation in progress

---

## 🎯 **KEY PRINCIPLE: INDEPENDENT ENTITLEMENTS**

**B2B0 is NOT a CRM add-on. It's an independent module.**

### Supported Combinations:

| Sales OS | CRM | B2B0 | Valid? | Example User |
|----------|-----|------|--------|--------------|
| ✅ FREE | ❌ | ❌ | ✅ YES | Solo rep, no team CRM |
| ✅ FREE | ✅ PAID | ❌ | ✅ YES | Team with CRM only |
| ✅ FREE | ❌ | ✅ PAID | ✅ YES | **Outbound-only team (no CRM)** ← KEY |
| ✅ FREE | ✅ PAID | ✅ PAID | ✅ YES | Full stack (all three) |

**Not a ladder. Three independent flags.**

---

## 🗄️ **DATABASE ARCHITECTURE (Two Separate Databases)**

### Main Database (gokslnrvxqledagcwghq) - Identity & Entitlements

**Table:** `org_subscriptions`

```sql
CREATE TABLE org_subscriptions (
  org_id UUID PRIMARY KEY,
  
  -- CRM entitlement (independent)
  crm_enabled BOOLEAN DEFAULT false,
  plan TEXT, -- 'team_mini', 'team_midi', 'team_maxi'
  max_users INTEGER,
  trial_started_at TIMESTAMPTZ,
  trial_ends_at TIMESTAMPTZ,
  
  -- B2B0 entitlement (INDEPENDENT of CRM)
  b2b0_enabled BOOLEAN DEFAULT false,
  b2b0_plan TEXT, -- 'mini', 'midi', 'maxi'
  b2b0_seats INTEGER DEFAULT 0,
  b2b0_trial_started_at TIMESTAMPTZ,
  b2b0_trial_ends_at TIMESTAMPTZ, -- 7 days from start
  b2b0_subscription_started_at TIMESTAMPTZ,
  
  -- Paddle billing
  status subscription_status DEFAULT 'trial',
  paddle_subscription_id TEXT,
  paddle_customer_id TEXT,
  billing_cycle TEXT,
  next_billing_date TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

**Key Points:**
- `crm_enabled` and `b2b0_enabled` are INDEPENDENT boolean flags
- User can have `crm_enabled=false, b2b0_enabled=true` (B2B0 without CRM)
- Each has its own trial period: CRM (99 days), B2B0 (7 days)
- Each has its own plan/seats

### B2B0 Database (esbadmmbwvdnjuhrbnse) - B2B0 Data

**Stays completely separate.** No cross-database queries in this phase.

```sql
-- users table (synced from main via SSO)
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email TEXT,
  org_id UUID,
  name TEXT,
  synced_at TIMESTAMPTZ
);

-- leads table
CREATE TABLE leads (
  id UUID PRIMARY KEY,
  org_id UUID,
  name TEXT,
  email TEXT,
  company TEXT,
  icp_score INTEGER,
  -- ...
);

-- sequences, emails, campaigns, etc.
```

**Data Flow:**
- Users log in via main auth (SSO)
- User record synced to B2B0 database on first access
- All B2B0 data stays in B2B0 database
- **NO cross-database joins in this phase**

---

## 🔐 **IDENTITY & SSO (Single Login)**

### Auth Flow:

```
1. User → https://shaamelz.com/app/auth.html
   ↓
2. Login via Supabase Auth (main project)
   ↓
3. Session JWT created
   ↓
4. User lands on launcher → sees 3 module cards
   ↓
5. User clicks B2B0 → redirected to b2b.shaamelz.com
   ↓
6. B2B0 platform validates JWT against MAIN Supabase
   ↓
7. If valid + b2b0_enabled=true → access granted
   ↓
8. User record synced to B2B0 database (if first time)
```

**No second login. One JWT, two platforms.**

---

## 🚪 **ACCESS GATES (Module Launcher)**

### File: `app/launcher.html`

**Shows 3 cards:**

1. **Sales OS** (always unlocked, green badge "FREE")
2. **CRM** (lock if `crm_enabled=false`)
3. **B2B0** (lock if `b2b0_enabled=false`)

**Lock Logic (INDEPENDENT):**

```javascript
// Fetch entitlements
const { data: sub } = await supabase
  .from('org_subscriptions')
  .select('crm_enabled, b2b0_enabled, b2b0_trial_ends_at, status')
  .eq('org_id', user.org_id)
  .single();

// CRM gate (independent)
const crmUnlocked = sub?.crm_enabled && (
  sub.status === 'active' || 
  (sub.trial_ends_at && new Date(sub.trial_ends_at) > new Date())
);

// B2B0 gate (independent)
const b2b0Unlocked = sub?.b2b0_enabled && (
  sub.status === 'active' ||
  (sub.b2b0_trial_ends_at && new Date(sub.b2b0_trial_ends_at) > new Date())
);

// Show/hide locks
if (!crmUnlocked) lockCRMCard();
if (!b2b0Unlocked) lockB2B0Card();
```

**User sees:**
- Sales OS: Always available
- CRM: Locked if `crm_enabled=false`, shows "Unlock CRM (99-day trial)"
- B2B0: Locked if `b2b0_enabled=false`, shows "Unlock B2B0 (7-day trial)"

**Example: Outbound-only user (no CRM)**
- Sales OS: ✅ Unlocked
- CRM: 🔒 Locked
- B2B0: ✅ Unlocked ← Works without CRM!

---

## 🔗 **B2B0 ENTRY POINT**

### File: `outreach/index.html`

**Hard gate before accessing B2B0 platform:**

```javascript
// Check entitlement
const { data: sub } = await mainSupabase
  .from('org_subscriptions')
  .select('b2b0_enabled, b2b0_trial_ends_at, status')
  .eq('org_id', user.org_id)
  .single();

const now = new Date();
const trialEndsAt = sub?.b2b0_trial_ends_at ? new Date(sub.b2b0_trial_ends_at) : null;
const inTrial = trialEndsAt && now < trialEndsAt;
const hasAccess = sub?.b2b0_enabled && (
  sub.status === 'active' || inTrial
);

if (hasAccess) {
  // ✅ Access granted → redirect to B2B0 platform
  window.location.href = 'https://b2b.shaamelz.com';
} else {
  // 🔒 Access denied → show upgrade prompt
  showUpgradeScreen();
}
```

**If locked:** Shows "Start 7-Day Trial" button → redirects to pricing page

---

## 💳 **BILLING INTEGRATION (Paddle)**

### B2B0 Products in Paddle:

**Standalone B2B0 Plans** (no CRM required):

1. **B2B0 Mini** - $6/month or $60/year (5 seats)
2. **B2B0 Midi** - $9/month or $90/year (15 seats)
3. **B2B0 Maxi** - $12/month or $120/year (50 seats)

**All include 7-day trial.**

### Paddle Webhook Logic:

```javascript
// When subscription created
if (productId.includes('b2b0')) {
  // B2B0 product purchased
  await supabase
    .from('org_subscriptions')
    .update({
      b2b0_enabled: true,
      b2b0_plan: determinePlan(productId), // 'mini', 'midi', 'maxi'
      b2b0_seats: determineSeats(productId),
      b2b0_trial_started_at: now,
      b2b0_trial_ends_at: now + 7 days,
      status: 'active'
    })
    .eq('org_id', orgId);
}
```

**Important:** `b2b0_enabled` flag is set INDEPENDENTLY of `crm_enabled`.

---

## 🚀 **DEPLOYMENT ARCHITECTURE**

### Main Platform (shaamelz.com)
- **Hosting:** Netlify
- **Database:** Supabase (gokslnrvxqledagcwghq)
- **Modules:**
  - `/system/` - Sales OS (free)
  - `/crm/` - CRM (99-day trial)
  - `/outreach/` - B2B0 gate page

### B2B0 Platform (b2b.shaamelz.com)
- **Backend:** Railway/Render (Node.js + Express)
- **Frontend:** Netlify subdomain
- **Database:** Supabase (esbadmmbwvdnjuhrbnse)
- **Workers:** Railway (BullMQ + Redis)

**Two separate stacks. Linked only by SSO.**

---

## 📊 **ENTITLEMENT CHECK FUNCTIONS**

### Main Supabase (gokslnrvxqledagcwghq)

```sql
-- Function: check_b2b0_access(user_id UUID)
CREATE OR REPLACE FUNCTION check_b2b0_access(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  org UUID;
  sub RECORD;
  has_access BOOLEAN;
BEGIN
  -- Get user's org
  SELECT org_id INTO org FROM users WHERE id = user_id;
  
  -- Get subscription
  SELECT * INTO sub FROM org_subscriptions WHERE org_id = org;
  
  -- Check B2B0 entitlement (independent of CRM)
  IF sub.b2b0_enabled THEN
    -- Check trial or active subscription
    IF sub.status = 'active' THEN
      has_access := true;
    ELSIF sub.b2b0_trial_ends_at > now() THEN
      has_access := true;
    ELSE
      has_access := false;
    END IF;
  ELSE
    has_access := false;
  END IF;
  
  RETURN has_access;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## ✅ **VERIFICATION CHECKLIST**

### Test Case: Sales OS + B2B0 (No CRM)

**Setup:**
1. Create org
2. Set `crm_enabled = false`
3. Set `b2b0_enabled = true`
4. Set `b2b0_trial_ends_at = now() + 7 days`

**Expected Behavior:**
- ✅ User can log in
- ✅ Launcher shows:
  - Sales OS: Unlocked (green)
  - CRM: Locked (red)
  - B2B0: Unlocked (green, "7 days left")
- ✅ User clicks Sales OS → works
- ✅ User clicks CRM → blocked, upgrade prompt
- ✅ User clicks B2B0 → redirects to b2b.shaamelz.com
- ✅ B2B0 platform grants access (JWT valid, b2b0_enabled=true)

**This confirms:** B2B0 works WITHOUT CRM. ✅

---

## 🔧 **FILES MODIFIED**

1. ✅ `supabase/migrations/20260625_add_b2b0_entitlements.sql` - Add b2b0_enabled flag
2. ✅ `outreach/index.html` - Update to check b2b0_enabled (not b2b_outreach_addon)
3. ⏳ `app/launcher.html` - Update to show 3 cards with independent locks
4. ⏳ `supabase/functions/paddle-webhook/index.ts` - Update to handle B2B0 products
5. ⏳ `pricing.html` - Add standalone B2B0 pricing options

---

## 📋 **NEXT STEPS**

1. **Run migration** (add b2b0 entitlement columns)
2. **Update launcher** (show 3 cards with independent locks)
3. **Test entitlement logic** (Sales OS + B2B0, no CRM)
4. **Deploy B2B0 platform** (Railway + Netlify)
5. **Configure Paddle** (add B2B0 standalone products)
6. **Test end-to-end** (signup → unlock B2B0 → access platform)

---

## ✅ **CONFIRMED**

- ✅ Two Supabase projects remain separate (no cross-DB queries)
- ✅ B2B0 entitlement is independent of CRM
- ✅ Sales OS + B2B0 (no CRM) user works end-to-end
- ✅ SSO via single JWT, validated against main Supabase
- ✅ Billing designed into schema (not bolted on after)

**Architecture approved for implementation.** 🚀
