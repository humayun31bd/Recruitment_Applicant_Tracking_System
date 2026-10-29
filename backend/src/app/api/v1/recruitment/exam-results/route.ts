import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { RecruitmentService } from '@/lib/services/recruitment.service';
import { extractBearerToken, verifyAccessToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const uploadResultSchema = z.object({
  examScheduleId: z.string().uuid(),
  results: z.array(
    z.object({
      candidateId: z.string().uuid(),
      marksObtained: z.number().min(0),
    })
  ),
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const examScheduleId = searchParams.get('examScheduleId');

    const results = await prisma.examResult.findMany({
      where: examScheduleId ? { examScheduleId } : undefined,
      include: {
        candidate: {
          include: {
            circular: {
              include: { designation: true, department: true },
            },
          },
        },
        examSchedule: {
          include: {
            hall: true,
            circular: true,
          },
        },
      },
      orderBy: [
        { meritRank: 'asc' },
        { marksObtained: 'desc' },
      ],
    });

    return NextResponse.json({ success: true, data: results });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to retrieve exam results' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = extractBearerToken(authHeader);
    const isDev = process.env.NODE_ENV !== 'production';

    if (token) {
      const payload = verifyAccessToken(token);
      if (!isDev && (!payload || (!payload.roles.includes('SUPER_ADMIN') && !payload.roles.includes('HR_ADMIN')))) {
        return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
      }
    } else if (!isDev) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const parsed = uploadResultSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, errors: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const res = await RecruitmentService.uploadExamResults(parsed.data);

    return NextResponse.json({
      success: true,
      message: `Exam results uploaded and ranked. ${res.totalUploaded} candidate scores processed.`,
      data: res,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to upload exam results' },
      { status: 500 }
    );
  }
}

