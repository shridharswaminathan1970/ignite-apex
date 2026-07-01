/**
 * qualification-roadmap.js
 * Integrated IGNITE-APEX Qualification Roadmap
 * Replaces iframe approach with guided, self-explanatory experience
 */

// IGNITE-APEX Stage Roadmap Definition
const IGNITE_ROADMAP = [
  {
    id: 'raw_lead',
    name: 'Raw Lead',
    percent: 0,
    type: 'entry',
    icon: '📥',
    why: {
      title: 'Why this matters',
      proving: 'This is an unqualified inbound or outbound contact. No validation yet.',
      cost: 'Moving forward without validation = wasted cycles on deals that never close.'
    },
    preCheckQuestions: [
      'What triggered this lead entering your pipeline?',
      'Have you identified a named individual with budget authority?',
      'What is the suspected pain — is it Unworkable, Urgent, Unavoidable, or Underserved?',
      'Do you have enough to justify spending time on IGNITE diagnostic?'
    ]
  },
  {
    id: 'ignite_gate',
    name: 'IGNITE Entry Gate',
    percent: 5,
    type: 'brutal_gate',
    icon: '🔥',
    why: {
      title: 'The Brutal Gate — Why it exists',
      proving: 'You\'re proving this is REAL demand, not tire-kicking. 4U validation (Unworkable, Urgent, Unavoidable, Underserved) + ≥4/6 IGNITE diagnostic questions = yes. This gate protects your forecast from hope.',
      cost: 'Skipping this = your pipeline fills with "opportunities" that were never going to close. Your forecast becomes a wish list, not a prediction.'
    },
    gates: [
      {
        field: 'demand_4u_unworkable',
        label: 'Status quo is Unworkable',
        why: 'Their current situation is visibly broken — you can see it, they can describe it.',
        guidingQuestions: [
          'What\'s breaking in your current setup?',
          'How is that impacting day-to-day operations?',
          'What workarounds are you running right now?'
        ],
        peelOnion: [
          'Surface symptom: "Our process is slow"',
          'Layer 2: "What\'s making it slow?" → "Manual data entry"',
          'Root cause: "Why manual?" → "Systems don\'t talk to each other, no integration"'
        ],
        strong: 'Ops team manually re-keys 400 orders/week into 3 systems. Takes 12 hours/week. Error rate ~8%.',
        weak: 'They seem frustrated with their current tools.'
      },
      {
        field: 'demand_4u_urgent',
        label: 'Trigger is Urgent',
        why: 'There\'s a forcing event — a deadline, regulatory change, or consequence that makes this non-deferrable.',
        guidingQuestions: [
          'What happens if this isn\'t solved in the next 6 months?',
          'Is there a deadline or external forcing event?',
          'What\'s changed recently that makes this urgent now?'
        ],
        peelOnion: [
          'Surface symptom: "We need to do this soon"',
          'Layer 2: "Why now?" → "Regulatory deadline / competitive pressure"',
          'Root cause: "What happens if you miss it?" → "Specific consequence with $ or strategic impact"'
        ],
        strong: 'SOC 2 audit in Q3. Current system can\'t produce audit trail. Failure = lost enterprise deals.',
        weak: 'They\'d like to fix it eventually.'
      },
      {
        field: 'demand_4u_unavoidable',
        label: 'Driver is Unavoidable',
        why: 'External forces (regulation, market shift, competition) make this unavoidable — it\'s not optional.',
        guidingQuestions: [
          'What external forces are driving this?',
          'Is the market/regulation changing in a way you can\'t ignore?',
          'What happens if you do nothing?'
        ],
        peelOnion: [
          'Surface symptom: "The market is changing"',
          'Layer 2: "What specific external force?" → "Regulation / Competition / Tech shift"',
          'Root cause: "Why can\'t you wait?" → "Consequence is outside your control and cannot be deferred"'
        ],
        strong: 'GDPR compliance deadline. Current system can\'t do right-to-be-forgotten. Fines = €20M or 4% revenue.',
        weak: 'Management thinks it would be nice to have.'
      },
      {
        field: 'demand_4u_underserved',
        label: 'Currently Underserved',
        why: 'No existing solution solves this well — there\'s a gap your product uniquely fills.',
        guidingQuestions: [
          'What have you tried so far?',
          'Why didn\'t those solutions work?',
          'What\'s missing from current alternatives?'
        ],
        peelOnion: [
          'Surface symptom: "Current tools don\'t work"',
          'Layer 2: "What have you tried?" → "List of alternatives and workarounds"',
          'Root cause: "Why don\'t they solve it?" → "Specific gap no existing solution fills"'
        ],
        strong: 'Tried 3 competitors. All lack real-time sync. Built in-house workaround, but it breaks monthly.',
        weak: 'They haven\'t really looked at alternatives yet.'
      }
    ]
  },
  {
    id: 'qualification',
    name: 'Stage 1: Qualification',
    percent: 10,
    type: 'stage',
    icon: '✓',
    why: {
      title: 'Stage 1 — Why this gate exists',
      proving: 'You\'re proving they\'ve engaged with you AND the pain is quantified. You have an account, contact, logged activity, and a dollar figure on the pain.',
      cost: 'Moving to Discovery without this = you\'re chasing ghosts. No engagement + no quantified pain = no deal.'
    },
    gates: [
      {
        field: 'gate_account_exists',
        label: 'Account record exists',
        why: 'You need a company to sell to.',
        guidingQuestions: [],
        strong: 'Account created with domain, industry, size.',
        weak: 'Account name only, no enrichment.'
      },
      {
        field: 'gate_contact_exists',
        label: 'Contact record exists',
        why: 'You need a human to talk to.',
        guidingQuestions: [],
        strong: 'Contact with title, email, phone, LinkedIn.',
        weak: 'Generic info@ email.'
      },
      {
        field: 'gate_prospect_engaged',
        label: 'Prospect engaged',
        why: 'They\'ve responded — this isn\'t cold outreach ghosting.',
        guidingQuestions: [
          'Have you had a live conversation (call/meeting)?',
          'Did they ask follow-up questions?',
          'Did they introduce you to anyone else?'
        ],
        strong: '45-min discovery call logged. Contact asked for technical details, intro\'d their VP Engineering.',
        weak: 'They opened my email.'
      },
      {
        field: 'gate_quantified_pain',
        label: 'Pain is quantified',
        why: 'You need a dollar figure or measurable impact. "It\'s a problem" ≠ quantified.',
        guidingQuestions: [
          'What is this costing you today — in dollars, hours, or risk?',
          'How did you calculate that?',
          'Who confirmed this number?'
        ],
        strong: '$180k/year in manual labor + $60k in error correction. CFO confirmed budget exists.',
        weak: 'They said it\'s expensive.'
      }
    ]
  },
  {
    id: 'discovery',
    name: 'Stage 2: Discovery',
    percent: 30,
    type: 'stage',
    icon: '🔍',
    why: {
      title: 'Stage 2 — Why this gate exists',
      proving: 'You\'re proving WHO will buy (Economic Buyer), WHAT the pain costs (Metrics), WHO will champion internally (Champion), and WHY it ties to business outcomes.',
      cost: 'No Economic Buyer = you\'re selling to someone who can\'t say yes. No Metrics = no ROI case. No Champion = dead deal.'
    },
    gates: [
      {
        field: 'gate_economic_buyer_identified',
        label: 'Economic Buyer identified',
        why: 'The person who controls the budget and can sign the contract.',
        guidingQuestions: [
          'Who has budget authority for this purchase?',
          'What\'s their title?',
          'Have you met them or been introduced?',
          'What\'s their role in the decision process?'
        ],
        strong: 'VP Operations, $500k budget authority. Met on Zoom, asked about implementation timeline.',
        weak: 'Someone mentioned the CFO approves these things.'
      },
      {
        field: 'gate_metrics_quantified',
        label: 'Metrics quantified',
        why: 'The $ size of the pain, confirmed by multiple sources.',
        guidingQuestions: [
          'What KPIs are you tracking today that this impacts?',
          'What\'s the cost per incident/error/delay?',
          'How many incidents/errors/delays per month?',
          'Who owns these metrics internally?'
        ],
        strong: '$240k/year waste. 8% error rate × 5,000 orders/month × $60 avg correction cost. Ops Director confirmed.',
        weak: 'It\'s probably costing them a lot.'
      },
      {
        field: 'gate_champion_emerging',
        label: 'Champion emerging',
        why: 'Someone internal is actively helping you navigate, introducing you, and advocating for the solution.',
        guidingQuestions: [
          'Who internally is pushing hardest for this change?',
          'Have they introduced you to other stakeholders?',
          'Are they helping you navigate the org?',
          'What\'s in it for them personally if this gets done?'
        ],
        strong: 'Director of Sales Ops. Introduced us to VP Sales, CFO, IT. Says her bonus tied to pipeline accuracy.',
        weak: 'The contact seems interested.'
      },
      {
        field: 'gate_pain_tied_to_outcome',
        label: 'Pain tied to business outcome',
        why: 'The pain connects to a strategic business goal (revenue, cost, risk, compliance).',
        guidingQuestions: [
          'How does solving this impact company goals?',
          'What strategic initiative does this support?',
          'What happens to the business if this isn\'t fixed?'
        ],
        strong: 'CEO\'s #1 priority: improve forecast accuracy. Current miss rate = 15%. Board wants <5%.',
        weak: 'It would make things better.'
      }
    ]
  },
  {
    id: 'validate',
    name: 'Stage 3: Demo/Validate',
    percent: 50,
    type: 'stage',
    icon: '🎯',
    why: {
      title: 'Stage 3 — Why this gate exists',
      proving: 'You\'re proving the solution FITS. They\'ve seen it, confirmed fit, and documented HOW they\'ll decide and WHO is involved.',
      cost: 'No demo = they don\'t know what they\'re buying. No Decision Criteria = they\'ll pick a competitor on price. No Decision Process = deal stalls forever.'
    },
    gates: [
      {
        field: 'gate_demo_delivered',
        label: 'Tailored demo/POC delivered',
        why: 'They\'ve seen the product solving THEIR problem, not a generic pitch.',
        guidingQuestions: [
          'Did you demo against their actual use case?',
          'Who attended the demo?',
          'What specific features solved their pain?',
          'What questions did they ask?'
        ],
        strong: 'Custom demo: imported their data, showed real-time sync solving their #1 pain. 6 attendees including VP Ops.',
        weak: 'Sent them a recorded demo video.'
      },
      {
        field: 'gate_prospect_confirms_fit',
        label: 'Prospect confirms solution fit',
        why: 'They\'ve explicitly said "Yes, this solves our problem."',
        guidingQuestions: [
          'Did they explicitly confirm this solves their problem?',
          'What did they say?',
          'Did they compare to competitors?',
          'Any objections or gaps identified?'
        ],
        strong: 'VP Ops: "This is exactly what we need. Real-time sync solves our biggest pain." Compared to Competitor X, chose us.',
        weak: 'They seemed to like it.'
      },
      {
        field: 'gate_decision_criteria_documented',
        label: 'Decision Criteria documented',
        why: 'You know HOW they\'ll decide (features, price, security, support, etc.) and you\'re aligned.',
        guidingQuestions: [
          'What are your top 3 criteria for choosing a vendor?',
          'How will you score/rank vendors?',
          'What\'s a dealbreaker?',
          'How do we compare on each criterion?'
        ],
        strong: 'Criteria: (1) Real-time sync, (2) SOC 2, (3) <$10k/month. We meet all 3. Documented in their vendor scorecard.',
        weak: 'Price and features matter to them.'
      },
      {
        field: 'gate_decision_process_documented',
        label: 'Decision Process documented',
        why: 'You know WHO is involved, WHEN they meet, WHAT steps remain, and WHO has final say.',
        guidingQuestions: [
          'Who needs to approve this purchase?',
          'What\'s the sequence of approvals?',
          'When does each approval happen?',
          'What could delay or block approval?'
        ],
        strong: 'Process: (1) Ops Director recommends → (2) VP Ops approves → (3) CFO signs. Meeting dates set. No blockers identified.',
        weak: 'They have to run it by a few people.'
      }
    ]
  },
  {
    id: 'proposal',
    name: 'Stage 4: Proposal',
    percent: 70,
    type: 'stage',
    icon: '📄',
    why: {
      title: 'Stage 4 — Why this gate exists',
      proving: 'You\'re proving the business case is IN FRONT OF the Economic Buyer, ROI is tied to their metrics, and the Paper Process (legal, procurement, security review) is mapped.',
      cost: 'No business case to EB = you\'re selling to someone who can\'t buy. No paper process = deal dies in legal/procurement.'
    },
    gates: [
      {
        field: 'gate_proposal_delivered',
        label: 'Proposal delivered',
        why: 'Formal proposal/quote is in their hands.',
        guidingQuestions: [],
        strong: 'Proposal sent 3 days ago. 3-year contract, $120k/year, includes implementation. EB received and reviewed.',
        weak: 'Sent a pricing sheet.'
      },
      {
        field: 'gate_business_case_to_eb',
        label: 'Business case to Economic Buyer',
        why: 'The Economic Buyer has seen and understands the ROI/value case.',
        guidingQuestions: [
          'Has the EB seen the business case?',
          'What was their reaction?',
          'Did they ask follow-up questions?',
          'Did they share with other executives?'
        ],
        strong: 'Presented business case to CFO (EB). ROI = 18-month payback. CFO shared with CEO, got verbal approval to proceed.',
        weak: 'The contact will present it to the EB.'
      },
      {
        field: 'gate_roi_tied_to_metrics',
        label: 'ROI tied to their Metrics',
        why: 'The ROI case uses THEIR numbers, not generic industry benchmarks.',
        guidingQuestions: [
          'What metrics did you use in the ROI calc?',
          'Where did those numbers come from?',
          'Did they validate the assumptions?'
        ],
        strong: 'ROI: Save $240k/year (their confirmed waste) vs $120k cost = 6-month payback. CFO confirmed numbers.',
        weak: 'Industry average ROI is 2x.'
      },
      {
        field: 'gate_paper_process_mapped',
        label: 'Paper Process mapped',
        why: 'You know Legal, Security, Procurement steps and timelines.',
        guidingQuestions: [
          'What\'s your contracting/procurement process?',
          'Who reviews contracts (Legal, Security, Procurement)?',
          'How long does each review take?',
          'Any standard terms/redlines we should expect?'
        ],
        strong: 'Process: (1) Legal review (5 days) → (2) Security review (3 days) → (3) Procurement (2 days). Standard MSA, no custom terms.',
        weak: 'They\'ll send it to Legal.'
      },
      {
        field: 'gate_meddpicc_complete',
        label: 'MEDDPICC substantially complete',
        why: 'All MEDDPICC elements (Metrics, Economic Buyer, Decision Criteria, Decision Process, Paper Process, Identified Pain, Champion, Competition) are documented.',
        guidingQuestions: [],
        strong: 'M: $240k waste ✓ | E: CFO ✓ | D-Crit: Real-time, SOC2, <$10k ✓ | D-Proc: 3-step approval ✓ | P-Proc: Legal→Security→Procurement ✓ | Pain: Manual re-keying ✓ | Champion: Dir Sales Ops ✓ | Comp: Beat Competitor X ✓',
        weak: 'Most elements captured.'
      }
    ]
  },
  {
    id: 'negotiation',
    name: 'Stage 5: Negotiation',
    percent: 90,
    type: 'stage',
    icon: '🤝',
    why: {
      title: 'Stage 5 — Why this gate exists',
      proving: 'You\'re proving they\'ve verbally committed, terms are in final negotiation, close plan has dates, and competition is neutralized.',
      cost: 'No verbal = they\'re still shopping. No close plan = "we\'ll get back to you" = dead. Competition not neutralized = they pick someone else.'
    },
    gates: [
      {
        field: 'gate_verbal_commitment',
        label: 'Verbal commitment received',
        why: 'They\'ve said "Yes, we\'re moving forward with you" (not just "we like you").',
        guidingQuestions: [
          'Did they explicitly say they\'re choosing you?',
          'Who said it?',
          'What were their exact words?'
        ],
        strong: 'CFO: "We\'re moving forward with you. Let\'s finalize terms and get this signed by EOM."',
        weak: 'They said we\'re their top choice.'
      },
      {
        field: 'gate_terms_in_negotiation',
        label: 'Terms in final negotiation',
        why: 'Pricing, contract length, payment terms are being finalized (not still being debated).',
        guidingQuestions: [
          'What terms are still being negotiated?',
          'How far apart are you?',
          'What\'s the blocker to final agreement?'
        ],
        strong: 'Agreed on $120k/year, 3-year term. Negotiating payment terms: annual vs quarterly. Legal reviewing MSA redlines.',
        weak: 'Still discussing pricing.'
      },
      {
        field: 'gate_mutual_close_plan',
        label: 'Mutual close plan with dates',
        why: 'Both sides have committed to a timeline with specific dates/milestones.',
        guidingQuestions: [
          'What\'s the target close date?',
          'What milestones remain before signing?',
          'Do they have the same timeline as you?'
        ],
        strong: 'Mutual Close Plan: Legal review complete by 6/20, Security by 6/22, signature by 6/28. Both sides committed.',
        weak: 'They want to close soon.'
      },
      {
        field: 'gate_champion_eb_aligned',
        label: 'Champion & EB aligned',
        why: 'Your Champion and the Economic Buyer are aligned and pushing together.',
        guidingQuestions: [
          'Is your Champion aligned with the EB?',
          'Are they pushing together or are there internal politics?'
        ],
        strong: 'Champion (Dir Sales Ops) and EB (CFO) met twice this week. Both pushing Legal/Procurement to expedite.',
        weak: 'Champion thinks EB is on board.'
      },
      {
        field: 'gate_competition_neutralized',
        label: 'Competition neutralized',
        why: 'They\'ve explicitly chosen you over alternatives.',
        guidingQuestions: [
          'Who else are they considering?',
          'Have they explicitly ruled them out?',
          'Why did they choose you?'
        ],
        strong: 'Evaluated Competitor X and Y. Chose us because of real-time sync + better support. Competitor X out, Y ruled out week 1.',
        weak: 'We think we\'re ahead.'
      }
    ]
  },
  {
    id: 'closed_won',
    name: 'Stage 6: Closed Won',
    percent: 100,
    type: 'stage',
    icon: '✅',
    why: {
      title: 'Stage 6 — Why this gate exists',
      proving: 'Contract is signed. Money is real.',
      cost: 'No signature = not a win. "Verbal yes" ≠ closed. The forecast is earned when ink is dry.'
    },
    gates: [
      {
        field: 'gate_contract_signed',
        label: 'Signed contract received',
        why: 'Actual signature, not "they said they\'ll sign."',
        guidingQuestions: [],
        strong: 'Fully executed MSA + SOW received 6/28. Payment terms: Net-30, first invoice sent.',
        weak: 'They said they signed it.'
      }
    ]
  },
  {
    id: 'cement',
    name: 'CEMENT',
    percent: 100,
    type: 'post_sale',
    icon: '🏗️',
    why: {
      title: 'Post-Sale — Why CEMENT exists',
      proving: 'You didn\'t just win the deal — you\'re winning retention for 3-5 years. CEMENT = Customer success foundation.',
      cost: 'Win the deal, lose the renewal = churn. Revenue today ≠ revenue retained. Great post-sale = 3-5 year LTV.'
    }
  }
];

// Render the roadmap rail
function renderRoadmapRail(opportunity) {
  const currentStageId = mapStageToRoadmapId(opportunity.stage || opportunity.pipeline_stage || 'raw_lead');
  const currentStageIndex = IGNITE_ROADMAP.findIndex(s => s.id === currentStageId);

  let html = `
    <div style="background:#F8F5EF;border-radius:12px;padding:2rem;margin-bottom:2rem">
      <div style="font-size:1.2rem;font-weight:700;color:#0D0C08;margin-bottom:1rem;display:flex;align-items:center;gap:.75rem">
        <span>🗺️</span>
        <span>Qualification Roadmap</span>
        <span style="font-size:.6rem;background:#D97706;color:#fff;padding:.2rem .5rem;border-radius:4px;font-weight:700;letter-spacing:.3px">YOU ARE HERE: ${IGNITE_ROADMAP[currentStageIndex].name}</span>
      </div>

      <!-- Horizontal Rail -->
      <div style="display:flex;align-items:center;gap:.3rem;overflow:visible;padding:1rem 0">
  `;

  IGNITE_ROADMAP.forEach((stage, idx) => {
    const isDone = idx < currentStageIndex;
    const isCurrent = idx === currentStageIndex;
    const isUpcoming = idx > currentStageIndex;
    const isBrutalGate = stage.type === 'brutal_gate';

    let bgColor = isDone ? '#D1FAE5' : isCurrent ? '#FEF3C7' : '#E5DFD5';
    let borderColor = isDone ? '#065F46' : isCurrent ? '#D97706' : '#C8BBAA';
    let textColor = isDone ? '#065F46' : isCurrent ? '#D97706' : '#9C8D7A';

    if (isBrutalGate) {
      bgColor = isDone ? '#FEE2E2' : isCurrent ? '#FEE2D5' : '#E5DFD5';
      borderColor = isDone ? '#DC2626' : isCurrent ? '#C2410C' : '#C8BBAA';
      textColor = isDone ? '#DC2626' : isCurrent ? '#C2410C' : '#9C8D7A';
    }

    html += `
      <div onclick="selectRoadmapStage('${stage.id}')" style="cursor:pointer;transition:all .2s;min-width:100px;max-width:110px;background:${bgColor};border:2px solid ${borderColor};border-radius:8px;padding:.6rem .4rem;text-align:center;">
        <div style="font-size:24px;margin-bottom:.3rem">${stage.icon}</div>
        <div style="font-size:11px;font-weight:700;color:${textColor};margin-bottom:.2rem;line-height:1.2">${stage.name}</div>
        <div style="font-size:12px;font-weight:800;color:${textColor}">${stage.percent}%</div>
        ${isCurrent ? '<div style="font-size:10px;color:' + textColor + ';margin-top:.2rem">▼</div>' : ''}
      </div>
    `;

    if (idx < IGNITE_ROADMAP.length - 1) {
      html += `<div style="font-size:1.2rem;color:#C8BBAA">→</div>`;
    }
  });

  html += `
      </div>
    </div>
  `;

  return html;
}

// Map opportunity stage to roadmap ID
function mapStageToRoadmapId(stage) {
  const map = {
    'Lead': 'raw_lead',
    'Qualification': 'qualification',
    'Discovery': 'discovery',
    'Demo': 'validate',
    'Proposal': 'proposal',
    'Negotiation': 'negotiation',
    'Closed Won': 'closed_won',
    'qualify': 'qualification',
    'discover': 'discovery',
    'validate': 'validate',
    'close': 'proposal',
    'won': 'closed_won'
  };
  return map[stage] || 'raw_lead';
}

// Render Raw Lead pre-check questions with AI coaching
function renderRawLeadPreCheck(opportunity) {
  const questions = [
    { id: 'raw_lead_trigger', label: 'What triggered this lead entering your pipeline?' },
    { id: 'raw_lead_authority', label: 'Have you identified a named individual with budget authority?' },
    { id: 'raw_lead_pain', label: 'What is the suspected pain — is it Unworkable, Urgent, Unavoidable, or Underserved?' },
    { id: 'raw_lead_justify', label: 'Do you have enough to justify spending time on IGNITE diagnostic?' }
  ];

  const answeredCount = questions.filter(q => opportunity[q.id] && opportunity[q.id].trim()).length;
  const canAdvance = answeredCount >= 2;

  let html = `
    <div style="background:#FFF7ED;border:2px solid #F59E0B;border-radius:12px;padding:1.5rem;margin-bottom:2rem">
      <div style="font-size:1rem;font-weight:700;color:#C2410C;margin-bottom:1rem;display:flex;align-items:center;gap:.5rem">
        <span>🔍</span>
        <span>IGNITE Gate Pre-Check</span>
      </div>
      <div style="font-size:.85rem;color:#92400E;margin-bottom:1.5rem">
        Answer these questions before advancing to the IGNITE Entry Gate. The AI Coach will help you determine if this lead is worth qualifying.
      </div>

      <!-- Progress -->
      <div style="background:#fff;border-radius:8px;padding:1rem;margin-bottom:1.5rem">
        <div style="font-size:.75rem;font-weight:700;color:#6B5D4F;margin-bottom:.5rem">Pre-Qualification Progress</div>
        <div style="display:flex;align-items:center;gap:.75rem">
          <div style="flex:1;height:8px;background:#E5E7EB;border-radius:4px;overflow:hidden">
            <div style="width:${(answeredCount / 4) * 100}%;height:100%;background:#10B981;transition:width .3s"></div>
          </div>
          <div style="font-size:.85rem;font-weight:700;color:#0D0C08">${answeredCount}/4</div>
        </div>
        <div style="font-size:.75rem;color:#6B5D4F;margin-top:.5rem">
          ${canAdvance ? '✅ Complete 2+ questions — ready to advance' : `❌ Complete ${2 - answeredCount} more to advance`}
        </div>
      </div>

      <!-- Questions -->
      <div style="display:flex;flex-direction:column;gap:1rem">
        ${questions.map(q => {
          const value = opportunity[q.id] || '';
          return `
            <div style="background:#fff;border:1px solid #E5DFD5;border-radius:8px;padding:1rem">
              <label style="display:block;font-size:.85rem;font-weight:600;color:#0D0C08;margin-bottom:.5rem">${q.label}</label>
              <textarea
                id="${q.id}"
                onchange="saveRawLeadAnswer('${q.id}')"
                placeholder="Type your answer..."
                style="width:100%;min-height:60px;padding:.5rem;border:1px solid #C8BBAA;border-radius:6px;font-family:inherit;font-size:.85rem;color:#0D0C08;resize:vertical"
              >${value}</textarea>
            </div>
          `;
        }).join('')}
      </div>

      <!-- AI Coach Panel -->
      <div id="raw-lead-ai-coach" style="margin-top:1.5rem"></div>

      <!-- Advance Button -->
      ${canAdvance ? `
        <div style="margin-top:1.5rem;text-align:center">
          <button
            onclick="advanceToIgniteGate('${opportunity.id}')"
            style="background:#10B981;color:#fff;border:none;padding:.75rem 1.5rem;border-radius:8px;font-size:.85rem;font-weight:700;cursor:pointer;transition:all .2s"
            onmouseover="this.style.background='#059669'"
            onmouseout="this.style.background='#10B981'"
          >
            ✓ Advance to IGNITE Entry Gate (5%)
          </button>
        </div>
      ` : ''}
    </div>
  `;

  // Trigger AI coaching automatically after render
  setTimeout(() => triggerRawLeadAICoach(opportunity), 500);

  return html;
}

// Render stage detail with why-layer and gates
function renderStageDetail(stageId, opportunity) {
  const stage = IGNITE_ROADMAP.find(s => s.id === stageId);
  if (!stage) return '';

  let html = `
    <div style="background:#fff;border:2px solid #E5DFD5;border-radius:12px;padding:2rem;margin-bottom:2rem">
      <div style="display:flex;align-items:center;gap:1rem;margin-bottom:1.5rem">
        <div style="font-size:3rem">${stage.icon}</div>
        <div>
          <div style="font-size:1.5rem;font-weight:700;color:#0D0C08">${stage.name}</div>
          <div style="font-size:.9rem;color:#6B5D4F">Forecast Weight: ${stage.percent}%</div>
        </div>
      </div>

      <!-- Why Layer -->
      <div style="background:#FEF3C7;border-left:4px solid #D97706;border-radius:8px;padding:1.5rem;margin-bottom:2rem">
        <div style="font-size:.9rem;font-weight:700;color:#B45309;margin-bottom:.75rem">${stage.why.title}</div>
        <div style="font-size:.85rem;color:#1A1510;line-height:1.6;margin-bottom:1rem">
          <strong>What you\'re proving:</strong> ${stage.why.proving}
        </div>
        <div style="font-size:.85rem;color:#C2410C;line-height:1.6;font-weight:600">
          <strong>Cost of faking it:</strong> ${stage.why.cost}
        </div>
      </div>

      <!-- Raw Lead Pre-Check Questions -->
      ${stage.id === 'raw_lead' ? renderRawLeadPreCheck(opportunity) : ''}

      <!-- Gates -->
      ${stage.gates ? renderGates(stage.gates, opportunity) : (stage.id === 'raw_lead' ? '' : '<div style="text-align:center;color:#9C8D7A;padding:2rem">No gates for this stage</div>')}

      <!-- IGNITE-specific: JTBD + 6 Diagnostics -->
      ${stage.id === 'ignite_gate' ? renderIGNITEExtras(opportunity) : ''}
    </div>
  `;

  return html;
}

// Render gates for a stage
function renderGates(gates, opportunity) {
  let html = '<div style="display:flex;flex-direction:column;gap:1.5rem">';

  gates.forEach(gate => {
    const isMet = !!opportunity[gate.field];
    const bgColor = isMet ? '#D1FAE5' : '#FEE2E2';
    const borderColor = isMet ? '#065F46' : '#DC2626';
    const icon = isMet ? '✅' : '❌';

    html += `
      <div style="background:${bgColor};border:2px solid ${borderColor};border-radius:12px;padding:1.5rem">
        <div style="display:flex;align-items:flex-start;gap:1rem;margin-bottom:1rem">
          <div style="font-size:2rem;flex-shrink:0">${icon}</div>
          <div style="flex:1">
            <div style="font-size:1rem;font-weight:700;color:#0D0C08;margin-bottom:.5rem">${gate.label}</div>
            <div style="font-size:.85rem;color:#3D3428;line-height:1.5;margin-bottom:1rem">
              <strong>Why this matters:</strong> ${gate.why}
            </div>

            ${gate.guidingQuestions && gate.guidingQuestions.length > 0 ? `
              <div style="background:#fff;border-radius:8px;padding:1rem;margin-bottom:1rem">
                <div style="font-size:.75rem;font-weight:700;text-transform:uppercase;color:#6B5D4F;margin-bottom:.75rem">🎯 Questions to Ask the Prospect</div>
                <ul style="margin:0;padding-left:1.5rem;color:#1A1510;font-size:.85rem;line-height:1.8">
                  ${gate.guidingQuestions.map(q => `<li>${q}</li>`).join('')}
                </ul>
              </div>
            ` : ''}

            ${gate.peelOnion ? `
              <div style="background:#DBEAFE;border-radius:8px;padding:1rem;margin-bottom:1rem">
                <div style="font-size:.75rem;font-weight:700;text-transform:uppercase;color:#1E40AF;margin-bottom:.75rem">🧅 Peel the Onion — Get to Root Cause</div>
                <div style="color:#1A1510;font-size:.85rem;line-height:1.8">
                  ${gate.peelOnion.map((layer, idx) => `
                    <div style="margin-bottom:.5rem;padding-left:${idx * 1}rem">
                      <strong>Layer ${idx + 1}:</strong> ${layer}
                    </div>
                  `).join('')}
                </div>
              </div>
            ` : ''}

            ${gate.strong && gate.weak ? `
              <div style="background:#F1F5F9;border-radius:8px;padding:1rem">
                <div style="font-size:.75rem;font-weight:700;text-transform:uppercase;color:#334155;margin-bottom:.75rem">📊 What Good Looks Like</div>
                <div style="margin-bottom:.75rem">
                  <div style="font-size:.75rem;color:#065F46;font-weight:700;margin-bottom:.25rem">✅ STRONG ANSWER</div>
                  <div style="font-size:.85rem;color:#1A1510;line-height:1.5">${gate.strong}</div>
                </div>
                <div>
                  <div style="font-size:.75rem;color:#DC2626;font-weight:700;margin-bottom:.25rem">❌ WEAK ANSWER</div>
                  <div style="font-size:.85rem;color:#1A1510;line-height:1.5">${gate.weak}</div>
                </div>
              </div>
            ` : ''}
          </div>
        </div>

        <div style="border-top:1px solid ${isMet ? '#A7F3D0' : '#FCA5A5'};padding-top:1rem;margin-top:1rem">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:.5rem">
            <label style="font-size:.75rem;font-weight:700;text-transform:uppercase;color:#6B5D4F">Your Answer:</label>
            <button
              onclick="getAICoaching('${stageId}', '${gate.field}')"
              style="background:#3B82F6;color:#fff;border:none;padding:.5rem 1rem;border-radius:6px;font-size:.75rem;font-weight:700;cursor:pointer;transition:all .2s"
              onmouseover="this.style.background='#2563EB'"
              onmouseout="this.style.background='#3B82F6'">
              🤖 Get AI Coaching
            </button>
          </div>
          <textarea
            id="gate-${gate.field}"
            onchange="saveGateAnswer('${gate.field}')"
            style="width:100%;background:#fff;border:1.5px solid #D1C7B7;border-radius:8px;padding:.75rem;font-family:inherit;font-size:.85rem;color:#0D0C08;resize:vertical;min-height:80px"
            placeholder="Enter your answer here (be specific, use their words, include evidence)...">${opportunity[gate.field + '_notes'] || ''}</textarea>

          <!-- Evidence Strength Calibration -->
          <div style="background:#F8F5EF;border:1.5px solid #D1C7B7;border-radius:8px;padding:1rem;margin-top:1rem">
            <div style="font-size:.75rem;font-weight:700;text-transform:uppercase;color:#6B5D4F;margin-bottom:.75rem">📊 Rate Your Evidence Strength</div>
            <div style="display:flex;align-items:center;gap:1rem;margin-bottom:.5rem">
              <span style="font-size:.7rem;color:#DC2626;font-weight:700;min-width:50px">WEAK</span>
              <input
                type="range"
                id="strength-${gate.field}"
                min="1"
                max="5"
                value="${opportunity[gate.field + '_strength'] || 3}"
                oninput="updateStrengthLabel('${gate.field}')"
                onchange="saveGateStrength('${gate.field}')"
                style="flex:1;height:8px;border-radius:5px;background:linear-gradient(to right, #FEE2E2 0%, #FEF3C7 50%, #D1FAE5 100%);outline:none;-webkit-appearance:none;cursor:pointer">
              <span style="font-size:.7rem;color:#065F46;font-weight:700;min-width:60px">STRONG</span>
            </div>
            <div style="text-align:center;margin-top:.5rem">
              <span id="strength-label-${gate.field}" style="display:inline-block;padding:.4rem .9rem;border-radius:6px;font-size:.75rem;font-weight:700"></span>
            </div>
            <div style="font-size:.7rem;color:#6B5D4F;margin-top:.75rem;line-height:1.5">
              <strong>1-2:</strong> Generic/vague<br>
              <strong>3:</strong> Has specifics, needs more evidence<br>
              <strong>4-5:</strong> Specific, quantified, verified by multiple sources
            </div>
          </div>

          <!-- AI Coaching Result -->
          <div id="ai-coaching-${gate.field}" style="display:none;margin-top:1rem;background:#DBEAFE;border:2px solid #3B82F6;border-radius:8px;padding:1rem">
            <div style="font-size:.75rem;font-weight:700;text-transform:uppercase;color:#1E40AF;margin-bottom:.75rem">🤖 AI Coach Says:</div>
            <div id="ai-draft-${gate.field}" style="margin-bottom:1rem"></div>
            <div id="ai-weak-${gate.field}" style="margin-bottom:1rem"></div>
            <div id="ai-next-${gate.field}"></div>
            <div style="margin-top:1rem;display:flex;gap:.5rem">
              <button onclick="acceptAIDraft('${gate.field}')" style="background:#10B981;color:#fff;border:none;padding:.5rem 1rem;border-radius:6px;font-size:.75rem;font-weight:700;cursor:pointer">✓ Use This Draft</button>
              <button onclick="dismissAICoaching('${gate.field}')" style="background:#6B7280;color:#fff;border:none;padding:.5rem 1rem;border-radius:6px;font-size:.75rem;font-weight:700;cursor:pointer">✕ Dismiss</button>
            </div>
          </div>

          <div style="margin-top:.75rem">
            <label style="display:flex;align-items:center;gap:.5rem;cursor:pointer">
              <input
                type="checkbox"
                id="check-${gate.field}"
                ${isMet ? 'checked' : ''}
                onchange="toggleGate('${gate.field}')"
                style="width:20px;height:20px;cursor:pointer">
              <span style="font-size:.85rem;color:#0D0C08;font-weight:600">Mark as complete (I\'ve confirmed this gate is met)</span>
            </label>
          </div>
        </div>
      </div>
    `;
  });

  html += '</div>';
  return html;
}

// Render IGNITE-specific extras (JTBD + 6 Diagnostics)
function renderIGNITEExtras(opportunity) {
  // Config will be loaded globally on page init
  const config = window.IGNITE_PROVISIONAL_CONFIG;
  if (!config) {
    return '<div style="text-align:center;padding:2rem;color:#DC2626">⚠️ IGNITE config not loaded</div>';
  }

  let html = '';

  // JTBD Section
  if (config.jtbd && config.jtbd.enabled) {
    html += `
      <div style="background:#DBEAFE;border:2px solid #3B82F6;border-radius:12px;padding:1.5rem;margin-top:2rem">
        <div style="display:flex;align-items:center;gap:.75rem;margin-bottom:1rem">
          <div style="font-size:1rem;font-weight:700;color:#1E40AF">🎯 Jobs-To-Be-Done (JTBD)</div>
          <div style="background:#FEF3C7;color:#78350F;padding:.25rem .75rem;border-radius:6px;font-size:.7rem;font-weight:700">⚠️ PROVISIONAL DRAFT</div>
        </div>
        <div style="font-size:.85rem;color:#1E3A8A;margin-bottom:1rem">${config.jtbd.promptText}</div>

        ${config.jtbd.fields.map(field => `
          <div style="margin-bottom:1rem">
            <label style="display:block;font-size:.75rem;font-weight:700;color:#1E40AF;margin-bottom:.5rem;text-transform:uppercase">${field.label}</label>
            <input
              type="text"
              id="jtbd_${field.name}"
              value="${opportunity['jtbd_' + field.name] || ''}"
              placeholder="${field.placeholder}"
              onchange="saveJTBDField('${field.name}')"
              style="width:100%;background:#fff;border:1.5px solid #3B82F6;border-radius:8px;padding:.75rem;font-family:inherit;font-size:.85rem;color:#0D0C08">
            <div style="font-size:.7rem;color:#60A5FA;margin-top:.25rem">${field.hint}</div>
          </div>
        `).join('')}

        <div style="background:#FEF3C7;border:1px solid #F59E0B;border-radius:8px;padding:1rem;margin-top:1rem">
          <div style="font-size:.75rem;font-weight:700;color:#D97706;margin-bottom:.5rem">💡 EXAMPLE (from content bank):</div>
          <div style="font-size:.8rem;color:#78350F;line-height:1.6">
            <strong>When:</strong> ${config.jtbd.example.when_situation}<br>
            <strong>I want to:</strong> ${config.jtbd.example.i_want}<br>
            <strong>So I can:</strong> ${config.jtbd.example.so_i_can}<br>
            <strong>Functional:</strong> ${config.jtbd.example.functional_job}<br>
            <strong>Emotional:</strong> ${config.jtbd.example.emotional_job}<br>
            <strong>Social:</strong> ${config.jtbd.example.social_job}
          </div>
        </div>
      </div>
    `;
  }

  // 6 IGNITE Diagnostics Section
  if (config.igniteDiagnostics && config.igniteDiagnostics.enabled) {
    const diagnostics = config.igniteDiagnostics.questions;
    const passedCount = diagnostics.filter(d => !!opportunity[d.id]).length;
    const passThreshold = config.igniteDiagnostics.passThreshold;
    const passed = passedCount >= passThreshold;

    html += `
      <div style="background:${passed ? '#D1FAE5' : '#FEE2E2'};border:2px solid ${passed ? '#065F46' : '#DC2626'};border-radius:12px;padding:1.5rem;margin-top:2rem">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1rem">
          <div style="display:flex;align-items:center;gap:.75rem">
            <div style="font-size:1rem;font-weight:700;color:${passed ? '#065F46' : '#DC2626'}">🔥 6 IGNITE Diagnostic Checks</div>
            <div style="background:#FEF3C7;color:#78350F;padding:.25rem .75rem;border-radius:6px;font-size:.7rem;font-weight:700">⚠️ PROVISIONAL DRAFT</div>
          </div>
          <div style="font-size:1.5rem;font-weight:800;color:${passed ? '#065F46' : '#DC2626'}">
            ${passedCount}/${diagnostics.length}
            <span style="font-size:.85rem;font-weight:600;margin-left:.5rem">(need ${passThreshold}+ to pass)</span>
          </div>
        </div>

        <div style="font-size:.85rem;color:${passed ? '#065F46' : '#991B1B'};margin-bottom:1.5rem;font-weight:600">
          ${passed ? '✅ IGNITE diagnostic PASSED' : `❌ Need ${passThreshold - passedCount} more to pass`}
        </div>

        <div style="display:flex;flex-direction:column;gap:1rem">
          ${diagnostics.map(diag => {
            const isChecked = !!opportunity[diag.id];
            return `
              <div style="background:${isChecked ? '#D1FAE5' : '#FEE2E2'};border:2px solid ${isChecked ? '#065F46' : '#DC2626'};border-radius:8px;padding:1rem">
                <div style="display:flex;align-items:flex-start;gap:1rem">
                  <div style="font-size:1.5rem;flex-shrink:0">${isChecked ? '✅' : '❌'}</div>
                  <div style="flex:1">
                    <div style="font-size:.9rem;font-weight:700;color:#0D0C08;margin-bottom:.5rem">
                      ${diag.letter} - ${diag.label}
                    </div>
                    <div style="font-size:.85rem;color:#1A1510;margin-bottom:.5rem">
                      ${diag.question}
                    </div>
                    <div style="font-size:.75rem;color:#6B5D4F;font-style:italic">
                      ${diag.hint}
                    </div>
                  </div>
                  <label style="display:flex;align-items:center;gap:.5rem;cursor:pointer;flex-shrink:0">
                    <input
                      type="checkbox"
                      id="check-${diag.id}"
                      ${isChecked ? 'checked' : ''}
                      onchange="toggleIGNITEDiagnostic('${diag.id}')"
                      style="width:20px;height:20px;cursor:pointer">
                  </label>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }

  return html;
}

// Global state
window.QualificationRoadmap = {
  render: function(opportunity) {
    const container = document.getElementById('tab-qualification');
    const roadmapRail = renderRoadmapRail(opportunity);
    const currentStageId = mapStageToRoadmapId(opportunity.stage || opportunity.pipeline_stage || 'raw_lead');
    const stageDetail = renderStageDetail(currentStageId, opportunity);

    container.innerHTML = roadmapRail + '<div id="stage-detail-container">' + stageDetail + '</div>';

    // Initialize strength labels
    initStrengthLabels(opportunity, IGNITE_ROADMAP.find(s => s.id === currentStageId));

    // Initialize AI Co-Pilot
    if (window.initAICoPilot) {
      window.initAICoPilot(opportunity.id);
    }
  }
};

// Raw Lead helper functions
window.saveRawLeadAnswer = async function(field) {
  const value = document.getElementById(field).value;
  try {
    await window.supabaseClient
      .from('opportunities')
      .update({ [field]: value })
      .eq('id', oppId);
    console.log(`[Roadmap] Saved ${field}`);

    // Re-render to update progress
    const { data: opp } = await window.supabaseClient
      .from('opportunities')
      .select('*')
      .eq('id', oppId)
      .single();

    if (opp) {
      const stageDetail = renderStageDetail('raw_lead', opp);
      document.getElementById('stage-detail-container').innerHTML = stageDetail;
    }
  } catch (err) {
    console.error(`[Roadmap] Save error:`, err);
  }
};

window.advanceToIgniteGate = async function(opportunityId) {
  try {
    await window.supabaseClient
      .from('opportunities')
      .update({ stage: 'IGNITE Entry Gate', pipeline_stage: 'Lead' })
      .eq('id', opportunityId);

    // Reload opportunity
    window.location.reload();
  } catch (err) {
    console.error('[Roadmap] Advance error:', err);
    alert('Failed to advance stage');
  }
};

async function triggerRawLeadAICoach(opportunity) {
  const container = document.getElementById('raw-lead-ai-coach');
  if (!container) return;

  // Show loading
  container.innerHTML = `
    <div style="background:#FEF3C7;border-left:4px solid #F59E0B;border-radius:8px;padding:1.25rem">
      <div style="display:flex;align-items:center;gap:.5rem;color:#B45309;margin-bottom:.75rem">
        <span>🤖</span>
        <span style="font-size:.85rem;font-weight:700">AI Coach</span>
      </div>
      <div style="font-size:.85rem;color:#92400E">Loading coaching...</div>
    </div>
  `;

  try {
    const { data: { session } } = await window.supabaseClient.auth.getSession();
    if (!session) return;

    const answers = [
      opportunity.raw_lead_trigger,
      opportunity.raw_lead_authority,
      opportunity.raw_lead_pain,
      opportunity.raw_lead_justify
    ].filter(a => a && a.trim()).join('\n');

    const response = await fetch(`${window.supabaseClient.supabaseUrl}/functions/v1/ai-coaching`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        context: 'raw_lead',
        dealName: opportunity.name || opportunity.company_name,
        ownerName: opportunity.owner_name || 'rep',
        currentAnswers: answers,
        promptInstruction: 'This rep has a new Raw Lead. Give them 2-3 specific questions to ask the prospect to determine if this lead is worth running through the IGNITE diagnostic. Be concise, specific, and practical.'
      })
    });

    if (!response.ok) throw new Error('AI unavailable');

    let coaching;
    try {
      const responseText = await response.text();
      // Strip markdown code fences and any text after closing brace
      let jsonText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const closingBraceIdx = jsonText.lastIndexOf('}');
      if (closingBraceIdx !== -1) {
        jsonText = jsonText.substring(0, closingBraceIdx + 1);
      }
      coaching = JSON.parse(jsonText);
    } catch (parseErr) {
      console.error('[AI Coach] JSON parse error:', parseErr);
      // Fallback: try to extract JSON from response
      const responseText = await response.text();
      coaching = { draft: responseText.replace(/[{}]/g, '').replace(/"|'/g, ''), confidence: 'low' };
    }

    // Confidence badge styling
    const confidenceBadges = {
      low: { bg: '#FEE2E2', text: '#991B1B', label: 'LOW' },
      medium: { bg: '#FEF3C7', text: '#92400E', label: 'MEDIUM' },
      high: { bg: '#D1FAE5', text: '#065F46', label: 'HIGH' }
    };
    const badge = confidenceBadges[coaching.confidence] || confidenceBadges.medium;

    container.innerHTML = `
      <div style="background:#FEF3C7;border-left:4px solid #F59E0B;border-radius:8px;padding:1.25rem">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1rem">
          <div style="display:flex;align-items:center;gap:.5rem;color:#B45309">
            <span>🤖</span>
            <span style="font-size:.85rem;font-weight:700">AI Coach</span>
          </div>
          <span style="background:${badge.bg};color:${badge.text};padding:.2rem .5rem;border-radius:4px;font-size:.7rem;font-weight:700">${badge.label}</span>
        </div>

        <div style="border-top:1px solid #E5DFD5;padding-top:1rem">
          ${coaching.draft ? `
            <div style="margin-bottom:1rem">
              <div style="font-size:.75rem;font-weight:700;color:#B45309;margin-bottom:.5rem">📋 Coaching Note</div>
              <div style="font-size:.85rem;color:#0D0C08;line-height:1.6">${coaching.draft}</div>
            </div>
          ` : ''}

          ${coaching.weakEvidence && coaching.weakEvidence.length > 0 ? `
            <div style="margin-bottom:1rem">
              <div style="font-size:.75rem;font-weight:700;color:#DC2626;margin-bottom:.5rem">⚠️ Weak Evidence Flags</div>
              <ul style="margin:0;padding-left:1.5rem;font-size:.85rem;color:#991B1B;line-height:1.8">
                ${coaching.weakEvidence.map(flag => `<li>${flag}</li>`).join('')}
              </ul>
            </div>
          ` : ''}

          ${coaching.nextAction ? `
            <div style="background:#FFF7ED;border:1px solid #F59E0B;border-radius:6px;padding:.75rem">
              <div style="font-size:.75rem;font-weight:700;color:#C2410C;margin-bottom:.5rem">🎯 Next Action</div>
              <div style="font-size:.85rem;color:#0D0C08;font-weight:600">${coaching.nextAction}</div>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  } catch (err) {
    console.error('[AI Coach] Error:', err);
    container.innerHTML = `
      <div style="background:#F3F4F6;border-left:4px solid #9CA3AF;border-radius:8px;padding:1.25rem">
        <div style="display:flex;align-items:center;gap:.5rem;color:#6B7280;margin-bottom:.5rem">
          <span>🤖</span>
          <span style="font-size:.85rem;font-weight:700">AI Coach</span>
        </div>
        <div style="font-size:.85rem;color:#6B7280">AI coaching temporarily unavailable. Complete the questions above and advance when ready.</div>
      </div>
    `;
  }
}

// Global functions for UI interactions
window.selectRoadmapStage = function(stageId) {
  const stageDetail = renderStageDetail(stageId, currentOpportunity);
  document.getElementById('stage-detail-container').innerHTML = stageDetail;

  // Re-initialize strength labels for new stage
  initStrengthLabels(currentOpportunity, IGNITE_ROADMAP.find(s => s.id === stageId));
};

function initStrengthLabels(opportunity, stage) {
  if (!stage || !stage.gates) return;

  stage.gates.forEach(gate => {
    const field = gate.field;
    const slider = document.getElementById(`strength-${field}`);
    if (slider) {
      updateStrengthLabel(field);
    }
  });
}

window.saveGateAnswer = async function(field) {
  const value = document.getElementById(`gate-${field}`).value;
  try {
    await window.supabaseClient
      .from('opportunities')
      .update({ [field + '_notes']: value })
      .eq('id', oppId);
    console.log(`[Roadmap] Saved ${field}_notes`);
  } catch (err) {
    console.error(`[Roadmap] Save error:`, err);
  }
};

window.toggleGate = async function(field) {
  const checkbox = document.getElementById(`check-${field}`);
  const checked = checkbox.checked;

  // Warn if marking complete with weak evidence
  if (checked) {
    const strengthSlider = document.getElementById(`strength-${field}`);
    const strength = strengthSlider ? parseInt(strengthSlider.value) : 3;

    if (strength <= 2) {
      const proceed = confirm(
        '⚠️ Weak Evidence Warning\n\n' +
        `This gate is scored ${strength}/5 (Weak).\n\n` +
        'Consider:\n' +
        '• Strengthening your evidence with specific details\n' +
        '• Getting verification from multiple sources\n' +
        '• Using AI Coaching to improve this answer\n\n' +
        'Mark complete anyway?'
      );

      if (!proceed) {
        checkbox.checked = false;
        return;
      }
    }
  }

  try {
    await window.supabaseClient
      .from('opportunities')
      .update({ [field]: checked })
      .eq('id', oppId);

    // Reload to check auto-advance
    await loadOpportunity(oppId);

    console.log(`[Roadmap] Toggled ${field} = ${checked}`);

    // Trigger AI coaching after toggle
    if (window.triggerCoachingAfterSave) {
      window.triggerCoachingAfterSave(oppId, field);
    }
  } catch (err) {
    console.error(`[Roadmap] Toggle error:`, err);
  }
};

// Evidence Strength Calibration
window.updateStrengthLabel = function(field) {
  const slider = document.getElementById(`strength-${field}`);
  const label = document.getElementById(`strength-label-${field}`);
  const value = parseInt(slider.value);

  const labels = {
    1: { text: '1 — Very Weak', bg: '#FEE2E2', color: '#991B1B' },
    2: { text: '2 — Weak', bg: '#FED7AA', color: '#9A3412' },
    3: { text: '3 — Moderate', bg: '#FEF3C7', color: '#92400E' },
    4: { text: '4 — Strong', bg: '#BBF7D0', color: '#166534' },
    5: { text: '5 — Very Strong', bg: '#D1FAE5', color: '#065F46' }
  };

  const l = labels[value];
  label.textContent = l.text;
  label.style.background = l.bg;
  label.style.color = l.color;
};

window.saveGateStrength = async function(field) {
  const value = parseInt(document.getElementById(`strength-${field}`).value);
  try {
    await window.supabaseClient
      .from('opportunities')
      .update({ [field + '_strength']: value })
      .eq('id', oppId);
    console.log(`[Roadmap] Saved ${field}_strength = ${value}`);

    // Trigger AI coaching after save
    if (window.triggerCoachingAfterSave) {
      window.triggerCoachingAfterSave(oppId, field);
    }
  } catch (err) {
    console.error(`[Roadmap] Strength save error:`, err);
  }
};

// AI Coaching functions
window.getAICoaching = async function(stageId, gateField) {
  const btn = event.target;
  const originalText = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = '⏳ Thinking...';

  try {
    const { data: { session } } = await window.supabaseClient.auth.getSession();
    if (!session) throw new Error('Not authenticated');

    const response = await fetch(`${window.supabaseClient.supabaseUrl}/functions/v1/ai-coaching`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        opportunityId: oppId,
        stageId: stageId,
        gateField: gateField
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'AI coaching failed');
    }

    let coaching;
    try {
      const responseText = await response.text();
      // Strip markdown code fences and any text after closing brace
      let jsonText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const closingBraceIdx = jsonText.lastIndexOf('}');
      if (closingBraceIdx !== -1) {
        jsonText = jsonText.substring(0, closingBraceIdx + 1);
      }
      coaching = JSON.parse(jsonText);
    } catch (parseErr) {
      console.error('[AI Coaching] JSON parse error:', parseErr);
      // Fallback: display error
      throw new Error('Failed to parse AI response');
    }

    // Display coaching
    const container = document.getElementById(`ai-coaching-${gateField}`);
    const draftEl = document.getElementById(`ai-draft-${gateField}`);
    const weakEl = document.getElementById(`ai-weak-${gateField}`);
    const nextEl = document.getElementById(`ai-next-${gateField}`);

    // Store draft in data attribute for later use
    draftEl.dataset.draft = coaching.draft;

    draftEl.innerHTML = `
      <div style="font-size:.75rem;font-weight:700;color:#1E40AF;margin-bottom:.25rem">DRAFT ANSWER (review & edit before using):</div>
      <div style="background:#fff;border-radius:6px;padding:.75rem;font-size:.85rem;color:#0D0C08;line-height:1.6">${coaching.draft}</div>
      <div style="font-size:.7rem;color:#6B5D4F;margin-top:.5rem">Confidence: ${coaching.confidence.toUpperCase()}</div>
    `;

    if (coaching.weakEvidence && coaching.weakEvidence.length > 0) {
      weakEl.innerHTML = `
        <div style="font-size:.75rem;font-weight:700;color:#DC2626;margin-bottom:.5rem">⚠️ WEAK EVIDENCE FLAGS:</div>
        <ul style="margin:0;padding-left:1.5rem;color:#991B1B;font-size:.8rem;line-height:1.8">
          ${coaching.weakEvidence.map(flag => `<li>${flag}</li>`).join('')}
        </ul>
      `;
    } else {
      weakEl.innerHTML = '';
    }

    nextEl.innerHTML = `
      <div style="font-size:.75rem;font-weight:700;color:#065F46;margin-bottom:.5rem">✅ NEXT BEST ACTION:</div>
      <div style="background:#D1FAE5;border-radius:6px;padding:.75rem;font-size:.85rem;color:#065F46;font-weight:600">${coaching.nextAction}</div>
    `;

    container.style.display = 'block';
    container.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

  } catch (err) {
    console.error('[AI Coaching] Error:', err);
    alert('AI coaching failed: ' + err.message);
  } finally {
    btn.disabled = false;
    btn.innerHTML = originalText;
  }
};

window.acceptAIDraft = function(gateField) {
  const draftEl = document.getElementById(`ai-draft-${gateField}`);
  const draft = draftEl.dataset.draft;

  if (!draft) return;

  // Fill textarea with draft
  const textarea = document.getElementById(`gate-${gateField}`);
  textarea.value = draft;

  // Save it
  saveGateAnswer(gateField);

  // Dismiss coaching
  dismissAICoaching(gateField);

  // Show confirmation
  alert('✓ Draft accepted! Please review and edit as needed, then mark the gate complete.');
};

window.dismissAICoaching = function(gateField) {
  const container = document.getElementById(`ai-coaching-${gateField}`);
  container.style.display = 'none';
};

// JTBD field save
window.saveJTBDField = async function(fieldName) {
  const value = document.getElementById(`jtbd_${fieldName}`).value;
  try {
    await window.supabaseClient
      .from('opportunities')
      .update({ ['jtbd_' + fieldName]: value })
      .eq('id', oppId);
    console.log(`[Roadmap] Saved JTBD field: ${fieldName}`);
  } catch (err) {
    console.error(`[Roadmap] JTBD save error:`, err);
  }
};

// IGNITE diagnostic toggle
window.toggleIGNITEDiagnostic = async function(diagnosticId) {
  const checked = document.getElementById(`check-${diagnosticId}`).checked;
  try {
    await window.supabaseClient
      .from('opportunities')
      .update({ [diagnosticId]: checked })
      .eq('id', oppId);

    // Reload to update score
    await loadOpportunity(oppId);

    console.log(`[Roadmap] Toggled ${diagnosticId} = ${checked}`);
  } catch (err) {
    console.error(`[Roadmap] IGNITE diagnostic toggle error:`, err);
  }
};

// Load provisional config on page init
(async function loadIGNITEConfig() {
  try {
    const response = await fetch('./ignite-provisional-config.json');
    window.IGNITE_PROVISIONAL_CONFIG = await response.json();
    console.log('[IGNITE] Provisional config loaded');
  } catch (err) {
    console.error('[IGNITE] Failed to load provisional config:', err);
  }
})();

console.log('[QualificationRoadmap] Loaded');
