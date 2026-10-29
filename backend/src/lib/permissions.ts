import { AuthenticatedUser, hasAnyRole } from "@/lib/auth-rbac";
import { AppError } from "@/lib/error-handler";

export enum Permission {
  CANDIDATE_READ = "candidate:read",
  CANDIDATE_CREATE = "candidate:create",
  CANDIDATE_UPDATE = "candidate:update",
  CANDIDATE_DELETE = "candidate:delete",
  VIVA_MARK_ATTENDANCE = "viva:mark_attendance",
  VIVA_SUBMIT_SCORE = "viva:submit_score",
  REPORT_VIEW = "report:view"
}

// Maps existing system roles (SUPERADMIN, ADMIN, etc.) to granular permissions
export const ROLE_PERMISSIONS: Record<string, Set<Permission>> = {
  SUPERADMIN: new Set(Object.values(Permission)),
  HQ_ADMIN: new Set(Object.values(Permission)),
  ADMIN: new Set([
    Permission.CANDIDATE_READ,
    Permission.CANDIDATE_CREATE,
    Permission.CANDIDATE_UPDATE,
    Permission.REPORT_VIEW
  ]),
  ZONE_ADMIN: new Set([
    Permission.CANDIDATE_READ,
    Permission.CANDIDATE_CREATE,
    Permission.CANDIDATE_UPDATE,
    Permission.REPORT_VIEW
  ]),
  BRANCH_ADMIN: new Set([
    Permission.CANDIDATE_READ,
    Permission.CANDIDATE_CREATE,
    Permission.CANDIDATE_UPDATE,
    Permission.REPORT_VIEW
  ]),
  VIVA_BOARD_MEMBER: new Set([
    Permission.CANDIDATE_READ,
    Permission.VIVA_MARK_ATTENDANCE,
    Permission.VIVA_SUBMIT_SCORE
  ]),
  USER: new Set([
    Permission.CANDIDATE_READ,
    Permission.CANDIDATE_CREATE
  ])
};

export function hasPermission(user: AuthenticatedUser, permission: Permission): boolean {
  if (hasAnyRole(user, ["SUPERADMIN", "HQ_ADMIN"])) {
    return true;
  }

  for (const role of user.roles) {
    const rolePerms = ROLE_PERMISSIONS[role];
    if (rolePerms && rolePerms.has(permission)) {
      return true;
    }
  }

  return false;
}

export function requirePermission(user: AuthenticatedUser, permission: Permission): void {
  if (!hasPermission(user, permission)) {
    throw new AppError(`Forbidden: Missing permission [${permission}]`, 403, "PERMISSION_DENIED");
  }
}
