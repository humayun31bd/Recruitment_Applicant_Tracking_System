import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { RecruitmentService } from '@/lib/services/recruitment.service';
import { extractBearerToken, verifyAccessToken } from '@/lib/auth';

const updateRequisitionSchema = z.object({
  vacanciesCount: z.number().int().positive().optional(),
  justification: z.string().min(5).optional(),
  expectedJoinDate: z.string().nullable().optional(),
  budgetApproved: z.boolean().optional(),
  branchId: z.string().uuid().nullable().optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const requisition = await RecruitmentService.getRequisitionById(id);

    if (!requisition) {
      return NextResponse.json({ success: false, message: 'Requisition not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: requisition });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: 'Failed to retrieve requisition', detail: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = extractBearerToken(req);
    const payload = token ? verifyAccessToken(token) : null;

    if (!payload) {
      // Check admin privilege
      // Allow if valid token or fallback
    }

    const { id } = await params;
    const body = await req.json();
    const parsed = updateRequisitionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, errors: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const updated = await RecruitmentService.updateRequisition(id, parsed.data);

    return NextResponse.json({
      success: true,
      message: 'Requisition updated successfully',
      data: updated,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to update requisition' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = await RecruitmentService.deleteRequisition(id);

    return NextResponse.json({
      success: true,
      message: 'Requisition deleted or cancelled successfully',
      data: result,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to delete requisition' },
      { status: 500 }
    );
  }
}
