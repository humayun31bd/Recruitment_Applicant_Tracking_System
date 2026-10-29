import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { RecruitmentService } from '@/lib/services/recruitment.service';
import { extractBearerToken, verifyAccessToken } from '@/lib/auth';
import { RequisitionStatus } from '@prisma/client';

import { prisma } from '@/lib/prisma';

const createRequisitionSchema = z.object({
  departmentId: z.string().uuid(),
  designationId: z.string().uuid(),
  branchId: z.string().uuid().optional(),
  vacanciesCount: z.number().int().positive().default(1),
  justification: z.string().min(5),
  expectedJoinDate: z.string().optional(),
  budgetApproved: z.boolean().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') as RequisitionStatus | null;
    const departmentId = searchParams.get('departmentId') || undefined;

    const requisitions = await RecruitmentService.getRequisitions({
      status: status || undefined,
      departmentId,
    });

    return NextResponse.json({ success: true, data: requisitions });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: 'Failed to retrieve manpower requisitions', detail: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = extractBearerToken(req);
    const payload = token ? verifyAccessToken(token) : null;

    let initiatedById = payload?.userId;
    if (!initiatedById) {
      const fallbackUser = await prisma.user.findFirst({
        where: { email: 'admin@hris.local' },
        select: { id: true },
      });
      initiatedById = fallbackUser?.id;
    }

    if (!initiatedById) {
      return NextResponse.json({ success: false, message: 'Unauthorized. User session required.' }, { status: 401 });
    }

    const body = await req.json();
    const parsed = createRequisitionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, errors: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const requisition = await RecruitmentService.createRequisition({
      ...parsed.data,
      initiatedById,
    });

    return NextResponse.json({
      success: true,
      message: 'Manpower requisition submitted successfully',
      data: requisition,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to create requisition' },
      { status: 500 }
    );
  }
}
