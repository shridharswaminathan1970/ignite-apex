// reset-user-password Edge Function
// Generates password reset link for users (master admin only)

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

    // Get JWT and verify caller is super_duper_admin
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
      .select('role')
      .eq('id', authUser.id)
      .single()

    if (!caller || caller.role !== 'super_duper_admin') {
      throw new Error('Unauthorized: only super_duper_admin can reset passwords')
    }

    console.log('[reset-user-password] Generating reset link for:', email)

    // Generate password reset/recovery link
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email: email,
      options: {
        redirectTo: `${req.headers.get('origin') || 'https://shaamelz.com'}/app/set-password.html`
      }
    })

    if (linkError) {
      console.error('[reset-user-password] Link generation error:', linkError)
      throw new Error(`Failed to generate reset link: ${linkError.message}`)
    }

    const resetLink = linkData?.properties?.action_link

    console.log('[reset-user-password] Reset link generated successfully')

    // Return the link for manual sharing
    return new Response(
      JSON.stringify({
        success: true,
        resetLink: resetLink,
        message: `Password reset link generated for ${email}`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('[reset-user-password] Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
