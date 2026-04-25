-- Super Admin vs Admin: add role; only super admin can create/remove admins.
-- Super admin credentials (e.g. admin@legacywallet.com) → Super Admin Panel with Admin Settings.
-- Created admins → Admin Panel (same /admin but no Admin Settings in sidebar).

ALTER TABLE public.admin_emails
  ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'admin';

ALTER TABLE public.admin_emails
  DROP CONSTRAINT IF EXISTS admin_emails_role_check;

ALTER TABLE public.admin_emails
  ADD CONSTRAINT admin_emails_role_check CHECK (role IN ('super_admin', 'admin'));

-- Set default super admin (run once; adjust email if needed)
UPDATE public.admin_emails
SET role = 'super_admin'
WHERE LOWER(TRIM(email)) = 'admin@legacywallet.com'
  AND NOT EXISTS (SELECT 1 FROM public.admin_emails WHERE role = 'super_admin');

DO $$
DECLARE
  first_email text;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.admin_emails WHERE role = 'super_admin') THEN
    SELECT email INTO first_email FROM public.admin_emails LIMIT 1;
    IF first_email IS NOT NULL THEN
      UPDATE public.admin_emails SET role = 'super_admin' WHERE email = first_email;
    END IF;
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_emails
    WHERE LOWER(TRIM(email)) = LOWER(TRIM(COALESCE(auth.jwt() ->> 'email', '')))
      AND role = 'super_admin'
  );
$$;

COMMENT ON FUNCTION public.is_super_admin() IS 'True if current user is super admin (can manage admins).';

GRANT EXECUTE ON FUNCTION public.is_super_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_super_admin() TO service_role;

-- All admins can read full admin list
DROP POLICY IF EXISTS "Admin can read own email" ON public.admin_emails;
DROP POLICY IF EXISTS "Admins can read all admin_emails" ON public.admin_emails;
CREATE POLICY "Admins can read all admin_emails"
  ON public.admin_emails FOR SELECT
  USING (public.is_admin());

-- Only super admin can insert (create admin)
DROP POLICY IF EXISTS "Super admin can insert admin_emails" ON public.admin_emails;
CREATE POLICY "Super admin can insert admin_emails"
  ON public.admin_emails FOR INSERT
  WITH CHECK (public.is_super_admin());

-- Only super admin can delete (remove admin)
DROP POLICY IF EXISTS "Super admin can delete admin_emails" ON public.admin_emails;
CREATE POLICY "Super admin can delete admin_emails"
  ON public.admin_emails FOR DELETE
  USING (public.is_super_admin());

-- Only super admin can update
DROP POLICY IF EXISTS "Super admin can update admin_emails" ON public.admin_emails;
CREATE POLICY "Super admin can update admin_emails"
  ON public.admin_emails FOR UPDATE
  USING (public.is_super_admin());
