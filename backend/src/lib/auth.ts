import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
export interface AuthenticatedUser {
  id: string;
  email: string;
  roles: string[];
  permissions?: string[];
  zoneId?: string | null;
  branchId?: string | null;
  isMfaVerified: boolean;
}
const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
export function verifyAccessToken(token: string): AuthenticatedUser | null {
  if (!ACCESS_SECRET) {
    throw new Error("FATAL: JWT_ACCESS_SECRET is missing from environment.");
  }
  try {
    const decoded = jwt.verify(token, ACCESS_SECRET) as any;
    const roles: string[] = Array.isArray(decoded.roles)
      ? decoded.roles
      : decoded.role
      ? [decoded.role]
      : ["USER"];
    return {
      id: decoded.id,
      email: decoded.email,
      roles,
      permissions: decoded.permissions || [],
      zoneId: decoded.zoneId || null,
      branchId: decoded.branchId || null,
      isMfaVerified: Boolean(decoded.isMfaVerified)
    };
  } catch {
    return null;
  }
}
export function extractUser(req: NextRequest): AuthenticatedUser | null {
  let token = req.cookies.get("auth_token")?.value;
  if (!token) {
    const rawCookie = req.headers.get("cookie");
    if (rawCookie) {
      const match = rawCookie.match(/auth_token=([^;]+)/);
      if (match) token = decodeURIComponent(match[1]);
    }
  }
  if (!token) {
    const authHeader = req.headers.get("authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    }
  }
  if (!token) return null;
  return verifyAccessToken(token);
}
// Higher-order route wrapper for all API endpoints
export function withAuth(
  requiredPermissionOrRoles?: string | string[],
  handler?: (req: NextRequest, ctx: { user: AuthenticatedUser; params?: any }) => Promise<NextResponse>
) {
  // Overload: withAuth(handler) without specific permission
  if (typeof requiredPermissionOrRoles === "function") {
    const fn = requiredPermissionOrRoles as any;
    return async (req: NextRequest, ctx: any) => {
      const user = extractUser(req);
      if (!user) {
        return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
      }
      if (!user.isMfaVerified) {
        return NextResponse.json({ success: false, error: "MFA verification required" }, { status: 403 });
      }
      return fn(req, { ...ctx, user });
    };
  }
  return (actionHandler: (req: NextRequest, ctx: { user: AuthenticatedUser; params?: any }) => Promise<NextResponse>) => {
    return async (req: NextRequest, ctx: any) => {
      const user = extractUser(req);
      if (!user) {
        return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
      }
      if (!user.isMfaVerified) {
        return NextResponse.json({ success: false, error: "MFA verification required" }, { status: 403 });
      }
      // Check Superadmin / Admin bypass
      const isSuperAdmin = user.roles.includes("SUPERADMIN") || user.roles.includes("HQ_ADMIN");
      if (!isSuperAdmin && requiredPermissionOrRoles) {
        const required = Array.isArray(requiredPermissionOrRoles)
          ? requiredPermissionOrRoles
          : [requiredPermissionOrRoles];
        const hasRequired = required.some(
          (reqItem) => user.roles.includes(reqItem) || (user.permissions && user.permissions.includes(reqItem))
        );
        if (!hasRequired) {
          return NextResponse.json(
            { success: false, error: `Forbidden: Missing required permission [${required.join(", ")}]` },
            { status: 403 }
          );
        }
      }
      return actionHandler(req, { ...ctx, user });
    };
  };
}
