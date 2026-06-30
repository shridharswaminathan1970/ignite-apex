// manage-team Edge Function
// Admin power: create, rename, delete teams
// Access: super_duper_admin (all orgs), super_admin (their org only)

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
      .select('role, org_id')
      .eq('id', authUser.id)
      .single()

    if (!caller) throw new Error('Caller not found')

    // Normalize caller role
    const normalizedCallerRole = caller.role.replace(/\s+/g, '_').toLowerCase()

    // Only super_duper_admin and super_admin can manage teams
    if (!['super_duper_admin', 'super_admin'].includes(normalizedCallerRole)) {
      throw new Error('Only super_duper_admin and super_admin can manage teams')
    }

    // Parse request
    const { action, teamId, teamName, orgId } = await req.json()

    if (!action) throw new Error('Missing action (create, rename, delete)')

    // CREATE TEAM
    if (action === 'create') {
      if (!teamName || !orgId) throw new Error('Missing teamName or orgId')

      // Check authorization: super_admin can only create in their org
      if (normalizedCallerRole === 'super_admin' && orgId !== caller.org_id) {
        throw new Error('You can only create teams in your own organization')
      }

      // Check if team name already exists in this org
      const { data: existing } = await supabaseAdmin
        .from('teams')
        .select('id')
        .eq('org_id', orgId)
        .eq('name', teamName)
        .single()

      if (existing) {
        throw new Error(`Team "${teamName}" already exists in this organization`)
      }

      // Create team
      const { data: newTeam, error: createError } = await supabaseAdmin
        .from('teams')
        .insert({ name: teamName, org_id: orgId })
        .select()
        .single()

      if (createError) {
        console.error('[manage-team] Create error:', createError)
        throw new Error(`Failed to create team: ${createError.message}`)
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: `Team "${teamName}" created successfully`,
          team: newTeam
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    // RENAME TEAM
    if (action === 'rename') {
      if (!teamId || !teamName) throw new Error('Missing teamId or teamName')

      // Get team
      const { data: team } = await supabaseAdmin
        .from('teams')
        .select('id, name, org_id')
        .eq('id', teamId)
        .single()

      if (!team) throw new Error('Team not found')

      // Check authorization
      if (normalizedCallerRole === 'super_admin' && team.org_id !== caller.org_id) {
        throw new Error('You can only rename teams in your own organization')
      }

      // Update team name
      const { data: updatedTeam, error: updateError } = await supabaseAdmin
        .from('teams')
        .update({ name: teamName, updated_at: new Date().toISOString() })
        .eq('id', teamId)
        .select()
        .single()

      if (updateError) {
        console.error('[manage-team] Rename error:', updateError)
        throw new Error(`Failed to rename team: ${updateError.message}`)
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: `Team renamed to "${teamName}" successfully`,
          team: updatedTeam
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    // DELETE TEAM
    if (action === 'delete') {
      if (!teamId) throw new Error('Missing teamId')

      // Get team
      const { data: team } = await supabaseAdmin
        .from('teams')
        .select('id, name, org_id')
        .eq('id', teamId)
        .single()

      if (!team) throw new Error('Team not found')

      // Check authorization
      if (normalizedCallerRole === 'super_admin' && team.org_id !== caller.org_id) {
        throw new Error('You can only delete teams in your own organization')
      }

      // Check if team has users
      const { data: usersInTeam, error: checkError } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('team_id', teamId)

      if (checkError) {
        console.error('[manage-team] Check users error:', checkError)
        throw new Error(`Failed to check team users: ${checkError.message}`)
      }

      if (usersInTeam && usersInTeam.length > 0) {
        throw new Error(`Cannot delete team "${team.name}" - it has ${usersInTeam.length} user(s). Please reassign them first.`)
      }

      // Delete team
      const { error: deleteError } = await supabaseAdmin
        .from('teams')
        .delete()
        .eq('id', teamId)

      if (deleteError) {
        console.error('[manage-team] Delete error:', deleteError)
        throw new Error(`Failed to delete team: ${deleteError.message}`)
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: `Team "${team.name}" deleted successfully`
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    throw new Error('Invalid action. Must be: create, rename, or delete')

  } catch (error) {
    console.error('[manage-team] Error:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to manage team' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
