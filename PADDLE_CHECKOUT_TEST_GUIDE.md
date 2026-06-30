# 💳 PADDLE CHECKOUT - TEST GUIDE

**Date:** 2026-06-26  
**Vendor ID:** 80920  
**Environment:** Sandbox (for testing)

---

## ✅ **CURRENT CONFIGURATION**

### **Vendor/Seller Details:**
- **Vendor ID:** 80920
- **Environment:** Production (https://checkout.paddle.com)
- **API Version:** Billing API v2

### **Products Configured:**

**CRM Products (6):**
```javascript
'crm_team_mini_monthly': 'pro_01kvz4nkwvdajsq1xyq9vy30hk',
'crm_team_mini_yearly': 'pro_01kvz4pgjszq5x6e5x94z3e8gk',
'crm_team_midi_monthly': 'pro_01kvz4qgekwxb7kegr4tmtcgb1',
'crm_team_midi_yearly': 'pro_01kvz4r5afnp9w3n6psfn2e0jb',
'crm_team_maxi_monthly': 'pro_01kvz4s0dkb3bw6zhs76bvp9cn',
'crm_team_maxi_yearly': 'pro_01kvz4skwxdh52r1a5d7zd7dyg'
```

**B2B0 Products (6):**
```javascript
'b2b_addon_mini_monthly': 'pro_01kvz513m4e2q5ezn0r66r7dmy',
'b2b_addon_mini_yearly': 'pro_01kvz551xqzza92gg9nd2pkt6k',
'b2b_addon_midi_monthly': 'pro_01kvz579x3c4qcjchx5qykdy2h',
'b2b_addon_midi_yearly': 'pro_01kvz58krpzkde807gvq2p8xrr',
'b2b_addon_maxi_monthly': 'pro_01kvz59rfy85ehs0e3vp3ys64b',
'b2b_addon_maxi_yearly': 'pro_01kvz5aqgmvg7x9va5zz5g5era'
```

---

## 🧪 **TESTING IN SANDBOX MODE**

### **Step 1: Enable Sandbox in Code**

Currently the code uses production. To test in sandbox, temporarily update:

**File:** `checkout.html` (line ~120)

```javascript
// CHANGE THIS:
Paddle.Initialize({
  token: 'live_xxxxx', // Production token
  environment: 'production'
});

// TO THIS (for testing):
Paddle.Initialize({
  token: 'test_xxxxx', // Sandbox client-side token
  environment: 'sandbox'
});
```

**Get Sandbox Token:**
1. Login to Paddle Dashboard
2. Go to Developer Tools → Authentication
3. Copy "Client-side token" for Sandbox environment

---

### **Step 2: Test Card Numbers (Sandbox)**

**Successful Payment:**
- Card: `4242 4242 4242 4242`
- Expiry: Any future date (e.g., `12/28`)
- CVC: Any 3 digits (e.g., `123`)
- Postal Code: Any (e.g., `12345`)

**Failed Payment:**
- Card: `4000 0000 0000 0002`

**3D Secure (requires authentication):**
- Card: `4000 0000 0000 3220`

---

### **Step 3: Manual Test Flow**

1. **Create Test User:**
   ```sql
   -- In Supabase SQL Editor
   INSERT INTO organisations (id, name) VALUES 
   ('test-org-paddle', 'Paddle Test Co');

   INSERT INTO users (id, email, name, role, org_id) VALUES
   ('test-user-paddle-id', 'paddle-test@yourdomain.com', 'Paddle Tester', 'admin', 'test-org-paddle');

   INSERT INTO org_subscriptions (org_id, status, plan, crm_enabled, b2b0_enabled)
   VALUES ('test-org-paddle', 'free', 'team_mini', false, false);
   ```

2. **Navigate to Pricing Page:**
   ```
   https://shaamelz.com/pricing.html
   ```

3. **Click "Subscribe" on a Plan:**
   - Choose CRM Team Mini Monthly (or any plan)
   - Click "Subscribe Now" button

4. **Fill Checkout Form:**
   - Use test card: `4242 4242 4242 4242`
   - Email: Your email (will receive confirmation)
   - Complete checkout

5. **Verify Paddle Webhook:**
   - Check webhook endpoint received event
   - Event type: `transaction.completed` or `subscription.created`

6. **Verify Database Update:**
   ```sql
   SELECT * FROM org_subscriptions WHERE org_id = 'test-org-paddle';
   -- Should show: status = 'active', crm_enabled = true
   ```

7. **Verify User Access:**
   - Login as test user
   - Go to launcher
   - CRM card should be unlocked

---

## 🔗 **WEBHOOK CONFIGURATION**

### **Current Webhook Endpoint:**
```
https://shaamelz.com/supabase/functions/v1/paddle-webhook
```

### **Webhook Events to Subscribe:**
- `transaction.completed` - Payment successful
- `transaction.updated` - Payment status changed
- `subscription.created` - New subscription
- `subscription.updated` - Subscription changed (upgrade/downgrade)
- `subscription.canceled` - Subscription canceled
- `subscription.past_due` - Payment failed

### **Configure in Paddle Dashboard:**
1. Go to Developer Tools → Notifications
2. Add webhook endpoint URL
3. Select events listed above
4. Copy webhook secret key
5. Add to Supabase secrets:
   ```bash
   supabase secrets set PADDLE_WEBHOOK_SECRET=<your-secret>
   ```

---

## 🧾 **WEBHOOK HANDLER STATUS**

**File:** `supabase/functions/paddle-webhook/index.ts`

**Handles:**
- ✅ `transaction.completed` - Activates CRM/B2B0 based on product
- ✅ `subscription.created` - Creates subscription record
- ✅ `subscription.updated` - Updates plan/status
- ✅ `subscription.canceled` - Disables module access
- ✅ Signature verification (HMAC)

**Logic:**
```typescript
// Extract product ID from transaction
const productId = event.data.items[0].price.product_id;

// Match product to module
if (productId.startsWith('pro_01kvz4')) {
  // CRM product
  update.crm_enabled = true;
  update.plan = determinePlan(productId); // team_mini/midi/maxi
  update.status = 'active';
} else if (productId.startsWith('pro_01kvz5')) {
  // B2B0 product
  update.b2b0_enabled = true;
  update.b2b0_plan = determinePlan(productId);
  update.status = 'active';
}
```

---

## ✅ **TESTING CHECKLIST**

**Pre-Test Setup:**
- [ ] Paddle account created
- [ ] Vendor ID confirmed: 80920
- [ ] All 12 products created in Paddle
- [ ] Product IDs match `checkout.html`
- [ ] Webhook endpoint configured
- [ ] Webhook secret stored in Supabase

**Sandbox Testing:**
- [ ] Switch to sandbox mode in code
- [ ] Create test user in database
- [ ] Navigate to pricing page
- [ ] Select plan and click subscribe
- [ ] Use test card: 4242...
- [ ] Complete checkout
- [ ] Verify webhook received
- [ ] Verify database updated
- [ ] Login and verify CRM unlocked

**Production Testing:**
- [ ] Switch back to production mode
- [ ] Use REAL card (small charge)
- [ ] Complete checkout
- [ ] Verify real payment processed
- [ ] Verify subscription active
- [ ] Verify module unlocked
- [ ] Cancel subscription (test cancellation flow)

**Edge Cases:**
- [ ] Test failed payment (card declined)
- [ ] Test subscription upgrade (Mini → Midi)
- [ ] Test subscription downgrade (Maxi → Mini)
- [ ] Test subscription cancellation
- [ ] Test B2B0 purchase (independent of CRM)
- [ ] Test CRM + B2B0 together

---

## 🐛 **TROUBLESHOOTING**

**Issue: Checkout doesn't open**
- Check browser console for errors
- Verify Paddle SDK loaded: `window.Paddle`
- Check CSP headers allow Paddle domains
- Verify product ID exists

**Issue: Webhook not received**
- Check webhook URL is publicly accessible
- Verify webhook endpoint is deployed
- Check Paddle dashboard → Developer Tools → Event Logs
- Verify CORS headers

**Issue: Database not updated after payment**
- Check webhook handler logs (Supabase Functions → Logs)
- Verify webhook secret matches
- Check for errors in webhook handler
- Manually test webhook with curl

**Issue: Module not unlocked after payment**
- Check `org_subscriptions` table - is `crm_enabled` true?
- Check product ID mapping in webhook handler
- Clear browser cache and re-login
- Check launcher entitlement logic

---

## 📊 **MONITORING**

**Paddle Dashboard:**
- Transactions → View all payments
- Subscriptions → Active subscriptions
- Event Logs → Webhook deliveries

**Supabase:**
- Functions → paddle-webhook → Logs
- Database → org_subscriptions → Monitor updates

**User Feedback:**
- Email confirmations (Paddle sends automatically)
- In-app success messages
- Subscription status in profile

---

## ✅ **DEPLOYMENT STATUS**

**Code:**
- ✅ `checkout.html` - Paddle integration complete
- ✅ `pricing.html` - Links to checkout with product IDs
- ✅ `supabase/functions/paddle-webhook/index.ts` - Webhook handler deployed
- ✅ CSP headers configured (netlify.toml)

**Configuration:**
- ✅ Vendor ID: 80920
- ✅ 12 products configured
- ⏳ Webhook endpoint needs to be added to Paddle dashboard
- ⏳ Webhook secret needs to be stored in Supabase

**Next Steps:**
1. Add webhook endpoint to Paddle dashboard
2. Store webhook secret in Supabase secrets
3. Test in sandbox mode
4. Test in production with real payment
5. Monitor for 24 hours

---

**Status:** Code complete. Awaiting webhook configuration and testing.
