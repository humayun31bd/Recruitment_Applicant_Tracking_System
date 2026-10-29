import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { extractBearerToken, verifyAccessToken } from '@/lib/auth';

const updateCompanySchema = z.object({
  code: z.string().min(2).toUpperCase().optional(),
  name: z.string().min(3).optional(),
  address: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().email().optional().nullable().or(z.literal('')),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const { id } = await Promise.resolve(params);
    const company = await prisma.company.findUnique({
      where: { id },
      include: {
        headquarters: true,
        zones: { include: { _count: { select: { branches: true } } } },
        departments: { include: { _count: { select: { designations: true } } } },
        _count: {
          select: {
            zones: true,
            departments: true,
            headquarters: true,
          },
        },
      },
    });

    if (!company) {
      return NextResponse.json({ success: false, message: 'Company not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: company });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: 'Failed to retrieve company', detail: error.message },
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
    const parsed = updateCompanySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, errors: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const existing = await prisma.company.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ success: false, message: 'Company not found' }, { status: 404 });
    }

    // Check code collision if code is being changed
    if (parsed.data.code && parsed.data.code !== existing.code) {
      const codeTaken = await prisma.company.findUnique({
        where: { code: parsed.data.code },
      });
      if (codeTaken) {
        return NextResponse.json(
          { success: false, message: `Company code "${parsed.data.code}" is already in use` },
          { status: 409 }
        );
      }
    }

    const updated = await prisma.company.update({
      where: { id },
      data: {
        ...(parsed.data.code ? { code: parsed.data.code } : {}),
        ...(parsed.data.name ? { name: parsed.data.name } : {}),
        ...(parsed.data.address !== undefined ? { address: parsed.data.address } : {}),
        ...(parsed.data.phone !== undefined ? { phone: parsed.data.phone } : {}),
        ...(parsed.data.email !== undefined ? { email: parsed.data.email || null } : {}),
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

    return NextResponse.json({
      success: true,
      message: 'Company updated successfully',
      data: updated,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: 'Failed to update company', detail: error.message },
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
    const existing = await prisma.company.findUnique({
      where: { id },
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

    if (!existing) {
      return NextResponse.json({ success: false, message: 'Company not found' }, { status: 404 });
    }

    if (existing._count.zones > 0 || existing._count.departments > 0) {
      return NextResponse.json(
        {
          success: false,
          message: `Cannot delete company. It still has ${existing._count.zones} zones and ${existing._count.departments} departments linked.`,
        },
        { status: 400 }
      );
    }

    await prisma.company.delete({ where: { id } });

    return NextResponse.json({
      success: true,
      message: 'Company deleted successfully',
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: 'Failed to delete company', detail: error.message },
      { status: 500 }
    );
  }
}
