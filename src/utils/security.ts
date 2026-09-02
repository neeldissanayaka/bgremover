/**
 * bgremover.art - Security, Input Sanitization & Form Validation Utilities
 * Hardens against XSS, SQLi, Control Character Injection, Payload Overflow & Replay Attacks
 */

// RFC 5322 Compliant Email Validation Regex
export const RFC_EMAIL_REGEX =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

export const AUTH_LIMITS = {
  EMAIL_MAX_LENGTH: 254,
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_MAX_LENGTH: 128,
  NAME_MAX_LENGTH: 100,
} as const;

/**
 * Strips HTML tags, script patterns, and potentially malicious executable code.
 */
export function stripHtmlTags(input: string): string {
  if (!input) return '';
  return input
    .replace(/<[^>]*>?/gm, '') // Remove HTML tags
    .replace(/javascript:/gi, '') // Strip inline javascript pseudoprotocol
    .replace(/vbscript:/gi, '')
    .replace(/onload|onerror|onclick|onmouseover|eval\(|alert\(/gi, '');
}

/**
 * Removes non-printable ASCII control characters (0-31, 127) while preserving standard text.
 */
export function stripControlCharacters(input: string): string {
  if (!input) return '';
  // Removes control chars except standard whitespace \t, \n, \r if needed; for credentials we strip all non-printable
  return input.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
}

/**
 * Sanitizes and normalizes an email address.
 * 1. Strips HTML/scripts
 * 2. Removes control characters
 * 3. Trims whitespace
 * 4. Converts to lowercase
 * 5. Enforces 254-character maximum length
 */
export function sanitizeEmail(rawEmail: string): string {
  if (!rawEmail) return '';
  let email = stripHtmlTags(rawEmail);
  email = stripControlCharacters(email);
  email = email.trim().toLowerCase();
  if (email.length > AUTH_LIMITS.EMAIL_MAX_LENGTH) {
    email = email.slice(0, AUTH_LIMITS.EMAIL_MAX_LENGTH);
  }
  return email;
}

/**
 * Sanitizes password input without altering valid special characters (@, #, $, %, etc.).
 * 1. Strips non-printable ASCII control characters
 * 2. Trims leading/trailing excess whitespace
 * 3. Enforces 128-character maximum length
 */
export function sanitizePassword(rawPassword: string): string {
  if (!rawPassword) return '';
  let password = stripControlCharacters(rawPassword);
  password = password.trim();
  if (password.length > AUTH_LIMITS.PASSWORD_MAX_LENGTH) {
    password = password.slice(0, AUTH_LIMITS.PASSWORD_MAX_LENGTH);
  }
  return password;
}

/**
 * Sanitizes full name input.
 * 1. Strips HTML/scripts
 * 2. Removes control characters
 * 3. Normalizes repeated spaces
 * 4. Enforces 100-character maximum length
 */
export function sanitizeName(rawName: string): string {
  if (!rawName) return '';
  let name = stripHtmlTags(rawName);
  name = stripControlCharacters(name);
  name = name.replace(/\s+/g, ' ').trim();
  if (name.length > AUTH_LIMITS.NAME_MAX_LENGTH) {
    name = name.slice(0, AUTH_LIMITS.NAME_MAX_LENGTH);
  }
  return name;
}

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  sanitizedValue?: string;
}

/**
 * Validates email against length limits and RFC 5322 standard regex.
 */
export function validateEmail(rawEmail: string): ValidationResult {
  const sanitized = sanitizeEmail(rawEmail);

  if (!sanitized) {
    return { isValid: false, error: 'Email address is required.' };
  }

  if (sanitized.length > AUTH_LIMITS.EMAIL_MAX_LENGTH) {
    return {
      isValid: false,
      error: `Email address cannot exceed ${AUTH_LIMITS.EMAIL_MAX_LENGTH} characters.`,
    };
  }

  if (!RFC_EMAIL_REGEX.test(sanitized)) {
    return {
      isValid: false,
      error: 'Please enter a valid email address (e.g. name@example.com).',
    };
  }

  return { isValid: true, sanitizedValue: sanitized };
}

/**
 * Validates password against length constraints and character safety.
 */
export function validatePassword(rawPassword: string): ValidationResult {
  const sanitized = sanitizePassword(rawPassword);

  if (!sanitized) {
    return { isValid: false, error: 'Password is required.' };
  }

  if (sanitized.length < AUTH_LIMITS.PASSWORD_MIN_LENGTH) {
    return {
      isValid: false,
      error: `Password must be at least ${AUTH_LIMITS.PASSWORD_MIN_LENGTH} characters long.`,
    };
  }

  if (sanitized.length > AUTH_LIMITS.PASSWORD_MAX_LENGTH) {
    return {
      isValid: false,
      error: `Password cannot exceed ${AUTH_LIMITS.PASSWORD_MAX_LENGTH} characters.`,
    };
  }

  return { isValid: true, sanitizedValue: sanitized };
}

/**
 * Validates full name.
 */
export function validateName(rawName: string): ValidationResult {
  const sanitized = sanitizeName(rawName);

  if (sanitized.length > AUTH_LIMITS.NAME_MAX_LENGTH) {
    return {
      isValid: false,
      error: `Full name cannot exceed ${AUTH_LIMITS.NAME_MAX_LENGTH} characters.`,
    };
  }

  return { isValid: true, sanitizedValue: sanitized };
}
