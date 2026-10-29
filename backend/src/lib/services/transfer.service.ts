import { prisma } from '../prisma';
import { WorkflowEngine } from '../workflow';
import { TransitionType, WorkflowStatus } from '@prisma/client';

export interface CreateTransferDTO {
  userId: string;
  fromBranchId: string;
  toBranchId: string;
  fromDepartmentId: string;
  toDepartmentId: string;
  fromDesignationId: string;
  toDesignationId: string;
  transitionType: TransitionType;
  effectiveDate: string;
  reason: string;
  initiatorId: string;
  checklistData?: Record<string, boolean>;
}

export class TransferService {
  static async createTransferProposal(dto: CreateTransferDTO) {
    const count = await prisma.transferProposal.count();
    const currentYear = new Date().getFullYear();
    const proposalNo = `TR-${currentYear}-${String(count + 1).padStart(5, '0')}`;

    // Verify checklist
    const checklistPassed = dto.checklistData
      ? Object.values(dto.checklistData).every((val) => val === true)
      : true;

    // Create the transfer proposal in DRAFT / PENDING
    const transfer = await prisma.transferProposal.create({
      data: {
        proposalNo,
        userId: dto.userId,
        fromBranchId: dto.fromBranchId,
        toBranchId: dto.toBranchId,
        fromDepartmentId: dto.fromDepartmentId,
        toDepartmentId: dto.toDepartmentId,
        fromDesignationId: dto.fromDesignationId,
        toDesignationId: dto.toDesignationId,
        transitionType: dto.transitionType,
        effectiveDate: new Date(dto.effectiveDate),
        reason: dto.reason,
        checklistPassed,
        checklistData: dto.checklistData ? (dto.checklistData as any) : undefined,
        status: WorkflowStatus.PENDING,
      },
      include: {
        user: true,
        fromBranch: true,
        toBranch: true,
        toDesignation: true,
      },
    });

    // Initiate the dynamic approval workflow instance
    const workflowInstance = await WorkflowEngine.startWorkflow({
      module: 'TRANSFER',
      entityType: 'TransferProposal',
      entityId: transfer.id,
      initiatorId: dto.initiatorId,
    });

    // Link approval instance to proposal
    const updatedTransfer = await prisma.transferProposal.update({
      where: { id: transfer.id },
      data: { approvalInstanceId: workflowInstance.id },
      include: {
        user: true,
        fromBranch: true,
        toBranch: true,
        fromDepartment: true,
        toDepartment: true,
        fromDesignation: true,
        toDesignation: true,
        approvalInstance: {
          include: { logs: { include: { actor: true } }, workflowConfig: { include: { steps: true } } },
        },
      },
    });

    return updatedTransfer;
  }

  static async getTransferProposals() {
    return prisma.transferProposal.findMany({
      include: {
        user: { select: { id: true, employeeId: true, firstName: true, lastName: true, email: true } },
        fromBranch: true,
        toBranch: true,
        fromDepartment: true,
        toDepartment: true,
        fromDesignation: true,
        toDesignation: true,
        approvalInstance: {
          include: {
            logs: { include: { actor: true }, orderBy: { timestamp: 'desc' } },
            workflowConfig: { include: { steps: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async generateOfficialTransferLetter(transferId: string) {
    const transfer = await prisma.transferProposal.findUnique({
      where: { id: transferId },
      include: {
        user: { include: { profile: true } },
        fromBranch: { include: { zone: true } },
        toBranch: { include: { zone: true } },
        fromDepartment: true,
        toDepartment: true,
        fromDesignation: true,
        toDesignation: true,
      },
    });

    if (!transfer) {
      throw new Error('Transfer proposal not found');
    }

    const effectiveDateStr = new Date(transfer.effectiveDate).toLocaleDateString('en-GB');

    // Official Bilingual Transfer Letter Content (Bengali and English)
    const banglaLetterText = `
উদ্দিপন (UDDIPAN)
প্রধান কার্যালয়, ঢাকা
স্মারক নং: UDDIPAN/HR/${transfer.proposalNo}
তারিখ: ${new Date().toLocaleDateString('en-GB')}

বিষয়: বদলি আদেশ পত্র (Office Order for Employee Transfer)

জনাব/জনাবা ${transfer.user.firstName} ${transfer.user.lastName} (কর্মকর্তা আইডি: ${transfer.user.employeeId}),
পদবী: ${transfer.fromDesignation.title},
বর্তমান কর্মস্থল: ${transfer.fromBranch.name} (${transfer.fromBranch.zone.name})।

এতদ্বারা কর্তৃপক্ষের অনুমোদনক্রমে আপনাকে জানানো যাচ্ছে যে, দাপ্তরিক ও প্রাতিষ্ঠানিক কাজের সুবিধার্থে আপনাকে বর্তমান কর্মস্থল ${transfer.fromBranch.name} হতে বদলি করে ${transfer.toBranch.name} (${transfer.toBranch.zone.name}) এ ${transfer.toDesignation.title} পদে পদায়ন করা হলো।

উক্ত বদলি আদেশ আগামী ${effectiveDateStr} তারিখ হতে কার্যকর হবে। 
আপনাকে নির্দেশ প্রদান করা যাচ্ছে যে, আগামী ${effectiveDateStr} তারিখের মধ্যে বর্তমান দায়িত্ব বুঝিয়ে দিয়ে নতুন কর্মস্থলে যোগদান করার জন্য অনুরোধ করা হলো।

কর্তৃপক্ষের নির্দেশক্রমে,
মানবসম্পদ ও প্রশাসন বিভাগ
উদ্দিপন, প্রধান কার্যালয়, ঢাকা।
    `.trim();

    await prisma.transferProposal.update({
      where: { id: transferId },
      data: {
        letterGenerated: true,
        letterContentBangla: banglaLetterText,
      },
    });

    return {
      proposalNo: transfer.proposalNo,
      employeeName: `${transfer.user.firstName} ${transfer.user.lastName}`,
      employeeId: transfer.user.employeeId,
      fromBranch: transfer.fromBranch.name,
      toBranch: transfer.toBranch.name,
      newDesignation: transfer.toDesignation.title,
      effectiveDate: effectiveDateStr,
      letterBangla: banglaLetterText,
    };
  }

  /**
   * Finalizes the transfer execution in master user record after Director approval
   */
  static async finalizeTransfer(transferId: string) {
    const transfer = await prisma.transferProposal.findUnique({
      where: { id: transferId },
      include: { toBranch: true },
    });

    if (!transfer || transfer.status !== WorkflowStatus.APPROVED) {
      throw new Error('Transfer is not approved yet.');
    }

    await prisma.user.update({
      where: { id: transfer.userId },
      data: {
        branchId: transfer.toBranchId,
        zoneId: transfer.toBranch.zoneId,
        regionId: transfer.toBranch.regionId,
        departmentId: transfer.toDepartmentId,
        designationId: transfer.toDesignationId,
      },
    });

    return { success: true, message: 'Employee profile updated to new posting' };
  }
}
