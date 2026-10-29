import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { extractBearerToken, verifyAccessToken } from '@/lib/auth';

const createJobGradeSchema = z.object({
  gradeCode: z.string().min(2).toUpperCase(),
  level: z.number().int().min(1),
  minSalary: z.number().nonnegative(),
  maxSalary: z.number().nonnegative(),
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const companyId = searchParams.get('companyId');

    const jobGrades = await prisma.jobGrade.findMany({
      include: {
        designations: {
          where: companyId ? { department: { companyId } } : undefined,
          include: {
            department: {
              include: { company: true },
            },
          },
        },
        _count: { select: { designations: true, payScales: true } },
      },
      orderBy: { level: 'asc' },
    });

    return NextResponse.json({ success: true, data: jobGrades });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: 'Failed to retrieve job grades', detail: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = extractBearerToken(authHeader);
    const payload = token ? verifyAccessToken(token) : null;
    if (!payload && process.env.NODE_ENV === 'production') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const parsed = createJobGradeSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, errors: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const grade = await prisma.jobGrade.create({
      data: {
        gradeCode: parsed.data.gradeCode,
        level: parsed.data.level,
        minSalary: parsed.data.minSalary,
        maxSalary: parsed.data.maxSalary,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Job Grade created successfully',
      data: grade,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to create job grade' },
      { status: 500 }
    );
  }
}
