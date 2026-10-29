import { prisma } from '../prisma';
import { WorkflowEngine } from '../workflow';
import { WorkflowStatus } from '@prisma/client';

export interface ApplyLeaveDTO {
  userId: string;
  policyId: string;
  startDate: string;
  endDate: string;
  reason: string;
  emergencyContact?: string;
  emergencyAddress?: string;
  initiatorId: string;
}

export class LeaveService {
  static async getLeavePolicies() {
    return prisma.leavePolicy.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  static async getEmployeeLeaveBalances(userId: string, year?: number) {
    const targetYear = year || new Date().getFullYear();
    return prisma.leaveBalance.findMany({
      where: { userId, year: targetYear },
      include: { policy: true },
    });
  }

  static async applyLeave(dto: ApplyLeaveDTO) {
    const start = new Date(dto.startDate);
    const end = new Date(dto.endDate);

    if (end < start) {
      throw new Error('End date cannot be earlier than start date');
    }

    // Calculate business days inclusive
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    const currentYear = start.getFullYear();

    // Verify leave balance
    const balance = await prisma.leaveBalance.findUnique({
      where: {
        userId_policyId_year: {
          userId: dto.userId,
          policyId: dto.policyId,
          year: currentYear,
        },
      },
      include: { policy: true },
    });

    if (!balance) {
      throw new Error('No leave balance allocated for this leave type in current year');
    }

    if (Number(balance.remainingDays) < totalDays && balance.policy.leaveTypeCode !== 'LWP') {
      throw new Error(
        `Insufficient leave balance. Requested: ${totalDays} days, Remaining: ${balance.remainingDays} days`
      );
    }

    const count = await prisma.leaveApplication.count();
    const applicationNo = `LV-${currentYear}-${String(count + 1).padStart(5, '0')}`;

    const application = await prisma.leaveApplication.create({
      data: {
        applicationNo,
        userId: dto.userId,
        policyId: dto.policyId,
        startDate: start,
        endDate: end,
        totalDays,
        reason: dto.reason,
        emergencyContact: dto.emergencyContact || null,
        emergencyAddress: dto.emergencyAddress || null,
        status: WorkflowStatus.PENDING,
      },
      include: {
        user: true,
        policy: true,
      },
    });

    // Start workflow
    const workflowInstance = await WorkflowEngine.startWorkflow({
      module: 'LEAVE',
      entityType: 'LeaveApplication',
      entityId: application.id,
      initiatorId: dto.initiatorId,
    });

    const updatedApp = await prisma.leaveApplication.update({
      where: { id: application.id },
      data: { approvalInstanceId: workflowInstance.id },
      include: {
        user: true,
        policy: true,
        approvalInstance: {
          include: {
            logs: { include: { actor: true } },
            workflowConfig: { include: { steps: true } },
          },
        },
      },
    });

    return updatedApp;
  }

  static async finalizeLeaveApproval(applicationId: string) {
    const app = await prisma.leaveApplication.findUnique({
      where: { id: applicationId },
      include: { policy: true },
    });

    if (!app || app.status !== WorkflowStatus.APPROVED) {
      throw new Error('Leave application is not in approved state');
    }

    const year = new Date(app.startDate).getFullYear();

    // Deduct remaining days
    await prisma.leaveBalance.update({
      where: {
        userId_policyId_year: {
          userId: app.userId,
          policyId: app.policyId,
          year,
        },
      },
      data: {
        availedDays: { increment: Number(app.totalDays) },
        remainingDays: { decrement: Number(app.totalDays) },
      },
    });

    return { success: true, message: 'Leave days deducted from balance' };
  }
}
