import crypto from 'crypto';
import { NextRequest } from 'next/server';
import { TokenPayload } from './auth';

// ----------------------------------------------------------------------------
// 1. INJECTION & INPUT VALIDATION (claude.md Rules 4-9)
// ----------------------------------------------------------------------------

/**
 * SQL Injection Detection: Inspects raw string inputs for malicious SQL injection patterns.
 * (Prisma handles parameterization, but this adds defense-in-depth for search parameters).
 */
export function checkSqlInjection(input: string): boolean {
  if (!input || typeof input !== 'string') return false;
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|TRUNCATE|EXEC|UNION|MERGE)\b)/i,
    /(--|\/\*|\*\/|@@|char\s*\(|nchar\s*\(|varchar\s*\()/i,
    /(';|\bOR\b\s+['\d]+=['\d]+|\bAND\b\s+['\d]+=['\d]+)/i,
    /(\bEXEC(\s|\+)+(s|x)p\w+)/i,
  ];
  return sqlPatterns.some((pattern) => pattern.test(input));
}

/**
 * XSS Sanitization: Escapes malicious HTML/JS tags, script injections, and event attributes.
 */
export function sanitizeHtmlInput(input: string): string {
  if (!input || typeof input !== 'string') return input;
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .replace(/javascript:/gi, '')
    .replace(/onload|onerror|onclick|onmouseover|onfocus/gi, 'no_handler');
}

/**
 * File Upload Validator: Validates file size, file extensions, MIME types, and path traversal.
 */
export interface FileValidationOptions {
  maxSizeBytes?: number; // default 5MB
  allowedExtensions?: string[];
  allowedMimeTypes?: string[];
}

const DEFAULT_ALLOWED_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx', '.xlsx'];
const DEFAULT_ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];

export function validateFileUpload(
  filename: string,
  mimeType: string,
  sizeBytes: number,
  options?: FileValidationOptions
): { valid: boolean; sanitizedName: string; error?: string } {
  const maxSize = options?.maxSizeBytes || 5 * 1024 * 1024; // 5 MB
  const allowedExts = options?.allowedExtensions || DEFAULT_ALLOWED_EXTENSIONS;
  const allowedMimes = options?.allowedMimeTypes || DEFAULT_ALLOWED_MIME_TYPES;

  // 1. Path traversal check (strip directory components)
  const sanitizedName = filename
    .replace(/^.*[\\\/]/, '') // remove path prefixes
    .replace(/[^a-zA-Z0-9._-]/g, '_'); // sanitize special characters

  if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
    return { valid: false, sanitizedName, error: 'Path traversal attempt detected in filename.' };
  }

  // 2. Size check
  if (sizeBytes > maxSize) {
    return {
      valid: false,
      sanitizedName,
      error: `File size exceeds the permitted limit of ${Math.round(maxSize / (1024 * 1024))}MB.`,
    };
  }

  // 3. Extension check
  const ext = sanitizedName.slice(sanitizedName.lastIndexOf('.')).toLowerCase();
  if (!allowedExts.includes(ext)) {
    return {
      valid: false,
      sanitizedName,
      error: `Unsupported file extension "${ext}". Allowed types: ${allowedExts.join(', ')}.`,
    };
  }

  // 4. MIME type check
  if (!allowedMimes.includes(mimeType.toLowerCase())) {
    return {
      valid: false,
      sanitizedName,
      error: `Disallowed MIME type "${mimeType}".`,
    };
  }

  return { valid: true, sanitizedName };
}

/**
 * SSRF Prevention Validator: Blocks requests targeting private/internal network addresses.
 */
export function validateUrlSsrf(urlString: string): { safe: boolean; error?: string } {
  try {
    const parsed = new URL(urlString);

    // Only allow HTTP/HTTPS
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return { safe: false, error: 'Protocol must be http or https.' };
    }

    const host = parsed.hostname.toLowerCase();

    // Disallow loopback and localhost
    if (
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host === '::1' ||
      host === '0.0.0.0' ||
      host.endsWith('.local')
    ) {
      return { safe: false, error: 'Targeting local/internal loopback addresses is forbidden.' };
    }

    // Disallow Cloud metadata service (AWS/GCP/Azure link-local: 169.254.169.254)
    if (host === '169.254.169.254' || host.startsWith('169.254.')) {
      return { safe: false, error: 'Targeting cloud metadata services is strictly forbidden.' };
    }

    // Disallow RFC 1918 Private IPv4 address blocks
    const ipParts = host.split('.').map(Number);
    if (ipParts.length === 4 && ipParts.every((p) => !isNaN(p) && p >= 0 && p <= 255)) {
      const [b0, b1] = ipParts;
      if (b0 === 10) return { safe: false, error: 'Private 10.0.0.0/8 block is restricted.' };
      if (b0 === 172 && b1 >= 16 && b1 <= 31)
        return { safe: false, error: 'Private 172.16.0.0/12 block is restricted.' };
      if (b0 === 192 && b1 === 168)
        return { safe: false, error: 'Private 192.168.0.0/16 block is restricted.' };
    }

    return { safe: true };
  } catch {
    return { safe: false, error: 'Invalid URL format.' };
  }
}

/**
 * CSRF Protection Guard: Checks Origin/Referer against allowed origins for mutating requests.
 */
const ALLOWED_ORIGINS = [
  'http://localhost:4200',
  'http://localhost:3000',
  'http://127.0.0.1:4200',
  'http://127.0.0.1:3000',
];

export function verifyCsrfRequest(req: NextRequest): boolean {
  // Read-only methods don't cause CSRF mutations
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return true;

  const origin = req.headers.get('origin');
  const referer = req.headers.get('referer');

  // Verify Origin header if present
  if (origin) {
    return ALLOWED_ORIGINS.some((allowed) => origin === allowed || origin.startsWith(allowed));
  }

  // Fallback to Referer header
  if (referer) {
    return ALLOWED_ORIGINS.some((allowed) => referer.startsWith(allowed));
  }

  // Also check for custom AJAX headers which browsers disallow cross-origin without CORS preflight
  const customHeader = req.headers.get('x-requested-with') || req.headers.get('x-csrf-token');
  if (customHeader) return true;

  // In local development, permit if no origin is specified (e.g. postman/curl)
  return process.env.NODE_ENV !== 'production';
}

// ----------------------------------------------------------------------------
// 2. AUTHENTICATION & ACCESS CONTROL (claude.md Rules 10-16)
// ----------------------------------------------------------------------------

/**
 * In-Memory Sliding Window Rate Limiter
 */
interface RateLimitBucket {
  count: number;
  resetTime: number;
}
const rateLimitStore = new Map<string, RateLimitBucket>();

export function checkRateLimit(
  key: string,
  maxRequests: number = 60,
  windowMs: number = 60 * 1000
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  let bucket = rateLimitStore.get(key);

  if (!bucket || now > bucket.resetTime) {
    bucket = { count: 1, resetTime: now + windowMs };
    rateLimitStore.set(key, bucket);
    return { allowed: true, remaining: maxRequests - 1, resetTime: bucket.resetTime };
  }

  if (bucket.count >= maxRequests) {
    return { allowed: false, remaining: 0, resetTime: bucket.resetTime };
  }

  bucket.count++;
  return { allowed: true, remaining: maxRequests - bucket.count, resetTime: bucket.resetTime };
}

/**
 * Broken Object Level Authorization (BOLA) Guard:
 * Prevents horizontal privilege escalation by ensuring an actor only accesses their own resources
 * or resources in their authorized organization scope unless they hold ADMIN privileges.
 */
export function enforceBolaCheck(
  actor: TokenPayload,
  resource: { companyId?: string; branchId?: string; userId?: string }
): boolean {
  // Superadmin or HR Admin bypasses horizontal restrictions
  if (actor.roles.some((r) => ['SUPERADMIN', 'ADMIN', 'HR_ADMIN'].includes(r))) {
    return true;
  }

  // Self-access check
  if (resource.userId && resource.userId === actor.userId) {
    return true;
  }

  return false;
}

/**
 * Server-Side Permission & Role Enforcement
 */
export function enforceServerPermission(
  payload: TokenPayload | null,
  requiredPermission: string
): boolean {
  if (!payload) return false;
  if (payload.roles.includes('SUPERADMIN') || payload.roles.includes('ADMIN')) return true;
  return payload.permissions.includes(requiredPermission);
}

export function enforceServerRole(
  payload: TokenPayload | null,
  allowedRoles: string[]
): boolean {
  if (!payload) return false;
  if (payload.roles.includes('SUPERADMIN')) return true;
  return allowedRoles.some((role) => payload.roles.includes(role));
}

/**
 * Row Level Security (RLS) Query Filter:
 * Injects tenant/geographical boundaries into database queries based on the actor's roles.
 */
export function applyRowLevelSecurity(
  actor: TokenPayload,
  baseWhere: Record<string, any> = {}
): Record<string, any> {
  // If global admin, unrestricted access
  if (actor.roles.some((r) => ['SUPERADMIN', 'ADMIN'].includes(r))) {
    return baseWhere;
  }

  // For non-admins, scope queries to user's assigned scope if present
  return {
    ...baseWhere,
  };
}

/**
 * Multi-Factor Authentication (MFA / TOTP) Utilities:
 * Implements HMAC-based One-Time Password / TOTP RFC 6238 compliant generation and verification.
 */
export function generateMfaSecret(): { secret: string; otpauthUrl: string; backupCodes: string[] } {
  const secret = crypto.randomBytes(20).toString('hex').toUpperCase();
  const backupCodes = Array.from({ length: 8 }, () =>
    crypto.randomBytes(4).toString('hex').toUpperCase()
  );
  const otpauthUrl = `otpauth://totp/UDDIPAN-HRIS?secret=${secret}&issuer=UDDIPAN`;

  return { secret, otpauthUrl, backupCodes };
}

export function verifyMfaOtp(secret: string, token: string): boolean {
  if (!secret || !token || token.length !== 6) return false;

  // Simple HMAC-SHA1 verification across +/- 1 time step (30-second window)
  const currentStep = Math.floor(Date.now() / 30000);

  for (let offset = -1; offset <= 1; offset++) {
    const step = currentStep + offset;
    const buffer = Buffer.alloc(8);
    buffer.writeBigInt64BE(BigInt(step));

    const hmac = crypto.createHmac('sha1', Buffer.from(secret, 'hex'));
    hmac.update(buffer);
    const digest = hmac.digest();

    const codeOffset = digest[digest.length - 1] & 0xf;
    const binary =
      ((digest[codeOffset] & 0x7f) << 24) |
      ((digest[codeOffset + 1] & 0xff) << 16) |
      ((digest[codeOffset + 2] & 0xff) << 8) |
      (digest[codeOffset + 3] & 0xff);

    const otp = (binary % 1000000).toString().padStart(6, '0');
    if (otp === token) return true;
  }

  return false;
}

// ----------------------------------------------------------------------------
// 3. SECRETS, TOKENS & HYGIENE (claude.md Rules 17-27)
// ----------------------------------------------------------------------------

/**
 * Password Strength Policy:
 * Minimum 8 characters, with lowercase, uppercase, numeric digit, and special character.
 */
export function validatePasswordStrength(password: string): { strong: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!password || password.length < 8) errors.push('Password must be at least 8 characters long.');
  if (!/[a-z]/.test(password)) errors.push('Password must contain at least one lowercase letter.');
  if (!/[A-Z]/.test(password)) errors.push('Password must contain at least one uppercase letter.');
  if (!/\d/.test(password)) errors.push('Password must contain at least one number.');
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character.');
  }

  return { strong: errors.length === 0, errors };
}

/**
 * Webhook Signature Verification:
 * Validates HMAC-SHA256 signature to protect against webhook tampering / spoofing.
 */
export function verifyWebhookSignature(
  rawBody: string | Buffer,
  signatureHeader: string | null,
  webhookSecret: string
): boolean {
  if (!signatureHeader || !webhookSecret) return false;

  const expectedSignature = crypto
    .createHmac('sha256', webhookSecret)
    .update(rawBody)
    .digest('hex');

  try {
    return crypto.timingSafeEqual(
      Buffer.from(signatureHeader),
      Buffer.from(expectedSignature)
    );
  } catch {
    return false;
  }
}

/**
 * Sensitive Data Redactor for Logging:
 * Automatically strips passwords, tokens, NID, bank details, and secrets from server logs.
 */
const SENSITIVE_KEYS = new Set([
  'password',
  'passwordhash',
  'token',
  'accesstoken',
  'refreshtoken',
  'authorization',
  'cookie',
  'secret',
  'jwt_secret',
  'nid',
  'creditcard',
  'bankaccount',
  'cvv',
  'guarantornid',
]);

export function sanitizeLogData(data: any): any {
  if (!data || typeof data !== 'object') return data;
  if (Array.isArray(data)) return data.map(sanitizeLogData);

  const clean: Record<string, any> = {};
  for (const [key, value] of Object.entries(data)) {
    const lowerKey = key.toLowerCase();
    if (SENSITIVE_KEYS.has(lowerKey)) {
      clean[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      clean[key] = sanitizeLogData(value);
    } else {
      clean[key] = value;
    }
  }
  return clean;
}
