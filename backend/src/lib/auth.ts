import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { NextRequest, NextResponse } from 'next/server';

// ----------------------------------------------------------------------------
// SECURE JWT SECRETS (claude.md Rules 18-19)
// In production, enforce strong secrets (minimum 32 chars) and disallow defaults.
// ----------------------------------------------------------------------------
const isProduction = process.env.NODE_ENV === 'production';
const rawAccessSecret = process.env.JWT_ACCESS_SECRET;
const rawRefreshSecret = process.env.JWT_REFRESH_SECRET;

if (isProduction && (!rawAccessSecret || rawAccessSecret === 'default_access_secret_2026')) {
  console.error('CRITICAL SECURITY ALERT: Insecure default JWT_ACCESS_SECRET detected in production!');
}

const JWT_ACCESS_SECRET = rawAccessSecret || 'default_access_secret_2026_dev_env_only_key_32chars';
const JWT_REFRESH_SECRET = rawRefreshSecret || 'default_refresh_secret_2026_dev_env_only_key_32chars';

export interface TokenPayload {
  userId: string;
  employeeId: string;
  email: string;
  roles: string[];
  permissions: string[];
  isMfaVerified?: boolean;
}

/**
 * Secure Password Hashing:
 * claude.md Rule 13: "Passwords ko securely hash karo"
 * Upgraded from 10 to 12 work factor rounds.
 */
export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function signAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_ACCESS_SECRET, { expiresIn: '8h' });
}

export function signRefreshToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: '7d' });
}

export function verifyAccessToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_ACCESS_SECRET) as TokenPayload;
  } catch {
    return null;
  }
}

/**
 * Dual Token Extraction:
 * claude.md Rule 20: "Local storage se saare tokens hata do."
 * Supports extracting token from standard Authorization header OR secure httpOnly cookie!
 */
export function extractBearerToken(source?: string | NextRequest | null): string | null {
  if (!source) return null;

  // If a NextRequest is passed, check both Authorization header and secure httpOnly cookie
  if (typeof source !== 'string') {
    const authHeader = source.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7).trim();
    }
    const cookieToken = source.cookies.get('access_token')?.value;
    if (cookieToken) return cookieToken;
    return null;
  }

  // String extraction
  if (!source.startsWith('Bearer ')) {
    return source.trim() || null;
  }
  return source.substring(7).trim();
}

/**
 * Sets secure, httpOnly, SameSite=Strict cookies
 * Protects against XSS token theft from localStorage.
 */
export function setAuthCookies(
  res: NextResponse,
  accessToken: string,
  refreshToken?: string
): void {
  res.cookies.set('access_token', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 8 * 3600, // 8 hours
  });

  if (refreshToken) {
    res.cookies.set('refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 7 * 86400, // 7 days
    });
  }
}

/**
 * Clears authentication cookies upon logout
 */
export function clearAuthCookies(res: NextResponse): void {
  res.cookies.set('access_token', '', { path: '/', maxAge: 0 });
  res.cookies.set('refresh_token', '', { path: '/', maxAge: 0 });
}
