// update-user Edge Function
// Admin power: update user details (role, team, manager, activate/deactivate)
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
    const {
      userId,
      updates
    } = await req.json()

    if (!userId) throw new Error('Missing userId')
    if (!updates || typeof updates !== 'object') throw new Error('Missing updates object')

    // Get target user
    const { data: targetUser } = await supabaseAdmin
      .from('users')
      .select('id, email, name, role, org_id, team_id, manager_id, is_active')
      .eq('id', userId)
      .single()

    if (!targetUser) throw new Error('User not found')

    // Authorization check based on role hierarchy
    let authorized = false

    if (normalizedCallerRole === 'super_duper_admin') {
      // Platform admin can update anyone
      authorized = true
    } else if (normalizedCallerRole === 'super_admin') {
      // Company admin can update anyone in their org
      authorized = (targetUser.org_id === caller.org_id)
    } else if (normalizedCallerRole === 'admin') {
      // Sales manager can update their downline only
      // Check if caller manages target using app_manages
      const { data: manages } = await supabaseAdmin.rpc('app_manages', { target_user_id: userId })
      authorized = manages === true && targetUser.org_id === caller.org_id
    } else {
      throw new Error('Insufficient permissions to update users')
    }

    if (!authorized) {
      throw new Error('You do not have permission to update this user')
    }

    // Build update object (only allow specific fields)
    const allowedUpdates: any = {}

    if (updates.name !== undefined) allowedUpdates.name = updates.name
    if (updates.email !== undefined) allowedUpdates.email = updates.email
    if (updates.role !== undefined) allowedUpdates.role = updates.role
    if (updates.team_id !== undefined) allowedUpdates.team_id = updates.team_id
    if (updates.manager_id !== undefined) allowedUpdates.manager_id = updates.manager_id
    if (updates.is_active !== undefined) allowedUpdates.is_active = updates.is_active
    if (updates.crm_enabled !== undefined) allowedUpdates.crm_enabled = updates.crm_enabled

    // Validate team_id belongs to same org (if changing team)
    if (allowedUpdates.team_id) {
      const { data: team } = await supabaseAdmin
        .from('teams')
        .select('org_id')
        .eq('id', allowedUpdates.team_id)
        .single()

      if (!team || team.org_id !== targetUser.org_id) {
        throw new Error('Cannot assign user to a team from a different organization')
      }
    }

    // Validate manager_id belongs to same org (if changing manager)
    if (allowedUpdates.manager_id) {
      const { data: manager } = await supabaseAdmin
        .from('users')
        .select('org_id')
        .eq('id', allowedUpdates.manager_id)
        .single()

      if (!manager || manager.org_id !== targetUser.org_id) {
        throw new Error('Cannot assign user to a manager from a different organization')
      }
    }

    // Update user record
    const { data: updatedUser, error: updateError } = await supabaseAdmin
      .from('users')
      .update(allowedUpdates)
      .eq('id', userId)
      .select()
      .single()

    if (updateError) {
      console.error('[update-user] Update error:', updateError)
      throw new Error(`Failed to update user: ${updateError.message}`)
    }

    // If email changed, update auth.users email too
    if (allowedUpdates.email && allowedUpdates.email !== targetUser.email) {
      const { error: authUpdateError } = await supabaseAdmin.auth.admin.updateUserById(
        userId,
        { email: allowedUpdates.email }
      )

      if (authUpdateError) {
        console.error('[update-user] Auth email update error:', authUpdateError)
        // Rollback user table change
        await supabaseAdmin
          .from('users')
          .update({ email: targetUser.email })
          .eq('id', userId)
        throw new Error(`Failed to update auth email: ${authUpdateError.message}`)
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'User updated successfully',
        user: updatedUser
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    console.error('[update-user] Error:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to update user' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
