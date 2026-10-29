import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { extractBearerToken, verifyAccessToken } from '@/lib/auth';
import { BranchType } from '@prisma/client';

const createBranchSchema = z.object({
  code: z.string().min(2).toUpperCase(),
  name: z.string().min(3),
  type: z.nativeEnum(BranchType).default(BranchType.URBAN),
  zoneId: z.string().uuid(),
  regionId: z.string().uuid().optional(),
  address: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const zoneId = searchParams.get('zoneId');
    const companyId = searchParams.get('companyId');

    const branches = await prisma.branch.findMany({
      where: {
        ...(zoneId ? { zoneId } : {}),
        ...(companyId ? { zone: { companyId } } : {}),
      },
      include: {
        zone: {
          include: { company: true },
        },
        region: true,
        _count: { select: { users: true, deployments: true, manpowerRequisitions: true } },
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ success: true, data: branches });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: 'Failed to retrieve branches', detail: error.message },
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
    const parsed = createBranchSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, errors: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const branch = await prisma.branch.create({
      data: {
        code: parsed.data.code,
        name: parsed.data.name,
        type: parsed.data.type,
        zoneId: parsed.data.zoneId,
        regionId: parsed.data.regionId || null,
        address: parsed.data.address || null,
      },
      include: {
        zone: true,
        region: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Branch created successfully',
      data: branch,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to create branch' },
      { status: 500 }
    );
  }
}
