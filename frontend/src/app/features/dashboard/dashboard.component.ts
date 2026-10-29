import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApprovalStepperComponent, WorkflowStepView } from '@shared/components/approval-stepper/approval-stepper.component';
import { DataTableComponent, ColumnDef } from '@shared/components/data-table/data-table.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, ApprovalStepperComponent, DataTableComponent],
  template: `
    <div class="space-y-6">
      <!-- Welcome Header -->
      <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 class="text-xl font-bold text-slate-100">Enterprise HR Operations Dashboard</h2>
          <p class="text-xs text-slate-400 mt-0.5">Real-time overview of workforce metrics, pending approvals, and workflows.</p>
        </div>
        <div class="flex items-center gap-2">
          <span class="px-3 py-1 rounded-lg text-xs bg-emerald-950 border border-emerald-800 text-emerald-400 font-semibold">
            System Status: Operational
          </span>
        </div>
      </div>

      <!-- KPI Stat Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
          <p class="text-xs font-medium text-slate-400">Total Active Employees</p>
          <p class="text-2xl font-bold text-slate-100 mt-2">1,248</p>
          <p class="text-[10px] text-emerald-400 mt-1">Across 4 Zones & 68 Branches</p>
        </div>

        <div class="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
          <p class="text-xs font-medium text-slate-400">Pending Approvals</p>
          <p class="text-2xl font-bold text-amber-400 mt-2">14</p>
          <p class="text-[10px] text-slate-400 mt-1">Transfer, Leave & Loans</p>
        </div>

        <div class="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
          <p class="text-xs font-medium text-slate-400">Staff Welfare Fund (SWF)</p>
          <p class="text-2xl font-bold text-slate-100 mt-2">৳ 12,45,000</p>
          <p class="text-[10px] text-emerald-400 mt-1">Total Available Balance</p>
        </div>

        <div class="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
          <p class="text-xs font-medium text-slate-400">Payroll Engine (Current Month)</p>
          <p class="text-2xl font-bold text-emerald-400 mt-2">Ready</p>
          <p class="text-[10px] text-slate-400 mt-1">Zero Pending Anomalies</p>
        </div>
      </div>

      <!-- Live Approval Pipeline Showcase -->
      <div class="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div class="flex items-center justify-between mb-2">
          <div>
            <h3 class="text-sm font-semibold text-slate-200">Active Workflow Demonstration: Transfer Proposal</h3>
            <p class="text-xs text-slate-400">Target: EMP-10492 (Field to HQ Transfer Proposal)</p>
          </div>
          <span class="text-xs px-2.5 py-1 rounded bg-amber-950 text-amber-400 border border-amber-800 font-mono">
            Step 3 of 4 Active
          </span>
        </div>
        <app-approval-stepper [steps]="sampleSteps"></app-approval-stepper>
      </div>

      <!-- Quick Master Data Hierarchy Table -->
      <div class="space-y-3">
        <div class="flex items-center justify-between">
          <h3 class="text-sm font-semibold text-slate-200">Zonal & Regional Operational Units</h3>
        </div>
        <app-data-table 
          [columns]="hierarchyColumns" 
          [data]="hierarchyData"
          (refresh)="onRefreshData()"
          (exportCsv)="onExportCsv()">
        </app-data-table>
      </div>
    </div>
  `
})
export class DashboardComponent implements OnInit {
  sampleSteps: WorkflowStepView[] = [
    {
      stepOrder: 1,
      stepName: 'RM Recommendation',
      approverRole: 'Regional Manager',
      status: 'APPROVED',
      actorName: 'Md. Shahidul Islam',
      remarks: 'Recommended for Head Office posting',
      timestamp: '2026-10-25 09:30'
    },
    {
      stepOrder: 2,
      stepName: 'Zonal Approval',
      approverRole: 'Zonal Manager',
      status: 'APPROVED',
      actorName: 'Abdul Karim',
      remarks: 'Endorsed for vacancy',
      timestamp: '2026-10-25 14:15'
    },
    {
      stepOrder: 3,
      stepName: 'HR Administration Review',
      approverRole: 'HR Head',
      status: 'PENDING',
      remarks: 'Under verification of service record'
    },
    {
      stepOrder: 4,
      stepName: 'Executive Director Approval',
      approverRole: 'Director',
      status: 'WAITING'
    }
  ];

  hierarchyColumns: ColumnDef[] = [
    { key: 'code', header: 'Unit Code', sortable: true },
    { key: 'name', header: 'Unit Name', sortable: true },
    { key: 'type', header: 'Classification', sortable: true },
    { key: 'zone', header: 'Supervising Zone', sortable: true },
    { key: 'status', header: 'Status', sortable: true },
  ];

  hierarchyData: any[] = [
    { code: 'ZONE-DHK', name: 'Dhaka Zone', type: 'ZONAL OFFICE', zone: 'Head Office', status: 'ACTIVE' },
    { code: 'ZONE-CTG', name: 'Chittagong Zone', type: 'ZONAL OFFICE', zone: 'Head Office', status: 'ACTIVE' },
    { code: 'REG-DHK-N', name: 'Dhaka North Region', type: 'REGIONAL OFFICE', zone: 'Dhaka Zone', status: 'ACTIVE' },
    { code: 'BR-DHM', name: 'Dhanmondi Branch', type: 'URBAN BRANCH', zone: 'Dhaka Zone', status: 'ACTIVE' },
    { code: 'BR-KRN', name: 'Keraniganj Branch', type: 'RURAL BRANCH', zone: 'Dhaka Zone', status: 'ACTIVE' },
  ];

  ngOnInit(): void {}

  onRefreshData() {
    console.log('Refreshing dashboard data...');
  }

  onExportCsv() {
    console.log('Exporting CSV...');
  }
}
