# ✅ Paddle Vendor ID Updated - Next Steps

**Date:** 2026-06-25  
**Status:** Vendor ID configured, awaiting Product IDs + Webhook Secret

---

## ✅ **COMPLETED**

1. **Vendor ID Set:** `80920` ✅
   - Updated in `checkout.html` line 115
   - Deployed to production
   - Paddle.js will now initialize correctly

---

## 📋 **WHAT YOU NEED TO DO NOW**

### **Step 1: Create 12 Products in Paddle (20 minutes)**

Go to: **Paddle Dashboard → Catalog → Products → Create Product**

**Create these 12 products exactly:**

#### **CRM Plans (6 products)**

1. **Product Name:** IGNITE_APEX CRM - Team Mini (Monthly)
   - **Type:** Subscription
   - **Billing:** Monthly
   - **Price:** $9.00 USD
   - **Trial Period:** 99 days
   - Click "Create" → Copy the **Product ID** (starts with `pri_`)

2. **Product Name:** IGNITE_APEX CRM - Team Mini (Yearly)
   - **Type:** Subscription
   - **Billing:** Yearly
   - **Price:** $100.00 USD
   - **Trial Period:** 99 days
   - Copy **Product ID**

3. **Product Name:** IGNITE_APEX CRM - Team Midi (Monthly)
   - **Price:** $18.00 USD (Monthly)
   - **Trial:** 99 days
   - Copy **Product ID**

4. **Product Name:** IGNITE_APEX CRM - Team Midi (Yearly)
   - **Price:** $195.00 USD (Yearly)
   - **Trial:** 99 days
   - Copy **Product ID**

5. **Product Name:** IGNITE_APEX CRM - Team Maxi (Monthly)
   - **Price:** $30.00 USD (Monthly)
   - **Trial:** 99 days
   - Copy **Product ID**

6. **Product Name:** IGNITE_APEX CRM - Team Maxi (Yearly)
   - **Price:** $320.00 USD (Yearly)
   - **Trial:** 99 days
   - Copy **Product ID**

#### **B2B0 Plans (6 products - INDEPENDENT)**

7. **Product Name:** B2B0 Outreach - Mini (Monthly)
   - **Type:** Subscription
   - **Billing:** Monthly
   - **Price:** $6.00 USD
   - **Trial Period:** 7 days ← DIFFERENT from CRM!
   - Copy **Product ID**

8. **Product Name:** B2B0 Outreach - Mini (Yearly)
   - **Price:** $60.00 USD (Yearly)
   - **Trial:** 7 days
   - Copy **Product ID**

9. **Product Name:** B2B0 Outreach - Midi (Monthly)
   - **Price:** $9.00 USD (Monthly)
   - **Trial:** 7 days
   - Copy **Product ID**

10. **Product Name:** B2B0 Outreach - Midi (Yearly)
    - **Price:** $90.00 USD (Yearly)
    - **Trial:** 7 days
    - Copy **Product ID**

11. **Product Name:** B2B0 Outreach - Maxi (Monthly)
    - **Price:** $12.00 USD (Monthly)
    - **Trial:** 7 days
    - Copy **Product ID**

12. **Product Name:** B2B0 Outreach - Maxi (Yearly)
    - **Price:** $120.00 USD (Yearly)
    - **Trial:** 7 days
    - Copy **Product ID**

---

### **Step 2: Set Up Webhook (5 minutes)**

**Go to:** Paddle Dashboard → Developer Tools → Notifications → Add Endpoint

**Webhook URL (paste exactly):**
```
https://gokslnrvxqledagcwghq.supabase.co/functions/v1/paddle-webhook
```

**Subscribe to these 7 events:**
- ✅ `subscription.created`
- ✅ `subscription.activated`
- ✅ `subscription.updated`
- ✅ `subscription.paused`
- ✅ `subscription.canceled`
- ✅ `subscription.past_due`
- ✅ `transaction.completed`

**After saving:**
- Copy the **Webhook Secret** (looks like `pdl_ntfset_01...`)

---

### **Step 3: Send Me the Credentials**

**Reply with this format:**

```
Webhook Secret: pdl_ntfset_01...

Product IDs:
Team Mini Monthly: pri_01...
Team Mini Yearly: pri_01...
Team Midi Monthly: pri_01...
Team Midi Yearly: pri_01...
Team Maxi Monthly: pri_01...
Team Maxi Yearly: pri_01...
B2B0 Mini Monthly: pri_01...
B2B0 Mini Yearly: pri_01...
B2B0 Midi Monthly: pri_01...
B2B0 Midi Yearly: pri_01...
B2B0 Maxi Monthly: pri_01...
B2B0 Maxi Yearly: pri_01...
```

---

## 🔧 **WHAT I'LL DO NEXT (5 minutes after you send)**

1. Update `checkout.html` with all 12 Product IDs
2. Update `paddle-webhook/index.ts` with Product ID mapping
3. Set Webhook Secret in Supabase secrets
4. Deploy to production
5. Test checkout flow in sandbox mode

---

## ✅ **CURRENT STATUS**

| Item | Status |
|------|--------|
| Vendor ID | ✅ Set to `80920` |
| Webhook URL | ✅ Ready: `https://gokslnrvxqledagcwghq.supabase.co/functions/v1/paddle-webhook` |
| 12 Products | ⏳ You need to create in Paddle Dashboard |
| Product IDs | ⏳ Waiting for you to send |
| Webhook Secret | ⏳ Waiting for you to send |
| Code Integration | ⏳ Ready to update once I receive IDs |

---

## 🎯 **ESTIMATED TIME**

- **You:** 25 minutes (create products + webhook)
- **Me:** 5 minutes (update code + deploy)
- **Total:** 30 minutes to fully integrated Paddle checkout ✅

---

**Go ahead and create those 12 products now!** When you're done, send me the Webhook Secret + all 12 Product IDs and I'll integrate them immediately. 🚀
