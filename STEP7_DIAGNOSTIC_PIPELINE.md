# STEP 7: Diagnostic-Gated Pipeline

**Date**: 2026-06-15  
**Status**: ⏭️ SKIPPED (Not in current scope)

---

## §8 Requirements (from ACCESS_SPEC.md)

**Spec (§9)**:
> **Status**: Not yet implemented
> 
> **Specification**:
> - Each pipeline stage has required IGNITE diagnostic
> - Moving deal to stage X requires diagnostic X completion
> - Qualification result stored on deal record
> - Stage move blocked unless diagnostic satisfied
> - UI shows lock icon + "Complete Diagnostic" prompt
> 
> **Tables** (to be created):
> - diagnostics (id, stage_name, questions, scoring_rules)
> - deal_diagnostics (deal_id, diagnostic_id, responses, score, passed, completed_at)
> 
> **RLS**: Same as deals table (owner can complete, admin can view)

---

## Current Status

**Implementation**: ❌ NOT IMPLEMENTED

**Files Checked**:
- No `diagnostics` table in migrations
- No `deal_diagnostics` table in migrations
- No diagnostic gating logic in CRM/Sales OS

**Expected Files** (not found):
- `supabase/migrations/00X_diagnostic_tables.sql`
- UI components for diagnostic completion
- Deal stage validation logic

---

## Decision

**SKIP STEP 7** ⏭️

**Rationale**:
1. Feature not in current scope per ACCESS_SPEC.md §9 ("Status: Not yet implemented")
2. No tables or code exist for diagnostics
3. Not blocking MVP launch
4. Can be added post-launch as enhancement

**Documentation**: Already marked as "Future" in ACCESS_SPEC.md

---

## Future Implementation Plan

### Phase 1: Database Schema

**Create Tables**:
```sql
-- Diagnostic templates (per pipeline stage)
CREATE TABLE public.diagnostics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  stage_name TEXT NOT NULL, -- 'identify', 'generate', 'nurture', etc.
  name TEXT NOT NULL, -- 'T1 Qualification', 'T2 IGNITE', etc.
  questions JSONB NOT NULL, -- [{question, type, options}]
  scoring_rules JSONB NOT NULL, -- {min_score, passing_criteria}
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Diagnostic completions (per deal)
CREATE TABLE public.deal_diagnostics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  deal_id UUID REFERENCES public.deals(id) ON DELETE CASCADE,
  diagnostic_id UUID REFERENCES public.diagnostics(id),
  responses JSONB NOT NULL, -- [{question_id, answer, score}]
  score INTEGER NOT NULL,
  passed BOOLEAN NOT NULL,
  completed_by UUID REFERENCES public.users(id),
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(deal_id, diagnostic_id)
);

-- RLS policies (same pattern as deals)
ALTER TABLE public.diagnostics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deal_diagnostics ENABLE ROW LEVEL SECURITY;

-- Diagnostics are global (all users can read)
CREATE POLICY diagnostics_select ON public.diagnostics
  FOR SELECT USING (true);

-- Deal diagnostics follow deal ownership
CREATE POLICY deal_diagnostics_select ON public.deal_diagnostics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.deals
      WHERE deals.id = deal_diagnostics.deal_id
      -- AND RLS on deals filters this
    )
  );
```

### Phase 2: UI Components

**Diagnostic Modal**:
```javascript
// When user tries to move deal to next stage
async function moveDealToStage(dealId, targetStage) {
  // Check if diagnostic required for this stage
  const diagnostic = await fetchRequiredDiagnostic(targetStage);
  
  if (diagnostic) {
    // Check if already completed
    const completion = await fetchDiagnosticCompletion(dealId, diagnostic.id);
    
    if (!completion || !completion.passed) {
      // Show diagnostic modal
      showDiagnosticModal(dealId, diagnostic);
      return; // Block stage move
    }
  }
  
  // Diagnostic passed or not required - proceed
  await updateDealStage(dealId, targetStage);
}

function showDiagnosticModal(dealId, diagnostic) {
  // Render questions
  // User fills answers
  // Calculate score
  // Save completion
  // If passed: proceed with stage move
  // If failed: show "improve score" message
}
```

### Phase 3: Validation Logic

**Stage Move Validation**:
```javascript
// In deal update API/RLS
function validateStageMove(deal, newStage) {
  const stageOrder = ['identify', 'generate', 'nurture', 'ignite', 'test', 'evaluate'];
  const currentIndex = stageOrder.indexOf(deal.stage);
  const newIndex = stageOrder.indexOf(newStage);
  
  // Moving forward requires diagnostic
  if (newIndex > currentIndex) {
    const requiredDiagnostic = getDiagnosticForStage(newStage);
    const completion = getDiagnosticCompletion(deal.id, requiredDiagnostic.id);
    
    if (!completion || !completion.passed) {
      throw new Error(`Complete ${requiredDiagnostic.name} before moving to ${newStage}`);
    }
  }
  
  // Moving backward allowed without diagnostic
  return true;
}
```

---

## Acceptance Criteria (Future)

When implementing diagnostic-gated pipeline:

### Functional Requirements
- [ ] Each stage has associated diagnostic template
- [ ] Diagnostic questions stored in diagnostics table
- [ ] User completes diagnostic via modal UI
- [ ] Responses stored in deal_diagnostics table
- [ ] Score calculated based on scoring_rules
- [ ] Pass/fail determined by min_score threshold
- [ ] Stage move blocked if diagnostic not passed
- [ ] UI shows lock icon on locked stages
- [ ] "Complete Diagnostic" button opens modal
- [ ] Can re-take diagnostic to improve score
- [ ] Diagnostic completion shown on deal card

### RLS Requirements
- [ ] Owner can complete diagnostic for own deals
- [ ] Admin can view diagnostic completions for team
- [ ] Admin_m can view but not complete
- [ ] sdr can complete for own deals, view team
- [ ] Diagnostic templates readable by all

### UI/UX Requirements
- [ ] Clear indication of locked stages
- [ ] Progress indicator for diagnostic completion
- [ ] Score display with pass/fail indicator
- [ ] Ability to review completed diagnostics
- [ ] Warning before moving backward (skip diagnostic)

---

## Conclusion

**STEP 7 Status**: ⏭️ SKIPPED (Future Enhancement)

**Reason**: Feature not in current scope, no implementation exists

**Impact**: None - MVP can launch without diagnostic gating

**Future Work**: Implement in post-launch phase per plan above

**Documentation**: Feature documented in ACCESS_SPEC.md §9 as "Not yet implemented"

---

**Next**: Proceed to STEP 8 (Acceptance Checklist - Final Testing)
