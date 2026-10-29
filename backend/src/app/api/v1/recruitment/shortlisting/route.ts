import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { RecruitmentService } from '@/lib/services/recruitment.service';

const shortlistingSchema = z.object({
  circularId: z.string().uuid(),
  minCgpa: z.number().optional(),
  minExperienceYears: z.number().optional(),
  minDegree: z.string().optional(),
  maxAge: z.number().optional(),
  districts: z.array(z.string()).optional(),
  dryRun: z.boolean().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const circularId = searchParams.get('circularId');

    if (!circularId) {
      return NextResponse.json(
        { success: false, message: 'circularId is required for shortlisting inspection' },
        { status: 400 }
      );
    }

    const minCgpa = searchParams.get('minCgpa') ? parseFloat(searchParams.get('minCgpa')!) : undefined;
    const minExperienceYears = searchParams.get('minExperienceYears') ? parseInt(searchParams.get('minExperienceYears')!) : undefined;
    const minDegree = searchParams.get('minDegree') || undefined;
    const maxAge = searchParams.get('maxAge') ? parseInt(searchParams.get('maxAge')!) : undefined;
    const districtsParam = searchParams.get('districts');
    const districts = districtsParam ? districtsParam.split(',').map(d => d.trim()).filter(Boolean) : undefined;

    const result = await RecruitmentService.executeShortlisting({
      circularId,
      minCgpa,
      minExperienceYears,
      minDegree,
      maxAge,
      districts,
      dryRun: true,
    });

    return NextResponse.json({
      success: true,
      message: `Shortlisting simulation: ${result.shortlistedCount} of ${result.totalEvaluated} applicants qualify.`,
      data: result,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to inspect shortlisting criteria' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = shortlistingSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, errors: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const result = await RecruitmentService.executeShortlisting(parsed.data);

    return NextResponse.json({
      success: true,
      message: `Shortlisting completed successfully. ${result.shortlistedCount} candidates shortlisted out of ${result.totalEvaluated} evaluated applicants.`,
      data: result,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Shortlisting execution failed' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const circularId = searchParams.get('circularId');

    if (!circularId) {
      return NextResponse.json(
        { success: false, message: 'circularId is required to reset candidate statuses' },
        { status: 400 }
      );
    }

    const resetResult = await RecruitmentService.resetCandidatesStatus(circularId);

    return NextResponse.json({
      success: true,
      message: `Candidate statuses reset back to APPLIED (${resetResult.count} updated).`,
      data: resetResult,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to reset candidate statuses' },
      { status: 500 }
    );
  }
}
