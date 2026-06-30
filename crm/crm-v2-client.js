/**
 * IGNITE_APEX CRM v2 - Data Layer
 * Complete client for new schema: Accounts, Contacts, Leads, Opportunities
 */

const CRMv2 = {
  // ============================================================
  // LEADS
  // ============================================================

  async getLeads(filters = {}) {
    // Query unified opportunities table (includes both leads and opportunities)
    let query = window.supabaseClient
      .from('opportunities')
      .select('*')
      .eq('org_id', window.currentOrgId)
      .order('created_at', { ascending: false });

    // Filter by pipeline stage (Lead stage = early opportunity)
    if (filters.status) {
      // Map old lead status to pipeline_stage
      if (filters.status === 'new' || filters.status === 'contacted') {
        query = query.eq('pipeline_stage', 'Lead');
      }
    } else {
      // Default: show only Lead stage opportunities
      query = query.eq('pipeline_stage', 'Lead');
    }

    if (filters.owner_id) query = query.eq('owner_id', filters.owner_id);
    if (filters.search) {
      query = query.or(`name.ilike.%${filters.search}%,company_name.ilike.%${filters.search}%,contact_email.ilike.%${filters.search}%`);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async getLead(leadId) {
    const { data, error } = await window.supabaseClient
      .from('leads')
      .select('*')
      .eq('id', leadId)
      .single();

    if (error) throw error;
    return data;
  },

  async createLead(lead) {
    const user = window.currentUser;
    const leadData = {
      org_id: window.currentOrgId,
      lead_owner_id: user.id,
      lead_owner_name: user.name || user.email,
      status: 'new',
      ...lead
    };

    const { data, error } = await window.supabaseClient
      .from('leads')
      .insert([leadData])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateLead(leadId, updates) {
    const { data, error } = await window.supabaseClient
      .from('leads')
      .update(updates)
      .eq('id', leadId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateLeadIgnite(leadId, igniteData) {
    // igniteData = { ignite_i1: 'yes', ignite_g: 'no', ... }
    // Score is auto-calculated by database
    const updates = {
      ...igniteData,
      last_activity_at: new Date().toISOString()
    };

    // Check if MQL (score >= 4)
    const scoreCount = Object.values(igniteData).filter(v => v === 'yes').length;
    if (scoreCount >= 4) {
      updates.status = 'mql';
    } else if (scoreCount > 0) {
      updates.status = 'in_diagnostic';
    }

    return await this.updateLead(leadId, updates);
  },

  async convertLead(leadId, conversionData) {
    // conversionData = { account_name, contact_first_name, opportunity_name, value }
    const lead = await this.getLead(leadId);
    const user = window.currentUser;

    // 1. Create Account
    const account = await this.createAccount({
      name: conversionData.account_name || lead.company,
      industry: lead.industry,
      website: lead.website,
      country: lead.country,
      source: lead.source
    });

    // 2. Create Contact
    const contact = await this.createContact({
      account_id: account.id,
      first_name: conversionData.contact_first_name || lead.first_name,
      last_name: conversionData.contact_last_name || lead.last_name,
      email: lead.email,
      phone: lead.phone,
      whatsapp: lead.whatsapp,
      title: lead.title,
      converted_from_lead_id: leadId
    });

    // 3. Create Opportunity
    const opportunity = await this.createOpportunity({
      name: conversionData.opportunity_name || `${account.name} - ${new Date().getFullYear()}`,
      account_id: account.id,
      account_name: account.name,
      contact_id: contact.id,
      contact_name: `${contact.first_name} ${contact.last_name || ''}`.trim(),
      converted_from_lead_id: leadId,
      value: conversionData.value || 0,
      stage: 1,
      status: 'active'
    });

    // 4. Update Lead
    await this.updateLead(leadId, {
      status: 'converted',
      converted_at: new Date().toISOString(),
      converted_contact_id: contact.id,
      converted_account_id: account.id,
      converted_opportunity_id: opportunity.id
    });

    // 5. Log activity
    await this.logActivity({
      lead_id: leadId,
      opportunity_id: opportunity.id,
      account_id: account.id,
      contact_id: contact.id,
      type: 'lead_converted',
      subject: 'Lead converted to Opportunity',
      notes: `Created Account: ${account.name}, Contact: ${contact.first_name} ${contact.last_name}, Opportunity: ${opportunity.name}`,
      is_auto_logged: true
    });

    return { account, contact, opportunity };
  },

  // ============================================================
  // ACCOUNTS
  // ============================================================

  async getAccounts(filters = {}) {
    let query = window.supabaseClient
      .from('accounts')
      .select('*')
      .eq('org_id', window.currentOrgId)
      .order('created_at', { ascending: false });

    if (filters.search) {
      query = query.or(`name.ilike.%${filters.search}%,industry.ilike.%${filters.search}%`);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async getAccount(accountId) {
    const { data, error } = await window.supabaseClient
      .from('accounts')
      .select('*')
      .eq('id', accountId)
      .single();

    if (error) throw error;
    return data;
  },

  async createAccount(account) {
    const user = window.currentUser;
    const accountData = {
      org_id: window.currentOrgId,
      account_owner_id: user.id,
      account_owner_name: user.name || user.email,
      ...account
    };

    const { data, error } = await window.supabaseClient
      .from('accounts')
      .insert([accountData])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateAccount(accountId, updates) {
    const { data, error } = await window.supabaseClient
      .from('accounts')
      .update(updates)
      .eq('id', accountId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // ============================================================
  // CONTACTS
  // ============================================================

  async getContacts(filters = {}) {
    let query = window.supabaseClient
      .from('contacts')
      .select('*, accounts(name)')
      .eq('org_id', window.currentOrgId)
      .order('created_at', { ascending: false });

    if (filters.account_id) query = query.eq('account_id', filters.account_id);
    if (filters.search) {
      query = query.or(`first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async getContact(contactId) {
    const { data, error } = await window.supabaseClient
      .from('contacts')
      .select('*, accounts(name, industry, website)')
      .eq('id', contactId)
      .single();

    if (error) throw error;
    return data;
  },

  async createContact(contact) {
    const user = window.currentUser;
    const contactData = {
      org_id: window.currentOrgId,
      contact_owner_id: user.id,
      contact_owner_name: user.name || user.email,
      ...contact
    };

    const { data, error } = await window.supabaseClient
      .from('contacts')
      .insert([contactData])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateContact(contactId, updates) {
    const { data, error } = await window.supabaseClient
      .from('contacts')
      .update(updates)
      .eq('id', contactId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // ============================================================
  // OPPORTUNITIES
  // ============================================================

  async getOpportunities(filters = {}) {
    let query = window.supabaseClient
      .from('opportunities')
      .select('*')
      .eq('org_id', window.currentOrgId)
      .order('created_at', { ascending: false });

    // Filter by pipeline_status (Open/Won/Lost)
    if (filters.status) {
      if (filters.status === 'active') {
        query = query.eq('pipeline_status', 'Open');
      } else {
        query = query.eq('pipeline_status', filters.status);
      }
    }

    // Filter by pipeline_stage (Lead/Qualified/Proposal/Negotiation/Closed Won/Closed Lost)
    if (filters.stage) query = query.eq('pipeline_stage', filters.stage);

    if (filters.owner_id) query = query.eq('owner_id', filters.owner_id);

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async getOpportunity(oppId) {
    const { data, error } = await window.supabaseClient
      .from('opportunities')
      .select('*, accounts(name, industry, website), contacts(first_name, last_name, email, phone)')
      .eq('id', oppId)
      .single();

    if (error) throw error;
    return data;
  },

  async createOpportunity(opp) {
    const user = window.currentUser;
    const oppData = {
      org_id: window.currentOrgId,
      owner_id: user.id,
      owner_name: user.name || user.email,
      stage: 1,
      status: 'active',
      ...opp
    };

    const { data, error } = await window.supabaseClient
      .from('opportunities')
      .insert([oppData])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateOpportunity(oppId, updates) {
    const { data, error } = await window.supabaseClient
      .from('opportunities')
      .update(updates)
      .eq('id', oppId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async moveOpportunityStage(oppId, newStage, bypassReason = null) {
    const opp = await this.getOpportunity(oppId);
    const oldStage = opp.stage;

    const updates = {
      stage: newStage,
      last_activity_at: new Date().toISOString()
    };

    // Set key dates
    if (newStage === 1 && !opp.qualified_date) updates.qualified_date = new Date().toISOString();
    if (newStage === 2 && !opp.sql_date) updates.sql_date = new Date().toISOString();
    if (newStage === 6 && !opp.won_date) {
      updates.won_date = new Date().toISOString();
      updates.status = 'closed_won';
    }

    // Log bypass if skipped stages
    if (bypassReason && Math.abs(newStage - oldStage) > 1) {
      const bypassLog = opp.bypass_log || [];
      bypassLog.push({
        from_stage: oldStage,
        to_stage: newStage,
        reason: bypassReason,
        bypassed_at: new Date().toISOString(),
        bypassed_by: window.currentUser.name
      });
      updates.bypass_log = bypassLog;

      // Log bypass activity
      await this.logActivity({
        opportunity_id: oppId,
        type: 'bypass',
        subject: `Stage bypass: ${oldStage} → ${newStage}`,
        notes: `Reason: ${bypassReason}`,
        from_stage: oldStage,
        to_stage: newStage,
        bypass_reason: bypassReason,
        is_auto_logged: true
      });
    } else {
      // Log normal stage change
      await this.logActivity({
        opportunity_id: oppId,
        type: 'stage_change',
        subject: `Stage changed: ${oldStage} → ${newStage}`,
        from_stage: oldStage,
        to_stage: newStage,
        is_auto_logged: true
      });
    }

    return await this.updateOpportunity(oppId, updates);
  },

  async updateMilestones(oppId, milestones) {
    // milestones = { stage_1: [true, false, true], stage_2: [...] }
    return await this.updateOpportunity(oppId, {
      milestone_checks: milestones
    });
  },

  // ============================================================
  // ACTIVITIES
  // ============================================================

  async getActivities(filters = {}) {
    let query = window.supabaseClient
      .from('activities')
      .select('*')
      .eq('org_id', window.currentOrgId)
      .order('activity_date', { ascending: false })
      .order('created_at', { ascending: false });

    if (filters.lead_id) query = query.eq('lead_id', filters.lead_id);
    if (filters.opportunity_id) query = query.eq('opportunity_id', filters.opportunity_id);
    if (filters.account_id) query = query.eq('account_id', filters.account_id);
    if (filters.contact_id) query = query.eq('contact_id', filters.contact_id);

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async logActivity(activity) {
    const user = window.currentUser;
    const activityData = {
      org_id: window.currentOrgId,
      owner_id: user.id,
      owner_name: user.name || user.email,
      activity_date: activity.activity_date || new Date().toISOString().split('T')[0],
      ...activity
    };

    const { data, error } = await window.supabaseClient
      .from('activities')
      .insert([activityData])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // ============================================================
  // TASKS
  // ============================================================

  async getTasks(filters = {}) {
    let query = window.supabaseClient
      .from('tasks')
      .select('*')
      .eq('org_id', window.currentOrgId)
      .order('due_date', { ascending: true, nullsFirst: false });

    if (filters.status) query = query.eq('status', filters.status);
    if (filters.assignee_id) query = query.eq('assignee_id', filters.assignee_id);
    if (filters.lead_id) query = query.eq('lead_id', filters.lead_id);
    if (filters.opportunity_id) query = query.eq('opportunity_id', filters.opportunity_id);

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async createTask(task) {
    const user = window.currentUser;
    const taskData = {
      org_id: window.currentOrgId,
      assignee_id: task.assignee_id || user.id,
      assignee_name: task.assignee_name || user.name || user.email,
      status: 'todo',
      ...task
    };

    const { data, error } = await window.supabaseClient
      .from('tasks')
      .insert([taskData])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateTask(taskId, updates) {
    const { data, error } = await window.supabaseClient
      .from('tasks')
      .update(updates)
      .eq('id', taskId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async completeTask(taskId) {
    const updates = {
      status: 'done',
      done_date: new Date().toISOString().split('T')[0]
    };

    const task = await this.updateTask(taskId, updates);

    // Log activity
    if (task.opportunity_id || task.lead_id) {
      await this.logActivity({
        lead_id: task.lead_id,
        opportunity_id: task.opportunity_id,
        type: 'task_done',
        subject: `Task completed: ${task.title}`,
        is_auto_logged: true
      });
    }

    return task;
  },

  // ============================================================
  // DASHBOARD / REPORTS
  // ============================================================

  async getPipelineValue() {
    const { data, error } = await window.supabaseClient
      .from('opportunities')
      .select('stage, value, weighted_value')
      .eq('org_id', window.currentOrgId)
      .eq('status', 'active');

    if (error) throw error;

    const byStage = {
      1: { count: 0, value: 0, weighted: 0 },
      2: { count: 0, value: 0, weighted: 0 },
      3: { count: 0, value: 0, weighted: 0 },
      4: { count: 0, value: 0, weighted: 0 },
      5: { count: 0, value: 0, weighted: 0 },
      6: { count: 0, value: 0, weighted: 0 }
    };

    (data || []).forEach(opp => {
      byStage[opp.stage].count++;
      byStage[opp.stage].value += parseFloat(opp.value || 0);
      byStage[opp.stage].weighted += parseFloat(opp.weighted_value || 0);
    });

    return byStage;
  },

  async getLeadFunnel() {
    const { data, error } = await window.supabaseClient
      .from('leads')
      .select('status')
      .eq('org_id', window.currentOrgId);

    if (error) throw error;

    const funnel = {
      new: 0,
      contacted: 0,
      in_diagnostic: 0,
      mql: 0,
      disqualified: 0,
      converted: 0
    };

    (data || []).forEach(lead => {
      funnel[lead.status]++;
    });

    return funnel;
  }
};

// Expose globally
window.CRMv2 = CRMv2;
