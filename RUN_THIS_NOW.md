# 🚀 RUN THESE COMMANDS NOW (10 minutes)

## Step 1: Run Database Migration (5 min)

1. Open: https://supabase.com/dashboard/project/gokslnrvxqledagcwghq/sql/new

2. Copy the ENTIRE contents of this file:
   ```
   C:\Projects\ignite-apex\supabase\migrations\20260625_add_jtbd_and_fixes.sql
   ```

3. Paste into SQL Editor

4. Click "Run" button

5. ✅ Should see: "Success. No rows returned"

---

## Step 2: Set Supabase Secrets (1 min)

```bash
cd C:\Projects\ignite-apex

supabase secrets set ANTHROPIC_API_KEY=sk-ant-api03-W3fLgUFqUKBlw0...
```

(Replace `...` with your full Anthropic API key)

---

## Step 3: Deploy AI Coaching Edge Function (2 min)

```bash
supabase functions deploy ai-coaching
```

Expected output:
```
✔ Deployed ai-coaching
```

---

## Step 4: Deploy Email Reminders (2 min)

```bash
supabase functions deploy send-trial-reminders
```

---

## Step 5: Deploy Paddle Webhook (optional)

```bash
supabase functions deploy paddle-webhook
```

---

## ✅ DONE!

After these 5 steps:
- All 10 rendering tests should PASS
- AI Coaching button will work
- JTBD fields will save
- 6 IGNITE diagnostics will save

**Then test live at:**
https://shaamelz.com/crm/opportunity.html
