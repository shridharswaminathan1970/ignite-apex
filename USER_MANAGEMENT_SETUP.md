# User Management System Setup

## 🎯 Overview

Enterprise-grade user management with role hierarchy:
- **Super Duper Admin** (Platform Owner) - You only
- **Company Admin** (Super Admin) - One per company  
- **Management** (Executive View-only) - Company-wide reports
- **Admin** - Team leaders
- **Manager** - Team managers
- **Rep** - Sales reps

---

## 📋 Step 1: Run Database Migration

**Important:** You must run this in Supabase SQL Editor

1. Go to: https://supabase.com/dashboard/project/gokslnrvxqledagcwghq/sql/new
2. Open file: `supabase/migrations/006_user_management_hierarchy.sql`
3. Copy ALL the SQL code
4. Paste into Supabase SQL Editor
5. Click "Run"

**What this migration does:**
- ✅ Adds new columns to `users` table (is_super_duper_admin, manager_id, team_name, created_by)
- ✅ Creates `user_invitations` table for admin-created users
- ✅ Creates your 2 super duper admin accounts:
  - `shaamel@shaamelz.com`
  - `muhammad.shaamel@gmail.com` (password: r1ngad1ngaR0535!)
- ✅ Sets up RLS policies for role hierarchy
- ✅ Creates helper functions

---

## 🔐 Step 2: Set Up Super Duper Admin Password

**For shaamel@shaamelz.com:**

Since the migration sets a placeholder password, you'll need to set the real password:

### Option A: Via Supabase Dashboard (Easiest)
1. Go to: https://supabase.com/dashboard/project/gokslnrvxqledagcwghq/auth/users
2. Find user: `shaamel@shaamelz.com`
3. Click "..." → "Reset Password"
4. Copy the reset link and open it
5. Set your password

### Option B: Via SQL (If auth user doesn't exist yet)
```sql
-- Create auth user for shaamel@shaamelz.com
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token
)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  (SELECT id FROM public.users WHERE email = 'shaamel@shaamelz.com'),
  'authenticated',
  'authenticated',
  'shaamel@shaamelz.com',
  crypt('YourPasswordHere123!', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"name":"Shaamel"}'::jsonb,
  now(),
  now(),
  ''
)
ON CONFLICT (id) DO UPDATE SET
  encrypted_password = crypt('YourPasswordHere123!', gen_salt('bf')),
  email_confirmed_at = now();
```

---

## 🚀 Step 3: Test Login

1. Go to: https://shaamelz.com
2. Click: "Launch App"
3. Click: "CRM" card
4. Login as: `muhammad.shaamel@gmail.com`
5. Password: `r1ngad1ngaR0535!`
6. ✅ Should see CRM Dashboard
7. ✅ Should see "👤 Users" link in navigation
8. Click "👤 Users" → Should see User Management panel

---

## 👥 Step 4: How to Create New Users

### As Super Duper Admin (You):
1. Login to CRM
2. Click "👤 Users" in top nav
3. Click "+ Invite User"
4. Fill in:
   - Email
   - First Name, Last Name
   - **Role:**
     - **Company Admin** - For company super admins (they can create users too)
     - **Management** - For executives (view-only, no user creation)
     - **Admin** - For team leaders
     - **Manager** - For managers
     - **Sales Rep** - For sales reps
   - Team Name (optional, for non-admins)
   - Manager (optional, for hierarchy)
5. Click "Send Invitation"
6. ✅ User receives email with temp password
7. ✅ User can login and change password

### As Company Admin:
- Same process as above
- **Cannot** create other Company Admins (only Super Duper Admin can)
- Can create: Management, Admin, Manager, Rep

### As Admin/Manager:
- Can only create: Manager, Rep
- Cannot create Company Admin or Management

---

## 🔒 Security Features

### ✅ No Public Registration
- Removed "Create account" button from login page
- Shows message: "Contact your company administrator"
- **Only admins can create users**

### ✅ Role Hierarchy (Top to Bottom)
1. **Super Duper Admin** - Platform owners (you + Muhammad)
2. **Company Admin** - Company super admin (created by Super Duper Admin)
3. **Management** - Executives (view-only, created by Company Admin)
4. **Admin** - Team leaders (created by Company Admin)
5. **Manager** - Team managers (created by Admin+)
6. **Rep** - Sales reps (created by Manager+)

### ✅ Data Access (RLS)
- **Super Duper Admin**: See ALL users across ALL companies
- **Company Admin**: See all users in their company only
- **Management**: See all users in their company (view-only)
- **Admin/Manager**: See their team members only
- **Rep**: See only themselves

### ✅ User Management Permissions
- **Super Duper Admin**: Can create Company Admins
- **Company Admin**: Can create Management, Admin, Manager, Rep
- **Management**: View-only (no user creation)
- **Admin**: Can create Manager, Rep
- **Manager**: Can create Rep
- **Rep**: No user management access

---

## 📊 User Management Panel Features

### Stats Dashboard
- Total Users
- Active Users  
- Pending Invites
- Teams

### User Table
Shows all users with:
- Name, Email, Avatar
- Role badge (color-coded)
- Team assignment
- Manager (for hierarchy)
- Status (Active/Inactive)
- Created date
- Actions (Edit, Activate/Deactivate)

### Search & Filter
- Search by name, email, team
- Real-time filtering

### User Actions
- **Invite User** - Send email with credentials
- **Edit User** - Change role, team, manager
- **Activate/Deactivate** - Enable/disable login

---

## 🎨 Role Badge Colors

Visual indicators in UI:
- 🟣 **Platform Admin** (Super Duper) - Purple
- 🟠 **Company Admin** - Amber/Orange
- 🔵 **Management** - Blue
- 🟢 **Admin** - Green
- 🟢 **Manager** - Light Green
- ⚪ **Sales Rep** - Gray

---

## 📧 Invitation Email Flow

When admin invites a user:
1. ✅ System creates auth user with temp password
2. ✅ System creates user record with role, team, manager
3. ✅ System generates random temp password (12 chars)
4. ✅ Console logs: Email + Temp Password (for now)
5. 🔜 Later: Send actual email via SendGrid/Resend

**For now:** Admin sees temp password in browser console and must share it manually.

**Future:** Automated email with:
```
Subject: Welcome to IGNITE_APEX CRM

Hi [Name],

You've been invited to join IGNITE_APEX CRM by [Admin Name].

Login: https://shaamelz.com
Email: [email]
Temporary Password: [temp_password]

Please change your password after first login.

Team: [team_name]
Role: [role]
Manager: [manager_name]
```

---

## 🧪 Testing Checklist

### ✅ Super Duper Admin Tests
1. Login as muhammad.shaamel@gmail.com
2. Navigate to Users page
3. See all users across all companies
4. Invite a Company Admin
5. Verify Company Admin option is visible
6. Check user receives temp password in console

### ✅ Company Admin Tests
1. Login as company admin (created by Super Duper)
2. Navigate to Users page
3. See only users in their company
4. Company Admin option should NOT be visible
5. Can create: Management, Admin, Manager, Rep
6. Cannot see users from other companies

### ✅ Management Tests
1. Login as Management user
2. Navigate to Users page
3. See all company users (view-only)
4. "Invite User" button should be hidden
5. Can view reports, dashboards, all data

### ✅ Admin Tests
1. Login as Admin user
2. Navigate to Users page
3. See their team members only
4. Can invite: Manager, Rep only
5. Cannot create: Company Admin, Management

### ✅ Rep Tests
1. Login as Sales Rep
2. "👤 Users" link should NOT appear
3. Trying to access /admin/users.html directly → "Access denied" redirect
4. Can only see own data (leads, opportunities)

---

## 🚨 Important Notes

### ⚠️ Hardcoded Super Duper Admins
Only these 2 emails can be Super Duper Admins (hardcoded in migration):
- shaamel@shaamelz.com
- muhammad.shaamel@gmail.com

**Cannot be changed without database migration.**

### ⚠️ First Company Admin
After running migration:
1. Login as Super Duper Admin
2. Create first Company Admin for each company
3. That Company Admin can then create their team

### ⚠️ Email Service (TODO)
Currently temp passwords show in browser console only.
Need to integrate:
- SendGrid, or
- Resend, or
- AWS SES

For automated invitation emails.

---

## 🔧 Files Created/Modified

### New Files:
1. `supabase/migrations/006_user_management_hierarchy.sql` - Database schema
2. `crm/admin/users.html` - User management UI
3. `USER_MANAGEMENT_SETUP.md` - This guide

### Modified Files:
1. `app/auth.html` - Removed public registration
2. `crm/index.html` - Added Users link in nav

---

## 📞 Support

If you encounter issues:
1. Check Supabase logs for errors
2. Verify migration ran successfully
3. Check RLS policies are enabled
4. Verify user roles in database

**Common Issues:**
- "Access denied" → User role not authorized
- "Cannot create user" → Check RLS policies
- "Super Duper Admin not found" → Re-run migration
- "Password incorrect" → Reset via Supabase dashboard

---

## ✅ Ready to Deploy!

Once migration is run and tested:
```bash
cd C:/Projects/ignite-apex
netlify deploy --prod --dir=.
```

🎉 **User management system is live!**
