import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { extractBearerToken, verifyAccessToken } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = extractBearerToken(authHeader);
    const payload = token ? verifyAccessToken(token) : null;
    if (!payload && process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const companyId = searchParams.get('companyId') || undefined;

    const [companies, zones, regions, branches, departments, designations, jobGrades] =
      await Promise.all([
        prisma.company.findMany({
          where: companyId ? { id: companyId } : undefined,
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
        }),
        prisma.zone.findMany({
          where: companyId ? { companyId } : undefined,
          include: {
            company: true,
            _count: { select: { branches: true } },
          },
          orderBy: { name: 'asc' },
        }),
        prisma.region.findMany({ orderBy: { name: 'asc' } }),
        prisma.branch.findMany({
          where: companyId ? { zone: { companyId } } : undefined,
          include: {
            zone: {
              include: { company: true },
            },
            region: true,
          },
          orderBy: { name: 'asc' },
        }),
        prisma.department.findMany({
          where: companyId ? { companyId } : undefined,
          include: {
            company: true,
            _count: { select: { designations: true } },
          },
          orderBy: { name: 'asc' },
        }),
        prisma.designation.findMany({
          where: companyId ? { department: { companyId } } : undefined,
          include: {
            department: {
              include: { company: true },
            },
            jobGrade: true,
          },
          orderBy: { title: 'asc' },
        }),
        prisma.jobGrade.findMany({
          include: {
            designations: {
              where: companyId ? { department: { companyId } } : undefined,
              include: {
                department: {
                  include: { company: true },
                },
              },
            },
            _count: { select: { designations: true } },
          },
          orderBy: { level: 'asc' },
        }),
      ]);

    return NextResponse.json({
      success: true,
      data: {
        companies,
        zones,
        regions,
        branches,
        departments,
        designations,
        jobGrades,
        companyWise: companies,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: 'Error retrieving hierarchy master data', detail: error.message },
      { status: 500 }
    );
  }
}
