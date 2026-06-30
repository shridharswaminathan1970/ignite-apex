// create-user Edge Function
// Allows super_admin/admin/sdr to create users in their organisation
// Enforces role hierarchy and reporting structure

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CreateUserRequest {
  email: string
  name: string
  role: 'super_admin' | 'admin' | 'admin_m' | 'sdr' | 'account_executive'
  managerId?: string // Optional: if not provided, caller becomes manager
  crmEnabled?: boolean // Default true for company users
}

// Role hierarchy: who can create whom
const ROLE_HIERARCHY: Record<string, string[]> = {
  'super_duper_admin': ['super_admin', 'admin', 'admin_m', 'sdr', 'account_executive'],
  'super_admin': ['admin', 'admin_m', 'sdr', 'account_executive'],
  'admin': ['sdr', 'account_executive'],
  'sdr': ['account_executive'],
  'admin_m': [], // admin_m cannot create users
  'account_executive': [], // AE cannot create users
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

    // Get caller's user info
    const { data: { user: authUser } } = await supabaseClient.auth.getUser()
    if (!authUser) {
      throw new Error('Unauthorized: no authenticated user')
    }

    const { data: caller, error: callerError } = await supabaseClient
      .from('users')
      .select('id, role, org_id, name')
      .eq('id', authUser.id)
      .single()

    if (callerError || !caller) {
      throw new Error('Failed to get caller information')
    }

    // Parse request body
    const body: CreateUserRequest = await req.json()
    const { email, name, role, managerId, crmEnabled = true } = body

    if (!email || !name || !role) {
      throw new Error('Missing required fields: email, name, role')
    }

    // Validate role is allowed
    const allowedRoles = ROLE_HIERARCHY[caller.role] || []
    if (!allowedRoles.includes(role)) {
      throw new Error(`${caller.role} cannot create users with role ${role}`)
    }

    // Determine the manager_id
    let finalManagerId: string | null = null

    if (caller.role === 'super_duper_admin') {
      // Super duper admin creates org-scoped users, so manager_id should be null for super_admin
      if (role === 'super_admin') {
        finalManagerId = null
      } else {
        // For other roles, use provided managerId or throw error
        if (!managerId) {
          throw new Error('managerId required when super_duper_admin creates non-super_admin users')
        }
        finalManagerId = managerId
      }
    } else {
      // For company users, use provided managerId or default to caller
      finalManagerId = managerId || caller.id

      // Verify the manager is in the same org
      if (managerId) {
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

        const { data: manager } = await supabaseAdmin
          .from('users')
          .select('org_id')
          .eq('id', managerId)
          .single()

        if (!manager || manager.org_id !== caller.org_id) {
          throw new Error('Manager must be in the same organisation')
        }
      }
    }

    // Generate a secure random password
    const password = generatePassword()

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

    // 1. Create auth user
    const { data: newAuthUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true,
      user_metadata: {
        name: name,
        role: role,
      }
    })

    if (authError || !newAuthUser.user) {
      throw new Error(`Failed to create auth user: ${authError?.message || 'Unknown error'}`)
    }

    // 2. Create public.users record
    const { error: userError } = await supabaseAdmin
      .from('users')
      .insert({
        id: newAuthUser.user.id,
        email: email,
        name: name,
        role: role,
        org_id: caller.org_id, // Inherit caller's org
        manager_id: finalManagerId,
        is_active: true,
        crm_enabled: crmEnabled,
        account_type: 'company',
      })

    if (userError) {
      // Rollback: delete auth user
      await supabaseAdmin.auth.admin.deleteUser(newAuthUser.user.id)
      throw new Error(`Failed to create user record: ${userError.message}`)
    }

    // Return success with generated password
    return new Response(
      JSON.stringify({
        success: true,
        message: 'User created successfully',
        user: {
          id: newAuthUser.user.id,
          email: email,
          name: name,
          role: role,
          org_id: caller.org_id,
          manager_id: finalManagerId,
          crm_enabled: crmEnabled,
        },
        credentials: {
          email: email,
          password: password,
          note: 'Please forward this password securely. User should change it on first login.',
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Error in create-user:', error)
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
