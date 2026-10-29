import { NextRequest, NextResponse } from 'next/server';
import { EmployeeService } from '@/lib/services/employee.service';
import { extractBearerToken, verifyAccessToken } from '@/lib/auth';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = extractBearerToken(authHeader);

    if (!token || !verifyAccessToken(token)) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const employee = await EmployeeService.getEmployeeById(params.id);

    if (!employee) {
      return NextResponse.json({ success: false, message: 'Employee not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: employee });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: 'Error retrieving employee 360 profile', detail: error.message },
      { status: 500 }
    );
  }
}
