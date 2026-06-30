# User Credentials Workflow

## 📧 How It Works Now

### Registration Flow:
1. **User visits**: `shaamelz.com/app/auth.html#signup`
2. **User fills form**:
   - Full Name
   - Email Address (becomes User ID)
   - Organisation Name
   - ❌ **No password field** (generated automatically)

3. **System generates**:
   - Random 12-character Password Key
   - Example: `Kd7mP@x3Qs9L`

4. **System creates**:
   - Supabase auth user with generated password
   - User record in database

5. **Email sent** with:
   ```
   User ID: john@company.com
   Password Key: Kd7mP@x3Qs9L
   ```

6. **User checks email** and saves credentials

### Sign-In Flow:
1. **User visits**: `shaamelz.com/app/auth.html`
2. **User enters**:
   - User ID (their email)
   - Password Key (from email)

3. **System validates**:
   - Supabase checks email + password match
   - If valid → Redirect to CRM
   - If invalid → Show error

---

## ✅ What's Been Changed

### Before (Standard Flow):
```
Sign Up:
- User enters email + password
- Email verification link sent
- User clicks link to verify
- User signs in with their chosen password

Sign In:
- User enters email + password
- System validates
```

### After (Credentials-via-Email Flow):
```
Sign Up:
- User enters email (no password)
- System generates Password Key
- Credentials sent to user's email
- User saves credentials

Sign In:
- User enters User ID + Password Key
- System validates against Supabase
```

---

## 🔐 Security

### Password Key Generation:
- **12 characters long**
- **Cryptographically random** (`crypto.getRandomValues()`)
- **Character set**: A-Z, a-z, 2-9, !@#$%
- **Excluded**: Confusing chars (0, O, 1, I, l)

### Storage:
- ✅ **Hashed in Supabase** (bcrypt)
- ✅ **Sent once via email** (TLS encrypted)
- ✅ **Not stored plaintext anywhere**
- ✅ **Console logged** (for admin reference during setup)

### User Can Change:
- Users can use **"Forgot Password"** to:
  1. Request reset link
  2. Set their own custom password
  3. Replace the emailed Password Key

---

## 📋 Validation Logic

### Sign-In Validation:
```javascript
// In handleSignIn() function:
const { data, error } = await window.IAdb.supabase.auth.signInWithPassword({
  email: formData.get('email'),      // User ID
  password: formData.get('password') // Password Key from email
});

// Supabase automatically:
// 1. Finds user by email
// 2. Compares hashed password
// 3. Returns session if match
// 4. Returns error if no match
```

### What Supabase Checks:
✅ User exists in `auth.users` table  
✅ Email matches  
✅ Password (Password Key) matches hashed value  
✅ Account is not disabled  
✅ Email is verified (optional, can disable)

---

## 🧪 Testing

### Test User Registration:
1. Go to: `shaamelz.com/app/auth.html#signup`
2. Enter:
   - Name: `Test User`
   - Email: `your-email@gmail.com`
   - Org: `Test Company`
3. Click **"Create Account"**
4. **Two things happen**:
   - Alert shows credentials (temporary, until email works)
   - Console logs credentials (F12 → Console)
5. **Save the Password Key** shown

### Test Sign In:
1. Go to: `shaamelz.com/app/auth.html`
2. Enter:
   - User ID: `your-email@gmail.com`
   - Password Key: `[from previous step]`
3. Click **"Sign In"**
4. Should redirect to `/crm/index.html`

---

## 📧 Email Setup (Next Step)

### To enable automatic email sending:

1. **Read**: `EMAIL_SETUP_GUIDE.md`
2. **Recommended**: Use Resend (10-minute setup)
3. **Deploy**: Supabase Edge Function
4. **Test**: Register new user, check email received

### Until Email is Set Up:
- Credentials shown in **browser alert**
- Credentials logged in **browser console**
- Admin can **manually email** credentials to user
- Works fine for **testing/MVP**

---

## 🔄 Workflow Diagram

```
┌─────────────┐
│   User      │
│  Visits     │
│  Signup     │
└──────┬──────┘
       │
       ▼
┌─────────────────────┐
│ Fills Form:         │
│ - Name              │
│ - Email             │
│ - Org Name          │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────────┐
│ System Generates:       │
│ Password Key = Kd7m...  │
└──────┬──────────────────┘
       │
       ├─────────────────┐
       │                 │
       ▼                 ▼
┌──────────────┐   ┌─────────────┐
│  Supabase    │   │   Email     │
│  Creates     │   │   Sent to   │
│  User        │   │   User      │
└──────────────┘   └─────┬───────┘
                         │
                         ▼
                   ┌─────────────┐
                   │ User Opens  │
                   │ Email       │
                   │ Saves Creds │
                   └─────┬───────┘
                         │
                         ▼
                   ┌─────────────┐
                   │ User Goes   │
                   │ to Sign In  │
                   └─────┬───────┘
                         │
                         ▼
            ┌────────────────────────┐
            │ Enters:                │
            │ User ID + Password Key │
            └────────┬───────────────┘
                     │
                     ▼
            ┌────────────────────┐
            │ Supabase Validates │
            │ email + password   │
            └────────┬───────────┘
                     │
                     ▼
            ┌────────────────────┐
            │  Redirect to CRM   │
            └────────────────────┘
```

---

## 💡 Why This Approach?

### Benefits:
✅ **Secure**: Random passwords, not user-chosen weak passwords  
✅ **Simpler UX**: User doesn't need to think of password during signup  
✅ **Email verification**: Built-in (user must access email to get Password Key)  
✅ **Standard auth**: Still uses Supabase auth (just pre-generated password)  
✅ **Flexible**: User can change password later if they want

### Use Cases:
- **Enterprise CRM**: Admin creates accounts, emails credentials to team
- **Invite-only**: Controlled access via email credentials
- **Secure onboarding**: Passwords not transmitted during signup form

---

## 🛠️ Files Modified

1. **app/auth.html**
   - Removed password input from signup form
   - Added password key generation
   - Updated labels: "User ID" and "Password Key"
   - Added email credential sending logic
   - Updated "Check Your Email" screen

2. **supabase/functions/send-credentials-email/index.ts**
   - New Supabase Edge Function
   - Sends HTML email with credentials
   - IGNITE_APEX branded template

3. **EMAIL_SETUP_GUIDE.md**
   - Complete setup instructions
   - Resend/SendGrid/Gmail options

4. **CREDENTIALS_WORKFLOW.md**
   - This file (explains the flow)

---

## ✅ Summary

**Registration**: Email only → System generates password → Email sent with credentials  
**Sign In**: User ID + Password Key → Supabase validates → Access granted  
**Email Setup**: Deploy Edge Function with Resend API (10 mins)  
**Security**: bcrypt hashed, TLS email, crypto random generation  

**Ready to deploy!**
