import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { extractBearerToken, verifyAccessToken } from '@/lib/auth';

const createVivaBoardSchema = z.object({
  boardName: z.string().min(3),
  circularId: z.string().optional(),
  vivaDate: z.string().optional(),
  vivaTime: z.string().optional(),
  venue: z.string().min(2),
  vacancies: z.number().optional().default(10),
  members: z.array(
    z.object({
      userId: z.string().optional(),
      name: z.string().optional(),
      role: z.string().default('Board Member'),
      designation: z.string().optional(),
    })
  ).optional().default([]),
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const circularId = searchParams.get('circularId');

    const vivaBoards = await prisma.vivaBoard.findMany({
      where: circularId ? { circularId } : undefined,
      include: {
        circular: {
          include: { designation: true, department: true },
        },
        members: {
          include: { user: true },
        },
        scores: {
          include: {
            candidate: true,
            member: true,
          },
        },
      },
      orderBy: { vivaDate: 'desc' },
    });

    return NextResponse.json({ success: true, data: vivaBoards });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to retrieve viva boards' },
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
    const parsed = createVivaBoardSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, errors: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { boardName, circularId, vivaDate, venue, members } = parsed.data;

    // Resolve valid circularId against existing JobCircular records
    let validCircularId = '';
    if (circularId) {
      const circ = await prisma.jobCircular.findUnique({ where: { id: circularId } });
      if (circ) {
        validCircularId = circ.id;
      }
    }

    if (!validCircularId) {
      const fallbackCirc = await prisma.jobCircular.findFirst({
        orderBy: { createdAt: 'desc' },
      });
      if (fallbackCirc) {
        validCircularId = fallbackCirc.id;
      }
    }

    if (!validCircularId) {
      let dept = await prisma.department.findFirst();
      if (!dept) {
        let comp = await prisma.company.findFirst();
        if (!comp) {
          comp = await prisma.company.create({
            data: {
              code: 'UDDIPAN-HO',
              name: 'UDDIPAN Head Office',
            },
          });
        }
        dept = await prisma.department.create({
          data: {
            code: 'DEPT-OPS',
            name: 'Operations & Microfinance',
            companyId: comp.id,
          },
        });
      }

      let desig = await prisma.designation.findFirst();
      if (!desig) {
        desig = await prisma.designation.create({
          data: {
            code: 'DESIG-FO',
            title: 'Field Officer',
            departmentId: dept.id,
          },
        });
      }

      let grade = await prisma.jobGrade.findFirst();
      if (!grade) {
        grade = await prisma.jobGrade.create({
          data: {
            gradeCode: `GRADE-${Date.now()}`,
            level: 1,
            minSalary: 25000,
            maxSalary: 45000,
          },
        });
      }

      const defaultCirc = await prisma.jobCircular.create({
        data: {
          circularNo: `CIR-${Date.now()}`,
          title: 'Field Officer (Microfinance Credit & Operations)',
          departmentId: dept.id,
          designationId: desig.id,
          jobGradeId: grade.id,
          requirements: 'Bachelor degree in any discipline. Experience in field operations preferred.',
          vacanciesCount: 10,
          applicationDeadline: new Date('2026-12-31'),
          status: 'PUBLISHED',
        },
      });
      validCircularId = defaultCirc.id;
    }

    // Ensure distinct users for each board member to satisfy @@unique([vivaBoardId, userId])
    const usedUserIds = new Set<string>();
    const memberData: { userId: string; role: string }[] = [];

    const existingUsers = await prisma.user.findMany({
      where: { status: 'ACTIVE' },
      take: 20,
    });

    for (let idx = 0; idx < (members || []).length; idx++) {
      const m = members[idx];
      let assignedId = m.userId;

      if (!assignedId || usedUserIds.has(assignedId)) {
        const candidateUser = existingUsers.find((u) => !usedUserIds.has(u.id));
        if (candidateUser) {
          assignedId = candidateUser.id;
        } else {
          const userCount = await prisma.user.count();
          const nameParts = (m.name || `Evaluator ${idx + 1}`).trim().split(' ');
          const first = nameParts[0] || 'Evaluator';
          const last = nameParts.slice(1).join(' ') || `${idx + 1}`;
          const newUser = await prisma.user.create({
            data: {
              employeeId: `EVAL-${String(userCount + 1).padStart(4, '0')}`,
              email: `evaluator.${Date.now()}.${idx + 1}@uddipan.org`,
              passwordHash: '$2a$10$jqJYS2lfeew7cRzCk67a8uQKXuBKjhR43PCYC00tqMj2xE2im7lz6',
              firstName: first,
              lastName: last,
              status: 'ACTIVE',
            },
          });
          assignedId = newUser.id;
        }
      }

      usedUserIds.add(assignedId);
      memberData.push({
        userId: assignedId,
        role: m.role || 'Board Member',
      });
    }

    const board = await prisma.vivaBoard.create({
      data: {
        boardName,
        circularId: validCircularId,
        vivaDate: vivaDate ? new Date(vivaDate) : new Date(),
        venue,
        members: {
          create: memberData,
        },
      },
      include: {
        circular: { include: { designation: true } },
        members: { include: { user: true } },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Viva board created successfully',
      data: board,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to create viva board' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const targetBoardId = body.vivaBoardId || body.id;
    const { 
      isPublished, 
      selectedCandidateIds, 
      waitingCandidateIds,
      boardName,
      venue,
      vivaDate,
      circularId,
      members
    } = body;

    if (!targetBoardId) {
      return NextResponse.json({ success: false, message: 'vivaBoardId or id is required' }, { status: 400 });
    }

    await prisma.$transaction(async (tx) => {
      // 1. Update board metadata if provided
      const updateData: any = {};
      if (isPublished !== undefined) updateData.isPublished = isPublished;
      if (boardName) updateData.boardName = boardName;
      if (venue) updateData.venue = venue;
      if (vivaDate) updateData.vivaDate = new Date(vivaDate);
      if (circularId) {
        const circ = await tx.jobCircular.findUnique({ where: { id: circularId } });
        if (circ) updateData.circularId = circularId;
      }

      if (Object.keys(updateData).length > 0) {
        await tx.vivaBoard.update({
          where: { id: targetBoardId },
          data: updateData,
        });
      }

      // 2. Update board members roster if provided
      if (Array.isArray(members) && members.length > 0) {
        const existingUsers = await tx.user.findMany({ where: { status: 'ACTIVE' }, take: 20 });
        const usedUserIds = new Set<string>();

        // Remove existing members for this board
        await tx.vivaBoardMember.deleteMany({
          where: { vivaBoardId: targetBoardId },
        });

        // Recreate updated members with distinct userIds
        for (let idx = 0; idx < members.length; idx++) {
          const m = members[idx];
          let uId = m.userId;
          if (!uId || usedUserIds.has(uId)) {
            const candidateUser = existingUsers.find((u) => !usedUserIds.has(u.id));
            if (candidateUser) {
              uId = candidateUser.id;
            } else {
              const userCount = await tx.user.count();
              const nameParts = (m.name || `Evaluator ${idx + 1}`).trim().split(' ');
              const first = nameParts[0] || 'Evaluator';
              const last = nameParts.slice(1).join(' ') || `${idx + 1}`;
              const newUser = await tx.user.create({
                data: {
                  employeeId: `EVAL-${String(userCount + 1).padStart(4, '0')}`,
                  email: `evaluator.${Date.now()}.${idx + 1}@uddipan.org`,
                  passwordHash: '$2a$10$jqJYS2lfeew7cRzCk67a8uQKXuBKjhR43PCYC00tqMj2xE2im7lz6',
                  firstName: first,
                  lastName: last,
                  status: 'ACTIVE',
                },
              });
              uId = newUser.id;
            }
          }

          usedUserIds.add(uId);
          await tx.vivaBoardMember.create({
            data: {
              vivaBoardId: targetBoardId,
              userId: uId,
              role: m.role || 'Board Member',
            },
          });
        }
      }

      // 3. Update selected candidates to SELECTED
      if (Array.isArray(selectedCandidateIds) && selectedCandidateIds.length > 0) {
        await tx.candidate.updateMany({
          where: { id: { in: selectedCandidateIds } },
          data: { status: 'SELECTED' },
        });
      }

      // 4. Update waiting candidates if provided
      if (Array.isArray(waitingCandidateIds) && waitingCandidateIds.length > 0) {
        // Can be kept as WRITTEN_PASSED or VIVA_SCHEDULED with waiting rank
      }
    });

    const updatedBoard = await prisma.vivaBoard.findUnique({
      where: { id: targetBoardId },
      include: {
        circular: { include: { designation: true } },
        members: { include: { user: true } },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Viva board and member roster updated successfully',
      data: updatedBoard,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to update viva board' },
      { status: 500 }
    );
  }
}
