import { prisma } from '../prisma';
import { IncrementType, TransitionType, WorkflowStatus } from '@prisma/client';

export class SuccessionService {
  /**
   * PROMOTION: Proposal & Checklist Verification
   */
  static async submitPromotion(params: {
    userId: string;
    toDesignationId: string;
    toGradeId: string;
    transitionType: TransitionType;
    effectiveDate: string;
    checklistData: Record<string, boolean>;
    remarks?: string;
  }) {
    const user = await prisma.user.findUniqueOrThrow({
      where: { id: params.userId },
      include: { designation: true },
    });

    if (!user.designationId || !user.designation?.jobGradeId) {
      throw new Error('Employee must have current designation and grade before promotion.');
    }

    const checklistVerified = Object.values(params.checklistData).every((val) => val === true);

    return prisma.promotionRecord.create({
      data: {
        userId: params.userId,
        fromDesignationId: user.designationId,
        toDesignationId: params.toDesignationId,
        fromGradeId: user.designation.jobGradeId,
        toGradeId: params.toGradeId,
        transitionType: params.transitionType,
        effectiveDate: new Date(params.effectiveDate),
        checklistVerified,
        checklistData: params.checklistData as any,
        remarks: params.remarks || null,
        status: WorkflowStatus.APPROVED, // Direct approval or workflow
      },
      include: {
        user: true,
        fromDesignation: true,
        toDesignation: true,
        fromGrade: true,
        toGrade: true,
      },
    });
  }

  /**
   * INCREMENT: Calculation & Checklist Validation
   */
  static async processIncrement(params: {
    userId: string;
    incrementType: IncrementType;
    incrementPercentage?: number; // e.g. 5%
    flatAmount?: number;
    effectiveDate: string;
    checklistData?: Record<string, boolean>;
  }) {
    const profile = await prisma.employeeProfile.findUniqueOrThrow({
      where: { userId: params.userId },
    });

    const oldBasic = Number(profile.currentBasicSalary);
    let incrementAmount = params.flatAmount || 0;

    if (params.incrementPercentage) {
      incrementAmount = Math.round((oldBasic * params.incrementPercentage) / 100);
    }

    const newBasic = oldBasic + incrementAmount;
    const checklistPassed = params.checklistData
      ? Object.values(params.checklistData).every((v) => v === true)
      : true;

    return prisma.$transaction(async (tx) => {
      const record = await tx.incrementRecord.create({
        data: {
          userId: params.userId,
          effectiveDate: new Date(params.effectiveDate),
          incrementType: params.incrementType,
          oldBasicSalary: oldBasic,
          incrementAmount,
          newBasicSalary: newBasic,
          checklistPassed,
          checklistData: params.checklistData ? (params.checklistData as any) : undefined,
          status: WorkflowStatus.APPROVED,
        },
      });

      // Update current basic in profile
      await tx.employeeProfile.update({
        where: { userId: params.userId },
        data: { currentBasicSalary: newBasic },
      });

      return record;
    });
  }

  /**
   * PAY SCALES & FIXATION
   */
  static async getPayScales() {
    return prisma.payScale.findMany({
      include: { jobGrade: true },
      orderBy: { jobGrade: { level: 'asc' } },
    });
  }

  static async recordPayFixation(params: {
    userId: string;
    payScaleId: string;
    effectiveDate: string;
    newBasicSalary: number;
    fixationReason: string;
    approvedBy?: string;
  }) {
    const profile = await prisma.employeeProfile.findUniqueOrThrow({
      where: { userId: params.userId },
    });

    const oldBasic = Number(profile.currentBasicSalary);

    return prisma.$transaction(async (tx) => {
      const fixation = await tx.payFixation.create({
        data: {
          userId: params.userId,
          payScaleId: params.payScaleId,
          effectiveDate: new Date(params.effectiveDate),
          oldBasicSalary: oldBasic,
          newBasicSalary: params.newBasicSalary,
          fixationReason: params.fixationReason,
          approvedBy: params.approvedBy || null,
        },
        include: { payScale: true },
      });

      await tx.employeeProfile.update({
        where: { userId: params.userId },
        data: { currentBasicSalary: params.newBasicSalary },
      });

      return fixation;
    });
  }
}
