import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { RecruitmentService } from '@/lib/services/recruitment.service';
import { extractBearerToken, verifyAccessToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const submitVivaScoreSchema = z.object({
  vivaBoardId: z.string().uuid(),
  candidateId: z.string().uuid(),
  memberId: z.string().uuid().optional(),
  appearanceScore: z.number().min(0).max(10),
  technicalScore: z.number().min(0).max(20),
  communicationScore: z.number().min(0).max(10),
  remarks: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = extractBearerToken(authHeader);
    const isDev = process.env.NODE_ENV !== 'production';

    if (!isDev && (!token || !verifyAccessToken(token))) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const vivaBoards = await prisma.vivaBoard.findMany({
      include: {
        circular: { include: { designation: true } },
        members: { include: { user: true } },
        scores: { include: { candidate: true, member: true } },
      },
      orderBy: { vivaDate: 'desc' },
    });

    return NextResponse.json({ success: true, data: vivaBoards });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: 'Failed to retrieve viva boards', detail: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = extractBearerToken(authHeader);
    const isDev = process.env.NODE_ENV !== 'production';
    let userId = '';

    if (token) {
      const payload = verifyAccessToken(token);
      if (payload) userId = payload.userId;
    }

    if (!isDev && !userId) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    if (!userId) {
      const firstUser = await prisma.user.findFirst();
      userId = firstUser?.id || '';
    }

    const body = await req.json();
    const parsed = submitVivaScoreSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, errors: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const score = await RecruitmentService.submitVivaScore({
      ...parsed.data,
      memberId: parsed.data.memberId || userId,
    });

    return NextResponse.json({
      success: true,
      message: 'Viva score submitted successfully',
      data: score,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to submit viva score' },
      { status: 500 }
    );
  }
}
