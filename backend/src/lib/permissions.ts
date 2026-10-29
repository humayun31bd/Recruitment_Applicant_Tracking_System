import { AuthenticatedUser } from "@/lib/auth-rbac";
import { AppError } from "@/lib/error-handler";

export enum Permission {
  CANDIDATE_READ = "candidate:read",
  CANDIDATE_CREATE = "candidate:create",
  CANDIDATE_UPDATE = "candidate:update",
  CANDIDATE_DELETE = "candidate:delete",
  VIVA_VIEW_BOARD = "viva:view_board",
  VIVA_MARK_ATTENDANCE = "viva:mark_attendance",
  VIVA_SUBMIT_SCORE = "viva:submit_score",
  REPORT_VIEW = "report:view"
}

export const ROLE_PERMISSIONS: Record<string, Set<Permission>> = {
  HQ_ADMIN: new Set(Object.values(Permission)),
  ZONE_ADMIN: new Set([
    Permission.CANDIDATE_READ,
    Permission.CANDIDATE_CREATE,
    Permission.CANDIDATE_UPDATE,
    Permission.VIVA_VIEW_BOARD,
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
    Permission.VIVA_VIEW_BOARD,
    Permission.VIVA_MARK_ATTENDANCE,
    Permission.VIVA_SUBMIT_SCORE
  ]),
  USER: new Set([
    Permission.CANDIDATE_READ,
    Permission.CANDIDATE_CREATE
  ])
};

export function hasPermission(user: AuthenticatedUser, permission: Permission): boolean {
  if (user.role === "HQ_ADMIN") return true;
  const userPerms = ROLE_PERMISSIONS[user.role];
  return Boolean(userPerms && userPerms.has(permission));
}

export function requirePermission(user: AuthenticatedUser, permission: Permission): void {
  if (!hasPermission(user, permission)) {
    throw new AppError(Forbidden: Missing permission [], 403, "PERMISSION_DENIED");
  }
}
