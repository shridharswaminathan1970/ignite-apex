# 📋 IGNITE-APEX TEST SUITE

**Version:** 1.0  
**Date:** 2026-06-26  
**Total Tests:** 147 test cases across 10 categories

---

## 📁 **STRUCTURE**

This test suite covers all features built in the B → C → A → D implementation:

### **Test Sheets:**

| # | Sheet Name | Category | Tests | Priority | Focus Area |
|---|------------|----------|-------|----------|------------|
| 00 | INDEX | Overview | - | - | Test suite index |
| 01 | Registration Workflows | Onboarding | 12 | Critical | User & company registration |
| 02 | Authentication & Authorization | Security | 10 | Critical | Login, logout, role-based access |
| 03 | B2B0 Module Integration | Feature | 15 | High | B2B0 independent entitlement |
| 04 | Trial Reminder System | Automation | 18 | High | Day 90/120/130/140 reminders |
| 05 | Paddle Checkout Flow | Payment | 20 | Critical | Checkout, webhooks, subscriptions |
| 06 | Email Service | Communication | 14 | High | Resend integration, templates |
| 07 | Launcher & Module Gates | UI/Access | 16 | High | Module cards, lock/unlock |
| 08 | CRM Access & Trial Activation | Feature | 14 | Critical | CRM trial workflow |
| 09 | Admin Panel Functions | Admin | 16 | Critical | Super Duper Admin operations |
| 10 | Database Integrity | Data | 12 | Critical | Schema, RLS, constraints |

**Total:** 147 test cases

---

## 🔄 **CONVERTING CSV TO EXCEL WORKBOOK**

### **Method 1: Microsoft Excel (Recommended)**

1. **Open Excel:**
   - Launch Microsoft Excel

2. **Import First Sheet:**
   - File → Open
   - Navigate to `C:\Projects\ignite-apex\test-suite\`
   - Select `00_INDEX.csv`
   - Opens as new workbook

3. **Add Remaining Sheets:**
   For each CSV file (01-10):
   - Right-click sheet tabs → Insert → Worksheet
   - Rename sheet (e.g., "01_Registration_Workflows")
   - Data → From Text/CSV
   - Select CSV file (e.g., `01_Registration_Workflows.csv`)
   - Load data
   - Repeat for all 10 sheets

4. **Format Workbook:**
   - Select all sheets: Ctrl+Click each tab
   - Format → AutoFit column widths
   - Format → Freeze top row (Header row)
   - Format → Apply table style
   - Add filters to header row

5. **Save as .xlsx:**
   - File → Save As
   - Name: `IGNITE_APEX_TEST_SUITE.xlsx`
   - Type: Excel Workbook (.xlsx)

### **Method 2: PowerShell Script (Automated)**

Create `convert-csv-to-excel.ps1`:

```powershell
# Install Excel module (one-time)
# Install-Module -Name ImportExcel -Force

# Load module
Import-Module ImportExcel

# Set paths
$csvFolder = "C:\Projects\ignite-apex\test-suite"
$outputFile = "C:\Projects\ignite-apex\IGNITE_APEX_TEST_SUITE.xlsx"

# Remove old file if exists
if (Test-Path $outputFile) { Remove-Item $outputFile }

# Import each CSV as a sheet
$csvFiles = Get-ChildItem -Path $csvFolder -Filter "*.csv" | Sort-Object Name

foreach ($file in $csvFiles) {
  $sheetName = $file.BaseName
  $data = Import-Csv $file.FullName
  
  $data | Export-Excel -Path $outputFile `
    -WorksheetName $sheetName `
    -AutoSize `
    -FreezeTopRow `
    -BoldTopRow `
    -TableStyle Medium6
}

Write-Host "✅ Excel workbook created: $outputFile"
```

Run:
```powershell
.\convert-csv-to-excel.ps1
```

### **Method 3: Python Script (Cross-Platform)**

Create `convert_csv_to_excel.py`:

```python
import pandas as pd
import os
from pathlib import Path

# Set paths
csv_folder = Path("C:/Projects/ignite-apex/test-suite")
output_file = Path("C:/Projects/ignite-apex/IGNITE_APEX_TEST_SUITE.xlsx")

# Get all CSV files sorted
csv_files = sorted(csv_folder.glob("*.csv"))

# Create Excel writer
with pd.ExcelWriter(output_file, engine='openpyxl') as writer:
    for csv_file in csv_files:
        # Read CSV
        df = pd.read_csv(csv_file)
        
        # Get sheet name (remove number prefix and extension)
        sheet_name = csv_file.stem.replace("_", " ")
        if len(sheet_name) > 31:  # Excel sheet name limit
            sheet_name = sheet_name[:31]
        
        # Write to Excel
        df.to_excel(writer, sheet_name=sheet_name, index=False)
        
        # Format worksheet
        worksheet = writer.sheets[sheet_name]
        for column in worksheet.columns:
            max_length = 0
            column = [cell for cell in column]
            for cell in column:
                try:
                    if len(str(cell.value)) > max_length:
                        max_length = len(cell.value)
                except:
                    pass
            adjusted_width = (max_length + 2)
            worksheet.column_dimensions[column[0].column_letter].width = adjusted_width

print(f"✅ Excel workbook created: {output_file}")
```

Run:
```bash
pip install pandas openpyxl
python convert_csv_to_excel.py
```

---

## 📊 **TEST EXECUTION WORKFLOW**

### **Phase 1: Pre-Deployment Tests (Before going live)**

Run tests: **DB-001 through DB-012** (Database Integrity)
- Verify schema
- Check constraints
- Validate RLS policies
- Ensure data consistency

### **Phase 2: Deployment Tests (During deployment)**

Follow `DEPLOYMENT_INSTRUCTIONS.md`:
1. Deploy migrations
2. Configure secrets (Resend, Paddle)
3. Deploy Edge Functions
4. Schedule cron jobs
5. Configure webhooks

### **Phase 3: Smoke Tests (Immediately after deployment)**

Run critical tests:
- **EMAIL-004:** Send test email
- **TRIAL-001:** Check reminders column
- **PADDLE-001:** Verify SDK loaded
- **B2B0-001:** B2B0 card visible
- **LAUNCH-001:** Launcher loads

### **Phase 4: Functional Tests (Comprehensive validation)**

Execute all test sheets in order (01 → 10):
- 01: Registration workflows
- 02: Authentication
- 03: B2B0 integration
- 04: Trial reminders
- 05: Paddle checkout
- 06: Email service
- 07: Launcher gates
- 08: CRM access
- 09: Admin panel
- 10: Database integrity

### **Phase 5: End-to-End User Journeys**

**Journey A: Individual User (Sales OS + CRM Trial)**
1. REG-001: Register
2. ADMIN-004: Admin approves
3. EMAIL-007: Welcome email received
4. REG-010: Set password
5. AUTH-001: Login
6. LAUNCH-001: View launcher
7. CRM-001: Redirect to activation
8. CRM-003: Activate trial
9. CRM-005: Access CRM
10. TRIAL-002: Day 90 popup (after 90 days)
11. PADDLE-006: Purchase subscription

**Journey B: B2B0 Only User (No CRM)**
1. Register & approve
2. PADDLE-017: Purchase B2B0
3. B2B0-006: Verify independent access
4. B2B0-007: Access B2B0 module

**Journey C: Enterprise Company**
1. REG-005: Company registration
2. ADMIN-007: Admin approves company
3. EMAIL-012: Admin notification
4. CRM-014: Users inherit company subscription

---

## ✅ **TRACKING TEST RESULTS**

### **Column Usage:**

- **Test ID:** Unique identifier (e.g., REG-001)
- **Test Name:** Descriptive name
- **Test Type:** Functional / UI / Database / Security / Performance / Negative / Integration
- **Preconditions:** What must be true before test
- **Steps:** Numbered steps to execute
- **Expected Result:** What should happen
- **Actual Result:** What actually happened (fill during test)
- **Status:** Pending / Pass / Fail / Blocked / Skipped
- **Priority:** Critical / High / Medium / Low
- **Notes:** Additional context, bugs found, etc.

### **Status Values:**

- **Pending:** Not yet tested
- **Pass:** ✅ Test passed as expected
- **Fail:** ❌ Test failed, see Actual Result
- **Blocked:** Cannot test due to dependency
- **Skipped:** Intentionally not tested

### **Best Practices:**

1. **Test in Order:** Follow sheet sequence (01 → 10)
2. **Document Everything:** Fill Actual Result even if passed
3. **Screenshot Failures:** Attach screenshots for failed tests
4. **Log Bugs:** Create bug tickets for failures
5. **Retest After Fixes:** Mark as "Pass (Retest)" after bug fix
6. **Track Coverage:** Calculate % tests passed

---

## 🐛 **BUG REPORTING TEMPLATE**

When a test fails, create bug report:

```
Bug ID: BUG-XXX
Test Case: [Test ID] Test Name
Severity: Critical / High / Medium / Low
Priority: P0 / P1 / P2 / P3

Steps to Reproduce:
1. [Copy from test steps]
2. ...

Expected Result:
[From test case]

Actual Result:
[What happened]

Screenshots:
[Attach]

Environment:
- Browser: Chrome 130
- OS: Windows 11
- User Role: Admin
- Database: Production / Staging

Notes:
[Additional context]
```

---

## 📈 **METRICS & REPORTING**

### **Test Coverage:**

```
Total Tests: 147
Tests Run: [X]
Tests Passed: [Y]
Tests Failed: [Z]
Pass Rate: [Y/X * 100]%
```

### **Critical Tests:**

Count tests marked **Priority: Critical**
- Must achieve 100% pass rate before production launch
- Any critical test failure = deployment blocker

### **Test Execution Time:**

Estimate:
- Database tests: ~1 hour
- Registration flows: ~2 hours
- Payment/Paddle: ~3 hours (includes sandbox testing)
- Email service: ~1 hour
- Admin functions: ~2 hours
- End-to-end journeys: ~4 hours

**Total:** ~13-15 hours for full test suite execution

---

## 🔗 **RELATED DOCUMENTATION**

- `DEPLOYMENT_INSTRUCTIONS.md` - Deployment steps
- `B2B0_DEPLOYMENT_COMPLETE.md` - B2B0 architecture
- `TRIAL_REMINDER_SYSTEM_COMPLETE.md` - Trial reminders
- `PADDLE_CHECKOUT_TEST_GUIDE.md` - Paddle testing
- `EMAIL_SERVICE_COMPLETE.md` - Email configuration

---

## ✅ **READY TO TEST**

1. Convert CSVs to Excel workbook (see methods above)
2. Follow deployment instructions
3. Execute tests in order
4. Document results
5. Report bugs
6. Retest fixes
7. Achieve 100% critical test pass rate
8. Launch! 🚀

**Test suite created:** 2026-06-26  
**Last updated:** 2026-06-26
