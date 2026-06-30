/**
 * IGNITE_APEX CRM — Activity Auto-Logger
 *
 * Automatically logs system events as activities:
 * - Lead stage changes
 * - Lead conversions to opportunities
 * - Qualification pass/fail (T1, T2, T3)
 * - Task completions
 * - Deal verdict changes
 *
 * Call these methods when the corresponding events occur in your app.
 * Requires: CRM client (window.CRM)
 */

(function () {
  'use strict';

  if (typeof window.CRM === 'undefined') {
    console.error('[ActivityLogger] CRM client not found. Load crm-client.js first.');
    return;
  }

  const ActivityLogger = {

    /**
     * Log when a lead progresses to a new IGNITE stage
     * @param {string} leadId - Lead UUID
     * @param {string} oldStage - Previous stage (I1, G, N, I2, T, E)
     * @param {string} newStage - New stage
     * @param {string} userId - User who made the change
     */
    async logStageChange(leadId, oldStage, newStage, userId) {
      const stageNames = {
        I1: 'Identify',
        G: 'Go Deep',
        N: 'Nail the Insight',
        I2: 'Initiate',
        T: 'Track & Nurture',
        E: 'Escalate',
      };

      const oldName = stageNames[oldStage] || oldStage;
      const newName = stageNames[newStage] || newStage;

      await window.CRM.logActivity({
        lead_id: leadId,
        activity_type: 'system_event',
        subject: `Stage changed: ${oldName} → ${newName}`,
        description: `Lead progressed from ${oldName} to ${newName} stage in IGNITE methodology.`,
        owner_id: userId,
        auto_logged: true,
      });

      console.info(`[ActivityLogger] Logged stage change: ${oldStage} → ${newStage} for lead ${leadId}`);
    },

    /**
     * Log when a lead is converted to an opportunity
     * @param {string} leadId - Lead UUID
     * @param {string} dealId - Created opportunity UUID
     * @param {string} userId - User who converted
     */
    async logLeadConversion(leadId, dealId, userId) {
      await window.CRM.logActivity({
        lead_id: leadId,
        deal_id: dealId,
        activity_type: 'system_event',
        subject: 'Lead converted to Opportunity',
        description: 'Lead qualified as MQL (passed T1 Demand Gate) and converted to sales opportunity.',
        owner_id: userId,
        auto_logged: true,
      });

      // Also log in deal timeline
      await window.CRM.addTimelineEvent(
        dealId,
        'converted_from_lead',
        { lead_id: leadId },
        'Opportunity created from qualified lead'
      );

      console.info(`[ActivityLogger] Logged lead conversion: ${leadId} → ${dealId}`);
    },

    /**
     * Log qualification gate result (T1, T2, T3)
     * @param {string} recordId - Lead or Deal UUID
     * @param {string} tier - 'T1' | 'T2' | 'T3'
     * @param {boolean} passed - True if passed the gate
     * @param {string} score - e.g., '4/5', '7/10', '5/5'
     * @param {string} userId - User who submitted
     */
    async logQualificationResult(recordId, tier, passed, score, userId) {
      const result = passed ? 'Passed' : 'Failed';
      const gateName = {
        T1: 'T1 Demand Gate',
        T2: 'T2 Opportunity Qualifier',
        T3: 'T3 Forecast Commit Gate',
      }[tier] || `${tier} Gate`;

      const activityData = {
        activity_type: 'system_event',
        subject: `${result} ${gateName} (${score})`,
        description: `${tier} qualification result: ${result} with score ${score}. ${
          passed
            ? tier === 'T1'
              ? 'Lead qualified as MQL.'
              : tier === 'T2'
              ? 'Opportunity qualified as SQL.'
              : 'Opportunity committed to forecast.'
            : 'Did not meet qualification threshold.'
        }`,
        owner_id: userId,
        auto_logged: true,
      };

      // Attach to lead (T1) or deal (T2, T3)
      if (tier === 'T1') {
        activityData.lead_id = recordId;
      } else {
        activityData.deal_id = recordId;

        // Also log in timeline
        await window.CRM.addTimelineEvent(
          recordId,
          'field_updated',
          { field: tier, result, score },
          `${result} ${gateName} (${score})`
        );
      }

      await window.CRM.logActivity(activityData);

      console.info(`[ActivityLogger] Logged ${tier} result: ${result} (${score}) for ${recordId}`);
    },

    /**
     * Log when a task is completed
     * @param {Object} task - Task object with lead_id, deal_id, subject
     * @param {string} userId - User who completed it
     */
    async logTaskCompletion(task, userId) {
      const activityData = {
        activity_type: 'system_event',
        subject: `Task completed: ${task.subject}`,
        description: `Completed task: "${task.subject}"`,
        owner_id: userId,
        auto_logged: true,
      };

      if (task.lead_id) activityData.lead_id = task.lead_id;
      if (task.deal_id) {
        activityData.deal_id = task.deal_id;

        // Log in timeline
        await window.CRM.addTimelineEvent(
          task.deal_id,
          'task_created',
          { task_id: task.id, subject: task.subject, status: 'completed' },
          `Task completed: ${task.subject}`
        );
      }

      await window.CRM.logActivity(activityData);

      console.info(`[ActivityLogger] Logged task completion: ${task.subject}`);
    },

    /**
     * Log when deal verdict changes
     * @param {string} dealId - Deal UUID
     * @param {string} oldVerdict - Previous verdict
     * @param {string} newVerdict - New verdict
     * @param {number} oldProb - Previous probability
     * @param {number} newProb - New probability
     * @param {string} userId - User who made the change
     */
    async logVerdictChange(dealId, oldVerdict, newVerdict, oldProb, newProb, userId) {
      await window.CRM.logActivity({
        deal_id: dealId,
        activity_type: 'system_event',
        subject: `Verdict updated: ${oldVerdict} → ${newVerdict}`,
        description: `Deal verdict changed from ${oldVerdict} (${oldProb}%) to ${newVerdict} (${newProb}%).`,
        owner_id: userId,
        auto_logged: true,
      });

      // Log in timeline
      await window.CRM.addTimelineEvent(
        dealId,
        'verdict_change',
        { old: oldVerdict, new: newVerdict, old_prob: oldProb, new_prob: newProb },
        `Verdict: ${oldVerdict} → ${newVerdict}`
      );

      console.info(`[ActivityLogger] Logged verdict change: ${oldVerdict} → ${newVerdict} for deal ${dealId}`);
    },

    /**
     * Log when deal stage changes (APEX flow)
     * @param {string} dealId - Deal UUID
     * @param {string} oldStage - Previous stage
     * @param {string} newStage - New stage
     * @param {string} userId - User who made the change
     */
    async logDealStageChange(dealId, oldStage, newStage, userId) {
      await window.CRM.logActivity({
        deal_id: dealId,
        activity_type: 'system_event',
        subject: `Opportunity stage: ${oldStage} → ${newStage}`,
        description: `Deal progressed from ${oldStage} to ${newStage} stage.`,
        owner_id: userId,
        auto_logged: true,
      });

      // Log in timeline
      await window.CRM.addTimelineEvent(
        dealId,
        'stage_change',
        { old: oldStage, new: newStage },
        `Stage: ${oldStage} → ${newStage}`
      );

      console.info(`[ActivityLogger] Logged deal stage change: ${oldStage} → ${newStage}`);
    },

    /**
     * Log when deal is created
     * @param {string} dealId - Deal UUID
     * @param {string} prospect - Prospect name
     * @param {string} userId - User who created
     */
    async logDealCreated(dealId, prospect, userId) {
      await window.CRM.addTimelineEvent(
        dealId,
        'created',
        { prospect },
        `Opportunity created: ${prospect}`
      );

      console.info(`[ActivityLogger] Logged deal creation: ${dealId}`);
    },

  };

  // Expose globally
  window.ActivityLogger = ActivityLogger;

  console.info('[ActivityLogger] Activity auto-logger loaded successfully');

})();
