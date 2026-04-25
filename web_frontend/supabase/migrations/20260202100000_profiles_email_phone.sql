-- Add email and phone to profiles so admin can see complete user details
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS phone text;

-- Backfill existing profiles from auth.users (run with sufficient privileges)
UPDATE public.profiles p
SET
  email = COALESCE(p.email, u.email),
  phone = COALESCE(p.phone, u.raw_user_meta_data->>'phone')
FROM auth.users u
WHERE p.user_id = u.id;

-- Update handle_new_user to set email and phone on new signups
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_full_name TEXT;
  v_email TEXT;
  v_phone TEXT;
  v_user_id UUID;
BEGIN
  v_user_id := NEW.id;
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User ID cannot be null';
  END IF;

  -- Email from auth.users (max 255)
  IF NEW.email IS NOT NULL AND length(NEW.email) > 0 THEN
    v_email := left(trim(NEW.email), 255);
  ELSE
    v_email := NULL;
  END IF;

  -- Phone from metadata
  IF NEW.raw_user_meta_data IS NOT NULL AND NEW.raw_user_meta_data ? 'phone' THEN
    v_phone := NEW.raw_user_meta_data->>'phone';
    IF v_phone IS NOT NULL AND length(v_phone) > 50 THEN
      v_phone := left(v_phone, 50);
    END IF;
  ELSE
    v_phone := NULL;
  END IF;

  -- Full name from metadata
  IF NEW.raw_user_meta_data IS NOT NULL AND NEW.raw_user_meta_data ? 'full_name' THEN
    v_full_name := NEW.raw_user_meta_data->>'full_name';
    IF v_full_name IS NOT NULL AND length(v_full_name) > 100 THEN
      v_full_name := left(v_full_name, 100);
    END IF;
    IF v_full_name IS NOT NULL THEN
      v_full_name := regexp_replace(trim(v_full_name), E'[\\x00-\\x1F]', '', 'g');
      IF v_full_name = '' THEN
        v_full_name := NULL;
      END IF;
    END IF;
  ELSE
    v_full_name := NULL;
  END IF;

  INSERT INTO public.profiles (user_id, full_name, email, phone)
  VALUES (v_user_id, v_full_name, v_email, v_phone)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error creating profile for user %: %', v_user_id, SQLERRM;
    RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

COMMENT ON FUNCTION public.handle_new_user() IS
'Creates user profile with full_name, email, phone on signup. Used for admin panel complete user details.';
