import { prisma } from './prisma';
import { WorkflowStatus, WorkflowAction } from '@prisma/client';

export interface WorkflowActionParams {
  instanceId: string;
  actorId: string;
  action: WorkflowAction; // APPROVE, REJECT, SEND_BACK, CANCEL
  remarks?: string;
}

export class WorkflowEngine {
  /**
   * Starts a new workflow instance for an entity (e.g. Leave, Loan, Transfer)
   */
  static async startWorkflow(params: {
    module: string;
    entityType: string;
    entityId: string;
    initiatorId: string;
  }) {
    const config = await prisma.approvalWorkflowConfig.findFirst({
      where: { module: params.module, isActive: true },
      include: {
        steps: {
          orderBy: { stepOrder: 'asc' },
        },
      },
    });

    if (!config || config.steps.length === 0) {
      throw new Error(`No active approval workflow configured for module: ${params.module}`);
    }

    const instance = await prisma.approvalInstance.create({
      data: {
        workflowConfigId: config.id,
        entityType: params.entityType,
        entityId: params.entityId,
        initiatorId: params.initiatorId,
        currentStepOrder: 1,
        status: WorkflowStatus.PENDING,
        logs: {
          create: {
            stepNumber: 1,
            action: WorkflowAction.SUBMIT,
            actorId: params.initiatorId,
            remarks: 'Workflow initiated and submitted for review',
          },
        },
      },
      include: {
        workflowConfig: {
          include: { steps: true },
        },
        logs: true,
      },
    });

    return instance;
  }

  /**
   * Processes a step action (Approve, Reject, Send Back, Cancel)
   */
  static async processAction(params: WorkflowActionParams) {
    const instance = await prisma.approvalInstance.findUnique({
      where: { id: params.instanceId },
      include: {
        workflowConfig: {
          include: {
            steps: {
              orderBy: { stepOrder: 'asc' },
            },
          },
        },
      },
    });

    if (!instance) {
      throw new Error('Approval workflow instance not found');
    }

    if (instance.status !== WorkflowStatus.PENDING) {
      throw new Error(`Cannot process action on instance with status: ${instance.status}`);
    }

    const steps = instance.workflowConfig.steps;
    const currentStep = steps.find((s) => s.stepOrder === instance.currentStepOrder);

    if (!currentStep) {
      throw new Error('Current workflow step configuration not found');
    }

    let nextStatus: WorkflowStatus = WorkflowStatus.PENDING;
    let nextStepOrder = instance.currentStepOrder;

    switch (params.action) {
      case WorkflowAction.APPROVE: {
        const isLastStep = instance.currentStepOrder >= steps.length;
        if (isLastStep) {
          nextStatus = WorkflowStatus.APPROVED;
        } else {
          nextStepOrder = instance.currentStepOrder + 1;
          nextStatus = WorkflowStatus.PENDING;
        }
        break;
      }
      case WorkflowAction.REJECT: {
        nextStatus = WorkflowStatus.REJECTED;
        break;
      }
      case WorkflowAction.SEND_BACK: {
        if (instance.currentStepOrder > 1) {
          nextStepOrder = instance.currentStepOrder - 1;
        }
        nextStatus = WorkflowStatus.SENT_BACK;
        break;
      }
      case WorkflowAction.CANCEL: {
        nextStatus = WorkflowStatus.CANCELLED;
        break;
      }
      default:
        throw new Error(`Unsupported workflow action: ${params.action}`);
    }

    const updated = await prisma.$transaction(async (tx) => {
      await tx.approvalLog.create({
        data: {
          approvalInstanceId: instance.id,
          stepNumber: instance.currentStepOrder,
          action: params.action,
          actorId: params.actorId,
          remarks: params.remarks || null,
        },
      });

      return tx.approvalInstance.update({
        where: { id: instance.id },
        data: {
          currentStepOrder: nextStepOrder,
          status: nextStatus,
        },
        include: {
          workflowConfig: {
            include: { steps: true },
          },
          logs: {
            include: { actor: true },
            orderBy: { timestamp: 'desc' },
          },
        },
      });
    });

    return updated;
  }
}
