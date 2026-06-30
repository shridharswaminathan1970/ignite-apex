# 🐛 BUG FIX: REG-001 Registration Test Failing (PGRST204)

**Bug ID:** BUG-001  
**Test Case:** REG-001 (Individual User Registration)  
**Severity:** Critical (Blocking)  
**Status:** Fix Ready

---

## 📋 **ERROR DETAILS**

**Observed Behavior:**
- User fills registration form (`/app/register.html`)
- Clicks "Request Account"
- Receives HTTP 400 error

**Error Message:**
```
POST https://gokslnrvxqledagcwghq.supabase.co/rest/v1/registration_requests
HTTP/3 400 Bad Request

{
  "code": "PGRST204",
  "message": "Could not find the 'phone' column of 'registration_requests' in the schema cache"
}
```

**Root Cause:**
PostgREST's schema cache is stale. The table was recreated in migration `20260626000000_recreate_registration_tables.sql`, but PostgREST hasn't reloaded its cache to recognize the new schema.

---

## ✅ **IMMEDIATE FIX (3 Options)**

### **Option 1: Reload Schema Cache (FASTEST - 30 seconds)**

**Via Supabase Dashboard:**

1. **Go to SQL Editor:**
   - Login to https://supabase.com
   - Select project `gokslnrvxqledagcwghq`
   - Click "SQL Editor" in left sidebar

2. **Run this command:**
   ```sql
   NOTIFY pgrst, 'reload schema';
   ```

3. **Verify columns exist:**
   ```sql
   SELECT column_name, data_type
   FROM information_schema.columns
   WHERE table_schema = 'public'
     AND table_name = 'registration_requests'
   ORDER BY ordinal_position;
   ```

   **Expected output should include:**
   - `phone` (text)
   - `country` (text)
   - All other columns

4. **Test again:**
   - Go back to `/app/register.html`
   - Fill form and submit
   - Should work now

---

### **Option 2: Restart PostgREST (if Option 1 doesn't work)**

**Via Supabase Dashboard:**

1. Go to Project Settings
2. Navigate to "Database" → "Connection Pooling"
3. Toggle connection pooling off, then on
4. Wait 10-20 seconds for restart
5. Test registration again

---

### **Option 3: Recreate Table (if columns actually missing)**

**⚠️ WARNING: Only use if columns are confirmed missing in database!**

1. **Backup existing data (if any):**
   ```sql
   SELECT * FROM registration_requests;
   -- Save results
   ```

2. **Run full recreation script:**
   - Open `EMERGENCY_FIX_SCHEMA_CACHE.sql`
   - Uncomment the CREATE TABLE section
   - Run in SQL Editor

3. **Reload schema:**
   ```sql
   NOTIFY pgrst, 'reload schema';
   ```

---

## 🧪 **VERIFICATION STEPS**

After applying the fix:

1. **Verify Schema in Database:**
   ```sql
   \d registration_requests
   -- OR
   SELECT column_name FROM information_schema.columns
   WHERE table_name = 'registration_requests';
   ```

2. **Test API Endpoint Directly:**
   ```bash
   curl -X POST 'https://gokslnrvxqledagcwghq.supabase.co/rest/v1/registration_requests' \
     -H 'apikey: YOUR_ANON_KEY' \
     -H 'Content-Type: application/json' \
     -d '{
       "full_name": "Test User",
       "email": "test@example.com",
       "phone": "+1234567890",
       "country": "USA",
       "company": "NA"
     }'
   ```

   **Expected:** HTTP 201 Created

3. **Test via Form:**
   - Navigate to `/app/register.html`
   - Fill all fields:
     - Name: Test User
     - Email: test+001@yourdomain.com
     - Phone: +1234567890
     - Country: USA
   - Click "Request Account"
   - Should see success message

4. **Verify in Database:**
   ```sql
   SELECT * FROM registration_requests
   ORDER BY requested_at DESC
   LIMIT 1;
   ```

   Should show the newly inserted record.

---

## 🔍 **WHY THIS HAPPENED**

**Timeline:**
1. Original `registration_requests` table created without `phone` and `country` columns
2. Migration attempted to add columns via `ALTER TABLE`
3. PostgREST cached the old schema (without new columns)
4. New migration dropped and recreated table with all columns
5. PostgREST still using old cached schema
6. API rejects requests referencing "unknown" columns

**Solution:**
Force PostgREST to reload its cache after schema changes.

---

## 📝 **PREVENTION FOR FUTURE**

**Add to deployment checklist:**

After any schema migration:
```sql
-- Always reload PostgREST cache after schema changes
NOTIFY pgrst, 'reload schema';
```

**Alternative: Automatic reload**

Add this to the end of every migration that modifies tables:
```sql
-- migrations/XXXXXX_example_migration.sql

-- Your schema changes here...
ALTER TABLE some_table ADD COLUMN new_column TEXT;

-- Force cache reload
NOTIFY pgrst, 'reload schema';
```

---

## ✅ **RESOLUTION CHECKLIST**

- [ ] Ran `NOTIFY pgrst, 'reload schema';` in SQL Editor
- [ ] Verified columns exist in `information_schema.columns`
- [ ] Tested registration form - submits successfully
- [ ] Verified record inserted in database
- [ ] Updated test case REG-001 status to "Pass"
- [ ] Documented fix for future reference

---

## 🚀 **NEXT STEPS AFTER FIX**

1. **Re-run Test REG-001:**
   - Navigate to `/app/register.html`
   - Complete registration flow
   - Verify success

2. **Continue Test Suite:**
   - Mark REG-001 as "Pass"
   - Proceed to REG-002 (Duplicate Email test)
   - Continue systematic testing

3. **Monitor for Similar Issues:**
   - If other PGRST204 errors occur on different tables
   - Always try schema cache reload first

---

## 📞 **IF ISSUE PERSISTS**

If schema reload doesn't fix it:

1. **Check migration history:**
   ```sql
   SELECT * FROM supabase_migrations.schema_migrations
   ORDER BY version DESC;
   ```

2. **Verify migration applied:**
   ```sql
   SELECT version FROM supabase_migrations.schema_migrations
   WHERE version = '20260626000000';
   ```

3. **Check for conflicts:**
   ```sql
   SELECT tablename, policyname, permissive, roles, cmd
   FROM pg_policies
   WHERE tablename = 'registration_requests';
   ```

4. **Contact Support:**
   - Supabase Dashboard → Support
   - Include: Project ref, error code, table name
   - Mention: "PostgREST schema cache not refreshing"

---

**Fix Status:** Ready to apply  
**Estimated Fix Time:** 30 seconds - 2 minutes  
**Test Impact:** Unblocks REG-001 and all registration tests

**Run the fix now and test again!** ✅
