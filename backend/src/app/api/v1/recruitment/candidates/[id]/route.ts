import { NextRequest, NextResponse } from 'next/server';
import { RecruitmentService } from '@/lib/services/recruitment.service';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const candidate = await RecruitmentService.getCandidateById(params.id);
    if (!candidate) {
      return NextResponse.json({ success: false, message: 'Candidate not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: candidate });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: 'Error retrieving candidate', detail: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const updated = await RecruitmentService.updateCandidate(params.id, body);
    return NextResponse.json({
      success: true,
      message: 'Candidate updated successfully',
      data: updated,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to update candidate' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await RecruitmentService.deleteCandidate(params.id);
    return NextResponse.json({
      success: true,
      message: 'Candidate deleted successfully',
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to delete candidate' },
      { status: 500 }
    );
  }
}
