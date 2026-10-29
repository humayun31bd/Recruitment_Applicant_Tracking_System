import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { extractBearerToken, verifyAccessToken } from '@/lib/auth';

const createCompanySchema = z.object({
  code: z.string().min(2).toUpperCase(),
  name: z.string().min(3),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
});

export async function GET(req: NextRequest) {
  try {
    const companies = await prisma.company.findMany({
      include: {
        headquarters: true,
        zones: {
          include: {
            branches: true,
            regions: true,
            _count: { select: { branches: true } },
          },
          orderBy: { name: 'asc' },
        },
        departments: {
          include: {
            designations: {
              include: { jobGrade: true },
              orderBy: { title: 'asc' },
            },
            _count: { select: { designations: true } },
          },
          orderBy: { name: 'asc' },
        },
        _count: {
          select: {
            zones: true,
            departments: true,
            headquarters: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ success: true, data: companies });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: 'Failed to retrieve companies', detail: error.message },
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
    const parsed = createCompanySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, errors: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    // Check unique code
    const existing = await prisma.company.findUnique({
      where: { code: parsed.data.code },
    });
    if (existing) {
      return NextResponse.json(
        { success: false, message: `Company code "${parsed.data.code}" already exists` },
        { status: 409 }
      );
    }

    const company = await prisma.company.create({
      data: {
        code: parsed.data.code,
        name: parsed.data.name,
        address: parsed.data.address || null,
        phone: parsed.data.phone || null,
        email: parsed.data.email || null,
      },
      include: {
        _count: {
          select: {
            zones: true,
            departments: true,
            headquarters: true,
          },
        },
      },
    });

    return NextResponse.json(
      { success: true, message: 'Company created successfully', data: company },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: 'Failed to create company', detail: error.message },
      { status: 500 }
    );
  }
}
