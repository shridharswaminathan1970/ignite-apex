// delete-user Edge Function
// Admin power: permanently delete user
// Access: super_duper_admin (all), super_admin (org), admin (downline)

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders, status: 200 })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('Missing authorization header')

    const jwt = authHeader.replace('Bearer ', '')
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // Verify caller
    const { data: { user: authUser }, error: authError } = await supabaseAdmin.auth.getUser(jwt)
    if (authError || !authUser) throw new Error('Unauthorized')

    const { data: caller } = await supabaseAdmin
      .from('users')
      .select('role, org_id, id')
      .eq('id', authUser.id)
      .single()

    if (!caller) throw new Error('Caller not found')

    // Normalize caller role
    const normalizedCallerRole = caller.role.replace(/\s+/g, '_').toLowerCase()

    // Parse request
    const { userId } = await req.json()
    if (!userId) throw new Error('Missing userId')

    // Cannot delete yourself
    if (userId === caller.id) {
      throw new Error('Cannot delete your own account')
    }

    // Get target user
    const { data: targetUser } = await supabaseAdmin
      .from('users')
      .select('id, email, name, role, org_id')
      .eq('id', userId)
      .single()

    if (!targetUser) throw new Error('User not found')

    // Authorization check
    let authorized = false

    if (normalizedCallerRole === 'super_duper_admin') {
      authorized = true
    } else if (normalizedCallerRole === 'super_admin') {
      authorized = (targetUser.org_id === caller.org_id)
    } else if (normalizedCallerRole === 'admin') {
      const { data: manages } = await supabaseAdmin.rpc('app_manages', { target_user_id: userId })
      authorized = manages === true && targetUser.org_id === caller.org_id
    } else {
      throw new Error('Insufficient permissions to delete users')
    }

    if (!authorized) {
      throw new Error('You do not have permission to delete this user')
    }

    // Delete from auth.users (cascade will handle public.users via FK)
    const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(userId)

    if (authDeleteError) {
      console.error('[delete-user] Auth delete error:', authDeleteError)
      throw new Error(`Failed to delete auth user: ${authDeleteError.message}`)
    }

    // Explicitly delete from public.users (if cascade didn't handle it)
    await supabaseAdmin
      .from('users')
      .delete()
      .eq('id', userId)

    return new Response(
      JSON.stringify({
        success: true,
        message: `User ${targetUser.email} deleted successfully`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    console.error('[delete-user] Error:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to delete user' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
