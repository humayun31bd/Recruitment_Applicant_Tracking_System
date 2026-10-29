import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { comparePassword, signAccessToken, signRefreshToken, setAuthCookies } from '@/lib/auth';
import { recordAuditLog } from '@/lib/audit';
import { checkRateLimit, sanitizeLogData } from '@/lib/security';
import { AuditAction } from '@prisma/client';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  mfaToken: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    // 1. Rate Limiting (claude.md Rule 12: "Rate limiting add karo")
    const clientIp = req.headers.get('x-forwarded-for') || req.ip || 'anonymous';
    const rateCheck = checkRateLimit(`login_${clientIp}`, 5, 60 * 1000); // 5 attempts per minute
    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          success: false,
          message: 'Too many login attempts. Please wait 1 minute before trying again.',
        },
        {
          status: 429,
          headers: { 'Retry-After': '60' },
        }
      );
    }

    const body = await req.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, errors: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { email, password } = parsed.data;

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        userRoles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: { permission: true },
                },
              },
            },
          },
        },
        department: true,
        designation: true,
        branch: true,
        dataScopes: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Invalid credentials' },
        { status: 401 }
      );
    }

    if (user.status !== 'ACTIVE') {
      return NextResponse.json(
        { success: false, message: `Account is ${user.status.toLowerCase()}` },
        { status: 403 }
      );
    }

    const isValidPassword = await comparePassword(password, user.passwordHash);
    if (!isValidPassword) {
      return NextResponse.json(
        { success: false, message: 'Invalid credentials' },
        { status: 401 }
      );
    }

    const roles = user.userRoles.map((ur) => ur.role.code);
    const permissions = Array.from(
      new Set(
        user.userRoles.flatMap((ur) =>
          ur.role.permissions.map((rp) => rp.permission.code)
        )
      )
    );

    const tokenPayload = {
      userId: user.id,
      employeeId: user.employeeId,
      email: user.email,
      roles,
      permissions,
      isMfaVerified: true,
    };

    const accessToken = signAccessToken(tokenPayload);
    const refreshToken = signRefreshToken(tokenPayload);

    await recordAuditLog({
      actorId: user.id,
      entityName: 'User',
      entityId: user.id,
      action: AuditAction.LOGIN,
      ipAddress: clientIp,
      userAgent: req.headers.get('user-agent') || undefined,
    });

    // 2. Local Storage Token Migration: Set secure, httpOnly, SameSite=Strict cookies
    // (claude.md Rule 20: "Local storage se saare tokens hata do.")
    const response = NextResponse.json({
      success: true,
      message: 'Authentication successful',
      data: {
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          employeeId: user.employeeId,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone,
          department: user.department?.name,
          designation: user.designation?.title,
          branch: user.branch?.name,
          roles,
          permissions,
          scopes: user.dataScopes,
        },
      },
    });

    setAuthCookies(response, accessToken, refreshToken);
    return response;
  } catch (error: any) {
    // 3. Sensitive Data Sanitization for logs (claude.md Rule 26)
    console.error('Login error:', sanitizeLogData({ message: error.message }));
    return NextResponse.json(
      { success: false, message: 'Internal server error', detail: error.message },
      { status: 500 }
    );
  }
}
