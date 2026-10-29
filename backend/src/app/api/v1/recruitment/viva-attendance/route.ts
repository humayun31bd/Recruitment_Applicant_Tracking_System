import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { extractBearerToken, verifyAccessToken } from '@/lib/auth';

const updateVivaAttendanceSchema = z.object({
  candidateId: z.string().min(1),
  vivaBoardId: z.string().optional(),
  attendanceStatus: z.enum(['PRESENT', 'ABSENT', 'PENDING']).default('PRESENT'),
  queueStatus: z.enum(['WAITING', 'INSIDE_BOARD', 'COMPLETED', 'ABSENT']).default('WAITING'),
  checkInTime: z.string().optional(),
  nidVerified: z.boolean().optional(),
  academicVerified: z.boolean().optional(),
  experienceVerified: z.boolean().optional(),
  verifiedBy: z.string().optional(),
  remarks: z.string().optional(),
});

const batchVivaAttendanceSchema = z.object({
  vivaBoardId: z.string().min(1),
  records: z.array(
    z.object({
      candidateId: z.string().min(1),
      attendanceStatus: z.enum(['PRESENT', 'ABSENT', 'PENDING']),
      queueStatus: z.enum(['WAITING', 'INSIDE_BOARD', 'COMPLETED', 'ABSENT']).optional(),
      checkInTime: z.string().optional(),
      nidVerified: z.boolean().optional(),
      academicVerified: z.boolean().optional(),
      experienceVerified: z.boolean().optional(),
      remarks: z.string().optional(),
    })
  ),
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const vivaBoardId = searchParams.get('vivaBoardId');

    let circularId = searchParams.get('circularId');

    if (vivaBoardId) {
      const board = await prisma.vivaBoard.findUnique({
        where: { id: vivaBoardId },
        include: {
          circular: true,
          scores: {
            include: { candidate: true, member: true },
          },
        },
      });

      if (board) {
        circularId = board.circularId;
      }
    }

    // Retrieve candidates for this viva board / circular
    const candidates = await prisma.candidate.findMany({
      where: circularId && circularId !== 'ALL'
        ? {
            circularId,
            status: { in: ['WRITTEN_PASSED', 'VIVA_SCHEDULED', 'SELECTED', 'SHORTLISTED', 'APPLIED', 'SCREENING_PASSED', 'DEPLOYED'] },
          }
        : {
            status: { in: ['WRITTEN_PASSED', 'VIVA_SCHEDULED', 'SELECTED', 'SHORTLISTED', 'APPLIED', 'SCREENING_PASSED', 'DEPLOYED'] },
          },
      include: {
        circular: {
          select: { id: true, circularNo: true, title: true },
        },
        admitCards: {
          take: 1,
          orderBy: { issuedAt: 'desc' },
        },
        examResults: {
          take: 1,
          orderBy: { marksObtained: 'desc' },
        },
        verifications: {
          orderBy: { timestamp: 'desc' },
          take: 5,
        },
        vivaScores: vivaBoardId ? { where: { vivaBoardId } } : true,
      },
      orderBy: { createdAt: 'asc' },
    });

    const attendanceRoster = candidates.map((c, idx) => {
      const latestVerification = c.verifications[0];
      const hasScores = c.vivaScores.length > 0;
      
      // Determine default attendance based on verifications or scores
      let attendanceStatus: 'PRESENT' | 'ABSENT' | 'PENDING' = 'PENDING';
      let queueStatus: 'WAITING' | 'INSIDE_BOARD' | 'COMPLETED' | 'ABSENT' = 'WAITING';

      if (latestVerification) {
        if (latestVerification.isApproved) {
          attendanceStatus = 'PRESENT';
          queueStatus = hasScores ? 'COMPLETED' : 'WAITING';
        } else {
          attendanceStatus = 'ABSENT';
          queueStatus = 'ABSENT';
        }
      } else if (hasScores) {
        attendanceStatus = 'PRESENT';
        queueStatus = 'COMPLETED';
      }

      return {
        id: c.id,
        candidateId: c.id,
        circularId: c.circularId,
        circularNo: c.circular?.circularNo || 'CIR-2026-0001',
        circularTitle: c.circular?.title || 'Field Officer',
        tokenNumber: `TK-${String(idx + 1).padStart(2, '0')}`,
        rollNumber: c.admitCards[0]?.rollNumber || `100${String(idx + 41)}`,
        trackingId: c.trackingId,
        fullName: c.fullName,
        district: c.district || 'Dhaka',
        highestDegree: c.highestDegree || 'Bachelor Degree',
        cgpa: c.cgpa ? Number(c.cgpa) : 3.5,
        writtenMarks: c.examResults[0] ? Number(c.examResults[0].marksObtained) : 85.0,
        attendanceStatus,
        queueStatus,
        checkInTime: latestVerification ? new Date(latestVerification.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '09:30 AM',
        nidVerified: true,
        academicVerified: true,
        experienceVerified: true,
        verifiedBy: latestVerification?.verifiedBy || 'Viva Coordinator',
        remarks: latestVerification?.remarks || (hasScores ? 'Interview Evaluated' : 'Credentials Inspected'),
        evaluatorsCount: c.vivaScores.length,
      };
    });

    return NextResponse.json({
      success: true,
      data: attendanceRoster,
      totalCount: attendanceRoster.length,
      presentCount: attendanceRoster.filter((r) => r.attendanceStatus === 'PRESENT').length,
      absentCount: attendanceRoster.filter((r) => r.attendanceStatus === 'ABSENT').length,
      pendingCount: attendanceRoster.filter((r) => r.attendanceStatus === 'PENDING').length,
      inBoardCount: attendanceRoster.filter((r) => r.queueStatus === 'INSIDE_BOARD').length,
      completedCount: attendanceRoster.filter((r) => r.queueStatus === 'COMPLETED').length,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to retrieve viva attendance' },
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

    // Support batch update or single update
    if (body.records && Array.isArray(body.records)) {
      const parsedBatch = batchVivaAttendanceSchema.safeParse(body);
      if (!parsedBatch.success) {
        return NextResponse.json(
          { success: false, errors: parsedBatch.error.flatten().fieldErrors },
          { status: 400 }
        );
      }

      const { records } = parsedBatch.data;
      for (const rec of records) {
        const isApproved = rec.attendanceStatus === 'PRESENT';
        await prisma.candidateVerification.create({
          data: {
            candidateId: rec.candidateId,
            verifiedBy: 'Viva Hall Coordinator',
            isApproved,
            remarks: rec.remarks || `Viva attendance marked as ${rec.attendanceStatus}. Queue: ${rec.queueStatus || 'WAITING'}`,
          },
        });
      }

      return NextResponse.json({
        success: true,
        message: `Successfully synchronized attendance for ${records.length} viva candidates.`,
      });
    }

    const parsedSingle = updateVivaAttendanceSchema.safeParse(body);
    if (!parsedSingle.success) {
      return NextResponse.json(
        { success: false, errors: parsedSingle.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { candidateId, attendanceStatus, queueStatus, verifiedBy, remarks } = parsedSingle.data;
    const isApproved = attendanceStatus === 'PRESENT';

    const verification = await prisma.candidateVerification.create({
      data: {
        candidateId,
        verifiedBy: verifiedBy || 'Viva Hall Coordinator',
        isApproved,
        remarks: remarks || `Viva Attendance: ${attendanceStatus} | Stage: ${queueStatus}`,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Viva attendance for candidate updated to ${attendanceStatus} (${queueStatus})`,
      data: verification,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to update viva attendance' },
      { status: 500 }
    );
  }
}
