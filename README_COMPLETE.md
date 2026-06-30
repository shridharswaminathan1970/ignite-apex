# IGNITE_APEX - Complete Platform

**Production URL:** https://shaamelz.com  
**Status:** 85% Complete - Ready for UAT  
**Last Updated:** 2026-06-25

---

## 🎯 Platform Overview

IGNITE_APEX is a complete B2B sales platform with three integrated modules:

| Module | Status | Access Model | URL |
|--------|--------|--------------|-----|
| **Sales OS** | ✅ Complete | FREE (always) | `/system/` |
| **CRM** | ✅ Complete | 99-day trial → $9-30/mo | `/crm/` |
| **B2B Outreach** | 🔧 Separate deployment | Paid add-on +$6-12/mo | `/outreach/` → `b2b.shaamelz.com` |

---

## 📦 What's Been Built

### ✅ Completed Features (85%)

#### 1. Sales OS (FREE - Always Accessible)
- IGNITE mindset prerequisites
- ATTRACT (ICP scoring)
- PROBE (3-layer root cause diagnosis)
- EXECUTE (20 qualification questions)
- EXCEL (rep daily system)
- CEMENT (post-sale framework)
- Deal briefing PDF reports

#### 2. CRM (99-Day Trial System)
- **Core CRM:**
  - Leads, Opportunities, Accounts, Contacts
  - Activities (calls, meetings, emails)
  - Tasks & reminders
  - Pipeline visualization
  - Forecast board
  - Reports & analytics

- **IGNITE-APEX Qualification Roadmap:**
  - 🗺️ Horizontal roadmap rail (8 stages: Raw Lead → IGNITE → 6 APEX → CEMENT)
  - 🔥 IGNITE Entry Gate with 4U validation (Unworkable, Urgent, Unavoidable, Underserved)
  - 🧅 Peel the Onion (3 layers) on ALL 4 U's
  - 🎯 JTBD capture (6 fields: When/I want/So I can + Functional/Emotional/Social)
  - 🔥 6 IGNITE diagnostic checks (I-G-N-I-T-E, ≥4/6 pass threshold)
  - 📊 APEX stage gates (Qualification 10% → Discovery 30% → Demo 50% → Proposal 70% → Negotiation 90% → Closed Won 100%)
  - ✅ MEDDPICC gates at Proposal stage
  - 🏗️ CEMENT post-sale (5 layers, Month 1-36+)
  - 🎯 Guiding questions under each gate
  - 📊 STRONG vs WEAK calibration examples
  - ⚙️ Editable provisional config (JSON) for JTBD & diagnostics

- **Trial & Subscription System:**
  - ⏱️ 99-day trial tracking
  - 📊 Trial countdown banner
  - ⏰ Grace period (105-150 days with reminders)
  - 🔒 Hard block after 150 days
  - 📈 Login counter (every 5th login shows reminder)
  - 👥 User limits per plan (3/10/50 users)
  - 💳 Pricing page with 3 tiers + B2B addon
  - 🛒 Checkout page (Paddle-ready)
  - 💰 Manual invoice generator (admin)

#### 3. Admin Functions
- Company dashboard
- User management (create/edit/delete/assign teams)
- Invite code generation
- Role-based access control
- CRM access toggle
- Invoice generation (PDF with jsPDF)
- Payment tracking

#### 4. B2B Outreach Agent Integration
- ✅ Landing page with access gate (`/outreach/`)
- ✅ Subscription check (`b2b_outreach_addon = true`)
- ✅ Integration plan documented
- 🔧 Separate deployment needed (see `B2B_OUTREACH_INTEGRATION_PLAN.md`)

---

## 🚧 Pending Features (15%)

### High Priority
1. **Paddle Payment Integration**
   - Need Paddle account signup
   - Create 12 products (3 tiers × 2 billing × base+addon)
   - Update `checkout.html` with product IDs
   - Deploy Edge Function: `activate-subscription`

2. **Email Reminder System**
   - Supabase Edge Function for trial reminders
   - Cron job (every 20 minutes during grace period)
   - Resend API integration

3. **AI Coaching Edge Function**
   - Draft-to-confirm gate answers
   - Weak evidence detection
   - Next action suggestions
   - Anthropic API key already available

4. **B2B Outreach Deployment**
   - Deploy Node.js backend (Render/Railway)
   - Deploy React frontend (Netlify subdomain)
   - Set up Redis workers
   - Configure CRM sync

### Medium Priority
5. **Database Fixes**
   - Add missing JTBD columns to opportunities table
   - Fix opportunity creation queries
   - Test data seeding

---

## 📋 User Acceptance Testing

### Test Scripts Created
✅ `UAT_MASTER_TEST_PLAN.md` - Overview & critical path  
✅ `UAT_Sheet1_Authentication.csv` - 14 test cases  
✅ `UAT_Sheet5_Qualification_Roadmap.csv` - 35 test cases  
✅ `UAT_Sheet7_Subscription_Trial.csv` - 24 test cases

**Total Test Cases:** 73+ (more sheets to be added)

### How to Run UAT
1. Import CSV files into Excel workbook: `ignite-apex-testscript.xlsx`
2. Create test users (super admin, admin, rep, sdr)
3. Seed test data (accounts, contacts, leads, opportunities)
4. Execute test cases
5. Log results (PASS/FAIL) and bugs
6. Prioritize bugs (P0/P1/P2/P3)

---

## 🚀 Deployment Architecture

### Current Setup
- **Hosting:** Netlify
- **URL:** https://shaamelz.com
- **Database:** Supabase (`gokslnrvxqledagcwghq`)
- **Edge Functions:** Supabase (ai-coaching deployed)

### B2B Outreach Setup (Pending)
- **Backend:** Render/Railway (Node.js + Express)
- **Frontend:** Netlify subdomain (`b2b.shaamelz.com`)
- **Database:** Supabase (`esbadmmbwvdnjuhrbnse`)
- **Workers:** Redis + BullMQ

---

## 📖 Documentation

### User Guides
- **New User Guide:** `/guide/index.html`
- **Content Bank:** `/docs/IGNITE-APEX_Content_Bank.md`
- **Admin Guide:** `/docs/ADMIN_FLOW_GUIDE.md`

### Technical Docs
- **Deployment Status:** `DEPLOYMENT_STATUS_FINAL.md`
- **B2B Integration Plan:** `B2B_OUTREACH_INTEGRATION_PLAN.md`
- **Architecture:** `/docs/CRM_SALES_OS_UNIFIED_ARCHITECTURE.md`
- **Subscription System:** `SUBSCRIPTION_SYSTEM_STATUS.md`

---

## 🔧 Setup Instructions

### For Testers (UAT)
1. **Access the system:** https://shaamelz.com/app/auth.html
2. **Get credentials from admin** (invite code required)
3. **Or create test user via Supabase:**
   ```sql
   -- In Supabase SQL Editor
   UPDATE public.users 
   SET crm_enabled = true, role = 'admin'
   WHERE email = 'your-test-email@example.com';
   ```
4. **Navigate modules:**
   - Sales OS: Free, always accessible
   - CRM: Navigate from dashboard or `/crm/index.html`
   - Admin: `/app/company-dashboard.html` (admin role only)

### For Developers
1. **Clone repo:** (if needed)
2. **Environment variables:**
   - Copy `.env.example` to `.env`
   - Set Supabase credentials
   - Set Anthropic API key (already have)
3. **Deploy:**
   ```bash
   netlify deploy --prod
   ```

---

## 🎯 Next Steps

### Immediate (This Week)
1. ✅ Complete UAT test script creation
2. ⏳ Run UAT testing
3. ⏳ Fix critical bugs (P0/P1)
4. ⏳ Database fixes (add JTBD columns, fix queries)

### Short-term (1-2 Weeks)
5. ⏳ Sign up for Paddle account
6. ⏳ Deploy AI Coaching Edge Function
7. ⏳ Deploy Email Reminder System
8. ⏳ Deploy B2B Outreach Agent (separate)

### Medium-term (2-4 Weeks)
9. ⏳ Complete Paddle integration
10. ⏳ Full CRM ↔ B2B sync
11. ⏳ Production load testing
12. ⏳ Go-live!

---

## 📞 Support

### Questions/Issues
- **GitHub Issues:** (your repo)
- **Admin Email:** muhammad.shaamel@gmail.com
- **Backup:** muhammad.shaamel@shaamelz.com

### Key Files Reference
- `.env` - Environment variables (NEVER commit!)
- `supabase-client.js` - Supabase initialization
- `crm/qualification-roadmap.js` - IGNITE-APEX roadmap engine
- `crm/gate-engine.js` - Gate validation logic
- `components/trial-banner.js` - Trial access gates
- `pricing.html` - Subscription pricing
- `checkout.html` - Paddle checkout (needs credentials)

---

## 🎉 What You Can Test Right Now

✅ **Login/Registration** - https://shaamelz.com/app/auth.html  
✅ **Sales OS** - https://shaamelz.com/system/index.html  
✅ **CRM Dashboard** - https://shaamelz.com/crm/index.html  
✅ **Qualification Roadmap** - Open any opportunity → Qualification tab  
✅ **Pricing Page** - https://shaamelz.com/pricing.html  
✅ **B2B Outreach Gate** - https://shaamelz.com/outreach/ (shows access control)  
✅ **Admin Dashboard** - https://shaamelz.com/app/company-dashboard.html  
✅ **Invoice Generator** - https://shaamelz.com/crm/admin/invoices.html  

---

**Current Completion: 85%**  
**Ready for UAT: ✅ YES**  
**Estimated Time to 100%: 2-3 weeks**

