-- Add security fields for recipient verification
-- This migration adds code hashing, expiration, and rate limiting

-- Enable pgcrypto extension for hashing functions
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Add new columns for secure verification
ALTER TABLE public.recipients
  ADD COLUMN IF NOT EXISTS verification_code_hash TEXT,
  ADD COLUMN IF NOT EXISTS verification_code_expires_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS verification_attempts INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_verification_attempt_at TIMESTAMP WITH TIME ZONE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_recipients_verification_code_hash 
  ON public.recipients(verification_code_hash) 
  WHERE verification_code_hash IS NOT NULL;

-- Create index for expiration cleanup
CREATE INDEX IF NOT EXISTS idx_recipients_verification_expires 
  ON public.recipients(verification_code_expires_at) 
  WHERE verification_code_expires_at IS NOT NULL;

-- Function to hash verification codes using pgcrypto
-- This will be used by the send-verification-email function
CREATE OR REPLACE FUNCTION public.hash_verification_code(code TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Use pgcrypto's crypt function with bcrypt
  -- Note: In production, you might want to use a more secure method
  -- For now, we'll use a simple SHA-256 hash (PostgreSQL doesn't have bcrypt by default)
  RETURN encode(digest(code, 'sha256'), 'hex');
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.hash_verification_code(TEXT) TO authenticated, anon;

-- Update verify_recipient function with security features
CREATE OR REPLACE FUNCTION public.verify_recipient(
  recipient_id_param UUID,
  verification_code_param TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  recipient_record RECORD;
  hashed_code TEXT;
  max_attempts INTEGER := 5;
  rate_limit_window INTERVAL := '1 hour';
  attempts_reset_time TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Input validation
  IF recipient_id_param IS NULL OR verification_code_param IS NULL OR verification_code_param = '' THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Missing required parameters',
      'error_code', 'MISSING_PARAMETERS'
    );
  END IF;

  -- Hash the provided verification code
  hashed_code := encode(digest(verification_code_param, 'sha256'), 'hex');

  -- Find recipient with matching ID
  SELECT 
    id,
    full_name,
    email,
    is_verified,
    verification_code_hash,
    verification_code_expires_at,
    verification_attempts,
    last_verification_attempt_at
  INTO recipient_record
  FROM public.recipients
  WHERE id = recipient_id_param;

  -- Check if recipient was found
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Invalid recipient ID',
      'error_code', 'INVALID_RECIPIENT'
    );
  END IF;

  -- Check if already verified
  IF recipient_record.is_verified THEN
    RETURN json_build_object(
      'success', true,
      'message', 'Recipient already verified',
      'recipient_name', recipient_record.full_name
    );
  END IF;

  -- Check if verification code hash exists
  IF recipient_record.verification_code_hash IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'No verification code found for this recipient',
      'error_code', 'NO_VERIFICATION_CODE'
    );
  END IF;

  -- Check expiration
  IF recipient_record.verification_code_expires_at IS NOT NULL 
     AND recipient_record.verification_code_expires_at < NOW() THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Verification code has expired',
      'error_code', 'CODE_EXPIRED'
    );
  END IF;

  -- Rate limiting: Check if attempts should be reset
  attempts_reset_time := recipient_record.last_verification_attempt_at + rate_limit_window;
  
  IF recipient_record.last_verification_attempt_at IS NULL 
     OR attempts_reset_time < NOW() THEN
    -- Reset attempts if rate limit window has passed
    UPDATE public.recipients
    SET verification_attempts = 0
    WHERE id = recipient_id_param;
    recipient_record.verification_attempts := 0;
  END IF;

  -- Check if rate limit exceeded
  IF recipient_record.verification_attempts >= max_attempts THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Too many verification attempts. Please try again later.',
      'error_code', 'RATE_LIMIT_EXCEEDED',
      'retry_after', EXTRACT(EPOCH FROM (attempts_reset_time - NOW()))::INTEGER
    );
  END IF;

  -- Verify the code hash matches
  IF recipient_record.verification_code_hash != hashed_code THEN
    -- Increment attempts and update last attempt time
    UPDATE public.recipients
    SET 
      verification_attempts = verification_attempts + 1,
      last_verification_attempt_at = NOW()
    WHERE id = recipient_id_param;

    RETURN json_build_object(
      'success', false,
      'error', 'Invalid verification code',
      'error_code', 'INVALID_CODE',
      'attempts_remaining', GREATEST(0, max_attempts - recipient_record.verification_attempts - 1)
    );
  END IF;

  -- Code is valid - verify the recipient
  UPDATE public.recipients
  SET 
    is_verified = true,
    verification_attempts = 0,
    last_verification_attempt_at = NULL,
    updated_at = NOW()
  WHERE id = recipient_id_param
    AND verification_code_hash = hashed_code;

  -- Return success
  RETURN json_build_object(
    'success', true,
    'message', 'Recipient verified successfully',
    'recipient_name', recipient_record.full_name
  );
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.verify_recipient(UUID, TEXT) TO anon, authenticated;

-- Add comment
COMMENT ON FUNCTION public.verify_recipient(UUID, TEXT) IS 
'Verifies a recipient using their verification code with security features: code hashing, expiration checking, and rate limiting.';

-- Add comment for hash function
COMMENT ON FUNCTION public.hash_verification_code(TEXT) IS 
'Hashes a verification code using SHA-256. Used for secure code storage.';
