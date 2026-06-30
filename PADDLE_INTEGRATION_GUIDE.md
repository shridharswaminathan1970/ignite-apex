# Paddle Integration Guide

**Status:** Ready to integrate (waiting for Paddle account signup)  
**Date:** 2026-06-25

---

## Step 1: Sign Up for Paddle

1. Go to https://vendors.paddle.com
2. Create account
3. Complete vendor verification (may take 1-2 days)
4. Get approved for production

---

## Step 2: Create Products in Paddle Dashboard

You need to create **12 products** (3 tiers × 2 billing cycles × 2 variants):

### Base CRM Plans

| Product Name | Type | Price | Billing | Product ID Variable |
|-------------|------|-------|---------|---------------------|
| IGNITE_APEX CRM - Team Mini | Subscription | $9.00 | Monthly | `MINI_MONTHLY` |
| IGNITE_APEX CRM - Team Mini | Subscription | $100.00 | Yearly | `MINI_YEARLY` |
| IGNITE_APEX CRM - Team Midi | Subscription | $18.00 | Monthly | `MIDI_MONTHLY` |
| IGNITE_APEX CRM - Team Midi | Subscription | $195.00 | Yearly | `MIDI_YEARLY` |
| IGNITE_APEX CRM - Team Maxi | Subscription | $30.00 | Monthly | `MAXI_MONTHLY` |
| IGNITE_APEX CRM - Team Maxi | Subscription | $320.00 | Yearly | `MAXI_YEARLY` |

### B2B Outreach Add-on (can be purchased WITH a base plan)

| Product Name | Type | Price | Billing | Product ID Variable |
|-------------|------|-------|---------|---------------------|
| B2B Outreach Add-on - Mini | Subscription | +$6.00 | Monthly | `B2B_MINI_MONTHLY` |
| B2B Outreach Add-on - Mini | Subscription | +$60.00 | Yearly | `B2B_MINI_YEARLY` |
| B2B Outreach Add-on - Midi | Subscription | +$9.00 | Monthly | `B2B_MIDI_MONTHLY` |
| B2B Outreach Add-on - Midi | Subscription | +$90.00 | Yearly | `B2B_MIDI_YEARLY` |
| B2B Outreach Add-on - Maxi | Subscription | +$12.00 | Monthly | `B2B_MAXI_MONTHLY` |
| B2B Outreach Add-on - Maxi | Subscription | +$120.00 | Yearly | `B2B_MAXI_YEARLY` |

**Product Configuration:**
- Trial period: 99 days (set in Paddle)
- Billing cycle: Monthly or Yearly
- Currency: USD
- Tax handling: Auto-tax enabled

---

## Step 3: Get Your Credentials

After creating products, you'll need:

1. **Vendor ID** (from Settings → Developer Tools)
2. **Client-side Token** (for Paddle.js checkout)
3. **Product IDs** (from each product page)
4. **Webhook Secret** (from Notifications → Webhooks)

---

## Step 4: Update Environment Variables

### In Supabase (for Edge Functions)

```bash
# Run these commands in terminal:
supabase secrets set PADDLE_WEBHOOK_SECRET=your_webhook_secret_here
```

### In Netlify (for frontend)

Go to Netlify Dashboard → Site Settings → Environment Variables:

```
VITE_PADDLE_VENDOR_ID=your_vendor_id
VITE_PADDLE_CLIENT_TOKEN=your_client_token

# Product IDs
VITE_PADDLE_MINI_MONTHLY=pri_xxxxx
VITE_PADDLE_MINI_YEARLY=pri_xxxxx
VITE_PADDLE_MIDI_MONTHLY=pri_xxxxx
VITE_PADDLE_MIDI_YEARLY=pri_xxxxx
VITE_PADDLE_MAXI_MONTHLY=pri_xxxxx
VITE_PADDLE_MAXI_YEARLY=pri_xxxxx

# B2B Add-on Product IDs
VITE_PADDLE_B2B_MINI_MONTHLY=pri_xxxxx
VITE_PADDLE_B2B_MINI_YEARLY=pri_xxxxx
VITE_PADDLE_B2B_MIDI_MONTHLY=pri_xxxxx
VITE_PADDLE_B2B_MIDI_YEARLY=pri_xxxxx
VITE_PADDLE_B2B_MAXI_MONTHLY=pri_xxxxx
VITE_PADDLE_B2B_MAXI_YEARLY=pri_xxxxx
```

---

## Step 5: Update checkout.html

Replace the placeholder product IDs in `checkout.html`:

```javascript
// OLD (placeholders):
const PADDLE_PRODUCTS = {
  team_mini: { monthly: 'prod_team_mini_monthly', yearly: 'prod_team_mini_yearly' },
  // ...
};

// NEW (actual Paddle product IDs):
const PADDLE_PRODUCTS = {
  team_mini: { monthly: 'pri_01ABC123...', yearly: 'pri_01DEF456...' },
  team_midi: { monthly: 'pri_01GHI789...', yearly: 'pri_01JKL012...' },
  team_maxi: { monthly: 'pri_01MNO345...', yearly: 'pri_01PQR678...' },
};

const PADDLE_B2B_ADDON = {
  team_mini: { monthly: 'pri_01STU901...', yearly: 'pri_01VWX234...' },
  team_midi: { monthly: 'pri_01YZA567...', yearly: 'pri_01BCD890...' },
  team_maxi: { monthly: 'pri_01EFG123...', yearly: 'pri_01HIJ456...' },
};
```

---

## Step 6: Update Paddle Webhook Handler

In `supabase/functions/paddle-webhook/index.ts`, update the PRODUCT_MAP:

```typescript
const PRODUCT_MAP: Record<string, { plan: string; billing: string; addon?: boolean }> = {
  // Replace with actual Paddle product IDs
  'pri_01ABC123...': { plan: 'team_mini', billing: 'monthly' },
  'pri_01DEF456...': { plan: 'team_mini', billing: 'yearly' },
  'pri_01GHI789...': { plan: 'team_midi', billing: 'monthly' },
  'pri_01JKL012...': { plan: 'team_midi', billing: 'yearly' },
  'pri_01MNO345...': { plan: 'team_maxi', billing: 'monthly' },
  'pri_01PQR678...': { plan: 'team_maxi', billing: 'yearly' },

  // B2B Addon
  'pri_01STU901...': { plan: 'addon', billing: 'monthly', addon: true },
  'pri_01VWX234...': { plan: 'addon', billing: 'yearly', addon: true },
  // ... (all 6 B2B variants)
};
```

---

## Step 7: Set Up Webhook in Paddle

1. Go to Paddle Dashboard → Developer Tools → Notifications
2. Click "Add Endpoint"
3. **Webhook URL:** `https://gokslnrvxqledagcwghq.supabase.co/functions/v1/paddle-webhook`
4. **Events to subscribe:**
   - `subscription.created`
   - `subscription.activated`
   - `subscription.updated`
   - `subscription.paused`
   - `subscription.canceled`
   - `subscription.past_due`
   - `transaction.completed`
5. Save webhook
6. Copy the **Webhook Secret** and add to Supabase secrets

---

## Step 8: Deploy Edge Functions

```bash
# Deploy AI Coaching
supabase functions deploy ai-coaching

# Deploy Trial Reminders
supabase functions deploy send-trial-reminders

# Deploy Paddle Webhook
supabase functions deploy paddle-webhook

# Set up cron for trial reminders (every 20 minutes)
# In Supabase Dashboard → Database → Cron Jobs:
# Function: send-trial-reminders
# Schedule: */20 * * * * (every 20 minutes)
```

---

## Step 9: Test the Integration

### Test Checkout Flow

1. Go to https://shaamelz.com/pricing.html
2. Click "Start 99-Day Trial" on Team Mini
3. Should redirect to checkout.html
4. Fill out payment details (use Paddle test card in sandbox mode)
5. Complete checkout
6. Verify:
   - User's `org_subscriptions` record updated with `status='active'`
   - `paddle_subscription_id` and `paddle_customer_id` populated
   - `b2b_outreach_addon` set correctly if addon selected

### Test Webhook Events

1. In Paddle Dashboard → Developer Tools → Event Logs
2. Trigger test events:
   - `subscription.created`
   - `transaction.completed`
3. Check Supabase Edge Function logs
4. Verify subscription status updated correctly

### Test Trial Reminder Emails

1. Manually trigger the function:
   ```bash
   curl -X POST https://gokslnrvxqledagcwghq.supabase.co/functions/v1/send-trial-reminders \
     -H "Authorization: Bearer YOUR_ANON_KEY"
   ```
2. Check email delivery (need Resend API key)
3. Verify emails sent at correct milestones

---

## Step 10: Switch from Sandbox to Production

1. In Paddle Dashboard, switch from "Sandbox" to "Live" mode
2. Re-create all 12 products in LIVE mode
3. Update product IDs in code (checkout.html and paddle-webhook)
4. Update webhook URL to production
5. Test one real transaction (small amount)
6. Monitor for 24 hours
7. Go live!

---

## Checklist

- [ ] Sign up for Paddle account
- [ ] Get vendor verification approved
- [ ] Create 12 products (6 base + 6 addon)
- [ ] Get Vendor ID, Client Token, Product IDs, Webhook Secret
- [ ] Update Supabase secrets
- [ ] Update Netlify environment variables
- [ ] Update checkout.html with real product IDs
- [ ] Update paddle-webhook/index.ts with real product IDs
- [ ] Set up webhook endpoint in Paddle
- [ ] Deploy all 3 Edge Functions
- [ ] Set up cron job for trial reminders
- [ ] Test checkout flow in sandbox
- [ ] Test webhook events
- [ ] Test email reminders
- [ ] Switch to production mode
- [ ] Final live test
- [ ] Monitor for 24 hours
- [ ] Launch! 🚀

---

## Pricing Summary

| Plan | Monthly | Yearly | Users | B2B Add-on (Monthly) | B2B Add-on (Yearly) |
|------|---------|--------|-------|---------------------|---------------------|
| Team Mini | $9 | $100 | 3 | +$6 | +$60 |
| Team Midi | $18 | $195 | 10 | +$9 | +$90 |
| Team Maxi | $30 | $320 | 50 | +$12 | +$120 |

**Example:** Team Midi + B2B (Monthly) = $18 + $9 = **$27/month**

---

## Support

Questions? Contact:
- muhammad.shaamel@gmail.com
- muhammad.shaamel@shaamelz.com

Paddle Support: https://www.paddle.com/support
