/**
 * IGNITE_APEX CRM — Client Library
 *
 * Extends supabase-client.js with CRM-specific methods for:
 * - Lead management
 * - Activity tracking
 * - Task management
 * - Dashboard data aggregation
 *
 * Load order:
 * 1. Supabase CDN
 * 2. ../supabase-client.js (provides window.IAdb)
 * 3. ../auth.js
 * 4. This file (crm-client.js)
 * 5. Page-specific scripts
 */

(function () {
  'use strict';

  // Ensure dependencies are loaded
  if (typeof window.IAdb === 'undefined') {
    console.error('[CRM] IAdb not found. Load supabase-client.js before crm-client.js');
    return;
  }

  const db = window.IAdb; // Reference to base Supabase client

  // ══════════════════════════════════════════════════════════════
  // LEAD MANAGEMENT
  // ══════════════════════════════════════════════════════════════

  const CRM = {

    // ── LEADS ─────────────────────────────────────────────────────────────────

    /**
     * Save or update a lead
     * @param {Object} lead - Lead object with fields: name, company, email, etc.
     * @returns {Promise<Object>} Saved lead with ID
     */
    async saveLead(lead) {
      if (!db.isOnline || !db.currentUser) {
        console.warn('[CRM] Cannot save lead - not authenticated');
        return null;
      }

      const leadData = {
        org_id: db.orgId,
        owner_id: db.currentUser.id,
        name: lead.name || '',
        company: lead.company || null,
        title: lead.title || null,
        email: lead.email || null,
        phone: lead.phone || null,
        source: lead.source || null,
        // Custom fields
        industry: lead.industry || null,
        lead_score: lead.lead_score || null,
        budget_range: lead.budget_range || null,
        referral_source: lead.referral_source || null,
        // IGNITE progression
        ignite_stage: lead.ignite_stage || 'I1',
        stage_progress: lead.stage_progress || {},
        t1_score: lead.t1_score || 0,
        t1_passed: lead.t1_passed || false,
        t1_details: lead.t1_details || null,
        status: lead.status || 'open',
        disqualified_reason: lead.disqualified_reason || null,
        last_activity_date: lead.last_activity_date || null,
        next_task_date: lead.next_task_date || null,
      };

      try {
        const { data, error } = await db.supabase
          .from('leads')
          .upsert(leadData, { onConflict: 'id' })
          .select()
          .single();

        if (error) throw error;
        return data;
      } catch (err) {
        console.error('[CRM] saveLead error:', err);
        return null;
      }
    },

    /**
     * Get a single lead by ID
     * @param {string} leadId - UUID
     * @returns {Promise<Object|null>}
     */
    async getLead(leadId) {
      if (!db.isOnline) return null;

      try {
        const { data, error } = await db.supabase
          .from('leads')
          .select('*')
          .eq('id', leadId)
          .single();

        if (error) throw error;
        return data;
      } catch (err) {
        console.error('[CRM] getLead error:', err);
        return null;
      }
    },

    /**
     * Get list of leads with optional filters
     * @param {Object} filters - { status, ignite_stage, owner_id }
     * @returns {Promise<Array>}
     */
    async getLeadsList(filters = {}) {
      if (!db.isOnline || !db.currentUser) return [];

      try {
        let query = db.supabase
          .from('leads')
          .select('*')
          .eq('org_id', db.orgId)
          .order('updated_at', { ascending: false });

        // Apply filters
        if (filters.status) query = query.eq('status', filters.status);
        if (filters.ignite_stage) query = query.eq('ignite_stage', filters.ignite_stage);
        if (filters.owner_id) query = query.eq('owner_id', filters.owner_id);

        // Role-based filtering (reps see own, managers see all)
        if (db.currentUser.role === 'rep') {
          query = query.eq('owner_id', db.currentUser.id);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data || [];
      } catch (err) {
        console.error('[CRM] getLeadsList error:', err);
        return [];
      }
    },

    /**
     * Convert lead to opportunity
     * @param {string} leadId - Lead UUID
     * @returns {Promise<Object>} Created opportunity
     */
    async convertLeadToOpportunity(leadId) {
      if (!db.isOnline || !db.currentUser) return null;

      try {
        // 1. Get lead details
        const lead = await this.getLead(leadId);
        if (!lead || lead.status !== 'mql') {
          console.warn('[CRM] Lead must be MQL status to convert');
          return null;
        }

        // 2. Create opportunity (deal)
        const dealData = {
          org_id: db.orgId,
          user_id: db.currentUser.id,
          prospect: `${lead.name} - ${lead.company || 'Unknown Company'}`,
          converted_from_lead_id: leadId,
          ignite_stage: 'I1', // Start fresh in APEX flow
          t1_yes: lead.t1_score,
          verdict: null,
          probability: 20, // Start at PIPELINE ONLY
          forecast_category: 'PIPELINE ONLY',
        };

        const { data: deal, error: dealError } = await db.supabase
          .from('deals')
          .insert(dealData)
          .select()
          .single();

        if (dealError) throw dealError;

        // 3. Update lead status
        const { error: leadError } = await db.supabase
          .from('leads')
          .update({
            status: 'converted',
            converted_to_opportunity_id: deal.id,
            converted_at: new Date().toISOString(),
          })
          .eq('id', leadId);

        if (leadError) throw leadError;

        // 4. Log conversion activity (will be handled by activity-logger.js)

        return deal;
      } catch (err) {
        console.error('[CRM] convertLeadToOpportunity error:', err);
        return null;
      }
    },

    // ── ACTIVITIES ────────────────────────────────────────────────────────────

    /**
     * Log an activity (call, email, meeting, etc.)
     * @param {Object} activity - { activity_type, lead_id, deal_id, subject, description, outcome, duration_mins, participants, activity_date, auto_logged }
     * @returns {Promise<Object>} Created activity
     */
    async logActivity(activity) {
      if (!db.isOnline || !db.currentUser) return null;

      const activityData = {
        org_id: db.orgId,
        owner_id: db.currentUser.id,
        activity_type: activity.activity_type || 'note',
        lead_id: activity.lead_id || null,
        deal_id: activity.deal_id || null,
        subject: activity.subject || '',
        description: activity.description || null,
        outcome: activity.outcome || null,
        duration_mins: activity.duration_mins || null,
        participants: activity.participants || null,
        activity_date: activity.activity_date || new Date().toISOString(),
        auto_logged: activity.auto_logged || false,
      };

      try {
        const { data, error } = await db.supabase
          .from('activities')
          .insert(activityData)
          .select()
          .single();

        if (error) throw error;

        // Update last_activity_date on linked lead or deal
        if (activity.lead_id) {
          await db.supabase
            .from('leads')
            .update({ last_activity_date: activityData.activity_date })
            .eq('id', activity.lead_id);
        }

        if (activity.deal_id) {
          await db.supabase
            .from('deals')
            .update({ last_activity_date: activityData.activity_date })
            .eq('id', activity.deal_id);
        }

        return data;
      } catch (err) {
        console.error('[CRM] logActivity error:', err);
        return null;
      }
    },

    /**
     * Get activities for a lead
     * @param {string} leadId - Lead UUID
     * @returns {Promise<Array>}
     */
    async getActivitiesForLead(leadId) {
      if (!db.isOnline) return [];

      try {
        const { data, error } = await db.supabase
          .from('activities')
          .select('*')
          .eq('lead_id', leadId)
          .order('activity_date', { ascending: false });

        if (error) throw error;
        return data || [];
      } catch (err) {
        console.error('[CRM] getActivitiesForLead error:', err);
        return [];
      }
    },

    /**
     * Get activities for a deal
     * @param {string} dealId - Deal UUID
     * @returns {Promise<Array>}
     */
    async getActivitiesForDeal(dealId) {
      if (!db.isOnline) return [];

      try {
        const { data, error } = await db.supabase
          .from('activities')
          .select('*')
          .eq('deal_id', dealId)
          .order('activity_date', { ascending: false });

        if (error) throw error;
        return data || [];
      } catch (err) {
        console.error('[CRM] getActivitiesForDeal error:', err);
        return [];
      }
    },

    // ── TASKS ─────────────────────────────────────────────────────────────────

    /**
     * Create a task
     * @param {Object} task - { subject, description, priority, lead_id, deal_id, activity_id, due_date, reminder_date, assigned_to_id }
     * @returns {Promise<Object>} Created task
     */
    async createTask(task) {
      if (!db.isOnline || !db.currentUser) return null;

      const taskData = {
        org_id: db.orgId,
        owner_id: db.currentUser.id,
        assigned_to_id: task.assigned_to_id || db.currentUser.id,
        subject: task.subject || '',
        description: task.description || null,
        priority: task.priority || 'normal',
        lead_id: task.lead_id || null,
        deal_id: task.deal_id || null,
        activity_id: task.activity_id || null,
        status: 'pending',
        due_date: task.due_date || null,
        reminder_date: task.reminder_date || null,
        reminder_sent: false,
      };

      try {
        const { data, error } = await db.supabase
          .from('tasks')
          .insert(taskData)
          .select()
          .single();

        if (error) throw error;

        // Update next_task_date on linked lead or deal
        if (task.lead_id && task.due_date) {
          await db.supabase
            .from('leads')
            .update({ next_task_date: task.due_date })
            .eq('id', task.lead_id);
        }

        if (task.deal_id && task.due_date) {
          await db.supabase
            .from('deals')
            .update({ next_task_date: task.due_date })
            .eq('id', task.deal_id);
        }

        return data;
      } catch (err) {
        console.error('[CRM] createTask error:', err);
        return null;
      }
    },

    /**
     * Update a task
     * @param {string} taskId - Task UUID
     * @param {Object} updates - Fields to update
     * @returns {Promise<Object>} Updated task
     */
    async updateTask(taskId, updates) {
      if (!db.isOnline) return null;

      try {
        const { data, error } = await db.supabase
          .from('tasks')
          .update(updates)
          .eq('id', taskId)
          .select()
          .single();

        if (error) throw error;
        return data;
      } catch (err) {
        console.error('[CRM] updateTask error:', err);
        return null;
      }
    },

    /**
     * Get tasks for current user
     * @param {Object} filters - { status, lead_id, deal_id }
     * @returns {Promise<Array>}
     */
    async getMyTasks(filters = {}) {
      if (!db.isOnline || !db.currentUser) return [];

      try {
        let query = db.supabase
          .from('tasks')
          .select('*, leads(name, company), deals(prospect)')
          .eq('org_id', db.orgId)
          .eq('assigned_to_id', db.currentUser.id)
          .order('due_date', { ascending: true });

        if (filters.status) query = query.eq('status', filters.status);
        if (filters.lead_id) query = query.eq('lead_id', filters.lead_id);
        if (filters.deal_id) query = query.eq('deal_id', filters.deal_id);

        const { data, error } = await query;
        if (error) throw error;
        return data || [];
      } catch (err) {
        console.error('[CRM] getMyTasks error:', err);
        return [];
      }
    },

    /**
     * Get team tasks (manager view)
     * @returns {Promise<Array>}
     */
    async getTeamTasks() {
      if (!db.isOnline || !db.currentUser) return [];
      if (db.currentUser.role === 'rep') return this.getMyTasks(); // Reps can't see team

      try {
        const { data, error } = await db.supabase
          .from('tasks')
          .select('*, leads(name, company), deals(prospect), users!tasks_assigned_to_id_fkey(name)')
          .eq('org_id', db.orgId)
          .order('due_date', { ascending: true });

        if (error) throw error;
        return data || [];
      } catch (err) {
        console.error('[CRM] getTeamTasks error:', err);
        return [];
      }
    },

    /**
     * Get overdue tasks
     * @returns {Promise<Array>}
     */
    async getOverdueTasks() {
      if (!db.isOnline || !db.currentUser) return [];

      try {
        const now = new Date().toISOString();
        const { data, error } = await db.supabase
          .from('tasks')
          .select('*')
          .eq('assigned_to_id', db.currentUser.id)
          .eq('status', 'pending')
          .lt('due_date', now)
          .order('due_date', { ascending: true });

        if (error) throw error;
        return data || [];
      } catch (err) {
        console.error('[CRM] getOverdueTasks error:', err);
        return [];
      }
    },

    // ── TIMELINE ──────────────────────────────────────────────────────────────

    /**
     * Add timeline event for a deal
     * @param {string} dealId - Deal UUID
     * @param {string} eventType - created|stage_change|verdict_change|activity_logged|task_created|note_added|field_updated|converted_from_lead
     * @param {Object} eventData - JSONB payload
     * @param {string} description - Human-readable description
     * @returns {Promise<Object>}
     */
    async addTimelineEvent(dealId, eventType, eventData, description) {
      if (!db.isOnline || !db.currentUser) return null;

      try {
        const { data, error } = await db.supabase
          .from('deal_timeline')
          .insert({
            deal_id: dealId,
            user_id: db.currentUser.id,
            event_type: eventType,
            event_data: eventData || {},
            description: description || '',
          })
          .select()
          .single();

        if (error) throw error;
        return data;
      } catch (err) {
        console.error('[CRM] addTimelineEvent error:', err);
        return null;
      }
    },

    /**
     * Get timeline for a deal
     * @param {string} dealId - Deal UUID
     * @returns {Promise<Array>}
     */
    async getDealTimeline(dealId) {
      if (!db.isOnline) return [];

      try {
        const { data, error } = await db.supabase
          .from('deal_timeline')
          .select('*, users(name)')
          .eq('deal_id', dealId)
          .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
      } catch (err) {
        console.error('[CRM] getDealTimeline error:', err);
        return [];
      }
    },

    // ── DASHBOARD DATA ────────────────────────────────────────────────────────

    /**
     * Get pipeline grouped by stage
     * @param {string} userId - User UUID (optional, defaults to current user)
     * @param {boolean} includeTeam - Include team data (manager view)
     * @returns {Promise<Object>} { I1: {count, value}, G: {...}, ... }
     */
    async getPipelineByStage(userId = null, includeTeam = false) {
      if (!db.isOnline || !db.currentUser) return {};

      try {
        let query = db.supabase
          .from('deals')
          .select('ignite_stage, verdict, probability')
          .eq('org_id', db.orgId);

        if (!includeTeam || db.currentUser.role === 'rep') {
          query = query.eq('user_id', userId || db.currentUser.id);
        }

        const { data, error } = await query;
        if (error) throw error;

        // Group by stage
        const pipeline = {};
        (data || []).forEach(deal => {
          const stage = deal.ignite_stage || 'Unknown';
          if (!pipeline[stage]) pipeline[stage] = { count: 0, avgProb: 0 };
          pipeline[stage].count++;
          pipeline[stage].avgProb += deal.probability || 0;
        });

        // Calculate averages
        Object.keys(pipeline).forEach(stage => {
          pipeline[stage].avgProb = Math.round(pipeline[stage].avgProb / pipeline[stage].count);
        });

        return pipeline;
      } catch (err) {
        console.error('[CRM] getPipelineByStage error:', err);
        return {};
      }
    },

    /**
     * Get activity metrics
     * @param {string} userId - User UUID
     * @param {string} dateRange - 'week' | 'month'
     * @param {boolean} includeTeam - Include team data
     * @returns {Promise<Object>} { calls: X, emails: Y, meetings: Z, ... }
     */
    async getActivityMetrics(userId = null, dateRange = 'week', includeTeam = false) {
      if (!db.isOnline || !db.currentUser) return {};

      try {
        const now = new Date();
        const startDate = new Date(now);
        if (dateRange === 'week') startDate.setDate(now.getDate() - 7);
        else startDate.setDate(now.getDate() - 30);

        let query = db.supabase
          .from('activities')
          .select('activity_type')
          .eq('org_id', db.orgId)
          .gte('activity_date', startDate.toISOString());

        if (!includeTeam || db.currentUser.role === 'rep') {
          query = query.eq('owner_id', userId || db.currentUser.id);
        }

        const { data, error } = await query;
        if (error) throw error;

        // Count by type
        const metrics = {};
        (data || []).forEach(activity => {
          const type = activity.activity_type;
          metrics[type] = (metrics[type] || 0) + 1;
        });

        return metrics;
      } catch (err) {
        console.error('[CRM] getActivityMetrics error:', err);
        return {};
      }
    },

    /**
     * Get lead conversion funnel
     * @param {string} userId - User UUID
     * @param {boolean} includeTeam - Include team data
     * @returns {Promise<Object>} { open: X, working: Y, mql: Z, converted: W }
     */
    async getLeadConversionFunnel(userId = null, includeTeam = false) {
      if (!db.isOnline || !db.currentUser) return {};

      try {
        let query = db.supabase
          .from('leads')
          .select('status')
          .eq('org_id', db.orgId);

        if (!includeTeam || db.currentUser.role === 'rep') {
          query = query.eq('owner_id', userId || db.currentUser.id);
        }

        const { data, error } = await query;
        if (error) throw error;

        // Count by status
        const funnel = { open: 0, working: 0, nurture: 0, mql: 0, converted: 0, disqualified: 0 };
        (data || []).forEach(lead => {
          const status = lead.status || 'open';
          funnel[status] = (funnel[status] || 0) + 1;
        });

        return funnel;
      } catch (err) {
        console.error('[CRM] getLeadConversionFunnel error:', err);
        return {};
      }
    },

  };

  // Expose globally
  window.CRM = CRM;

  console.info('[CRM] CRM client loaded successfully');

})();
