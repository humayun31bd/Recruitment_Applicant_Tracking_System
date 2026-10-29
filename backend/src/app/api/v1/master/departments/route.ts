import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { extractBearerToken, verifyAccessToken } from '@/lib/auth';

const createDepartmentSchema = z.object({
  code: z.string().min(2).toUpperCase(),
  name: z.string().min(3),
  companyId: z.string().uuid().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const companyId = searchParams.get('companyId');

    const departments = await prisma.department.findMany({
      where: companyId ? { companyId } : undefined,
      include: {
        company: true,
        designations: {
          include: { jobGrade: true },
        },
        _count: { select: { designations: true, users: true } },
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ success: true, data: departments });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: 'Failed to retrieve departments', detail: error.message },
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
    const parsed = createDepartmentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, errors: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    // Default company if not passed
    let companyId = parsed.data.companyId;
    if (!companyId) {
      const company = await prisma.company.findFirst();
      if (!company) throw new Error('No company found in database.');
      companyId = company.id;
    }

    const department = await prisma.department.create({
      data: {
        code: parsed.data.code,
        name: parsed.data.name,
        companyId,
      },
      include: { company: true },
    });

    return NextResponse.json({
      success: true,
      message: 'Department created successfully',
      data: department,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to create department' },
      { status: 500 }
    );
  }
}
