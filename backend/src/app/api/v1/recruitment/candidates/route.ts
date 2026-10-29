import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { RecruitmentService } from '@/lib/services/recruitment.service';
import { extractBearerToken, verifyAccessToken } from '@/lib/auth';
import { CandidateStatus } from '@prisma/client';

const enrollCandidateSchema = z.object({
  circularId: z.string().uuid('Valid circular ID is required'),
  fullName: z.string().trim().min(2, 'Full name must be at least 2 characters'),
  email: z.string().trim().email('Valid email address is required'),
  phone: z.string().trim().min(5, 'Phone number must be at least 5 digits'),
  nidNumber: z.string().trim().nullish(),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']),
  district: z.string().trim().min(1, 'District is required'),
  highestDegree: z.string().trim().min(1, 'Highest degree is required'),
  institution: z.string().trim().nullish(),
  cgpa: z.coerce.number().min(0, 'CGPA cannot be negative').max(5, 'CGPA cannot exceed 5.00'),
  experienceYears: z.coerce.number().optional().default(0),
  photoUrl: z.string().nullish(),
  resumeUrl: z.string().nullish(),
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const circularId = searchParams.get('circularId') || undefined;
    const status = (searchParams.get('status') as CandidateStatus) || undefined;

    const candidates = await RecruitmentService.getCandidates(circularId, status);
    return NextResponse.json({ success: true, data: candidates });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: 'Error retrieving candidates', detail: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = enrollCandidateSchema.safeParse(body);

    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      const errorMsg = Object.entries(fieldErrors)
        .map(([field, errs]) => `${field}: ${(errs || []).join(', ')}`)
        .join('; ');

      return NextResponse.json(
        { 
          success: false, 
          message: errorMsg || 'Invalid candidate data provided',
          errors: fieldErrors 
        },
        { status: 400 }
      );
    }

    const candidate = await RecruitmentService.enrollCandidate({
      ...parsed.data,
      nidNumber: parsed.data.nidNumber || undefined,
      institution: parsed.data.institution || undefined,
      photoUrl: parsed.data.photoUrl || undefined,
      resumeUrl: parsed.data.resumeUrl || undefined,
    });

    return NextResponse.json({
      success: true,
      message: 'Candidate enrolled successfully with Tracking ID',
      data: candidate,
    });
  } catch (error: any) {
    console.error('Candidate enrollment error:', error);
    if (error.code === 'P2002') {
      const target = (error.meta?.target as string[])?.join(', ') || 'field';
      return NextResponse.json(
        { success: false, message: `A candidate with this ${target} already exists.` },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to enroll candidate' },
      { status: 500 }
    );
  }
}
