-- Ensure admin RLS works regardless of email case (JWT email may differ from admin_emails)
-- Drop and recreate policies to use LOWER() so admin can always read login_activity and profiles

DROP POLICY IF EXISTS "Admins can read all login activity" ON public.login_activity;
CREATE POLICY "Admins can read all login activity"
  ON public.login_activity FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_emails
      WHERE LOWER(TRIM(email)) = LOWER(TRIM(auth.jwt() ->> 'email'))
    )
  );
DROP POLICY IF EXISTS "Admins can read all profiles" ON public.profiles;
CREATE POLICY "Admins can read all profiles"
  ON public.profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_emails
      WHERE LOWER(TRIM(email)) = LOWER(TRIM(auth.jwt() ->> 'email'))
    )
  );
-- Also allow admin to read own row in admin_emails (case-insensitive)
DROP POLICY IF EXISTS "Admin can read own email" ON public.admin_emails;
CREATE POLICY "Admin can read own email"
  ON public.admin_emails FOR SELECT
  USING (LOWER(TRIM(email)) = LOWER(TRIM(auth.jwt() ->> 'email')));

