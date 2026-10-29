import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { extractBearerToken, verifyAccessToken } from '@/lib/auth';

const updateDesignationSchema = z.object({
  code: z.string().min(2).toUpperCase().optional(),
  title: z.string().min(2).optional(),
  departmentId: z.string().uuid().optional(),
  jobGradeId: z.string().uuid().nullable().optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const { id } = await Promise.resolve(params);
    const designation = await prisma.designation.findUnique({
      where: { id },
      include: {
        department: true,
        jobGrade: true,
        _count: { select: { users: true, jobCirculars: true, deployments: true } },
      },
    });

    if (!designation) {
      return NextResponse.json({ success: false, message: 'Designation not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: designation });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: 'Failed to retrieve designation', detail: error.message },
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
    const parsed = updateDesignationSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, errors: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const existing = await prisma.designation.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ success: false, message: 'Designation not found' }, { status: 404 });
    }

    const updated = await prisma.designation.update({
      where: { id },
      data: {
        ...(parsed.data.code ? { code: parsed.data.code } : {}),
        ...(parsed.data.title ? { title: parsed.data.title } : {}),
        ...(parsed.data.departmentId ? { departmentId: parsed.data.departmentId } : {}),
        ...(parsed.data.jobGradeId !== undefined ? { jobGradeId: parsed.data.jobGradeId } : {}),
      },
      include: {
        department: true,
        jobGrade: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Designation updated successfully',
      data: updated,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to update designation' },
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
    const designation = await prisma.designation.findUnique({
      where: { id },
      include: {
        _count: { select: { users: true, jobCirculars: true, deployments: true, manpowerRequisitions: true } },
      },
    });

    if (!designation) {
      return NextResponse.json({ success: false, message: 'Designation not found' }, { status: 404 });
    }

    if (
      designation._count.users > 0 ||
      designation._count.jobCirculars > 0 ||
      designation._count.deployments > 0 ||
      designation._count.manpowerRequisitions > 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message: `Cannot delete designation "${designation.title}" because it is currently assigned to ${designation._count.users} employees, ${designation._count.jobCirculars} circulars, or active requisitions.`,
        },
        { status: 400 }
      );
    }

    await prisma.designation.delete({ where: { id } });

    return NextResponse.json({
      success: true,
      message: `Designation "${designation.title}" deleted successfully.`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to delete designation' },
      { status: 500 }
    );
  }
}
