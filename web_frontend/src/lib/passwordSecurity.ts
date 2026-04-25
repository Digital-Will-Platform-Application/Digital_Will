/**
 * Password security utilities
 * Checks passwords against Have I Been Pwned database using k-anonymity
 * This ensures passwords haven't been compromised in data breaches
 */

/**
 * Checks if a password has been leaked using Have I Been Pwned API
 * Uses k-anonymity: only the first 5 characters of the SHA-1 hash are sent
 * 
 * @param password - The password to check
 * @returns Promise<{ isLeaked: boolean; count?: number }> - Whether the password is leaked and how many times
 */
export async function checkPasswordLeaked(
  password: string
): Promise<{ isLeaked: boolean; count?: number }> {
  try {
    // Hash the password using SHA-1
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-1', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();

    // Get first 5 characters (prefix) and remaining 35 characters (suffix)
    const prefix = hashHex.substring(0, 5);
    const suffix = hashHex.substring(5);

    // Query Have I Been Pwned API with only the prefix (k-anonymity)
    const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      method: 'GET',
      headers: {
        'User-Agent': 'DigitalWill-Password-Checker',
      },
    });

    if (!response.ok) {
      // If API is unavailable, allow the password (fail open for better UX)
      // In production, you might want to log this
      console.warn('Have I Been Pwned API unavailable, allowing password');
      return { isLeaked: false };
    }

    const responseText = await response.text();
    
    // Parse the response - it's a list of hash suffixes and counts
    // Handle both LF (\n) and CRLF (\r\n) line endings
    const hashLines = responseText.split(/\r?\n/).filter(line => line.trim());
    
    // Check if our suffix is in the list
    for (const line of hashLines) {
      // Trim the line to remove any remaining whitespace/CR characters
      const trimmedLine = line.trim();
      const [hashSuffix, countStr] = trimmedLine.split(':');
      
      // Trim the hashSuffix to ensure no trailing whitespace
      if (hashSuffix.trim() === suffix) {
        const count = parseInt(countStr?.trim() || '0', 10);
        return { isLeaked: true, count };
      }
    }

    // Password not found in breach database
    return { isLeaked: false };
  } catch (error) {
    // If there's an error (network issue, etc.), fail open
    // This ensures users aren't blocked if the service is down
    console.error('Error checking password against Have I Been Pwned:', error);
    return { isLeaked: false };
  }
}

/**
 * Validates password security including leaked password check
 * 
 * @param password - The password to validate
 * @param options - Validation options
 * @returns Promise with validation result
 */
export async function validatePasswordSecurity(
  password: string,
  options: {
    checkLeaked?: boolean;
    minLength?: number;
    requireUppercase?: boolean;
    requireLowercase?: boolean;
    requireNumber?: boolean;
    requireSpecial?: boolean;
  } = {}
): Promise<{
  isValid: boolean;
  errors: string[];
  isLeaked?: boolean;
  leakCount?: number;
}> {
  const errors: string[] = [];
  const {
    checkLeaked = true,
    minLength = 8,
    requireUppercase = true,
    requireLowercase = true,
    requireNumber = true,
    requireSpecial = true,
  } = options;

  // Basic length check
  if (password.length < minLength) {
    errors.push(`Password must be at least ${minLength} characters`);
  }

  // Character requirements
  if (requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (requireNumber && !/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (requireSpecial && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  // Check for leaked password (only if basic validation passes)
  let isLeaked = false;
  let leakCount: number | undefined;

  if (checkLeaked && errors.length === 0) {
    const leakCheck = await checkPasswordLeaked(password);
    if (leakCheck.isLeaked) {
      isLeaked = true;
      leakCount = leakCheck.count;
      errors.push(
        leakCheck.count && leakCheck.count > 1000
          ? 'This password has been found in multiple data breaches and is not secure'
          : 'This password has been found in a data breach. Please choose a different password'
      );
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    isLeaked,
    leakCount,
  };
}
