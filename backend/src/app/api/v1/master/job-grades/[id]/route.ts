import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { extractBearerToken, verifyAccessToken } from '@/lib/auth';

const updateJobGradeSchema = z.object({
  gradeCode: z.string().min(2).toUpperCase().optional(),
  level: z.number().int().min(1).optional(),
  minSalary: z.number().nonnegative().optional(),
  maxSalary: z.number().nonnegative().optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const { id } = await Promise.resolve(params);
    const grade = await prisma.jobGrade.findUnique({
      where: { id },
      include: {
        designations: true,
        payScales: true,
        _count: { select: { designations: true, payScales: true, jobCirculars: true } },
      },
    });

    if (!grade) {
      return NextResponse.json({ success: false, message: 'Job Grade not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: grade });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: 'Failed to retrieve job grade', detail: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = extractBearerToken(authHeader);
    const payload = token ? verifyAccessToken(token) : null;
    if (!payload && process.env.NODE_ENV === 'production') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await Promise.resolve(params);
    const body = await req.json();
    const parsed = updateJobGradeSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, errors: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const existing = await prisma.jobGrade.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ success: false, message: 'Job Grade not found' }, { status: 404 });
    }

    const updated = await prisma.jobGrade.update({
      where: { id },
      data: {
        ...(parsed.data.gradeCode ? { gradeCode: parsed.data.gradeCode } : {}),
        ...(parsed.data.level !== undefined ? { level: parsed.data.level } : {}),
        ...(parsed.data.minSalary !== undefined ? { minSalary: parsed.data.minSalary } : {}),
        ...(parsed.data.maxSalary !== undefined ? { maxSalary: parsed.data.maxSalary } : {}),
      },
      include: {
        _count: { select: { designations: true, payScales: true } },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Job Grade updated successfully',
      data: updated,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to update job grade' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = extractBearerToken(authHeader);
    const payload = token ? verifyAccessToken(token) : null;
    if (!payload && process.env.NODE_ENV === 'production') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await Promise.resolve(params);
    const grade = await prisma.jobGrade.findUnique({
      where: { id },
      include: {
        _count: { select: { designations: true, payScales: true, jobCirculars: true } },
      },
    });

    if (!grade) {
      return NextResponse.json({ success: false, message: 'Job Grade not found' }, { status: 404 });
    }

    if (grade._count.designations > 0 || grade._count.payScales > 0 || grade._count.jobCirculars > 0) {
      return NextResponse.json(
        {
          success: false,
          message: `Cannot delete job grade "${grade.gradeCode}" because it is linked to ${grade._count.designations} designations or active pay scales.`,
        },
        { status: 400 }
      );
    }

    await prisma.jobGrade.delete({ where: { id } });

    return NextResponse.json({
      success: true,
      message: `Job Grade "${grade.gradeCode}" deleted successfully.`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to delete job grade' },
      { status: 500 }
    );
  }
}
