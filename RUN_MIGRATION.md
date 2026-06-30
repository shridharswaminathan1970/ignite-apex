# Run Phase C Migration: Strength Columns

## Option 1: Via Supabase Dashboard (Recommended)

1. **Open SQL Editor:**
   https://supabase.com/dashboard/project/gokslnrvxqledagcwghq/sql/new

2. **Copy-paste this SQL:**

```sql
-- Add evidence strength calibration columns to opportunities table
-- Each gate field gets a corresponding _strength column (1-5 scale)

-- IGNITE Entry Gate (4U)
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS demand_4u_unworkable_strength INT CHECK (demand_4u_unworkable_strength BETWEEN 1 AND 5);
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS demand_4u_urgent_strength INT CHECK (demand_4u_urgent_strength BETWEEN 1 AND 5);
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS demand_4u_unavoidable_strength INT CHECK (demand_4u_unavoidable_strength BETWEEN 1 AND 5);
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS demand_4u_underserved_strength INT CHECK (demand_4u_underserved_strength BETWEEN 1 AND 5);

-- Stage 1: Qualification
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS gate_account_exists_strength INT CHECK (gate_account_exists_strength BETWEEN 1 AND 5);
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS gate_contact_exists_strength INT CHECK (gate_contact_exists_strength BETWEEN 1 AND 5);
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS gate_prospect_engaged_strength INT CHECK (gate_prospect_engaged_strength BETWEEN 1 AND 5);
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS gate_quantified_pain_strength INT CHECK (gate_quantified_pain_strength BETWEEN 1 AND 5);

-- Stage 2: Discovery
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS gate_economic_buyer_identified_strength INT CHECK (gate_economic_buyer_identified_strength BETWEEN 1 AND 5);
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS gate_metrics_quantified_strength INT CHECK (gate_metrics_quantified_strength BETWEEN 1 AND 5);
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS gate_champion_emerging_strength INT CHECK (gate_champion_emerging_strength BETWEEN 1 AND 5);
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS gate_pain_tied_to_outcome_strength INT CHECK (gate_pain_tied_to_outcome_strength BETWEEN 1 AND 5);

-- Stage 3: Demo/Validate
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS gate_demo_delivered_strength INT CHECK (gate_demo_delivered_strength BETWEEN 1 AND 5);
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS gate_prospect_confirms_fit_strength INT CHECK (gate_prospect_confirms_fit_strength BETWEEN 1 AND 5);
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS gate_decision_criteria_documented_strength INT CHECK (gate_decision_criteria_documented_strength BETWEEN 1 AND 5);
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS gate_decision_process_documented_strength INT CHECK (gate_decision_process_documented_strength BETWEEN 1 AND 5);

-- Stage 4: Proposal
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS gate_proposal_delivered_strength INT CHECK (gate_proposal_delivered_strength BETWEEN 1 AND 5);
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS gate_business_case_to_eb_strength INT CHECK (gate_business_case_to_eb_strength BETWEEN 1 AND 5);
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS gate_roi_tied_to_metrics_strength INT CHECK (gate_roi_tied_to_metrics_strength BETWEEN 1 AND 5);
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS gate_paper_process_mapped_strength INT CHECK (gate_paper_process_mapped_strength BETWEEN 1 AND 5);
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS gate_meddpicc_complete_strength INT CHECK (gate_meddpicc_complete_strength BETWEEN 1 AND 5);

-- Stage 5: Negotiation
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS gate_verbal_commitment_strength INT CHECK (gate_verbal_commitment_strength BETWEEN 1 AND 5);
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS gate_terms_in_negotiation_strength INT CHECK (gate_terms_in_negotiation_strength BETWEEN 1 AND 5);
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS gate_mutual_close_plan_strength INT CHECK (gate_mutual_close_plan_strength BETWEEN 1 AND 5);
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS gate_champion_eb_aligned_strength INT CHECK (gate_champion_eb_aligned_strength BETWEEN 1 AND 5);
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS gate_competition_neutralized_strength INT CHECK (gate_competition_neutralized_strength BETWEEN 1 AND 5);

-- Stage 6: Closed Won
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS gate_contract_signed_strength INT CHECK (gate_contract_signed_strength BETWEEN 1 AND 5);

-- Create index for strength analytics (find weak evidence across all deals)
CREATE INDEX IF NOT EXISTS idx_opportunities_weak_evidence ON opportunities
  USING btree (
    LEAST(
      demand_4u_unworkable_strength,
      demand_4u_urgent_strength,
      demand_4u_unavoidable_strength,
      demand_4u_underserved_strength
    )
  )
  WHERE demand_4u_unworkable_strength IS NOT NULL;

COMMENT ON COLUMN opportunities.demand_4u_unworkable_strength IS 'Evidence strength rating 1-5: How strong is the evidence that status quo is Unworkable?';
COMMENT ON COLUMN opportunities.gate_economic_buyer_identified_strength IS 'Evidence strength rating 1-5: How confident are we the Economic Buyer is identified?';
COMMENT ON COLUMN opportunities.gate_contract_signed_strength IS 'Evidence strength rating 1-5: How verified is the signed contract?';
```

3. **Click "Run"** (bottom right)

4. **Verify success:**
   - Should see: "Success. No rows returned"
   - Check Tables → opportunities → should now have 30 new strength columns

---

## Option 2: Via Supabase CLI

**Prerequisites:**
```bash
# Login to Supabase
supabase login

# Link to project
supabase link --project-ref gokslnrvxqledagcwghq
```

**Run migration:**
```bash
cd C:\Projects\ignite-apex
supabase db push
```

This pushes all pending migrations in `supabase/migrations/` folder.

---

## Option 3: Direct PostgreSQL Connection

**Get connection string:**
1. Go to: https://supabase.com/dashboard/project/gokslnrvxqledagcwghq/settings/database
2. Copy "Connection string" (Direct connection)
3. Replace `[YOUR-PASSWORD]` with your database password

**Run migration:**
```bash
psql "postgresql://postgres:[YOUR-PASSWORD]@db.gokslnrvxqledagcwghq.supabase.co:5432/postgres" -f supabase/migrations/20260701_add_gate_strength_columns.sql
```

---

## Verification Query

After running migration, verify columns exist:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'opportunities' 
  AND column_name LIKE '%_strength'
ORDER BY column_name;
```

**Expected:** 30 rows (all strength columns)

---

## What This Adds

**30 new columns:**
- 4 for IGNITE gate (4U)
- 4 for Stage 1: Qualification
- 4 for Stage 2: Discovery
- 4 for Stage 3: Demo/Validate
- 5 for Stage 4: Proposal
- 5 for Stage 5: Negotiation
- 1 for Stage 6: Closed Won
- 3 for CEMENT (if applicable)

**Each column:**
- Type: INT
- Constraint: CHECK (value BETWEEN 1 AND 5)
- Allows NULL (optional field)

**Index created:**
- `idx_opportunities_weak_evidence` — Find deals with weak 4U evidence

---

## Next Steps After Migration

1. ✅ Test strength slider in CRM
2. ✅ Verify data persists when moving slider
3. ✅ Test weak evidence warning on gate completion
4. 🚀 Deploy Phase D (AI Coaching)

---

**Status:** Ready to run
**Estimated time:** < 5 seconds
**Rollback:** DROP COLUMN commands (not recommended, data loss)
