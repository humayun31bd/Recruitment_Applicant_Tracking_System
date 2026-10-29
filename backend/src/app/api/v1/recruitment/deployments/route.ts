import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { RecruitmentService } from '@/lib/services/recruitment.service';
import { extractBearerToken, verifyAccessToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const generateDeploymentSchema = z.object({
  candidateId: z.string().uuid(),
  branchId: z.string().uuid(),
  joiningDeadline: z.string(),
});

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = extractBearerToken(authHeader);

    if (!token || !verifyAccessToken(token)) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const deployments = await prisma.deploymentRecord.findMany({
      include: {
        candidate: true,
        branch: { include: { zone: true } },
        department: true,
        designation: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, data: deployments });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: 'Failed to retrieve deployment records', detail: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = extractBearerToken(authHeader);

    if (!token) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    const payload = verifyAccessToken(token);
    if (!payload || (!payload.roles.includes('SUPER_ADMIN') && !payload.roles.includes('HR_ADMIN'))) {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const parsed = generateDeploymentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, errors: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const deployment = await RecruitmentService.generateDeploymentLetter(parsed.data);

    return NextResponse.json({
      success: true,
      message: 'Official Deployment and Appointment Letter generated with individual tracking ID',
      data: deployment,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to generate deployment letter' },
      { status: 500 }
    );
  }
}
