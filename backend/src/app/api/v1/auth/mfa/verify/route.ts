import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { extractBearerToken, verifyAccessToken, signAccessToken, setAuthCookies } from '@/lib/auth';
import { verifyMfaOtp } from '@/lib/security';

const verifySchema = z.object({
  secret: z.string().min(10),
  token: z.string().length(6),
});

export async function POST(req: NextRequest) {
  try {
    const bearer = extractBearerToken(req);
    const payload = bearer ? verifyAccessToken(bearer) : null;

    if (!payload) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const parsed = verifySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, errors: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const isValid = verifyMfaOtp(parsed.data.secret, parsed.data.token);
    if (!isValid) {
      return NextResponse.json(
        { success: false, message: 'Invalid one-time verification code' },
        { status: 400 }
      );
    }

    // Issue updated token with MFA verified flag
    const updatedPayload = {
      ...payload,
      isMfaVerified: true,
    };
    const newAccessToken = signAccessToken(updatedPayload);

    const res = NextResponse.json({
      success: true,
      message: 'MFA verified and enabled successfully.',
      data: { accessToken: newAccessToken },
    });

    setAuthCookies(res, newAccessToken);
    return res;
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: 'Failed to verify MFA', detail: error.message },
      { status: 500 }
    );
  }
}
