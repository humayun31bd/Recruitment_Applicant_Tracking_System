import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { TransferService } from '@/lib/services/transfer.service';
import { extractBearerToken, verifyAccessToken } from '@/lib/auth';
import { TransitionType } from '@prisma/client';

const createTransferSchema = z.object({
  userId: z.string().uuid(),
  fromBranchId: z.string().uuid(),
  toBranchId: z.string().uuid(),
  fromDepartmentId: z.string().uuid(),
  toDepartmentId: z.string().uuid(),
  fromDesignationId: z.string().uuid(),
  toDesignationId: z.string().uuid(),
  transitionType: z.nativeEnum(TransitionType),
  effectiveDate: z.string(),
  reason: z.string().min(5),
  checklistData: z.record(z.boolean()).optional(),
});

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = extractBearerToken(authHeader);

    if (!token || !verifyAccessToken(token)) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const proposals = await TransferService.getTransferProposals();
    return NextResponse.json({ success: true, data: proposals });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: 'Error retrieving transfer proposals', detail: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = extractBearerToken(authHeader);

    if (!token) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    const payload = verifyAccessToken(token);
    if (!payload) return NextResponse.json({ success: false, message: 'Invalid token' }, { status: 401 });

    const body = await req.json();
    const parsed = createTransferSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, errors: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const proposal = await TransferService.createTransferProposal({
      ...parsed.data,
      initiatorId: payload.userId,
    });

    return NextResponse.json({
      success: true,
      message: 'Transfer proposal initiated and submitted into approval pipeline',
      data: proposal,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to submit transfer proposal' },
      { status: 500 }
    );
  }
}
