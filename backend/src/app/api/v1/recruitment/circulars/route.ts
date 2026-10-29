import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { CircularStatus } from '@prisma/client';
import { RecruitmentService } from '@/lib/services/recruitment.service';
import { extractBearerToken, verifyAccessToken } from '@/lib/auth';

const createCircularSchema = z.object({
  title: z.string().min(5),
  departmentId: z.string().uuid(),
  designationId: z.string().uuid(),
  jobGradeId: z.string().uuid(),
  vacanciesCount: z.number().min(1),
  applicationDeadline: z.string(),
  requirements: z.string().min(10),
  requisitionId: z.string().uuid().optional(),
  minExperienceYears: z.number().optional(),
  minCgpa: z.number().optional(),
  minDegree: z.string().optional(),
  maxAge: z.number().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const token = extractBearerToken(req);
    const payload = token ? verifyAccessToken(token) : null;
    const isHrOrAdmin = !!payload && (payload.roles.includes('SUPER_ADMIN') || payload.roles.includes('HR_ADMIN'));

    const { searchParams } = req.nextUrl;
    const statusParam = searchParams.get('status');

    let circulars;
    if (isHrOrAdmin) {
      const validStatus = statusParam && Object.values(CircularStatus).includes(statusParam as CircularStatus)
        ? (statusParam as CircularStatus)
        : undefined;
      circulars = await RecruitmentService.getJobCirculars(validStatus);
    } else {
      // Public / unauthenticated visitors can view active published circulars
      circulars = await RecruitmentService.getJobCirculars(CircularStatus.PUBLISHED);
    }

    return NextResponse.json({ success: true, data: circulars });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: 'Failed to retrieve job circulars', detail: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = extractBearerToken(req);

    if (!token) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    const payload = verifyAccessToken(token);
    if (!payload || (!payload.roles.includes('SUPER_ADMIN') && !payload.roles.includes('HR_ADMIN'))) {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const parsed = createCircularSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, errors: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const circular = await RecruitmentService.createJobCircular(parsed.data);

    return NextResponse.json({
      success: true,
      message: 'Job Circular published successfully',
      data: circular,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to create job circular' },
      { status: 500 }
    );
  }
}
