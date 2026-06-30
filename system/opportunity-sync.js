// opportunity-sync.js
// Syncs Sales OS localStorage data with unified opportunities table

let _supabase = null;
let _currentUser = null;
let _currentOpportunityId = null;
let _syncTimer = null;

/**
 * Initialize the sync system
 * @param {object} supabaseClient - Supabase client instance
 * @param {object} user - Current user profile
 */
async function initOpportunitySync(supabaseClient, user) {
  _supabase = supabaseClient;
  _currentUser = user;

  console.log('[OpportunitySync] Initialized for user:', user.email);

  // Load current opportunity from URL or create new
  const urlParams = new URLSearchParams(window.location.search);
  const oppId = urlParams.get('opp_id');

  if (oppId) {
    await loadOpportunity(oppId);
  } else {
    // Check if there's a draft in localStorage that needs syncing
    await syncLocalDraftToDatabase();
  }
}

/**
 * Load an opportunity from database into localStorage
 */
async function loadOpportunity(opportunityId) {
  if (!_supabase) {
    console.error('[OpportunitySync] Not initialized');
    return;
  }

  try {
    const { data: opp, error } = await _supabase
      .from('opportunities')
      .select('*')
      .eq('id', opportunityId)
      .single();

    if (error) throw error;

    if (opp) {
      _currentOpportunityId = opp.id;

      // Map database fields to localStorage/Sales OS format
      populateFormFromDatabase(opp);

      console.log('[OpportunitySync] Loaded opportunity:', opp.company_name);
    }
  } catch (err) {
    console.error('[OpportunitySync] Failed to load opportunity:', err);
  }
}

/**
 * Populate Sales OS form fields from database opportunity
 */
function populateFormFromDatabase(opp) {
  // Prospect name
  const prospectInput = document.getElementById('prospect-name');
  if (prospectInput && opp.company_name) {
    prospectInput.value = opp.company_name;
  }

  // Restore drafts object (used by Sales OS)
  if (typeof window.drafts !== 'undefined') {
    // 4U Demand Conditions
    if (opp.demand_4u_unworkable) window.drafts['4u-uw-evidence'] = opp.demand_4u_unworkable;
    if (opp.demand_4u_unavoidable) window.drafts['4u-uv-evidence'] = opp.demand_4u_unavoidable;
    if (opp.demand_4u_urgent) window.drafts['4u-urg-evidence'] = opp.demand_4u_urgent;
    if (opp.demand_4u_underserved) window.drafts['4u-us-evidence'] = opp.demand_4u_underserved;

    // IGNITE Stage Data
    if (opp.ignite_trigger_event) window.drafts['ignite-trigger'] = opp.ignite_trigger_event;
    if (opp.ignite_strategic_priorities) window.drafts['ignite-strategic'] = opp.ignite_strategic_priorities;
    if (opp.ignite_individual_research) window.drafts['ignite-individual'] = opp.ignite_individual_research;
    if (opp.ignite_competitive_pressure) window.drafts['ignite-competitive'] = opp.ignite_competitive_pressure;
    if (opp.ignite_reference_outcome) window.drafts['ignite-reference'] = opp.ignite_reference_outcome;
    if (opp.ignite_reframe_opener) window.drafts['ignite-opener'] = opp.ignite_reframe_opener;
  }

  // Restore IGNITE stage completion checkboxes
  if (typeof window.igniteStageAnswers !== 'undefined') {
    if (opp.ignite_stage_i_complete) window.igniteStageAnswers['trigger'] = 'yes';
    if (opp.ignite_stage_g_complete) window.igniteStageAnswers['research'] = 'yes';
    if (opp.ignite_stage_n_complete) window.igniteStageAnswers['opener'] = 'yes';
    if (opp.ignite_stage_i2_complete) window.igniteStageAnswers['sequence'] = 'yes';
    if (opp.ignite_stage_t_complete) window.igniteStageAnswers['nurture'] = 'yes';
    if (opp.ignite_stage_e_complete) window.igniteStageAnswers['complete'] = 'yes';
  }

  // Trigger UI updates if needed
  if (typeof window.updateProspect === 'function') {
    window.updateProspect();
  }
}

/**
 * Save current Sales OS state to database
 * Debounced to avoid excessive writes
 */
function saveOpportunityToDatabase() {
  clearTimeout(_syncTimer);
  _syncTimer = setTimeout(async () => {
    await _performSync();
  }, 2000); // 2 second debounce
}

/**
 * Perform the actual database sync
 */
async function _performSync() {
  if (!_supabase || !_currentUser) {
    console.error('[OpportunitySync] Not initialized');
    return;
  }

  try {
    // Get current prospect name
    const prospectInput = document.getElementById('prospect-name');
    const companyName = prospectInput ? prospectInput.value : '';

    if (!companyName || !companyName.trim()) {
      console.log('[OpportunitySync] No company name, skipping sync');
      return;
    }

    // Gather IGNITE data from Sales OS localStorage/state
    const drafts = window.drafts || {};
    const igniteStageAnswers = window.igniteStageAnswers || {};
    const dgAnswers = window.dgAnswers || {};
    const bqAnswers = window.bqAnswers || {};
    const fcAnswers = window.fcAnswers || {};

    // Calculate PROBE scores
    const dgYes = Object.values(dgAnswers).filter(v => v === 'yes').length;
    const bqYes = Object.values(bqAnswers).filter(v => v === 'yes').length;
    const fcYes = Object.values(fcAnswers).filter(v => v === 'yes').length;

    // Determine PROBE tier
    let probeTier = null;
    let probeT1Passed = dgYes >= 4;
    let probeT2Passed = bqYes >= 7;
    let probeT3Passed = fcYes === 5;

    if (probeT3Passed) probeTier = 'T3';
    else if (probeT2Passed) probeTier = 'T2';
    else if (probeT1Passed) probeTier = 'T1';

    // Determine current IGNITE stage
    const stageMap = {
      'trigger': 'I',
      'research': 'G',
      'opener': 'N',
      'sequence': 'I2',
      'nurture': 'T',
      'complete': 'E'
    };

    let currentStage = 'I'; // Default to first stage
    const stageOrder = ['trigger', 'research', 'opener', 'sequence', 'nurture', 'complete'];
    for (let i = stageOrder.length - 1; i >= 0; i--) {
      if (igniteStageAnswers[stageOrder[i]] === 'yes') {
        currentStage = stageMap[stageOrder[i]];
        break;
      }
    }

    // ═══ SHARED DATA LAYER: Upsert Account + Contact ═══

    // 1. Upsert Account (company)
    let accountId = null;
    const accountName = companyName.trim();

    // Check if account exists
    const { data: existingAccounts } = await _supabase
      .from('accounts')
      .select('id')
      .eq('org_id', _currentUser.org_id)
      .ilike('name', accountName)
      .limit(1);

    if (existingAccounts && existingAccounts.length > 0) {
      accountId = existingAccounts[0].id;
      console.log('[OpportunitySync] Using existing account:', accountId);
    } else {
      // Create new account
      const { data: newAccount, error: accountError } = await _supabase
        .from('accounts')
        .insert({
          org_id: _currentUser.org_id,
          name: accountName,
          account_owner_id: _currentUser.id,
          account_owner_name: _currentUser.name || _currentUser.email
        })
        .select()
        .single();

      if (accountError) {
        console.error('[OpportunitySync] Account creation failed:', accountError);
      } else {
        accountId = newAccount.id;
        console.log('[OpportunitySync] Created new account:', accountId);
      }
    }

    // 2. Upsert Contact (if contact info exists)
    let contactId = null;
    const contactName = drafts['contact-name'] || drafts['champion'] || null;
    const contactEmail = drafts['contact-email'] || null;

    if (contactName && accountId) {
      // Check if contact exists
      const { data: existingContacts } = await _supabase
        .from('contacts')
        .select('id')
        .eq('org_id', _currentUser.org_id)
        .eq('account_id', accountId)
        .or(`first_name.ilike.${contactName},last_name.ilike.${contactName}`)
        .limit(1);

      if (existingContacts && existingContacts.length > 0) {
        contactId = existingContacts[0].id;
      } else {
        // Create new contact
        const nameParts = contactName.split(' ');
        const { data: newContact, error: contactError } = await _supabase
          .from('contacts')
          .insert({
            org_id: _currentUser.org_id,
            account_id: accountId,
            first_name: nameParts[0] || contactName,
            last_name: nameParts.slice(1).join(' ') || null,
            email: contactEmail,
            contact_owner_id: _currentUser.id,
            contact_owner_name: _currentUser.name || _currentUser.email
          })
          .select()
          .single();

        if (contactError) {
          console.error('[OpportunitySync] Contact creation failed:', contactError);
        } else {
          contactId = newContact.id;
          console.log('[OpportunitySync] Created new contact:', contactId);
        }
      }
    }

    // Build opportunity payload
    const oppData = {
      org_id: _currentUser.org_id,
      owner_id: _currentUser.id,
      team_id: _currentUser.team_id,

      // Link to account and contact
      account_id: accountId,
      contact_id: contactId,

      // Send both for compatibility with old CRM schema
      name: companyName.trim(),
      company_name: companyName.trim(),
      account_name: accountId ? accountName : null,
      contact_name: contactName,
      contact_email: contactEmail,

      // 4U Demand Conditions
      demand_4u_unworkable: drafts['4u-uw-evidence'] || null,
      demand_4u_unavoidable: drafts['4u-uv-evidence'] || null,
      demand_4u_urgent: drafts['4u-urg-evidence'] || null,
      demand_4u_underserved: drafts['4u-us-evidence'] || null,
      demand_4u_validated: (drafts['4u-uw-evidence'] && drafts['4u-uv-evidence'] && drafts['4u-urg-evidence'] && drafts['4u-us-evidence']) ? true : false,

      // IGNITE Stage Completion
      ignite_stage_i_complete: igniteStageAnswers['trigger'] === 'yes',
      ignite_stage_g_complete: igniteStageAnswers['research'] === 'yes',
      ignite_stage_n_complete: igniteStageAnswers['opener'] === 'yes',
      ignite_stage_i2_complete: igniteStageAnswers['sequence'] === 'yes',
      ignite_stage_t_complete: igniteStageAnswers['nurture'] === 'yes',
      ignite_stage_e_complete: igniteStageAnswers['complete'] === 'yes',

      // IGNITE Stage Data
      ignite_trigger_event: drafts['ignite-trigger'] || null,
      ignite_strategic_priorities: drafts['ignite-strategic'] || null,
      ignite_individual_research: drafts['ignite-individual'] || null,
      ignite_competitive_pressure: drafts['ignite-competitive'] || null,
      ignite_reference_outcome: drafts['ignite-reference'] || null,
      ignite_reframe_opener: drafts['ignite-opener'] || null,

      // Current IGNITE Stage
      ignite_current_stage: currentStage,

      // PROBE Qualification
      probe_tier: probeTier,
      probe_t1_score: dgYes,
      probe_t2_score: bqYes,
      probe_t3_score: fcYes,
      probe_t1_passed: probeT1Passed,
      probe_t2_passed: probeT2Passed,
      probe_t3_passed: probeT3Passed,

      // Methodology - ALWAYS ignite_apex for Sales OS path
      methodology: 'ignite_apex',

      // Map to traditional pipeline stage for CRM users
      pipeline_stage: mapIgniteToPipelineStage(currentStage, probeTier),
      pipeline_status: 'Open',

      // Note: probability is auto-calculated by database based on probe_tier
      // Do not include it in insert/update payload

      updated_at: new Date().toISOString()
    };

    // Insert or update
    if (_currentOpportunityId) {
      // Update existing
      const { error } = await _supabase
        .from('opportunities')
        .update(oppData)
        .eq('id', _currentOpportunityId);

      if (error) throw error;

      console.log('[OpportunitySync] Updated opportunity:', _currentOpportunityId);
    } else {
      // Create new
      oppData.created_by = _currentUser.id;

      const { data, error } = await _supabase
        .from('opportunities')
        .insert(oppData)
        .select()
        .single();

      if (error) throw error;

      _currentOpportunityId = data.id;

      // Update URL to include opp_id
      const url = new URL(window.location);
      url.searchParams.set('opp_id', data.id);
      window.history.replaceState({}, '', url);

      console.log('[OpportunitySync] Created new opportunity:', data.id);
    }

  } catch (err) {
    console.error('[OpportunitySync] Sync failed:', err);
  }
}

/**
 * Map IGNITE stage to traditional pipeline stage
 */
function mapIgniteToPipelineStage(igniteStage, probeTier) {
  // IGNITE stages before qualification
  if (!probeTier) {
    if (['I', 'G', 'N'].includes(igniteStage)) return 'Lead';
    return 'Lead';
  }

  // After qualification begins
  if (probeTier === 'T1') return 'Qualified';
  if (probeTier === 'T2') return 'Proposal';
  if (probeTier === 'T3') return 'Negotiation';

  return 'Lead';
}

/**
 * Calculate close probability from PROBE tier
 */
function calculateProbability(tier, t1Passed, t2Passed, t3Passed) {
  if (tier === 'T3' && t3Passed) return 80;
  if (tier === 'T2' && t2Passed) return 50;
  if (tier === 'T1' && t1Passed) return 20;
  return 10;
}

/**
 * Check if there's a local draft that needs initial sync
 */
async function syncLocalDraftToDatabase() {
  // Check if prospect name exists in form (indicates user is working on something)
  const prospectInput = document.getElementById('prospect-name');
  if (prospectInput && prospectInput.value && prospectInput.value.trim()) {
    console.log('[OpportunitySync] Found local draft, syncing to database');
    await _performSync();
  }
}

/**
 * Get current opportunity ID
 */
function getCurrentOpportunityId() {
  return _currentOpportunityId;
}

// Export functions
window.OpportunitySync = {
  init: initOpportunitySync,
  save: saveOpportunityToDatabase,
  load: loadOpportunity,
  getCurrentId: getCurrentOpportunityId
};
