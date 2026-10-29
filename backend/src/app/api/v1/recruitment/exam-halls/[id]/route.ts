import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { RecruitmentService } from '@/lib/services/recruitment.service';
import { extractBearerToken, verifyAccessToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const updateHallSchema = z.object({
  hallName: z.string().min(3).optional(),
  centerLocation: z.string().min(5).optional(),
  roomNumber: z.string().optional().nullable(),
  capacity: z.number().min(1).optional(),
});

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const hall = await prisma.examHall.findUnique({
      where: { id: params.id },
      include: {
        examSchedules: {
          include: {
            circular: true,
            _count: { select: { admitCards: true } },
          },
        },
      },
    });

    if (!hall) {
      return NextResponse.json({ success: false, message: 'Exam hall not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: hall });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: 'Failed to retrieve exam hall', detail: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = extractBearerToken(req);
    const payload = token ? verifyAccessToken(token) : null;
    const isDev = process.env.NODE_ENV !== 'production';

    if (!isDev && (!payload || (!payload.roles.includes('SUPER_ADMIN') && !payload.roles.includes('HR_ADMIN')))) {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const parsed = updateHallSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, errors: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const updated = await RecruitmentService.updateExamHall(params.id, parsed.data as any);

    return NextResponse.json({
      success: true,
      message: 'Exam hall updated successfully',
      data: updated,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to update exam hall' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = extractBearerToken(req);
    const payload = token ? verifyAccessToken(token) : null;
    const isDev = process.env.NODE_ENV !== 'production';

    if (!isDev && (!payload || (!payload.roles.includes('SUPER_ADMIN') && !payload.roles.includes('HR_ADMIN')))) {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    await RecruitmentService.deleteExamHall(params.id);

    return NextResponse.json({
      success: true,
      message: 'Exam hall deleted successfully',
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to delete exam hall' },
      { status: 500 }
    );
  }
}
