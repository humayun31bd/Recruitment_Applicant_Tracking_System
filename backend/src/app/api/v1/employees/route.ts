import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { EmployeeService } from '@/lib/services/employee.service';
import { extractBearerToken, verifyAccessToken } from '@/lib/auth';
import { recordAuditLog } from '@/lib/audit';
import { AuditAction } from '@prisma/client';

const createEmployeeSchema = z.object({
  employeeId: z.string().min(3),
  email: z.string().email(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().optional(),
  dateOfBirth: z.string(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']),
  bloodGroup: z.string().optional(),
  nidNumber: z.string().optional(),
  tinNumber: z.string().optional(),
  joiningDate: z.string(),
  currentBasicSalary: z.number().min(0),
  zoneId: z.string().optional(),
  regionId: z.string().optional(),
  branchId: z.string().optional(),
  departmentId: z.string().optional(),
  designationId: z.string().optional(),
  reportingManagerId: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = extractBearerToken(authHeader);

    if (!token || !verifyAccessToken(token)) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = req.nextUrl;
    const departmentId = searchParams.get('departmentId') || undefined;
    const branchId = searchParams.get('branchId') || undefined;
    const search = searchParams.get('search') || undefined;

    const employees = await EmployeeService.getAllEmployees({ departmentId, branchId, search });

    return NextResponse.json({ success: true, data: employees });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: 'Failed to fetch employees', detail: error.message },
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
    if (!payload || (!payload.roles.includes('SUPER_ADMIN') && !payload.roles.includes('HR_ADMIN'))) {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const parsed = createEmployeeSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, errors: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const newEmployee = await EmployeeService.createEmployee(parsed.data);

    await recordAuditLog({
      actorId: payload.userId,
      entityName: 'Employee',
      entityId: newEmployee.id,
      action: AuditAction.CREATE,
      newValues: { employeeId: newEmployee.employeeId, email: newEmployee.email },
      ipAddress: req.headers.get('x-forwarded-for') || req.ip || undefined,
      userAgent: req.headers.get('user-agent') || undefined,
    });

    return NextResponse.json({
      success: true,
      message: 'Employee onboarded successfully',
      data: newEmployee,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: 'Failed to onboard employee', detail: error.message },
      { status: 500 }
    );
  }
}
