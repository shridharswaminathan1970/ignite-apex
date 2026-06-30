// invite-user Edge Function
// SaaS best-practice: invite-based team building with automatic org inheritance
// Caller must be super_admin/admin/sdr. New user inherits caller's org_id (never client-supplied).
// Sends invite email; invitee sets password and lands in workspace bound to company + manager.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface InviteUserRequest {
  email: string
  name: string
  role: 'admin' | 'admin_m' | 'sdr' | 'account_executive'
  managerId?: string // Optional: defaults to caller
  crmEnabled?: boolean // Default true
}

// Role hierarchy: who can invite whom
const ROLE_HIERARCHY: Record<string, string[]> = {
  'super_duper_admin': ['super_admin', 'admin', 'admin_m', 'sdr', 'account_executive'],
  'super_admin': ['admin', 'admin_m', 'sdr', 'account_executive'],
  'admin': ['sdr', 'account_executive'],
  'sdr': ['account_executive'],
  'admin_m': [], // view-only, cannot invite
  'account_executive': [], // cannot invite
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('[invite-user] Request received');

    // Get the authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Missing authorization header')
    }

    // Extract JWT from Authorization header
    const jwt = authHeader.replace('Bearer ', '')

    // Use service role client to verify the JWT and perform operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Verify JWT and get user
    const { data: { user: authUser }, error: authError } = await supabaseAdmin.auth.getUser(jwt)
    if (authError) {
      console.error('[invite-user] Auth error:', authError);
      throw new Error(`Authentication failed: ${authError.message}`)
    }
    if (!authUser) {
      throw new Error('Unauthorized: no authenticated user')
    }

    const { data: caller, error: callerError } = await supabaseAdmin
      .from('users')
      .select('id, role, org_id, name')
      .eq('id', authUser.id)
      .single()

    if (callerError || !caller) {
      console.error('[invite-user] Caller error:', callerError);
      return new Response(
        JSON.stringify({
          error: 'Failed to get caller information',
          details: callerError?.message,
          resolvedRole: null,
          userId: authUser?.id
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      )
    }

    console.log('[invite-user] Caller:', { email: authUser.email, role: caller.role, org_id: caller.org_id });

    // Validate caller has an org (company users only)
    if (!caller.org_id) {
      return new Response(
        JSON.stringify({
          error: 'Only company users can invite team members',
          resolvedRole: caller.role,
          userId: authUser.id
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      )
    }

    // Parse request body
    const body: InviteUserRequest = await req.json()
    const { email, name, role, managerId, crmEnabled = true } = body

    if (!email || !name || !role) {
      throw new Error('Missing required fields: email, name, role')
    }

    console.log('[invite-user] Invite request:', { email, name, role, managerId });

    // Validate role is allowed
    const allowedRoles = ROLE_HIERARCHY[caller.role] || []
    if (!allowedRoles.includes(role)) {
      return new Response(
        JSON.stringify({
          error: `${caller.role} cannot invite users with role ${role}`,
          resolvedRole: caller.role,
          allowedRoles: allowedRoles,
          requestedRole: role
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      )
    }

    // Determine manager_id
    let finalManagerId: string | null = managerId || caller.id

    // If manager specified, verify they're in the same org
    if (managerId && managerId !== caller.id) {
      const { data: manager, error: managerError } = await supabaseAdmin
        .from('users')
        .select('org_id')
        .eq('id', managerId)
        .single()

      if (managerError || !manager || manager.org_id !== caller.org_id) {
        throw new Error('Manager must be in the same organisation')
      }
    }

    console.log('[invite-user] Manager ID:', finalManagerId);

    // Create Supabase Admin client (service_role for auth operations)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Check if user already exists
    const { data: existingUser } = await supabaseAdmin.auth.admin.listUsers()
    const userExists = existingUser?.users.some(u => u.email === email)

    if (userExists) {
      throw new Error(`User with email ${email} already exists`)
    }

    // Create auth user with invite (they'll set their own password)
    // Note: inviteUserByEmail sends email invitation automatically
    const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
      email,
      {
        data: {
          name: name,
          role: role,
          invited_by: caller.name || authUser.email,
        },
        redirectTo: `${req.headers.get('origin') || 'https://shaamelz.com'}/app/set-password.html`
      }
    )

    if (inviteError) {
      console.error('[invite-user] Invite error:', inviteError);
      throw new Error(`Failed to send invite: ${inviteError.message}`)
    }

    if (!inviteData.user) {
      throw new Error('Invite sent but user object not returned')
    }

    console.log('[invite-user] Invite sent to:', email);

    // Create public.users record with CALLER'S org_id (server-side security)
    // This happens BEFORE the user accepts - they'll be bound to the org when they first log in
    const { error: userError } = await supabaseAdmin
      .from('users')
      .insert({
        id: inviteData.user.id,
        email: email,
        name: name,
        role: role,
        org_id: caller.org_id, // INHERIT from caller, never trust client
        manager_id: finalManagerId,
        is_active: true,
        crm_enabled: crmEnabled,
        account_type: 'company',
      })

    if (userError) {
      console.error('[invite-user] User record error:', userError);
      // Rollback: delete the auth user
      await supabaseAdmin.auth.admin.deleteUser(inviteData.user.id)
      throw new Error(`Failed to create user record: ${userError.message}`)
    }

    console.log('[invite-user] User record created');

    // Generate magic link for manual sharing (in case email doesn't arrive)
    let manualInviteLink = null
    try {
      const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
        type: 'invite',
        email: email,
        options: {
          redirectTo: `${req.headers.get('origin') || 'https://shaamelz.com'}/app/set-password.html`
        }
      })

      if (!linkError && linkData) {
        manualInviteLink = linkData.properties?.action_link || null
        console.log('[invite-user] Manual invite link generated');
      } else if (linkError) {
        console.error('[invite-user] Failed to generate link:', linkError);
      }
    } catch (linkGenError) {
      console.error('[invite-user] Error generating link:', linkGenError);
      // Don't fail the whole request if link generation fails
    }

    // Return success
    return new Response(
      JSON.stringify({
        success: true,
        message: `Invitation sent to ${email}`,
        user: {
          id: inviteData.user.id,
          email: email,
          name: name,
          role: role,
          org_id: caller.org_id,
          manager_id: finalManagerId,
          crm_enabled: crmEnabled,
        },
        inviteLink: manualInviteLink
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('[invite-user] Error:', error);
    return new Response(
      JSON.stringify({
        error: error.message || 'An error occurred while sending the invite'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
