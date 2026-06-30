// B2B0 Trial Monitor - Daily cron job
// Day 9: Hard block (7-day trial + 2 grace days)

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

serve(async (req) => {
  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const now = new Date()
  
  const { data: users } = await supabaseAdmin
    .from('users')
    .select('id, email, b2b0_trial_activated_at, b2b0_enabled')
    .eq('b2b0_enabled', true)
    .not('b2b0_trial_activated_at', 'is', null)

  if (!users) {
    return new Response(JSON.stringify({ processed: 0 }), { status: 200 })
  }

  const results = []

  for (const user of users) {
    const activatedAt = new Date(user.b2b0_trial_activated_at)
    const daysSince = Math.floor((now.getTime() - activatedAt.getTime()) / (1000 * 60 * 60 * 24))

    if (daysSince >= 9) {
      await supabaseAdmin
        .from('users')
        .update({ b2b0_enabled: false })
        .eq('id', user.id)
      results.push({ user: user.email, action: 'Day 9 B2B0 blocked' })
    }
  }

  return new Response(JSON.stringify({ processed: results.length, results }), { status: 200 })
})
