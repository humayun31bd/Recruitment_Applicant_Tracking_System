import { prisma } from '../prisma';
import { CandidateStatus, CircularStatus, ExamType, RequisitionStatus, EmploymentType } from '@prisma/client';
import { EmployeeService } from './employee.service';

export interface CreateRequisitionDTO {
  departmentId: string;
  designationId: string;
  branchId?: string;
  vacanciesCount: number;
  justification: string;
  expectedJoinDate?: string;
  budgetApproved?: boolean;
  initiatedById: string;
}

export interface ApproveRequisitionDTO {
  status: RequisitionStatus;
  approvedById: string;
  rejectionReason?: string;
}

export interface CreateCircularDTO {
  title: string;
  departmentId: string;
  designationId: string;
  jobGradeId: string;
  vacanciesCount: number;
  applicationDeadline: string;
  requirements: string;
  requisitionId?: string;
  minExperienceYears?: number;
  minCgpa?: number;
  minDegree?: string;
  maxAge?: number;
}

export interface EnrollCandidateDTO {
  circularId: string;
  fullName: string;
  email: string;
  phone: string;
  nidNumber?: string;
  dateOfBirth: string;
  gender: string;
  district: string;
  highestDegree: string;
  institution?: string;
  cgpa: number;
  experienceYears?: number;
  photoUrl?: string;
  resumeUrl?: string;
}

export interface ShortlistFilterCriteria {
  circularId: string;
  minCgpa?: number;
  minExperienceYears?: number;
  minDegree?: string;
  maxAge?: number;
  districts?: string[];
  dryRun?: boolean;
}

export class RecruitmentService {
  /**
   * 0. Manpower Requisition & Approvals (Module 7.1)
   */
  static async createRequisition(dto: CreateRequisitionDTO) {
    const count = await prisma.manpowerRequisition.count();
    const currentYear = new Date().getFullYear();
    const requisitionNo = `REQ-${currentYear}-${String(count + 1).padStart(4, '0')}`;

    return prisma.manpowerRequisition.create({
      data: {
        requisitionNo,
        departmentId: dto.departmentId,
        designationId: dto.designationId,
        branchId: dto.branchId || null,
        vacanciesCount: dto.vacanciesCount,
        justification: dto.justification,
        expectedJoinDate: dto.expectedJoinDate ? new Date(dto.expectedJoinDate) : null,
        budgetApproved: dto.budgetApproved ?? false,
        status: RequisitionStatus.PENDING_HR,
        initiatedById: dto.initiatedById,
      },
      include: {
        department: true,
        designation: true,
        branch: true,
        initiatedBy: { select: { id: true, firstName: true, lastName: true, employeeId: true } },
      },
    });
  }

  static async getRequisitions(filters?: { status?: RequisitionStatus; departmentId?: string }) {
    return prisma.manpowerRequisition.findMany({
      where: {
        ...(filters?.status ? { status: filters.status } : {}),
        ...(filters?.departmentId ? { departmentId: filters.departmentId } : {}),
      },
      include: {
        department: true,
        designation: { include: { jobGrade: true } },
        branch: { include: { zone: true } },
        initiatedBy: { select: { id: true, firstName: true, lastName: true, employeeId: true } },
        approvedBy: { select: { id: true, firstName: true, lastName: true, employeeId: true } },
        _count: { select: { circulars: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async updateRequisitionStatus(id: string, dto: ApproveRequisitionDTO) {
    return prisma.manpowerRequisition.update({
      where: { id },
      data: {
        status: dto.status,
        approvedById: dto.approvedById,
        rejectionReason: dto.rejectionReason || null,
      },
      include: {
        department: true,
        designation: true,
        branch: true,
        approvedBy: { select: { id: true, firstName: true, lastName: true, employeeId: true } },
      },
    });
  }

  static async getRequisitionById(id: string) {
    return prisma.manpowerRequisition.findUnique({
      where: { id },
      include: {
        department: true,
        designation: true,
        branch: true,
        initiatedBy: { select: { id: true, firstName: true, lastName: true, employeeId: true, email: true } },
        approvedBy: { select: { id: true, firstName: true, lastName: true, employeeId: true, email: true } },
        circulars: {
          select: {
            id: true,
            circularNo: true,
            title: true,
            status: true,
            applicationDeadline: true,
            vacanciesCount: true,
          },
        },
      },
    });
  }

  static async updateRequisition(
    id: string,
    dto: {
      vacanciesCount?: number;
      justification?: string;
      expectedJoinDate?: string | null;
      budgetApproved?: boolean;
      branchId?: string | null;
    }
  ) {
    const dataToUpdate: any = {};
    if (dto.vacanciesCount !== undefined) dataToUpdate.vacanciesCount = Number(dto.vacanciesCount);
    if (dto.justification !== undefined) dataToUpdate.justification = dto.justification;
    if (dto.expectedJoinDate !== undefined) {
      dataToUpdate.expectedJoinDate = dto.expectedJoinDate ? new Date(dto.expectedJoinDate) : null;
    }
    if (dto.budgetApproved !== undefined) dataToUpdate.budgetApproved = dto.budgetApproved;
    if (dto.branchId !== undefined) dataToUpdate.branchId = dto.branchId || null;

    return prisma.manpowerRequisition.update({
      where: { id },
      data: dataToUpdate,
      include: {
        department: true,
        designation: true,
        branch: true,
      },
    });
  }

  static async deleteRequisition(id: string) {
    const existing = await prisma.manpowerRequisition.findUnique({
      where: { id },
      include: { _count: { select: { circulars: true } } },
    });

    if (!existing) {
      throw new Error('Requisition not found');
    }

    if (existing._count.circulars > 0) {
      return prisma.manpowerRequisition.update({
        where: { id },
        data: { status: RequisitionStatus.CANCELLED },
      });
    }

    return prisma.manpowerRequisition.delete({
      where: { id },
    });
  }
  /**
   * 1. Job Circulars Management
   */
  static async createJobCircular(dto: CreateCircularDTO) {
    const count = await prisma.jobCircular.count();
    const currentYear = new Date().getFullYear();
    const circularNo = `CIR-${currentYear}-${String(count + 1).padStart(4, '0')}`;

    return prisma.jobCircular.create({
      data: {
        circularNo,
        title: dto.title,
        departmentId: dto.departmentId,
        designationId: dto.designationId,
        jobGradeId: dto.jobGradeId,
        vacanciesCount: dto.vacanciesCount,
        applicationDeadline: new Date(dto.applicationDeadline),
        requirements: dto.requirements,
        minExperienceYears: dto.minExperienceYears ?? 0,
        minCgpa: dto.minCgpa ?? 2.50,
        minDegree: dto.minDegree ?? 'Bachelor',
        maxAge: dto.maxAge ?? 32,
        status: CircularStatus.PUBLISHED,
        requisitionId: dto.requisitionId || null,
      },
      include: {
        department: true,
        designation: true,
        jobGrade: true,
      },
    });
  }

  static async getJobCirculars(status?: CircularStatus) {
    const where: any = {};
    if (status) {
      where.status = status;
    }

    return prisma.jobCircular.findMany({
      where,
      include: {
        department: true,
        designation: true,
        jobGrade: true,
        _count: { select: { candidates: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async getJobCircularById(id: string) {
    return prisma.jobCircular.findUnique({
      where: { id },
      include: {
        department: true,
        designation: true,
        jobGrade: true,
        requisition: true,
        _count: { select: { candidates: true, examSchedules: true, vivaBoards: true } },
      },
    });
  }

  static async updateJobCircular(id: string, dto: Partial<CreateCircularDTO> & { status?: CircularStatus }) {
    const dataToUpdate: any = {};
    if (dto.title !== undefined) dataToUpdate.title = dto.title;
    if (dto.departmentId !== undefined) dataToUpdate.departmentId = dto.departmentId;
    if (dto.designationId !== undefined) dataToUpdate.designationId = dto.designationId;
    if (dto.jobGradeId !== undefined) dataToUpdate.jobGradeId = dto.jobGradeId;
    if (dto.vacanciesCount !== undefined) dataToUpdate.vacanciesCount = Number(dto.vacanciesCount);
    if (dto.applicationDeadline !== undefined) dataToUpdate.applicationDeadline = new Date(dto.applicationDeadline);
    if (dto.requirements !== undefined) dataToUpdate.requirements = dto.requirements;
    if (dto.requisitionId !== undefined) dataToUpdate.requisitionId = dto.requisitionId || null;
    if (dto.minExperienceYears !== undefined) dataToUpdate.minExperienceYears = Number(dto.minExperienceYears);
    if (dto.minCgpa !== undefined) dataToUpdate.minCgpa = Number(dto.minCgpa);
    if (dto.minDegree !== undefined) dataToUpdate.minDegree = dto.minDegree;
    if (dto.maxAge !== undefined) dataToUpdate.maxAge = Number(dto.maxAge);
    if (dto.status !== undefined) dataToUpdate.status = dto.status;

    return prisma.jobCircular.update({
      where: { id },
      data: dataToUpdate,
      include: {
        department: true,
        designation: true,
        jobGrade: true,
        _count: { select: { candidates: true } },
      },
    });
  }

  static async deleteJobCircular(id: string) {
    const candidateCount = await prisma.candidate.count({ where: { circularId: id } });
    if (candidateCount > 0) {
      return prisma.jobCircular.update({
        where: { id },
        data: { status: CircularStatus.ARCHIVED },
      });
    }
    return prisma.jobCircular.delete({
      where: { id },
    });
  }

  /**
   * 2. Candidate Enrollment & CV Bank
   */
  static async enrollCandidate(dto: EnrollCandidateDTO) {
    const count = await prisma.candidate.count();
    const currentYear = new Date().getFullYear();
    const trackingId = `CAN-${currentYear}-${String(count + 1).padStart(5, '0')}`;

    return prisma.candidate.create({
      data: {
        trackingId,
        circularId: dto.circularId,
        fullName: dto.fullName.trim(),
        email: dto.email.trim().toLowerCase(),
        phone: dto.phone.trim(),
        nidNumber: dto.nidNumber && dto.nidNumber.trim() ? dto.nidNumber.trim() : null,
        dateOfBirth: new Date(dto.dateOfBirth),
        gender: dto.gender,
        district: dto.district.trim(),
        highestDegree: dto.highestDegree.trim(),
        institution: dto.institution && dto.institution.trim() ? dto.institution.trim() : null,
        cgpa: dto.cgpa,
        experienceYears: dto.experienceYears ?? 0,
        photoUrl: dto.photoUrl || null,
        resumeUrl: dto.resumeUrl || null,
        status: CandidateStatus.APPLIED,
      },
      include: { circular: true },
    });
  }

  static async getCandidates(circularId?: string, status?: CandidateStatus) {
    return prisma.candidate.findMany({
      where: {
        AND: [
          circularId ? { circularId } : {},
          status ? { status } : {},
        ],
      },
      include: {
        circular: {
          include: {
            designation: { include: { jobGrade: true } },
            department: true,
            jobGrade: true,
          },
        },
        admitCards: true,
        examResults: true,
        vivaScores: true,
        deployment: {
          include: {
            branch: { include: { zone: true } },
            designation: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async getCandidateById(id: string) {
    return prisma.candidate.findUnique({
      where: { id },
      include: {
        circular: {
          include: {
            designation: { include: { jobGrade: true } },
            department: true,
            jobGrade: true,
          },
        },
        admitCards: true,
        examResults: true,
        vivaScores: true,
        deployment: {
          include: {
            branch: { include: { zone: true } },
            designation: true,
          },
        },
      },
    });
  }

  static async updateCandidate(id: string, data: any) {
    const dataToUpdate: any = {};
    if (data.fullName !== undefined) dataToUpdate.fullName = data.fullName;
    if (data.email !== undefined) dataToUpdate.email = data.email;
    if (data.phone !== undefined) dataToUpdate.phone = data.phone;
    if (data.nidNumber !== undefined) dataToUpdate.nidNumber = data.nidNumber;
    if (data.dateOfBirth !== undefined) dataToUpdate.dateOfBirth = new Date(data.dateOfBirth);
    if (data.gender !== undefined) dataToUpdate.gender = data.gender;
    if (data.district !== undefined) dataToUpdate.district = data.district;
    if (data.highestDegree !== undefined) dataToUpdate.highestDegree = data.highestDegree;
    if (data.institution !== undefined) dataToUpdate.institution = data.institution;
    if (data.cgpa !== undefined) dataToUpdate.cgpa = data.cgpa;
    if (data.experienceYears !== undefined) dataToUpdate.experienceYears = Number(data.experienceYears);
    if (data.status !== undefined) dataToUpdate.status = data.status;

    return prisma.candidate.update({
      where: { id },
      data: dataToUpdate,
      include: {
        circular: { include: { designation: true, department: true } },
      },
    });
  }

  static async deleteCandidate(id: string) {
    return prisma.candidate.delete({
      where: { id },
    });
  }

  static async resetCandidatesStatus(circularId: string) {
    return prisma.candidate.updateMany({
      where: { circularId },
      data: { status: CandidateStatus.APPLIED },
    });
  }

  /**
   * 3. Multi-Criteria Advanced Shortlisting Engine
   */
  static async executeShortlisting(criteria: ShortlistFilterCriteria) {
    const candidates = await prisma.candidate.findMany({
      where: {
        circularId: criteria.circularId,
        ...(criteria.dryRun ? {} : { status: CandidateStatus.APPLIED }),
      },
      include: {
        circular: { select: { circularNo: true, title: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const shortlistedIds: string[] = [];
    const disqualifiedIds: string[] = [];
    const evaluations: any[] = [];
    const now = new Date();

    for (const cand of candidates) {
      let isEligible = true;
      const reasons: string[] = [];

      // CGPA Check
      const candCgpa = Number(cand.cgpa);
      if (criteria.minCgpa !== undefined && candCgpa < criteria.minCgpa) {
        isEligible = false;
        reasons.push(`CGPA ${candCgpa.toFixed(2)} is below minimum ${criteria.minCgpa.toFixed(2)}`);
      }

      // Experience Check
      if (criteria.minExperienceYears !== undefined && cand.experienceYears < criteria.minExperienceYears) {
        isEligible = false;
        reasons.push(`Experience ${cand.experienceYears}y is below required ${criteria.minExperienceYears}y`);
      }

      // District Filter
      if (criteria.districts && criteria.districts.length > 0 && !criteria.districts.includes(cand.district)) {
        isEligible = false;
        reasons.push(`District (${cand.district}) is not in target districts list`);
      }

      // Age Check
      const dob = new Date(cand.dateOfBirth);
      const ageDiff = now.getTime() - dob.getTime();
      const ageDate = new Date(ageDiff);
      const age = Math.abs(ageDate.getUTCFullYear() - 1970);
      if (criteria.maxAge !== undefined && age > criteria.maxAge) {
        isEligible = false;
        reasons.push(`Age ${age}y exceeds maximum ${criteria.maxAge}y`);
      }

      // Degree Check
      if (criteria.minDegree && criteria.minDegree !== 'Any' && cand.highestDegree) {
        const reqDeg = criteria.minDegree.toLowerCase();
        const candDeg = cand.highestDegree.toLowerCase();
        if (reqDeg.includes('master') && !candDeg.includes('master') && !candDeg.includes('mba') && !candDeg.includes('msc')) {
          isEligible = false;
          reasons.push(`Degree (${cand.highestDegree}) does not meet Master's level requirement`);
        }
      }

      evaluations.push({
        candidateId: cand.id,
        trackingId: cand.trackingId,
        fullName: cand.fullName,
        email: cand.email,
        phone: cand.phone,
        cgpa: candCgpa,
        age,
        experienceYears: cand.experienceYears,
        district: cand.district,
        highestDegree: cand.highestDegree,
        currentStatus: cand.status,
        isEligible,
        reasons,
      });

      if (isEligible) {
        shortlistedIds.push(cand.id);
      } else {
        disqualifiedIds.push(cand.id);
      }
    }

    if (!criteria.dryRun && shortlistedIds.length > 0) {
      await prisma.candidate.updateMany({
        where: { id: { in: shortlistedIds } },
        data: { status: CandidateStatus.SHORTLISTED },
      });
    }

    return {
      totalEvaluated: candidates.length,
      shortlistedCount: shortlistedIds.length,
      disqualifiedCount: disqualifiedIds.length,
      shortlistedCandidateIds: shortlistedIds,
      evaluations,
      dryRun: !!criteria.dryRun,
    };
  }

  /**
   * 4. Exam Halls & Scheduling Management
   */
  static async getExamHalls() {
    return prisma.examHall.findMany({
      include: {
        _count: { select: { examSchedules: true } },
      },
      orderBy: { hallName: 'asc' },
    });
  }

  static async createExamHall(data: {
    hallName: string;
    centerLocation: string;
    roomNumber?: string;
    capacity: number;
  }) {
    return prisma.examHall.create({
      data: {
        hallName: data.hallName,
        centerLocation: data.centerLocation,
        roomNumber: data.roomNumber || null,
        capacity: Number(data.capacity) || 50,
      },
    });
  }

  static async updateExamHall(
    id: string,
    data: {
      hallName?: string;
      centerLocation?: string;
      roomNumber?: string;
      capacity?: number;
    }
  ) {
    return prisma.examHall.update({
      where: { id },
      data: {
        ...data,
        capacity: data.capacity !== undefined ? Number(data.capacity) : undefined,
      },
    });
  }

  static async deleteExamHall(id: string) {
    return prisma.examHall.delete({ where: { id } });
  }

  static async getExamSchedules(circularId?: string) {
    return prisma.examSchedule.findMany({
      where: circularId ? { circularId } : undefined,
      include: {
        hall: true,
        circular: {
          include: {
            designation: true,
            department: true,
          },
        },
        _count: { select: { admitCards: true, results: true } },
      },
      orderBy: { examDate: 'desc' },
    });
  }

  static async getExamScheduleById(id: string) {
    return prisma.examSchedule.findUnique({
      where: { id },
      include: {
        hall: true,
        circular: {
          include: {
            designation: true,
            department: true,
          },
        },
        admitCards: {
          include: {
            candidate: true,
          },
          orderBy: { rollNumber: 'asc' },
        },
        _count: { select: { results: true } },
      },
    });
  }

  static async deleteExamSchedule(id: string) {
    const schedule = await prisma.examSchedule.findUnique({
      where: { id },
      include: { admitCards: true },
    });
    if (!schedule) throw new Error('Exam schedule not found');

    const candidateIds = schedule.admitCards.map((a) => a.candidateId);

    return prisma.$transaction(async (tx) => {
      if (candidateIds.length > 0) {
        await tx.candidate.updateMany({
          where: { id: { in: candidateIds } },
          data: { status: CandidateStatus.SHORTLISTED },
        });
      }
      return tx.examSchedule.delete({ where: { id } });
    });
  }

  static async scheduleExamAndGenerateAdmitCards(params: {
    circularId: string;
    examType: ExamType;
    examDate: string;
    startTime: string;
    endTime: string;
    hallId: string;
    totalMarks: number;
    passMarks: number;
    includeApplied?: boolean;
  }) {
    let targetCandidates = await prisma.candidate.findMany({
      where: {
        circularId: params.circularId,
        status: CandidateStatus.SHORTLISTED,
      },
    });

    // If no explicitly SHORTLISTED candidates exist and includeApplied is allowed, take APPLIED/VERIFIED
    if (targetCandidates.length === 0 && params.includeApplied) {
      targetCandidates = await prisma.candidate.findMany({
        where: {
          circularId: params.circularId,
          status: { in: [CandidateStatus.SHORTLISTED, CandidateStatus.VERIFIED, CandidateStatus.APPLIED] },
        },
      });
    }

    if (targetCandidates.length === 0) {
      throw new Error('No eligible candidates available for this job circular. Please shortlist candidates or check the circular applicant pool.');
    }

    const hall = await prisma.examHall.findUnique({
      where: { id: params.hallId },
    });

    if (!hall) {
      throw new Error('Selected Exam Hall does not exist');
    }

    return prisma.$transaction(async (tx) => {
      const schedule = await tx.examSchedule.create({
        data: {
          circularId: params.circularId,
          examType: params.examType,
          examDate: new Date(params.examDate),
          startTime: params.startTime,
          endTime: params.endTime,
          hallId: params.hallId,
          totalMarks: params.totalMarks,
          passMarks: params.passMarks,
        },
        include: { hall: true },
      });

      // Safe roll number assignment
      const currentYear = new Date().getFullYear();
      let rollStart = 100000;
      const lastAdmitCard = await tx.admitCard.findFirst({
        orderBy: { rollNumber: 'desc' },
      });
      if (lastAdmitCard && !isNaN(Number(lastAdmitCard.rollNumber))) {
        rollStart = Math.max(rollStart, Number(lastAdmitCard.rollNumber));
      }

      for (let i = 0; i < targetCandidates.length; i++) {
        const candidate = targetCandidates[i];
        const rollNumber = String(rollStart + i + 1);
        const seatNumber = `Seat-${String(i + 1).padStart(3, '0')}`;
        const admitCardNo = `ADM-${currentYear}-${rollNumber}`;

        await tx.admitCard.create({
          data: {
            admitCardNo,
            candidateId: candidate.id,
            examScheduleId: schedule.id,
            rollNumber,
            seatNumber,
            qrCodePayload: `UDDIPAN-EXAM:${admitCardNo}:${candidate.trackingId}:${rollNumber}`,
          },
        });

        await tx.candidate.update({
          where: { id: candidate.id },
          data: { status: CandidateStatus.EXAM_SCHEDULED },
        });
      }

      return tx.examSchedule.findUnique({
        where: { id: schedule.id },
        include: {
          hall: true,
          circular: { include: { designation: true, department: true } },
          _count: { select: { admitCards: true, results: true } },
        },
      });
    });
  }

  /**
   * 5. Exam Results Processing
   */
  static async uploadExamResults(params: {
    examScheduleId: string;
    results: Array<{ candidateId: string; marksObtained: number }>;
  }) {
    const schedule = await prisma.examSchedule.findUniqueOrThrow({
      where: { id: params.examScheduleId },
    });

    return prisma.$transaction(async (tx) => {
      // Sort to calculate merit rank
      const sorted = [...params.results].sort((a, b) => b.marksObtained - a.marksObtained);

      for (let rank = 0; rank < sorted.length; rank++) {
        const item = sorted[rank];
        const isPassed = item.marksObtained >= Number(schedule.passMarks);

        await tx.examResult.upsert({
          where: {
            candidateId_examScheduleId: {
              candidateId: item.candidateId,
              examScheduleId: params.examScheduleId,
            },
          },
          update: {
            marksObtained: item.marksObtained,
            isPassed,
            meritRank: rank + 1,
          },
          create: {
            candidateId: item.candidateId,
            examScheduleId: params.examScheduleId,
            marksObtained: item.marksObtained,
            isPassed,
            meritRank: rank + 1,
          },
        });

        if (isPassed) {
          await tx.candidate.update({
            where: { id: item.candidateId },
            data: { status: CandidateStatus.WRITTEN_PASSED },
          });
        }
      }

      return { totalUploaded: sorted.length };
    });
  }

  /**
   * 6. Viva Board & Candidate Scoring
   */
  static async setupVivaBoard(params: {
    boardName: string;
    circularId: string;
    vivaDate: string;
    venue: string;
    memberUserIds: string[];
  }) {
    return prisma.vivaBoard.create({
      data: {
        boardName: params.boardName,
        circularId: params.circularId,
        vivaDate: new Date(params.vivaDate),
        venue: params.venue,
        members: {
          create: params.memberUserIds.map((userId) => ({ userId, role: 'Board Member' })),
        },
      },
      include: {
        members: { include: { user: true } },
      },
    });
  }

  static async submitVivaScore(params: {
    vivaBoardId: string;
    candidateId: string;
    memberId: string;
    appearanceScore: number;
    technicalScore: number;
    communicationScore: number;
    remarks?: string;
  }) {
    const totalScore = params.appearanceScore + params.technicalScore + params.communicationScore;

    return prisma.$transaction(async (tx) => {
      const score = await tx.vivaScore.upsert({
        where: {
          vivaBoardId_candidateId_memberId: {
            vivaBoardId: params.vivaBoardId,
            candidateId: params.candidateId,
            memberId: params.memberId,
          },
        },
        update: {
          appearanceScore: params.appearanceScore,
          technicalScore: params.technicalScore,
          communicationScore: params.communicationScore,
          totalScore,
          remarks: params.remarks || null,
        },
        create: {
          vivaBoardId: params.vivaBoardId,
          candidateId: params.candidateId,
          memberId: params.memberId,
          appearanceScore: params.appearanceScore,
          technicalScore: params.technicalScore,
          communicationScore: params.communicationScore,
          totalScore,
          remarks: params.remarks || null,
        },
      });

      // If average viva score >= 25 / 40, select candidate
      if (totalScore >= 25) {
        await tx.candidate.update({
          where: { id: params.candidateId },
          data: { status: CandidateStatus.SELECTED },
        });
      }

      return score;
    });
  }

  /**
   * 7. Deployment Letter Generation with Tracking ID
   */
  static async generateDeploymentLetter(params: {
    candidateId: string;
    branchId: string;
    joiningDeadline: string;
  }) {
    const candidate = await prisma.candidate.findUniqueOrThrow({
      where: { id: params.candidateId },
      include: {
        circular: { include: { department: true, designation: true } },
      },
    });

    const branch = await prisma.branch.findUniqueOrThrow({
      where: { id: params.branchId },
      include: { zone: true },
    });

    const deploymentLetterNo = `DEP-${new Date().getFullYear()}-${candidate.trackingId.replace('CAN-', '')}`;
    const deadlineStr = new Date(params.joiningDeadline).toLocaleDateString('en-GB');

    const deploymentLetterText = `
উদ্দিপন (UDDIPAN)
প্রধান কার্যালয়, ঢাকা
স্মারক নং: UDDIPAN/HR/${deploymentLetterNo}
তারিখ: ${new Date().toLocaleDateString('en-GB')}

বিষয়: নিয়োগ ও পদায়ন আদেশ পত্র (Appointment & Deployment Letter)

বরাবর,
${candidate.fullName}
ট্র্যাকিং আইডি: ${candidate.trackingId}
জেলা: ${candidate.district}

প্রিয় মহোদয়/মহোদয়া,
উদ্দিপন-এর নিয়োগ বিজ্ঞপ্তি (${candidate.circular.circularNo}) এর প্রেক্ষিতে অনুষ্ঠিত লিখিত ও মৌখিক পরীক্ষায় কৃতিত্বের সাথে উত্তীর্ণ হওয়ায় আপনাকে মানবসম্পদ ও প্রশাসন বিভাগের অধীনে "${candidate.circular.designation.title}" পদে সাময়িকভাবে নিয়োগ প্রদান করে ${branch.name} (${branch.zone.name}) এ পদায়ন করা হলো।

শর্তাবলী:
১. আপনাকে আগামী ${deadlineStr} তারিখের মধ্যে নির্ধারিত কর্মস্থলে যোগদানপত্র দাখিল করতে হবে।
২. যোগদানের সময় আপনার সকল শিক্ষাগত যোগ্যতার সনদ, জাতীয় পরিচয়পত্র (NID) ও ৪ কপি সত্যায়িত ছবি দাখিল করতে হবে।
৩. চাকরি সংক্রান্ত অন্যান্য বিষয়াবলী উদ্দিপন-এর চাকরি প্রবিধানমালা অনুযায়ী পরিচালিত হবে।

কর্তৃপক্ষের অনুমোদনক্রমে,
পরিচালক (প্রশাসন ও মানবসম্পদ)
উদ্দিপন, প্রধান কার্যালয়, ঢাকা।
    `.trim();

    return prisma.$transaction(async (tx) => {
      const record = await tx.deploymentRecord.create({
        data: {
          candidateId: candidate.id,
          trackingId: candidate.trackingId,
          branchId: branch.id,
          departmentId: candidate.circular.departmentId,
          designationId: candidate.circular.designationId,
          joiningDeadline: new Date(params.joiningDeadline),
          deploymentLetterNo,
          deploymentLetterText,
        },
      });

      await tx.candidate.update({
        where: { id: candidate.id },
        data: { status: CandidateStatus.DEPLOYED },
      });

      return record;
    });
  }

  /**
   * 8. Core HR Handshake: Convert Deployed Candidate to Employee (Module 1)
   */
  static async convertToEmployee(deploymentId: string) {
    const deployment = await prisma.deploymentRecord.findUniqueOrThrow({
      where: { id: deploymentId },
      include: {
        candidate: {
          include: {
            circular: {
              include: {
                jobGrade: true,
              },
            },
          },
        },
        branch: { include: { zone: true, region: true } },
        department: true,
        designation: true,
      },
    });

    if (deployment.isConvertedToEmployee && deployment.convertedEmployeeId) {
      throw new Error('This deployed candidate has already been onboarded as an employee.');
    }

    const currentYear = new Date().getFullYear();
    const userCount = await prisma.user.count();
    const employeeId = `EMP-${currentYear}-${String(userCount + 1).padStart(5, '0')}`;

    const names = deployment.candidate.fullName.trim().split(/\s+/);
    const firstName = names[0] || 'Staff';
    const lastName = names.slice(1).join(' ') || 'Member';

    const basicSalary = deployment.candidate.circular.jobGrade?.minSalary 
      ? Number(deployment.candidate.circular.jobGrade.minSalary) 
      : 18000;

    const newEmployee = await EmployeeService.createEmployee({
      employeeId,
      email: deployment.candidate.email,
      firstName,
      lastName,
      phone: deployment.candidate.phone,
      departmentId: deployment.departmentId,
      designationId: deployment.designationId,
      branchId: deployment.branchId,
      zoneId: deployment.branch.zoneId || undefined,
      regionId: deployment.branch.regionId || undefined,
      dateOfBirth: deployment.candidate.dateOfBirth.toISOString(),
      gender: deployment.candidate.gender,
      nidNumber: deployment.candidate.nidNumber || undefined,
      joiningDate: deployment.joiningDeadline.toISOString(),
      employmentType: EmploymentType.PROBATIONARY,
      currentBasicSalary: basicSalary,
    });

    const updatedDeployment = await prisma.deploymentRecord.update({
      where: { id: deployment.id },
      data: {
        isConvertedToEmployee: true,
        convertedEmployeeId: newEmployee.id,
        convertedAt: new Date(),
      },
      include: {
        convertedEmployee: true,
        candidate: true,
        branch: true,
        designation: true,
      },
    });

    return updatedDeployment;
  }
}
