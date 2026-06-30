// Paddle Webhook Handler
// Listens for Paddle payment events and activates subscriptions

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { createHmac } from 'https://deno.land/std@0.168.0/node/crypto.ts';

const PADDLE_WEBHOOK_SECRET = Deno.env.get('PADDLE_WEBHOOK_SECRET');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

// Paddle product ID mapping - Live products from Paddle dashboard
const PRODUCT_MAP: Record<string, { plan: string; billing: string; module: 'crm' | 'b2b0' }> = {
  // CRM Plans
  'pro_01kvz45gjxznc53m7g7fpfmrtn': { plan: 'team_mini', billing: 'monthly', module: 'crm' },
  'pro_01kvz4r9wnq4fwrekw2n4tmw9q': { plan: 'team_mini', billing: 'yearly', module: 'crm' },
  'pro_01kvz4wa3zbdkp65jmnm8d57my': { plan: 'team_midi', billing: 'monthly', module: 'crm' },
  'pro_01kvz4xg9yjh1tm8vsreh45pgv': { plan: 'team_midi', billing: 'yearly', module: 'crm' },
  'pro_01kvz4yh7nphwp914t2yqgcmhm': { plan: 'team_maxi', billing: 'monthly', module: 'crm' },
  'pro_01kvz4zea83smzwg0xn0bt1jd1': { plan: 'team_maxi', billing: 'yearly', module: 'crm' },

  // B2B0 Plans (independent of CRM)
  'pro_01kvz513m4e2q5ezn0r66r7dmy': { plan: 'mini', billing: 'monthly', module: 'b2b0' },
  'pro_01kvz551xqzza92gg9nd2pkt6k': { plan: 'mini', billing: 'yearly', module: 'b2b0' },
  'pro_01kvz579x3c4qcjchx5qykdy2h': { plan: 'midi', billing: 'monthly', module: 'b2b0' },
  'pro_01kvz58krpzkde807gvq2p8xrr': { plan: 'midi', billing: 'yearly', module: 'b2b0' },
  'pro_01kvz59rfy85ehs0e3vp3ys64b': { plan: 'maxi', billing: 'monthly', module: 'b2b0' },
  'pro_01kvz5aqgmvg7x9va5zz5g5era': { plan: 'maxi', billing: 'yearly', module: 'b2b0' },
};

const PLAN_USER_LIMITS: Record<string, number> = {
  team_mini: 3,
  team_midi: 10,
  team_maxi: 50,
};

const B2B0_SEAT_LIMITS: Record<string, number> = {
  mini: 5,
  midi: 15,
  maxi: 50,
};

serve(async (req) => {
  try {
    if (req.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    const body = await req.text();
    const signature = req.headers.get('paddle-signature');

    // Verify webhook signature (security)
    if (PADDLE_WEBHOOK_SECRET && signature) {
      const isValid = verifyPaddleSignature(body, signature, PADDLE_WEBHOOK_SECRET);
      if (!isValid) {
        console.error('[Paddle Webhook] Invalid signature');
        return new Response('Invalid signature', { status: 401 });
      }
    }

    const event = JSON.parse(body);
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    console.log('[Paddle Webhook] Event received:', event.event_type);

    // Handle different event types
    switch (event.event_type) {
      case 'subscription.created':
      case 'subscription.activated':
        await handleSubscriptionActivated(supabase, event);
        break;

      case 'subscription.updated':
        await handleSubscriptionUpdated(supabase, event);
        break;

      case 'subscription.paused':
        await handleSubscriptionPaused(supabase, event);
        break;

      case 'subscription.canceled':
      case 'subscription.past_due':
        await handleSubscriptionCanceled(supabase, event);
        break;

      case 'transaction.completed':
        await handleTransactionCompleted(supabase, event);
        break;

      default:
        console.log('[Paddle Webhook] Unhandled event type:', event.event_type);
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[Paddle Webhook] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
});

function verifyPaddleSignature(body: string, signature: string, secret: string): boolean {
  try {
    const hmac = createHmac('sha256', secret);
    hmac.update(body);
    const digest = hmac.digest('hex');
    return digest === signature;
  } catch (error) {
    console.error('[Paddle] Signature verification error:', error);
    return false;
  }
}

async function handleSubscriptionActivated(supabase: any, event: any) {
  const { data, custom_data } = event;
  const orgId = custom_data?.org_id;

  if (!orgId) {
    console.error('[Paddle] No org_id in custom_data');
    return;
  }

  // Parse product IDs - check if CRM or B2B0
  const items = data.items || [];
  const now = new Date();
  const nextBillingDate = data.next_billed_at ? new Date(data.next_billed_at) : null;

  let crmPlan = null;
  let crmBilling = null;
  let b2b0Plan = null;
  let b2b0Billing = null;

  for (const item of items) {
    const productInfo = PRODUCT_MAP[item.price.product_id];
    if (productInfo) {
      if (productInfo.module === 'crm') {
        crmPlan = productInfo.plan;
        crmBilling = productInfo.billing;
      } else if (productInfo.module === 'b2b0') {
        b2b0Plan = productInfo.plan;
        b2b0Billing = productInfo.billing;
      }
    }
  }

  // Build update object (only update fields for purchased modules)
  const updateData: any = {
    org_id: orgId,
    status: 'active',
    paddle_subscription_id: data.id,
    paddle_customer_id: data.customer_id,
    next_billing_date: nextBillingDate?.toISOString(),
    updated_at: now.toISOString(),
  };

  // CRM module purchased
  if (crmPlan) {
    updateData.crm_enabled = true;
    updateData.plan = crmPlan;
    updateData.billing_cycle = crmBilling;
    updateData.max_users = PLAN_USER_LIMITS[crmPlan] || 3;
    updateData.subscription_started_at = now.toISOString();
    updateData.trial_ends_at = null; // Clear trial
  }

  // B2B0 module purchased (independent)
  if (b2b0Plan) {
    updateData.b2b0_enabled = true;
    updateData.b2b0_plan = b2b0Plan;
    updateData.b2b0_seats = B2B0_SEAT_LIMITS[b2b0Plan] || 5;
    updateData.b2b0_subscription_started_at = now.toISOString();
    updateData.b2b0_trial_ends_at = null; // Clear B2B0 trial
  }

  // Upsert subscription
  const { error } = await supabase
    .from('org_subscriptions')
    .upsert(updateData)
    .eq('org_id', orgId);

  if (error) {
    console.error('[Paddle] Error updating subscription:', error);
  } else {
    console.log(`[Paddle] Activated for org ${orgId}: CRM=${crmPlan||'none'}, B2B0=${b2b0Plan||'none'}`);
  }
}

async function handleSubscriptionUpdated(supabase: any, event: any) {
  const { data } = event;
  const subscriptionId = data.id;

  const { data: sub, error: findError } = await supabase
    .from('org_subscriptions')
    .select('org_id')
    .eq('paddle_subscription_id', subscriptionId)
    .single();

  if (findError || !sub) {
    console.error('[Paddle] Subscription not found:', subscriptionId);
    return;
  }

  const items = data.items || [];
  let plan = 'team_mini';
  let billing = 'monthly';
  let b2bAddon = false;

  for (const item of items) {
    const productInfo = PRODUCT_MAP[item.price.product_id];
    if (productInfo) {
      if (productInfo.addon) {
        b2bAddon = true;
      } else {
        plan = productInfo.plan;
        billing = productInfo.billing;
      }
    }
  }

  const nextBillingDate = data.next_billed_at ? new Date(data.next_billed_at) : null;

  await supabase
    .from('org_subscriptions')
    .update({
      plan,
      billing_cycle: billing,
      b2b_outreach_addon: b2bAddon,
      max_users: PLAN_USER_LIMITS[plan] || 3,
      next_billing_date: nextBillingDate?.toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('org_id', sub.org_id);

  console.log(`[Paddle] Updated subscription for org ${sub.org_id}`);
}

async function handleSubscriptionPaused(supabase: any, event: any) {
  const { data } = event;
  const subscriptionId = data.id;

  const { data: sub } = await supabase
    .from('org_subscriptions')
    .select('org_id')
    .eq('paddle_subscription_id', subscriptionId)
    .single();

  if (sub) {
    await supabase
      .from('org_subscriptions')
      .update({
        status: 'past_due',
        updated_at: new Date().toISOString(),
      })
      .eq('org_id', sub.org_id);

    console.log(`[Paddle] Paused subscription for org ${sub.org_id}`);
  }
}

async function handleSubscriptionCanceled(supabase: any, event: any) {
  const { data } = event;
  const subscriptionId = data.id;

  const { data: sub } = await supabase
    .from('org_subscriptions')
    .select('org_id')
    .eq('paddle_subscription_id', subscriptionId)
    .single();

  if (sub) {
    const status = event.event_type === 'subscription.past_due' ? 'past_due' : 'cancelled';

    await supabase
      .from('org_subscriptions')
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('org_id', sub.org_id);

    console.log(`[Paddle] ${status} subscription for org ${sub.org_id}`);
  }
}

async function handleTransactionCompleted(supabase: any, event: any) {
  const { data, custom_data } = event;
  const orgId = custom_data?.org_id;

  if (!orgId) return;

  await supabase.from('payment_transactions').insert({
    org_id: orgId,
    paddle_transaction_id: data.id,
    amount: parseFloat(data.details.totals.total) / 100,
    currency: data.currency_code,
    status: 'completed',
    payment_method: data.payment_method_type || 'card',
    transaction_date: new Date().toISOString(),
  });

  console.log(`[Paddle] Logged transaction for org ${orgId}: ${data.currency_code} ${data.details.totals.total / 100}`);
}
