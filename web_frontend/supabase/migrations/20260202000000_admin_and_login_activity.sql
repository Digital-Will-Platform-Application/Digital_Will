-- Admin emails: list of emails that are allowed to access admin panel (used in RLS)
CREATE TABLE public.admin_emails (
  email text PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Only the admin can read their own row (for client-side isAdmin check)
ALTER TABLE public.admin_emails ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can read own email"
  ON public.admin_emails FOR SELECT
  USING (email = (auth.jwt() ->> 'email'));

-- Insert default admin (user must create this user in Supabase Auth)
INSERT INTO public.admin_emails (email) VALUES ('admin@legacywallet.com')
ON CONFLICT (email) DO NOTHING;

-- Login activity: one row per sign-in (for "who logged in today" reports)
CREATE TABLE public.login_activity (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  logged_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_login_activity_logged_at ON public.login_activity(logged_at DESC);
CREATE INDEX idx_login_activity_user_id ON public.login_activity(user_id);

ALTER TABLE public.login_activity ENABLE ROW LEVEL SECURITY;

-- Authenticated users can insert their own login record
CREATE POLICY "Users can insert own login"
  ON public.login_activity FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Only admins can read all login activity
CREATE POLICY "Admins can read all login activity"
  ON public.login_activity FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_emails
      WHERE email = (auth.jwt() ->> 'email')
    )
  );

-- Allow admins to select all profiles (for "accounts created this week" and reports)
CREATE POLICY "Admins can read all profiles"
  ON public.profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_emails
      WHERE email = (auth.jwt() ->> 'email')
    )
  );
