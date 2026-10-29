import { NextRequest, NextResponse } from 'next/server';
import { RecruitmentService } from '@/lib/services/recruitment.service';
import { extractBearerToken, verifyAccessToken } from '@/lib/auth';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = extractBearerToken(authHeader);

    if (!token) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    const payload = verifyAccessToken(token);
    if (!payload || (!payload.roles.includes('SUPER_ADMIN') && !payload.roles.includes('HR_ADMIN'))) {
      return NextResponse.json({ success: false, message: 'Forbidden. HR Admin access required.' }, { status: 403 });
    }

    const { id } = await params;
    const result = await RecruitmentService.convertToEmployee(id);

    return NextResponse.json({
      success: true,
      message: 'Candidate successfully onboarded into Module 1 Employee Master',
      data: result,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to convert deployed candidate to employee' },
      { status: 500 }
    );
  }
}
