import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { SuccessionService } from '@/lib/services/succession.service';
import { extractBearerToken, verifyAccessToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { IncrementType } from '@prisma/client';

const processIncrementSchema = z.object({
  userId: z.string().uuid(),
  incrementType: z.nativeEnum(IncrementType),
  incrementPercentage: z.number().min(0).optional(),
  flatAmount: z.number().min(0).optional(),
  effectiveDate: z.string(),
  checklistData: z.record(z.boolean()).optional(),
});

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = extractBearerToken(authHeader);

    if (!token || !verifyAccessToken(token)) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const increments = await prisma.incrementRecord.findMany({
      include: {
        user: { select: { id: true, employeeId: true, firstName: true, lastName: true } },
      },
      orderBy: { effectiveDate: 'desc' },
    });

    return NextResponse.json({ success: true, data: increments });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: 'Failed to retrieve increments', detail: error.message },
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
    const parsed = processIncrementSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, errors: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const increment = await SuccessionService.processIncrement(parsed.data);

    return NextResponse.json({
      success: true,
      message: 'Increment processed successfully and salary updated',
      data: increment,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to process increment' },
      { status: 500 }
    );
  }
}
