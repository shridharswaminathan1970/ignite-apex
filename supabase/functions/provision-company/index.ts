// provision-company Edge Function
// Master-only: super_duper_admin creates new org + invites first super_admin
// Replaces password generation with invite-based flow

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
}

interface ProvisionCompanyRequest {
  orgName: string
  orgSlug: string
  address: string
  contactEmail: string
  contactPhone: string
  superAdminEmail: string
  superAdminName: string
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders,
      status: 200
    })
  }

  try {
    console.log('[provision-company] Request received');

    // Get the authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Missing authorization header')
    }

    // Extract JWT from Authorization header
    const jwt = authHeader.replace('Bearer ', '')

    // Use service role client to verify the JWT
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
      console.error('[provision-company] Auth error:', authError);
      throw new Error(`Authentication failed: ${authError.message}`)
    }
    if (!authUser) {
      throw new Error('Unauthorized: no authenticated user')
    }

    const { data: caller, error: callerError } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', authUser.id)
      .single()

    // Normalize role (handle spaces, underscores, case)
    const normalizedRole = caller?.role ? caller.role.replace(/\s+/g, '_').toLowerCase() : '';
    console.log('[provision-company] Caller role:', caller?.role, '→ normalized:', normalizedRole);

    if (callerError || !caller || normalizedRole !== 'super_duper_admin') {
      console.error('[provision-company] Unauthorized caller:', { email: authUser.email, role: caller?.role, normalized: normalizedRole });
      return new Response(
        JSON.stringify({
          error: 'Unauthorized: only super_duper_admin can provision companies',
          resolvedRole: caller?.role || null,
          normalizedRole: normalizedRole,
          userId: authUser.id,
          details: callerError?.message
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      )
    }

    console.log('[provision-company] Authorized caller:', authUser.email);

    // Parse request body
    const body: ProvisionCompanyRequest = await req.json()
    const { orgName, orgSlug, address, contactEmail, contactPhone, superAdminEmail, superAdminName } = body

    if (!orgName || !orgSlug || !address || !contactEmail || !contactPhone || !superAdminEmail || !superAdminName) {
      throw new Error('Missing required fields: orgName, orgSlug, address, contactEmail, contactPhone, superAdminEmail, superAdminName')
    }

    // Validate slug format (lowercase alphanumeric + hyphens)
    if (!/^[a-z0-9-]+$/.test(orgSlug)) {
      throw new Error('orgSlug must be lowercase alphanumeric with hyphens only')
    }

    console.log('[provision-company] Provisioning:', { orgName, orgSlug, superAdminEmail });

    // supabaseAdmin already created above for auth verification - reuse it

    // Check if org slug already exists
    const { data: existingOrg } = await supabaseAdmin
      .from('organisations')
      .select('id')
      .eq('slug', orgSlug)
      .single()

    if (existingOrg) {
      throw new Error(`Organisation with slug "${orgSlug}" already exists`)
    }

    // Check if user email already exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
    const userExists = existingUsers?.users.some(u => u.email === superAdminEmail)

    if (userExists) {
      throw new Error(`User with email ${superAdminEmail} already exists`)
    }

    // 1. Create organisation (with SLUG and contact details - required per schema)
    const { data: org, error: orgError } = await supabaseAdmin
      .from('organisations')
      .insert({
        name: orgName,
        slug: orgSlug,
        address: address,
        contact_email: contactEmail,
        contact_phone: contactPhone,
        plan: 'free', // default
      })
      .select()
      .single()

    if (orgError || !org) {
      console.error('[provision-company] Org creation error:', orgError);
      throw new Error(`Failed to create organisation: ${orgError?.message || 'Unknown error'}`)
    }

    console.log('[provision-company] Organisation created:', org.id);

    // 2. Create default "Team Alpha" for this organisation
    const { data: team, error: teamError } = await supabaseAdmin
      .from('teams')
      .insert({
        name: 'Team Alpha',
        org_id: org.id
      })
      .select()
      .single()

    if (teamError || !team) {
      console.error('[provision-company] Team creation error:', teamError);
      // Rollback: delete the org
      await supabaseAdmin.from('organisations').delete().eq('id', org.id)
      throw new Error(`Failed to create default team: ${teamError?.message || 'Unknown error'}`)
    }

    console.log('[provision-company] Team Alpha created:', team.id);

    // 3. Create super_admin user with temporary password
    const tempPassword = crypto.randomUUID()

    const { data: newUser, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
      email: superAdminEmail,
      password: tempPassword,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        name: superAdminName,
        role: 'super_admin',
        org_name: orgName
      }
    })

    if (createUserError || !newUser.user) {
      console.error('[provision-company] User creation error:', createUserError);
      // Rollback: delete team and org
      await supabaseAdmin.from('teams').delete().eq('id', team.id)
      await supabaseAdmin.from('organisations').delete().eq('id', org.id)
      throw new Error(`Failed to create user: ${createUserError?.message || 'Unknown error'}`)
    }

    console.log('[provision-company] Auth user created:', superAdminEmail);

    // 4. Create public.users record (super_admin for this org, assigned to Team Alpha)
    const { error: userError } = await supabaseAdmin
      .from('users')
      .insert({
        id: newUser.user.id,
        email: superAdminEmail,
        name: superAdminName,
        role: 'super_admin',
        org_id: org.id,
        team_id: team.id, // Assign to Team Alpha
        manager_id: null, // super_admin has no manager within the org
        is_active: true,
        crm_enabled: true,
        account_type: 'company',
      })

    if (userError) {
      console.error('[provision-company] User record error:', userError);
      // Rollback: delete team, org, and auth user
      await supabaseAdmin.from('teams').delete().eq('id', team.id)
      await supabaseAdmin.from('organisations').delete().eq('id', org.id)
      await supabaseAdmin.auth.admin.deleteUser(newUser.user.id)
      throw new Error(`Failed to create user record: ${userError.message}`)
    }

    console.log('[provision-company] User record created');

    // 5. Generate password reset link for manual sharing
    const { data: resetLinkData, error: resetLinkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email: superAdminEmail,
      options: {
        redirectTo: `${req.headers.get('origin') || 'https://shaamelz.com'}/app/reset-password.html`
      }
    })

    if (resetLinkError) {
      console.error('[provision-company] Failed to generate password setup link:', resetLinkError);
    }

    const setupLink = resetLinkData?.properties?.action_link || null
    console.log('[provision-company] Password setup link generated:', !!setupLink);

    // Return success with setup link
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Company provisioned successfully',
        organisation: {
          id: org.id,
          name: org.name,
          slug: org.slug,
        },
        super_admin: {
          id: newUser.user.id,
          email: superAdminEmail,
          name: superAdminName,
          role: 'super_admin',
        },
        setupLink: setupLink,
        tempPassword: tempPassword,
        note: `Copy the setup link below and send it to ${superAdminEmail}. They will use it to set their password. The link expires in 24 hours.`
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('[provision-company] Error:', error);
    return new Response(
      JSON.stringify({
        error: error.message || 'An error occurred while provisioning the company'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
