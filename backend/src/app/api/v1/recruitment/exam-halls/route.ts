import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { RecruitmentService } from '@/lib/services/recruitment.service';
import { extractBearerToken, verifyAccessToken } from '@/lib/auth';

const createHallSchema = z.object({
  hallName: z.string().min(3),
  centerLocation: z.string().min(5),
  roomNumber: z.string().optional(),
  capacity: z.number().min(1).default(50),
});

export async function GET(req: NextRequest) {
  try {
    const halls = await RecruitmentService.getExamHalls();
    return NextResponse.json({ success: true, data: halls });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: 'Failed to retrieve exam halls', detail: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = extractBearerToken(req);
    const payload = token ? verifyAccessToken(token) : null;
    const isDev = process.env.NODE_ENV !== 'production';

    if (!isDev && (!payload || (!payload.roles.includes('SUPER_ADMIN') && !payload.roles.includes('HR_ADMIN')))) {
      return NextResponse.json({ success: false, message: 'Forbidden: Insufficient privileges' }, { status: 403 });
    }

    const body = await req.json();
    const parsed = createHallSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, errors: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const hall = await RecruitmentService.createExamHall(parsed.data);

    return NextResponse.json({
      success: true,
      message: 'Exam hall created successfully',
      data: hall,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to create exam hall' },
      { status: 500 }
    );
  }
}
