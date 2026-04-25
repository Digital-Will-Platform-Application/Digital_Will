const MAX_MESSAGE_LENGTH = 5000;

export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') return '';
  return input
    .trim()
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '');
}

export function validateMessage(message: string): { isValid: boolean; error?: string; sanitized: string } {
  const sanitized = sanitizeInput(message);
  if (!sanitized || sanitized.trim().length === 0) {
    return { isValid: false, error: 'Message cannot be empty', sanitized: '' };
  }
  if (sanitized.length > MAX_MESSAGE_LENGTH) {
    return { isValid: false, error: `Message must be less than ${MAX_MESSAGE_LENGTH} characters`, sanitized: '' };
  }
  return { isValid: true, sanitized };
}

export function validateAssetName(name: string): { isValid: boolean; error?: string; sanitized: string } {
  const sanitized = sanitizeInput(name);
  if (!sanitized || sanitized.length < 1) return { isValid: false, error: 'Asset name is required', sanitized: '' };
  if (sanitized.length > 200) return { isValid: false, error: 'Asset name must be less than 200 characters', sanitized: '' };
  return { isValid: true, sanitized };
}

export function validateNumericValue(value: string): { isValid: boolean; error?: string; sanitized: number | null } {
  const trimmed = value.trim();
  if (!trimmed) return { isValid: true, sanitized: null };
  const n = Number(trimmed);
  if (Number.isNaN(n) || n < 0) return { isValid: false, error: 'Enter a valid number', sanitized: null };
  return { isValid: true, sanitized: n };
}
