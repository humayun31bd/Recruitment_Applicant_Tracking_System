import { NextRequest, NextResponse } from 'next/server';
import { TransferService } from '@/lib/services/transfer.service';
import { extractBearerToken, verifyAccessToken } from '@/lib/auth';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = extractBearerToken(authHeader);

    if (!token || !verifyAccessToken(token)) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const letterData = await TransferService.generateOfficialTransferLetter(params.id);

    return NextResponse.json({ success: true, data: letterData });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to generate transfer letter' },
      { status: 500 }
    );
  }
}
