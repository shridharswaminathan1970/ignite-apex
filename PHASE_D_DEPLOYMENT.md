# Phase D: AI Coaching Deployment Guide

## Overview

Phase D provides AI-powered coaching via Claude API to help reps improve gate answers with:
- **Draft answers** based on logged activities/context
- **Weak evidence flags** calling out missing details
- **Next best action** suggesting specific moves to advance the deal
- **Confidence rating** (high/medium/low)

Edge Function: `supabase/functions/ai-coaching/index.ts` (197 lines, fully implemented)

---

## Prerequisites

1. **Anthropic API Key**
   - Get key from: https://console.anthropic.com/settings/keys
   - Model used: `claude-sonnet-4-6` (latest Sonnet)
   - Cost: ~$0.003 per coaching request (1,500 tokens)

2. **Supabase CLI installed**
   ```bash
   npm install -g supabase
   ```

3. **Supabase project linked**
   ```bash
   supabase login
   supabase link --project-ref gokslnrvxqledagcwghq
   ```

---

## Deployment Steps

### Step 1: Set Anthropic API Key Secret

**Via Supabase Dashboard:**
1. Go to: https://supabase.com/dashboard/project/gokslnrvxqledagcwghq/settings/vault
2. Click "New secret"
3. Name: `ANTHROPIC_API_KEY`
4. Value: `sk-ant-api03-...` (your key from Anthropic)
5. Save

**Or via CLI:**
```bash
supabase secrets set ANTHROPIC_API_KEY=sk-ant-api03-YOUR_KEY_HERE
```

### Step 2: Deploy ai-coaching Edge Function

```bash
cd C:\Projects\ignite-apex
supabase functions deploy ai-coaching
```

Expected output:
```
Deploying function ai-coaching...
✓ Function deployed successfully
Function URL: https://gokslnrvxqledagcwghq.supabase.co/functions/v1/ai-coaching
```

### Step 3: Verify Deployment

**Test with curl:**
```bash
curl -X POST \
  https://gokslnrvxqledagcwghq.supabase.co/functions/v1/ai-coaching \
  -H "Authorization: Bearer YOUR_USER_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "opportunityId": "some-opp-id",
    "stageId": "qualification",
    "gateField": "gate_economic_buyer_identified"
  }'
```

**Expected response:**
```json
{
  "draft": "Based on your notes, the Economic Buyer appears to be...",
  "weakEvidence": ["No title mentioned", "Haven't met them directly"],
  "nextAction": "Ask your champion: who has budget authority for purchases over $X?",
  "confidence": "medium"
}
```

### Step 4: Check Edge Function Logs

**Via Dashboard:**
https://supabase.com/dashboard/project/gokslnrvxqledagcwghq/logs/edge-functions

**Via CLI:**
```bash
supabase functions logs ai-coaching
```

Look for:
- ✓ Function invocations
- ✓ Anthropic API calls (200 status)
- ❌ Errors (API key invalid, rate limits, etc.)

---

## UI Integration Status

✅ **Already integrated** in `crm/qualification-roadmap.js`:

- Button: "🤖 Get AI Coaching" on every gate (line 638-643)
- Function: `window.getAICoaching(stageId, gateField)` (line 869-914)
- Renders draft/flags/next action in collapsible panel (line 652-661)
- "Use This Draft" button fills textarea (line 916-934)

**No code changes needed** — UI is ready, just needs backend deployed.

---

## Testing in CRM

1. **Login as SDR** (huntjobsdown4shaamel@gmail.com)
2. **Open opportunity** → go to "Qualification Roadmap" tab
3. **Click any gate** → scroll to answer field
4. **Click "🤖 Get AI Coaching"**
5. **Verify:**
   - Button shows "⏳ Thinking..."
   - Draft answer appears in blue panel
   - Weak evidence flags listed (if any)
   - Next action shown
   - "✓ Use This Draft" button works

---

## Cost Estimation

**Per coaching request:**
- Input: ~800 tokens (opportunity context + system prompt)
- Output: ~700 tokens (draft + flags + action)
- Total: ~1,500 tokens @ $0.003/1K = **$0.0045 per request**

**Monthly estimate:**
- 100 reps × 5 deals/month × 10 gates/deal × 20% coaching usage = 1,000 requests/month
- Cost: **$4.50/month**

---

## Troubleshooting

### Error: "Anthropic API error: 401"
**Cause:** API key not set or invalid

**Fix:**
```bash
# Check if secret exists
supabase secrets list

# Re-set key
supabase secrets set ANTHROPIC_API_KEY=sk-ant-api03-YOUR_CORRECT_KEY
```

### Error: "Could not parse AI response"
**Cause:** Claude returned non-JSON (rare, but possible)

**Fix:** Check logs for actual response:
```bash
supabase functions logs ai-coaching --limit 1
```

Claude should return JSON, but fallback handles plain text.

### Error: "Opportunity not found"
**Cause:** User not authorized to access that opportunity (RLS blocking)

**Fix:** Verify user has access to opportunity:
```sql
SELECT * FROM opportunities WHERE id = 'opp-id' AND user_id = 'current-user-id';
```

### Button stuck on "⏳ Thinking..."
**Cause:** Edge Function timeout or network error

**Fix:**
1. Check browser console for error
2. Check Edge Function logs
3. Increase timeout in fetch call (currently default 2 min)

---

## Monitoring

**Key Metrics to Track:**

1. **Usage Rate**
   ```sql
   -- Count AI coaching requests per day
   SELECT DATE(created_at) as date, COUNT(*) as coaching_requests
   FROM edge_function_logs
   WHERE function_name = 'ai-coaching'
   GROUP BY DATE(created_at)
   ORDER BY date DESC;
   ```

2. **Weak Evidence Detection Rate**
   ```sql
   -- Find gates most often flagged as weak
   SELECT gate_field, COUNT(*) as weak_flags
   FROM ai_coaching_logs  -- Would need to create this table
   WHERE weak_evidence IS NOT NULL
   GROUP BY gate_field
   ORDER BY weak_flags DESC;
   ```

3. **Draft Acceptance Rate**
   - Track when rep uses "✓ Use This Draft" vs dismisses
   - Measure quality by comparing pre/post coaching strength scores

---

## Security Notes

- ✅ User authentication required (checks `Authorization` header)
- ✅ CORS enabled for https://shaamelz.com
- ✅ API key stored in Supabase Vault (encrypted)
- ✅ No PII sent to Anthropic (opportunity data only, no user emails)
- ⚠️ Opportunity context includes deal details — ensure reps understand AI sees this

---

## Next Steps After Deployment

1. **UAT Test** — Have 2-3 reps test AI coaching on real deals
2. **Collect Feedback** — Are drafts helpful? Flags accurate? Actions specific?
3. **Tune Prompts** — Adjust `systemPrompt` in index.ts based on feedback
4. **Add Logging** — Create `ai_coaching_logs` table to track usage/quality
5. **Build Analytics** — Dashboard showing which gates get most coaching, draft acceptance rate

---

## Status Checklist

- [ ] Anthropic API key obtained
- [ ] API key set in Supabase secrets
- [ ] ai-coaching function deployed
- [ ] Test curl request successful
- [ ] UI tested in CRM (SDR user)
- [ ] Edge Function logs verified
- [ ] Phase D marked complete

**Last Updated:** 2026-07-01
