import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { RecruitmentService } from '@/lib/services/recruitment.service';
import { extractBearerToken, verifyAccessToken } from '@/lib/auth';
import { CircularStatus } from '@prisma/client';

const updateCircularSchema = z.object({
  title: z.string().min(5).optional(),
  departmentId: z.string().uuid().optional(),
  designationId: z.string().uuid().optional(),
  jobGradeId: z.string().uuid().optional(),
  vacanciesCount: z.number().min(1).optional(),
  applicationDeadline: z.string().optional(),
  requirements: z.string().min(10).optional(),
  requisitionId: z.string().uuid().nullable().optional(),
  minExperienceYears: z.number().optional(),
  minCgpa: z.number().optional(),
  minDegree: z.string().optional(),
  maxAge: z.number().optional(),
  status: z.nativeEnum(CircularStatus).optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = extractBearerToken(req);
    const payload = token ? verifyAccessToken(token) : null;
    const isHrOrAdmin = !!payload && (payload.roles.includes('SUPER_ADMIN') || payload.roles.includes('HR_ADMIN'));

    const circular = await RecruitmentService.getJobCircularById(params.id);
    if (!circular) {
      return NextResponse.json({ success: false, message: 'Job circular not found' }, { status: 404 });
    }

    // Public / non-admin users can only view published circulars
    if (!isHrOrAdmin && circular.status !== CircularStatus.PUBLISHED) {
      return NextResponse.json({ success: false, message: 'Job circular is not publicly available' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: circular });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: 'Failed to retrieve job circular', detail: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = extractBearerToken(req);

    if (!token) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    const payload = verifyAccessToken(token);
    if (!payload || (!payload.roles.includes('SUPER_ADMIN') && !payload.roles.includes('HR_ADMIN'))) {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const parsed = updateCircularSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, errors: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const updated = await RecruitmentService.updateJobCircular(params.id, parsed.data);

    return NextResponse.json({
      success: true,
      message: 'Job Circular updated successfully',
      data: updated,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to update job circular' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = extractBearerToken(req);

    if (!token) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    const payload = verifyAccessToken(token);
    if (!payload || (!payload.roles.includes('SUPER_ADMIN') && !payload.roles.includes('HR_ADMIN'))) {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    const result = await RecruitmentService.deleteJobCircular(params.id);

    return NextResponse.json({
      success: true,
      message: 'Job Circular deleted / archived successfully',
      data: result,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to delete job circular' },
      { status: 500 }
    );
  }
}
