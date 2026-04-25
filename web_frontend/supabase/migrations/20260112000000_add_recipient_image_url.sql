-- Add image_url column to recipients table for storing recipient profile images
ALTER TABLE public.recipients
  ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Add comment
COMMENT ON COLUMN public.recipients.image_url IS 'URL to the recipient profile image stored in Supabase storage';
