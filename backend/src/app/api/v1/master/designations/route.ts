import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { extractBearerToken, verifyAccessToken } from '@/lib/auth';

const createDesignationSchema = z.object({
  code: z.string().min(2).toUpperCase(),
  title: z.string().min(2),
  departmentId: z.string().uuid(),
  jobGradeId: z.string().uuid().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const departmentId = searchParams.get('departmentId');
    const companyId = searchParams.get('companyId');

    const designations = await prisma.designation.findMany({
      where: {
        ...(departmentId ? { departmentId } : {}),
        ...(companyId ? { department: { companyId } } : {}),
      },
      include: {
        department: {
          include: { company: true },
        },
        jobGrade: true,
        _count: { select: { users: true, jobCirculars: true } },
      },
      orderBy: { title: 'asc' },
    });

    return NextResponse.json({ success: true, data: designations });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: 'Failed to retrieve designations', detail: error.message },
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
    const parsed = createDesignationSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, errors: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const designation = await prisma.designation.create({
      data: {
        code: parsed.data.code,
        title: parsed.data.title,
        departmentId: parsed.data.departmentId,
        jobGradeId: parsed.data.jobGradeId || null,
      },
      include: {
        department: true,
        jobGrade: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Designation created successfully',
      data: designation,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to create designation' },
      { status: 500 }
    );
  }
}
