# Debug: Unable to Create Lead

## Likely Issues:

### 1. **User Not Authenticated**
- Check: Is user logged in?
- Go to browser console (F12) and check for errors

### 2. **Missing org_id**
- The `users` table doesn't have `org_id` column
- But code expects `window.IAdb.orgId`
- Need to fix how we get org_id

### 3. **Missing currentUser**
- `window.IAdb.currentUser` might not be set
- Need to get user from Supabase session

---

## Quick Fix:

The issue is that `window.IAdb.orgId` is undefined because:
1. Your `users` table has: `id, name, email, role, created_at`
2. Your `users` table does NOT have `org_id` column
3. But the code is trying to use `window.IAdb.orgId`

**We need to get org_id from the organisations table instead.**

---

## SQL to Check User's Organisation:

Run this in Supabase SQL Editor:

```sql
-- Check current user
SELECT * FROM auth.users LIMIT 1;

-- Check organisations
SELECT * FROM organisations LIMIT 1;

-- Check if user is linked to organisation
SELECT u.*, o.id as org_id, o.name as org_name
FROM users u
LEFT JOIN organisations o ON u.id = o.id
WHERE u.email = 'shaame@shaamelz.com';
```

---

## Fix Options:

### Option A: Add org_id to users table
```sql
ALTER TABLE users ADD COLUMN org_id UUID REFERENCES organisations(id);
UPDATE users SET org_id = (SELECT id FROM organisations LIMIT 1);
```

### Option B: Update supabase-client.js to get org_id differently
- Get first organisation for user
- Store in window.IAdb.orgId on login

---

## Test in Browser Console:

Open https://shaamelz.com/crm/leads.html and run:

```javascript
console.log('User:', window.IAdb.currentUser);
console.log('Org ID:', window.IAdb.orgId);
console.log('Supabase:', window.IAdb.supabase);
```

If `orgId` is undefined, that's the issue!
