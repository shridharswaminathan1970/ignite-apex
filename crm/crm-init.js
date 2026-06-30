/**
 * CRM Initialization
 * Creates direct Supabase client and sets up global state
 */

(async function() {
  'use strict';

  console.log('[CRM Init] Starting...');

  // Wait for shared supabaseClient from supabase-client.js
  function waitForSupabaseClient() {
    return new Promise((resolve) => {
      if (window.supabaseClient) {
        resolve(window.supabaseClient);
        return;
      }
      const interval = setInterval(() => {
        if (window.supabaseClient) {
          clearInterval(interval);
          resolve(window.supabaseClient);
        }
      }, 50);
    });
  }

  // Wait for the shared client to be ready
  await waitForSupabaseClient();
  console.log('[CRM Init] Shared Supabase client ready');

  // Check authentication
  const { data: { session } } = await window.supabaseClient.auth.getSession();

  if (!session) {
    console.log('[CRM Init] No session - redirecting to login');
    localStorage.setItem('selected_app', 'crm');
    window.location.href = '/app/auth.html';
    return;
  }

  console.log('[CRM Init] Session found for:', session.user.email);

  // Fetch user profile
  const { data: profile, error } = await window.supabaseClient
    .from('users')
    .select('*')
    .eq('id', session.user.id)
    .single();

  if (error || !profile) {
    console.error('[CRM Init] Profile error:', error);
    alert('Failed to load user profile');
    window.location.href = '/app/auth.html';
    return;
  }

  console.log('[CRM Init] Profile loaded:', profile.name);

  // Set global user and org data
  window.currentUser = profile;
  window.currentOrgId = profile.org_id;

  // Dispatch ready event for pages that need it
  window.dispatchEvent(new CustomEvent('crm:ready', {
    detail: {
      user: profile,
      orgId: profile.org_id,
      supabase: window.supabaseClient
    }
  }));

  console.log('[CRM Init] Ready event dispatched');

})();
