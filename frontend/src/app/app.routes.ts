import { Routes } from '@angular/router';
import { authGuard } from '@core/guards/auth.guard';
import { LoginComponent } from '@features/auth/login.component';
import { MainLayoutComponent } from '@shared/components/layout/main-layout.component';
import { DashboardComponent } from '@features/dashboard/dashboard.component';
import { AdminSuccessionComponent } from '@features/admin-succession/admin-succession.component';
import { RecruitmentComponent } from '@features/recruitment/recruitment.component';
import { NewCircularComponent } from '@features/recruitment/new-circular.component';
import { ModulePlaceholderComponent } from '@features/modules/module-placeholder.component';
import { GeneralSettingsComponent } from '@features/settings/general-settings.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardComponent },
      {
        path: 'admin-succession',
        component: AdminSuccessionComponent
      },
      {
        path: 'loans',
        component: ModulePlaceholderComponent,
        data: {
          code: 'M2',
          title: 'Module 2: Employee Loan Management',
          description: 'Staff loans, EMI amortization calculations, bulk loan approvals, reschedule and zero-balance auto-settlement.',
          subModules: [
            'Policy-based Online Loan Applications',
            'Automated Multi-Tier Loan Approval Matrix',
            'Automatic Repayment Amortization & Rescheduling',
            'Bulk Staff Loan Upload System'
          ]
        }
      },
      {
        path: 'welfare-fund',
        component: ModulePlaceholderComponent,
        data: {
          code: 'M3',
          title: 'Module 3: Employee Welfare Fund (SWF)',
          description: 'Disaster and medical grant applications with file attachments, donation statements, and Bengali voucher generation.',
          subModules: [
            'Online Application with Multi-File Attachments',
            'Welfare Committee Approval Pipeline',
            'Official Bengali Donation Letter Generation',
            'Monthly & Yearly Staff Donation Statements'
          ]
        }
      },
      {
        path: 'provident-fund',
        component: ModulePlaceholderComponent,
        data: {
          code: 'M4',
          title: 'Module 4: Contributory Provident Fund (CPF)',
          description: 'PF policy rules, trustee board signatories, profit upload, and combined PF slips.',
          subModules: [
            'CPF Policy & Contribution Rates Config',
            'Trustee Board Signatory Configuration',
            'Yearly Profit Batch Distribution & Upload',
            'Zone/Region/Department PF Statements & Slips'
          ]
        }
      },
      {
        path: 'gratuity-separation',
        component: ModulePlaceholderComponent,
        data: {
          code: 'M5',
          title: 'Module 5: Gratuity & Separation Management',
          description: 'Gratuity calculation, resignation workflows, departmental clearances, and final settlement computations.',
          subModules: [
            'Gratuity Membership & Service Multiplier Calculation',
            'Trustee Board Meeting Minutes Generation',
            'Resignation & Discontinuation Lifecycle (Notice period, Handover)',
            'Multi-Departmental Clearance & Final Settlement Voucher'
          ]
        }
      },
      {
        path: 'payroll',
        component: ModulePlaceholderComponent,
        data: {
          code: 'M6',
          title: 'Module 6: Enterprise Payroll Management',
          description: 'Allowances, deductions, bonuses, Bangladesh NBR income tax engine, arrear calculation, and CBS bank advice.',
          subModules: [
            'Grade & Branch-wise Allowance & Deduction Matrices',
            'NBR Tax Slab & Investment Rebate Calculation',
            'Monthly Batch Payroll Execution Engine',
            'Payslips (Bilingual PDF) & Bank Deposit Advice'
          ]
        }
      },
      {
        path: 'recruitment/new-circular',
        component: NewCircularComponent
      },
      {
        path: 'recruitment/edit-circular/:id',
        component: NewCircularComponent
      },
      {
        path: 'recruitment/create-circular',
        component: NewCircularComponent
      },
      {
        path: 'job-circular',
        component: NewCircularComponent
      },
      {
        path: 'recruitment',
        component: RecruitmentComponent
      },
      {
        path: 'training',
        component: ModulePlaceholderComponent,
        data: {
          code: 'M8',
          title: 'Module 8: Training Management System',
          description: 'Training Needs Analysis (TNA), annual training calendar, trainer remuneration, attendance, and certificates.',
          subModules: [
            'Training Category & Internal/External Trainer Database',
            'Training Needs Analysis & Department Nominations',
            'Session Attendance & Automated SMS/Email Alerts',
            'Participant & Trainer Evaluations and Certificate Generation'
          ]
        }
      },
      {
        path: 'settings',
        redirectTo: 'settings/company',
        pathMatch: 'full'
      },
      {
        path: 'settings/:tab',
        component: GeneralSettingsComponent
      }
    ]
  },
  { path: '**', redirectTo: 'dashboard' }
];
