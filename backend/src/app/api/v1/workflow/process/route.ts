import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { extractBearerToken, verifyAccessToken } from '@/lib/auth';
import { WorkflowEngine } from '@/lib/workflow';
import { recordAuditLog } from '@/lib/audit';
import { AuditAction, WorkflowAction } from '@prisma/client';

const processWorkflowSchema = z.object({
  instanceId: z.string().uuid(),
  action: z.nativeEnum(WorkflowAction),
  remarks: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = extractBearerToken(authHeader);

    if (!token) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const payload = verifyAccessToken(token);
    if (!payload) {
      return NextResponse.json({ success: false, message: 'Invalid token' }, { status: 401 });
    }

    const body = await req.json();
    const parsed = processWorkflowSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, errors: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { instanceId, action, remarks } = parsed.data;

    const result = await WorkflowEngine.processAction({
      instanceId,
      actorId: payload.userId,
      action,
      remarks,
    });

    await recordAuditLog({
      actorId: payload.userId,
      entityName: 'ApprovalInstance',
      entityId: instanceId,
      action: AuditAction.WORKFLOW_TRANSITION,
      newValues: { action, currentStepOrder: result.currentStepOrder, status: result.status, remarks },
      ipAddress: req.headers.get('x-forwarded-for') || req.ip || undefined,
      userAgent: req.headers.get('user-agent') || undefined,
    });

    return NextResponse.json({
      success: true,
      message: `Workflow action ${action} executed successfully`,
      data: result,
    });
  } catch (error: any) {
    console.error('Workflow process error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Workflow transition failed' },
      { status: 500 }
    );
  }
}
