import { prisma } from '../prisma';
import { hashPassword } from '../auth';
import { ConfirmationStatus, EmploymentType, UserStatus } from '@prisma/client';

export interface CreateEmployeeDTO {
  employeeId: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  password?: string;
  zoneId?: string;
  regionId?: string;
  branchId?: string;
  departmentId?: string;
  designationId?: string;
  reportingManagerId?: string;
  dateOfBirth: string;
  gender: string;
  bloodGroup?: string;
  nidNumber?: string;
  tinNumber?: string;
  joiningDate: string;
  employmentType?: EmploymentType;
  currentBasicSalary: number;
  bankName?: string;
  bankAccountNumber?: string;
  routingNumber?: string;
}

export class EmployeeService {
  static async getAllEmployees(filter?: { departmentId?: string; branchId?: string; search?: string }) {
    return prisma.user.findMany({
      where: {
        AND: [
          filter?.departmentId ? { departmentId: filter.departmentId } : {},
          filter?.branchId ? { branchId: filter.branchId } : {},
          filter?.search
            ? {
                OR: [
                  { firstName: { contains: filter.search, mode: 'insensitive' } },
                  { lastName: { contains: filter.search, mode: 'insensitive' } },
                  { employeeId: { contains: filter.search, mode: 'insensitive' } },
                  { email: { contains: filter.search, mode: 'insensitive' } },
                ],
              }
            : {},
        ],
      },
      include: {
        department: true,
        designation: { include: { jobGrade: true } },
        branch: { include: { zone: true, region: true } },
        profile: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async getEmployeeById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      include: {
        profile: true,
        department: true,
        designation: { include: { jobGrade: true } },
        branch: { include: { zone: true, region: true } },
        reportingManager: {
          select: { id: true, firstName: true, lastName: true, employeeId: true, email: true },
        },
        subordinates: {
          select: { id: true, firstName: true, lastName: true, employeeId: true },
        },
        leaveBalances: { include: { policy: true } },
        attendances: { take: 10, orderBy: { date: 'desc' } },
        transfers: {
          include: { fromBranch: true, toBranch: true, fromDesignation: true, toDesignation: true },
          orderBy: { createdAt: 'desc' },
        },
        promotions: {
          include: { fromDesignation: true, toDesignation: true, fromGrade: true, toGrade: true },
          orderBy: { createdAt: 'desc' },
        },
        increments: { orderBy: { effectiveDate: 'desc' } },
        payFixations: { include: { payScale: true }, orderBy: { effectiveDate: 'desc' } },
      },
    });
  }

  static async createEmployee(dto: CreateEmployeeDTO) {
    const defaultPassword = dto.password || 'Welcome@123';
    const passwordHash = await hashPassword(defaultPassword);

    return prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          employeeId: dto.employeeId,
          email: dto.email,
          passwordHash,
          firstName: dto.firstName,
          lastName: dto.lastName,
          phone: dto.phone,
          status: UserStatus.ACTIVE,
          zoneId: dto.zoneId || null,
          regionId: dto.regionId || null,
          branchId: dto.branchId || null,
          departmentId: dto.departmentId || null,
          designationId: dto.designationId || null,
          reportingManagerId: dto.reportingManagerId || null,
          profile: {
            create: {
              dateOfBirth: new Date(dto.dateOfBirth),
              gender: dto.gender,
              bloodGroup: dto.bloodGroup || null,
              nidNumber: dto.nidNumber || null,
              tinNumber: dto.tinNumber || null,
              joiningDate: new Date(dto.joiningDate),
              confirmationStatus: ConfirmationStatus.PROBATION,
              probationMonths: 6,
              employmentType: dto.employmentType || EmploymentType.PROBATIONARY,
              currentBasicSalary: dto.currentBasicSalary,
              bankName: dto.bankName || null,
              bankAccountNumber: dto.bankAccountNumber || null,
              routingNumber: dto.routingNumber || null,
            },
          },
        },
        include: {
          profile: true,
          department: true,
          designation: true,
          branch: true,
        },
      });

      // Initialize default leave balances for current year
      const currentYear = new Date().getFullYear();
      const policies = await tx.leavePolicy.findMany({ where: { isActive: true } });

      for (const policy of policies) {
        await tx.leaveBalance.create({
          data: {
            userId: user.id,
            policyId: policy.id,
            year: currentYear,
            allocatedDays: policy.yearlyDays,
            availedDays: 0,
            remainingDays: policy.yearlyDays,
          },
        });
      }

      return user;
    });
  }

  static async confirmProbation(userId: string, effectiveDate: Date) {
    return prisma.employeeProfile.update({
      where: { userId },
      data: {
        confirmationStatus: ConfirmationStatus.CONFIRMED,
        confirmationDate: effectiveDate,
        employmentType: EmploymentType.REGULAR,
      },
    });
  }
}
