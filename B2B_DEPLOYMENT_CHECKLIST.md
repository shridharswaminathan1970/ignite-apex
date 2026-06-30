# B2B Outreach Agent - Deployment Checklist

**GitHub Repo:** https://github.com/shridharswaminathan1970/b2b-outreach-agent  
**Target Date:** TBD  
**Status:** Ready to deploy (waiting for hosting decision)

---

## Pre-Deployment Decisions

### ✅ Hosting Providers (Choose One)

**Backend API (Node.js + Express):**
- [ ] **Render.com** (Recommended - easy, $7/mo starter)
- [ ] **Railway.app** (Good alternative, similar pricing)
- [ ] **Fly.io** (More control, slightly more complex)

**Redis (for BullMQ workers):**
- [ ] **Upstash** (Free tier: 10k commands/day) ← Recommended
- [ ] **Render Redis** (Add-on, $10/mo)
- [ ] **Railway Redis** (Add-on, $5/mo)

**Frontend (React + Vite):**
- [ ] **Netlify subdomain** (b2b.shaamelz.com) ← Recommended
- [ ] **Vercel** (Alternative)

---

## Step 1: Clone & Configure B2B Outreach Agent

```bash
# Clone the repo
git clone https://github.com/shridharswaminathan1970/b2b-outreach-agent.git
cd b2b-outreach-agent

# Install dependencies
npm install

# Create .env file
cp .env.example .env
```

### Environment Variables (.env)

```env
# Database (New Supabase Project)
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.esbadmmbwvdnjuhrbnse.supabase.co:5432/postgres
SUPABASE_URL=https://esbadmmbwvdnjuhrbnse.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# Main IGNITE_APEX Project (for auth sync)
MAIN_SUPABASE_URL=https://gokslnrvxqledagcwghq.supabase.co
MAIN_SUPABASE_ANON_KEY=eyJhbGc...

# Redis
REDIS_URL=redis://default:[PASSWORD]@[HOST]:6379

# AI & Enrichment
ANTHROPIC_API_KEY=sk-ant-api03-W3fLgUFq... (same as main project)
RESEND_API_KEY=re_... (for email delivery)
APOLLO_API_KEY=... (optional - for lead enrichment, can use mock)

# Feature Flags
USE_MOCK_EMAIL=false
USE_MOCK_APOLLO=true  # Set to false once you have Apollo API key
NODE_ENV=production
PORT=3000
```

---

## Step 2: Set Up New Supabase Project

1. **Database Migration:**
   ```bash
   # In b2b-outreach-agent repo
   npm run db:migrate
   ```

2. **Verify Tables Created:**
   - `leads`
   - `sequences`
   - `emails`
   - `campaigns`
   - `users` (synced from main project)

3. **Set Up RLS Policies:**
   ```sql
   -- In Supabase SQL Editor (esbadmmbwvdnjuhrbnse)
   -- Enable RLS on all tables
   ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
   ALTER TABLE sequences ENABLE ROW LEVEL SECURITY;
   
   -- Policy: Users can only access their org's data
   CREATE POLICY "org_isolation" ON leads
   FOR ALL USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));
   ```

---

## Step 3: Deploy Backend API

### Option A: Deploy to Render.com

1. Go to https://render.com
2. New → Web Service
3. Connect GitHub repo: `b2b-outreach-agent`
4. **Settings:**
   - Name: `ignite-apex-b2b-api`
   - Environment: `Node`
   - Build Command: `npm install && npm run build`
   - Start Command: `npm run start:prod`
   - Instance Type: Starter ($7/mo)
5. Add Environment Variables (all from .env above)
6. Deploy!
7. **API URL:** https://ignite-apex-b2b-api.onrender.com

### Option B: Deploy to Railway.app

1. Go to https://railway.app
2. New Project → Deploy from GitHub
3. Select `b2b-outreach-agent`
4. Add environment variables
5. Deploy
6. **API URL:** https://ignite-apex-b2b-api.up.railway.app

---

## Step 4: Deploy Redis

### Option A: Upstash (Free Tier - Recommended)

1. Go to https://upstash.com
2. Create new Redis database
3. Copy `REDIS_URL` (format: `rediss://default:...@...upstash.io:6379`)
4. Update backend .env with this URL
5. Redeploy backend

### Option B: Render Redis Add-on

1. In Render dashboard → Add Redis
2. Link to backend service
3. Copy connection URL
4. Update .env
5. Redeploy

---

## Step 5: Deploy Workers

Workers handle background tasks (email sending, lead enrichment).

```bash
# In Render/Railway, add SECOND service:
# Name: ignite-apex-b2b-worker
# Build: npm install
# Start: npm run worker
# Environment: Same .env as API
```

---

## Step 6: Deploy Frontend

### Deploy to Netlify Subdomain

```bash
# In b2b-outreach-agent/frontend directory
cd frontend

# Build
npm run build

# Deploy to Netlify
netlify deploy --prod --dir=dist
```

**Configure Custom Domain:**
1. Netlify Dashboard → Domain Settings
2. Add custom domain: `b2b.shaamelz.com`
3. Update DNS (in your domain registrar):
   - Type: CNAME
   - Name: `b2b`
   - Value: [netlify-site-url].netlify.app
4. Wait for SSL certificate (5-10 minutes)

**Update Frontend .env:**
```env
VITE_API_URL=https://ignite-apex-b2b-api.onrender.com
VITE_MAIN_SUPABASE_URL=https://gokslnrvxqledagcwghq.supabase.co
VITE_MAIN_SUPABASE_ANON_KEY=eyJhbGc...
```

---

## Step 7: Integrate with Main IGNITE_APEX

### Update Main Project

1. **Update `/outreach/index.html`:**
   ```javascript
   // Line 104: Update B2B_OUTREACH_URL
   const B2B_OUTREACH_URL = 'https://b2b.shaamelz.com'; // ✅ Real URL
   ```

2. **Add Navigation Link to CRM:**
   
   In `crm/index.html`, add conditional B2B link:
   ```javascript
   // After page load, check if user has b2b addon
   const { data: sub } = await supabaseClient
     .from('org_subscriptions')
     .select('b2b_outreach_addon')
     .eq('org_id', currentUser.org_id)
     .single();

   if (sub?.b2b_outreach_addon) {
     // Show B2B nav link
     document.querySelector('.tb-nav').insertAdjacentHTML('beforeend',
       '<a href="https://b2b.shaamelz.com" style="color:var(--purple);font-weight:700">🚀 B2B Outreach</a>'
     );
   }
   ```

3. **Deploy updates:**
   ```bash
   netlify deploy --prod
   ```

---

## Step 8: Test End-to-End Flow

### Test 1: Access Gate
1. User WITHOUT b2b_outreach_addon visits /outreach/
2. Should see "Subscription Required" → redirects to pricing

### Test 2: Subscription Flow
1. User subscribes to CRM + B2B addon via Paddle
2. Webhook sets `b2b_outreach_addon = true`
3. User visits /outreach/
4. Should see "Access Granted" → auto-redirects to b2b.shaamelz.com

### Test 3: SSO (Shared Auth)
1. User logs in to main IGNITE_APEX (shaamelz.com)
2. Clicks B2B nav link
3. Should be auto-logged into B2B platform (no second login)

### Test 4: Lead Import
1. In B2B platform, import leads
2. AI scores leads against ICP
3. Generate personalized sequence
4. Send emails
5. Track replies

### Test 5: CRM Sync
1. Reply detected in B2B platform
2. Activity synced back to main CRM
3. Appears in opportunity activities feed

---

## Step 9: Monitor & Optimize

### Logs to Check
- **Render/Railway:** Backend API logs
- **Upstash:** Redis metrics
- **Netlify:** Frontend build logs
- **Supabase:** Database queries, Edge Function logs

### Performance Targets
- API response time: < 500ms
- Email send rate: 100/hour (respect rate limits)
- Lead enrichment: < 2s per lead
- Worker queue: No backlog > 1000 jobs

---

## Rollback Plan

If deployment fails:

1. **Frontend:** Netlify allows instant rollback to previous deploy
2. **Backend:** Render/Railway has "Revert" button
3. **Database:** Supabase has point-in-time recovery (24hr window)
4. **Emergency:** Disable B2B nav link in main app, show "Under Maintenance"

---

## Cost Estimate (Monthly)

| Service | Provider | Cost |
|---------|----------|------|
| Backend API | Render Starter | $7 |
| Worker | Render Starter | $7 |
| Redis | Upstash Free | $0 |
| Frontend | Netlify | $0 |
| Database | Supabase Free | $0 |
| Email (Resend) | Pay-as-go | ~$1 |
| **TOTAL** | | **~$15/mo** |

*(Scales to $50-100/mo at 10k emails/month)*

---

## Go-Live Checklist

- [ ] Backend deployed to Render/Railway
- [ ] Worker deployed and running
- [ ] Redis connected (Upstash)
- [ ] Frontend deployed to b2b.shaamelz.com
- [ ] DNS configured (CNAME for b2b subdomain)
- [ ] SSL certificate active
- [ ] All environment variables set
- [ ] Database migrations run
- [ ] RLS policies enabled
- [ ] Main app navigation updated
- [ ] Access gate tested
- [ ] SSO tested
- [ ] Lead import tested
- [ ] Email sending tested
- [ ] CRM sync tested
- [ ] Monitoring set up
- [ ] Error alerts configured
- [ ] Backup strategy in place
- [ ] Documentation updated
- [ ] Team trained
- [ ] Launch! 🚀

---

## Next Steps

**When ready to deploy:**

1. Choose hosting providers (Render + Upstash recommended)
2. Get Apollo.io API key (optional - can use mock initially)
3. Run through deployment steps above
4. Test thoroughly
5. Announce to users

**Estimated Time:** 4-6 hours (first time), 1-2 hours (subsequent deploys)

---

## Support

- Backend Issues: Check Render/Railway logs
- Frontend Issues: Check Netlify logs
- Database Issues: Check Supabase logs
- Questions: muhammad.shaamel@gmail.com
