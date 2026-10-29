import { prisma } from './prisma';
import { AuditAction } from '@prisma/client';

export interface AuditLogParams {
  actorId?: string;
  entityName: string;
  entityId?: string;
  action: AuditAction;
  oldValues?: Record<string, unknown> | null;
  newValues?: Record<string, unknown> | null;
  ipAddress?: string;
  userAgent?: string;
}

export async function recordAuditLog(params: AuditLogParams) {
  try {
    return await prisma.auditLog.create({
      data: {
        actorId: params.actorId || null,
        entityName: params.entityName,
        entityId: params.entityId || null,
        action: params.action,
        oldValues: params.oldValues ? (params.oldValues as any) : undefined,
        newValues: params.newValues ? (params.newValues as any) : undefined,
        ipAddress: params.ipAddress || null,
        userAgent: params.userAgent || null,
      },
    });
  } catch (err) {
    console.error('AuditLog creation failed:', err);
    return null;
  }
}
