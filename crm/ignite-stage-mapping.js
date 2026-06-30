/**
 * ignite-stage-mapping.js
 * Auto-map IGNITE diagnostic stages to sales pipeline stages
 * IGNITE stages (I→G→N→I2→T→E) are PRE-SALES demand creation
 * After APEX (E complete), deal enters normal sales cycle at 50%
 */

class IgniteStageMapping {
  /**
   * Map IGNITE completion to pipeline stage
   * Returns suggested pipeline stage and probability based on IGNITE progress
   */
  static getRecommendedStage(opportunity) {
    const ignite = {
      i: opportunity.ignite_stage_i_complete,
      g: opportunity.ignite_stage_g_complete,
      n: opportunity.ignite_stage_n_complete,
      i2: opportunity.ignite_stage_i2_complete,
      t: opportunity.ignite_stage_t_complete,
      e: opportunity.ignite_stage_e_complete
    };

    const probe = {
      t1_passed: opportunity.probe_t1_passed,
      t2_passed: opportunity.probe_t2_passed,
      t3_passed: opportunity.probe_t3_passed
    };

    const current = opportunity.ignite_current_stage || 'I';

    // PHASE 1: PRE-APEX (Demand Creation Diagnostic)
    // I (Identify) → Qualification 10%
    if (ignite.i && !ignite.g) {
      return {
        stage: 'Qualification',
        probability: 10,
        phase: 'IGNITE Diagnostic',
        description: 'Trigger event identified - building demand',
        ignite_stage: 'I',
        auto: true
      };
    }

    // G (Go Deep), N (Nail Insight) → Discovery 30%
    if ((ignite.g || ignite.n) && !ignite.i2) {
      return {
        stage: 'Discovery',
        probability: 30,
        phase: 'IGNITE Diagnostic',
        description: 'Understanding strategic priorities and pain',
        ignite_stage: ignite.n ? 'N' : 'G',
        auto: true
      };
    }

    // I2 (Initiate), T (Track) → Discovery 30% (still building relationship)
    if ((ignite.i2 || ignite.t) && !ignite.e) {
      return {
        stage: 'Discovery',
        probability: 30,
        phase: 'IGNITE Diagnostic',
        description: 'Engaging prospect and building champion',
        ignite_stage: ignite.t ? 'T' : 'I2',
        auto: true
      };
    }

    // E (Escalate) complete → APEX REACHED → Demo 50%
    if (ignite.e && !probe.t1_passed) {
      return {
        stage: 'Demo',
        probability: 50,
        phase: 'APEX - Ready to Demo',
        description: '🎯 APEX reached! Demand created, ready to demo solution',
        ignite_stage: 'E',
        auto: true
      };
    }

    // PHASE 2: POST-APEX (PROBE Qualification)
    // PROBE T1 passed → Demo 50% (basic qualification)
    if (probe.t1_passed && !probe.t2_passed) {
      return {
        stage: 'Demo',
        probability: 50,
        phase: 'PROBE T1 Qualified',
        description: 'Basic qualification passed - demo validated',
        ignite_stage: 'PROBE',
        auto: true
      };
    }

    // PROBE T2 passed → Proposal 70% (deep qualification)
    if (probe.t2_passed && !probe.t3_passed) {
      return {
        stage: 'Proposal',
        probability: 70,
        phase: 'PROBE T2 Qualified',
        description: 'Deep qualification passed - ready for proposal',
        ignite_stage: 'PROBE',
        auto: true
      };
    }

    // PROBE T3 passed → Negotiation 90% (final qualification)
    if (probe.t3_passed && !opportunity.gate_contract_signed) {
      return {
        stage: 'Negotiation',
        probability: 90,
        phase: 'PROBE T3 Qualified',
        description: 'All qualification gates passed - negotiating contract',
        ignite_stage: 'PROBE',
        auto: true
      };
    }

    // Contract signed → Closed Won 100%
    if (opportunity.gate_contract_signed) {
      return {
        stage: 'Closed Won',
        probability: 100,
        phase: 'CLOSED',
        description: 'Contract signed - deal won!',
        ignite_stage: 'CLOSED',
        auto: true
      };
    }

    // Default: stay at current stage
    return {
      stage: opportunity.pipeline_stage || 'Qualification',
      probability: opportunity.probability || 10,
      phase: 'In Progress',
      description: 'Continue IGNITE diagnostic',
      ignite_stage: current,
      auto: false
    };
  }

  /**
   * Check if pipeline stage should auto-advance based on IGNITE progress
   * Returns true if current stage is behind IGNITE progress
   */
  static shouldAutoAdvance(opportunity) {
    const recommended = this.getRecommendedStage(opportunity);
    const currentStage = opportunity.pipeline_stage || 'Qualification';

    const stageOrder = ['Lead', 'Qualification', 'Discovery', 'Demo', 'Proposal', 'Negotiation', 'Closed Won'];
    const currentIndex = stageOrder.indexOf(currentStage);
    const recommendedIndex = stageOrder.indexOf(recommended.stage);

    // Only auto-advance if recommended stage is ahead of current
    return recommendedIndex > currentIndex && recommended.auto;
  }

  /**
   * Get visual indicator for IGNITE progress vs Pipeline stage
   */
  static renderProgressIndicator(opportunity) {
    const recommended = this.getRecommendedStage(opportunity);
    const current = opportunity.pipeline_stage || 'Qualification';
    const shouldAdvance = this.shouldAutoAdvance(opportunity);

    const igniteProgress = [
      { key: 'i', label: 'I', complete: opportunity.ignite_stage_i_complete },
      { key: 'g', label: 'G', complete: opportunity.ignite_stage_g_complete },
      { key: 'n', label: 'N', complete: opportunity.ignite_stage_n_complete },
      { key: 'i2', label: 'I²', complete: opportunity.ignite_stage_i2_complete },
      { key: 't', label: 'T', complete: opportunity.ignite_stage_t_complete },
      { key: 'e', label: 'E', complete: opportunity.ignite_stage_e_complete }
    ];

    const completedCount = igniteProgress.filter(s => s.complete).length;
    const progressPercent = (completedCount / 6) * 100;

    return `
      <div style="background:#F8F5EF;border:2px solid #E5DFD5;border-radius:12px;padding:1.5rem;margin-bottom:1.5rem">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem">
          <div>
            <div style="font-size:1rem;font-weight:700;color:#0D0C08;margin-bottom:.25rem">
              📊 IGNITE Diagnostic Progress
            </div>
            <div style="font-size:.85rem;color:#6B5D4F">
              ${recommended.phase}: ${recommended.description}
            </div>
          </div>
          <div style="text-align:right">
            <div style="font-size:1.5rem;font-weight:800;color:#F59E0B">${completedCount}/6</div>
            <div style="font-size:.75rem;color:#6B5D4F;text-transform:uppercase">Stages</div>
          </div>
        </div>

        <!-- IGNITE Stage Pills -->
        <div style="display:flex;gap:.5rem;margin-bottom:1rem;flex-wrap:wrap">
          ${igniteProgress.map(stage => `
            <div style="background:${stage.complete ? '#10B981' : '#E5DFD5'};color:${stage.complete ? '#fff' : '#9C8D7A'};padding:.5rem .75rem;border-radius:8px;font-weight:700;font-size:.85rem">
              ${stage.label} ${stage.complete ? '✓' : ''}
            </div>
          `).join('')}
        </div>

        <!-- Progress Bar -->
        <div style="background:#E5DFD5;height:8px;border-radius:4px;overflow:hidden;margin-bottom:1rem">
          <div style="background:#F59E0B;height:100%;width:${progressPercent}%;transition:width .3s"></div>
        </div>

        <!-- Auto-Advance Recommendation -->
        ${shouldAdvance ? `
          <div style="background:#FEF3C7;border:2px solid #F59E0B;border-radius:8px;padding:1rem;display:flex;justify-content:space-between;align-items:center">
            <div>
              <div style="font-weight:700;color:#0D0C08;margin-bottom:.25rem">
                🚀 Ready to Advance
              </div>
              <div style="font-size:.85rem;color:#6B5D4F">
                IGNITE progress suggests moving from <strong>${current}</strong> → <strong>${recommended.stage}</strong> (${recommended.probability}%)
              </div>
            </div>
            <button
              onclick="autoAdvanceStage()"
              style="background:#F59E0B;color:#000;border:none;padding:.75rem 1.5rem;border-radius:8px;font-weight:700;cursor:pointer;white-space:nowrap">
              Auto-Advance →
            </button>
          </div>
        ` : `
          <div style="font-size:.85rem;color:#10B981;font-weight:600">
            ✓ Pipeline stage (${current} ${opportunity.probability}%) matches IGNITE progress
          </div>
        `}
      </div>
    `;
  }

  /**
   * Calculate IGNITE completion score (0-100)
   */
  static getCompletionScore(opportunity) {
    const stages = [
      opportunity.ignite_stage_i_complete,
      opportunity.ignite_stage_g_complete,
      opportunity.ignite_stage_n_complete,
      opportunity.ignite_stage_i2_complete,
      opportunity.ignite_stage_t_complete,
      opportunity.ignite_stage_e_complete
    ];

    const completed = stages.filter(Boolean).length;
    const baseScore = (completed / 6) * 60; // IGNITE stages = 60%

    // PROBE adds remaining 40%
    const probeScore =
      (opportunity.probe_t1_passed ? 13 : 0) +
      (opportunity.probe_t2_passed ? 13 : 0) +
      (opportunity.probe_t3_passed ? 14 : 0);

    return Math.round(baseScore + probeScore);
  }
}

window.IgniteStageMapping = IgniteStageMapping;
console.log('[IgniteStageMapping] Loaded');
