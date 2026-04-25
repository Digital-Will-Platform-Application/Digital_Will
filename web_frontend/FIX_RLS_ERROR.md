# Fix Row-Level Security (RLS) Error

## Problem
"new row violates row-level security policy" error when trying to update/create profiles.

## Solution

### Option 1: Run SQL Migration in Supabase (Recommended)

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Run this SQL:

```sql
-- Fix RLS policies for profiles to allow upsert operations
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- Recreate policies with proper checks for both USING and WITH CHECK
CREATE POLICY "Users can view their own profile" 
ON public.profiles FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
```

### Option 2: Code Already Updated

The code has been updated to:
- Use `upsert` instead of `insert` for profile operations
- Handle RLS errors gracefully
- Verify session before operations
- Fallback to regular update if upsert fails

## What Changed

1. **Account.tsx** - Updated `ensureProfile()` and `handlePhotoChange()`:
   - Uses `upsert` with `onConflict: 'user_id'`
   - Verifies session before operations
   - Better error handling for RLS issues

2. **AdminAccount.tsx** - Same improvements as Account.tsx

3. **Migration file created**: `supabase/migrations/20260229000000_fix_profiles_rls_upsert.sql`

## Testing

After running the SQL migration:
1. Try updating your photo
2. Should work without RLS errors
3. Profile will be created/updated successfully

## If Still Getting Errors

1. Check browser console for specific error messages
2. Verify you're logged in (session exists)
3. Check Supabase Dashboard → Authentication → Users to verify your user exists
4. Run the SQL migration above in Supabase SQL Editor
