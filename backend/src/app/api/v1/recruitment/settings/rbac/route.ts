import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { extractBearerToken, verifyAccessToken } from '@/lib/auth';

// Default Recruitment & ATS Roles Definition
const DEFAULT_RECRUITMENT_ROLES = [
  {
    code: 'HQ_ADMIN',
    name: 'HQ Administrator',
    description: 'Full recruitment authority across Headquarter: circulars, global quotas, exam centers, gazetted merit publication, and system settings.',
  },
  {
    code: 'ZONE_ADMIN',
    name: 'Zone Administrator',
    description: 'Zonal recruitment scope: regional exam halls, zonal viva nomination, branch demand review, and zonal applicant screening.',
  },
  {
    code: 'BRANCH_ADMIN',
    name: 'Branch Administrator',
    description: 'Branch recruitment scope: raises 7.1 manpower requisitions, preliminary applicant verification, local interview coordination.',
  },
  {
    code: 'VIVA_BOARD_MEMBER',
    name: 'Viva Board Member / Evaluator',
    description: 'Authorized viva board evaluator: access to 7.4 digital scoring sheet, marks submission across appearance, technical, communication criteria.',
  },
  {
    code: 'USERS',
    name: 'Recruitment Staff / User',
    description: 'General recruitment portal access: application intake, admit card generation, candidate dossier inspection.',
  },
];

// Helper to seed missing recruitment roles safely
async function ensureRecruitmentRoles() {
  for (const roleDef of DEFAULT_RECRUITMENT_ROLES) {
    const existing = await prisma.role.findUnique({ where: { code: roleDef.code } });
    if (!existing) {
      await prisma.role.create({
        data: {
          code: roleDef.code,
          name: roleDef.name,
          description: roleDef.description,
        },
      });
    }
  }

  // Seed sample recruitment personnel if needed
  const userCount = await prisma.user.count();
  if (userCount <= 3) {
    const dept = await prisma.department.findFirst();
    const desig = await prisma.designation.findFirst();

    const sampleUsers = [
      { employeeId: 'EMP-1001', email: 'masud.rahman@uddipan.org', firstName: 'Dr. Masud', lastName: 'Rahman', phone: '+8801711000101', roleCodes: ['HQ_ADMIN', 'VIVA_BOARD_MEMBER'], scope: 'GLOBAL' },
      { employeeId: 'EMP-1002', email: 'rafiqul.alam@uddipan.org', firstName: 'Engr. Rafiqul', lastName: 'Alam', phone: '+8801711000102', roleCodes: ['HQ_ADMIN', 'VIVA_BOARD_MEMBER'], scope: 'HEADQUARTER' },
      { employeeId: 'EMP-1003', email: 'zubaida.sultana@uddipan.org', firstName: 'Zubaida', lastName: 'Sultana', phone: '+8801711000103', roleCodes: ['ZONE_ADMIN', 'VIVA_BOARD_MEMBER'], scope: 'ZONE' },
      { employeeId: 'EMP-1004', email: 'kazi.nazrul@uddipan.org', firstName: 'Kazi Nazrul', lastName: 'Islam', phone: '+8801711000104', roleCodes: ['HQ_ADMIN', 'VIVA_BOARD_MEMBER'], scope: 'HEADQUARTER' },
      { employeeId: 'EMP-1005', email: 'faruk.hossain@uddipan.org', firstName: 'Faruk', lastName: 'Hossain, FCA', phone: '+8801711000105', roleCodes: ['ZONE_ADMIN', 'VIVA_BOARD_MEMBER'], scope: 'ZONE' },
      { employeeId: 'EMP-1006', email: 'shamima.nasrin@uddipan.org', firstName: 'Shamima', lastName: 'Nasrin', phone: '+8801711000106', roleCodes: ['BRANCH_ADMIN'], scope: 'BRANCH' },
      { employeeId: 'EMP-1007', email: 'tanvir.ahmed@uddipan.org', firstName: 'Tanvir', lastName: 'Ahmed', phone: '+8801711000107', roleCodes: ['BRANCH_ADMIN'], scope: 'BRANCH' },
      { employeeId: 'EMP-1008', email: 'sharmin.sultana@uddipan.org', firstName: 'Sharmin', lastName: 'Sultana', phone: '+8801711000108', roleCodes: ['USERS'], scope: 'HEADQUARTER' },
    ];

    for (const su of sampleUsers) {
      let user = await prisma.user.findUnique({ where: { email: su.email } });
      if (!user) {
        user = await prisma.user.create({
          data: {
            employeeId: su.employeeId,
            email: su.email,
            passwordHash: '$2a$10$jqJYS2lfeew7cRzCk67a8uQKXuBKjhR43PCYC00tqMj2xE2im7lz6',
            firstName: su.firstName,
            lastName: su.lastName,
            phone: su.phone,
            departmentId: dept?.id || null,
            designationId: desig?.id || null,
            status: 'ACTIVE',
          },
        });
      }

      // Link roles
      for (const rCode of su.roleCodes) {
        const roleRecord = await prisma.role.findUnique({ where: { code: rCode } });
        if (roleRecord) {
          const userHasRole = await prisma.userRole.findUnique({
            where: { userId_roleId: { userId: user.id, roleId: roleRecord.id } },
          });
          if (!userHasRole) {
            await prisma.userRole.create({
              data: { userId: user.id, roleId: roleRecord.id },
            });
          }
        }
      }
    }
  }
}

export async function GET(req: NextRequest) {
  try {
    await ensureRecruitmentRoles();

    // 1. Fetch all roles with assigned user counts
    const roles = await prisma.role.findMany({
      where: {
        code: {
          in: ['SUPER_ADMIN', 'HQ_ADMIN', 'ZONE_ADMIN', 'BRANCH_ADMIN', 'VIVA_BOARD_MEMBER', 'USERS', 'HR_ADMIN', 'ZONAL_MANAGER', 'BRANCH_MANAGER'],
        },
      },
      include: {
        _count: {
          select: { userRoles: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    // 2. Fetch users with their role assignments, scopes, and viva board member roles
    const users = await prisma.user.findMany({
      where: { status: 'ACTIVE' },
      select: {
        id: true,
        employeeId: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        status: true,
        department: { select: { id: true, name: true } },
        designation: { select: { id: true, title: true } },
        zone: { select: { id: true, name: true } },
        branch: { select: { id: true, name: true } },
        userRoles: {
          include: {
            role: true,
          },
        },
        dataScopes: true,
        vivaBoardMembers: {
          include: {
            vivaBoard: {
              select: {
                id: true,
                boardName: true,
                circularId: true,
                vivaDate: true,
                venue: true,
              },
            },
          },
        },
      },
      orderBy: { employeeId: 'asc' },
    });

    // 3. Fetch all viva boards with members
    const vivaBoards = await prisma.vivaBoard.findMany({
      include: {
        circular: { select: { id: true, title: true, circularNo: true } },
        members: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                employeeId: true,
              },
            },
          },
        },
      },
      orderBy: { vivaDate: 'desc' },
    });

    // 4. Standard Recruitment Permission Matrix
    const permissionsMatrix = [
      {
        feature: '7.1 Manpower Requisitions',
        description: 'Initiate demand, HR endorse, Management endorse',
        HQ_ADMIN: true,
        ZONE_ADMIN: true,
        BRANCH_ADMIN: true,
        VIVA_BOARD_MEMBER: false,
        USERS: false,
      },
      {
        feature: '7.2 Job Circulars & Quotas',
        description: 'Draft circular, publish vacancies, set application cutoff',
        HQ_ADMIN: true,
        ZONE_ADMIN: false,
        BRANCH_ADMIN: false,
        VIVA_BOARD_MEMBER: false,
        USERS: false,
      },
      {
        feature: '7.3 Applicant Auto-Shortlisting',
        description: 'Configure screening criteria, execute filter, shortlisting',
        HQ_ADMIN: true,
        ZONE_ADMIN: true,
        BRANCH_ADMIN: false,
        VIVA_BOARD_MEMBER: false,
        USERS: false,
      },
      {
        feature: '7.4 Exam Halls & Seat Planning',
        description: 'Allocate centers, schedule exam, generate admit cards',
        HQ_ADMIN: true,
        ZONE_ADMIN: true,
        BRANCH_ADMIN: false,
        VIVA_BOARD_MEMBER: false,
        USERS: true,
      },
      {
        feature: '7.4 Exam Attendance Scanner',
        description: 'Barcode attendance scan, mark absent, lock roster',
        HQ_ADMIN: true,
        ZONE_ADMIN: true,
        BRANCH_ADMIN: true,
        VIVA_BOARD_MEMBER: false,
        USERS: true,
      },
      {
        feature: '7.4 Marks Tabulation & Cutoff',
        description: 'Marks tabulation, pass threshold filter, export gazette',
        HQ_ADMIN: true,
        ZONE_ADMIN: true,
        BRANCH_ADMIN: false,
        VIVA_BOARD_MEMBER: false,
        USERS: false,
      },
      {
        feature: '7.4 Viva Voce Board Constitution',
        description: 'Create viva board, assign evaluators, set weights',
        HQ_ADMIN: true,
        ZONE_ADMIN: true,
        BRANCH_ADMIN: false,
        VIVA_BOARD_MEMBER: false,
        USERS: false,
      },
      {
        feature: '7.4 Digital Viva Scoring Sheet',
        description: 'Submit individual evaluator marks, appearance, technical, comm',
        HQ_ADMIN: true,
        ZONE_ADMIN: true,
        BRANCH_ADMIN: false,
        VIVA_BOARD_MEMBER: true,
        USERS: false,
      },
      {
        feature: '7.4 Gazetted Merit Publication',
        description: 'Consensus calculation, publish merit & waiting list, transition',
        HQ_ADMIN: true,
        ZONE_ADMIN: false,
        BRANCH_ADMIN: false,
        VIVA_BOARD_MEMBER: false,
        USERS: false,
      },
      {
        feature: 'Recruitment Settings & RBAC',
        description: 'Assign roles, scope segregation, configure viva evaluators',
        HQ_ADMIN: true,
        ZONE_ADMIN: false,
        BRANCH_ADMIN: false,
        VIVA_BOARD_MEMBER: false,
        USERS: false,
      },
    ];

    return NextResponse.json({
      success: true,
      data: {
        roles,
        users,
        vivaBoards,
        permissionsMatrix,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to retrieve recruitment RBAC settings' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = extractBearerToken(authHeader);
    const isDev = process.env.NODE_ENV !== 'production';

    if (!isDev && (!token || !verifyAccessToken(token))) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { action } = body;

    await ensureRecruitmentRoles();

    // ACTION A: Assign User Roles & Scopes
    if (action === 'ASSIGN_USER_ROLES' || !action) {
      const { userId, roleCodes, scopeType, scopeId } = body;

      if (!userId || !Array.isArray(roleCodes)) {
        return NextResponse.json(
          { success: false, message: 'userId and roleCodes array are required' },
          { status: 400 }
        );
      }

      await prisma.$transaction(async (tx) => {
        // 1. Remove existing recruitment user roles
        const targetRoles = await tx.role.findMany({
          where: { code: { in: roleCodes } },
        });

        // Delete current role links for these specific recruitment roles
        await tx.userRole.deleteMany({
          where: { userId },
        });

        // Re-create role links
        for (const r of targetRoles) {
          await tx.userRole.create({
            data: {
              userId,
              roleId: r.id,
            },
          });
        }

        // 2. Update Data Scope if specified
        if (scopeType) {
          await tx.dataScope.deleteMany({ where: { userId } });
          await tx.dataScope.create({
            data: {
              userId,
              scopeType: scopeType,
              scopeId: scopeId || null,
            },
          });
        }
      });

      return NextResponse.json({
        success: true,
        message: 'User roles and scope assigned successfully',
      });
    }

    // ACTION B: Assign User as Viva Board Member / Evaluator
    if (action === 'ASSIGN_VIVA_MEMBER') {
      const { userId, vivaBoardId, boardRole } = body;

      if (!userId || !vivaBoardId) {
        return NextResponse.json(
          { success: false, message: 'userId and vivaBoardId are required' },
          { status: 400 }
        );
      }

      await prisma.$transaction(async (tx) => {
        // 1. Ensure user has VIVA_BOARD_MEMBER role
        const vivaRole = await tx.role.findUnique({ where: { code: 'VIVA_BOARD_MEMBER' } });
        if (vivaRole) {
          const userHasRole = await tx.userRole.findUnique({
            where: {
              userId_roleId: {
                userId,
                roleId: vivaRole.id,
              },
            },
          });
          if (!userHasRole) {
            await tx.userRole.create({
              data: {
                userId,
                roleId: vivaRole.id,
              },
            });
          }
        }

        // 2. Create or update VivaBoardMember record
        const existingMember = await tx.vivaBoardMember.findUnique({
          where: {
            vivaBoardId_userId: {
              vivaBoardId,
              userId,
            },
          },
        });

        if (existingMember) {
          await tx.vivaBoardMember.update({
            where: { id: existingMember.id },
            data: { role: boardRole || 'Board Member' },
          });
        } else {
          await tx.vivaBoardMember.create({
            data: {
              vivaBoardId,
              userId,
              role: boardRole || 'Board Member',
            },
          });
        }
      });

      return NextResponse.json({
        success: true,
        message: 'User successfully assigned as Viva Voce Board Member with scoring privileges',
      });
    }

    return NextResponse.json({ success: false, message: 'Unknown action specified' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to update recruitment RBAC' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const vivaBoardId = searchParams.get('vivaBoardId');

    if (userId && vivaBoardId) {
      // Remove specific viva board member assignment
      await prisma.vivaBoardMember.deleteMany({
        where: {
          userId,
          vivaBoardId,
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Viva board member assignment revoked successfully',
      });
    }

    return NextResponse.json(
      { success: false, message: 'userId and vivaBoardId query parameters required' },
      { status: 400 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to revoke assignment' },
      { status: 500 }
    );
  }
}
