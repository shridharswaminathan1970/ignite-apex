# ✅ REGISTRATION WORKFLOWS - DEPLOYED

**Date:** 2026-06-25  
**Deploy:** 6a3d463c334910587c093a6b

---

## 👑 **USER HIERARCHY**

### **Level 1: Super Duper Admin**
- **Email:** muhammad.shaamel@gmail.com
- **Role:** `super_duper_admin`
- **Powers:**
  - Approves ALL registration requests (individual & company)
  - Creates company accounts
  - Creates company Super Admins
  - Full system access

### **Level 2: Company Super Admin**
- **Example:** shridhar.swaminathan1970@gmail.com (Demo Company)
- **Role:** `super_admin`
- **Powers:**
  - Manages users in THEIR company only
  - Manages teams in THEIR company only
  - Cannot approve registrations
  - Cannot create other companies

### **Level 3: Company Users**
- **Roles:** `admin`, `manager`, `user`
- Belong to specific company
- Managed by their Company Super Admin

---

## 🚀 **TWO REGISTRATION WORKFLOWS**

### **Workflow A: Individual Public User (Free Trial)**

**URL:** https://shaamelz.com/app/register.html

**User Journey:**
1. User fills form:
   - Full Name
   - Email
   - Phone Number
   - Country
   - Company (defaults to "NA" if left blank)
2. Clicks "Request Account"
3. Request saved to `registration_requests` table (status: pending)
4. Email sent to **Super Duper Admin:** muhammad.shaamel@gmail.com
5. **You approve** → User gets password-set email link
6. User sets password → Auto-login to shaamelz.com
7. User gets:
   - ✅ Sales OS (free forever)
   - ✅ CRM (99-day trial)
   - Company = "NA"

**Database Table:** `registration_requests`

**Access:**
- ✅ Sales OS: Immediate
- ✅ CRM: 99-day trial (then requires Paddle subscription)
- ❌ B2B0: Not included (must purchase separately)

---

### **Workflow B: Enterprise Company**

**URL:** https://shaamelz.com/app/register-company.html

**Company Rep Submits:**
1. **Company Information:**
   - Company Name
   - Address
   - Contact URL
   - Phone

2. **Senior Manager:**
   - Name
   - Designation
   - Email
   - Phone

3. **Company Super Admin:**
   - Name
   - Email
   - Phone

4. **Users (Optional):**
   - User Name
   - User Role
   - Reports To
   - Team

5. **Teams (Optional):**
   - Team Name
   - Team Manager

6. Clicks "Submit Registration Request"
7. Request saved to `company_registration_requests` table (status: pending)
8. Email sent to **Super Duper Admin:** muhammad.shaamel@gmail.com
9. **You approve** → You manually create:
   - Company organization
   - Company Super Admin account
   - All users
   - All teams
10. Company Super Admin gets invite email
11. Company Super Admin manages their company

**Database Table:** `company_registration_requests`

**Access:**
- Company chooses subscription plan
- All users under company subscription
- Managed by Company Super Admin

---

## 📊 **DATABASE TABLES**

### **registration_requests** (Individual Users)
```sql
CREATE TABLE registration_requests (
  id UUID PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT NOT NULL,
  country TEXT NOT NULL,
  company TEXT DEFAULT 'NA',
  status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  requested_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  approved_by UUID,
  rejection_reason TEXT
);
```

### **company_registration_requests** (Enterprise)
```sql
CREATE TABLE company_registration_requests (
  id UUID PRIMARY KEY,
  company_name TEXT NOT NULL,
  company_address TEXT NOT NULL,
  company_url TEXT,
  company_phone TEXT NOT NULL,
  senior_manager_name TEXT NOT NULL,
  senior_manager_designation TEXT NOT NULL,
  senior_manager_email TEXT NOT NULL,
  senior_manager_phone TEXT NOT NULL,
  super_admin_name TEXT NOT NULL,
  super_admin_email TEXT NOT NULL,
  super_admin_phone TEXT NOT NULL,
  users JSONB DEFAULT '[]',
  teams JSONB DEFAULT '[]',
  status TEXT DEFAULT 'pending',
  requested_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  approved_by UUID,
  rejection_reason TEXT
);
```

---

## 📧 **EMAIL NOTIFICATIONS**

### **Individual Registration → Super Duper Admin**
**To:** muhammad.shaamel@gmail.com  
**Subject:** New Individual Registration Request: [Name]

```
New IGNITE-APEX Registration Request

Name: John Doe
Email: john@example.com
Phone: +1 234 567 8900
Country: United States
Company: NA

To approve this request:
https://shaamelz.com/app/super-admin.html

Request ID: [uuid]
```

### **Company Registration → Super Duper Admin**
**To:** muhammad.shaamel@gmail.com  
**Subject:** New Company Registration Request: [Company Name]

```
New Enterprise Registration Request

Company: Acme Corporation
Senior Manager: John Smith (VP of Sales)
Email: john@acmecorp.com

Company Super Admin: Jane Doe
Email: jane@acmecorp.com

Users: 5
Teams: 2

To approve this request:
https://shaamelz.com/app/super-admin.html

Request ID: [uuid]
```

---

## 🔐 **PERMISSIONS & RLS**

### **registration_requests**
- `anon` role: Can INSERT (submit requests)
- `super_duper_admin`: Can SELECT, UPDATE (approve/reject)
- Company Super Admins: No access
- Regular users: No access

### **company_registration_requests**
- `anon` role: Can INSERT (submit requests)
- `super_duper_admin`: Can SELECT, UPDATE (approve/reject)
- Company Super Admins: No access
- Regular users: No access

---

## ✅ **DEPLOYED COMPONENTS**

| Component | Status | URL |
|-----------|--------|-----|
| Individual Registration Form | ✅ Live | https://shaamelz.com/app/register.html |
| Company Registration Form | ✅ Live | https://shaamelz.com/app/register-company.html |
| Database Tables | ✅ Created | `registration_requests`, `company_registration_requests` |
| Edge Function | ✅ Deployed | `notify-admin-registration` |
| Email Notifications | ⏳ TODO | Need to configure SendGrid/Resend |
| Super Duper Admin Panel | ⏳ TODO | Need to build approval UI |

---

## 🚀 **NEXT STEPS (For You - Super Duper Admin)**

### **1. Build Super Duper Admin Panel** (High Priority)

Create: `/app/super-admin.html`

**Features:**
- View pending individual registrations
- View pending company registrations
- Approve/Reject with one click
- Send password-set emails
- Create company accounts
- Manage all organizations

### **2. Configure Email Service** (High Priority)

Options:
- SendGrid (recommended)
- Resend
- Amazon SES
- Postmark

**Needed for:**
- Registration notifications to you
- Password-set links to approved users
- Rejection notifications

### **3. Test Workflows**

**Test Individual Registration:**
1. Go to: https://shaamelz.com/app/register.html
2. Fill form (use test email)
3. Submit
4. Check your email: muhammad.shaamel@gmail.com
5. Approve in Super Duper Admin panel
6. User receives password-set link
7. User logs in → Gets Sales OS + 99-day CRM trial

**Test Company Registration:**
1. Go to: https://shaamelz.com/app/register-company.html
2. Fill complete company form
3. Submit
4. Check your email: muhammad.shaamel@gmail.com
5. Manually create company account
6. Company Super Admin gets invite
7. Company Super Admin manages their users

---

## 📝 **KEY DIFFERENCES**

| Aspect | Individual | Company |
|--------|-----------|---------|
| **URL** | `/app/register.html` | `/app/register-company.html` |
| **Company** | "NA" (no company) | Named company |
| **Approval** | You approve → Password-set email | You create full account |
| **Trial** | Sales OS (free) + CRM (99 days) | Company chooses plan |
| **Management** | Self-managed | Company Super Admin manages |
| **Users** | 1 (individual) | Multiple (team) |

---

## ✅ **SUMMARY**

**What's Live:**
- ✅ Individual registration form
- ✅ Company registration form
- ✅ Database tables
- ✅ Edge Function (notifications)
- ✅ RLS policies

**What's Next:**
- ⏳ Build Super Duper Admin approval panel
- ⏳ Configure email service
- ⏳ Test both workflows end-to-end

**Your Email:** muhammad.shaamel@gmail.com (Super Duper Admin)  
**Your Role:** Approve ALL registrations (individual & company)

---

**All workflows deployed and ready for testing!** 🎉
