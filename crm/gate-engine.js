/**
 * gate-engine.js
 * Gate enforcement for IGNITE-APEX and Standard methodologies
 * Validates stage transitions and auto-calculates gate status
 */

// Stage configuration: same 6 stages for both methodologies
const STAGES = [
  { name: 'Lead', order: 0, percent: 0 },
  { name: 'Qualification', order: 1, percent: 10 },
  { name: 'Discovery', order: 2, percent: 30 },
  { name: 'Demo', order: 3, percent: 50 },
  { name: 'Proposal', order: 4, percent: 70 },
  { name: 'Negotiation', order: 5, percent: 90 },
  { name: 'Closed Won', order: 6, percent: 100 },
  { name: 'Closed Lost', order: 6, percent: 0 }
];

// PRE-PIPELINE GATE: Lead → Opportunity (Stage 1 Qualification)
const PRE_PIPELINE_GATES = {
  ignite_apex: {
    name: 'IGNITE 4U Validation',
    conditions: [
      { field: 'demand_4u_unworkable', label: 'Status quo is Unworkable (evidence captured)' },
      { field: 'demand_4u_urgent', label: 'Trigger is Urgent (evidence captured)' },
      { field: 'demand_4u_unavoidable', label: 'Driver is Unavoidable (evidence captured)' },
      { field: 'demand_4u_underserved', label: 'Currently Underserved (evidence captured)' },
      {
        field: 'ignite_diagnostic_score',
        label: '≥4 of 6 IGNITE diagnostic questions = yes',
        validator: (opp) => {
          const score = [
            opp.ignite_stage_i_complete,
            opp.ignite_stage_g_complete,
            opp.ignite_stage_n_complete,
            opp.ignite_stage_i2_complete,
            opp.ignite_stage_t_complete,
            opp.ignite_stage_e_complete
          ].filter(Boolean).length;
          return score >= 4;
        }
      }
    ]
  },
  standard: {
    name: 'Need Identified',
    conditions: [
      { field: 'gate_need_identified', label: 'Business need identified and documented' }
    ]
  }
};

// PER-STAGE GATES: Requirements to ADVANCE INTO each stage
const STAGE_GATES = {
  ignite_apex: {
    'Qualification': {
      name: 'Stage 1: Qualification Gate',
      conditions: [
        { field: 'demand_4u_validated', label: '4U validated (all 4 conditions met)' },
        { field: 'gate_account_exists', label: 'Account record exists' },
        { field: 'gate_contact_exists', label: 'Contact record exists' },
        { field: 'gate_prospect_engaged', label: 'Prospect engaged (activity logged)' },
        { field: 'gate_quantified_pain', label: 'Quantified pain on record' }
      ]
    },
    'Discovery': {
      name: 'Stage 2: Discovery Gate',
      conditions: [
        { field: 'gate_economic_buyer_identified', label: 'Economic Buyer identified' },
        { field: 'gate_metrics_quantified', label: 'Metrics quantified ($ size of pain)' },
        { field: 'gate_champion_emerging', label: 'Champion emerging' },
        { field: 'gate_pain_tied_to_outcome', label: 'Pain tied to business outcome' }
      ]
    },
    'Demo': {
      name: 'Stage 3: Demo Gate',
      conditions: [
        { field: 'gate_demo_delivered', label: 'Tailored demo/POC delivered against quantified pain' },
        { field: 'gate_prospect_confirms_fit', label: 'Prospect confirms fit' },
        { field: 'gate_decision_criteria_documented', label: 'Decision Criteria documented' },
        { field: 'gate_decision_process_documented', label: 'Decision Process documented' }
      ]
    },
    'Proposal': {
      name: 'Stage 4: Proposal Gate',
      conditions: [
        { field: 'gate_proposal_delivered', label: 'Proposal delivered' },
        { field: 'gate_business_case_to_eb', label: 'Business case in front of Economic Buyer' },
        { field: 'gate_roi_tied_to_metrics', label: 'ROI tied to their Metrics' },
        { field: 'gate_paper_process_mapped', label: 'Paper Process mapped' },
        { field: 'gate_meddpicc_complete', label: 'MEDDPICC substantially complete' }
      ]
    },
    'Negotiation': {
      name: 'Stage 5: Negotiation Gate',
      conditions: [
        { field: 'gate_verbal_commitment', label: 'Verbal/selected commitment received' },
        { field: 'gate_terms_in_negotiation', label: 'Terms & pricing in final negotiation' },
        { field: 'gate_mutual_close_plan', label: 'Mutual close plan with dates' },
        { field: 'gate_champion_eb_aligned', label: 'Champion & EB aligned' },
        { field: 'gate_competition_neutralized', label: 'Competition neutralized' }
      ]
    },
    'Closed Won': {
      name: 'Stage 6: Closed Won Gate',
      conditions: [
        { field: 'gate_contract_signed', label: 'Signed contract received' }
      ]
    }
  },
  standard: {
    'Qualification': {
      name: 'Stage 1: Qualification Gate',
      conditions: [
        { field: 'gate_need_identified', label: 'Need identified (BANT: Need filled)' }
      ]
    },
    'Discovery': {
      name: 'Stage 2: Discovery Gate',
      conditions: [
        { field: 'gate_authority_confirmed', label: 'Authority confirmed (BANT: Authority filled)' },
        { field: 'gate_need_identified', label: 'Need confirmed (BANT: Need filled)' }
      ]
    },
    'Demo': {
      name: 'Stage 3: Demo Gate',
      conditions: [
        { field: 'gate_demo_delivered', label: 'Demo/POC delivered (checkbox)' },
        { field: 'gate_need_validated', label: 'Need validated vs. solution (checkbox: prospect confirmed fit)' }
      ]
    },
    'Proposal': {
      name: 'Stage 4: Proposal Gate',
      conditions: [
        { field: 'gate_budget_confirmed', label: 'Budget confirmed (BANT: Budget filled)' },
        { field: 'gate_proposal_delivered', label: 'Proposal delivered to buyer (checkbox)' }
      ]
    },
    'Negotiation': {
      name: 'Stage 5: Negotiation Gate',
      conditions: [
        { field: 'gate_timeline_locked', label: 'Timeline locked (BANT: Timeline filled)' },
        { field: 'gate_budget_confirmed', label: 'Budget confirmed' }
      ]
    },
    'Closed Won': {
      name: 'Stage 6: Closed Won Gate',
      conditions: [
        { field: 'gate_contract_signed', label: 'Contract signed (checkbox)' }
      ]
    }
  }
};

/**
 * Validate if an opportunity can move to a target stage
 * @param {object} opportunity - The opportunity record with all gate fields
 * @param {string} targetStage - The stage name to move to
 * @returns {object} { allowed: boolean, missing: string[], gate: object }
 */
function validateStageMove(opportunity, targetStage) {
  const methodology = opportunity.methodology || 'ignite_apex';
  const gates = STAGE_GATES[methodology];
  const gate = gates[targetStage];

  if (!gate) {
    // No gate defined for this stage (e.g., Closed Lost, Lead)
    return { allowed: true, missing: [], gate: null };
  }

  const missing = [];

  for (const condition of gate.conditions) {
    let conditionMet = false;

    if (condition.validator) {
      // Custom validator function
      conditionMet = condition.validator(opportunity);
    } else {
      // Boolean field check
      conditionMet = !!opportunity[condition.field];
    }

    if (!conditionMet) {
      missing.push(condition.label);
    }
  }

  return {
    allowed: missing.length === 0,
    missing,
    gate
  };
}

/**
 * Auto-calculate gate status from opportunity data
 * Updates gate_* boolean fields based on actual data
 * @param {object} opportunity - The opportunity record
 * @returns {object} Updated gate fields
 */
function autoCalculateGates(opportunity) {
  const gates = {};

  // IGNITE-APEX auto-calculations
  if (opportunity.methodology === 'ignite_apex') {
    // Account/Contact exist
    gates.gate_account_exists = !!opportunity.account_id;
    gates.gate_contact_exists = !!opportunity.contact_id;

    // Prospect engaged (has activities)
    gates.gate_prospect_engaged = opportunity._has_activities || false;

    // Quantified pain (has value + pain documented)
    gates.gate_quantified_pain = !!(opportunity.estimated_value && opportunity.ignite_strategic_priorities);

    // Economic Buyer identified (contact with role or explicit flag)
    gates.gate_economic_buyer_identified = opportunity.gate_economic_buyer_identified || false;

    // Metrics quantified (has estimated_value)
    gates.gate_metrics_quantified = !!opportunity.estimated_value;

    // 4U validated
    gates.demand_4u_validated = !!(
      opportunity.demand_4u_unworkable &&
      opportunity.demand_4u_urgent &&
      opportunity.demand_4u_unavoidable &&
      opportunity.demand_4u_underserved
    );
  }

  // Standard auto-calculations
  if (opportunity.methodology === 'standard') {
    // Need identified (has BANT need filled)
    gates.gate_need_identified = !!opportunity.bant_need;

    // Authority confirmed (has BANT authority filled)
    gates.gate_authority_confirmed = !!opportunity.bant_authority;

    // Budget confirmed (has BANT budget filled)
    gates.gate_budget_confirmed = !!opportunity.bant_budget;

    // Timeline locked (has close_date)
    gates.gate_timeline_locked = !!opportunity.close_date;

    // Need validated (has BANT need + demo delivered)
    gates.gate_need_validated = !!(opportunity.bant_need && opportunity.gate_demo_delivered);
  }

  return gates;
}

/**
 * Get highest stage this opportunity qualifies for
 * @param {object} opportunity - The opportunity record
 * @returns {object} { stageName: string, percent: number, reason: string }
 */
function getMaxQualifiedStage(opportunity) {
  const methodology = opportunity.methodology || 'ignite_apex';
  const stageOrder = ['Qualification', 'Discovery', 'Demo', 'Proposal', 'Negotiation', 'Closed Won'];

  let maxStage = 'Lead';
  let maxPercent = 0;

  for (const stageName of stageOrder) {
    const validation = validateStageMove(opportunity, stageName);
    if (validation.allowed) {
      maxStage = stageName;
      maxPercent = STAGES.find(s => s.name === stageName).percent;
    } else {
      break; // Stop at first failed gate
    }
  }

  return {
    stageName: maxStage,
    percent: maxPercent,
    reason: maxStage === 'Lead' ? 'No gates passed yet' : `All gates up to ${maxStage} passed`
  };
}

/**
 * Render gate checklist UI
 * @param {object} opportunity - The opportunity record
 * @param {string} targetStage - Optional target stage to highlight
 * @returns {string} HTML string
 */
function renderGateChecklist(opportunity, targetStage = null) {
  const methodology = opportunity.methodology || 'ignite_apex';
  const gates = STAGE_GATES[methodology];
  const stageToShow = targetStage || opportunity.pipeline_stage || 'Qualification';
  const gate = gates[stageToShow];

  if (!gate) {
    return `<div class="empty-state">No gate requirements for ${stageToShow}</div>`;
  }

  const validation = validateStageMove(opportunity, stageToShow);

  let html = `
    <div style="background:#F8F5EF;border-radius:12px;padding:1.5rem;margin-bottom:1rem">
      <div style="font-size:1rem;font-weight:700;color:#0D0C08;margin-bottom:.5rem">${gate.name}</div>
      <div style="font-size:.85rem;color:#6B5D4F;margin-bottom:1rem">
        ${validation.allowed
          ? '✅ All gate requirements met'
          : `⚠️ ${validation.missing.length} requirement(s) missing`}
      </div>
      <div style="display:flex;flex-direction:column;gap:.75rem">
  `;

  for (const condition of gate.conditions) {
    let conditionMet = false;

    if (condition.validator) {
      conditionMet = condition.validator(opportunity);
    } else {
      conditionMet = !!opportunity[condition.field];
    }

    html += `
      <div style="display:flex;align-items:center;gap:.75rem;padding:.75rem;background:${conditionMet ? '#D1FAE5' : '#FEE2E2'};border-radius:8px">
        <div style="font-size:1.2rem">${conditionMet ? '✅' : '❌'}</div>
        <div style="flex:1;font-size:.85rem;color:#0D0C08">${condition.label}</div>
        ${!conditionMet ? `
          <button
            onclick="fixGateCondition('${condition.field}')"
            style="background:#EF4444;color:#fff;border:none;padding:.5rem 1rem;border-radius:6px;font-size:.75rem;font-weight:700;cursor:pointer">
            Fix →
          </button>
        ` : ''}
      </div>
    `;
  }

  html += `
      </div>
    </div>
  `;

  return html;
}

// Export functions
window.GateEngine = {
  STAGES,
  validateStageMove,
  autoCalculateGates,
  getMaxQualifiedStage,
  renderGateChecklist
};

console.log('[GateEngine] Loaded');
