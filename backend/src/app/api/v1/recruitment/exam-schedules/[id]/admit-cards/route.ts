import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { extractBearerToken, verifyAccessToken } from '@/lib/auth';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const admitCards = await prisma.admitCard.findMany({
      where: { examScheduleId: params.id },
      include: {
        candidate: {
          include: {
            circular: {
              include: { designation: true, department: true },
            },
          },
        },
        examSchedule: {
          include: { hall: true },
        },
      },
      orderBy: { rollNumber: 'asc' },
    });

    return NextResponse.json({ success: true, data: admitCards });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: 'Failed to retrieve admit cards', detail: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = extractBearerToken(req);
    const payload = token ? verifyAccessToken(token) : null;
    const isDev = process.env.NODE_ENV !== 'production';

    if (!isDev && (!payload || (!payload.roles.includes('SUPER_ADMIN') && !payload.roles.includes('HR_ADMIN')))) {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { admitCardIds, isPrinted } = body;

    if (Array.isArray(admitCardIds) && admitCardIds.length > 0) {
      await prisma.admitCard.updateMany({
        where: { id: { in: admitCardIds } },
        data: { isPrinted: isPrinted ?? true },
      });
    } else {
      // Mark all in this schedule
      await prisma.admitCard.updateMany({
        where: { examScheduleId: params.id },
        data: { isPrinted: isPrinted ?? true },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Admit card status updated',
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to update admit cards' },
      { status: 500 }
    );
  }
}
