// supabase/functions/monitor-rls/index.ts
// Monitors RLS status and auto-restores if disabled
// Can be called via cron or manually

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

const CRITICAL_TABLES = [
  'users', 'organisations', 'teams', 'opportunities', 'deals', 'leads',
  'accounts', 'contacts', 'activities', 'tasks', 'registration_requests',
  'company_registration_requests', 'b2b0_trial_requests', 'user_invitations',
  'org_subscriptions', 'payment_transactions', 'configs', 'app_settings',
  'sales_persons', 'weekly_reports', 'activity_templates', 'task_templates',
  'subscription_reminders', 'trial_reminders_sent', 'task_reminders', 'deal_states'
]

interface RLSStatus {
  tablename: string
  rowsecurity: boolean
}

serve(async (req) => {
  try {
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_KEY!)

    // Check RLS status on all critical tables
    const { data: rlsStatus, error } = await supabase.rpc('check_rls_status')

    if (error) {
      console.error('[RLS Monitor] Error checking RLS:', error)
      return new Response(JSON.stringify({ error: 'Failed to check RLS status' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const disabledTables = (rlsStatus as RLSStatus[]).filter(t => !t.rowsecurity)

    if (disabledTables.length === 0) {
      console.log('[RLS Monitor] ✅ All tables have RLS enabled')
      return new Response(JSON.stringify({
        status: 'ok',
        message: 'All tables have RLS enabled',
        checked: CRITICAL_TABLES.length
      }), {
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // ALERT: Tables have RLS disabled
    console.error(`[RLS Monitor] ⚠️ ${disabledTables.length} tables have RLS DISABLED:`, disabledTables.map(t => t.tablename))

    // Auto-restore RLS
    const restoreResults = []
    for (const table of disabledTables) {
      try {
        await supabase.rpc('enable_rls_on_table', { table_name: table.tablename })
        restoreResults.push({ table: table.tablename, restored: true })
        console.log(`[RLS Monitor] ✅ Restored RLS on ${table.tablename}`)
      } catch (err) {
        restoreResults.push({ table: table.tablename, restored: false, error: err.message })
        console.error(`[RLS Monitor] ❌ Failed to restore RLS on ${table.tablename}:`, err)
      }
    }

    // Send alert email
    await sendAlertEmail(disabledTables, restoreResults)

    return new Response(JSON.stringify({
      status: 'warning',
      message: `${disabledTables.length} tables had RLS disabled, auto-restore attempted`,
      disabledTables: disabledTables.map(t => t.tablename),
      restoreResults
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (err) {
    console.error('[RLS Monitor] Fatal error:', err)
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
})

async function sendAlertEmail(disabledTables: RLSStatus[], restoreResults: any[]) {
  if (!RESEND_API_KEY) {
    console.warn('[RLS Monitor] RESEND_API_KEY not set, skipping email')
    return
  }

  const restored = restoreResults.filter(r => r.restored).length
  const failed = restoreResults.filter(r => !r.restored).length

  const emailBody = `
    <h2>🚨 RLS SECURITY ALERT</h2>
    <p><strong>${disabledTables.length} tables</strong> had Row Level Security <strong>DISABLED</strong>.</p>

    <h3>Affected Tables:</h3>
    <ul>
      ${disabledTables.map(t => `<li><code>${t.tablename}</code></li>`).join('')}
    </ul>

    <h3>Auto-Restore Results:</h3>
    <ul>
      <li>✅ <strong>${restored}</strong> tables restored successfully</li>
      ${failed > 0 ? `<li>❌ <strong>${failed}</strong> tables FAILED to restore (manual intervention needed)</li>` : ''}
    </ul>

    ${failed > 0 ? `
      <h3>Manual Action Required:</h3>
      <p>Run <code>AUTO_RESTORE_RLS.sql</code> in Supabase SQL Editor to restore remaining tables.</p>
      <p><a href="https://supabase.com/dashboard/project/gokslnrvxqledagcwghq/sql/new">Open SQL Editor</a></p>
    ` : ''}

    <h3>Next Steps:</h3>
    <ol>
      <li>Investigate how RLS was disabled (check Dashboard activity, team access logs)</li>
      <li>Review SUPABASE_SAFETY_GUIDE.md for prevention measures</li>
      <li>Verify all policies are intact via SQL Editor</li>
    </ol>

    <p><em>This alert was generated automatically by the RLS monitoring function.</em></p>
  `

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'IGNITE APEX Alerts <alerts@shaamelz.com>',
        to: ['shaamel@shaamelz.com'],
        subject: `🚨 RLS DISABLED on ${disabledTables.length} tables - Auto-restore ${restored > 0 ? 'successful' : 'FAILED'}`,
        html: emailBody
      })
    })

    if (!response.ok) {
      console.error('[RLS Monitor] Email send failed:', await response.text())
    } else {
      console.log('[RLS Monitor] Alert email sent successfully')
    }
  } catch (err) {
    console.error('[RLS Monitor] Email error:', err)
  }
}
