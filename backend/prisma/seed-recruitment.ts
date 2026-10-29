import { PrismaClient, CandidateStatus, CircularStatus, ExamType, RequisitionStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Comprehensive Recruitment Master & Transaction Data...');

  // 1. Fetch prerequisite records
  const company = await prisma.company.findUniqueOrThrow({ where: { code: 'UDDIPAN' } });
  const hrDept = await prisma.department.findUniqueOrThrow({ where: { code: 'DEP-HR' } });
  const finDept = await prisma.department.findUniqueOrThrow({ where: { code: 'DEP-FIN' } });
  const opsDept = await prisma.department.findUniqueOrThrow({ where: { code: 'DEP-OPS' } });

  const desigOfficer = await prisma.designation.findUniqueOrThrow({ where: { code: 'DES-OFFICER' } });
  const desigDirector = await prisma.designation.findUniqueOrThrow({ where: { code: 'DES-DIR-HR' } });
  const desigZM = await prisma.designation.findUniqueOrThrow({ where: { code: 'DES-ZM' } });

  const grade8 = await prisma.jobGrade.findUniqueOrThrow({ where: { gradeCode: 'GRADE-08' } });
  const grade5 = await prisma.jobGrade.findUniqueOrThrow({ where: { gradeCode: 'GRADE-05' } });
  const grade1 = await prisma.jobGrade.findUniqueOrThrow({ where: { gradeCode: 'GRADE-01' } });

  const branchDhanmondi = await prisma.branch.findUniqueOrThrow({ where: { code: 'BR-DHM' } });
  const branchKeraniganj = await prisma.branch.findUniqueOrThrow({ where: { code: 'BR-KRN' } });

  const adminUser = await prisma.user.findFirstOrThrow({ where: { email: 'admin@hris.local' } });

  // Key evaluator users
  const masudUser = await prisma.user.findFirst({ where: { email: 'masud.rahman@uddipan.org' } }) || adminUser;
  const rafiqulUser = await prisma.user.findFirst({ where: { email: 'rafiqul.alam@uddipan.org' } }) || adminUser;
  const zubaidaUser = await prisma.user.findFirst({ where: { email: 'zubaida.sultana@uddipan.org' } }) || adminUser;
  const farukUser = await prisma.user.findFirst({ where: { email: 'faruk.hossain@uddipan.org' } }) || adminUser;

  // 2. Seed Manpower Requisitions
  const req1 = await prisma.manpowerRequisition.upsert({
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

  const req2 = await prisma.manpowerRequisition.upsert({
    where: { requisitionNo: 'REQ-2026-0002' },
    update: {},
    create: {
      requisitionNo: 'REQ-2026-0002',
      departmentId: finDept.id,
      designationId: desigOfficer.id,
      branchId: branchDhanmondi.id,
      vacanciesCount: 10,
      justification: 'Internal branch audit & compliance accounting staffing across Dhaka Zone branches.',
      budgetApproved: true,
      status: RequisitionStatus.APPROVED_MANAGEMENT,
      initiatedById: adminUser.id,
      approvedById: adminUser.id,
    },
  });

  const req3 = await prisma.manpowerRequisition.upsert({
    where: { requisitionNo: 'REQ-2026-0003' },
    update: {},
    create: {
      requisitionNo: 'REQ-2026-0003',
      departmentId: opsDept.id,
      designationId: desigZM.id,
      branchId: branchKeraniganj.id,
      vacanciesCount: 3,
      justification: 'Zonal operational oversight and recovery monitoring officers for Chittagong Zone.',
      budgetApproved: true,
      status: RequisitionStatus.APPROVED_HR,
      initiatedById: adminUser.id,
      approvedById: adminUser.id,
    },
  });

  const req4 = await prisma.manpowerRequisition.upsert({
    where: { requisitionNo: 'REQ-2026-0004' },
    update: {},
    create: {
      requisitionNo: 'REQ-2026-0004',
      departmentId: hrDept.id,
      designationId: desigOfficer.id,
      branchId: branchDhanmondi.id,
      vacanciesCount: 2,
      justification: 'Central HRIS and attendance records verification officer.',
      budgetApproved: false,
      status: RequisitionStatus.PENDING_HR,
      initiatedById: adminUser.id,
    },
  });

  // 3. Seed Job Circulars
  const cir1 = await prisma.jobCircular.upsert({
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
      requirements: 'Bachelor in any discipline from a recognized university. Valid motorcycle driving license preferred. Maximum age 32.',
      minExperienceYears: 0,
      minCgpa: 2.50,
      minDegree: 'Bachelor',
      maxAge: 32,
      status: CircularStatus.PUBLISHED,
      requisitionId: req1.id,
    },
  });

  const cir2 = await prisma.jobCircular.upsert({
    where: { circularNo: 'CIR-2026-0002' },
    update: {},
    create: {
      circularNo: 'CIR-2026-0002',
      title: 'Junior Accounts Officer (Branch Audit & Finance)',
      departmentId: finDept.id,
      designationId: desigOfficer.id,
      jobGradeId: grade8.id,
      vacanciesCount: 10,
      applicationDeadline: new Date('2026-12-15'),
      requirements: 'BBA/B.Com in Accounting/Finance. Proficiency in tally, spreadsheet and computerized financial reporting. Maximum age 30.',
      minExperienceYears: 1,
      minCgpa: 2.75,
      minDegree: 'Bachelor',
      maxAge: 30,
      status: CircularStatus.PUBLISHED,
      requisitionId: req2.id,
    },
  });

  const cir3 = await prisma.jobCircular.upsert({
    where: { circularNo: 'CIR-2026-0003' },
    update: {},
    create: {
      circularNo: 'CIR-2026-0003',
      title: 'Assistant Zonal Manager (Operations & Audit)',
      departmentId: opsDept.id,
      designationId: desigZM.id,
      jobGradeId: grade5.id,
      vacanciesCount: 3,
      applicationDeadline: new Date('2026-12-31'),
      requirements: 'Masters in Economics, Finance, or Management with at least 5 years experience in microfinance operations.',
      minExperienceYears: 5,
      minCgpa: 3.00,
      minDegree: 'Master',
      maxAge: 40,
      status: CircularStatus.PUBLISHED,
      requisitionId: req3.id,
    },
  });

  // 4. Seed Exam Halls
  const hallA = await prisma.examHall.upsert({
    where: { hallName: 'Hall A - Central Auditorium' },
    update: {},
    create: {
      hallName: 'Hall A - Central Auditorium',
      centerLocation: 'Dhaka College Complex, Mirpur Road',
      roomNumber: 'Room 302',
      capacity: 150,
    },
  });

  const hallB = await prisma.examHall.upsert({
    where: { hallName: 'Hall B - Science Building' },
    update: {},
    create: {
      hallName: 'Hall B - Science Building',
      centerLocation: 'Dhaka College Complex, Mirpur Road',
      roomNumber: 'Room 105',
      capacity: 80,
    },
  });

  const hallC = await prisma.examHall.upsert({
    where: { hallName: 'Hall C - Chittagong Model School' },
    update: {},
    create: {
      hallName: 'Hall C - Chittagong Model School',
      centerLocation: 'Chittagong Central Area, GEC Circle',
      roomNumber: 'Hall 1',
      capacity: 100,
    },
  });

  const hallD = await prisma.examHall.upsert({
    where: { hallName: 'Hall D - Rajshahi Govt College' },
    update: {},
    create: {
      hallName: 'Hall D - Rajshahi Govt College',
      centerLocation: 'Rajshahi Sadar Campus',
      roomNumber: 'Room 201',
      capacity: 120,
    },
  });

  // 5. Seed Exam Schedules
  const schedule1 = await prisma.examSchedule.upsert({
    where: { id: '00000000-0000-0000-0001-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0001-000000000001',
      circularId: cir1.id,
      examType: ExamType.WRITTEN,
      examDate: new Date('2026-11-15T10:00:00.000Z'),
      startTime: '10:00 AM',
      endTime: '12:00 PM',
      hallId: hallA.id,
      totalMarks: 100.0,
      passMarks: 50.0,
    },
  });

  const schedule2 = await prisma.examSchedule.upsert({
    where: { id: '00000000-0000-0000-0001-000000000002' },
    update: {},
    create: {
      id: '00000000-0000-0000-0001-000000000002',
      circularId: cir2.id,
      examType: ExamType.WRITTEN,
      examDate: new Date('2026-11-20T14:00:00.000Z'),
      startTime: '02:00 PM',
      endTime: '04:00 PM',
      hallId: hallB.id,
      totalMarks: 100.0,
      passMarks: 50.0,
    },
  });

  // 6. Seed Viva Boards & Members
  const vivaBoard1 = await prisma.vivaBoard.upsert({
    where: { id: '00000000-0000-0000-0002-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0002-000000000001',
      boardName: 'Viva Board 1: Field Officers Selection Panel',
      circularId: cir1.id,
      vivaDate: new Date('2026-11-05T10:00:00.000Z'),
      venue: 'Head Office Board Room (Level 5), Uddipan Bhaban, Banasree, Dhaka',
      isPublished: false,
    },
  });

  const vivaBoard2 = await prisma.vivaBoard.upsert({
    where: { id: '00000000-0000-0000-0002-000000000002' },
    update: {},
    create: {
      id: '00000000-0000-0000-0002-000000000002',
      boardName: 'Viva Board 2: Branch Accounts & Audit Panel',
      circularId: cir2.id,
      vivaDate: new Date('2026-11-08T10:00:00.000Z'),
      venue: 'Executive Conference Suite (Level 4), Uddipan Bhaban, Dhaka',
      isPublished: false,
    },
  });

  // Attach evaluators to Board 1
  const evaluators = [
    { user: masudUser, role: 'Board Chairman' },
    { user: rafiqulUser, role: 'Technical Expert' },
    { user: zubaidaUser, role: 'HR Member' },
    { user: farukUser, role: 'Member Secretary' },
  ];

  for (const ev of evaluators) {
    await prisma.vivaBoardMember.upsert({
      where: {
        vivaBoardId_userId: {
          vivaBoardId: vivaBoard1.id,
          userId: ev.user.id,
        },
      },
      update: { role: ev.role },
      create: {
        vivaBoardId: vivaBoard1.id,
        userId: ev.user.id,
        role: ev.role,
      },
    });

    await prisma.vivaBoardMember.upsert({
      where: {
        vivaBoardId_userId: {
          vivaBoardId: vivaBoard2.id,
          userId: ev.user.id,
        },
      },
      update: { role: ev.role },
      create: {
        vivaBoardId: vivaBoard2.id,
        userId: ev.user.id,
        role: ev.role,
      },
    });
  }

  // 7. Seed 24 Realistic Candidates with Full Lifecycle Relationships
  const candidatesData = [
    // --- APPLIED (CV Bank) ---
    {
      trackingId: 'CAN-2026-00001',
      fullName: 'Rashidul Hasan',
      email: 'rashidul.hasan@example.com',
      phone: '+8801712000001',
      nidNumber: '1998267182900001',
      dateOfBirth: new Date('1998-02-14'),
      gender: 'MALE',
      district: 'Barishal',
      highestDegree: 'Bachelor (Finance)',
      institution: 'University of Barishal',
      cgpa: 2.85,
      experienceYears: 0,
      status: CandidateStatus.APPLIED,
      circularId: cir1.id,
    },
    {
      trackingId: 'CAN-2026-00002',
      fullName: 'Shamima Akter',
      email: 'shamima.akter@example.com',
      phone: '+8801712000002',
      nidNumber: '1999267182900002',
      dateOfBirth: new Date('1999-06-20'),
      gender: 'FEMALE',
      district: 'Gazipur',
      highestDegree: 'Bachelor (Sociology)',
      institution: 'Govt. Titumir College',
      cgpa: 2.95,
      experienceYears: 1,
      status: CandidateStatus.APPLIED,
      circularId: cir1.id,
    },
    {
      trackingId: 'CAN-2026-00003',
      fullName: 'Mehedi Hasan',
      email: 'mehedi.hasan@example.com',
      phone: '+8801712000003',
      nidNumber: '1997267182900003',
      dateOfBirth: new Date('1997-11-05'),
      gender: 'MALE',
      district: 'Narayanganj',
      highestDegree: 'Bachelor (Marketing)',
      institution: 'Tejgaon College',
      cgpa: 3.10,
      experienceYears: 1,
      status: CandidateStatus.APPLIED,
      circularId: cir1.id,
    },
    {
      trackingId: 'CAN-2026-00004',
      fullName: 'Rashedul Kabir',
      email: 'rashedul.kabir@example.com',
      phone: '+8801712000004',
      nidNumber: '1996267182900004',
      dateOfBirth: new Date('1996-09-18'),
      gender: 'MALE',
      district: 'Mymensingh',
      highestDegree: 'Bachelor (Economics)',
      institution: 'Ananda Mohan College',
      cgpa: 3.05,
      experienceYears: 2,
      status: CandidateStatus.APPLIED,
      circularId: cir2.id,
    },

    // --- SHORTLISTED ---
    {
      trackingId: 'CAN-2026-00010',
      fullName: 'Sharmin Sultana',
      email: 'sharmin.sultana@example.com',
      phone: '+8801712000010',
      nidNumber: '1998267182900010',
      dateOfBirth: new Date('1998-03-25'),
      gender: 'FEMALE',
      district: 'Chittagong',
      highestDegree: 'Bachelor (Management)',
      institution: 'Chittagong College',
      cgpa: 3.30,
      experienceYears: 2,
      status: CandidateStatus.SHORTLISTED,
      circularId: cir1.id,
    },
    {
      trackingId: 'CAN-2026-00011',
      fullName: 'Kamrul Islam',
      email: 'kamrul.islam@example.com',
      phone: '+8801712000011',
      nidNumber: '1997267182900011',
      dateOfBirth: new Date('1997-07-12'),
      gender: 'MALE',
      district: 'Sylhet',
      highestDegree: 'Bachelor (BBA)',
      institution: 'MC College, Sylhet',
      cgpa: 3.25,
      experienceYears: 1,
      status: CandidateStatus.SHORTLISTED,
      circularId: cir1.id,
    },
    {
      trackingId: 'CAN-2026-00012',
      fullName: 'Tahmina Begum',
      email: 'tahmina.begum@example.com',
      phone: '+8801712000012',
      nidNumber: '1999267182900012',
      dateOfBirth: new Date('1999-12-01'),
      gender: 'FEMALE',
      district: 'Cumilla',
      highestDegree: 'Bachelor (Accounting)',
      institution: 'Victoria College, Cumilla',
      cgpa: 3.40,
      experienceYears: 2,
      status: CandidateStatus.SHORTLISTED,
      circularId: cir2.id,
    },
    {
      trackingId: 'CAN-2026-00013',
      fullName: 'Arifur Rahman',
      email: 'arifur.rahman@example.com',
      phone: '+8801712000013',
      nidNumber: '1995267182900013',
      dateOfBirth: new Date('1995-04-19'),
      gender: 'MALE',
      district: 'Khulna',
      highestDegree: 'Bachelor (Finance)',
      institution: 'Govt. BL College, Khulna',
      cgpa: 3.15,
      experienceYears: 1,
      status: CandidateStatus.SHORTLISTED,
      circularId: cir2.id,
    },

    // --- WRITTEN_PASSED / VIVA_SCHEDULED (With Admit Cards & Exam Scores) ---
    {
      trackingId: 'CAN-2026-00020',
      fullName: 'Tanvir Ahmed',
      email: 'tanvir.ahmed@example.com',
      phone: '+8801712000020',
      nidNumber: '1998267182900020',
      dateOfBirth: new Date('1998-01-10'),
      gender: 'MALE',
      district: 'Rajshahi',
      highestDegree: 'Bachelor (Sociology)',
      institution: 'Rajshahi College',
      cgpa: 3.20,
      experienceYears: 1,
      status: CandidateStatus.WRITTEN_PASSED,
      circularId: cir1.id,
      rollNumber: '100020',
      seatNumber: 'A-01',
      writtenScore: 78.5,
    },
    {
      trackingId: 'CAN-2026-00021',
      fullName: 'Nusrat Jahan',
      email: 'nusrat.jahan@example.com',
      phone: '+8801712000021',
      nidNumber: '1999267182900021',
      dateOfBirth: new Date('1999-08-15'),
      gender: 'FEMALE',
      district: 'Dhaka',
      highestDegree: 'Bachelor (Economics)',
      institution: 'Eden Mohila College',
      cgpa: 3.60,
      experienceYears: 1,
      status: CandidateStatus.WRITTEN_PASSED,
      circularId: cir1.id,
      rollNumber: '100021',
      seatNumber: 'A-02',
      writtenScore: 82.0,
    },
    {
      trackingId: 'CAN-2026-00022',
      fullName: 'Mahfuzur Rahman',
      email: 'mahfuzur.rahman@example.com',
      phone: '+8801712000022',
      nidNumber: '1996267182900022',
      dateOfBirth: new Date('1996-05-30'),
      gender: 'MALE',
      district: 'Bogura',
      highestDegree: 'Bachelor (BBA)',
      institution: 'Azizul Haque College',
      cgpa: 3.35,
      experienceYears: 2,
      status: CandidateStatus.WRITTEN_PASSED,
      circularId: cir1.id,
      rollNumber: '100022',
      seatNumber: 'A-03',
      writtenScore: 68.0,
    },
    {
      trackingId: 'CAN-2026-00023',
      fullName: 'Sadia Afrin',
      email: 'sadia.afrin@example.com',
      phone: '+8801712000023',
      nidNumber: '1997267182900023',
      dateOfBirth: new Date('1997-10-22'),
      gender: 'FEMALE',
      district: 'Chittagong',
      highestDegree: 'Bachelor (Management)',
      institution: 'Govt. Commerce College',
      cgpa: 3.45,
      experienceYears: 2,
      status: CandidateStatus.WRITTEN_PASSED,
      circularId: cir1.id,
      rollNumber: '100023',
      seatNumber: 'A-04',
      writtenScore: 74.0,
    },
    {
      trackingId: 'CAN-2026-00024',
      fullName: 'Shakil Khan',
      email: 'shakil.khan@example.com',
      phone: '+8801712000024',
      nidNumber: '1998267182900024',
      dateOfBirth: new Date('1998-04-18'),
      gender: 'MALE',
      district: 'Rangpur',
      highestDegree: 'Bachelor (Sociology)',
      institution: 'Carmichael College',
      cgpa: 3.10,
      experienceYears: 0,
      status: CandidateStatus.WRITTEN_PASSED,
      circularId: cir1.id,
      rollNumber: '100024',
      seatNumber: 'A-05',
      writtenScore: 61.5,
    },
    {
      trackingId: 'CAN-2026-00025',
      fullName: 'Nazmul Huda',
      email: 'nazmul.huda@example.com',
      phone: '+8801712000025',
      nidNumber: '1996267182900025',
      dateOfBirth: new Date('1996-12-05'),
      gender: 'MALE',
      district: 'Sylhet',
      highestDegree: 'Bachelor (Accounting)',
      institution: 'MC College, Sylhet',
      cgpa: 3.05,
      experienceYears: 1,
      status: CandidateStatus.WRITTEN_PASSED,
      circularId: cir2.id,
      rollNumber: '100025',
      seatNumber: 'B-01',
      writtenScore: 71.0,
    },

    // --- SELECTED ---
    {
      trackingId: 'CAN-2026-00030',
      fullName: 'Farhana Akter',
      email: 'farhana.akter@example.com',
      phone: '+8801712000030',
      nidNumber: '1997267182900030',
      dateOfBirth: new Date('1997-02-18'),
      gender: 'FEMALE',
      district: 'Dhaka',
      highestDegree: 'Master (Economics)',
      institution: 'University of Dhaka',
      cgpa: 3.65,
      experienceYears: 3,
      status: CandidateStatus.SELECTED,
      circularId: cir1.id,
      rollNumber: '100030',
      seatNumber: 'A-06',
      writtenScore: 85.0,
      vivaAvg: 36.5,
    },
    {
      trackingId: 'CAN-2026-00031',
      fullName: 'Aminul Islam',
      email: 'aminul.islam@example.com',
      phone: '+8801712000031',
      nidNumber: '1996267182900031',
      dateOfBirth: new Date('1996-08-11'),
      gender: 'MALE',
      district: 'Dhaka',
      highestDegree: 'Bachelor (BBA)',
      institution: 'Jagannath University',
      cgpa: 3.55,
      experienceYears: 2,
      status: CandidateStatus.SELECTED,
      circularId: cir1.id,
      rollNumber: '100031',
      seatNumber: 'A-07',
      writtenScore: 80.0,
      vivaAvg: 34.0,
    },

    // --- DEPLOYED ---
    {
      trackingId: 'CAN-2026-00041',
      fullName: 'Md. Jahangir Alam',
      email: 'jahangir.alam@example.com',
      phone: '+8801712000041',
      nidNumber: '1995267182900041',
      dateOfBirth: new Date('1995-05-12'),
      gender: 'MALE',
      district: 'Bogura',
      highestDegree: 'Bachelor (BBA)',
      institution: 'Govt. Azizul Haque College',
      cgpa: 3.42,
      experienceYears: 2,
      status: CandidateStatus.DEPLOYED,
      circularId: cir1.id,
      rollNumber: '100041',
      seatNumber: 'A-08',
      writtenScore: 88.0,
      vivaAvg: 37.0,
    },
    {
      trackingId: 'CAN-2026-00042',
      fullName: 'Bilkis Banu',
      email: 'bilkis.banu@example.com',
      phone: '+8801712000042',
      nidNumber: '1996267182900042',
      dateOfBirth: new Date('1996-03-09'),
      gender: 'FEMALE',
      district: 'Dhaka',
      highestDegree: 'Bachelor (BBA)',
      institution: 'Dhaka University',
      cgpa: 3.50,
      experienceYears: 2,
      status: CandidateStatus.DEPLOYED,
      circularId: cir1.id,
      rollNumber: '100042',
      seatNumber: 'A-09',
      writtenScore: 82.5,
      vivaAvg: 35.5,
    },
  ];

  for (const cData of candidatesData) {
    const { rollNumber, seatNumber, writtenScore, vivaAvg, ...baseCandidate } = cData;

    const cand = await prisma.candidate.upsert({
      where: { trackingId: baseCandidate.trackingId },
      update: {
        fullName: baseCandidate.fullName,
        status: baseCandidate.status,
        cgpa: baseCandidate.cgpa,
        highestDegree: baseCandidate.highestDegree,
        district: baseCandidate.district,
      },
      create: baseCandidate,
    });

    // If candidate has exam records (admit card & exam result)
    if (rollNumber) {
      const schedule = cData.circularId === cir2.id ? schedule2 : schedule1;

      await prisma.admitCard.upsert({
        where: { rollNumber },
        update: {},
        create: {
          admitCardNo: `ADM-2026-${rollNumber}`,
          candidateId: cand.id,
          examScheduleId: schedule.id,
          rollNumber,
          seatNumber: seatNumber || 'A-01',
          qrCodePayload: `UDDIPAN-EXAM:${schedule.id}:${rollNumber}`,
          isPrinted: true,
        },
      });

      if (writtenScore !== undefined) {
        await prisma.examResult.upsert({
          where: {
            candidateId_examScheduleId: {
              candidateId: cand.id,
              examScheduleId: schedule.id,
            },
          },
          update: {
            marksObtained: writtenScore,
            isPassed: writtenScore >= 50.0,
          },
          create: {
            candidateId: cand.id,
            examScheduleId: schedule.id,
            marksObtained: writtenScore,
            isPassed: writtenScore >= 50.0,
            meritRank: writtenScore >= 80 ? 1 : (writtenScore >= 70 ? 2 : 3),
          },
        });
      }

      // If candidate is also in Viva, seed viva evaluator scores
      if (cand.status === CandidateStatus.WRITTEN_PASSED || cand.status === CandidateStatus.SELECTED || cand.status === CandidateStatus.DEPLOYED) {
        const board = cData.circularId === cir2.id ? vivaBoard2 : vivaBoard1;
        
        // Seed score from Board Chairman
        await prisma.vivaScore.upsert({
          where: {
            vivaBoardId_candidateId_memberId: {
              vivaBoardId: board.id,
              candidateId: cand.id,
              memberId: masudUser.id,
            },
          },
          update: {},
          create: {
            vivaBoardId: board.id,
            candidateId: cand.id,
            memberId: masudUser.id,
            appearanceScore: 8.5,
            technicalScore: 17.0,
            communicationScore: 8.5,
            totalScore: 34.0,
            remarks: 'Strong aptitude for field management and microfinance operational ethics.',
          },
        });

        // Seed score from Technical Expert
        await prisma.vivaScore.upsert({
          where: {
            vivaBoardId_candidateId_memberId: {
              vivaBoardId: board.id,
              candidateId: cand.id,
              memberId: rafiqulUser.id,
            },
          },
          update: {},
          create: {
            vivaBoardId: board.id,
            candidateId: cand.id,
            memberId: rafiqulUser.id,
            appearanceScore: 8.0,
            technicalScore: 18.0,
            communicationScore: 8.0,
            totalScore: 34.0,
            remarks: 'Sound accounting and field credit collection methodology understanding.',
          },
        });
      }
    }

    // If deployed, ensure deployment record exists
    if (cand.status === CandidateStatus.DEPLOYED) {
      await prisma.deploymentRecord.upsert({
        where: { candidateId: cand.id },
        update: {},
        create: {
          candidateId: cand.id,
          trackingId: cand.trackingId,
          branchId: branchKeraniganj.id,
          departmentId: opsDept.id,
          designationId: desigOfficer.id,
          joiningDeadline: new Date('2026-12-01'),
          deploymentLetterNo: `DEP-2026-${cand.trackingId.replace('CAN-2026-', '')}`,
          deploymentLetterText: `Official appointment letter for ${cand.fullName} to Keraniganj Branch operations.`,
          isConvertedToEmployee: false,
        },
      });
    }
  }

  // 8. Assign Recruitment RBAC Roles to users
  const roleHQ = await prisma.role.findUniqueOrThrow({ where: { code: 'HQ_ADMIN' } });
  const roleZM = await prisma.role.findUniqueOrThrow({ where: { code: 'ZONE_ADMIN' } });
  const roleBM = await prisma.role.findUniqueOrThrow({ where: { code: 'BRANCH_ADMIN' } });
  const roleViva = await prisma.role.findUniqueOrThrow({ where: { code: 'VIVA_BOARD_MEMBER' } });
  const roleUser = await prisma.role.findUniqueOrThrow({ where: { code: 'USERS' } });

  const roleAssignments = [
    { user: adminUser, role: roleHQ },
    { user: masudUser, role: roleViva },
    { user: rafiqulUser, role: roleViva },
    { user: zubaidaUser, role: roleViva },
    { user: farukUser, role: roleViva },
  ];

  for (const ra of roleAssignments) {
    await prisma.userRole.upsert({
      where: {
        userId_roleId: {
          userId: ra.user.id,
          roleId: ra.role.id,
        },
      },
      update: {},
      create: {
        userId: ra.user.id,
        roleId: ra.role.id,
      },
    });
  }

  console.log('Successfully seeded Recruitment Portal: Requisitions, Circulars, Exam Halls, Schedules, Admit Cards, Scores, Viva Boards & Candidates!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
