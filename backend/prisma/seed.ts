import { PrismaClient, BranchType, UserStatus, ApproverType, CandidateStatus, CircularStatus, RequisitionStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding HRIS Module 0 Master Data...');

  // 1. Company & HQ
  const company = await prisma.company.upsert({
    where: { code: 'UDDIPAN' },
    update: {},
    create: {
      code: 'UDDIPAN',
      name: 'UDDIPAN (United Development Initiatives for Programmed Actions)',
      address: 'House # 9/3, Road # 2, Block # D, Banasree, Rampura, Dhaka-1219, Bangladesh',
      email: 'info@uddipan.org',
      phone: '+880-2-8399581',
      headquarters: {
        create: {
          code: 'HQ-DHAKA',
          name: 'UDDIPAN Head Office',
          location: 'Banasree, Dhaka',
        },
      },
    },
  });

  // 2. Zones, Regions, Branches
  const zoneDhaka = await prisma.zone.upsert({
    where: { code: 'ZONE-DHK' },
    update: {},
    create: {
      code: 'ZONE-DHK',
      name: 'Dhaka Zone',
      companyId: company.id,
    },
  });

  const zoneCtg = await prisma.zone.upsert({
    where: { code: 'ZONE-CTG' },
    update: {},
    create: {
      code: 'ZONE-CTG',
      name: 'Chittagong Zone',
      companyId: company.id,
    },
  });

  const regionDhakaNorth = await prisma.region.upsert({
    where: { code: 'REG-DHK-N' },
    update: {},
    create: {
      code: 'REG-DHK-N',
      name: 'Dhaka North Region',
      zoneId: zoneDhaka.id,
    },
  });

  await prisma.branch.upsert({
    where: { code: 'BR-DHM' },
    update: {},
    create: {
      code: 'BR-DHM',
      name: 'Dhanmondi Branch',
      type: BranchType.URBAN,
      zoneId: zoneDhaka.id,
      regionId: regionDhakaNorth.id,
      address: 'Road # 27, Dhanmondi, Dhaka',
    },
  });

  await prisma.branch.upsert({
    where: { code: 'BR-KRN' },
    update: {},
    create: {
      code: 'BR-KRN',
      name: 'Keraniganj Branch',
      type: BranchType.RURAL,
      zoneId: zoneDhaka.id,
      regionId: regionDhakaNorth.id,
      address: 'Keraniganj Bazaar, Dhaka',
    },
  });

  // 3. Departments & Designations & Grades
  const hrDept = await prisma.department.upsert({
    where: { code: 'DEP-HR' },
    update: {},
    create: {
      code: 'DEP-HR',
      name: 'Human Resources & Administration',
      companyId: company.id,
    },
  });

  const financeDept = await prisma.department.upsert({
    where: { code: 'DEP-FIN' },
    update: {},
    create: {
      code: 'DEP-FIN',
      name: 'Finance & Accounts',
      companyId: company.id,
    },
  });

  const opsDept = await prisma.department.upsert({
    where: { code: 'DEP-OPS' },
    update: {},
    create: {
      code: 'DEP-OPS',
      name: 'Microfinance Operations',
      companyId: company.id,
    },
  });

  const grade1 = await prisma.jobGrade.upsert({
    where: { gradeCode: 'GRADE-01' },
    update: {},
    create: { gradeCode: 'GRADE-01', level: 1, minSalary: 120000, maxSalary: 250000 },
  });

  const grade5 = await prisma.jobGrade.upsert({
    where: { gradeCode: 'GRADE-05' },
    update: {},
    create: { gradeCode: 'GRADE-05', level: 5, minSalary: 60000, maxSalary: 110000 },
  });

  const grade8 = await prisma.jobGrade.upsert({
    where: { gradeCode: 'GRADE-08' },
    update: {},
    create: { gradeCode: 'GRADE-08', level: 8, minSalary: 30000, maxSalary: 55000 },
  });

  const desigDirector = await prisma.designation.upsert({
    where: { code: 'DES-DIR-HR' },
    update: {},
    create: {
      code: 'DES-DIR-HR',
      title: 'Director (Human Resources)',
      departmentId: hrDept.id,
      jobGradeId: grade1.id,
    },
  });

  const desigZM = await prisma.designation.upsert({
    where: { code: 'DES-ZM' },
    update: {},
    create: {
      code: 'DES-ZM',
      title: 'Zonal Manager',
      departmentId: opsDept.id,
      jobGradeId: grade5.id,
    },
  });

  const desigOfficer = await prisma.designation.upsert({
    where: { code: 'DES-OFFICER' },
    update: {},
    create: {
      code: 'DES-OFFICER',
      title: 'HR Officer',
      departmentId: hrDept.id,
      jobGradeId: grade8.id,
    },
  });

  // 4. Roles & Permissions
  const rolesList = [
    { code: 'SUPER_ADMIN', name: 'Super Administrator', description: 'Full system control' },
    { code: 'HR_ADMIN', name: 'HR Administrator', description: 'HR profile, leave, transfer management' },
    { code: 'FINANCE_ADMIN', name: 'Finance Administrator', description: 'Payroll, loan, PF and gratuity' },
    { code: 'DIRECTOR', name: 'Executive Director', description: 'Final tier approval authority' },
    { code: 'ZONAL_MANAGER', name: 'Zonal Manager', description: 'Zone level approval and reporting' },
    { code: 'REGIONAL_MANAGER', name: 'Regional Manager', description: 'Regional operations management' },
    { code: 'BRANCH_MANAGER', name: 'Branch Manager', description: 'Branch staff operations' },
    { code: 'EMPLOYEE', name: 'Employee', description: 'Self-service portal access' },
  ];

  for (const r of rolesList) {
    await prisma.role.upsert({
      where: { code: r.code },
      update: {},
      create: r,
    });
  }

  const superAdminRole = await prisma.role.findUniqueOrThrow({ where: { code: 'SUPER_ADMIN' } });

  // 5. Super Admin User
  const passwordHash = await bcrypt.hash('admin123', 10);
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@hris.local' },
    update: {},
    create: {
      employeeId: 'EMP-00001',
      email: 'admin@hris.local',
      passwordHash,
      firstName: 'System',
      lastName: 'Administrator',
      phone: '+8801700000000',
      status: UserStatus.ACTIVE,
      departmentId: hrDept.id,
      designationId: desigDirector.id,
      userRoles: {
        create: {
          roleId: superAdminRole.id,
        },
      },
      dataScopes: {
        create: {
          scopeType: 'GLOBAL',
        },
      },
    },
  });

  // 6. Seed Default Approval Workflows
  const transferWf = await prisma.approvalWorkflowConfig.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      module: 'TRANSFER',
      name: 'Employee Transfer Approval Workflow',
      description: 'Transfer path: Maker -> Regional Manager -> Zonal Manager -> HR -> Director',
      isActive: true,
      steps: {
        create: [
          { stepOrder: 1, stepName: 'Reporting / Regional Manager Review', approverType: ApproverType.REGIONAL_MANAGER },
          { stepOrder: 2, stepName: 'Zonal Manager Approval', approverType: ApproverType.ZONAL_MANAGER },
          { stepOrder: 3, stepName: 'HR Head Verification', approverType: ApproverType.ROLE, roleCode: 'HR_ADMIN' },
          { stepOrder: 4, stepName: 'Director Final Approval', approverType: ApproverType.DIRECTOR },
        ],
      },
    },
  });

  const leaveWf = await prisma.approvalWorkflowConfig.upsert({
    where: { id: '00000000-0000-0000-0000-000000000002' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000002',
      module: 'LEAVE',
      name: 'Leave Approval Workflow',
      description: 'Leave path: Employee -> Reporting Manager -> HR Approval',
      isActive: true,
      steps: {
        create: [
          { stepOrder: 1, stepName: 'Reporting Manager Approval', approverType: ApproverType.REPORTING_MANAGER },
          { stepOrder: 2, stepName: 'HR Administration Verification', approverType: ApproverType.ROLE, roleCode: 'HR_ADMIN' },
        ],
      },
    },
  });

  // 7. Seed Module 7: Recruitment & ATS Master / Transaction Data
  const branchKeraniganj = await prisma.branch.findUniqueOrThrow({ where: { code: 'BR-KRN' } });

  const requisition1 = await prisma.manpowerRequisition.upsert({
    where: { requisitionNo: 'REQ-2026-0001' },
    update: {},
    create: {
      requisitionNo: 'REQ-2026-0001',
      departmentId: opsDept.id,
      designationId: desigOfficer.id,
      branchId: branchKeraniganj.id,
      vacanciesCount: 25,
      justification: 'Field expansion for Microfinance loan operations in Keraniganj & Dhaka South Zone.',
      budgetApproved: true,
      status: RequisitionStatus.APPROVED_MANAGEMENT,
      initiatedById: adminUser.id,
      approvedById: adminUser.id,
    },
  });

  const circular1 = await prisma.jobCircular.upsert({
    where: { circularNo: 'CIR-2026-0001' },
    update: {},
    create: {
      circularNo: 'CIR-2026-0001',
      title: 'Field Officer (Microfinance Credit & Operations)',
      departmentId: opsDept.id,
      designationId: desigOfficer.id,
      jobGradeId: grade8.id,
      vacanciesCount: 25,
      applicationDeadline: new Date('2026-11-30'),
      requirements: 'Bachelor in any discipline. Motorcycle driving capability preferred.',
      minExperienceYears: 0,
      minCgpa: 2.50,
      minDegree: 'Bachelor',
      maxAge: 32,
      status: CircularStatus.PUBLISHED,
      requisitionId: requisition1.id,
    },
  });

  const candidate1 = await prisma.candidate.upsert({
    where: { trackingId: 'CAN-2026-00041' },
    update: {},
    create: {
      trackingId: 'CAN-2026-00041',
      circularId: circular1.id,
      fullName: 'Md. Jahangir Alam',
      email: 'jahangir.alam@example.com',
      phone: '+8801711223344',
      nidNumber: '19952671829000142',
      dateOfBirth: new Date('1998-05-12'),
      gender: 'MALE',
      district: 'Bogura',
      highestDegree: 'Bachelor of Business Administration',
      institution: 'Govt. Azizul Haque College, Bogura',
      cgpa: 3.42,
      experienceYears: 2,
      guarantorName: 'Md. Rafiqul Islam',
      guarantorPhone: '+8801722334455',
      guarantorNid: '19682671829000111',
      guarantorRelation: 'Uncle',
      status: CandidateStatus.DEPLOYED,
    },
  });

  await prisma.deploymentRecord.upsert({
    where: { candidateId: candidate1.id },
    update: {},
    create: {
      candidateId: candidate1.id,
      trackingId: candidate1.trackingId,
      branchId: branchKeraniganj.id,
      departmentId: opsDept.id,
      designationId: desigOfficer.id,
      joiningDeadline: new Date('2026-12-01'),
      deploymentLetterNo: 'DEP-2026-00041',
      deploymentLetterText: 'Official appointment letter for Md. Jahangir Alam to Keraniganj Branch.',
      isConvertedToEmployee: false,
    },
  });

  console.log('Seeding completed successfully (including Module 7 ATS & Recruitment)!');
  console.log(`Default Super Admin user: admin@hris.local / admin123`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
