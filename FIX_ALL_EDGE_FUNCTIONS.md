# Edge Functions That Need Role Normalization Fix

All these Edge Functions check `caller.role === 'super_duper_admin'` or `'super_admin'` but the database has roles with **spaces** instead of underscores.

## Functions Fixed:
- ✅ provision-company (deployed)

## Functions Still Need Fixing:

1. **reset-user-password** - Checks for super_duper_admin or super_admin
2. **invite-user** - Checks for super_duper_admin or super_admin  
3. **create-user** - Checks for super_duper_admin or super_admin
4. **create-super-admin** - Checks for super_duper_admin

## Fix Pattern:

Replace:
```typescript
if (caller.role !== 'super_duper_admin') {
```

With:
```typescript
const normalizedRole = caller?.role ? caller.role.replace(/\s+/g, '_').toLowerCase() : '';
if (normalizedRole !== 'super_duper_admin') {
```

## For Now - Test The Fix:

**Test 1.3 again** with the provision-company fix deployed - it should work now!

The other functions can be fixed later as needed.
