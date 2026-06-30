# IGNITE-APEX Roadmap - Rendering Verification

**Date:** 2026-06-25  
**Status:** Code analysis complete - awaiting live verification

---

## Code Analysis Results

I've traced through the entire rendering chain. Here's what SHOULD appear on screen:

---

### ✅ **TEST 1: Roadmap Rail Visible**

**Expected Render:**
- Horizontal rail showing ALL 8 stages in order:
  - 📥 Raw Lead (0%)
  - 🔥 IGNITE Entry Gate (5%)
  - ✓ Stage 1: Qualification (10%)
  - ✓ Stage 2: Discovery (30%)
  - ✓ Stage 3: Demo (50%)
  - ✓ Stage 4: Proposal (70%)
  - ✓ Stage 5: Negotiation (90%)
  - ✓ Stage 6: Closed Won (100%)
  - 🏗️ CEMENT (post-sale)

**"YOU ARE HERE" marker:**
- Current stage highlighted in amber/yellow
- Text below: "▼ YOU ARE HERE"
- Previous stages: green background
- Future stages: gray background
- IGNITE gate: red/orange (brutal gate styling)

**Code Location:**
- File: `crm/qualification-roadmap.js`
- Function: `renderRoadmapRail()` (lines 466-518)
- Called by: `window.QualificationRoadmap.render()` (line 798)

**Verification Method:**
1. Log in to https://shaamelz.com/crm/opportunity.html
2. Open any opportunity with `methodology='ignite_apex'`
3. Click "Qualification" tab
4. Roadmap rail should appear at top with 8 stages + YOU ARE HERE marker

**PASS Criteria:**
- ✅ 8 stages visible in horizontal rail
- ✅ Current stage marked with "YOU ARE HERE"
- ✅ Icon + name + percentage for each stage
- ✅ Clickable (cursor changes on hover)

---

### ✅ **TEST 2: Why-Layer Renders**

**Expected Render:**
When clicking ANY stage, a yellow box appears below with:

```
🗺️ Qualification Roadmap
[Stage Icon] [Stage Name]
Forecast Weight: X%

[Yellow box with orange left border]
Why this matters
What you're proving: [detailed text]
Cost of faking it: [warning text]
```

**Example (IGNITE Gate):**
```
🔥 IGNITE Entry Gate
Forecast Weight: 5%

The Brutal Gate — Why it exists
What you're proving: You're proving this is REAL demand, not tire-kicking.  
4U validation (Unworkable, Urgent, Unavoidable, Underserved) + ≥4/6 IGNITE  
diagnostic questions = yes. This gate protects your forecast from hope.

Cost of faking it: Skipping this = your pipeline fills with "opportunities" that  
were never going to close. Your forecast becomes a wish list, not a prediction.
```

**Code Location:**
- File: `crm/qualification-roadmap.js`
- Function: `renderStageDetail()` (lines 540-574)
- Why-layer: lines 554-563

**PASS Criteria:**
- ✅ Yellow box with orange border appears
- ✅ Shows: "Why this matters", "What you're proving", "Cost of faking it"
- ✅ Text matches data from IGNITE_ROADMAP array (lines 8-463)

---

### ✅ **TEST 3: Guiding Questions Appear**

**Expected Render:**
Under each gate, a white box shows:

```
🎯 Questions to Ask the Prospect
• [Question 1]
• [Question 2]
• [Question 3]
```

**Example (U1 - Unworkable):**
```
🎯 Questions to Ask the Prospect
• What's breaking in your current setup?
• How is that impacting day-to-day operations?
• What workarounds are you running right now?
```

**Code Location:**
- File: `crm/qualification-roadmap.js`
- Function: `renderGates()` (lines 576-681)
- Guiding questions block: lines 596-603

**Data Source:**
- Each gate in IGNITE_ROADMAP has `guidingQuestions: [...]` array
- Example: lines 37-41 (U1 Unworkable)

**PASS Criteria:**
- ✅ Questions appear in white box with blue target icon
- ✅ Bullet points for each question
- ✅ Questions match IGNITE_ROADMAP data

---

### ✅ **TEST 4: STRONG vs WEAK Examples**

**Expected Render:**
Under guiding questions, a gray box shows:

```
📊 What Good Looks Like

✅ STRONG ANSWER
[Specific example with numbers/evidence]

❌ WEAK ANSWER
[Vague example without evidence]
```

**Example (U1 - Unworkable):**
```
📊 What Good Looks Like

✅ STRONG ANSWER
Ops team manually re-keys 400 orders/week into 3 systems. Takes 12 hours/week. Error rate ~8%.

❌ WEAK ANSWER
They seem frustrated with their current tools.
```

**Code Location:**
- File: `crm/qualification-roadmap.js`
- Function: `renderGates()` (lines 618-630)

**Data Source:**
- Each gate has `strong: "..."` and `weak: "..."` fields
- Example: lines 47-48 (U1 Unworkable)

**PASS Criteria:**
- ✅ Gray box with green checkmark for STRONG
- ✅ Gray box with red X for WEAK
- ✅ Examples match IGNITE_ROADMAP data

---

### ✅ **TEST 5: Structured Capture Fields**

**Expected Render:**
Under each gate:

```
Your Answer:                           [🤖 Get AI Coaching button]
[Large textarea for answer]

[Checkbox] Mark as complete (I've confirmed this gate is met)
```

**Behavior:**
1. **Textarea saves on change** → calls `saveGateAnswer(field)` → updates `[field]_notes` in opportunities table
2. **Checkbox toggles gate state** → calls `toggleGate(field)` → updates `[field]` boolean in opportunities table
3. **Checkbox checked** → gate shows ✅ green, checkbox unchecked → gate shows ❌ red

**Code Location:**
- File: `crm/qualification-roadmap.js`
- Textarea: lines 645-649
- Checkbox: lines 664-673
- Save functions: lines 812-840

**PASS Criteria:**
- ✅ Textarea appears under each gate
- ✅ Pre-fills with existing answer (from `opportunity[field + '_notes']`)
- ✅ Saves on change
- ✅ Checkbox toggles gate met/unmet state
- ✅ Gate icon changes (✅ → ❌) based on checkbox

---

### ✅ **TEST 6: AI Coaching**

**Expected Behavior:**
1. Click "🤖 Get AI Coaching" button
2. Button changes to "⏳ Thinking..."
3. Calls Edge Function: `${supabaseUrl}/functions/v1/ai-coaching`
4. On success, blue box appears below textarea:

```
🤖 AI Coach Says:

DRAFT ANSWER (review & edit before using):
[AI-generated draft in white box]
Confidence: HIGH

⚠️ WEAK EVIDENCE FLAGS:
• [Flag 1]
• [Flag 2]

NEXT BEST ACTION:
[Specific next step]

[✓ Use This Draft button] [✕ Dismiss button]
```

5. **Clicking "Use This Draft"** → copies AI draft into textarea (but does NOT auto-tick checkbox)
6. **Rep must manually confirm** by editing if needed, then checking box

**Code Location:**
- File: `crm/qualification-roadmap.js`
- AI coaching function: lines 843-920
- Coaching display: lines 652-661
- Accept draft: lines 921-927
- **CRITICAL**: Line 926 - does NOT auto-check the gate, only fills textarea

**Edge Function:**
- File: `supabase/functions/ai-coaching/index.ts`
- Returns: `{ draft, weakEvidence, nextAction, confidence }`

**PASS Criteria:**
- ✅ Button calls AI coaching API
- ✅ Blue box appears with draft answer
- ✅ Shows weak evidence flags
- ✅ Shows next best action
- ✅ "Use This Draft" button fills textarea BUT does not auto-tick gate
- ✅ Rep must manually confirm by checking box

**FAIL if:**
- ❌ AI auto-ticks the gate checkbox
- ❌ No confirmation required
- ❌ Draft replaces answer without user action

---

### ✅ **TEST 7: IGNITE Entry Gate Full Chain**

**Expected Render Order (when IGNITE gate stage is selected):**

#### Part A: 4U Framework (4 gates)

1. **U1: Status quo is Unworkable**
   - ❌/✅ icon (based on checkbox)
   - Why this matters
   - 🎯 Guiding questions (3 questions)
   - 🧅 Peel the Onion (3 layers)
   - 📊 STRONG vs WEAK examples
   - Textarea + AI coaching button
   - Checkbox

2. **U2: Trigger is Urgent**
   - Same structure as U1
   - Different questions/examples

3. **U3: Driver is Unavoidable**
   - Same structure

4. **U4: Currently Underserved**
   - Same structure

#### Part B: Peel the Onion (ALL 4 U's)

Each U should show blue box with:
```
🧅 Peel the Onion — Get to Root Cause
Layer 1: [Surface symptom]
Layer 2: [Deeper cause]  
Layer 3: [Root cause]
```

**Code Location:**
- Peel Onion rendering: lines 605-616
- Data: U1 (lines 42-46), U2 (lines 59-63), U3 (lines 76-80), U4 (lines 93-97)

#### Part C: JTBD Capture

After 4U gates, blue box appears:

```
🎯 Jobs-To-Be-Done (JTBD)
⚠️ PROVISIONAL DRAFT

[6 input fields:]
1. When (situation):  [input field]
2. I want to (action): [input field]
3. So I can (outcome): [input field]
4. Functional job:     [input field]
5. Emotional job:      [input field]
6. Social job:         [input field]

💡 EXAMPLE (from content bank):
[Shows example JTBD from config]
```

**Code Location:**
- JTBD rendering: lines 694-730
- Data source: `window.IGNITE_PROVISIONAL_CONFIG.jtbd`
- Config file: `crm/ignite-provisional-config.json`

#### Part D: 6 IGNITE Diagnostics

After JTBD, green/red box appears:

```
🔥 6 IGNITE Diagnostic Checks
⚠️ PROVISIONAL DRAFT                    X/6 (need 4+ to pass)

✅ IGNITE diagnostic PASSED  [or ❌ Need X more to pass]

[6 checkboxes:]
❌/✅ I - Identify: [question text]
      [Hint text]
      [Checkbox]

❌/✅ G - Go Deep: [question text]
      [Hint text]
      [Checkbox]

[... all 6]
```

**Code Location:**
- 6 diagnostics rendering: lines 732-789
- Data source: `window.IGNITE_PROVISIONAL_CONFIG.igniteDiagnostics`
- Config file: `crm/ignite-provisional-config.json`

**Pass Threshold Logic:**
- Count checked diagnostics
- If ≥4 → box turns green, shows "✅ IGNITE diagnostic PASSED"
- If <4 → box stays red, shows "❌ Need X more to pass"

---

## 📋 **PASS/FAIL Criteria Summary**

### Test 1: Roadmap Rail
- **Code File:** `qualification-roadmap.js:466-518`
- **Expected:** 8-stage horizontal rail with YOU ARE HERE marker
- **Status:** ✅ CODE COMPLETE - Ready to test live

### Test 2: Why-Layer
- **Code File:** `qualification-roadmap.js:554-563`
- **Expected:** Yellow box with "What you're proving" + "Cost of faking it"
- **Status:** ✅ CODE COMPLETE - Ready to test live

### Test 3: Guiding Questions
- **Code File:** `qualification-roadmap.js:596-603`
- **Expected:** White box with 🎯 icon + bullet list
- **Status:** ✅ CODE COMPLETE - Ready to test live

### Test 4: STRONG vs WEAK
- **Code File:** `qualification-roadmap.js:618-630`
- **Expected:** Gray box with ✅ STRONG and ❌ WEAK examples
- **Status:** ✅ CODE COMPLETE - Ready to test live

### Test 5: Capture Fields
- **Code File:** `qualification-roadmap.js:645-673`
- **Expected:** Textarea + checkbox, saves to DB
- **Status:** ✅ CODE COMPLETE - Ready to test live

### Test 6: AI Coaching
- **Code File:** `qualification-roadmap.js:843-920`
- **Edge Function:** `supabase/functions/ai-coaching/index.ts`
- **Expected:** Blue box with draft, weak flags, next action. Draft-to-confirm (no auto-tick).
- **Status:** ⏳ CODE COMPLETE - **Needs Edge Function deployed**

### Test 7: IGNITE Full Chain
- **Code File:** `qualification-roadmap.js:684-791`
- **Config File:** `crm/ignite-provisional-config.json`
- **Expected:** 4U → Peel Onion (all 4) → JTBD (6 fields) → 6 diagnostics (≥4/6)
- **Status:** ✅ CODE COMPLETE - Ready to test live

---

## 🔧 **Deployment Checklist**

Before live testing, ensure:

1. ✅ **Database Migration Run?**
   - File: `supabase/migrations/20260625_add_jtbd_and_fixes.sql`
   - Adds: JTBD fields, 6 IGNITE diagnostic booleans, Peel Onion fields
   - **Status:** Created, needs manual execution in Supabase SQL Editor

2. ✅ **Edge Function Deployed?**
   - Function: `ai-coaching`
   - File: `supabase/functions/ai-coaching/index.ts`
   - **Status:** Code complete, needs deployment
   - Deploy: `supabase functions deploy ai-coaching`

3. ✅ **Config File Accessible?**
   - File: `crm/ignite-provisional-config.json`
   - **Status:** ✅ Exists and deployed

4. ✅ **Test Opportunity Exists?**
   - Methodology: `ignite_apex`
   - Stage: Any (Raw Lead, Qualification, etc.)
   - **Status:** Unknown - needs verification

---

## 🎯 **Live Verification Steps**

1. **Run database migration**
   ```sql
   -- In Supabase SQL Editor
   -- Copy/paste entire contents of:
   -- supabase/migrations/20260625_add_jtbd_and_fixes.sql
   ```

2. **Deploy AI Coaching**
   ```bash
   supabase secrets set ANTHROPIC_API_KEY=sk-ant-api03-W3fLgUFq...
   supabase functions deploy ai-coaching
   ```

3. **Create Test Opportunity**
   - Go to: https://shaamelz.com/crm/index.html
   - Create new opportunity
   - Set methodology: IGNITE-APEX
   - Stage: Qualification

4. **Open Opportunity**
   - Click opportunity → Qualification tab
   - Verify all 7 tests above

5. **Test Each Component**
   - Click each stage in roadmap rail
   - Read why-layer
   - Read guiding questions
   - Read STRONG/WEAK examples
   - Type in textarea → verify it saves
   - Check checkbox → verify gate turns green
   - Click "Get AI Coaching" → verify blue box appears
   - On IGNITE gate: verify 4U + Peel Onion + JTBD + 6 diagnostics all render

---

## ✅ **CONCLUSION**

**Code Analysis:** ✅ COMPLETE

All 7 requirements are coded and ready:
1. ✅ Roadmap rail with YOU ARE HERE
2. ✅ Why-layer (proving + cost)
3. ✅ Guiding questions
4. ✅ STRONG vs WEAK examples
5. ✅ Structured capture fields (textarea + checkbox)
6. ✅ AI coaching (draft-to-confirm, no auto-tick)
7. ✅ IGNITE full chain (4U + Peel Onion all 4 + JTBD + 6 diagnostics ≥4/6)

**Pending:**
- ⏳ Database migration (5 min)
- ⏳ AI Coaching Edge Function deployment (5 min)
- ⏳ Live verification with real opportunity (5 min)

**Total time to verify:** ~15 minutes

**Files to reference:**
- Main render logic: `crm/qualification-roadmap.js`
- Config data: `crm/ignite-provisional-config.json`
- Integration: `crm/opportunity.html:502-509`
- Content source: `docs/IGNITE-APEX_Content_Bank.md`

**All code complete. Ready for live testing once migration + Edge Function deployed.**
