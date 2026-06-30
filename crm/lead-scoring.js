/**
 * lead-scoring.js
 * Auto-calculate lead scores based on qualification readiness
 */

class LeadScoring {
  /**
   * Calculate lead score (0-100) based on available data
   * Higher score = more qualified, ready to convert
   */
  static calculateScore(lead) {
    let score = 0;

    // Base info (20 points)
    if (lead.company_name) score += 5;
    if (lead.contact_id) score += 5;
    if (lead.account_id) score += 5;
    if (lead.estimated_value && lead.estimated_value > 0) score += 5;

    // Contact attempts (15 points)
    if (lead.last_contacted_at) {
      const daysSinceContact = Math.floor((new Date() - new Date(lead.last_contacted_at)) / (1000 * 60 * 60 * 24));
      if (daysSinceContact < 7) score += 10; // Contacted recently
      else if (daysSinceContact < 30) score += 5; // Contacted this month
    }

    // Activities logged (15 points)
    if (lead._activity_count) {
      if (lead._activity_count >= 3) score += 15;
      else if (lead._activity_count >= 1) score += 10;
    }

    // Pre-qualification (20 points)
    if (lead.prequal_budget_range) score += 5;
    if (lead.prequal_timeline) score += 5;
    if (lead.prequal_pain_point) score += 5;
    if (lead.prequal_decision_maker) score += 5;

    // Methodology-specific readiness (30 points)
    if (lead.methodology === 'ignite_apex') {
      // IGNITE: 4U validation readiness
      if (lead.demand_4u_unworkable) score += 8;
      if (lead.demand_4u_urgent) score += 7;
      if (lead.demand_4u_unavoidable) score += 8;
      if (lead.demand_4u_underserved) score += 7;
    } else {
      // Standard: BANT readiness
      if (lead.bant_need) score += 10;
      if (lead.bant_authority) score += 10;
      if (lead.bant_budget) score += 5;
      if (lead.bant_timeline) score += 5;
    }

    return Math.min(score, 100);
  }

  /**
   * Check if lead passes PRE-PIPELINE gate to become opportunity
   */
  static canConvertToOpportunity(lead) {
    const methodology = lead.methodology || 'ignite_apex';

    if (methodology === 'ignite_apex') {
      // IGNITE gate: 4U validated OR lead_score >= 60
      const has4U = !!(
        lead.demand_4u_unworkable &&
        lead.demand_4u_urgent &&
        lead.demand_4u_unavoidable &&
        lead.demand_4u_underserved
      );

      const hasMinScore = this.calculateScore(lead) >= 60;

      return {
        allowed: has4U || hasMinScore,
        reason: has4U
          ? '4U validation complete'
          : hasMinScore
          ? 'Lead score meets minimum threshold (60+)'
          : 'Need 4U validation OR lead score 60+',
        missing: has4U || hasMinScore ? [] : [
          '4U validation (all 4 conditions) OR',
          'Lead score 60+ (current: ' + this.calculateScore(lead) + ')'
        ]
      };
    } else {
      // Standard gate: Need identified OR lead_score >= 50
      const hasNeed = !!lead.bant_need;
      const hasMinScore = this.calculateScore(lead) >= 50;

      return {
        allowed: hasNeed || hasMinScore,
        reason: hasNeed
          ? 'Business need identified'
          : hasMinScore
          ? 'Lead score meets minimum threshold (50+)'
          : 'Need business need OR lead score 50+',
        missing: hasNeed || hasMinScore ? [] : [
          'Business need identified (BANT Need) OR',
          'Lead score 50+ (current: ' + this.calculateScore(lead) + ')'
        ]
      };
    }
  }

  /**
   * Get recommended next action for a lead
   */
  static getRecommendedAction(lead) {
    const score = this.calculateScore(lead);
    const daysSinceContact = lead.last_contacted_at
      ? Math.floor((new Date() - new Date(lead.last_contacted_at)) / (1000 * 60 * 60 * 24))
      : 999;

    if (score >= 70) {
      return { action: 'convert', label: 'Convert to Opportunity', priority: 'high', color: 'green' };
    } else if (score >= 50) {
      return { action: 'qualify', label: 'Complete Qualification', priority: 'high', color: 'amber' };
    } else if (daysSinceContact > 14) {
      return { action: 'contact', label: 'Follow Up (No contact in 14+ days)', priority: 'medium', color: 'blue' };
    } else if (score < 30) {
      return { action: 'nurture', label: 'Move to Nurture', priority: 'low', color: 'purple' };
    } else {
      return { action: 'research', label: 'Research & Qualify', priority: 'medium', color: 'amber' };
    }
  }

  /**
   * Render lead score badge with color
   */
  static renderScoreBadge(score) {
    let color, label;

    if (score >= 70) {
      color = '#10B981'; // green
      label = 'Hot';
    } else if (score >= 50) {
      color = '#F59E0B'; // amber
      label = 'Warm';
    } else if (score >= 30) {
      color = '#3B82F6'; // blue
      label = 'Cold';
    } else {
      color = '#6B7280'; // gray
      label = 'Unqualified';
    }

    return `
      <div style="display:inline-flex;align-items:center;gap:.5rem;background:${color}22;border:2px solid ${color};color:${color};padding:.5rem .75rem;border-radius:8px;font-weight:700;font-size:.85rem">
        <div style="font-size:1.2rem">${score}</div>
        <div>${label}</div>
      </div>
    `;
  }
}

window.LeadScoring = LeadScoring;
console.log('[LeadScoring] Loaded');
