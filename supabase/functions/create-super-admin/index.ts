// create-super-admin Edge Function
// Allows super_duper_admin to create a new organisation + super_admin user
// Returns the generated password to be forwarded to the new super_admin

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CreateSuperAdminRequest {
  orgName: string
  orgSlug: string
  superAdminEmail: string
  superAdminName: string
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Missing authorization header')
    }

    // Create Supabase client with user's JWT
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    )

    // Verify caller is super_duper_admin
    const { data: caller, error: callerError } = await supabaseClient
      .from('users')
      .select('role')
      .eq('id', (await supabaseClient.auth.getUser()).data.user?.id)
      .single()

    if (callerError || !caller || caller.role !== 'super_duper_admin') {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: only super_duper_admin can create super admins' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Parse request body
    const body: CreateSuperAdminRequest = await req.json()
    const { orgName, orgSlug, superAdminEmail, superAdminName } = body

    if (!orgName || !orgSlug || !superAdminEmail || !superAdminName) {
      throw new Error('Missing required fields: orgName, orgSlug, superAdminEmail, superAdminName')
    }

    // Validate slug format (lowercase alphanumeric + hyphens)
    if (!/^[a-z0-9-]+$/.test(orgSlug)) {
      throw new Error('orgSlug must be lowercase alphanumeric with hyphens only')
    }

    // Create Supabase Admin client (service_role)
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

    // Check if org slug already exists
    const { data: existingOrg } = await supabaseAdmin
      .from('organisations')
      .select('id')
      .eq('slug', orgSlug)
      .single()

    if (existingOrg) {
      throw new Error(`Organisation with slug "${orgSlug}" already exists`)
    }

    // Generate a secure random password
    const password = generatePassword()

    // 1. Create auth user (service_role bypasses email confirmation)
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: superAdminEmail,
      password: password,
      email_confirm: true,
      user_metadata: {
        name: superAdminName,
        role: 'super_admin',
      }
    })

    if (authError || !authUser.user) {
      throw new Error(`Failed to create auth user: ${authError?.message || 'Unknown error'}`)
    }

    // 2. Create organisation
    const { data: org, error: orgError } = await supabaseAdmin
      .from('organisations')
      .insert({
        name: orgName,
        slug: orgSlug,
      })
      .select()
      .single()

    if (orgError || !org) {
      // Rollback: delete the auth user
      await supabaseAdmin.auth.admin.deleteUser(authUser.user.id)
      throw new Error(`Failed to create organisation: ${orgError?.message || 'Unknown error'}`)
    }

    // 3. Create public.users record
    const { error: userError } = await supabaseAdmin
      .from('users')
      .insert({
        id: authUser.user.id,
        email: superAdminEmail,
        name: superAdminName,
        role: 'super_admin',
        org_id: org.id,
        manager_id: null,
        is_active: true,
        crm_enabled: true,
        account_type: 'company',
      })

    if (userError) {
      // Rollback: delete org and auth user
      await supabaseAdmin.from('organisations').delete().eq('id', org.id)
      await supabaseAdmin.auth.admin.deleteUser(authUser.user.id)
      throw new Error(`Failed to create user record: ${userError.message}`)
    }

    // Return success with generated password
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Super admin created successfully',
        organisation: {
          id: org.id,
          name: org.name,
          slug: org.slug,
        },
        user: {
          id: authUser.user.id,
          email: superAdminEmail,
          name: superAdminName,
          role: 'super_admin',
        },
        credentials: {
          email: superAdminEmail,
          password: password,
          note: 'Please forward this password securely to the new super admin. They should change it on first login.',
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Error in create-super-admin:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})

// Generate a secure random password (16 chars: uppercase, lowercase, numbers, symbols)
function generatePassword(): string {
  const length = 16
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const lowercase = 'abcdefghijklmnopqrstuvwxyz'
  const numbers = '0123456789'
  const symbols = '!@#$%^&*-_=+'
  const allChars = uppercase + lowercase + numbers + symbols

  let password = ''

  // Ensure at least one of each type
  password += uppercase[Math.floor(Math.random() * uppercase.length)]
  password += lowercase[Math.floor(Math.random() * lowercase.length)]
  password += numbers[Math.floor(Math.random() * numbers.length)]
  password += symbols[Math.floor(Math.random() * symbols.length)]

  // Fill remaining with random chars
  for (let i = password.length; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)]
  }

  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('')
}
