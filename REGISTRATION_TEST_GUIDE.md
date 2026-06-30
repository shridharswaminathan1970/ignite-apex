# 🧪 REGISTRATION WORKFLOWS - COMPLETE TEST GUIDE

**Date:** 2026-06-25  
**Your Role:** Super Duper Admin (muhammad.shaamel@gmail.com)

---

## ⚙️ **SETUP (Do This First)**

### **Step 1: Set Your Role to Super Duper Admin**

1. Go to: https://supabase.com/dashboard/project/gokslnrvxqledagcwghq/sql

2. Run this SQL:

```sql
-- Add super_duper_admin role and set your account
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'super_duper_admin'
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
  ) THEN
    ALTER TYPE user_role ADD VALUE 'super_duper_admin';
  END IF;
END $$;

UPDATE users
SET role = 'super_duper_admin'
WHERE email = 'muhammad.shaamel@gmail.com';
```

3. **Verify:** Run this to confirm:

```sql
SELECT email, role FROM users WHERE email = 'muhammad.shaamel@gmail.com';
```

**Expected:** Should show `super_duper_admin`

---

## 🧪 **TEST 1: INDIVIDUAL PUBLIC USER REGISTRATION**

### **Step 1: Submit Registration**

1. Open **incognito/private window** (to test as public user)

2. Go to: https://shaamelz.com/app/register.html

3. Fill in:
   ```
   Full Name: Test Individual User
   Email: test.user@example.com
   Phone Number: +1 234 567 8900
   Country: United States
   Company: [leave blank] (will default to "NA")
   ```

4. Click **"Request Account"**

5. **Expected:** Success message "Request Submitted! We've sent your registration request to our admin team."

### **Step 2: Check Database**

1. Go to: https://supabase.com/dashboard/project/gokslnrvxqledagcwghq/editor

2. Select `registration_requests` table

3. **Expected:** See your test request with:
   - full_name: "Test Individual User"
   - email: "test.user@example.com"
   - company: "NA"
   - status: "pending"

### **Step 3: Check Email Notification**

**Expected:** Email sent to `muhammad.shaamel@gmail.com` with:
- Subject: "New Individual Registration Request: Test Individual User"
- Contains: Name, Email, Phone, Country

**Note:** Email might not work yet if SendGrid/Resend not configured. Check Edge Function logs:
https://supabase.com/dashboard/project/gokslnrvxqledagcwghq/functions/notify-admin-registration/logs

### **Step 4: Approve in Admin Panel**

1. Go to: https://shaamelz.com/app/auth.html

2. Login as Super Duper Admin:
   - Email: muhammad.shaamel@gmail.com
   - Password: [your password]

3. Go to: https://shaamelz.com/app/admin.html

4. **Expected:** Default tab is **"Pending Registrations"**

5. **Expected:** See your test request:
   - Name: Test Individual User
   - Email: test.user@example.com
   - Company: NA
   - [Approve] [Reject] buttons

6. Click **"✓ Approve & Send Password Link"**

7. Confirm the prompt

8. **Expected:** 
   - Alert: "✓ Registration approved! Organization created (Company = NA), 99-day CRM trial activated"
   - Request disappears from list

### **Step 5: Verify in Database**

Run this SQL:

```sql
-- Check registration status
SELECT id, email, status, approved_at
FROM registration_requests
WHERE email = 'test.user@example.com';

-- Check organization created (Company = NA)
SELECT id, name, domain, status
FROM organisations
WHERE name = 'NA'
ORDER BY created_at DESC
LIMIT 1;

-- Check subscription created (99-day trial)
SELECT
  o.name as company,
  s.status,
  s.plan,
  s.trial_ends_at,
  s.crm_enabled,
  DATE_PART('day', s.trial_ends_at - now()) as days_remaining
FROM org_subscriptions s
JOIN organisations o ON s.org_id = o.id
WHERE o.name = 'NA'
ORDER BY s.created_at DESC
LIMIT 1;
```

**Expected:**
- registration_requests: status = "approved"
- organisations: Company "NA" created
- org_subscriptions: 99-day trial, crm_enabled = false (will be true after Paddle checkout)

### **Step 6: Send Password-Set Email (Manual)**

**Currently:** You must manually create the auth user in Supabase.

1. Go to: https://supabase.com/dashboard/project/gokslnrvxqledagcwghq/auth/users

2. Click "Add User"

3. Fill in:
   ```
   Email: test.user@example.com
   Password: [temporary password]
   Auto Confirm User: ✅ YES
   ```

4. User can now login at: https://shaamelz.com/app/auth.html

---

## 🧪 **TEST 2: ENTERPRISE COMPANY REGISTRATION**

### **Step 1: Submit Company Registration**

1. Open **incognito/private window**

2. Go to: https://shaamelz.com/app/register-company.html

3. Fill in **all fields:**

   **Company Information:**
   ```
   Company Name: Test Corporation
   Company Address: 123 Business St, Tech City, TC 12345
   Company URL: https://testcorp.example.com
   Company Phone: +1 555 123 4567
   ```

   **Senior Manager:**
   ```
   Name: John Smith
   Designation: VP of Sales
   Email: john.smith@testcorp.example
   Phone: +1 555 123 4568
   ```

   **Company Super Admin:**
   ```
   Name: Jane Doe
   Email: jane.doe@testcorp.example
   Phone: +1 555 123 4569
   ```

4. **(Optional) Add Users:**
   - Click "+ Add User"
   - Fill: Name, Role, Reports To, Team

5. **(Optional) Add Teams:**
   - Click "+ Add Team"
   - Fill: Team Name, Team Manager

6. Click **"Submit Registration Request"**

7. **Expected:** Success message

### **Step 2: Check Database**

1. Go to: https://supabase.com/dashboard/project/gokslnrvxqledagcwghq/editor

2. Select `company_registration_requests` table

3. **Expected:** See your test request with:
   - company_name: "Test Corporation"
   - senior_manager_name: "John Smith"
   - super_admin_name: "Jane Doe"
   - status: "pending"

### **Step 3: Approve in Admin Panel**

1. Go to: https://shaamelz.com/app/admin.html (already logged in)

2. Go to **"Pending Registrations"** tab

3. Scroll down to **"Enterprise Company Registration Requests"** section

4. **Expected:** See your test company request:
   - Company: Test Corporation
   - Senior Manager: John Smith
   - Company Super Admin: Jane Doe
   - Users: 0 (or count if you added)
   - Teams: 0 (or count if you added)

5. Click **"✓ Approve & Create Company"**

6. **Expected:** Redirected to "Provision Company" tab

7. **Manually create the company:**
   - Use the info from the request
   - Fill in Organization Name: "Test Corporation"
   - Super Admin Name: "Jane Doe"
   - Super Admin Email: "jane.doe@testcorp.example"
   - Click "Provision Company & Invite Super Admin"

8. **Expected:** Company created, Super Admin gets invite email

---

## ✅ **TEST 3: ACCESS CONTROL**

### **Test Super Duper Admin Access**

1. Login as: muhammad.shaamel@gmail.com

2. Go to: https://shaamelz.com/app/admin.html

3. **Expected tabs visible:**
   - ✅ Pending Registrations
   - ✅ Provision Company
   - ✅ Manage Team
   - ✅ Invite User

4. **Can view:**
   - ✅ All pending registrations (individual + company)
   - ✅ All organizations
   - ✅ All users across all companies

### **Test Company Super Admin Access**

1. Logout

2. Login as: shridhar.swaminathan1970@gmail.com (Demo Company)

3. Go to: https://shaamelz.com/app/admin.html

4. **Expected tabs visible:**
   - ❌ Pending Registrations (hidden)
   - ❌ Provision Company (hidden)
   - ✅ Manage Team
   - ✅ Invite User

5. **Can view:**
   - ✅ Only users in Demo Company
   - ❌ Cannot see other companies
   - ❌ Cannot approve registrations

---

## 🔍 **VERIFICATION SQL QUERIES**

### **Check All Pending Registrations**

```sql
-- Individual requests
SELECT
  full_name,
  email,
  company,
  status,
  requested_at
FROM registration_requests
WHERE status = 'pending'
ORDER BY requested_at DESC;

-- Company requests
SELECT
  company_name,
  super_admin_email,
  status,
  requested_at
FROM company_registration_requests
WHERE status = 'pending'
ORDER BY requested_at DESC;
```

### **Check Approved Registrations**

```sql
-- Individual approvals
SELECT
  r.email,
  r.status,
  r.approved_at,
  o.name as company,
  s.trial_ends_at
FROM registration_requests r
LEFT JOIN organisations o ON o.domain LIKE '%' || REPLACE(r.email, '@', '_at_') || '%'
LEFT JOIN org_subscriptions s ON s.org_id = o.id
WHERE r.status = 'approved'
ORDER BY r.approved_at DESC;
```

### **Check User Roles**

```sql
SELECT
  email,
  role,
  (SELECT name FROM organisations WHERE id = users.org_id) as company,
  status
FROM users
WHERE role IN ('super_duper_admin', 'super_admin')
ORDER BY
  CASE role
    WHEN 'super_duper_admin' THEN 1
    WHEN 'super_admin' THEN 2
  END;
```

---

## 📊 **EXPECTED TEST RESULTS**

| Test | Expected Result | Status |
|------|----------------|--------|
| Individual registration form loads | ✅ Form visible with all fields | |
| Company registration form loads | ✅ Form visible with sections | |
| Submit individual request | ✅ Saved to database | |
| Submit company request | ✅ Saved to database | |
| Email notification sent | ✅ Email to muhammad.shaamel@gmail.com | |
| Super Duper Admin sees "Pending Registrations" tab | ✅ Tab visible | |
| Individual request shows in list | ✅ Request displayed | |
| Company request shows in list | ✅ Request displayed | |
| Approve individual request | ✅ Org + subscription created | |
| Approve company request | ✅ Redirects to provision form | |
| Company Super Admin does NOT see registrations | ❌ Tab hidden | |
| RLS policies work | ✅ Anon can INSERT, only super_duper_admin can approve | |

---

## 🚨 **TROUBLESHOOTING**

### **Problem: Can't see "Pending Registrations" tab**

**Solution:**
1. Check your role:
   ```sql
   SELECT email, role FROM users WHERE email = 'muhammad.shaamel@gmail.com';
   ```
2. Should be `super_duper_admin`
3. If not, run `SET_SUPER_DUPER_ADMIN.sql`

### **Problem: Registration form shows error**

**Solution:**
1. Check RLS policies exist:
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'registration_requests';
   ```
2. Check tables exist:
   ```sql
   \dt registration*
   ```

### **Problem: Email not received**

**Solution:**
1. Check Edge Function logs:
   https://supabase.com/dashboard/project/gokslnrvxqledagcwghq/functions/notify-admin-registration/logs
2. Email service not configured yet (SendGrid/Resend)
3. Check database directly for pending requests

---

## ✅ **COMPLETE TEST CHECKLIST**

- [ ] Run `SET_SUPER_DUPER_ADMIN.sql` to set your role
- [ ] Test individual registration (incognito)
- [ ] Check database for pending request
- [ ] Login as Super Duper Admin
- [ ] See "Pending Registrations" tab
- [ ] Approve individual request
- [ ] Verify org + subscription created
- [ ] Test company registration (incognito)
- [ ] Check database for company request
- [ ] Approve company request
- [ ] Create company via "Provision Company"
- [ ] Test Company Super Admin access (should NOT see registrations)
- [ ] Run verification SQL queries

---

**Start with Step 1 (Setup) and work through each test!** 🚀
