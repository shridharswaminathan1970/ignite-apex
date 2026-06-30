// generate-login-link Edge Function
// Generate password reset link for existing users (for super_admin to share)

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { email } = await req.json()

    if (!email) {
      throw new Error('Missing email address')
    }

    // Get JWT and verify caller is super_admin
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('Missing authorization header')

    const jwt = authHeader.replace('Bearer ', '')
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const { data: { user: authUser }, error: authError } = await supabaseAdmin.auth.getUser(jwt)
    if (authError || !authUser) {
      throw new Error('Unauthorized')
    }

    const { data: caller } = await supabaseAdmin
      .from('users')
      .select('role, org_id')
      .eq('id', authUser.id)
      .single()

    if (!caller || caller.role !== 'super_admin') {
      throw new Error('Unauthorized: only super_admin can generate login links')
    }

    // Verify target user is in same org
    const { data: targetUser } = await supabaseAdmin
      .from('users')
      .select('id, org_id')
      .eq('email', email)
      .single()

    if (!targetUser) {
      throw new Error('User not found')
    }

    if (targetUser.org_id !== caller.org_id) {
      throw new Error('Cannot generate link for users in other organizations')
    }

    // Generate password reset/recovery link
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email: email,
      options: {
        redirectTo: `${req.headers.get('origin') || 'https://shaamelz.com'}/app/set-password.html`
      }
    })

    if (linkError) {
      throw new Error(`Failed to generate link: ${linkError.message}`)
    }

    return new Response(
      JSON.stringify({
        success: true,
        loginLink: linkData?.properties?.action_link || null
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
