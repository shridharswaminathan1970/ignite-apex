/**
 * AI Co-Pilot for IGNITE-APEX CRM
 * Phase D: Proactive, context-aware AI coaching
 *
 * Features:
 * - Auto-triggers when gate opens (no button needed)
 * - Full deal context (all gates, activities, history)
 * - Deal health score (Red/Amber/Green)
 * - Next-step suggestions visible in deal header
 * - Session-level pattern learning
 */

// Session-level learning cache
const sessionPatterns = {
  deals: [], // [{dealId, stage, gates, outcome}]
  commonBlockers: {}, // {stageId: [blocker1, blocker2]}
  successPatterns: [] // [pattern descriptions]
};

/**
 * Initialize AI Co-Pilot for a deal
 * Called when qualification roadmap loads
 */
window.initAICoPilot = async function(opportunityId) {
  if (!opportunityId) return;

  // Load deal into session patterns
  trackDealInSession(opportunityId);

  // Calculate and display deal health
  await updateDealHealth(opportunityId);

  // Show proactive coaching panel
  await showProactiveCoaching(opportunityId);
};

/**
 * Track deal in session for pattern learning
 */
async function trackDealInSession(opportunityId) {
  try {
    const { data: opp } = await window.supabaseClient
      .from('opportunities')
      .select('*')
      .eq('id', opportunityId)
      .single();

    if (!opp) return;

    // Check if already tracked
    const existing = sessionPatterns.deals.find(d => d.dealId === opportunityId);
    if (existing) {
      // Update existing
      Object.assign(existing, {
        stage: opp.stage_id,
        gates: extractGateStatus(opp),
        lastActivity: new Date()
      });
    } else {
      // Add new
      sessionPatterns.deals.push({
        dealId: opportunityId,
        stage: opp.stage_id,
        gates: extractGateStatus(opp),
        lastActivity: new Date()
      });
    }
  } catch (err) {
    console.error('[AI Co-Pilot] Session tracking error:', err);
  }
}

/**
 * Extract gate completion status from opportunity
 */
function extractGateStatus(opp) {
  const gates = {};

  // 4U gates
  ['demand_4u_unworkable', 'demand_4u_urgent', 'demand_4u_unavoidable', 'demand_4u_underserved'].forEach(field => {
    gates[field] = {
      met: opp[field] || false,
      notes: opp[field + '_notes'] || '',
      strength: opp[field + '_strength'] || 0
    };
  });

  // Key gates
  ['gate_economic_buyer_identified', 'gate_metrics_quantified', 'gate_champion_emerging',
   'gate_pain_tied_to_outcome'].forEach(field => {
    gates[field] = {
      met: opp[field] || false,
      notes: opp[field + '_notes'] || '',
      strength: opp[field + '_strength'] || 0
    };
  });

  return gates;
}

/**
 * Calculate Deal Health Score
 * Returns: { score: 0-100, status: 'red'|'amber'|'green', reasons: [] }
 */
async function calculateDealHealth(opportunityId) {
  try {
    const { data: opp } = await window.supabaseClient
      .from('opportunities')
      .select('*')
      .eq('id', opportunityId)
      .single();

    if (!opp) return { score: 0, status: 'red', reasons: ['Deal not found'] };

    let score = 0;
    const reasons = [];

    // Count gates met (40 points max)
    const allGates = [
      'demand_4u_unworkable', 'demand_4u_urgent', 'demand_4u_unavoidable', 'demand_4u_underserved',
      'gate_economic_buyer_identified', 'gate_metrics_quantified', 'gate_champion_emerging',
      'gate_pain_tied_to_outcome'
    ];
    const gatesMet = allGates.filter(g => opp[g]).length;
    score += (gatesMet / allGates.length) * 40;

    if (gatesMet < 4) reasons.push(`Only ${gatesMet}/8 gates met`);

    // Average strength score (30 points max)
    const strengthFields = allGates.map(g => g + '_strength');
    const strengths = strengthFields.map(f => opp[f] || 0).filter(s => s > 0);
    if (strengths.length > 0) {
      const avgStrength = strengths.reduce((a, b) => a + b, 0) / strengths.length;
      score += (avgStrength / 5) * 30;
      if (avgStrength < 3) reasons.push('Evidence is weak (avg < 3)');
    } else {
      reasons.push('No evidence calibrated');
    }

    // Recent activity (20 points max)
    const { data: activities } = await window.supabaseClient
      .from('activities')
      .select('created_at')
      .eq('opportunity_id', opportunityId)
      .order('created_at', { ascending: false })
      .limit(1);

    if (activities && activities.length > 0) {
      const daysSinceActivity = (Date.now() - new Date(activities[0].created_at)) / (1000 * 60 * 60 * 24);
      if (daysSinceActivity < 7) {
        score += 20;
      } else if (daysSinceActivity < 14) {
        score += 10;
        reasons.push('No activity in >7 days');
      } else {
        reasons.push('Stale (no activity >14 days)');
      }
    } else {
      reasons.push('No activities logged');
    }

    // Stage vs close date (10 points max)
    if (opp.close_date) {
      const daysToClose = (new Date(opp.close_date) - Date.now()) / (1000 * 60 * 60 * 24);
      if (daysToClose > 30) {
        score += 10;
      } else if (daysToClose < 7 && gatesMet < 6) {
        score -= 10;
        reasons.push('Close date near but gates incomplete');
      }
    }

    // Status
    let status = 'red';
    if (score >= 70) status = 'green';
    else if (score >= 50) status = 'amber';

    return { score: Math.round(score), status, reasons };

  } catch (err) {
    console.error('[AI Co-Pilot] Health calc error:', err);
    return { score: 0, status: 'red', reasons: ['Error calculating health'] };
  }
}

/**
 * Update deal health indicator in UI
 */
async function updateDealHealth(opportunityId) {
  const health = await calculateDealHealth(opportunityId);

  // Find or create health indicator in deal header
  let healthEl = document.getElementById('deal-health-indicator');
  if (!healthEl) {
    // Create in deal header (assumes there's a .deal-header element)
    const header = document.querySelector('.deal-header') || document.querySelector('h1')?.parentElement;
    if (header) {
      healthEl = document.createElement('div');
      healthEl.id = 'deal-health-indicator';
      healthEl.style.cssText = 'display:inline-flex;align-items:center;gap:0.5rem;margin-left:1rem;padding:0.5rem 1rem;border-radius:8px;font-size:0.85rem;font-weight:700';
      header.appendChild(healthEl);
    }
  }

  if (healthEl) {
    const colors = {
      green: { bg: '#D1FAE5', text: '#065F46', icon: '✅' },
      amber: { bg: '#FEF3C7', text: '#92400E', icon: '⚠️' },
      red: { bg: '#FEE2E2', text: '#991B1B', icon: '🚨' }
    };
    const c = colors[health.status];

    healthEl.style.background = c.bg;
    healthEl.style.color = c.text;
    healthEl.innerHTML = `
      ${c.icon} Deal Health: ${health.score}/100
      <span style="font-size:0.7rem;opacity:0.8;font-weight:400;margin-left:0.5rem">${health.status.toUpperCase()}</span>
    `;
    healthEl.title = health.reasons.join('\n');
  }
}

/**
 * Show proactive coaching panel
 * Triggers automatically when roadmap loads
 */
async function showProactiveCoaching(opportunityId, targetGate = null) {
  // Find or create coaching container
  let coachingPanel = document.getElementById('ai-copilot-panel');
  if (!coachingPanel) {
    // Insert at top of roadmap
    const roadmapContainer = document.querySelector('.roadmap-container') || document.querySelector('#roadmap-content');
    if (roadmapContainer) {
      coachingPanel = document.createElement('div');
      coachingPanel.id = 'ai-copilot-panel';
      coachingPanel.style.cssText = `
        background: linear-gradient(135deg, #DBEAFE 0%, #E0E7FF 100%);
        border: 2px solid #3B82F6;
        border-radius: 12px;
        padding: 1.25rem;
        margin-bottom: 1.5rem;
        box-shadow: 0 4px 12px rgba(59,130,246,0.15);
      `;
      roadmapContainer.insertBefore(coachingPanel, roadmapContainer.firstChild);
    }
  }

  if (!coachingPanel) return;

  // Show loading state
  coachingPanel.innerHTML = `
    <div style="display:flex;align-items:center;gap:0.75rem;color:#1E40AF">
      <div class="spinner" style="width:20px;height:20px;border:3px solid #BFDBFE;border-top-color:#3B82F6;border-radius:50%;animation:spin 1s linear infinite"></div>
      <span style="font-weight:700;font-size:0.85rem">🤖 AI Co-Pilot analyzing deal...</span>
    </div>
  `;

  try {
    // Get full deal context
    const context = await buildFullDealContext(opportunityId);

    // Call AI coaching with full context
    const { data: { session } } = await window.supabaseClient.auth.getSession();
    if (!session) throw new Error('Not authenticated');

    const response = await fetch(`${window.supabaseClient.supabaseUrl}/functions/v1/ai-coaching-copilot`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        opportunityId: opportunityId,
        fullContext: context,
        sessionPatterns: sessionPatterns,
        targetGate: targetGate
      })
    });

    if (!response.ok) {
      throw new Error('AI unavailable');
    }

    const coaching = await response.json();

    // Render coaching
    coachingPanel.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:1rem">
        <div style="display:flex;align-items:center;gap:0.5rem">
          <span style="font-size:1.5rem">🤖</span>
          <span style="font-size:0.85rem;font-weight:700;color:#1E40AF;text-transform:uppercase;letter-spacing:0.5px">AI Co-Pilot</span>
        </div>
        <button onclick="refreshAICoaching('${opportunityId}')" style="background:#fff;border:1px solid #3B82F6;color:#1E40AF;padding:0.25rem 0.75rem;border-radius:6px;font-size:0.7rem;font-weight:600;cursor:pointer">
          ↻ Refresh
        </button>
      </div>

      ${coaching.strengths && coaching.strengths.length > 0 ? `
        <div style="margin-bottom:1rem">
          <div style="font-size:0.75rem;font-weight:700;color:#065F46;margin-bottom:0.5rem">✅ WHAT'S STRONG:</div>
          <ul style="margin:0;padding-left:1.5rem;color:#065F46;font-size:0.8rem;line-height:1.8">
            ${coaching.strengths.map(s => `<li>${s}</li>`).join('')}
          </ul>
        </div>
      ` : ''}

      ${coaching.weaknesses && coaching.weaknesses.length > 0 ? `
        <div style="margin-bottom:1rem">
          <div style="font-size:0.75rem;font-weight:700;color:#DC2626;margin-bottom:0.5rem">⚠️ WHAT'S MISSING OR WEAK:</div>
          <ul style="margin:0;padding-left:1.5rem;color:#991B1B;font-size:0.8rem;line-height:1.8">
            ${coaching.weaknesses.map(w => `<li>${w}</li>`).join('')}
          </ul>
        </div>
      ` : ''}

      <div style="background:#fff;border-left:4px solid #10B981;border-radius:6px;padding:1rem;margin-bottom:1rem">
        <div style="font-size:0.75rem;font-weight:700;color:#065F46;margin-bottom:0.5rem;text-transform:uppercase;letter-spacing:0.5px">
          → MOST IMPORTANT NEXT ACTION:
        </div>
        <div style="font-size:0.9rem;color:#065F46;font-weight:600;line-height:1.6">
          ${coaching.nextAction || 'Continue gathering evidence'}
        </div>
      </div>

      ${coaching.reframe ? `
        <div style="background:#FEF3C7;border-left:4px solid #F59E0B;border-radius:6px;padding:1rem">
          <div style="font-size:0.75rem;font-weight:700;color:#92400E;margin-bottom:0.5rem">💡 SUGGESTED REFRAME:</div>
          <div style="font-size:0.85rem;color:#92400E;line-height:1.6">${coaching.reframe}</div>
        </div>
      ` : ''}

      ${coaching.pattern ? `
        <div style="margin-top:1rem;padding-top:1rem;border-top:1px solid #BFDBFE">
          <div style="font-size:0.7rem;color:#6B5D4F;font-style:italic">
            📊 Pattern: ${coaching.pattern}
          </div>
        </div>
      ` : ''}
    `;

    // Update "next action" in deal header
    updateDealHeaderAction(coaching.nextAction);

  } catch (err) {
    console.error('[AI Co-Pilot] Error:', err);
    coachingPanel.innerHTML = `
      <div style="display:flex;align-items:center;gap:0.75rem;color:#6B7280">
        <span style="font-size:1.25rem">🤖</span>
        <span style="font-size:0.8rem">AI coaching temporarily unavailable</span>
        <button onclick="refreshAICoaching('${opportunityId}')" style="background:#E5E7EB;border:none;color:#374151;padding:0.25rem 0.75rem;border-radius:6px;font-size:0.7rem;cursor:pointer;margin-left:auto">
          Try Again
        </button>
      </div>
    `;
  }
}

/**
 * Build full deal context for AI
 */
async function buildFullDealContext(opportunityId) {
  const { data: opp } = await window.supabaseClient
    .from('opportunities')
    .select('*')
    .eq('id', opportunityId)
    .single();

  if (!opp) return null;

  // Get activities
  const { data: activities } = await window.supabaseClient
    .from('activities')
    .select('*')
    .eq('opportunity_id', opportunityId)
    .order('created_at', { ascending: false })
    .limit(5);

  return {
    deal: opp,
    activities: activities || [],
    gates: extractGateStatus(opp),
    health: await calculateDealHealth(opportunityId)
  };
}

/**
 * Update deal header with next action
 */
function updateDealHeaderAction(action) {
  if (!action) return;

  let actionEl = document.getElementById('deal-next-action');
  if (!actionEl) {
    const header = document.querySelector('.deal-header') || document.querySelector('h1')?.parentElement;
    if (header) {
      actionEl = document.createElement('div');
      actionEl.id = 'deal-next-action';
      actionEl.style.cssText = `
        margin-top: 0.75rem;
        background: #ECFDF5;
        border-left: 4px solid #10B981;
        border-radius: 6px;
        padding: 0.75rem 1rem;
        font-size: 0.85rem;
        color: #065F46;
        font-weight: 600;
      `;
      header.appendChild(actionEl);
    }
  }

  if (actionEl) {
    actionEl.innerHTML = `→ ${action}`;
  }
}

/**
 * Refresh AI coaching (manual trigger)
 */
window.refreshAICoaching = async function(opportunityId) {
  await showProactiveCoaching(opportunityId);
};

/**
 * Trigger coaching after gate save
 */
window.triggerCoachingAfterSave = async function(opportunityId, gateField) {
  // Update health
  await updateDealHealth(opportunityId);

  // Refresh coaching with focus on changed gate
  await showProactiveCoaching(opportunityId, gateField);
};

// Add CSS animation for spinner
if (!document.getElementById('ai-copilot-styles')) {
  const style = document.createElement('style');
  style.id = 'ai-copilot-styles';
  style.textContent = `
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(style);
}

console.log('[AI Co-Pilot] Loaded');
