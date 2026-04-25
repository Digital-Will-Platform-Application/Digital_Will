-- Create a function to verify recipients using verification code
-- This function bypasses RLS to allow recipients to verify themselves
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
  result JSON;
BEGIN
  -- Input validation
  IF recipient_id_param IS NULL OR verification_code_param IS NULL OR verification_code_param = '' THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Missing required parameters'
    );
  END IF;

  -- Find recipient with matching ID and verification code
  SELECT 
    id,
    full_name,
    email,
    is_verified,
    verification_code
  INTO recipient_record
  FROM public.recipients
  WHERE id = recipient_id_param
    AND verification_code = verification_code_param;

  -- Check if recipient was found
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Invalid verification code or recipient ID'
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

  -- Update recipient as verified
  UPDATE public.recipients
  SET 
    is_verified = true,
    updated_at = NOW()
  WHERE id = recipient_id_param
    AND verification_code = verification_code_param;

  -- Return success
  RETURN json_build_object(
    'success', true,
    'message', 'Recipient verified successfully',
    'recipient_name', recipient_record.full_name
  );
END;
$$;

-- Grant execute permission to authenticated and anon users
-- This allows recipients to verify themselves without being logged in
GRANT EXECUTE ON FUNCTION public.verify_recipient(UUID, TEXT) TO anon, authenticated;

-- Add comment
COMMENT ON FUNCTION public.verify_recipient(UUID, TEXT) IS 
'Verifies a recipient using their verification code. Bypasses RLS to allow recipients to verify themselves via email link.';
