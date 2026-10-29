import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { extractBearerToken, verifyAccessToken } from '@/lib/auth';
import { BranchType } from '@prisma/client';

const updateBranchSchema = z.object({
  code: z.string().min(2).toUpperCase().optional(),
  name: z.string().min(3).optional(),
  type: z.nativeEnum(BranchType).optional(),
  zoneId: z.string().uuid().optional(),
  regionId: z.string().uuid().nullable().optional(),
  address: z.string().nullable().optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const { id } = await Promise.resolve(params);
    const branch = await prisma.branch.findUnique({
      where: { id },
      include: {
        zone: true,
        region: true,
        _count: { select: { users: true, deployments: true, manpowerRequisitions: true } },
      },
    });

    if (!branch) {
      return NextResponse.json({ success: false, message: 'Branch not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: branch });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: 'Failed to retrieve branch', detail: error.message },
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
    const parsed = updateBranchSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, errors: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const existing = await prisma.branch.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ success: false, message: 'Branch not found' }, { status: 404 });
    }

    const updated = await prisma.branch.update({
      where: { id },
      data: {
        ...(parsed.data.code ? { code: parsed.data.code } : {}),
        ...(parsed.data.name ? { name: parsed.data.name } : {}),
        ...(parsed.data.type ? { type: parsed.data.type } : {}),
        ...(parsed.data.zoneId ? { zoneId: parsed.data.zoneId } : {}),
        ...(parsed.data.regionId !== undefined ? { regionId: parsed.data.regionId } : {}),
        ...(parsed.data.address !== undefined ? { address: parsed.data.address } : {}),
      },
      include: {
        zone: true,
        region: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Branch updated successfully',
      data: updated,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to update branch' },
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
    const branch = await prisma.branch.findUnique({
      where: { id },
      include: {
        _count: { select: { users: true, deployments: true, manpowerRequisitions: true } },
      },
    });

    if (!branch) {
      return NextResponse.json({ success: false, message: 'Branch not found' }, { status: 404 });
    }

    if (
      branch._count.users > 0 ||
      branch._count.deployments > 0 ||
      branch._count.manpowerRequisitions > 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message: `Cannot delete branch "${branch.name}" because it has ${branch._count.users} stationed staff or active deployment/requisition records.`,
        },
        { status: 400 }
      );
    }

    await prisma.branch.delete({ where: { id } });

    return NextResponse.json({
      success: true,
      message: `Branch "${branch.name}" deleted successfully.`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to delete branch' },
      { status: 500 }
    );
  }
}
