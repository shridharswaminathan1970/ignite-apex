// manage-user Edge Function
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
    const { action, userId, updates } = await req.json()
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('Missing authorization header')

    const jwt = authHeader.replace('Bearer ', '')
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const { data: { user: authUser }, error: authError } = await supabaseAdmin.auth.getUser(jwt)
    if (authError || !authUser) throw new Error('Unauthorized')

    const { data: caller } = await supabaseAdmin.from('users').select('id, role, org_id').eq('id', authUser.id).single()
    if (!caller) throw new Error('Caller not found')

    const { data: target } = await supabaseAdmin.from('users').select('id, role, org_id, manager_id').eq('id', userId).single()
    if (!target) throw new Error('User not found')

    // Authorization check
    const canManage = await checkAuth(supabaseAdmin, caller, target)
    if (!canManage) throw new Error('Insufficient permissions')

    // Execute action
    if (action === 'suspend') {
      await supabaseAdmin.from('users').update({ status: 'suspended', is_active: false }).eq('id', userId)
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    if (action === 'reactivate') {
      await supabaseAdmin.from('users').update({ status: 'active', is_active: true }).eq('id', userId)
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    if (action === 'deactivate') {
      await supabaseAdmin.from('users').update({ status: 'deactivated', is_active: false }).eq('id', userId)
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    if (action === 'delete') {
      if (!['super_duper_admin', 'super_admin'].includes(caller.role)) {
        throw new Error('Only super_duper_admin and super_admin can delete')
      }
      await supabaseAdmin.from('users').delete().eq('id', userId)
      await supabaseAdmin.auth.admin.deleteUser(userId)
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    if (action === 'reset_password') {
      const { data: targetUser } = await supabaseAdmin.from('users').select('email').eq('id', userId).single()
      const { data: resetLink } = await supabaseAdmin.auth.admin.generateLink({
        type: 'recovery',
        email: targetUser.email,
        options: { redirectTo: `${req.headers.get('origin') || 'https://shaamelz.com'}/app/reset-password.html` }
      })
      return new Response(JSON.stringify({ success: true, resetLink: resetLink?.properties?.action_link }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    if (action === 'transfer') {
      // Option B rule: Cross-manager transfers require super_admin or super_duper_admin
      if (caller.role === 'admin') {
        const newManager = await supabaseAdmin.from('users').select('id, manager_id').eq('id', updates.managerId).single()
        if (newManager.data && newManager.data.manager_id !== caller.id) {
          const isDownline = await isDownline(supabaseAdmin, caller.id, updates.managerId)
          if (!isDownline) {
            throw new Error('Cross-manager transfers require super_admin permission')
          }
        }
      }

      await supabaseAdmin.from('users').update({
        team_id: updates.teamId,
        manager_id: updates.managerId
      }).eq('id', userId)
      return new Response(JSON.stringify({ success: true, message: 'User transferred' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    if (action === 'promote') {
      // Privilege escalation check
      if (caller.role === 'admin') {
        if (['super_duper_admin', 'super_admin', 'admin', 'admin_m'].includes(updates.newRole)) {
          throw new Error('Cannot promote to admin or higher roles')
        }
      }

      if (caller.role === 'super_admin') {
        if (['super_duper_admin', 'super_admin'].includes(updates.newRole)) {
          throw new Error('Cannot promote to super_duper_admin or super_admin')
        }
      }

      await supabaseAdmin.from('users').update({ role: updates.newRole }).eq('id', userId)
      return new Response(JSON.stringify({ success: true, message: `User role updated to ${updates.newRole}` }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    if (action === 'update') {
      // Remove sensitive fields
      delete updates.id
      delete updates.org_id
      delete updates.role

      await supabaseAdmin.from('users').update(updates).eq('id', userId)
      return new Response(JSON.stringify({ success: true, message: 'User updated' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    throw new Error('Unknown action')

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 })
  }
})

async function checkAuth(supabaseAdmin: any, caller: any, target: any): Promise<boolean> {
  if (caller.role === 'super_duper_admin') return true
  if (caller.org_id !== target.org_id) return false
  
  if (caller.role === 'super_admin') {
    return !['super_duper_admin', 'super_admin'].includes(target.role)
  }
  
  if (caller.role === 'admin') {
    if (['super_duper_admin', 'super_admin', 'admin', 'admin_m'].includes(target.role)) return false
    return await isDownline(supabaseAdmin, caller.id, target.id)
  }
  
  return false
}

async function isDownline(supabaseAdmin: any, managerId: string, targetId: string): Promise<boolean> {
  const { data } = await supabaseAdmin.from('users').select('id').eq('manager_id', managerId)
  if (!data) return false
  const ids = data.map((u: any) => u.id)
  if (ids.includes(targetId)) return true
  for (const id of ids) {
    if (await isDownline(supabaseAdmin, id, targetId)) return true
  }
  return false
}
