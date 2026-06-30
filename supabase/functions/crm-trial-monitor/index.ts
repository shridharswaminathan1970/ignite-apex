// CRM Trial Monitor - Daily cron job
// Day 90: popup, Day 110/145: email, Day 150: hard deactivation

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

serve(async (req) => {
  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const now = new Date()
  
  const { data: users } = await supabaseAdmin
    .from('users')
    .select('id, email, name, crm_trial_activated_at, crm_enabled')
    .eq('crm_enabled', true)
    .not('crm_trial_activated_at', 'is', null)

  if (!users) {
    return new Response(JSON.stringify({ processed: 0 }), { status: 200 })
  }

  const results = []

  for (const user of users) {
    const activatedAt = new Date(user.crm_trial_activated_at)
    const daysSince = Math.floor((now.getTime() - activatedAt.getTime()) / (1000 * 60 * 60 * 24))

    if (daysSince === 90) {
      await supabaseAdmin.from('notifications').insert({
        user_id: user.id,
        type: 'crm_trial_warning',
        title: 'CRM Trial Ending Soon',
        message: '9 days left on your Sales CRM trial. Upgrade to continue access.',
        created_at: now.toISOString()
      })
      results.push({ user: user.email, action: 'Day 90 popup' })
    }

    if (daysSince === 110) {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: 'IGNITE_APEX <noreply@shaamelz.com>',
          to: user.email,
          subject: 'Your CRM Trial Has Expired',
          html: `<p>Hi ${user.name},</p><p>Your 99-day Sales CRM trial ended 11 days ago. Upgrade now to restore access.</p>`
        })
      })
      results.push({ user: user.email, action: 'Day 110 email' })
    }

    if (daysSince === 145) {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: 'IGNITE_APEX <noreply@shaamelz.com>',
          to: user.email,
          subject: 'Final Warning: CRM Access Ending in 5 Days',
          html: `<p>Hi ${user.name},</p><p>Your CRM access will be permanently disabled in 5 days unless you upgrade.</p>`
        })
      })
      results.push({ user: user.email, action: 'Day 145 email' })
    }

    if (daysSince >= 150) {
      await supabaseAdmin
        .from('users')
        .update({ crm_enabled: false })
        .eq('id', user.id)
      results.push({ user: user.email, action: 'Day 150 deactivated' })
    }
  }

  return new Response(JSON.stringify({ processed: results.length, results }), { status: 200 })
})
