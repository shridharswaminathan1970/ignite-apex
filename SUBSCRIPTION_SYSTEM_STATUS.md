# Subscription System Implementation Status

## ✅ COMPLETED (Phases A-E Partial)

### Phase A-D: IGNITE-APEX Qualification Roadmap (100% DONE)
- ✅ Roadmap Rail component with 8 stages
- ✅ Why-Layer for every gate
- ✅ Guiding Questions + Peel the Onion
- ✅ Strong vs Weak examples
- ✅ Structured capture (text + checkbox)
- ✅ AI Coaching via Supabase Edge Function
- ✅ Anthropic API key configured
- **Live at:** `/crm/pipeline.html` → click deal → Qualification tab

### Phase E: Subscription System (Partial - 40% DONE)

#### ✅ Database Schema (`023_subscription_system.sql`)
- Tables: `org_subscriptions`, `payment_transactions`, `subscription_reminders`
- Functions:
  - `initialize_crm_trial(org_uuid)` - Start 99-day trial
  - `can_access_crm(user_id)` - Check access permissions
  - `track_crm_login(user_id)` - Track login counter
- Enums: `subscription_plan`, `subscription_status`, `payment_method`

#### ✅ Pricing Page (`pricing.html`)
- Team Mini: $9/mo or $100/yr (≤3 users)
- Team Midi: $15/mo or $195/yr (4-10 users) - MOST POPULAR
- Team Maxi: $30/mo or $320/yr (11-50 users)
- B2B Outreach Add-on:
  - Mini: +$6/mo or $160/yr
  - Midi: +$9/mo or $250/yr
  - Maxi: +$12/mo or $500/yr
- **Live at:** https://shaamelz.com/pricing.html

---

## 🚧 REMAINING WORK (Phase E - 60%)

### Task #22: Trial Countdown Logic
**What:** Show trial status in CRM UI

**Implementation:**
1. Create `components/trial-banner.js`:
   - Call `can_access_crm(user_id)` on CRM page load
   - If `days_remaining < 10`, show countdown banner
   - If `status = 'trial_expired_grace'`, show upgrade prompt
   - If `status = 'trial_expired_blocked'`, block login with modal

2. Add banner to `/crm/index.html`, `/crm/pipeline.html`, etc.:
```html
<div id="trial-banner-container"></div>
<script src="../components/trial-banner.js"></script>
```

3. Banner styles:
   - Green if >30 days left
   - Amber if 10-30 days
   - Red if <10 days or expired

---

### Task #24: Paddle Integration
**What:** Connect Paddle payment gateway

**Steps:**
1. **Sign up:** https://vendors.paddle.com/signup
2. **Get credentials:**
   - Vendor ID
   - Client-side token
   - Webhook secret

3. **Create products in Paddle:**
   - Team Mini Monthly ($9)
   - Team Mini Yearly ($100)
   - Team Midi Monthly ($15)
   - Team Midi Yearly ($195)
   - Team Maxi Monthly ($30)
   - Team Maxi Yearly ($320)
   - Copy product IDs

4. **Create `checkout.html`:**
```javascript
Paddle.Setup({ vendor: YOUR_VENDOR_ID });
Paddle.Checkout.open({
  product: PRODUCT_ID,
  email: user.email,
  successCallback: (data) => {
    // Call Supabase function to activate subscription
    activateSubscription(data.checkout.id);
  }
});
```

5. **Create Supabase Edge Function: `activate-subscription`**
   - Verify Paddle webhook signature
   - Update `org_subscriptions` table
   - Set `status = 'active'`, `subscription_started_at = now()`

6. **Set up Paddle webhook:**
   - Webhook URL: `https://gokslnrvxqledagcwghq.supabase.co/functions/v1/paddle-webhook`
   - Events: `subscription.created`, `subscription.updated`, `subscription.canceled`, `payment.succeeded`, `payment.failed`

---

### Task #25: Manual Invoicing System
**What:** Generate PDF invoices for customers who want to pay manually

**Implementation:**
1. Create `/crm/admin/invoices.html`:
   - Admin-only page
   - Form: Customer name, plan, billing cycle, amount
   - Button: "Generate Invoice PDF"

2. Use library like `jsPDF`:
```javascript
import { jsPDF } from "jspdf";

function generateInvoice(customer, plan, amount) {
  const doc = new jsPDF();
  doc.text(`INVOICE #${Date.now()}`, 10, 10);
  doc.text(`Customer: ${customer.name}`, 10, 20);
  doc.text(`Plan: ${plan}`, 10, 30);
  doc.text(`Amount: $${amount}`, 10, 40);
  doc.text(`Payment Details:`, 10, 50);
  doc.text(`Bank: [Your Bank]`, 10, 60);
  doc.text(`Account: [Your Account]`, 10, 70);
  doc.save(`invoice_${customer.name}.pdf`);
}
```

3. Store invoice in `payment_transactions` table:
   - `status = 'pending'`
   - `invoice_pdf_url` (if uploaded to storage)
   - `invoice_due_date = now() + 30 days`

4. Email invoice to customer using Resend API (key already in `.env`)

---

### Task #26: CRM Access Gates
**What:** Block CRM access after 150 days if unpaid

**Implementation:**
1. Update `/crm/index.html` (and all CRM pages) initialization:
```javascript
document.addEventListener('DOMContentLoaded', async () => {
  const { data: { session } } = await supabaseClient.auth.getSession();
  if (!session) {
    window.location.href = '../app/auth.html';
    return;
  }

  // Check CRM access
  const { data: access } = await supabaseClient.rpc('can_access_crm', { 
    user_id: session.user.id 
  });

  if (!access.allowed) {
    if (access.status === 'trial_expired_blocked') {
      showExpiredModal();
      return; // Block page load
    } else {
      showUpgradePrompt(access);
    }
  }

  // Track login
  await supabaseClient.rpc('track_crm_login', { user_id: session.user.id });

  // Continue normal page load
  loadPage();
});
```

2. Create `showExpiredModal()`:
```javascript
function showExpiredModal() {
  document.body.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:center;min-height:100vh;background:#08090D;padding:2rem">
      <div style="background:#0F1117;border:2px solid #EF4444;border-radius:12px;padding:3rem;max-width:500px;text-align:center">
        <div style="font-size:3rem;margin-bottom:1rem">🔒</div>
        <h1 style="color:#EF4444;font-size:1.5rem;margin-bottom:1rem">Trial Expired</h1>
        <p style="color:#8892AA;margin-bottom:2rem">Your 150-day trial has ended. Please subscribe to continue using the CRM.</p>
        <a href="mailto:[Contact Administrator button]?subject=Subscription Request" style="background:#F59E0B;color:#000;padding:1rem 2rem;border-radius:8px;text-decoration:none;font-weight:700;display:inline-block">Contact Admin</a>
      </div>
    </div>
  `;
}
```

---

### Task #27: Reminder System
**What:** Email + in-app reminders after trial expires

**Implementation:**
1. **In-App Reminders:**
   - After day 105, check login count: `if (login_count_since_trial_end % 5 === 0)`
   - Show modal: "Your trial expired X days ago. Subscribe now!"
   - Dismiss button saves: `INSERT INTO subscription_reminders (reminder_type, sent_via, action_taken) VALUES ('trial_ended', 'in_app', 'dismissed')`

2. **Email Reminders (every 20 min during grace period):**
   - Create Supabase Edge Function: `send-subscription-reminders`
   - Runs on cron: every 20 minutes
   - Query: `SELECT * FROM org_subscriptions WHERE status='trial' AND trial_ends_at < now() AND last_reminder_sent_at < now() - INTERVAL '20 minutes'`
   - For each org:
     - Get admin emails: `SELECT email FROM users WHERE org_id=X AND role IN ('admin', 'super_admin')`
     - Send email via Resend API:
```javascript
await fetch('https://api.resend.com/emails', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${RESEND_API_KEY}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    from: 'IGNITE_APEX <noreply@shaamelz.com>',
    to: adminEmails,
    subject: 'Your IGNITE_APEX CRM Trial Has Expired',
    html: `<p>Your 99-day trial expired ${daysAgo} days ago. Subscribe now to continue using the CRM.</p><a href="https://shaamelz.com/pricing.html">View Pricing</a>`
  })
});
```
   - Update `last_reminder_sent_at = now()`, `reminder_count++`
   - Log in `subscription_reminders` table

3. **Cron setup:**
```bash
supabase functions deploy send-subscription-reminders
supabase edge-functions cron create send-subscription-reminders --schedule "*/20 * * * *"
```

---

## 📋 DEPLOYMENT CHECKLIST

### Before Going Live:
- [ ] Set up Paddle account (https://vendors.paddle.com/signup)
- [ ] Create products in Paddle dashboard
- [ ] Add Paddle credentials to `.env`:
  ```
  PADDLE_VENDOR_ID=your-vendor-id
  PADDLE_CLIENT_TOKEN=your-client-token
  PADDLE_WEBHOOK_SECRET=your-webhook-secret
  ```
- [ ] Set Paddle secrets in Supabase:
  ```bash
  supabase secrets set PADDLE_VENDOR_ID=xxx
  supabase secrets set PADDLE_WEBHOOK_SECRET=xxx
  ```
- [ ] Deploy remaining Edge Functions:
  ```bash
  supabase functions deploy activate-subscription
  supabase functions deploy send-subscription-reminders
  supabase functions deploy paddle-webhook
  ```
- [ ] Set up Paddle webhook URL in Paddle dashboard
- [ ] Test checkout flow end-to-end (Paddle sandbox mode)
- [ ] Test trial expiration logic (manually update `trial_ends_at` in database)
- [ ] Test email reminders (Resend API)
- [ ] Switch Paddle from sandbox to live mode

---

## 🎯 QUICK WINS (Optional Enhancements)

1. **Usage Analytics:**
   - Track which features users use most
   - Show in admin dashboard
   - Helps understand what drives conversions

2. **Upgrade Prompts:**
   - "You're at 2/3 users - upgrade to Midi for more seats"
   - Show when user count approaches limit

3. **Referral Program:**
   - Give 1 month free for each referral
   - Track via `referral_code` in URL

4. **Annual Plan Discount:**
   - Offer 2 months free on annual plans (already priced in!)

5. **Cancellation Survey:**
   - Ask why they're canceling
   - Offer discount to retain

---

## 📂 FILES CREATED/MODIFIED

### New Files:
- `supabase/migrations/023_subscription_system.sql`
- `pricing.html`
- `crm/qualification-roadmap.js`
- `supabase/migrations/022_gate_answer_notes.sql`
- `supabase/functions/ai-coaching/index.ts`
- `.env` (with Anthropic API key)

### Modified Files:
- `crm/opportunity.html` (integrated roadmap)
- `.gitignore` (added `.env`)
- `components/user-menu.js` (added Reports link)

### Files to Create:
- `checkout.html`
- `components/trial-banner.js`
- `supabase/functions/activate-subscription/index.ts`
- `supabase/functions/send-subscription-reminders/index.ts`
- `supabase/functions/paddle-webhook/index.ts`
- `crm/admin/invoices.html`

---

## 🔗 USEFUL LINKS

- **Paddle Docs:** https://developer.paddle.com/
- **Paddle Dashboard:** https://vendors.paddle.com/
- **Resend Docs:** https://resend.com/docs
- **Supabase Edge Functions:** https://supabase.com/docs/guides/functions
- **jsPDF (invoice generation):** https://github.com/parallax/jsPDF

---

## 💡 NOTES

- **Sales OS is always free** - no payment required, no trial
- **CRM starts 99-day trial** on first access (auto-tracked via `initialize_crm_trial()`)
- **Grace period:** Days 105-150 show reminders but allow access
- **Hard block:** After day 150, login button disabled with "Contact Admin" modal
- **Reminder cadence:** Every 5th login + email every 20 min (during grace period only)
- **Tax handling:** Paddle handles all VAT/sales tax globally (we don't touch it)
- **Pricing is final** - no changes needed, already matches requirements exactly

---

**Current Status:** Pricing page live, database ready, core functions deployed. Remaining work: UI integration (trial banner, access gates, checkout), Paddle setup, email automation.

**Estimated Time to Complete:** 6-8 hours for a developer familiar with Paddle + Supabase Edge Functions.
