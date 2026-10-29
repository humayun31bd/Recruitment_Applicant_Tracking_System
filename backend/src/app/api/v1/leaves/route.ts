import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { LeaveService } from '@/lib/services/leave.service';
import { extractBearerToken, verifyAccessToken } from '@/lib/auth';

const applyLeaveSchema = z.object({
  userId: z.string().uuid(),
  policyId: z.string().uuid(),
  startDate: z.string(),
  endDate: z.string(),
  reason: z.string().min(5),
  emergencyContact: z.string().optional(),
  emergencyAddress: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = extractBearerToken(authHeader);

    if (!token || !verifyAccessToken(token)) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = req.nextUrl;
    const userId = searchParams.get('userId');

    const policies = await LeaveService.getLeavePolicies();

    let balances: any[] = [];
    if (userId) {
      balances = await LeaveService.getEmployeeLeaveBalances(userId);
    }

    return NextResponse.json({
      success: true,
      data: { policies, balances },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: 'Failed to retrieve leave information', detail: error.message },
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
    if (!payload) return NextResponse.json({ success: false, message: 'Invalid token' }, { status: 401 });

    const body = await req.json();
    const parsed = applyLeaveSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, errors: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const application = await LeaveService.applyLeave({
      ...parsed.data,
      initiatorId: payload.userId,
    });

    return NextResponse.json({
      success: true,
      message: 'Leave application submitted successfully for approval',
      data: application,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to submit leave application' },
      { status: 500 }
    );
  }
}
