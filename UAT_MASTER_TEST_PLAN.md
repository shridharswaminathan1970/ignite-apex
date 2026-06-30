# IGNITE_APEX - Master UAT Test Plan

**Version:** 1.0  
**Date:** 2026-06-25  
**Tester:** ___________________  
**Environment:** Production (https://shaamelz.com)

---

## Test Environment Setup

### Prerequisites
- [ ] Supabase project accessible
- [ ] Test user accounts created
- [ ] Test organizations created
- [ ] Sample data seeded (leads, opportunities, contacts, accounts)

### Test Users Needed

| Role | Email | Purpose |
|------|-------|---------|
| Super Admin | admin@testcompany.com | Full system access |
| Admin | manager@testcompany.com | Team management |
| Sales Rep | rep1@testcompany.com | Daily CRM usage |
| SDR | sdr1@testcompany.com | Lead qualification |

---

## Test Modules

### 📋 [Sheet 1: Authentication & User Management](See Excel Sheet 1)
### 📋 [Sheet 2: Organization & Team Setup](See Excel Sheet 2)
### 📋 [Sheet 3: CRM - Leads & Opportunities](See Excel Sheet 3)
### 📋 [Sheet 4: CRM - Accounts & Contacts](See Excel Sheet 4)
### 📋 [Sheet 5: Qualification Roadmap (IGNITE-APEX)](See Excel Sheet 5)
### 📋 [Sheet 6: Sales OS](See Excel Sheet 6)
### 📋 [Sheet 7: Subscription & Trial System](See Excel Sheet 7)
### 📋 [Sheet 8: Invoicing & Payments](See Excel Sheet 8)
### 📋 [Sheet 9: Reports & Analytics](See Excel Sheet 9)
### 📋 [Sheet 10: Admin Functions](See Excel Sheet 10)

---

## Critical Path Test (Run First)

**Goal:** Verify end-to-end user journey from signup to closing a deal

1. **Register** → Create new account
2. **Login** → Access system
3. **Create Lead** → Add new prospect
4. **Qualify Lead** → Run IGNITE diagnostic
5. **Convert to Opportunity** → Move to pipeline
6. **Complete Qualification** → Answer all gates
7. **Progress to Closed Won** → Mark deal as won
8. **View Report** → Generate deal report

**Expected Time:** 20 minutes  
**Status:** [ ] PASS [ ] FAIL

---

## Bug Severity Levels

- **P0 - Critical:** System unusable, blocks all users
- **P1 - High:** Major feature broken, impacts most users
- **P2 - Medium:** Feature partially broken, has workaround
- **P3 - Low:** Minor issue, cosmetic, doesn't block work

---

## Test Execution Notes

- Test in **Chrome**, **Firefox**, and **Edge**
- Test on **Desktop** and **Mobile**
- Clear browser cache between major test sections
- Take screenshots of all failures
- Record exact steps to reproduce bugs

---

**Next Step:** See `ignite-apex-testscript.xlsx` for detailed test cases

