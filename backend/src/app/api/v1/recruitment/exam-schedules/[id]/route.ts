import { NextRequest, NextResponse } from 'next/server';
import { RecruitmentService } from '@/lib/services/recruitment.service';
import { extractBearerToken, verifyAccessToken } from '@/lib/auth';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const schedule = await RecruitmentService.getExamScheduleById(params.id);

    if (!schedule) {
      return NextResponse.json({ success: false, message: 'Exam schedule not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: schedule });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: 'Failed to retrieve exam schedule', detail: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = extractBearerToken(req);
    const payload = token ? verifyAccessToken(token) : null;
    const isDev = process.env.NODE_ENV !== 'production';

    if (!isDev && (!payload || (!payload.roles.includes('SUPER_ADMIN') && !payload.roles.includes('HR_ADMIN')))) {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    await RecruitmentService.deleteExamSchedule(params.id);

    return NextResponse.json({
      success: true,
      message: 'Exam schedule cancelled and candidate statuses restored',
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to cancel exam schedule' },
      { status: 500 }
    );
  }
}
