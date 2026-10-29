import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { extractBearerToken, verifyAccessToken } from '@/lib/auth';

const createZoneSchema = z.object({
  code: z.string().min(2).toUpperCase(),
  name: z.string().min(3),
  companyId: z.string().uuid().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const companyId = searchParams.get('companyId');

    const zones = await prisma.zone.findMany({
      where: companyId ? { companyId } : undefined,
      include: {
        company: true,
        branches: true,
        _count: { select: { branches: true, regions: true, users: true } },
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ success: true, data: zones });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: 'Failed to retrieve zones', detail: error.message },
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
    const parsed = createZoneSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, errors: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    let companyId = parsed.data.companyId;
    if (!companyId) {
      const company = await prisma.company.findFirst();
      if (!company) throw new Error('No company found in database.');
      companyId = company.id;
    }

    const zone = await prisma.zone.create({
      data: {
        code: parsed.data.code,
        name: parsed.data.name,
        companyId,
      },
      include: { company: true },
    });

    return NextResponse.json({
      success: true,
      message: 'Operational Zone created successfully',
      data: zone,
    });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json(
        { success: false, message: 'A zone with this code already exists. Zone codes must be unique.' },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to create zone' },
      { status: 500 }
    );
  }
}
