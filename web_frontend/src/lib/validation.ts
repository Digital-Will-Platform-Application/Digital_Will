/**
 * Validation and sanitization utilities for user input
 */

// Maximum lengths for different field types
export const MAX_LENGTHS = {
  NAME: 100,
  EMAIL: 255,
  PHONE: 20,
  DESCRIPTION: 2000,
  MESSAGE: 5000,
  ASSET_NAME: 200,
  RELATIONSHIP: 50,
} as const;

// Minimum lengths
export const MIN_LENGTHS = {
  NAME: 1,
  PASSWORD: 8,
} as const;

/**
 * Sanitizes a string by removing potentially dangerous HTML/script tags
 * This is a basic sanitization - for production, consider using DOMPurify
 */
export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') return '';
  
  return input
    .trim()
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '') // Remove iframe tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, '') // Remove event handlers like onclick=
    .replace(/&lt;script/gi, '') // Remove encoded script tags
    .replace(/&lt;iframe/gi, ''); // Remove encoded iframe tags
}

/**
 * Validates and sanitizes a name field
 */
export function validateName(name: string): { isValid: boolean; error?: string; sanitized: string } {
  const sanitized = sanitizeInput(name);
  
  if (!sanitized || sanitized.length < MIN_LENGTHS.NAME) {
    return { isValid: false, error: 'Name is required', sanitized: '' };
  }
  
  if (sanitized.length > MAX_LENGTHS.NAME) {
    return { isValid: false, error: `Name must be less than ${MAX_LENGTHS.NAME} characters`, sanitized: '' };
  }
  
  // Allow letters, spaces, hyphens, apostrophes, and common international characters
  const nameRegex = /^[a-zA-Z\s\-'\.\u00C0-\u024F\u1E00-\u1EFF]+$/;
  if (!nameRegex.test(sanitized)) {
    return { isValid: false, error: 'Name contains invalid characters', sanitized: '' };
  }
  
  return { isValid: true, sanitized };
}

/**
 * Validates and sanitizes an email address
 */
export function validateEmail(email: string, required: boolean = false): { isValid: boolean; error?: string; sanitized: string } {
  const sanitized = sanitizeInput(email).toLowerCase();
  
  if (!sanitized || sanitized.length === 0) {
    if (required) {
      return { isValid: false, error: 'Email is required', sanitized: '' };
    }
    return { isValid: true, sanitized: '' }; // Optional field
  }
  
  if (sanitized.length > MAX_LENGTHS.EMAIL) {
    return { isValid: false, error: `Email must be less than ${MAX_LENGTHS.EMAIL} characters`, sanitized: '' };
  }
  
  // RFC 5322 compliant email regex (simplified)
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  if (!emailRegex.test(sanitized)) {
    return { isValid: false, error: 'Please enter a valid email address', sanitized: '' };
  }
  
  return { isValid: true, sanitized };
}

/**
 * Validates and sanitizes a phone number
 */
export function validatePhone(phone: string, required: boolean = false): { isValid: boolean; error?: string; sanitized: string } {
  const sanitized = sanitizeInput(phone);
  
  if (!sanitized || sanitized.length === 0) {
    if (required) {
      return { isValid: false, error: 'Phone number is required', sanitized: '' };
    }
    return { isValid: true, sanitized: '' }; // Optional field
  }
  
  if (sanitized.length > MAX_LENGTHS.PHONE) {
    return { isValid: false, error: `Phone number must be less than ${MAX_LENGTHS.PHONE} characters`, sanitized: '' };
  }
  
  // Allow digits, spaces, hyphens, parentheses, plus sign, and periods
  const phoneRegex = /^[\d\s\-\+\(\)\.]+$/;
  if (!phoneRegex.test(sanitized)) {
    return { isValid: false, error: 'Phone number contains invalid characters', sanitized: '' };
  }
  
  // Remove all non-digit characters for validation
  const digitsOnly = sanitized.replace(/\D/g, '');
  if (digitsOnly.length < 7 || digitsOnly.length > 15) {
    return { isValid: false, error: 'Phone number must contain 7-15 digits', sanitized: '' };
  }
  
  return { isValid: true, sanitized };
}

/**
 * Validates and sanitizes a description/text field
 */
export function validateDescription(description: string, maxLength: number = MAX_LENGTHS.DESCRIPTION, required: boolean = false): { isValid: boolean; error?: string; sanitized: string } {
  const sanitized = sanitizeInput(description);
  
  if (!sanitized || sanitized.length === 0) {
    if (required) {
      return { isValid: false, error: 'Description is required', sanitized: '' };
    }
    return { isValid: true, sanitized: '' }; // Optional field
  }
  
  if (sanitized.length > maxLength) {
    return { isValid: false, error: `Description must be less than ${maxLength} characters`, sanitized: '' };
  }
  
  return { isValid: true, sanitized };
}

/**
 * Validates and sanitizes an asset name
 */
export function validateAssetName(name: string): { isValid: boolean; error?: string; sanitized: string } {
  const sanitized = sanitizeInput(name);
  
  if (!sanitized || sanitized.length < MIN_LENGTHS.NAME) {
    return { isValid: false, error: 'Asset name is required', sanitized: '' };
  }
  
  if (sanitized.length > MAX_LENGTHS.ASSET_NAME) {
    return { isValid: false, error: `Asset name must be less than ${MAX_LENGTHS.ASSET_NAME} characters`, sanitized: '' };
  }
  
  return { isValid: true, sanitized };
}

/**
 * Validates and sanitizes a relationship field
 */
export function validateRelationship(relationship: string): { isValid: boolean; error?: string; sanitized: string } {
  const sanitized = sanitizeInput(relationship);
  
  if (!sanitized || sanitized.length === 0) {
    return { isValid: true, sanitized: '' }; // Optional field
  }
  
  if (sanitized.length > MAX_LENGTHS.RELATIONSHIP) {
    return { isValid: false, error: `Relationship must be less than ${MAX_LENGTHS.RELATIONSHIP} characters`, sanitized: '' };
  }
  
  return { isValid: true, sanitized };
}

/**
 * Validates and sanitizes message or transcript content
 */
export function validateMessage(message: string): { isValid: boolean; error?: string; sanitized: string } {
  const sanitized = sanitizeInput(message);
  
  if (!sanitized || sanitized.trim().length === 0) {
    return { isValid: false, error: 'Message cannot be empty', sanitized: '' };
  }
  
  if (sanitized.length > MAX_LENGTHS.MESSAGE) {
    return { isValid: false, error: `Message must be less than ${MAX_LENGTHS.MESSAGE} characters`, sanitized: '' };
  }
  
  return { isValid: true, sanitized };
}

/**
 * Validates a numeric value (for estimated_value)
 */
export function validateNumericValue(value: string): { isValid: boolean; error?: string; sanitized: number | null } {
  const trimmed = value.trim();
  
  if (!trimmed || trimmed.length === 0) {
    return { isValid: true, sanitized: null }; // Optional field
  }
  
  // Allow numbers with optional decimal point
  const numericRegex = /^-?\d+(\.\d{1,2})?$/;
  if (!numericRegex.test(trimmed)) {
    return { isValid: false, error: 'Please enter a valid number', sanitized: null };
  }
  
  const numValue = parseFloat(trimmed);
  if (isNaN(numValue)) {
    return { isValid: false, error: 'Please enter a valid number', sanitized: null };
  }
  
  if (numValue < 0) {
    return { isValid: false, error: 'Value cannot be negative', sanitized: null };
  }
  
  if (numValue > 999999999999999) {
    return { isValid: false, error: 'Value is too large', sanitized: null };
  }
  
  return { isValid: true, sanitized: numValue };
}
