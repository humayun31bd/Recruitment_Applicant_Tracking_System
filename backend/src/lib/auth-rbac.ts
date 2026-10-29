import { NextRequest } from "next/server";
import { verifyJwt } from "@/lib/jwt";
import { AppError } from "@/lib/error-handler";

export interface AuthenticatedUser {
  id: string;
  email: string;
  roles: string[];           // Matches existing token: ["SUPERADMIN", "ADMIN", ...]
  role?: string;             // Backward-compatible fallback
  zoneId?: string | null;
  branchId?: string | null;
  isMfaVerified?: boolean;
}

export function extractToken(req: NextRequest): string | null {
  const cookieToken = req.cookies.get("auth_token")?.value;
  if (cookieToken) return cookieToken;

  const rawCookie = req.headers.get("cookie");
  if (rawCookie) {
    const match = rawCookie.match(/auth_token=([^;]+)/);
    if (match) return decodeURIComponent(match[1]);
  }

  const authHeader = req.headers.get("authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.split(" ")[1];
  }

  return null;
}

export function extractUser(req: NextRequest): AuthenticatedUser | null {
  const token = extractToken(req);
  if (!token) return null;

  try {
    const decoded = verifyJwt<any>(token);

    // Normalize roles to string[]
    const roles: string[] = Array.isArray(decoded.roles)
      ? decoded.roles
      : decoded.role
      ? [decoded.role]
      : ["USER"];

    return {
      id: decoded.id,
      email: decoded.email,
      roles,
      role: roles[0] || "USER",
      zoneId: decoded.zoneId || null,
      branchId: decoded.branchId || null,
      isMfaVerified: decoded.isMfaVerified ?? true
    };
  } catch {
    return null;
  }
}

export function hasAnyRole(user: AuthenticatedUser, allowedRoles: string[]): boolean {
  if (user.roles.includes("SUPERADMIN") || user.roles.includes("HQ_ADMIN")) {
    return true;
  }
  return allowedRoles.some((role) => user.roles.includes(role) || user.role === role);
}

export function requireRoles(user: AuthenticatedUser, allowedRoles: string[]): void {
  if (!hasAnyRole(user, allowedRoles)) {
    throw new AppError("Forbidden: Insufficient privileges", 403, "FORBIDDEN");
  }
}
