# 📚 DOCUMENTATION UPDATE PLAN

**Date:** 2026-06-26  
**Purpose:** Update ALL onboarding guides to reflect ACTUAL built features (not aspirational)

---

## 🎯 **WHAT TO DOCUMENT (ACTUALLY BUILT)**

### **1. IGNITE-APEX Guidance Experience**

**✅ Built Features:**
- Roadmap rail with "You are here" indicator (`crm/opportunity.html`)
- Why-layer for each stage (shows value/purpose)
- Guiding questions under each gate
- STRONG vs WEAK examples for calibration
- AI coaching with draft-to-confirm (Claude API)
- IGNITE diagnostic chain: 4U → Peel the Onion → JTBD → 6 diagnostic checks

**Files:**
- `crm/opportunity.html` (lines 1-600+)
- `config/ignite-apex-config.json` (provisional content)
- `supabase/functions/ai-coaching/index.ts`

---

### **2. Methodology Choice**

**✅ Actually Implemented:**
- Default: IGNITE-APEX methodology (built-in)
- Alternative: Standard/BANT (basic qualification)
- Choice offered: NOT CURRENTLY - hardcoded to IGNITE-APEX
- Toggle location: NOT BUILT YET

**Current State:**
- System uses IGNITE-APEX by default
- No UI toggle to switch methodologies
- BANT fields exist in database but not used in UI

**⚠️ Update docs to reflect: IGNITE-APEX only (for now)**

---

### **3. Module Model**

**✅ Correct Module Structure:**

| Module | Access | Trial Period | After Trial |
|--------|--------|--------------|-------------|
| **Sales OS** | FREE forever | N/A | Always free |
| **CRM** | Must activate trial | 99 days | Requires paid subscription |
| **B2B0** | Must purchase | 7 days | Requires paid subscription |

**✅ Sign-Up Paths:**

**Path A: Individual Public User**
1. Register at `/app/register.html`
2. Super Duper Admin approves
3. Gets: Sales OS (free)
4. CRM: Locked until trial activated
5. B2B0: Locked until purchased

**Path B: Enterprise Company**
1. Register at `/app/register-company.html`
2. Super Duper Admin creates company
3. Company Super Admin manages users
4. All users get: Sales OS (free) + CRM access based on company subscription
5. B2B0: Optional add-on

**✅ Entitlement Combinations:**
- Sales OS only (free)
- Sales OS + CRM (99-day trial, then paid)
- Sales OS + B2B0 (NO CRM required!) ← KEY
- Sales OS + CRM + B2B0 (full stack)

---

### **4. Entitlement Locks & Upgrade Gates**

**✅ Sales OS:**
- Always unlocked
- No trial period
- No payment required
- Access: `/system/index.html`

**✅ CRM:**
- Locked by default after registration
- Must click "Activate CRM Trial" → `/app/activate-crm-trial.html`
- Trial starts → 99-day countdown
- Access check: `trial_started_at IS NOT NULL AND (crm_enabled = true OR trial_ends_at > now())`
- After trial: Redirected to `/pricing.html`
- Upgrade gate: Paddle checkout

**✅ B2B0:**
- Locked by default
- Must purchase via Paddle (no free trial in current flow)
- Access check: `b2b0_enabled = true AND (status = 'active' OR b2b0_trial_ends_at > now())`
- Gate page: `/outreach/index.html`
- Upgrade prompt: Links to pricing

---

## 📁 **FILES TO UPDATE**

### **1. docs/ACCESS_SPEC.md**

**Current Status:** May have outdated info

**Required Updates:**
- Module table (Sales OS, CRM, B2B0)
- Independent entitlements (`crm_enabled`, `b2b0_enabled`)
- Trial periods (99 days CRM, 7 days B2B0)
- Activation flow (manual activation required)
- Sales OS + B2B0 (no CRM) is valid

**Add Section:**
```markdown
## Module Entitlements

| Flag | Module | Trial | Activation |
|------|--------|-------|------------|
| Always on | Sales OS | N/A | Auto-granted |
| `crm_enabled` | CRM | 99 days | Manual activation |
| `b2b0_enabled` | B2B0 | 7 days | Paddle purchase |

### Valid Combinations
- ✅ Sales OS only
- ✅ Sales OS + CRM
- ✅ Sales OS + B2B0 (NO CRM)
- ✅ Sales OS + CRM + B2B0
```

---

### **2. docs/IGNITE-APEX_Content_Bank.md**

**Current Status:** Content library, may reference unbuilt features

**Required Updates:**
- Remove references to features NOT built
- Mark provisional content (6 IGNITE checks wording)
- Add B2B0 module description
- Update pricing structure
- Clarify trial activation process

**Add Sections:**
- B2B0 Module Features (gate page only, platform TBD)
- Trial Activation Flow (CRM manual activation)
- Reminder Schedule (Day 90, 120, 130, 140)

---

### **3. guide/index.html (In-App Guide)**

**Current Status:** Unknown - needs review

**Required Updates:**
- Add "Modules" section explaining Sales OS / CRM / B2B0
- Document CRM activation flow
- Explain independent entitlements
- Remove unbuilt features
- Link to pricing for upgrades

**Structure:**
```html
<section id="modules">
  <h2>Understanding Modules</h2>
  
  <h3>Sales OS (FREE Forever)</h3>
  <p>Always available, no trial, no payment...</p>
  
  <h3>CRM (99-Day Trial)</h3>
  <p>Must activate trial manually. Click "Activate CRM Trial"...</p>
  
  <h3>B2B0 (Paid Add-On)</h3>
  <p>Independent of CRM. Can have Sales OS + B2B0 without CRM...</p>
</section>
```

---

### **4. guide/IGNITE_APEX — New User Guide.pdf**

**Current Status:** PDF - cannot edit directly

**Action Required:**
- Create NEW markdown version: `guide/NEW_USER_GUIDE.md`
- Document ACTUAL features only
- Update sign-up paths
- Explain trial activation
- Mark provisional content

---

### **5. docs/CRM_SALES_OS_UNIFIED_ARCHITECTURE.md**

**Required Updates:**
- Confirm Sales OS is free forever
- Confirm CRM requires trial activation
- Add B2B0 as third independent module
- Update architecture diagram (if any)

---

## ⚠️ **PROVISIONAL CONTENT TO MARK**

**Mark these as PROVISIONAL (not final):**

1. **6 IGNITE Diagnostic Checks** (wording may change)
   - Location: `config/ignite-apex-config.json`
   - Mark: "⚠️ PROVISIONAL - Wording subject to refinement"

2. **AI Coaching Prompts** (may be tuned)
   - Location: `supabase/functions/ai-coaching/index.ts`
   - Mark: "⚠️ PROVISIONAL - Prompts being optimized"

3. **Peel the Onion Questions** (may be refined)
   - Location: `config/ignite-apex-config.json`
   - Mark: "⚠️ PROVISIONAL - Questions being validated"

4. **B2B0 Platform Features** (NOT BUILT YET)
   - Mark: "🚧 PLANNED - Not yet implemented"
   - Only document: Gate page, entitlement system, pricing

---

## ❌ **FEATURES TO REMOVE FROM DOCS**

**Do NOT document these (not built):**

1. ❌ Methodology toggle (IGNITE-APEX vs BANT) - no UI exists
2. ❌ B2B0 platform features (lead scoring, sequences, email) - not built
3. ❌ Automated trial reminders - system not deployed yet
4. ❌ Email notifications - email service not configured
5. ❌ Automatic trial start - trials require manual activation
6. ❌ Multi-methodology support - only IGNITE-APEX works

---

## ✅ **UPDATE CHECKLIST**

- [ ] Update `docs/ACCESS_SPEC.md` with module model
- [ ] Update `docs/IGNITE-APEX_Content_Bank.md` remove unbuilt features
- [ ] Review `guide/index.html` and update module documentation
- [ ] Create `guide/NEW_USER_GUIDE.md` (replaces PDF)
- [ ] Update `docs/CRM_SALES_OS_UNIFIED_ARCHITECTURE.md`
- [ ] Mark provisional content in `config/ignite-apex-config.json`
- [ ] Create `B2B0_CURRENT_STATUS.md` (what exists vs planned)
- [ ] Update `README.md` if it exists

---

## 📝 **SUMMARY OF CHANGES**

**Files to Create:**
1. `guide/NEW_USER_GUIDE.md` - Markdown version of user guide
2. `B2B0_CURRENT_STATUS.md` - Clear status of B2B0 implementation

**Files to Update:**
3. `docs/ACCESS_SPEC.md` - Module entitlements
4. `docs/IGNITE-APEX_Content_Bank.md` - Remove unbuilt features
5. `guide/index.html` - Add modules section
6. `docs/CRM_SALES_OS_UNIFIED_ARCHITECTURE.md` - Add B2B0
7. `config/ignite-apex-config.json` - Mark provisional content

**Files to Review:**
8. `app/launcher.html` - Add B2B0 card
9. Any other guide files in `/docs`

---

**Ready to execute these updates!**
