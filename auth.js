/**
 * IGNITE_APEX — Auth Module
 *
 * Wraps Supabase Auth for sign-up, sign-in, sign-out, password reset,
 * and current-user retrieval. Depends on supabase-client.js being loaded first.
 *
 * Usage (HTML page):
 *   <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js"></script>
 *   <script src="../supabase-client.js"></script>
 *   <script src="../auth.js"></script>
 *
 * Then call:
 *   IA_Auth.signIn(email, password)
 *   IA_Auth.signUp(email, password, orgName, userName)
 *   IA_Auth.signOut()
 *   IA_Auth.getUser()
 *   IA_Auth.resetPassword(email)
 */

(function () {
  'use strict';

  // ── Slug helpers ─────────────────────────────────────────────────────────────
  function _toSlug(name) {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 48);
  }

  // ── Ensure IAdb is available ──────────────────────────────────────────────────
  function _sb() {
    const client = window.IAdb && window.IAdb.supabase;
    if (!client) throw new Error('Supabase client not initialised. Load supabase-client.js first.');
    return client;
  }

  // ── Result helper ─────────────────────────────────────────────────────────────
  function ok(data)  { return { ok: true,  data, error: null  }; }
  function err(e)    { return { ok: false, data: null, error: typeof e === 'string' ? e : (e && e.message) || 'Unknown error' }; }

  // ══════════════════════════════════════════════════════════════
  const IA_Auth = {

    // ── SIGN UP ───────────────────────────────────────────────────────────────
    // Creates an auth user, then calls the create_org_and_claim_admin RPC
    // to atomically create the organisation and admin profile.
    //
    // Flow:
    //   1. supabase.auth.signUp()  → creates auth.users row
    //   2. RPC create_org_and_claim_admin()  → creates organisations + users rows
    //
    // Returns { ok, data: { user, orgId, role }, error }
    async signUp(email, password, orgName, userName) {
      if (!email || !password || !orgName) {
        return err('Email, password and organisation name are required.');
      }
      if (password.length < 8) {
        return err('Password must be at least 8 characters.');
      }

      const slug = _toSlug(orgName);
      if (!slug) return err('Organisation name must contain at least one letter or number.');

      try {
        const sb = _sb();

        // Step 1 — create the auth user
        const { data: authData, error: authErr } = await sb.auth.signUp({
          email,
          password,
          options: {
            data: { name: userName || email.split('@')[0] },
          },
        });

        if (authErr) return err(authErr);
        if (!authData.user) return err('Signup did not return a user. Check if email confirmation is required.');

        // Step 2 — create org and claim admin role
        // If email confirmation is enabled the user is not yet "authenticated"
        // from Supabase's perspective. We need to sign them in first so the
        // SECURITY DEFINER RPC can read auth.uid().
        let orgResult;
        if (authData.session) {
          // Email confirmation disabled (instant session) — call RPC directly
          const { data: rpcData, error: rpcErr } = await sb.rpc('create_org_and_claim_admin', {
            p_org_name: orgName,
            p_slug:     slug,
            p_name:     userName || null,
            p_email:    email,
          });
          if (rpcErr) return err(rpcErr);
          orgResult = rpcData;
        } else {
          // Email confirmation enabled — store pending org info so we can
          // claim it after the user clicks the confirmation link and signs in.
          try {
            localStorage.setItem('ia_pending_org', JSON.stringify({
              orgName, slug, userName, email, createdAt: Date.now(),
            }));
          } catch(e) {}
          return ok({
            user:    authData.user,
            orgId:   null,
            role:    null,
            pending: true,
            message: 'Check your email to confirm your account, then sign in.',
          });
        }

        // Re-init db so profile cache is populated
        if (window.IAdb) {
          window.IAdb._initDone = false;
          await window.IAdb.init();
        }

        return ok({
          user:  authData.user,
          orgId: orgResult.org_id,
          role:  orgResult.role,
        });

      } catch (e) {
        return err(e);
      }
    },

    // ── SIGN IN ───────────────────────────────────────────────────────────────
    // Returns { ok, data: { user, orgId, role }, error }
    async signIn(email, password) {
      if (!email || !password) return err('Email and password are required.');

      try {
        const sb = _sb();
        const { data, error: authErr } = await sb.auth.signInWithPassword({ email, password });
        if (authErr) return err(authErr);

        // Re-init so profile cache is populated
        if (window.IAdb) {
          window.IAdb._initDone = false;
          await window.IAdb.init();
        }

        // Handle pending org claim (user confirmed email after signUp)
        const pending = (() => {
          try { return JSON.parse(localStorage.getItem('ia_pending_org')); }
          catch(e) { return null; }
        })();

        if (pending && !window.IAdb.currentUser) {
          const { data: rpcData, error: rpcErr } = await sb.rpc('create_org_and_claim_admin', {
            p_org_name: pending.orgName,
            p_slug:     pending.slug,
            p_name:     pending.userName || null,
            p_email:    pending.email || null,
          });
          if (!rpcErr) {
            try { localStorage.removeItem('ia_pending_org'); } catch(e) {}
            // Re-init again with the new profile
            if (window.IAdb) {
              window.IAdb._initDone = false;
              await window.IAdb.init();
            }
          }
        }

        const cur = window.IAdb && window.IAdb.currentUser;
        return ok({
          user:  data.user,
          orgId: cur && cur.org_id,
          role:  cur && cur.role,
        });

      } catch (e) {
        return err(e);
      }
    },

    // ── SIGN OUT ──────────────────────────────────────────────────────────────
    // Clears the Supabase session. The localStorage config/deals remain intact
    // so the app stays usable offline.
    async signOut() {
      try {
        const { error: e } = await _sb().auth.signOut();
        if (e) return err(e);
        return ok({ message: 'Signed out.' });
      } catch (e) {
        return err(e);
      }
    },

    // ── GET CURRENT USER ──────────────────────────────────────────────────────
    // Returns the cached user profile (fast, synchronous via db cache),
    // or fetches from Supabase if the cache is cold.
    async getUser() {
      // Fast path: use cache
      if (window.IAdb && window.IAdb.currentUser) {
        return ok(window.IAdb.currentUser);
      }

      try {
        const sb = _sb();
        const { data: { user }, error: authErr } = await sb.auth.getUser();
        if (authErr || !user) return ok(null);

        const { data: profile, error: profileErr } = await sb
          .from('users')
          .select('org_id, role, name, email')
          .eq('id', user.id)
          .maybeSingle();

        if (profileErr || !profile) return ok(null);
        return ok({ id: user.id, email: user.email, ...profile });
      } catch (e) {
        return err(e);
      }
    },

    // ── PASSWORD RESET ────────────────────────────────────────────────────────
    // Sends a password reset email. redirectTo should be your site's reset page.
    async resetPassword(email, redirectTo) {
      if (!email) return err('Email is required.');
      try {
        const opts = redirectTo ? { redirectTo } : {};
        const { error: e } = await _sb().auth.resetPasswordForEmail(email, opts);
        if (e) return err(e);
        return ok({ message: `Password reset email sent to ${email}.` });
      } catch (e) {
        return err(e);
      }
    },

    // ── UPDATE PASSWORD ───────────────────────────────────────────────────────
    // Called after the user clicks the reset link and lands on your reset page.
    async updatePassword(newPassword) {
      if (!newPassword || newPassword.length < 8) {
        return err('Password must be at least 8 characters.');
      }
      try {
        const { error: e } = await _sb().auth.updateUser({ password: newPassword });
        if (e) return err(e);
        return ok({ message: 'Password updated successfully.' });
      } catch (e) {
        return err(e);
      }
    },

    // ── INVITE MEMBER ─────────────────────────────────────────────────────────
    // Admin-only: generates a sign-up link pre-tagged with org_id and role.
    // The invited user signs up via this link and the auth trigger auto-creates
    // their profile row with the embedded org_id.
    //
    // NOTE: this requires the service role key and must be called from a
    // server-side function (Edge Function), not from client-side JS.
    // This method is included here as documentation only — it will throw
    // if called from the browser.
    async inviteMember(email, role) {
      throw new Error(
        'inviteMember() must be called from a server-side Edge Function using the service role key. ' +
        'Never use the service role key in client-side code.'
      );
    },

    // ── SESSION CHECK ─────────────────────────────────────────────────────────
    // Returns true if there is a valid session. Useful for auth-gating pages.
    async hasSession() {
      try {
        const { data: { session } } = await _sb().auth.getSession();
        return !!session;
      } catch(e) {
        return false;
      }
    },

    // ── REDIRECT IF NOT AUTHED ────────────────────────────────────────────────
    // Call at the top of any auth-gated page.
    // redirectPath: where to send unauthenticated visitors (default: /app/)
    async requireAuth(redirectPath) {
      const has = await this.hasSession();
      if (!has) {
        window.location.href = redirectPath || '/app/';
      }
      return has;
    },
  };

  // Expose globally
  window.IA_Auth = IA_Auth;

})();
