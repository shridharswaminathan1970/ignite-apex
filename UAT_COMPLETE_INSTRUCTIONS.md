# ✅ COMPLETE UAT Test Script - Ready to Run

**Date:** 2026-06-25  
**Total Test Cases:** 223  
**Status:** All sheets created, ready to compile into Excel

---

## 📋 Test Sheets Created (10/10)

| Sheet | Module | Test Cases | Status |
|-------|--------|-----------|--------|
| ✅ Sheet 1 | Authentication | 14 | Created |
| ✅ Sheet 2 | Organization & Teams | 25 | Created |
| ✅ Sheet 3 | CRM - Leads & Opportunities | 30 | Created |
| ✅ Sheet 4 | CRM - Accounts & Contacts | 25 | Created |
| ✅ Sheet 5 | Qualification Roadmap | 35 | Created |
| ✅ Sheet 6 | Sales OS | 25 | Created |
| ✅ Sheet 7 | Subscription & Trial | 24 | Created |
| ✅ Sheet 8 | Invoicing & Payments | 15 | Created |
| ✅ Sheet 9 | Reports & Analytics | 15 | Created |
| ✅ Sheet 10 | Admin Functions | 20 | Created |
| **TOTAL** | | **223** | **Complete** |

---

## 📂 CSV Files Location

All files are in: `C:\Projects\ignite-apex\`

```
UAT_Sheet1_Authentication.csv
UAT_Sheet2_Organization_Teams.csv
UAT_Sheet3_CRM_Leads_Opportunities.csv
UAT_Sheet4_CRM_Accounts_Contacts.csv
UAT_Sheet5_Qualification_Roadmap.csv
UAT_Sheet6_Sales_OS.csv
UAT_Sheet7_Subscription_Trial.csv
UAT_Sheet8_Invoicing_Payments.csv
UAT_Sheet9_Reports_Analytics.csv
UAT_Sheet10_Admin_Functions.csv
```

---

## 🔧 How to Create Excel Workbook

### Option A: Import into Excel (Recommended)

1. **Open Excel** → New Workbook

2. **Import CSV files:**
   - Data → From Text/CSV
   - Select `UAT_Sheet1_Authentication.csv`
   - Load → Create new sheet
   - Repeat for all 10 sheets

3. **Rename sheets:**
   - Sheet 1 → "1 - Authentication"
   - Sheet 2 → "2 - Organization & Teams"
   - etc.

4. **Add Master Test Plan sheet:**
   - Insert new sheet at front
   - Name: "0 - Master Plan"
   - Copy contents from `UAT_MASTER_TEST_PLAN.md`

5. **Save as:**
   - `ignite-apex-uattestscript.xlsx`

### Option B: Use Python Script (Fast)

```python
import pandas as pd

# Create Excel writer
writer = pd.ExcelWriter('ignite-apex-uattestscript.xlsx', engine='xlsxwriter')

# Import all sheets
sheets = {
    '1 - Authentication': 'UAT_Sheet1_Authentication.csv',
    '2 - Organization & Teams': 'UAT_Sheet2_Organization_Teams.csv',
    '3 - CRM - Leads & Opps': 'UAT_Sheet3_CRM_Leads_Opportunities.csv',
    '4 - CRM - Accounts & Contacts': 'UAT_Sheet4_CRM_Accounts_Contacts.csv',
    '5 - Qualification Roadmap': 'UAT_Sheet5_Qualification_Roadmap.csv',
    '6 - Sales OS': 'UAT_Sheet6_Sales_OS.csv',
    '7 - Subscription & Trial': 'UAT_Sheet7_Subscription_Trial.csv',
    '8 - Invoicing & Payments': 'UAT_Sheet8_Invoicing_Payments.csv',
    '9 - Reports & Analytics': 'UAT_Sheet9_Reports_Analytics.csv',
    '10 - Admin Functions': 'UAT_Sheet10_Admin_Functions.csv'
}

for sheet_name, csv_file in sheets.items():
    df = pd.read_csv(csv_file)
    df.to_excel(writer, sheet_name=sheet_name, index=False)

writer.close()
print("✅ Excel workbook created: ignite-apex-uattestscript.xlsx")
```

---

## 🧪 How to Run UAT

### Phase 1: Environment Setup (Day 1)

1. **Create Test Users** (4 users):
   - super_duper_admin@test.com (password: Test123!)
   - admin@test.com (password: Test123!)
   - rep@test.com (password: Test123!)
   - sdr@test.com (password: Test123!)

2. **Create Test Organization:**
   - Name: "Test Company Inc"
   - Domain: test-company.com

3. **Create Test Teams:**
   - Team A (assign rep + sdr)
   - Team B (create empty)

4. **Seed Test Data:**
   - 5 accounts
   - 10 contacts
   - 5 leads
   - 10 opportunities (various stages)
   - 20 activities

### Phase 2: Execute Test Cases (Days 2-6)

**Daily Schedule:**
- Day 2: Sheets 1-2 (Authentication + Org/Teams)
- Day 3: Sheets 3-4 (CRM - Leads/Opps + Accounts/Contacts)
- Day 4: Sheet 5 (Qualification Roadmap - Critical)
- Day 5: Sheets 6-7 (Sales OS + Subscription)
- Day 6: Sheets 8-10 (Invoicing + Reports + Admin)

**For Each Test Case:**
1. Read "Steps" column
2. Execute steps in browser
3. Compare result to "Expected Result"
4. Mark "Actual Result" column with what you see
5. Set "Status" to PASS or FAIL
6. If FAIL: Set "Severity" (P0/P1/P2/P3)
7. Add "Notes" if needed

### Phase 3: Bug Tracking (Days 2-6, ongoing)

**Create Bug Log Sheet:**

| Bug ID | Test ID | Severity | Description | Steps to Reproduce | Expected | Actual | Status | Fixed Date |
|--------|---------|----------|-------------|-------------------|----------|--------|--------|------------|
| BUG-001 | AUTH-003 | P0 | Login fails with valid credentials | 1. Enter user/pass 2. Click login | Logged in | Error 500 | Open | |

**Severity Definitions:**
- **P0 (Critical):** System crash, data loss, security breach, complete feature broken
- **P1 (High):** Major feature broken, significant UX issue, workaround exists
- **P2 (Medium):** Minor feature broken, cosmetic issue, edge case
- **P3 (Low):** Enhancement, nice-to-have, documentation issue

### Phase 4: Bug Fixes (Days 7+)

1. **Triage bugs** by severity
2. **Fix P0/P1 first** (blocking issues)
3. **Retest after fixes**
4. **Iterate until all P0/P1 pass**

### Phase 5: Regression Testing (Final Day)

**Critical Path Test** (must all pass):
1. Signup → Login
2. Create organization + team
3. Create account + contact
4. Create opportunity (IGNITE-APEX)
5. Qualify opportunity (meet all gates)
6. Advance to Closed Won
7. Generate invoice
8. View reports

If critical path passes → **Ready for production**

---

## 📊 Success Criteria

### Before Launch:
- [ ] All P0 tests PASS
- [ ] All P1 tests PASS (or documented exceptions)
- [ ] Critical path end-to-end PASS
- [ ] No known security issues
- [ ] Performance acceptable (<2s page load)

### P2/P3 bugs can be:
- Documented for future release
- Logged in backlog
- Fixed post-launch

---

## 🎯 Testing Tips

1. **Test as different users** - don't test everything as super admin
2. **Test edge cases** - empty data, special characters, max limits
3. **Test negative cases** - try to break things intentionally
4. **Document everything** - screenshots, error messages, browser console
5. **Clear cache between tests** - avoid stale data issues
6. **Use incognito mode** - test fresh sessions
7. **Test on different browsers** - Chrome, Firefox, Safari, Edge
8. **Test on mobile** - responsive design
9. **Test slow connections** - simulate slow network
10. **Test with real data** - not just "Test Test"

---

## 📞 When You Find Bugs

**Document:**
- Test ID that failed
- Steps to reproduce
- Expected vs actual result
- Screenshot/video
- Browser + version
- Error messages from console

**Prioritize:**
- P0: Stop testing, fix immediately
- P1: Continue testing, fix soon
- P2/P3: Log for later

**Retest:**
- After each fix, retest the specific test case
- Run regression tests on related features
- Mark status as PASS once fixed

---

## ✅ You're Ready!

**Files created:** All 10 CSV test sheets + master plan  
**Total test cases:** 223  
**Estimated time:** 1 week full-time testing + fixes  

**Next step:** Compile CSVs into Excel, then start testing!

**Good luck! 🚀**
