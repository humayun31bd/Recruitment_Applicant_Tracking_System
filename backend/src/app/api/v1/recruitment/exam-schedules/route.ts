import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { RecruitmentService } from '@/lib/services/recruitment.service';
import { extractBearerToken, verifyAccessToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ExamType } from '@prisma/client';

const scheduleExamSchema = z.object({
  circularId: z.string().uuid(),
  examType: z.nativeEnum(ExamType).default(ExamType.WRITTEN),
  examDate: z.string(),
  startTime: z.string(),
  endTime: z.string(),
  hallId: z.string().uuid(),
  totalMarks: z.number().min(1).default(100),
  passMarks: z.number().min(1).default(50),
  includeApplied: z.boolean().optional().default(false),
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const circularId = searchParams.get('circularId') || undefined;

    const [schedules, halls] = await Promise.all([
      prisma.examSchedule.findMany({
        where: circularId ? { circularId } : undefined,
        include: {
          hall: true,
          circular: {
            include: {
              designation: true,
              department: true,
            },
          },
          _count: { select: { admitCards: true, results: true } },
        },
        orderBy: { examDate: 'desc' },
      }),
      prisma.examHall.findMany({
        include: {
          _count: { select: { examSchedules: true } },
        },
        orderBy: { hallName: 'asc' },
      }),
    ]);

    return NextResponse.json({ success: true, data: { schedules, halls } });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: 'Failed to retrieve exam schedules', detail: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = extractBearerToken(req);
    const payload = token ? verifyAccessToken(token) : null;
    const isDev = process.env.NODE_ENV !== 'production';

    if (!isDev && (!payload || (!payload.roles.includes('SUPER_ADMIN') && !payload.roles.includes('HR_ADMIN')))) {
      return NextResponse.json({ success: false, message: 'Forbidden: Insufficient privileges' }, { status: 403 });
    }

    const body = await req.json();
    const parsed = scheduleExamSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, errors: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const schedule = await RecruitmentService.scheduleExamAndGenerateAdmitCards(parsed.data);

    return NextResponse.json({
      success: true,
      message: 'Exam scheduled and Admit Cards generated successfully',
      data: schedule,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to schedule exam' },
      { status: 500 }
    );
  }
}
