# 🎯 Paddle Integration - Next Steps

**Your Status:** Paddle account created ✅  
**Date:** 2026-06-25

---

## 📋 What You Need to Do in Paddle Dashboard

### Step 1: Create 12 Products (20 minutes)

Go to: Paddle Dashboard → Catalog → Products

**Create these 12 products:**

#### Base CRM Plans (6 products)

1. **IGNITE_APEX CRM - Team Mini (Monthly)**
   - Type: Subscription
   - Billing: Monthly
   - Price: $9.00 USD
   - Trial: 99 days
   - Description: "3 users, full CRM access, IGNITE-APEX qualification"

2. **IGNITE_APEX CRM - Team Mini (Yearly)**
   - Type: Subscription
   - Billing: Yearly
   - Price: $100.00 USD
   - Trial: 99 days
   - Description: "3 users, full CRM access, IGNITE-APEX qualification (save $8/year)"

3. **IGNITE_APEX CRM - Team Midi (Monthly)**
   - Type: Subscription
   - Billing: Monthly
   - Price: $18.00 USD
   - Trial: 99 days
   - Description: "10 users, full CRM access, IGNITE-APEX qualification"

4. **IGNITE_APEX CRM - Team Midi (Yearly)**
   - Type: Subscription
   - Billing: Yearly
   - Price: $195.00 USD
   - Trial: 99 days
   - Description: "10 users, full CRM access (save $21/year)"

5. **IGNITE_APEX CRM - Team Maxi (Monthly)**
   - Type: Subscription
   - Billing: Monthly
   - Price: $30.00 USD
   - Trial: 99 days
   - Description: "50 users, full CRM access, IGNITE-APEX qualification"

6. **IGNITE_APEX CRM - Team Maxi (Yearly)**
   - Type: Subscription
   - Billing: Yearly
   - Price: $320.00 USD
   - Trial: 99 days
   - Description: "50 users, full CRM access (save $40/year)"

#### B2B Outreach Add-on (6 products)

7. **B2B Outreach Add-on - Mini (Monthly)**
   - Type: Subscription (add-on)
   - Billing: Monthly
   - Price: $6.00 USD
   - Trial: 7 days ✅ (NEW: 1-week trial)
   - Description: "AI-powered outreach automation (requires CRM subscription)"

8. **B2B Outreach Add-on - Mini (Yearly)**
   - Type: Subscription (add-on)
   - Billing: Yearly
   - Price: $60.00 USD
   - Trial: 7 days
   - Description: "AI-powered outreach automation (save $12/year)"

9. **B2B Outreach Add-on - Midi (Monthly)**
   - Type: Subscription (add-on)
   - Billing: Monthly
   - Price: $9.00 USD
   - Trial: 7 days
   - Description: "AI-powered outreach automation (requires CRM subscription)"

10. **B2B Outreach Add-on - Midi (Yearly)**
    - Type: Subscription (add-on)
    - Billing: Yearly
    - Price: $90.00 USD
    - Trial: 7 days
    - Description: "AI-powered outreach automation (save $18/year)"

11. **B2B Outreach Add-on - Maxi (Monthly)**
    - Type: Subscription (add-on)
    - Billing: Monthly
    - Price: $12.00 USD
    - Trial: 7 days
    - Description: "AI-powered outreach automation (requires CRM subscription)"

12. **B2B Outreach Add-on - Maxi (Yearly)**
    - Type: Subscription (add-on)
    - Billing: Yearly
    - Price: $120.00 USD
    - Trial: 7 days
    - Description: "AI-powered outreach automation (save $24/year)"

---

### Step 2: Get Credentials (5 minutes)

After creating products, go to:

**Paddle Dashboard → Developer Tools → Authentication**

Copy these 3 values:

1. **Vendor ID** (or Client-side Token)
   - Example: `12345`
   - Needed for: Frontend checkout

2. **API Key** (Server-side)
   - Example: `live_xxx...`
   - Needed for: Backend API calls

3. **Webhook Secret**
   - Paddle Dashboard → Developer Tools → Notifications → Webhook Settings
   - Copy the webhook secret
   - Needed for: Verifying webhook signatures

---

### Step 3: Get Product IDs (5 minutes)

For each of the 12 products you created:

1. Click product name
2. Copy the **Product ID** (looks like: `pri_01ABC123...`)
3. Note which product it is

**Create this mapping:**

```
Team Mini Monthly: pri_01ABC123...
Team Mini Yearly: pri_01DEF456...
Team Midi Monthly: pri_01GHI789...
Team Midi Yearly: pri_01JKL012...
Team Maxi Monthly: pri_01MNO345...
Team Maxi Yearly: pri_01PQR678...

B2B Mini Monthly: pri_01STU901...
B2B Mini Yearly: pri_01VWX234...
B2B Midi Monthly: pri_01YZA567...
B2B Midi Yearly: pri_01BCD890...
B2B Maxi Monthly: pri_01EFG123...
B2B Maxi Yearly: pri_01HIJ456...
```

---

### Step 4: Set Up Webhook (5 minutes)

**Paddle Dashboard → Developer Tools → Notifications → Add Endpoint**

1. **Webhook URL:**
   ```
   https://gokslnrvxqledagcwghq.supabase.co/functions/v1/paddle-webhook
   ```

2. **Events to subscribe:**
   - ✅ `subscription.created`
   - ✅ `subscription.activated`
   - ✅ `subscription.updated`
   - ✅ `subscription.paused`
   - ✅ `subscription.canceled`
   - ✅ `subscription.past_due`
   - ✅ `transaction.completed`

3. **Save webhook**

4. **Copy Webhook Secret** (shown after saving)

---

### Step 5: Send Me the Credentials

**Reply with:**

```
Vendor ID: [your_vendor_id]
API Key: [live_xxx...]
Webhook Secret: [whsec_xxx...]

Product IDs:
Mini Monthly: pri_...
Mini Yearly: pri_...
Midi Monthly: pri_...
Midi Yearly: pri_...
Maxi Monthly: pri_...
Maxi Yearly: pri_...
B2B Mini Monthly: pri_...
B2B Mini Yearly: pri_...
B2B Midi Monthly: pri_...
B2B Midi Yearly: pri_...
B2B Maxi Monthly: pri_...
B2B Maxi Yearly: pri_...
```

---

## ✅ What I'll Do Next (5 minutes after you send credentials)

1. **Update checkout.html** with real product IDs
2. **Update paddle-webhook/index.ts** with product mapping
3. **Set Supabase secrets** (webhook secret)
4. **Deploy changes** to production
5. **Test checkout flow** in Paddle sandbox
6. **Switch to live mode** once tested

---

## 🎯 B2B Outreach 7-Day Trial (Great Idea!)

**Your suggestion:** Offer 1-week free trial for B2B Outreach (like demo trading accounts)

**Implementation:**

✅ **Already set up!** When creating B2B products above, set:
- Trial period: **7 days**
- After 7 days → automatic billing starts

**User Experience:**
1. User subscribes to CRM (99-day trial)
2. User adds B2B Outreach (7-day trial)
3. Days 1-7: Full B2B access (free)
4. Day 8: B2B billing starts ($6-12/month)
5. CRM trial continues (still in 99-day window)

**Access Control:**
- During 7-day trial: `b2b_outreach_addon = true` (from Paddle)
- After trial ends: depends on payment
  - ✅ Paid: access continues
  - ❌ Not paid: `b2b_outreach_addon = false`, access blocked

**Perfect for:**
- Testing B2B features risk-free
- Seeing value before committing
- Similar to demo vs live trading accounts

---

## 📊 Trial Comparison Table

| Module | Trial Period | Access After Trial | Billing |
|--------|--------------|-------------------|---------|
| **Sales OS** | N/A | FREE forever | Never billed |
| **CRM** | 99 days | Grace period (150 days) | $9-30/month |
| **B2B Outreach** | 7 days | Blocks if not paid | +$6-12/month |

**Example Timeline:**
- Day 1: User signs up → CRM trial starts (99 days)
- Day 10: User adds B2B → B2B trial starts (7 days)
- Day 17: B2B trial ends → billing starts
- Day 100: CRM trial ends → grace period (150 days total)
- Day 150: CRM blocks if not subscribed

---

## 🚀 Next: B2B Outreach Deployment

**After Paddle is live**, we'll deploy B2B Outreach Agent:

### Architecture:
```
Main App (shaamelz.com)
├── Sales OS (free)
├── CRM (99-day trial)
└── B2B Outreach link → b2b.shaamelz.com (7-day trial)
```

### Deployment Steps:
1. Deploy B2B backend to Render ($7/month)
2. Deploy B2B frontend to Netlify (free)
3. Set up Redis for workers (Upstash free tier)
4. Connect auth (shared login)
5. Enable access gate (checks `b2b_outreach_addon`)

**Time:** 4-6 hours  
**Cost:** ~$15/month

---

## ✅ Summary

**What you need to do NOW:**
1. Create 12 products in Paddle (20 min)
2. Get Vendor ID, API Key, Webhook Secret (5 min)
3. Get all 12 product IDs (5 min)
4. Set up webhook (5 min)
5. Send me the credentials

**What I'll do NEXT:**
6. Integrate credentials into code (5 min)
7. Test checkout flow (10 min)
8. Deploy to production (2 min)

**Then:**
9. Paddle integration COMPLETE ✅
10. Move to B2B Outreach deployment

---

**Ready? Create those 12 products and send me the credentials!** 🚀
