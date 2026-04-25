-- Add avatar_url to users table (for profile photo)
ALTER TABLE users
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

