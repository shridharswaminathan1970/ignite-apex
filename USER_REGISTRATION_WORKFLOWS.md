# User Registration Workflows - IGNITE-APEX

**Date:** 2026-06-25

---

## 🎯 **TWO REGISTRATION PATHS**

### **Path 1: Super Admin Creates User (Formal)**

**Who:** Super Admin proactively creates user account

**Steps:**
1. Super Admin logs into `/app/admin.html`
2. Goes to "User Management" section
3. Clicks "Add User"
4. Fills in:
   - Name
   - Email
   - Phone
   - Country
   - Company (can be existing org or new)
   - Role (admin, manager, user)
5. Clicks "Create & Send Invite"
6. System:
   - Creates user record
   - Sends invite email with password-set link
   - User clicks link → Sets password → Auto-login

**Use Case:** 
- Adding team members to existing organization
- Corporate/enterprise onboarding
- Formal invitation process

---

### **Path 2: Public Self-Registration (Informal)**

**Who:** Individual user discovers IGNITE-APEX and wants to try it

**Steps:**
1. User goes to `/app/register.html`
2. Fills in registration request:
   - Full Name
   - Email
   - Phone Number
   - Country
   - Company (optional - defaults to "NA" if blank)
3. Clicks "Request Account"
4. System:
   - Saves request to `registration_requests` table (status: 'pending')
   - Sends email to Super Admin (shridhar.swaminathan1970@gmail.com)
5. Super Admin receives email notification
6. Super Admin logs into `/app/admin.html`
7. Super Admin reviews request and decides:
   - **Approve** → User gets password-set email
   - **Reject** → User gets rejection email with reason
8. If approved:
   - User clicks password-set link
   - Sets password + confirms password
   - Auto-login → Redirected to https://shaamelz.com
9. User can start using Sales OS (free) immediately
10. To upgrade to CRM, user goes to `/pricing.html`

**Use Case:**
- Solo practitioners
- Individual sales reps
- SMB owners discovering the platform
- Self-service trial signups

---

## 📊 **KEY DIFFERENCES**

| Aspect | Path 1 (Formal) | Path 2 (Informal) |
|--------|----------------|------------------|
| **Initiated By** | Super Admin | Public user |
| **Default Company** | Admin assigns | "NA" (no company) |
| **Approval Required** | No (pre-approved) | Yes (Super Admin reviews) |
| **Use Case** | Enterprise/teams | Solo users/trials |
| **Access URL** | `/app/admin.html` | `/app/register.html` |

---

## 🗄️ **DATABASE SCHEMA**

### **registration_requests Table**

```sql
CREATE TABLE registration_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT NOT NULL,
  country TEXT NOT NULL,
  company TEXT DEFAULT 'NA',
  status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  requested_at TIMESTAMPTZ DEFAULT now(),
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES users(id),
  rejection_reason TEXT
);
```

**Workflow:**
- User submits → `status = 'pending'`
- Admin approves → `status = 'approved'`, `approved_at = now()`, `approved_by = admin_id`
- Admin rejects → `status = 'rejected'`, `rejection_reason = '...'`

---

## 📧 **EMAIL FLOW**

### **1. Registration Request Email (to Super Admin)**

**From:** noreply@shaamelz.com  
**To:** shridhar.swaminathan1970@gmail.com  
**Subject:** New Registration Request: [Name]

```
New IGNITE-APEX Registration Request

Name: John Doe
Email: john@example.com
Phone: +1 234 567 8900
Country: United States
Company: NA

To approve this request:
https://shaamelz.com/app/admin.html?pending_requests=true

Request ID: [uuid]
```

### **2. Password-Set Email (to User - After Approval)**

**From:** noreply@shaamelz.com  
**To:** [user email]  
**Subject:** Welcome to IGNITE-APEX - Set Your Password

```
Hi [Name],

Your IGNITE-APEX account has been approved!

Set your password to get started:
https://shaamelz.com/app/set-password.html?token=[token]

This link expires in 24 hours.

Questions? Reply to this email.
```

### **3. Rejection Email (to User - If Rejected)**

**From:** noreply@shaamelz.com  
**To:** [user email]  
**Subject:** IGNITE-APEX Registration Update

```
Hi [Name],

Unfortunately, we're unable to approve your registration request at this time.

Reason: [rejection reason]

If you have questions, please contact: support@shaamelz.com
```

---

## 🔐 **SECURITY & PERMISSIONS**

### **RLS Policies:**

1. **registration_requests table:**
   - `anon` role: Can INSERT (submit requests)
   - `super_admin`: Can SELECT, UPDATE (view and approve/reject)
   - Regular users: No access

2. **Super Admin Role:**
   - Only users with `role = 'super_admin'` can approve/reject requests
   - Your account: `shridhar.swaminathan1970@gmail.com`

---

## ✅ **CURRENT STATUS**

| Component | Status | Notes |
|-----------|--------|-------|
| `/app/register.html` | ✅ Updated | Added phone, country fields |
| `registration_requests` table | ⏳ Pending | Migration created, not run yet |
| Email notification | ⏳ Pending | Edge Function created, not deployed |
| Admin approval UI | ❌ Not built | Need to add to `/app/admin.html` |
| Password-set page | ✅ Exists | `/app/set-password.html` |

---

## 🚀 **NEXT STEPS TO COMPLETE**

1. **Run migration:**
   ```bash
   cd C:\Projects\ignite-apex
   supabase db push
   ```

2. **Deploy Edge Function:**
   ```bash
   supabase functions deploy notify-admin-registration
   ```

3. **Build Admin Approval UI** in `/app/admin.html`:
   - Section: "Pending Registration Requests"
   - Show: Name, Email, Phone, Country, Company, Date
   - Actions: [Approve] [Reject]
   - On Approve → Send password-set email via Supabase Auth

4. **Test Path 2 workflow:**
   - Go to `/app/register.html`
   - Submit request
   - Check email (Super Admin)
   - Approve in admin panel
   - User receives password-set email
   - User sets password → Auto-login

---

## 📝 **IMPORTANT NOTES**

- **Company = "NA"** for public self-registration (no company affiliation)
- **Super Admin email:** shridhar.swaminathan1970@gmail.com
- **Path 1 (formal)** bypasses approval - user is pre-approved by Super Admin
- **Path 2 (informal)** requires Super Admin review before user gets access
- Both paths end at same destination: User logged in at https://shaamelz.com

---

**CONFIRMED:** This is the correct workflow as per user requirements.
