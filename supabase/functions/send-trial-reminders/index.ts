// Trial Reminder Email System
// Runs every 20 minutes via cron
// Sends reminders to orgs in grace period or approaching trial end

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

interface EmailPayload {
  from: string;
  to: string[];
  subject: string;
  html: string;
}

serve(async (req) => {
  try {
    // This function is called via cron, no auth needed
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    // Query 1: Orgs with trial ending in next 30 days (send reminder)
    const { data: approachingEnd } = await supabase
      .from('org_subscriptions')
      .select('*, organisations(*)')
      .eq('status', 'trial')
      .lte('trial_ends_at', thirtyDaysFromNow.toISOString())
      .gte('trial_ends_at', now.toISOString())
      .eq('email_reminder_enabled', true);

    // Query 2: Orgs in grace period (105-150 days since trial_ends_at)
    const { data: gracePeriod } = await supabase
      .from('org_subscriptions')
      .select('*, organisations(*)')
      .in('status', ['grace_period', 'trial'])
      .lt('trial_ends_at', now.toISOString())
      .eq('email_reminder_enabled', true);

    const remindersToSend: Array<{ org: any; reason: string }> = [];

    // Check approaching end orgs (30 days, 14 days, 7 days, 3 days, 1 day)
    if (approachingEnd) {
      for (const sub of approachingEnd) {
        const trialEndsAt = new Date(sub.trial_ends_at);
        const daysLeft = Math.ceil((trialEndsAt.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));

        // Send reminder at key milestones
        if ([30, 14, 7, 3, 1].includes(daysLeft)) {
          const lastSent = sub.last_reminder_sent_at ? new Date(sub.last_reminder_sent_at) : null;
          const hoursSinceLastSent = lastSent
            ? (now.getTime() - lastSent.getTime()) / (60 * 60 * 1000)
            : 999;

          // Don't spam - wait at least 12 hours between reminders
          if (hoursSinceLastSent > 12) {
            remindersToSend.push({ org: sub, reason: `trial_ending_${daysLeft}` });
          }
        }
      }
    }

    // Check grace period orgs
    if (gracePeriod) {
      for (const sub of gracePeriod) {
        const trialEndsAt = new Date(sub.trial_ends_at);
        const daysSinceExpiry = Math.ceil((now.getTime() - trialEndsAt.getTime()) / (24 * 60 * 60 * 1000));

        // Send reminders at: 7 days, 14 days, 21 days, 30 days, 45 days after expiry
        if ([7, 14, 21, 30, 45].includes(daysSinceExpiry)) {
          const lastSent = sub.last_reminder_sent_at ? new Date(sub.last_reminder_sent_at) : null;
          const hoursSinceLastSent = lastSent
            ? (now.getTime() - lastSent.getTime()) / (60 * 60 * 1000)
            : 999;

          if (hoursSinceLastSent > 12) {
            remindersToSend.push({ org: sub, reason: `grace_period_${daysSinceExpiry}` });
          }
        }
      }
    }

    console.log(`[Trial Reminders] Found ${remindersToSend.length} orgs to notify`);

    // Send emails
    const results = [];
    for (const { org, reason } of remindersToSend) {
      try {
        // Get admin users for this org
        const { data: admins } = await supabase
          .from('users')
          .select('email, name')
          .eq('org_id', org.org_id)
          .in('role', ['admin', 'super_duper_admin']);

        if (!admins || admins.length === 0) {
          console.log(`[Trial Reminders] No admins found for org ${org.org_id}`);
          continue;
        }

        const emailHtml = buildEmailTemplate(org, reason);
        const subject = getSubjectLine(reason);

        // Send via Resend
        const emailPayload: EmailPayload = {
          from: 'IGNITE_APEX <noreply@shaamelz.com>',
          to: admins.map((a) => a.email),
          subject,
          html: emailHtml,
        };

        if (RESEND_API_KEY) {
          const emailResponse = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${RESEND_API_KEY}`,
            },
            body: JSON.stringify(emailPayload),
          });

          if (!emailResponse.ok) {
            const error = await emailResponse.text();
            throw new Error(`Resend API error: ${error}`);
          }

          console.log(`[Trial Reminders] Sent email to org ${org.org_id} (reason: ${reason})`);
        } else {
          console.log(`[Trial Reminders] MOCK - Would send email to:`, emailPayload.to);
        }

        // Update last_reminder_sent_at
        await supabase
          .from('org_subscriptions')
          .update({
            last_reminder_sent_at: now.toISOString(),
            reminder_count: (org.reminder_count || 0) + 1,
          })
          .eq('org_id', org.org_id);

        results.push({ org_id: org.org_id, status: 'sent', reason });
      } catch (error) {
        console.error(`[Trial Reminders] Error sending to org ${org.org_id}:`, error);
        results.push({ org_id: org.org_id, status: 'failed', reason, error: error.message });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        sent: results.filter((r) => r.status === 'sent').length,
        failed: results.filter((r) => r.status === 'failed').length,
        results,
      }),
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('[Trial Reminders] Fatal error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
});

function getSubjectLine(reason: string): string {
  if (reason.startsWith('trial_ending_')) {
    const days = reason.split('_')[2];
    if (days === '1') return '⚠️ Your IGNITE_APEX trial ends tomorrow';
    return `⏰ Your IGNITE_APEX trial ends in ${days} days`;
  }

  if (reason.startsWith('grace_period_')) {
    const days = reason.split('_')[2];
    return `🔔 IGNITE_APEX: ${days} days since trial ended - Subscribe to keep access`;
  }

  return '📊 IGNITE_APEX Trial Update';
}

function buildEmailTemplate(org: any, reason: string): string {
  const trialEndsAt = new Date(org.trial_ends_at);
  const now = new Date();
  const daysLeft = Math.ceil((trialEndsAt.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
  const daysSinceExpiry = Math.ceil((now.getTime() - trialEndsAt.getTime()) / (24 * 60 * 60 * 1000));

  let headline = '';
  let message = '';
  let ctaText = 'View Pricing';
  let ctaUrl = 'https://shaamelz.com/pricing.html';

  if (reason.startsWith('trial_ending_')) {
    headline = daysLeft === 1
      ? '⚠️ Your trial ends tomorrow!'
      : `⏰ ${daysLeft} days left in your trial`;

    message = `
      <p>Hi there,</p>
      <p>Your <strong>99-day IGNITE_APEX CRM trial</strong> ${daysLeft === 1 ? 'ends tomorrow' : `ends in ${daysLeft} days`}.</p>
      <p>To continue using the CRM after your trial ends, subscribe to one of our plans starting at just <strong>$9/month</strong>.</p>
      <p><strong>What happens if I don't subscribe?</strong></p>
      <ul>
        <li>✅ Sales OS remains <strong>FREE</strong> forever</li>
        <li>⏳ You'll have a <strong>grace period</strong> (105-150 days) to subscribe</li>
        <li>🔒 After 150 days, CRM access will be blocked</li>
      </ul>
    `;
  } else if (reason.startsWith('grace_period_')) {
    headline = `📊 ${daysSinceExpiry} days since trial ended`;

    message = `
      <p>Hi there,</p>
      <p>Your IGNITE_APEX CRM trial ended <strong>${daysSinceExpiry} days ago</strong>.</p>
      <p>You're currently in the <strong>grace period</strong>, which means you can still access the CRM — but you'll need to subscribe to keep access beyond 150 days from trial end.</p>
      <p><strong>What you need to know:</strong></p>
      <ul>
        <li>🕐 Grace period ends at <strong>150 days</strong> post-trial</li>
        <li>🔒 After that, CRM access will be blocked</li>
        <li>✅ Sales OS remains FREE regardless</li>
        <li>💳 Plans start at <strong>$9/month</strong> (Team Mini)</li>
      </ul>
      <p>Don't lose your pipeline data — subscribe today!</p>
    `;

    if (daysSinceExpiry > 100) {
      message += `<p style="color:#EF4444;font-weight:700;">⚠️ WARNING: You have less than ${150 - daysSinceExpiry} days of access remaining!</p>`;
    }
  }

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #1E2333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #8B5CF6 0%, #3B82F6 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #F9FAFB; padding: 30px; border-radius: 0 0 8px 8px; }
    .cta { display: inline-block; background: #8B5CF6; color: white; padding: 12px 32px; text-decoration: none; border-radius: 6px; font-weight: 700; margin: 20px 0; }
    .footer { text-align: center; padding: 20px; color: #6B7280; font-size: 14px; }
    ul { padding-left: 20px; }
    li { margin: 8px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin:0;font-size:28px;">${headline}</h1>
    </div>
    <div class="content">
      ${message}
      <div style="text-align:center;">
        <a href="${ctaUrl}" class="cta">${ctaText}</a>
      </div>
      <p style="margin-top:30px;padding-top:20px;border-top:1px solid #E5E7EB;">
        Questions? Reply to this email or contact us at <a href="mailto:muhammad.shaamel@gmail.com">muhammad.shaamel@gmail.com</a>
      </p>
    </div>
    <div class="footer">
      <p>IGNITE_APEX | <a href="https://shaamelz.com">shaamelz.com</a></p>
      <p style="font-size:12px;color:#9CA3AF;">
        To stop receiving these reminders, contact your administrator or
        <a href="mailto:muhammad.shaamel@gmail.com">reach out to support</a>.
      </p>
    </div>
  </div>
</body>
</html>
  `;
}
