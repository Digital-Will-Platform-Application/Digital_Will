-- Fix RLS policies for profiles to allow upsert operations
-- This migration ensures users can properly create and update their profiles

-- Drop existing policies if they exist
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

-- Add a policy to allow upsert (INSERT ... ON CONFLICT)
-- Upsert uses both INSERT and UPDATE, so the above policies should cover it
-- But we need to make sure the WITH CHECK clause allows the operation

COMMENT ON POLICY "Users can insert their own profile" ON public.profiles IS
'Allows users to insert their own profile. Used with upsert operations.';

COMMENT ON POLICY "Users can update their own profile" ON public.profiles IS
'Allows users to update their own profile. Used with upsert operations.';
