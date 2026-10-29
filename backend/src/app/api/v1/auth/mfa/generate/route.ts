import { NextRequest, NextResponse } from 'next/server';
import { extractBearerToken, verifyAccessToken } from '@/lib/auth';
import { generateMfaSecret } from '@/lib/security';

export async function POST(req: NextRequest) {
  try {
    const token = extractBearerToken(req);
    const payload = token ? verifyAccessToken(token) : null;

    if (!payload) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const mfaData = generateMfaSecret();

    return NextResponse.json({
      success: true,
      message: 'MFA setup initialized. Scan the QR code or enter the secret key into your authenticator app.',
      data: {
        secret: mfaData.secret,
        otpauthUrl: mfaData.otpauthUrl,
        backupCodes: mfaData.backupCodes,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: 'Failed to generate MFA secret', detail: error.message },
      { status: 500 }
    );
  }
}
