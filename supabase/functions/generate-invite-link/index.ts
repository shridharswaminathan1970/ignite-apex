// generate-invite-link Edge Function
// TEMPORARY: Using onboarding.dev for testing until shaamelz.com verified

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { email, name, role, managerId, crmEnabled = true } = await req.json()

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

    const { data: caller } = await supabaseAdmin
      .from('users')
      .select('role, org_id, name, email')
      .eq('id', authUser.id)
      .single()

    if (!caller) throw new Error('Caller not found')

    const { data: regRequest } = await supabaseAdmin
      .from('registration_requests')
      .select('company, full_name')
      .eq('email', email)
      .single()

    const companyName = regRequest?.company || 'NA'

    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
    const existingAuthUser = existingUsers?.users?.find(u => u.email === email)

    if (existingAuthUser) {
      const { data: existingProfile } = await supabaseAdmin
        .from('users')
        .select('id, email, name, role, org_id, is_active')
        .eq('id', existingAuthUser.id)
        .single()

      if (existingProfile) {
        throw new Error(`User with email ${email} already exists in the system.`)
      }

      console.log(`[generate-invite-link] Cleaning up orphaned auth record for ${email}`)
      await supabaseAdmin.auth.admin.deleteUser(existingAuthUser.id)
    }

    const tempPassword = crypto.randomUUID()

    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: { name, role }
    })

    if (createError || !newUser.user) {
      throw new Error(createError?.message || 'Failed to create user')
    }

    let { data: teamAlpha } = await supabaseAdmin
      .from('teams')
      .select('id')
      .eq('org_id', caller.org_id)
      .eq('name', 'Team Alpha')
      .single()

    if (!teamAlpha) {
      const { data: newTeam } = await supabaseAdmin
        .from('teams')
        .insert({ name: 'Team Alpha', org_id: caller.org_id })
        .select()
        .single()

      teamAlpha = newTeam
    }

    await supabaseAdmin.from('users').insert({
      id: newUser.user.id,
      email,
      name,
      role,
      org_id: caller.org_id,
      team_id: teamAlpha?.id || null,
      manager_id: managerId || caller.id,
      is_active: true,
      crm_enabled: crmEnabled,
      crm_trial_activated_at: new Date().toISOString(),
      account_type: 'company'
    })

    const { data: resetLink } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email: email,
      options: {
        redirectTo: `${req.headers.get('origin') || 'https://shaamelz.com'}/app/reset-password.html`
      }
    })

    const setupLink = resetLink?.properties?.action_link || null

    // TEMPORARY: Use onboarding.dev (Resend's test domain) until shaamelz.com verified
    if (RESEND_API_KEY) {
      const emailResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: 'IGNITE_APEX <onboarding@resend.dev>',
          reply_to: caller.email,
          to: email,
          subject: 'Welcome to IGNITE_APEX CRM!',
          html: `
            <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
              <h1 style="color:#F59E0B;font-size:24px">Welcome to IGNITE_APEX CRM!</h1>
              <p>Hi ${name},</p>
              <p>Thank you for signing up for IGNITE_APEX CRM. Your account has been created${companyName !== 'NA' ? ` for ${companyName}` : ''}.</p>
              
              <div style="background:#f5f5f5;padding:20px;border-radius:8px;margin:20px 0">
                <h2 style="margin-top:0;font-size:18px">🔑 Your Login Credentials</h2>
                <p><strong>User ID (Email):</strong> ${email}</p>
                <p><strong>Password Key:</strong> <code style="background:#fff;padding:4px 8px;border-radius:4px">${tempPassword}</code></p>
                <p style="color:#EF4444;font-size:14px">⚠️ Save your password key somewhere safe! You'll need it every time you sign in.</p>
              </div>

              <h3 style="font-size:16px">Next Step: Confirm Your Email</h3>
              <p>Click the button below to confirm your email address and access your CRM:</p>
              
              <a href="${setupLink}" style="display:inline-block;background:#F59E0B;color:#000;padding:14px 28px;text-decoration:none;border-radius:8px;font-weight:700;margin:20px 0">Confirm Email & Sign In</a>
              
              <p style="color:#666;font-size:14px">After confirming, you'll be taken to the sign-in page where you can log in using your email and password key shown above.</p>
              
              <hr style="border:none;border-top:1px solid #ddd;margin:30px 0">
              
              <p style="color:#666;font-size:12px">Your 99-day CRM trial has started automatically. Enjoy full access to Sales OS and CRM!</p>
              <p style="color:#666;font-size:12px">This email was sent from ${caller.name} (${caller.email})</p>
              <p style="color:#999;font-size:11px;margin-top:20px">⚠️ TEMPORARY: Emails are currently sent from onboarding@resend.dev while we complete domain verification for noreply@shaamelz.com</p>
            </div>
          `
        })
      })

      if (!emailResponse.ok) {
        console.error('[generate-invite-link] Resend error:', await emailResponse.text())
      } else {
        console.log('[generate-invite-link] Email sent successfully via onboarding@resend.dev')
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        user: { id: newUser.user.id, email, name, role },
        setupLink,
        tempPassword,
        note: 'CRM trial auto-started. Welcome email sent (temporary test domain).'
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
