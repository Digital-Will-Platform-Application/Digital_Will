-- Ensure admin@legacywallet.com (from .env) is the one and only Super Admin.
UPDATE public.admin_emails SET role = 'admin' WHERE role = 'super_admin' AND LOWER(TRIM(email)) <> 'admin@legacywallet.com';
UPDATE public.admin_emails SET role = 'super_admin' WHERE LOWER(TRIM(email)) = 'admin@legacywallet.com';
INSERT INTO public.admin_emails (email, role) VALUES ('admin@legacywallet.com', 'super_admin')
ON CONFLICT (email) DO UPDATE SET role = 'super_admin';
