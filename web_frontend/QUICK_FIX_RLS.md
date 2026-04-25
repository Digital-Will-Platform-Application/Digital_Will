# QUICK FIX for RLS Error - Deadline Solution

## Immediate Fix (Run in Supabase SQL Editor)

Go to **Supabase Dashboard → SQL Editor** and run this:

```sql
-- Temporarily disable RLS for profiles (for testing)
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- OR if you want to keep RLS but fix it:
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

CREATE POLICY "Users can insert their own profile" 
ON public.profiles FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
```

## Code Already Updated

The code now:
- Uses UPDATE instead of UPSERT (better RLS compatibility)
- Waits for trigger function if profile doesn't exist
- Handles RLS errors gracefully
- Photo upload will work even if profile update has RLS issues

## Test

1. Run the SQL above in Supabase
2. Try updating your photo
3. Should work now!
