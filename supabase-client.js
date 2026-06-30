/**
 * IGNITE_APEX - Shared Supabase Client Configuration
 * SINGLE instance with session persistence enabled
 * This MUST be loaded before any page-specific scripts
 */
(function() {
  'use strict';

  const SUPABASE_URL = 'https://gokslnrvxqledagcwghq.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdva3NsbnJ2eHFsZWRhZ2N3Z2hxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY1NzU1NDksImV4cCI6MjA5MjE1MTU0OX0.1FqlAQ51IdgDSksDFswdARTb3aFEXQL5m7ZrUzMY69w';

  function initSupabaseClient() {
    // Ensure the Supabase library is loaded
    if (!window.supabase) {
      console.warn('[Supabase Client] Supabase library not yet loaded. Retrying...');
      setTimeout(initSupabaseClient, 50); // Retry after 50ms
      return;
    }

    // Create SINGLE shared instance with session persistence
    if (!window.supabaseClient) {
      window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: {
          persistSession: true,     // Persist session across page loads
          autoRefreshToken: true,   // Auto-refresh tokens
          detectSessionInUrl: true, // Detect session in URL (for password reset, etc.)
          storage: window.localStorage, // Use localStorage (default)
          storageKey: 'supabase.auth.token', // Key for session storage
        }
      });

      console.log('[Supabase Client] Shared instance created with session persistence enabled');
    } else {
      console.log('[Supabase Client] Shared instance already exists');
    }

    // Expose constants for convenience
    window.SUPABASE_URL = SUPABASE_URL;
    window.SUPABASE_ANON_KEY = SUPABASE_ANON_KEY;
  }

  // Start initialization immediately (don't wait for DOMContentLoaded)
  // Use a small delay to ensure the Supabase library script has executed
  setTimeout(initSupabaseClient, 100);
})();
