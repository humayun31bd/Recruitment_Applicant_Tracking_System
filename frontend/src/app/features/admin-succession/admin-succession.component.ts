import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ApprovalStepperComponent, WorkflowStepView } from '@shared/components/approval-stepper/approval-stepper.component';
import { DataTableComponent, ColumnDef } from '@shared/components/data-table/data-table.component';

@Component({
  selector: 'app-admin-succession',
  standalone: true,
  imports: [CommonModule, FormsModule, ApprovalStepperComponent, DataTableComponent],
  template: `
    <div class="space-y-6">
      <!-- Module 1 Title & Description -->
      <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-2">
            <span class="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 font-mono text-xs border border-emerald-800">
              MODULE 1
            </span>
            <h2 class="text-xl font-bold text-slate-100">Administration, Succession & Leave Portal</h2>
          </div>
          <p class="text-xs text-slate-400 mt-1">
            Work timings, employee 360 profile, succession pay scales, promotions, multi-tier transfers, and leave management.
          </p>
        </div>

        <div class="flex items-center gap-2">
          <button (click)="openOnboardModal()" class="px-3.5 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors shadow-md">
            + Onboard Employee
          </button>
          <button (click)="openTransferModal()" class="px-3.5 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg transition-colors">
            + Transfer Proposal
          </button>
        </div>
      </div>

      <!-- Navigation Tabs -->
      <div class="border-b border-slate-800 flex items-center gap-2 text-xs font-medium">
        <button 
          *ngFor="let tab of tabs" 
          (click)="activeTab = tab.id"
          [ngClass]="{
            'text-emerald-400 border-b-2 border-emerald-500 font-semibold bg-emerald-500/5': activeTab === tab.id,
            'text-slate-400 hover:text-slate-200': activeTab !== tab.id
          }"
          class="px-4 py-2.5 transition-all">
          {{ tab.label }}
        </button>
      </div>

      <!-- ================================================================= -->
      <!-- TAB 1: EMPLOYEE 360 DIRECTORY -->
      <!-- ================================================================= -->
      <div *ngIf="activeTab === 'employees'" class="space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div *ngFor="let emp of employees" class="bg-slate-900 border border-slate-800 rounded-xl p-4 hover:border-slate-700 transition-all shadow-sm">
            <div class="flex items-start justify-between">
              <div>
                <span class="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-emerald-400 border border-slate-700">
                  {{ emp.employeeId }}
                </span>
                <h4 class="text-sm font-bold text-slate-100 mt-2">{{ emp.firstName }} {{ emp.lastName }}</h4>
                <p class="text-xs text-slate-400">{{ emp.designation?.title || 'Officer' }}</p>
                <p class="text-[11px] text-slate-500 mt-0.5">{{ emp.department?.name || 'Operations' }}</p>
              </div>
              <span [ngClass]="{
                'bg-emerald-950 text-emerald-400 border-emerald-800': emp.status === 'ACTIVE',
                'bg-amber-950 text-amber-400 border-amber-800': emp.status === 'PROBATION'
              }" class="text-[10px] px-2 py-0.5 rounded-full border font-semibold">
                {{ emp.status }}
              </span>
            </div>

            <div class="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
              <span>Posting: <strong class="text-slate-300">{{ emp.branch?.name || 'Dhaka HQ' }}</strong></span>
              <button (click)="viewEmployee360(emp)" class="text-emerald-400 hover:underline font-medium text-[11px]">
                360 Profile &rarr;
              </button>
            </div>
          </div>
        </div>

        <app-data-table 
          [columns]="employeeColumns" 
          [data]="employeesTableData"
          (refresh)="fetchEmployees()">
        </app-data-table>
      </div>

      <!-- ================================================================= -->
      <!-- TAB 2: MULTI-TIER TRANSFER MANAGEMENT -->
      <!-- ================================================================= -->
      <div *ngIf="activeTab === 'transfers'" class="space-y-5">
        <div class="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div class="flex items-center justify-between mb-3">
            <div>
              <h3 class="text-sm font-semibold text-slate-200">Active Transfer Proposal & Approval Flow</h3>
              <p class="text-xs text-slate-400">Path: Maker &rarr; Regional Manager &rarr; Zonal Manager &rarr; HR Head &rarr; Director</p>
            </div>
            <button (click)="previewTransferLetter()" class="px-3 py-1.5 text-xs bg-emerald-600/20 border border-emerald-500/40 text-emerald-300 rounded-lg hover:bg-emerald-600/30">
              Official Transfer Letter (বাংলা)
            </button>
          </div>
          <app-approval-stepper [steps]="transferSteps"></app-approval-stepper>
        </div>

        <app-data-table 
          [columns]="transferColumns" 
          [data]="transfersTableData">
        </app-data-table>
      </div>

      <!-- ================================================================= -->
      <!-- TAB 3: LEAVE ENTITLEMENT & APPLICATIONS -->
      <!-- ================================================================= -->
      <div *ngIf="activeTab === 'leaves'" class="space-y-5">
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div *ngFor="let b of leaveBalances" class="bg-slate-900 border border-slate-800 rounded-xl p-3.5 shadow-sm">
            <span class="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{{ b.type }}</span>
            <div class="flex items-baseline justify-between mt-2">
              <span class="text-xl font-bold text-slate-100">{{ b.remaining }} <span class="text-xs font-normal text-slate-400">days left</span></span>
              <span class="text-xs text-slate-500">of {{ b.total }}</span>
            </div>
            <div class="w-full bg-slate-800 h-1.5 rounded-full mt-2.5 overflow-hidden">
              <div class="bg-emerald-500 h-full rounded-full" [style.width.%]="(b.remaining / b.total) * 100"></div>
            </div>
          </div>
        </div>

        <div class="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
          <div>
            <h4 class="text-sm font-semibold text-slate-200">Apply for Leave</h4>
            <p class="text-xs text-slate-400">Casual, Sick, Earned, or Leave Without Pay (LWP)</p>
          </div>
          <button (click)="openLeaveModal()" class="px-3.5 py-1.5 text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg shadow-sm">
            New Leave Application
          </button>
        </div>

        <app-data-table 
          [columns]="leaveColumns" 
          [data]="leaveApplicationsTableData">
        </app-data-table>
      </div>

      <!-- ================================================================= -->
      <!-- TAB 4: SUCCESSION, PROMOTIONS & INCREMENTS -->
      <!-- ================================================================= -->
      <div *ngIf="activeTab === 'succession'" class="space-y-5">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Promotion Checklist Card -->
          <div class="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
            <h4 class="text-sm font-bold text-slate-200">Promotion Policy & Mandatory Checklist</h4>
            <div class="space-y-2 text-xs">
              <label class="flex items-center gap-2 text-slate-300">
                <input type="checkbox" checked disabled class="rounded border-slate-700 text-emerald-600" />
                <span>Minimum 3 Years Continuous Service in Current Grade</span>
              </label>
              <label class="flex items-center gap-2 text-slate-300">
                <input type="checkbox" checked disabled class="rounded border-slate-700 text-emerald-600" />
                <span>Annual Performance Appraisal Rating >= 80% (3 Consecutive Years)</span>
              </label>
              <label class="flex items-center gap-2 text-slate-300">
                <input type="checkbox" checked disabled class="rounded border-slate-700 text-emerald-600" />
                <span>No Active Disciplinary Anomaly or Pending Inquiries</span>
              </label>
              <label class="flex items-center gap-2 text-slate-300">
                <input type="checkbox" checked disabled class="rounded border-slate-700 text-emerald-600" />
                <span>Mandatory Rural to Urban or Field to HQ Posting Rotation Met</span>
              </label>
            </div>
            <button class="w-full mt-2 py-2 text-xs bg-slate-800 hover:bg-slate-700 border border-slate-700 text-emerald-400 font-semibold rounded-lg">
              Launch Promotion Board Verification
            </button>
          </div>

          <!-- Increment Engine Card -->
          <div class="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
            <h4 class="text-sm font-bold text-slate-200">Annual & Special Increment Engine</h4>
            <p class="text-xs text-slate-400">
              Automatic fixation on annual scale steps based on employee grade rules.
            </p>
            <div class="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs space-y-1">
              <div class="flex justify-between">
                <span class="text-slate-400">Grade 5 Scale Step:</span>
                <span class="text-slate-200 font-mono">৳ 3,200 per step</span>
              </div>
              <div class="flex justify-between">
                <span class="text-slate-400">Effective Date:</span>
                <span class="text-emerald-400 font-mono">01 July (Annual)</span>
              </div>
            </div>
            <button class="w-full mt-2 py-2 text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg shadow-sm">
              Process Batch Annual Increments
            </button>
          </div>
        </div>

        <app-data-table 
          [columns]="promotionColumns" 
          [data]="promotionsTableData">
        </app-data-table>
      </div>

      <!-- ================================================================= -->
      <!-- TAB 5: WORK TIMINGS & ATTENDANCE -->
      <!-- ================================================================= -->
      <div *ngIf="activeTab === 'attendance'" class="space-y-4">
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div class="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <p class="text-xs text-slate-400">Standard Work Timings</p>
            <p class="text-lg font-bold text-slate-100 mt-1">09:00 AM - 05:00 PM</p>
            <p class="text-[10px] text-emerald-400 mt-0.5">Grace Period: 15 Minutes</p>
          </div>
          <div class="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <p class="text-xs text-slate-400">Today's Present Rate</p>
            <p class="text-lg font-bold text-emerald-400 mt-1">98.4%</p>
            <p class="text-[10px] text-slate-400 mt-0.5">1,228 Present / 20 On Leave</p>
          </div>
          <div class="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <p class="text-xs text-slate-400">Late Attendance Anomalies</p>
            <p class="text-lg font-bold text-amber-400 mt-1">6</p>
            <p class="text-[10px] text-slate-400 mt-0.5">Pending Regularization</p>
          </div>
        </div>

        <app-data-table 
          [columns]="attendanceColumns" 
          [data]="attendanceTableData">
        </app-data-table>
      </div>

      <!-- ================================================================= -->
      <!-- MODAL: BILINGUAL TRANSFER LETTER PREVIEW -->
      <!-- ================================================================= -->
      <div *ngIf="showLetterModal" class="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div class="bg-white text-slate-900 rounded-xl max-w-2xl w-full p-8 shadow-2xl space-y-4 font-serif">
          <div class="text-center border-b pb-4">
            <h2 class="text-xl font-bold tracking-wide">উদ্দিপন (UDDIPAN)</h2>
            <p class="text-xs text-gray-600">মানবসম্পদ ও প্রশাসন বিভাগ | প্রধান কার্যালয়, ঢাকা</p>
            <p class="text-[11px] text-gray-500 mt-1">স্মারক নং: UDDIPAN/HR/TR-2026-00041 | তারিখ: ২৬ অক্টোবর ২০২৬</p>
          </div>

          <div class="text-sm leading-relaxed space-y-3">
            <p class="font-bold">বিষয়: বদলি আদেশ পত্র (Office Order for Employee Transfer)</p>
            <p>
              জনাব <strong>মো: জাহিদুল ইসলাম</strong> (কর্মকর্তা আইডি: <strong>EMP-10492</strong>),<br>
              পদবী: সিনিয়র অফিসার (ক্ষুদ্রঋণ কার্যক্রম),<br>
              বর্তমান কর্মস্থল: কেরানীগঞ্জ শাখা (ঢাকা অঞ্চল)।
            </p>
            <p>
              এতদ্বারা কর্তৃপক্ষের অনুমোদনক্রমে আপনাকে জানানো যাচ্ছে যে, দাপ্তরিক ও প্রাতিষ্ঠানিক কাজের সুবিধার্থে আপনাকে বর্তমান কর্মস্থল <strong>কেরানীগঞ্জ শাখা (গ্রামীণ)</strong> হতে বদলি করে <strong>ধানমন্ডি শাখা (শহরাঞ্চল)</strong> এ সিনিয়র অফিসার পদে পদায়ন করা হলো।
            </p>
            <p>
              উক্ত বদলি আদেশ আগামী <strong>০১ নভেম্বর ২০২৬</strong> তারিখ হতে কার্যকর হবে। আপনাকে নির্দেশ প্রদান করা যাচ্ছে যে, নির্ধারিত সময়ের মধ্যে বর্তমান দায়িত্বভার হস্তান্তর পূর্বক নতুন কর্মস্থলে যোগদান করবেন।
            </p>
          </div>

          <div class="pt-6 border-t flex items-end justify-between text-xs">
            <div>
              <p>অনুলিপি সদয় অবগতির জন্য:</p>
              <p class="text-gray-500">১. জোনাল ম্যানেজার, ঢাকা জোন</p>
              <p class="text-gray-500">২. রিজিওনাল ম্যানেজার, ঢাকা উত্তর</p>
              <p class="text-gray-500">৩. ব্যক্তিগত নথি</p>
            </div>
            <div class="text-right">
              <p class="font-bold">পরিচালক (প্রশাসন ও মানবসম্পদ)</p>
              <p class="text-gray-600">উদ্দিপন প্রধান কার্যালয়, ঢাকা</p>
            </div>
          </div>

          <div class="pt-4 flex justify-end gap-2 font-sans">
            <button (click)="showLetterModal = false" class="px-4 py-2 text-xs font-semibold bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg">
              Close Preview
            </button>
            <button (click)="printLetter()" class="px-4 py-2 text-xs font-semibold bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg">
              Print / Save PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class AdminSuccessionComponent implements OnInit {
  activeTab: string = 'employees';
  showLetterModal: boolean = false;

  tabs = [
    { id: 'employees', label: 'Employee 360 & Profiles' },
    { id: 'transfers', label: 'Transfer Management (Workflows)' },
    { id: 'leaves', label: 'Leave Entitlements & Approvals' },
    { id: 'succession', label: 'Succession, Promotions & Increments' },
    { id: 'attendance', label: 'Work Timings & Attendance' }
  ];

  // Transfer Stepper Demo
  transferSteps: WorkflowStepView[] = [
    { stepOrder: 1, stepName: 'RM Recommendation', approverRole: 'Regional Manager', status: 'APPROVED', actorName: 'Shahidul Islam', remarks: 'Recommended for urban branch' },
    { stepOrder: 2, stepName: 'Zonal Approval', approverRole: 'Zonal Manager', status: 'APPROVED', actorName: 'Abdul Karim', remarks: 'Approved' },
    { stepOrder: 3, stepName: 'HR Administration', approverRole: 'HR Head', status: 'PENDING', remarks: 'Under service record checklist verification' },
    { stepOrder: 4, stepName: 'Director Final Approval', approverRole: 'Director', status: 'WAITING' }
  ];

  leaveBalances = [
    { type: 'Casual Leave', remaining: 10, total: 14 },
    { type: 'Sick Leave', remaining: 12, total: 14 },
    { type: 'Earned Leave', remaining: 18, total: 20 },
    { type: 'Maternity/Paternity', remaining: 120, total: 120 },
    { type: 'Leave Without Pay', remaining: 0, total: 0 }
  ];

  employees: any[] = [
    { id: '1', employeeId: 'EMP-00001', firstName: 'System', lastName: 'Administrator', designation: { title: 'Director (Human Resources)' }, department: { name: 'HR & Administration' }, branch: { name: 'Dhaka Head Office' }, status: 'ACTIVE' },
    { id: '2', employeeId: 'EMP-10492', firstName: 'Md. Zahidul', lastName: 'Islam', designation: { title: 'Senior Officer' }, department: { name: 'Microfinance Operations' }, branch: { name: 'Keraniganj Branch (Rural)' }, status: 'ACTIVE' },
    { id: '3', employeeId: 'EMP-10512', firstName: 'Nusrat', lastName: 'Jahan', designation: { title: 'HR Officer' }, department: { name: 'HR & Administration' }, branch: { name: 'Dhanmondi Branch (Urban)' }, status: 'PROBATION' }
  ];

  employeeColumns: ColumnDef[] = [
    { key: 'employeeId', header: 'Staff ID', sortable: true },
    { key: 'name', header: 'Full Name', sortable: true },
    { key: 'designation', header: 'Designation', sortable: true },
    { key: 'department', header: 'Department', sortable: true },
    { key: 'branch', header: 'Branch / Posting', sortable: true },
    { key: 'status', header: 'Status', sortable: true }
  ];

  employeesTableData: any[] = [
    { employeeId: 'EMP-00001', name: 'System Administrator', designation: 'Director (Human Resources)', department: 'HR & Administration', branch: 'Dhaka Head Office', status: 'ACTIVE' },
    { employeeId: 'EMP-10492', name: 'Md. Zahidul Islam', designation: 'Senior Officer', department: 'Microfinance Operations', branch: 'Keraniganj Branch (Rural)', status: 'ACTIVE' },
    { employeeId: 'EMP-10512', name: 'Nusrat Jahan', designation: 'HR Officer', department: 'HR & Administration', branch: 'Dhanmondi Branch (Urban)', status: 'PROBATION' },
  ];

  transferColumns: ColumnDef[] = [
    { key: 'proposalNo', header: 'Proposal #', sortable: true },
    { key: 'employee', header: 'Employee', sortable: true },
    { key: 'fromBranch', header: 'Current Posting', sortable: true },
    { key: 'toBranch', header: 'Proposed Posting', sortable: true },
    { key: 'transitionType', header: 'Transition Scope', sortable: true },
    { key: 'status', header: 'Workflow Status', sortable: true }
  ];

  transfersTableData: any[] = [
    { proposalNo: 'TR-2026-00041', employee: 'Md. Zahidul Islam (EMP-10492)', fromBranch: 'Keraniganj Branch (Rural)', toBranch: 'Dhanmondi Branch (Urban)', transitionType: 'RURAL_TO_URBAN', status: 'IN_REVIEW' },
    { proposalNo: 'TR-2026-00040', employee: 'Abdur Rahim (EMP-10221)', fromBranch: 'Chittagong Central', toBranch: 'Dhaka Head Office', transitionType: 'FIELD_TO_HQ', status: 'APPROVED' },
  ];

  leaveColumns: ColumnDef[] = [
    { key: 'applicationNo', header: 'Application #', sortable: true },
    { key: 'employee', header: 'Staff Name', sortable: true },
    { key: 'leaveType', header: 'Leave Category', sortable: true },
    { key: 'duration', header: 'Period', sortable: true },
    { key: 'days', header: 'Days', sortable: true },
    { key: 'status', header: 'Approval Status', sortable: true }
  ];

  leaveApplicationsTableData: any[] = [
    { applicationNo: 'LV-2026-00012', employee: 'Nusrat Jahan (EMP-10512)', leaveType: 'Casual Leave', duration: '28 Oct 2026 - 30 Oct 2026', days: '3 Days', status: 'APPROVED' },
    { applicationNo: 'LV-2026-00013', employee: 'Md. Zahidul Islam (EMP-10492)', leaveType: 'Earned Leave', duration: '05 Nov 2026 - 10 Nov 2026', days: '5 Days', status: 'PENDING' }
  ];

  promotionColumns: ColumnDef[] = [
    { key: 'employee', header: 'Employee', sortable: true },
    { key: 'fromDesignation', header: 'From Designation', sortable: true },
    { key: 'toDesignation', header: 'To Designation', sortable: true },
    { key: 'transition', header: 'Posting Type', sortable: true },
    { key: 'effectiveDate', header: 'Effective Date', sortable: true },
    { key: 'status', header: 'Status', sortable: true }
  ];

  promotionsTableData: any[] = [
    { employee: 'Md. Zahidul Islam (EMP-10492)', fromDesignation: 'Officer (Grade 8)', toDesignation: 'Senior Officer (Grade 7)', transition: 'FIELD_TO_HQ', effectiveDate: '01 Nov 2026', status: 'APPROVED' }
  ];

  attendanceColumns: ColumnDef[] = [
    { key: 'date', header: 'Date', sortable: true },
    { key: 'employee', header: 'Staff Name', sortable: true },
    { key: 'inTime', header: 'In Time', sortable: true },
    { key: 'outTime', header: 'Out Time', sortable: true },
    { key: 'status', header: 'Status', sortable: true },
    { key: 'anomaly', header: 'Anomaly Reason', sortable: true }
  ];

  attendanceTableData: any[] = [
    { date: '2026-10-26', employee: 'System Administrator', inTime: '08:52 AM', outTime: '05:10 PM', status: 'PRESENT', anomaly: 'None' },
    { date: '2026-10-26', employee: 'Md. Zahidul Islam', inTime: '09:18 AM', outTime: '05:02 PM', status: 'LATE', anomaly: 'Traffic congestion on bridge' },
    { date: '2026-10-26', employee: 'Nusrat Jahan', inTime: '08:58 AM', outTime: '05:05 PM', status: 'PRESENT', anomaly: 'None' }
  ];

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.fetchEmployees();
  }

  fetchEmployees() {
    this.http.get<any>('http://localhost:3000/api/v1/employees').subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.employees = res.data;
        }
      },
      error: () => {}
    });
  }

  viewEmployee360(emp: any) {
    alert(`Employee 360 Record:\n\nStaff ID: ${emp.employeeId}\nName: ${emp.firstName} ${emp.lastName}\nDesignation: ${emp.designation?.title || 'Officer'}\nPosting: ${emp.branch?.name || 'Dhaka HQ'}`);
  }

  openOnboardModal() {
    alert('Employee Onboarding Form Wizard ready. Enter personal, educational, posting, and salary fixation details.');
  }

  openTransferModal() {
    alert('Transfer Proposal Generator ready. Select Source Branch, Destination Branch, Scope (Rural to Urban / Field to HQ), and attach handover checklist.');
  }

  openLeaveModal() {
    alert('Leave Application Form ready. Select Leave Type, Start Date, End Date, and submit to Reporting Manager.');
  }

  previewTransferLetter() {
    this.showLetterModal = true;
  }

  printLetter() {
    window.print();
  }
}
