// Edge Function: Trial Reminder Cron Job
// Runs daily to check for users who need trial reminders
// Triggers: Day 90, Day 120, Day 130, Day 140

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

serve(async (req) => {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    const today = new Date()
    const results = {
      day90_popup: 0,
      day120_email: 0,
      day130_email: 0,
      day140_email: 0
    }

    // -----------------------------------------
    // DAY 90: In-app popup (9 days before trial ends)
    // -----------------------------------------
    const day90Cutoff = new Date(today)
    day90Cutoff.setDate(day90Cutoff.getDate() + 9)

    const { data: day90Users } = await supabase
      .from('org_subscriptions')
      .select(`
        id,
        org_id,
        trial_ends_at,
        organisations!inner(id, name),
        users!inner(id, email, name)
      `)
      .eq('status', 'trial')
      .eq('crm_enabled', true)
      .gte('trial_ends_at', today.toISOString())
      .lte('trial_ends_at', day90Cutoff.toISOString())
      .is('trial_reminders_sent->day90', null)

    if (day90Users && day90Users.length > 0) {
      for (const sub of day90Users) {
        // Mark as sent
        const remindersSent = sub.trial_reminders_sent || {}
        remindersSent.day90 = today.toISOString()

        await supabase
          .from('org_subscriptions')
          .update({ trial_reminders_sent: remindersSent })
          .eq('id', sub.id)

        results.day90_popup++
      }
    }

    // -----------------------------------------
    // DAY 120: First email (21 days after trial expired)
    // -----------------------------------------
    const day120Start = new Date(today)
    day120Start.setDate(day120Start.getDate() - 22)
    const day120End = new Date(today)
    day120End.setDate(day120End.getDate() - 20)

    const { data: day120Users } = await supabase
      .from('org_subscriptions')
      .select(`
        id,
        org_id,
        trial_ends_at,
        organisations!inner(id, name),
        users!inner(id, email, name)
      `)
      .eq('status', 'expired')
      .eq('crm_enabled', false)
      .gte('trial_ends_at', day120Start.toISOString())
      .lte('trial_ends_at', day120End.toISOString())
      .is('trial_reminders_sent->day120', null)

    if (day120Users && day120Users.length > 0) {
      for (const sub of day120Users) {
        // Send email via Resend/SendGrid
        await sendReminderEmail(sub, 'day120')

        // Mark as sent
        const remindersSent = sub.trial_reminders_sent || {}
        remindersSent.day120 = today.toISOString()

        await supabase
          .from('org_subscriptions')
          .update({ trial_reminders_sent: remindersSent })
          .eq('id', sub.id)

        results.day120_email++
      }
    }

    // -----------------------------------------
    // DAY 130: Second email (31 days after trial expired)
    // -----------------------------------------
    const day130Start = new Date(today)
    day130Start.setDate(day130Start.getDate() - 32)
    const day130End = new Date(today)
    day130End.setDate(day130End.getDate() - 30)

    const { data: day130Users } = await supabase
      .from('org_subscriptions')
      .select(`
        id,
        org_id,
        trial_ends_at,
        organisations!inner(id, name),
        users!inner(id, email, name)
      `)
      .eq('status', 'expired')
      .eq('crm_enabled', false)
      .gte('trial_ends_at', day130Start.toISOString())
      .lte('trial_ends_at', day130End.toISOString())
      .is('trial_reminders_sent->day130', null)

    if (day130Users && day130Users.length > 0) {
      for (const sub of day130Users) {
        await sendReminderEmail(sub, 'day130')

        const remindersSent = sub.trial_reminders_sent || {}
        remindersSent.day130 = today.toISOString()

        await supabase
          .from('org_subscriptions')
          .update({ trial_reminders_sent: remindersSent })
          .eq('id', sub.id)

        results.day130_email++
      }
    }

    // -----------------------------------------
    // DAY 140: Final warning (41 days after trial expired)
    // -----------------------------------------
    const day140Start = new Date(today)
    day140Start.setDate(day140Start.getDate() - 42)
    const day140End = new Date(today)
    day140End.setDate(day140End.getDate() - 40)

    const { data: day140Users } = await supabase
      .from('org_subscriptions')
      .select(`
        id,
        org_id,
        trial_ends_at,
        organisations!inner(id, name),
        users!inner(id, email, name)
      `)
      .eq('status', 'expired')
      .eq('crm_enabled', false)
      .gte('trial_ends_at', day140Start.toISOString())
      .lte('trial_ends_at', day140End.toISOString())
      .is('trial_reminders_sent->day140', null)

    if (day140Users && day140Users.length > 0) {
      for (const sub of day140Users) {
        await sendReminderEmail(sub, 'day140')

        const remindersSent = sub.trial_reminders_sent || {}
        remindersSent.day140 = today.toISOString()

        await supabase
          .from('org_subscriptions')
          .update({ trial_reminders_sent: remindersSent })
          .eq('id', sub.id)

        results.day140_email++
      }
    }

    return new Response(JSON.stringify({
      success: true,
      timestamp: today.toISOString(),
      results
    }), {
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Trial reminder error:', error)
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
})

async function sendReminderEmail(subscription: any, reminderType: string) {
  const user = subscription.users
  const org = subscription.organisations

  // Import templates
  const { TEMPLATES } = await import('../send-email/templates.ts')

  let emailData
  if (reminderType === 'day120') {
    emailData = TEMPLATES.trialReminder120(user.name || user.email, org.name)
  } else if (reminderType === 'day130') {
    emailData = TEMPLATES.trialReminder130(user.name || user.email, org.name)
  } else if (reminderType === 'day140') {
    emailData = TEMPLATES.trialReminder140(user.name || user.email, org.name)
  }

  if (!emailData) {
    console.error(`[Trial Reminder] Unknown reminder type: ${reminderType}`)
    return false
  }

  console.log(`[Trial Reminder] ${reminderType.toUpperCase()} - Sending to:`, user.email)

  // Call send-email function
  const response = await fetch(`${SUPABASE_URL}/functions/v1/send-email`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      to: user.email,
      subject: emailData.subject,
      html: emailData.html
    })
  })

  const result = await response.json()

  if (!result.success) {
    console.error(`[Trial Reminder] Email failed:`, result.error)
    return false
  }

  console.log(`[Trial Reminder] Email sent successfully:`, result.messageId)
  return true
}
