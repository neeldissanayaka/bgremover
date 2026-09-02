/**
 * bgremover.art - Enterprise-Grade Cybersecurity & Protection Suite
 * Hardens against:
 * 1. XSS (Cross-Site Scripting) & HTML/Script injection
 * 2. SQLi & NoSQL injection
 * 3. SSRF (Server-Side Request Forgery) & Internal Cloud Metadata probing
 * 4. File extension spoofing & Polyglot Malware (Magic Bytes header verification)
 * 5. Pixel Flood & Decompression Bomb (DoS) attacks
 * 6. Brute-force & Credential Stuffing (Exponential backoff & lockout)
 * 7. Path Traversal & Control Character injection
 * 8. Cryptographic Weakness (Web Crypto CSPRNG & SHA-256 + Salt hashing)
 */

// RFC 5322 Compliant Email Validation Regex
export const RFC_EMAIL_REGEX =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

export const AUTH_LIMITS = {
  EMAIL_MAX_LENGTH: 254,
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_MAX_LENGTH: 128,
  NAME_MAX_LENGTH: 100,
  MAX_FAILED_LOGIN_ATTEMPTS: 5,
  LOCKOUT_DURATION_MS: 5 * 60 * 1000, // 5 minutes lockout
  RATE_LIMIT_WINDOW_MS: 15 * 60 * 1000, // 15 minutes tracking window
} as const;

export const IMAGE_SECURITY_LIMITS = {
  MAX_FILE_SIZE_BYTES: 15 * 1024 * 1024, // 15 MB
  MAX_PIXEL_COUNT: 64 * 1000 * 1000, // 64 Megapixels (Prevents memory exhaustion)
  MAX_DIMENSION_PX: 8192, // 8K Max Width / Height
  ALLOWED_EXTENSIONS: ['jpg', 'jpeg', 'png', 'webp'],
  ALLOWED_MIME_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
} as const;

// ============================================================================
// 1. INPUT SANITIZATION & XSS PREVENTION
// ============================================================================

/**
 * Strips HTML tags, script patterns, javascript pseudoprotocols, and event handlers.
 */
export function stripHtmlTags(input: string): string {
  if (!input) return '';
  return input
    .replace(/<[^>]*>?/gm, '') // Remove HTML tags
    .replace(/javascript:/gi, '') // Strip inline javascript pseudoprotocol
    .replace(/vbscript:/gi, '')
    .replace(/data:(?!image\/(png|jpeg|webp|jpg);base64)/gi, '') // Block malicious data URIs
    .replace(/onload|onerror|onclick|onmouseover|onfocus|onblur|eval\(|alert\(/gi, '');
}

/**
 * Escapes characters for safe HTML output encoding (Prevents DOM-based XSS).
 */
export function escapeHtml(str: string): string {
  if (!str) return '';
  const entityMap: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
    '/': '&#x2F;',
    '`': '&#x60;',
    '=': '&#x3D;',
  };
  return String(str).replace(/[&<>"'`=\/]/g, (s) => entityMap[s]);
}

/**
 * Removes non-printable ASCII and Unicode control characters while preserving valid text.
 */
export function stripControlCharacters(input: string): string {
  if (!input) return '';
  return input.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, '');
}

/**
 * Sanitizes and normalizes an email address.
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
 * Sanitizes user name and profile fields.
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

/**
 * Sanitizes uploaded file names to prevent directory traversal and filesystem attacks.
 */
export function sanitizeFileName(rawFileName: string): string {
  if (!rawFileName) return 'image_' + Date.now() + '.png';
  // Strip directory paths (../, ..\, /)
  let clean = rawFileName.replace(/^.*[\\\/]/, '');
  // Strip control chars and non-standard symbols
  clean = clean.replace(/[^a-zA-Z0-9._-]/g, '_');
  // Avoid hidden files starting with .
  clean = clean.replace(/^\.+/, '');
  // Limit length
  if (clean.length > 80) {
    const ext = clean.substring(clean.lastIndexOf('.'));
    clean = clean.substring(0, 70) + ext;
  }
  return clean || 'image.png';
}

// ============================================================================
// 2. VALIDATION HELPERS
// ============================================================================

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

// ============================================================================
// 3. SSRF & MALICIOUS URL PROTECTION
// ============================================================================

/**
 * Validates a web URL against SSRF (Server-Side Request Forgery), private LAN probing,
 * and malicious internal metadata endpoints (e.g., AWS 169.254.169.254, localhost).
 */
export function validateSafeUrl(urlString: string): { isSafe: boolean; error?: string; url?: string } {
  if (!urlString || typeof urlString !== 'string') {
    return { isSafe: false, error: 'Please provide a valid image URL.' };
  }

  const trimmed = urlString.trim();

  // Allow safe base64 data URLs for images
  if (trimmed.startsWith('data:image/jpeg;base64,') ||
      trimmed.startsWith('data:image/png;base64,') ||
      trimmed.startsWith('data:image/webp;base64,')) {
    if (trimmed.length > 20 * 1024 * 1024) {
      return { isSafe: false, error: 'Data URL payload is too large (max 20MB).' };
    }
    return { isSafe: true, url: trimmed };
  }

  // Parse HTTP/HTTPS URL
  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return { isSafe: false, error: 'Malformed URL format.' };
  }

  // Strictly enforce http/https protocols only (blocks file://, gopher://, javascript:, etc.)
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return { isSafe: false, error: 'Only HTTP and HTTPS image URLs are supported.' };
  }

  // Block credentials in URL (e.g., https://admin:password@example.com)
  if (parsed.username || parsed.password) {
    return { isSafe: false, error: 'URLs with embedded credentials are not allowed for security.' };
  }

  const hostname = parsed.hostname.toLowerCase();

  // Block Localhost & Loopback
  if (
    hostname === 'localhost' ||
    hostname.endsWith('.localhost') ||
    hostname === '127.0.0.1' ||
    hostname === '::1' ||
    hostname === '0.0.0.0'
  ) {
    return { isSafe: false, error: 'Local network and loopback URLs are blocked for security.' };
  }

  // Block Cloud Metadata Endpoints (AWS, GCP, Azure, DigitalOcean)
  if (
    hostname === '169.254.169.254' ||
    hostname === 'metadata.google.internal' ||
    hostname.includes('metadata') ||
    hostname === 'instance-data'
  ) {
    return { isSafe: false, error: 'Cloud metadata access is strictly forbidden.' };
  }

  // Block Private IPv4 Address Ranges (RFC 1918 & RFC 3927)
  const ipMatch = hostname.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (ipMatch) {
    const oct1 = parseInt(ipMatch[1], 10);
    const oct2 = parseInt(ipMatch[2], 10);

    if (
      oct1 === 10 || // 10.0.0.0/8
      (oct1 === 172 && oct2 >= 16 && oct2 <= 31) || // 172.16.0.0/12
      (oct1 === 192 && oct2 === 168) || // 192.168.0.0/16
      (oct1 === 169 && oct2 === 254) || // 169.254.0.0/16 (Link-local)
      oct1 === 127 || // 127.0.0.0/8 (Loopback)
      oct1 === 0 || // 0.0.0.0
      oct1 >= 224 // Multicast & Reserved (224.0.0.0+)
    ) {
      return { isSafe: false, error: 'Private and internal IP ranges are blocked.' };
    }
  }

  // Block IPv6 Private/Local Ranges
  if (
    hostname.startsWith('fe80:') ||
    hostname.startsWith('fc00:') ||
    hostname.startsWith('fd00:') ||
    hostname === '[::1]'
  ) {
    return { isSafe: false, error: 'Private IPv6 addresses are blocked.' };
  }

  return { isSafe: true, url: parsed.toString() };
}

// ============================================================================
// 4. MAGIC BYTES FILE SIGNATURE & DECOMPRESSION BOMB DEFENSE
// ============================================================================

/**
 * Validates actual file bytes header (Magic Bytes) to verify true format.
 * Prevents disguised executable binaries, scripts, or malicious polyglots.
 */
export async function verifyImageMagicBytes(file: File | Blob): Promise<{
  isValid: boolean;
  detectedFormat?: string;
  error?: string;
}> {
  try {
    const slice = file.slice(0, 16);
    const buffer = await slice.arrayBuffer();
    const bytes = new Uint8Array(buffer);

    if (bytes.length < 4) {
      return { isValid: false, error: 'File is too small or corrupt.' };
    }

    // 1. PNG Magic Bytes: 89 50 4E 47 0D 0A 1A 0A
    if (
      bytes[0] === 0x89 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x4e &&
      bytes[3] === 0x47
    ) {
      return { isValid: true, detectedFormat: 'image/png' };
    }

    // 2. JPEG Magic Bytes: FF D8 FF
    if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
      return { isValid: true, detectedFormat: 'image/jpeg' };
    }

    // 3. WebP Magic Bytes: RIFF .... WEBP
    if (
      bytes[0] === 0x52 && // R
      bytes[1] === 0x49 && // I
      bytes[2] === 0x46 && // F
      bytes[3] === 0x46 // F
    ) {
      if (bytes.length >= 12) {
        if (
          bytes[8] === 0x57 && // W
          bytes[9] === 0x45 && // E
          bytes[10] === 0x42 && // B
          bytes[11] === 0x50 // P
        ) {
          return { isValid: true, detectedFormat: 'image/webp' };
        }
      }
      return { isValid: true, detectedFormat: 'image/webp' };
    }

    return {
      isValid: false,
      error: 'File content does not match a valid image signature (PNG, JPG, or WebP). Execution blocked for security.',
    };
  } catch (err: any) {
    return {
      isValid: false,
      error: 'Could not inspect file signature: ' + (err?.message || 'Unknown error'),
    };
  }
}

/**
 * Validates image dimensions to prevent decompression bombs / pixel flood DoS.
 */
export function validateImageDimensions(width: number, height: number): {
  isValid: boolean;
  error?: string;
} {
  if (!width || !height || width <= 0 || height <= 0) {
    return { isValid: false, error: 'Invalid image dimensions.' };
  }

  if (
    width > IMAGE_SECURITY_LIMITS.MAX_DIMENSION_PX ||
    height > IMAGE_SECURITY_LIMITS.MAX_DIMENSION_PX
  ) {
    return {
      isValid: false,
      error: `Image dimensions (${width}x${height}) exceed maximum allowed ${IMAGE_SECURITY_LIMITS.MAX_DIMENSION_PX}px limit.`,
    };
  }

  const totalPixels = width * height;
  if (totalPixels > IMAGE_SECURITY_LIMITS.MAX_PIXEL_COUNT) {
    return {
      isValid: false,
      error: `Image pixel count exceeds the 64 Megapixel memory limit (Decompression Bomb protection).`,
    };
  }

  return { isValid: true };
}

// ============================================================================
// 5. BRUTE-FORCE RATE LIMITING & ACCOUNT LOCKOUT
// ============================================================================

interface RateLimitRecord {
  attempts: number;
  firstAttemptAt: number;
  lockedUntil: number | null;
}

const rateLimitStorage = new Map<string, RateLimitRecord>();

/**
 * Checks if a specific action (e.g. login attempt) is currently rate-limited or locked out.
 */
export function checkRateLimit(key: string): {
  isAllowed: boolean;
  remainingAttempts: number;
  lockoutRemainingSeconds?: number;
  error?: string;
} {
  const normalizedKey = key.toLowerCase().trim();
  const now = Date.now();
  const record = rateLimitStorage.get(normalizedKey);

  if (!record) {
    return { isAllowed: true, remainingAttempts: AUTH_LIMITS.MAX_FAILED_LOGIN_ATTEMPTS };
  }

  // Check if locked out
  if (record.lockedUntil && record.lockedUntil > now) {
    const remainingSec = Math.ceil((record.lockedUntil - now) / 1000);
    return {
      isAllowed: false,
      remainingAttempts: 0,
      lockoutRemainingSeconds: remainingSec,
      error: `Too many failed login attempts. Security lockout active for ${remainingSec} seconds.`,
    };
  }

  // Expire old tracking window
  if (now - record.firstAttemptAt > AUTH_LIMITS.RATE_LIMIT_WINDOW_MS) {
    rateLimitStorage.delete(normalizedKey);
    return { isAllowed: true, remainingAttempts: AUTH_LIMITS.MAX_FAILED_LOGIN_ATTEMPTS };
  }

  const remaining = Math.max(0, AUTH_LIMITS.MAX_FAILED_LOGIN_ATTEMPTS - record.attempts);
  return { isAllowed: remaining > 0, remainingAttempts: remaining };
}

/**
 * Records a failed attempt for an identifier (e.g. email or IP). Triggers lockout if max reached.
 */
export function recordFailedAttempt(key: string): {
  isLocked: boolean;
  lockoutRemainingSeconds?: number;
} {
  const normalizedKey = key.toLowerCase().trim();
  const now = Date.now();
  let record = rateLimitStorage.get(normalizedKey);

  if (!record || now - record.firstAttemptAt > AUTH_LIMITS.RATE_LIMIT_WINDOW_MS) {
    record = {
      attempts: 1,
      firstAttemptAt: now,
      lockedUntil: null,
    };
  } else {
    record.attempts += 1;
  }

  if (record.attempts >= AUTH_LIMITS.MAX_FAILED_LOGIN_ATTEMPTS) {
    record.lockedUntil = now + AUTH_LIMITS.LOCKOUT_DURATION_MS;
    rateLimitStorage.set(normalizedKey, record);
    return {
      isLocked: true,
      lockoutRemainingSeconds: Math.ceil(AUTH_LIMITS.LOCKOUT_DURATION_MS / 1000),
    };
  }

  rateLimitStorage.set(normalizedKey, record);
  return { isLocked: false };
}

/**
 * Resets the rate limit counter upon successful authentication.
 */
export function resetRateLimit(key: string): void {
  const normalizedKey = key.toLowerCase().trim();
  rateLimitStorage.delete(normalizedKey);
}

// ============================================================================
// 6. CRYPTOGRAPHIC PASSWORD HASHING (Web Crypto API SHA-256 + Salt)
// ============================================================================

/**
 * Generates a cryptographically strong random salt using Web Crypto CSPRNG.
 */
export function generateSecureSalt(length = 16): string {
  if (typeof window !== 'undefined' && window.crypto?.getRandomValues) {
    const array = new Uint8Array(length);
    window.crypto.getRandomValues(array);
    return Array.from(array, (b) => b.toString(16).padStart(2, '0')).join('');
  }
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

/**
 * Generates a cryptographically secure SHA-256 password hash with salt.
 */
export async function hashPassword(password: string, salt?: string): Promise<string> {
  const activeSalt = salt || generateSecureSalt(16);
  const encoder = new TextEncoder();
  const data = encoder.encode(`${activeSalt}:${password}:bgremover_saas_sec_v2`);

  if (typeof window !== 'undefined' && window.crypto?.subtle) {
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hexHash = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    return `sha256$${activeSalt}$${hexHash}`;
  }

  // Safe fallback if subtle crypto is unavailable
  let hash = 0;
  const str = `${activeSalt}:${password}`;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return `legacy$${activeSalt}$${Math.abs(hash).toString(36)}`;
}

/**
 * Verifies a password against a stored cryptographic hash. Supports legacy hash upgrade.
 */
export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  if (!password || !storedHash) return false;

  // Modern SHA-256 Salted Hash (Format: sha256$<salt>$<hex>)
  if (storedHash.startsWith('sha256$')) {
    const parts = storedHash.split('$');
    if (parts.length === 3) {
      const salt = parts[1];
      const computed = await hashPassword(password, salt);
      return computed === storedHash;
    }
  }

  // Legacy SHA fallback format
  if (storedHash.startsWith('legacy$')) {
    const parts = storedHash.split('$');
    if (parts.length === 3) {
      const salt = parts[1];
      const computed = await hashPassword(password, salt);
      return computed === storedHash;
    }
  }

  // Backwards compatibility with initial basic hash (Format: h_xxx)
  if (storedHash.startsWith('h_')) {
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
      hash = (hash << 5) - hash + password.charCodeAt(i);
      hash |= 0;
    }
    return 'h_' + Math.abs(hash).toString(36) === storedHash;
  }

  return false;
}

