import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { extractBearerToken, verifyAccessToken, comparePassword, hashPassword } from '@/lib/auth';
import { validatePasswordStrength } from '@/lib/security';

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
});

export async function POST(req: NextRequest) {
  try {
    const token = extractBearerToken(req);
    const payload = token ? verifyAccessToken(token) : null;

    if (!payload) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const parsed = changePasswordSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, errors: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    // Enforce Password Strength (claude.md Rules 13, 21)
    const strengthCheck = validatePasswordStrength(parsed.data.newPassword);
    if (!strengthCheck.strong) {
      return NextResponse.json(
        {
          success: false,
          message: 'New password does not meet security complexity criteria.',
          errors: strengthCheck.errors,
        },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    });

    if (!user) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    const isMatch = await comparePassword(parsed.data.currentPassword, user.passwordHash);
    if (!isMatch) {
      return NextResponse.json(
        { success: false, message: 'Incorrect current password' },
        { status: 400 }
      );
    }

    const newHash = await hashPassword(parsed.data.newPassword);

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: newHash },
    });

    return NextResponse.json({
      success: true,
      message: 'Password changed successfully. Default credentials have been updated.',
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: 'Failed to change password', detail: error.message },
      { status: 500 }
    );
  }
}
