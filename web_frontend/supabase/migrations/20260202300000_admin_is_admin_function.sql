-- Fix "Could not load data": RLS on login_activity/profiles checks admin_emails,
-- but admin_emails has its own RLS, so the nested check can fail. Use a
-- SECURITY DEFINER function to check "is admin?" without being blocked by RLS.

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_emails
    WHERE LOWER(TRIM(email)) = LOWER(TRIM(COALESCE(auth.jwt() ->> 'email', '')))
  );
$$;

COMMENT ON FUNCTION public.is_admin() IS 'Returns true if current user JWT email is in admin_emails. Used by RLS so admin panel can fetch data.';

GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO service_role;

-- Use is_admin() in RLS so the check does not depend on admin_emails RLS
DROP POLICY IF EXISTS "Admins can read all login activity" ON public.login_activity;
CREATE POLICY "Admins can read all login activity"
  ON public.login_activity FOR SELECT
  USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can read all profiles" ON public.profiles;
CREATE POLICY "Admins can read all profiles"
  ON public.profiles FOR SELECT
  USING (public.is_admin());

DROP POLICY IF EXISTS "Admin can read own email" ON public.admin_emails;
CREATE POLICY "Admin can read own email"
  ON public.admin_emails FOR SELECT
  USING (LOWER(TRIM(email)) = LOWER(TRIM(COALESCE(auth.jwt() ->> 'email', ''))));
