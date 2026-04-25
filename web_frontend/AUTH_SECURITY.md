# Authentication Security Configuration

This document describes the security features implemented for authentication in LegacyVault.

## Leaked Password Protection

LegacyVault implements leaked password protection to prevent users from using passwords that have been compromised in data breaches. This feature uses the [Have I Been Pwned](https://haveibeenpwned.com/API/v3#PwnedPasswords) API with k-anonymity to check passwords without exposing them.

### How It Works

1. **K-Anonymity**: When a user enters a password, only the first 5 characters of the SHA-1 hash are sent to the Have I Been Pwned API
2. **Local Verification**: The API returns a list of hash suffixes that match the prefix. The full hash is checked locally against this list
3. **Privacy-Preserving**: The actual password is never sent to the API, ensuring user privacy

### Implementation

The leaked password check is integrated into:
- **User Signup**: New users cannot create accounts with compromised passwords
- **Password Reset**: Users cannot reset their password to a compromised password

### Configuration

The feature is enabled by default and can be configured in:
- `src/lib/passwordSecurity.ts`: Core password security utilities
- `src/pages/Login.tsx`: Signup flow integration
- `src/pages/ResetPassword.tsx`: Password reset flow integration

### Supabase Dashboard Configuration

While the client-side check provides immediate feedback, you can also enable leaked password protection in the Supabase dashboard:

1. Go to your Supabase project dashboard
2. Navigate to **Authentication** → **Policies** → **Password**
3. Enable **"Check passwords against Have I Been Pwned"**
4. Configure the threshold (optional): Set how many times a password must appear in breaches before it's rejected

**Note**: Supabase's built-in leaked password protection works at the server level and provides an additional layer of security. The client-side check provides immediate user feedback before submission.

### Error Messages

When a leaked password is detected, users see one of these messages:
- **Single breach**: "This password has been found in a data breach. Please choose a different password."
- **Multiple breaches** (>1000 occurrences): "This password has been found in multiple data breaches and is not secure. Please choose a different password."

### Fallback Behavior

If the Have I Been Pwned API is unavailable (network issues, service down, etc.), the system fails open:
- Passwords are allowed through if the API check cannot be performed
- This ensures users aren't blocked from signing up or resetting passwords due to external service issues
- Errors are logged for monitoring purposes

### Security Best Practices

1. **Always use HTTPS**: Ensure all API calls are made over HTTPS
2. **Monitor API availability**: Log when the API is unavailable
3. **Combine with other checks**: Leaked password protection works alongside:
   - Minimum length requirements (8 characters)
   - Complexity requirements (uppercase, lowercase, numbers, special characters)
   - Rate limiting on authentication endpoints

### Testing

To test the leaked password protection:
1. Try using common compromised passwords like "password123" or "12345678"
2. The system should reject these passwords during signup or password reset
3. Use a unique, strong password to verify normal operation

### Additional Resources

- [Have I Been Pwned API Documentation](https://haveibeenpwned.com/API/v3#PwnedPasswords)
- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [OWASP Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)
