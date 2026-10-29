import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { SuccessionService } from '@/lib/services/succession.service';
import { extractBearerToken, verifyAccessToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { TransitionType } from '@prisma/client';

const submitPromotionSchema = z.object({
  userId: z.string().uuid(),
  toDesignationId: z.string().uuid(),
  toGradeId: z.string().uuid(),
  transitionType: z.nativeEnum(TransitionType),
  effectiveDate: z.string(),
  checklistData: z.record(z.boolean()),
  remarks: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = extractBearerToken(authHeader);

    if (!token || !verifyAccessToken(token)) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const promotions = await prisma.promotionRecord.findMany({
      include: {
        user: { select: { id: true, employeeId: true, firstName: true, lastName: true } },
        fromDesignation: true,
        toDesignation: true,
        fromGrade: true,
        toGrade: true,
      },
      orderBy: { effectiveDate: 'desc' },
    });

    return NextResponse.json({ success: true, data: promotions });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: 'Failed to retrieve promotions', detail: error.message },
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
    if (!payload || (!payload.roles.includes('SUPER_ADMIN') && !payload.roles.includes('HR_ADMIN'))) {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const parsed = submitPromotionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, errors: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const promotion = await SuccessionService.submitPromotion(parsed.data);

    return NextResponse.json({
      success: true,
      message: 'Promotion processed and recorded successfully',
      data: promotion,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to submit promotion' },
      { status: 500 }
    );
  }
}
