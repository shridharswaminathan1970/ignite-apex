# IGNITE-APEX Framework Content Bank

**Canonical Source:** All copy, gate conditions, questions, and examples for the IGNITE-APEX qualification methodology.

**Source Files:**
- `crm/qualification-roadmap.js` (lines 8-448)
- `crm/gate-engine.js` (lines 20-153)

**Usage:** This content bank is the single source of truth for all UI text, questions, and examples. Do not paraphrase or simplify.

---

## §0. FRAMEWORK OVERVIEW

### The Roadmap Rail (8 nodes)

1. **Raw Lead** (0%) - Entry point
2. **IGNITE Entry Gate** (5%) - Brutal qualification gate
3. **Stage 1: Qualification** (10%)
4. **Stage 2: Discovery** (30%)
5. **Stage 3: Demo/Validate** (50%)
6. **Stage 4: Proposal** (70%)
7. **Stage 5: Negotiation** (90%)
8. **Stage 6: Closed Won** (100%)
9. **CEMENT** (Post-sale)

**Forecast Weight:** The % is EARNED when ALL gates for that stage pass. Not assigned — proven.

---

## §1. IGNITE ENTRY GATE (5%)

### Why This Gate Exists

**Title:** The Brutal Gate — Why it exists

**What you're proving:** You're proving this is REAL demand, not tire-kicking. 4U validation (Unworkable, Urgent, Unavoidable, Underserved) + ≥4/6 IGNITE diagnostic questions = yes. This gate protects your forecast from hope.

**Cost of faking it:** Skipping this = your pipeline fills with "opportunities" that were never going to close. Your forecast becomes a wish list, not a prediction.

---

### 1.1 The 4U Framework

Pass condition: ALL 4 U's must have evidence captured.

#### U1: Status quo is Unworkable

**Label:** Status quo is Unworkable

**Why this matters:** Their current situation is visibly broken — you can see it, they can describe it.

**Guiding Questions:**
1. What's breaking in your current setup?
2. How is that impacting day-to-day operations?
3. What workarounds are you running right now?

**Peel the Onion (3 layers):**
- Surface symptom: "Our process is slow"
- Layer 2: "What's making it slow?" → "Manual data entry"
- Root cause: "Why manual?" → "Systems don't talk to each other, no integration"

**STRONG answer:** Ops team manually re-keys 400 orders/week into 3 systems. Takes 12 hours/week. Error rate ~8%.

**WEAK answer:** They seem frustrated with their current tools.

---

#### U2: Trigger is Urgent

**Label:** Trigger is Urgent

**Why this matters:** There's a forcing event — a deadline, regulatory change, or consequence that makes this non-deferrable.

**Guiding Questions:**
1. What happens if this isn't solved in the next 6 months?
2. Is there a deadline or external forcing event?
3. What's changed recently that makes this urgent now?

**Peel the Onion:** [Apply same 3-layer structure as U1]

**STRONG answer:** SOC 2 audit in Q3. Current system can't produce audit trail. Failure = lost enterprise deals.

**WEAK answer:** They'd like to fix it eventually.

---

#### U3: Driver is Unavoidable

**Label:** Driver is Unavoidable

**Why this matters:** External forces (regulation, market shift, competition) make this unavoidable — it's not optional.

**Guiding Questions:**
1. What external forces are driving this?
2. Is the market/regulation changing in a way you can't ignore?
3. What happens if you do nothing?

**Peel the Onion:** [Apply same 3-layer structure as U1]

**STRONG answer:** GDPR compliance deadline. Current system can't do right-to-be-forgotten. Fines = €20M or 4% revenue.

**WEAK answer:** Management thinks it would be nice to have.

---

#### U4: Currently Underserved

**Label:** Currently Underserved

**Why this matters:** No existing solution solves this well — there's a gap your product uniquely fills.

**Guiding Questions:**
1. What have you tried so far?
2. Why didn't those solutions work?
3. What's missing from current alternatives?

**Peel the Onion:** [Apply same 3-layer structure as U1]

**STRONG answer:** Tried 3 competitors. All lack real-time sync. Built in-house workaround, but it breaks monthly.

**WEAK answer:** They haven't really looked at alternatives yet.

---

### 1.2 Jobs To Be Done (JTBD)

**Status:** ⚠️ PROVISIONAL DRAFT — editable config

**Capture structure:**
```
When [situation from root cause]
I want to [motivation - what they're trying to accomplish]
So I can [outcome - strategic impact]
```

**Job dimensions:**
1. **Functional job:** The task/process improvement
2. **Emotional job:** How they want to feel
3. **Social job:** How they want to be perceived

**Example:**
- **When:** Our ops team manually re-keys 400 orders/week with 8% error rate
- **I want to:** Automate data sync between our 3 systems
- **So I can:** Redeploy 12 hours/week to strategic work and eliminate costly errors
- **Functional:** Reduce manual data entry time by 90%
- **Emotional:** Feel confident our data is accurate
- **Social:** Be seen as driving efficiency gains

---

### 1.3 The 6 IGNITE Diagnostic Questions

**Status:** ⚠️ PROVISIONAL DRAFT — editable config

**Pass threshold:** ≥4 of 6 = YES

**Database fields (from gate-engine.js lines 33-38):**
1. `ignite_stage_i_complete` - **I** - Identify
2. `ignite_stage_g_complete` - **G** - Go Deep
3. `ignite_stage_n_complete` - **N** - Nurture
4. `ignite_stage_i2_complete` - **I** - Iterate
5. `ignite_stage_t_complete` - **T** - Trigger
6. `ignite_stage_e_complete` - **E** - Escalate

**DRAFT question text (placeholder - awaiting final wording):**

1. **I - Identify:** Have you identified the right prospect at the right moment with a clear trigger event?
2. **G - Go Deep:** Have you researched their world deeply enough to earn the right to make contact?
3. **N - Nurture:** Have you established a nurture sequence and built trust before asking for the sale?
4. **I - Iterate:** Have you iterated on your messaging based on their responses and feedback?
5. **T - Trigger:** Have you confirmed the trigger event is still active and creates urgency?
6. **E - Escalate:** Have you escalated from initial contact to a diagnostic conversation with decision-makers?

---

## §2. APEX STAGES (Qualification → Closed Won)

### Stage 1: Qualification (10%)

**Why this gate exists:**

**Title:** Stage 1 — Why this gate exists

**What you're proving:** You're proving they've engaged with you AND the pain is quantified. You have an account, contact, logged activity, and a dollar figure on the pain.

**Cost of faking it:** Moving to Discovery without this = you're chasing ghosts. No engagement + no quantified pain = no deal.

---

#### Gate 1.1: Account record exists

**Label:** Account record exists

**Why this matters:** You need a company to sell to.

**Guiding Questions:** [None - auto-validated]

**Structured capture:**
- `account_id` (FK to accounts table)
- Auto-check: `!!opportunity.account_id`

**STRONG answer:** Account created with domain, industry, size.

**WEAK answer:** Account name only, no enrichment.

---

#### Gate 1.2: Contact record exists

**Label:** Contact record exists

**Why this matters:** You need a human to talk to.

**Guiding Questions:** [None - auto-validated]

**Structured capture:**
- `contact_id` (FK to contacts table)
- Auto-check: `!!opportunity.contact_id`

**STRONG answer:** Contact with title, email, phone, LinkedIn.

**WEAK answer:** Generic info@ email.

---

#### Gate 1.3: Prospect engaged

**Label:** Prospect engaged

**Why this matters:** They've responded — this isn't cold outreach ghosting.

**Guiding Questions:**
1. Have you had a live conversation (call/meeting)?
2. Did they ask follow-up questions?
3. Did they introduce you to anyone else?

**Structured capture:**
- Evidence from activities table (has logged calls/meetings)
- Text field: Engagement summary

**STRONG answer:** 45-min discovery call logged. Contact asked for technical details, intro'd their VP Engineering.

**WEAK answer:** They opened my email.

---

#### Gate 1.4: Pain is quantified

**Label:** Pain is quantified

**Why this matters:** You need a dollar figure or measurable impact. "It's a problem" ≠ quantified.

**Guiding Questions:**
1. What is this costing you today — in dollars, hours, or risk?
2. How did you calculate that?
3. Who confirmed this number?

**Structured capture:**
- Annual cost/impact: `$_______/year`
- Calculation method: [text]
- Confirmed by: [name + title]

**STRONG answer:** $180k/year in manual labor + $60k in error correction. CFO confirmed budget exists.

**WEAK answer:** They said it's expensive.

---

### Stage 2: Discovery (30%)

**Why this gate exists:**

**Title:** Stage 2 — Why this gate exists

**What you're proving:** You're proving WHO will buy (Economic Buyer), WHAT the pain costs (Metrics), WHO will champion internally (Champion), and WHY it ties to business outcomes.

**Cost of faking it:** No Economic Buyer = you're selling to someone who can't say yes. No Metrics = no ROI case. No Champion = dead deal.

---

#### Gate 2.1: Economic Buyer identified

**Label:** Economic Buyer identified

**Why this matters:** The person who controls the budget and can sign the contract.

**Guiding Questions:**
1. Who has budget authority for this purchase?
2. What's their title?
3. Have you met them or been introduced?
4. What's their role in the decision process?

**Structured capture:**
- Name: [text]
- Title: [text]
- Have you met them directly? [Yes/No]
- Last interaction date: [date]
- What they said: [text]

**STRONG answer:** VP Operations, $500k budget authority. Met on Zoom, asked about implementation timeline.

**WEAK answer:** Someone mentioned the CFO approves these things.

---

#### Gate 2.2: Metrics quantified

**Label:** Metrics quantified

**Why this matters:** The $ size of the pain, confirmed by multiple sources.

**Guiding Questions:**
1. What KPIs are you tracking today that this impacts?
2. What's the cost per incident/error/delay?
3. How many incidents/errors/delays per month?
4. Who owns these metrics internally?

**Structured capture:**
- Metric 1: [KPI name] = [value]
- Metric 2: [KPI name] = [value]
- Annual impact: $______
- Metric owner: [name + title]

**STRONG answer:** $240k/year waste. 8% error rate × 5,000 orders/month × $60 avg correction cost. Ops Director confirmed.

**WEAK answer:** It's probably costing them a lot.

---

#### Gate 2.3: Champion emerging

**Label:** Champion emerging

**Why this matters:** Someone internal is actively helping you navigate, introducing you, and advocating for the solution.

**Guiding Questions:**
1. Who internally is pushing hardest for this change?
2. Have they introduced you to other stakeholders?
3. Are they helping you navigate the org?
4. What's in it for them personally if this gets done?

**Structured capture:**
- Champion name: [text]
- Champion title: [text]
- Introductions made: [list names]
- Personal motivation: [text]

**STRONG answer:** Director of Sales Ops. Introduced us to VP Sales, CFO, IT. Says her bonus tied to pipeline accuracy.

**WEAK answer:** The contact seems interested.

---

#### Gate 2.4: Pain tied to business outcome

**Label:** Pain tied to business outcome

**Why this matters:** The pain connects to a strategic business goal (revenue, cost, risk, compliance).

**Guiding Questions:**
1. How does solving this impact company goals?
2. What strategic initiative does this support?
3. What happens to the business if this isn't fixed?

**Structured capture:**
- Strategic goal: [text]
- Connection to pain: [text]
- Business consequence: [text]

**STRONG answer:** CEO's #1 priority: improve forecast accuracy. Current miss rate = 15%. Board wants <5%.

**WEAK answer:** It would make things better.

---

### Stage 3: Demo/Validate (50%)

**Why this gate exists:**

**Title:** Stage 3 — Why this gate exists

**What you're proving:** You're proving the solution FITS. They've seen it, confirmed fit, and documented HOW they'll decide and WHO is involved.

**Cost of faking it:** No demo = they don't know what they're buying. No Decision Criteria = they'll pick a competitor on price. No Decision Process = deal stalls forever.

---

#### Gate 3.1: Tailored demo/POC delivered

**Label:** Tailored demo/POC delivered

**Why this matters:** They've seen the product solving THEIR problem, not a generic pitch.

**Guiding Questions:**
1. Did you demo against their actual use case?
2. Who attended the demo?
3. What specific features solved their pain?
4. What questions did they ask?

**Structured capture:**
- Demo date: [date]
- Attendees: [list names + titles]
- Use case demonstrated: [text]
- Features shown: [list]
- Questions asked: [text]

**STRONG answer:** Custom demo: imported their data, showed real-time sync solving their #1 pain. 6 attendees including VP Ops.

**WEAK answer:** Sent them a recorded demo video.

---

#### Gate 3.2: Prospect confirms solution fit

**Label:** Prospect confirms solution fit

**Why this matters:** They've explicitly said "Yes, this solves our problem."

**Guiding Questions:**
1. Did they explicitly confirm this solves their problem?
2. What did they say?
3. Did they compare to competitors?
4. Any objections or gaps identified?

**Structured capture:**
- Confirmation received? [Yes/No]
- Exact quote: "[their words]"
- Compared to: [competitor names]
- Decision rationale: [text]

**STRONG answer:** VP Ops: "This is exactly what we need. Real-time sync solves our biggest pain." Compared to Competitor X, chose us.

**WEAK answer:** They seemed to like it.

---

#### Gate 3.3: Decision Criteria documented

**Label:** Decision Criteria documented

**Why this matters:** You know HOW they'll decide (features, price, security, support, etc.) and you're aligned.

**Guiding Questions:**
1. What are your top 3 criteria for choosing a vendor?
2. How will you score/rank vendors?
3. What's a dealbreaker?
4. How do we compare on each criterion?

**Structured capture:**
- Criterion 1: [text] — Our score: [/10]
- Criterion 2: [text] — Our score: [/10]
- Criterion 3: [text] — Our score: [/10]
- Dealbreakers: [list]
- Our competitive position: [text]

**STRONG answer:** Criteria: (1) Real-time sync, (2) SOC 2, (3) <$10k/month. We meet all 3. Documented in their vendor scorecard.

**WEAK answer:** Price and features matter to them.

---

#### Gate 3.4: Decision Process documented

**Label:** Decision Process documented

**Why this matters:** You know WHO is involved, WHEN they meet, WHAT steps remain, and WHO has final say.

**Guiding Questions:**
1. Who needs to approve this purchase?
2. What's the sequence of approvals?
3. When does each approval happen?
4. What could delay or block approval?

**Structured capture:**
- Step 1: [role] approves → Date: [date]
- Step 2: [role] approves → Date: [date]
- Step 3: [role] signs → Date: [date]
- Blockers identified: [text]

**STRONG answer:** Process: (1) Ops Director recommends → (2) VP Ops approves → (3) CFO signs. Meeting dates set. No blockers identified.

**WEAK answer:** They have to run it by a few people.

---

### Stage 4: Proposal (70%)

**Why this gate exists:**

**Title:** Stage 4 — Why this gate exists

**What you're proving:** You're proving the business case is IN FRONT OF the Economic Buyer, ROI is tied to their metrics, and the Paper Process (legal, procurement, security review) is mapped.

**Cost of faking it:** No business case to EB = you're selling to someone who can't buy. No paper process = deal dies in legal/procurement.

---

#### Gate 4.1: Proposal delivered

**Label:** Proposal delivered

**Why this matters:** Formal proposal/quote is in their hands.

**Guiding Questions:** [Checkbox only]

**Structured capture:**
- Proposal sent date: [date]
- Received by: [name]
- Contract terms: [text]

**STRONG answer:** Proposal sent 3 days ago. 3-year contract, $120k/year, includes implementation. EB received and reviewed.

**WEAK answer:** Sent a pricing sheet.

---

#### Gate 4.2: Business case to Economic Buyer

**Label:** Business case to Economic Buyer

**Why this matters:** The Economic Buyer has seen and understands the ROI/value case.

**Guiding Questions:**
1. Has the EB seen the business case?
2. What was their reaction?
3. Did they ask follow-up questions?
4. Did they share with other executives?

**Structured capture:**
- Presented to EB? [Yes/No]
- EB reaction: [text]
- Follow-up questions: [text]
- Shared with: [names]

**STRONG answer:** Presented business case to CFO (EB). ROI = 18-month payback. CFO shared with CEO, got verbal approval to proceed.

**WEAK answer:** The contact will present it to the EB.

---

#### Gate 4.3: ROI tied to their Metrics

**Label:** ROI tied to their Metrics

**Why this matters:** The ROI case uses THEIR numbers, not generic industry benchmarks.

**Guiding Questions:**
1. What metrics did you use in the ROI calc?
2. Where did those numbers come from?
3. Did they validate the assumptions?

**Structured capture:**
- Annual cost saved: $______
- Annual cost of solution: $______
- Payback period: [X] months
- Source of numbers: [text]
- Validated by: [name]

**STRONG answer:** ROI: Save $240k/year (their confirmed waste) vs $120k cost = 6-month payback. CFO confirmed numbers.

**WEAK answer:** Industry average ROI is 2x.

---

#### Gate 4.4: Paper Process mapped

**Label:** Paper Process mapped

**Why this matters:** You know Legal, Security, Procurement steps and timelines.

**Guiding Questions:**
1. What's your contracting/procurement process?
2. Who reviews contracts (Legal, Security, Procurement)?
3. How long does each review take?
4. Any standard terms/redlines we should expect?

**Structured capture:**
- Step 1: [dept] review — Duration: [X] days
- Step 2: [dept] review — Duration: [X] days
- Step 3: [dept] approval — Duration: [X] days
- Standard terms: [text]

**STRONG answer:** Process: (1) Legal review (5 days) → (2) Security review (3 days) → (3) Procurement (2 days). Standard MSA, no custom terms.

**WEAK answer:** They'll send it to Legal.

---

#### Gate 4.5: MEDDPICC substantially complete

**Label:** MEDDPICC substantially complete

**Why this matters:** All MEDDPICC elements (Metrics, Economic Buyer, Decision Criteria, Decision Process, Paper Process, Identified Pain, Champion, Competition) are documented.

**Guiding Questions:** [Checklist - auto-validated from prior gates]

**MEDDPICC Checklist:**
- ✓ **M** - Metrics quantified (Gate 2.2)
- ✓ **E** - Economic Buyer identified (Gate 2.1)
- ✓ **D** - Decision Criteria documented (Gate 3.3)
- ✓ **D** - Decision Process documented (Gate 3.4)
- ✓ **P** - Paper Process mapped (Gate 4.4)
- ✓ **I** - Identified Pain quantified (Gate 1.4)
- ✓ **C** - Champion emerging (Gate 2.3)
- ✓ **C** - Competition neutralized (Gate 5.5)

**STRONG answer:** M: $240k waste ✓ | E: CFO ✓ | D-Crit: Real-time, SOC2, <$10k ✓ | D-Proc: 3-step approval ✓ | P-Proc: Legal→Security→Procurement ✓ | Pain: Manual re-keying ✓ | Champion: Dir Sales Ops ✓ | Comp: Beat Competitor X ✓

**WEAK answer:** Most elements captured.

---

### Stage 5: Negotiation (90%)

**Why this gate exists:**

**Title:** Stage 5 — Why this gate exists

**What you're proving:** You're proving they've verbally committed, terms are in final negotiation, close plan has dates, and competition is neutralized.

**Cost of faking it:** No verbal = they're still shopping. No close plan = "we'll get back to you" = dead. Competition not neutralized = they pick someone else.

---

#### Gate 5.1: Verbal commitment received

**Label:** Verbal commitment received

**Why this matters:** They've said "Yes, we're moving forward with you" (not just "we like you").

**Guiding Questions:**
1. Did they explicitly say they're choosing you?
2. Who said it?
3. What were their exact words?

**Structured capture:**
- Verbal commitment received? [Yes/No]
- Who said it: [name + title]
- Exact quote: "[their words]"
- Date received: [date]

**STRONG answer:** CFO: "We're moving forward with you. Let's finalize terms and get this signed by EOM."

**WEAK answer:** They said we're their top choice.

---

#### Gate 5.2: Terms in final negotiation

**Label:** Terms in final negotiation

**Why this matters:** Pricing, contract length, payment terms are being finalized (not still being debated).

**Guiding Questions:**
1. What terms are still being negotiated?
2. How far apart are you?
3. What's the blocker to final agreement?

**Structured capture:**
- Terms agreed: [list]
- Terms in negotiation: [list]
- Gap/blocker: [text]

**STRONG answer:** Agreed on $120k/year, 3-year term. Negotiating payment terms: annual vs quarterly. Legal reviewing MSA redlines.

**WEAK answer:** Still discussing pricing.

---

#### Gate 5.3: Mutual close plan with dates

**Label:** Mutual close plan with dates

**Why this matters:** Both sides have committed to a timeline with specific dates/milestones.

**Guiding Questions:**
1. What's the target close date?
2. What milestones remain before signing?
3. Do they have the same timeline as you?

**Structured capture:**
- Milestone 1: [text] by [date]
- Milestone 2: [text] by [date]
- Target close date: [date]
- Mutually agreed? [Yes/No]

**STRONG answer:** Mutual Close Plan: Legal review complete by 6/20, Security by 6/22, signature by 6/28. Both sides committed.

**WEAK answer:** They want to close soon.

---

#### Gate 5.4: Champion & EB aligned

**Label:** Champion & EB aligned

**Why this matters:** Your Champion and the Economic Buyer are aligned and pushing together.

**Guiding Questions:**
1. Is your Champion aligned with the EB?
2. Are they pushing together or are there internal politics?

**Structured capture:**
- Aligned? [Yes/No]
- Evidence: [text - recent meetings, actions]

**STRONG answer:** Champion (Dir Sales Ops) and EB (CFO) met twice this week. Both pushing Legal/Procurement to expedite.

**WEAK answer:** Champion thinks EB is on board.

---

#### Gate 5.5: Competition neutralized

**Label:** Competition neutralized

**Why this matters:** They've explicitly chosen you over alternatives.

**Guiding Questions:**
1. Who else are they considering?
2. Have they explicitly ruled them out?
3. Why did they choose you?

**Structured capture:**
- Competitors evaluated: [list]
- Status of each: [Ruled out / Still in consideration]
- Why we won: [text]

**STRONG answer:** Evaluated Competitor X and Y. Chose us because of real-time sync + better support. Competitor X out, Y ruled out week 1.

**WEAK answer:** We think we're ahead.

---

### Stage 6: Closed Won (100%)

**Why this gate exists:**

**Title:** Stage 6 — Why this gate exists

**What you're proving:** Contract is signed. Money is real.

**Cost of faking it:** No signature = not a win. "Verbal yes" ≠ closed. The forecast is earned when ink is dry.

---

#### Gate 6.1: Signed contract received

**Label:** Signed contract received

**Why this matters:** Actual signature, not "they said they'll sign."

**Guiding Questions:** [Checkbox + file upload]

**Structured capture:**
- Contract signed? [Yes/No]
- Signature date: [date]
- Contract terms: [text]
- First invoice sent: [Yes/No]

**STRONG answer:** Fully executed MSA + SOW received 6/28. Payment terms: Net-30, first invoice sent.

**WEAK answer:** They said they signed it.

---

## §3. CEMENT Post-Sale (5 Layers)

**Why CEMENT exists:**

**Title:** Post-Sale — Why CEMENT exists

**What you're proving:** You didn't just win the deal — you're winning retention for 3-5 years. CEMENT = Customer success foundation.

**Cost of faking it:** Win the deal, lose the renewal = churn. Revenue today ≠ revenue retained. Great post-sale = 3-5 year LTV.

---

### Layer 1: Outcome Ownership (Month 1-3)

**Actions:**
- Schedule 30/60/90-day check-ins
- Build QBR template around the exact root cause diagnosed in PROBE — reference their words
- Surface one implementation risk before it becomes visible to them
- Transition from vendor to strategic partner

**Reuses:** Root cause from U1 Peel the Onion Layer 3

---

### Layer 2: Stakeholder Expansion (Month 3-9)

**Actions:**
- Identify 3 stakeholders beyond your primary contact — at different levels
- Deliver individual value to each
- Deal must survive if primary contact leaves

---

### Layer 3: Institutional Knowledge (Month 6-18)

**Actions:**
- Maintain living document: their cycles, politics, strategic priorities, prior failures
- Reference it in every conversation
- You remember what they forget = moat

---

### Layer 4: Root Cause Chain Expansion (Month 12-24)

**Actions:**
- Solving first root cause reveals the next one
- Document it
- Frame expansion as natural next step in THEIR journey
- They should feel like they proposed it

---

### Layer 5: Advocacy Engineering (Month 18-36+)

**Actions:**
- Co-create case study
- Get peer referral
- Joint presentation/speaking engagement
- Public credibility investment = deepest stickiness

---

## §4. AI COACHING PROMPTS

### Gate Answer Draft Prompt

```
You are an AI sales coach for the IGNITE-APEX methodology.

CONTEXT:
- Deal: {opportunity.name}
- Current stage: {stage_name}
- Gate condition: {gate.label}

DATA AVAILABLE:
- Logged activities: {activities_summary}
- Existing gate notes: {opportunity[gate.field + '_notes']}
- Related fields: {relevant_opportunity_fields}

TASK:
Draft a gate answer for "{gate.label}" based on the available data.

RULES:
1. Use ONLY information present in the data — do not invent facts
2. Match the STRONG answer pattern from the content bank
3. Include specific names, numbers, dates from activities
4. If data is insufficient, state what's missing explicitly
5. Format: 2-3 sentences, concrete and specific

OUTPUT FORMAT:
{
  "draft": "Your proposed gate answer",
  "confidence": "high|medium|low",
  "weakEvidence": ["List any red flags that match WEAK examples"],
  "nextAction": "Single specific action to strengthen this gate"
}
```

### Weak Evidence Detection Prompt

```
Compare this gate answer to the WEAK example:

GATE: {gate.label}
USER ANSWER: {user_answer}
WEAK EXAMPLE: {gate.weak}

Does the user's answer resemble the weak example?
Return "yes" or "no" with a brief explanation.
```

---

## §5. CONFIGURATION (Editable Provisional Content)

### JTBD Capture Template (DRAFT)

```yaml
prompt_text: "Build the Jobs-To-Be-Done statement from the root cause you uncovered"
fields:
  - name: when_situation
    label: "When [situation]"
    hint: "The trigger or context from root cause"
  - name: i_want
    label: "I want to [motivation]"
    hint: "What they're trying to accomplish"
  - name: so_i_can
    label: "So I can [outcome]"
    hint: "Strategic business impact"
  - name: functional_job
    label: "Functional job"
    hint: "The task/process improvement"
  - name: emotional_job
    label: "Emotional job"
    hint: "How they want to feel"
  - name: social_job
    label: "Social job"
    hint: "How they want to be perceived"
```

### 6 IGNITE Diagnostic Questions (DRAFT)

```yaml
- id: ignite_stage_i_complete
  letter: I
  label: "Identify"
  question: "Have you identified the right prospect at the right moment with a clear trigger event?"

- id: ignite_stage_g_complete
  letter: G
  label: "Go Deep"
  question: "Have you researched their world deeply enough to earn the right to make contact?"

- id: ignite_stage_n_complete
  letter: N
  label: "Nurture"
  question: "Have you established a nurture sequence and built trust before asking for the sale?"

- id: ignite_stage_i2_complete
  letter: I
  label: "Iterate"
  question: "Have you iterated on your messaging based on their responses and feedback?"

- id: ignite_stage_t_complete
  letter: T
  label: "Trigger"
  question: "Have you confirmed the trigger event is still active and creates urgency?"

- id: ignite_stage_e_complete
  letter: E
  label: "Escalate"
  question: "Have you escalated from initial contact to a diagnostic conversation with decision-makers?"
```

---

## APPENDIX: Database Field Mapping

### 4U Fields
- `demand_4u_unworkable` (BOOLEAN)
- `demand_4u_unworkable_notes` (TEXT)
- `demand_4u_urgent` (BOOLEAN)
- `demand_4u_urgent_notes` (TEXT)
- `demand_4u_unavoidable` (BOOLEAN)
- `demand_4u_unavoidable_notes` (TEXT)
- `demand_4u_underserved` (BOOLEAN)
- `demand_4u_underserved_notes` (TEXT)

### IGNITE Diagnostic Fields
- `ignite_stage_i_complete` (BOOLEAN)
- `ignite_stage_g_complete` (BOOLEAN)
- `ignite_stage_n_complete` (BOOLEAN)
- `ignite_stage_i2_complete` (BOOLEAN)
- `ignite_stage_t_complete` (BOOLEAN)
- `ignite_stage_e_complete` (BOOLEAN)
- `ignite_diagnostic_score` (INTEGER 0-6, computed)

### Stage Gate Fields (Qualification)
- `gate_account_exists` (BOOLEAN, auto-computed from account_id)
- `gate_contact_exists` (BOOLEAN, auto-computed from contact_id)
- `gate_prospect_engaged` (BOOLEAN)
- `gate_prospect_engaged_notes` (TEXT)
- `gate_quantified_pain` (BOOLEAN)
- `gate_quantified_pain_notes` (TEXT)

### Stage Gate Fields (Discovery)
- `gate_economic_buyer_identified` (BOOLEAN)
- `gate_economic_buyer_identified_notes` (TEXT)
- `gate_metrics_quantified` (BOOLEAN)
- `gate_metrics_quantified_notes` (TEXT)
- `gate_champion_emerging` (BOOLEAN)
- `gate_champion_emerging_notes` (TEXT)
- `gate_pain_tied_to_outcome` (BOOLEAN)
- `gate_pain_tied_to_outcome_notes` (TEXT)

[Continue for all gates through Closed Won...]

---

**END OF CONTENT BANK**

**Version:** 1.0  
**Last Updated:** 2026-06-25  
**Maintained By:** IGNITE_APEX Development Team
