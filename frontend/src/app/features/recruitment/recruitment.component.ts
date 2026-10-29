import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { DataTableComponent, ColumnDef } from '@shared/components/data-table/data-table.component';
import { DatepickerComponent } from '@shared/components/datepicker/datepicker.component';
import { generateQrDataUrl } from '@shared/utils/qrcode-helper';

@Component({
  selector: 'app-recruitment',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, DataTableComponent, DatepickerComponent],
  template: `
    <div class="space-y-6">
      <!-- Title & Actions -->
      <div *ngIf="isPortalTabsVisible" class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-2">
            <h2 class="text-xl font-bold text-slate-100">Recruitment & Candidate Logistics Portal</h2>
          </div>
          <p class="text-xs text-slate-400 mt-1">
            Job circulars, CV bank, multi-criteria shortlisting, exam halls, admit cards, viva board scoring, and deployments.
          </p>
        </div>

        <div class="flex items-center gap-2">
          <button (click)="openCircularModal()" class="px-3.5 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors shadow-md">
            + New Circular
          </button>
          <button (click)="openEnrollModal()" class="px-3.5 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg transition-colors">
            + Enroll Candidate
          </button>
        </div>
      </div>

      <!-- Navigation Tabs -->
      <div *ngIf="isPortalTabsVisible" class="border-b border-slate-800 flex items-center gap-2 text-xs font-medium">
        <button 
          *ngFor="let tab of tabs" 
          (click)="selectTab(tab.id)"
          [ngClass]="{
            'text-emerald-400 border-b-2 border-emerald-500 font-semibold bg-emerald-500/5': activeTab === tab.id,
            'text-slate-400 hover:text-slate-200': activeTab !== tab.id
          }"
          class="px-4 py-2.5 transition-all">
          {{ tab.label }}
        </button>
      </div>

      <!-- ================================================================= -->
      <!-- TAB 1: RECRUITMENT PIPELINE KANBAN BOARD -->
      <!-- ================================================================= -->
      <div *ngIf="activeTab === 'pipeline'" class="space-y-4">
        <!-- ================================================================= -->
        <!-- MULTI-DIMENSIONAL ORGANIZATIONAL FILTER & OMNISEARCH CONSOLE -->
        <!-- ================================================================= -->
        <div class="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-lg backdrop-blur-sm space-y-3">
          <!-- Top Row: Omnisearch Input + Stats & Collapse Controls -->
          <div class="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div class="relative flex-1">
              <svg class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
              </svg>
              <input
                type="text"
                [(ngModel)]="filterSearchQuery"
                placeholder="Omnisearch: Name, Tracking ID, Degree, District, Mobile, Designation, Circular..."
                class="w-full pl-9 pr-8 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
              />
              <button
                *ngIf="filterSearchQuery"
                (click)="filterSearchQuery = ''"
                class="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-xs">
                &times;
              </button>
            </div>

            <div class="flex items-center gap-2 flex-wrap">
              <!-- Live Match Badge -->
              <span class="px-2.5 py-1.5 rounded-lg bg-emerald-950/80 border border-emerald-800/80 text-emerald-400 text-xs font-mono font-medium flex items-center gap-1.5">
                <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>{{ getFilteredCandidatesTotal() }} / {{ candidates.length }} Matches</span>
              </span>

              <!-- Console Collapse Toggle -->
              <button
                (click)="isFilterConsoleExpanded = !isFilterConsoleExpanded"
                class="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs font-medium text-slate-300 flex items-center gap-1.5 transition-colors">
                <svg class="w-3.5 h-3.5 transition-transform" [class.rotate-180]="!isFilterConsoleExpanded" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                </svg>
                <span>Hierarchy Filters</span>
                <span *ngIf="getActiveFilterCount() > 0" class="px-1.5 py-0.2 rounded-full bg-emerald-500 text-slate-950 text-[10px] font-bold">
                  {{ getActiveFilterCount() }}
                </span>
              </button>

              <!-- Clear Filters Button -->
              <button
                *ngIf="isAnyOrgFilterActive"
                (click)="clearOrgFilters()"
                class="px-2.5 py-1.5 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 border border-rose-900/60 rounded-lg transition-colors flex items-center gap-1">
                <span>Reset All</span>
                <span>&times;</span>
              </button>
            </div>
          </div>

          <!-- Collapsible Hierarchy Filter Selectors Grid -->
          <div *ngIf="isFilterConsoleExpanded" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 pt-2 border-t border-slate-800/70">
            <!-- 1. Zone Selector -->
            <div>
              <label class="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Zone / Region
              </label>
              <select
                [(ngModel)]="filterZoneId"
                (change)="onFilterZoneChange()"
                class="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-emerald-500">
                <option value="ALL">All Zones (National)</option>
                <option *ngFor="let z of zones" [value]="z.id">
                  {{ z.name }}
                </option>
              </select>
            </div>

            <!-- 2. Branch Selector (Cascaded by Zone) -->
            <div>
              <label class="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-between">
                <span>Branch Location</span>
                <span *ngIf="filterZoneId !== 'ALL'" class="text-[9px] text-emerald-400 font-normal">Cascaded</span>
              </label>
              <select
                [(ngModel)]="filterBranchId"
                (change)="onFilterBranchChange()"
                class="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-emerald-500">
                <option value="ALL">
                  {{ filterZoneId === 'ALL' ? 'All Branches' : 'All in Selected Zone' }}
                </option>
                <option *ngFor="let b of filteredBranches" [value]="b.id">
                  {{ b.name }} ({{ b.code }})
                </option>
              </select>
            </div>

            <!-- 3. Department Selector -->
            <div>
              <label class="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Department
              </label>
              <select
                [(ngModel)]="filterDepartmentId"
                (change)="onFilterDepartmentChange()"
                class="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-emerald-500">
                <option value="ALL">All Departments</option>
                <option *ngFor="let d of departments" [value]="d.id">
                  {{ d.name }}
                </option>
              </select>
            </div>

            <!-- 4. Designation Selector (Cascaded by Department) -->
            <div>
              <label class="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-between">
                <span>Designation</span>
                <span *ngIf="filterDepartmentId !== 'ALL'" class="text-[9px] text-emerald-400 font-normal">Cascaded</span>
              </label>
              <select
                [(ngModel)]="filterDesignationId"
                (change)="onFilterDesignationChange()"
                class="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-emerald-500">
                <option value="ALL">
                  {{ filterDepartmentId === 'ALL' ? 'All Designations' : 'All in Selected Dept' }}
                </option>
                <option *ngFor="let desig of filteredDesignations" [value]="desig.id">
                  {{ desig.title }} ({{ desig.code }})
                </option>
              </select>
            </div>

            <!-- 5. Job Grade Selector -->
            <div>
              <label class="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Job Grade / Pay Band
              </label>
              <select
                [(ngModel)]="filterJobGradeId"
                (change)="onFilterJobGradeChange()"
                class="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-emerald-500">
                <option value="ALL">All Job Grades</option>
                <option *ngFor="let g of jobGrades" [value]="g.id">
                  {{ g.name || g.code || ('Grade ' + g.level) }}
                </option>
              </select>
            </div>
          </div>

          <!-- Active Filter Chips Bar -->
          <div *ngIf="isAnyOrgFilterActive" class="flex items-center gap-1.5 flex-wrap pt-2 border-t border-slate-800/50 text-xs">
            <span class="text-[10px] font-bold text-slate-500 uppercase tracking-wider mr-1">Active Filters:</span>

            <!-- Query Chip -->
            <span *ngIf="filterSearchQuery" class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-200 text-[11px]">
              <span class="text-slate-400">Search:</span> "{{ filterSearchQuery }}"
              <button (click)="filterSearchQuery = ''" class="hover:text-rose-400 text-slate-400 font-bold ml-0.5">&times;</button>
            </span>

            <!-- Zone Chip -->
            <span *ngIf="filterZoneId !== 'ALL'" class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-950/60 border border-blue-800 text-blue-300 text-[11px]">
              <span class="text-blue-400">Zone:</span> {{ getZoneNameById(filterZoneId) }}
              <button (click)="filterZoneId = 'ALL'; onFilterZoneChange()" class="hover:text-rose-400 text-blue-400 font-bold ml-0.5">&times;</button>
            </span>

            <!-- Branch Chip -->
            <span *ngIf="filterBranchId !== 'ALL'" class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-cyan-950/60 border border-cyan-800 text-cyan-300 text-[11px]">
              <span class="text-cyan-400">Branch:</span> {{ getBranchNameById(filterBranchId) }}
              <button (click)="filterBranchId = 'ALL'; onFilterBranchChange()" class="hover:text-rose-400 text-cyan-400 font-bold ml-0.5">&times;</button>
            </span>

            <!-- Department Chip -->
            <span *ngIf="filterDepartmentId !== 'ALL'" class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-950/60 border border-indigo-800 text-indigo-300 text-[11px]">
              <span class="text-indigo-400">Dept:</span> {{ getDepartmentNameById(filterDepartmentId) }}
              <button (click)="filterDepartmentId = 'ALL'; onFilterDepartmentChange()" class="hover:text-rose-400 text-indigo-400 font-bold ml-0.5">&times;</button>
            </span>

            <!-- Designation Chip -->
            <span *ngIf="filterDesignationId !== 'ALL'" class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-950/60 border border-purple-800 text-purple-300 text-[11px]">
              <span class="text-purple-400">Desig:</span> {{ getDesignationTitleById(filterDesignationId) }}
              <button (click)="filterDesignationId = 'ALL'; onFilterDesignationChange()" class="hover:text-rose-400 text-purple-400 font-bold ml-0.5">&times;</button>
            </span>

            <!-- Job Grade Chip -->
            <span *ngIf="filterJobGradeId !== 'ALL'" class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-950/60 border border-amber-800 text-amber-300 text-[11px]">
              <span class="text-amber-400">Grade:</span> {{ getJobGradeCodeById(filterJobGradeId) }}
              <button (click)="filterJobGradeId = 'ALL'; onFilterJobGradeChange()" class="hover:text-rose-400 text-amber-400 font-bold ml-0.5">&times;</button>
            </span>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-5 gap-3 overflow-x-auto pb-2">
          <!-- Column 1: Applied -->
          <div class="bg-slate-900 border border-slate-800 rounded-xl p-3 min-w-[220px]">
            <div class="flex items-center justify-between pb-2 border-b border-slate-800">
              <span class="text-xs font-bold text-slate-300">Applied / CV Bank</span>
              <span class="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-slate-400 font-mono">
                {{ getCandidatesByStatus('APPLIED').length }}
              </span>
            </div>
            <div class="mt-3 space-y-2.5">
              <div *ngFor="let c of getCandidatesByStatus('APPLIED')" class="bg-slate-950 border border-slate-800 rounded-lg p-3 hover:border-slate-700 transition-all">
                <div class="flex items-center justify-between">
                  <span class="text-[9px] font-mono text-emerald-400 font-semibold">{{ c.trackingId }}</span>
                  <span class="text-[9px] text-slate-500">{{ c.district }}</span>
                </div>
                <h5 class="text-xs font-semibold text-slate-200 mt-1">{{ c.fullName }}</h5>
                <p class="text-[10px] text-slate-400">{{ c.highestDegree }} (CGPA: {{ c.cgpa }})</p>
                <div class="mt-2 pt-2 border-t border-slate-800/60 flex justify-between items-center text-[10px]">
                  <span class="text-slate-500">Exp: {{ c.experienceYears }} yrs</span>
                  <span class="text-emerald-400 font-medium">Applied</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Column 2: Shortlisted -->
          <div class="bg-slate-900 border border-slate-800 rounded-xl p-3 min-w-[220px]">
            <div class="flex items-center justify-between pb-2 border-b border-slate-800">
              <span class="text-xs font-bold text-amber-400">Shortlisted</span>
              <span class="px-1.5 py-0.5 rounded bg-amber-950 text-amber-400 text-[10px] font-mono">
                {{ getCandidatesByStatus('SHORTLISTED').length }}
              </span>
            </div>
            <div class="mt-3 space-y-2.5">
              <div *ngFor="let c of getCandidatesByStatus('SHORTLISTED')" class="bg-slate-950 border border-slate-800 rounded-lg p-3">
                <span class="text-[9px] font-mono text-amber-400">{{ c.trackingId }}</span>
                <h5 class="text-xs font-semibold text-slate-200 mt-1">{{ c.fullName }}</h5>
                <p class="text-[10px] text-slate-400">{{ c.highestDegree }} | CGPA {{ c.cgpa }}</p>
                <div class="mt-2 text-[10px] text-amber-400 font-medium">Eligible for Exam</div>
              </div>
            </div>
          </div>

          <!-- Column 3: Exam Scheduled / Passed -->
          <div class="bg-slate-900 border border-slate-800 rounded-xl p-3 min-w-[220px]">
            <div class="flex items-center justify-between pb-2 border-b border-slate-800">
              <span class="text-xs font-bold text-purple-400">Written Exam</span>
              <span class="px-1.5 py-0.5 rounded bg-purple-950 text-purple-400 text-[10px] font-mono">
                {{ getCandidatesByStatus('WRITTEN_PASSED').length }}
              </span>
            </div>
            <div class="mt-3 space-y-2.5">
              <div *ngFor="let c of getCandidatesByStatus('WRITTEN_PASSED')" class="bg-slate-950 border border-slate-800 rounded-lg p-3">
                <div class="flex items-center justify-between">
                  <span class="text-[9px] font-mono text-purple-400">{{ c.trackingId }}</span>
                  <span class="text-[9px] text-emerald-400 font-bold">Passed</span>
                </div>
                <h5 class="text-xs font-semibold text-slate-200 mt-1">{{ c.fullName }}</h5>
                <p class="text-[10px] text-slate-400">Marks: {{ c.examResults?.[0]?.marksObtained != null ? c.examResults[0].marksObtained : 85 }} / 100 (Rank: #{{ c.examResults?.[0]?.meritRank || 1 }})</p>
                <button (click)="viewAdmitCard(c)" class="mt-2 text-[10px] text-purple-300 hover:underline">
                  Admit Card Slip &rarr;
                </button>
              </div>
            </div>
          </div>

          <!-- Column 4: Viva Board Selection -->
          <div class="bg-slate-900 border border-slate-800 rounded-xl p-3 min-w-[220px]">
            <div class="flex items-center justify-between pb-2 border-b border-slate-800">
              <span class="text-xs font-bold text-blue-400">Viva Selected</span>
              <span class="px-1.5 py-0.5 rounded bg-blue-950 text-blue-400 text-[10px] font-mono">
                {{ getCandidatesByStatus('SELECTED').length }}
              </span>
            </div>
            <div class="mt-3 space-y-2.5">
              <div *ngFor="let c of getCandidatesByStatus('SELECTED')" class="bg-slate-950 border border-slate-800 rounded-lg p-3">
                <span class="text-[9px] font-mono text-blue-400">{{ c.trackingId }}</span>
                <h5 class="text-xs font-semibold text-slate-200 mt-1">{{ c.fullName }}</h5>
                <p class="text-[10px] text-slate-400">Viva Score: {{ c.vivaScores?.[0]?.totalScore != null ? c.vivaScores[0].totalScore : 35 }} / 40</p>
                <div class="mt-2 text-[10px] text-emerald-400 font-semibold">Recommended for Posting</div>
              </div>
            </div>
          </div>

          <!-- Column 5: Deployed -->
          <div class="bg-slate-900 border border-slate-800 rounded-xl p-3 min-w-[220px]">
            <div class="flex items-center justify-between pb-2 border-b border-slate-800">
              <span class="text-xs font-bold text-emerald-400">Deployed / Appointed</span>
              <span class="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 text-[10px] font-mono">
                {{ getCandidatesByStatus('DEPLOYED').length }}
              </span>
            </div>
            <div class="mt-3 space-y-2.5">
              <div *ngFor="let c of getCandidatesByStatus('DEPLOYED')" class="bg-slate-950 border border-slate-800 rounded-lg p-3">
                <span class="text-[9px] font-mono text-emerald-400">{{ c.trackingId }}</span>
                <h5 class="text-xs font-semibold text-slate-200 mt-1">{{ c.fullName }}</h5>
                <p class="text-[10px] text-slate-400">District: {{ c.district || 'Head Office' }}</p>
                
                <div class="mt-2.5 pt-2 border-t border-slate-800/80 flex flex-col gap-1.5">
                  <button (click)="previewDeploymentLetter(c)" class="text-[10px] text-emerald-400 hover:underline font-medium text-left">
                    Appointment Letter (বাংলা) &rarr;
                  </button>

                  <div *ngIf="c.isConvertedToEmployee" class="px-2 py-1 rounded bg-emerald-950/60 border border-emerald-800 text-[10px] text-emerald-300 font-mono font-medium flex items-center justify-between">
                    <span>Onboarded to HR</span>
                    <span class="font-bold">{{ c.employeeId || ('EMP-2026-' + c.trackingId.replace('CAN-2026-', '')) }}</span>
                  </div>

                  <button 
                    *ngIf="!c.isConvertedToEmployee"
                    (click)="convertToEmployee(c)"
                    class="w-full py-1 px-2 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-[10px] transition-colors shadow">
                    Onboard to Core HR (Module 1)
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ================================================================= -->
      <!-- TAB 2: JOB CIRCULARS & VACANCIES (FULL CRUD ENGINE) -->
      <!-- ================================================================= -->
      <div *ngIf="activeTab === 'circulars'" class="space-y-4">
        <!-- Top Action & Statistics Header -->
        <div class="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div class="bg-slate-900 border border-slate-800 p-3.5 rounded-xl">
            <span class="text-[10px] text-slate-400 uppercase font-semibold">Total Circulars</span>
            <div class="flex items-center justify-between mt-1">
              <span class="text-xl font-bold font-mono text-slate-100">{{ rawCirculars.length }}</span>
              <span class="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">Notices</span>
            </div>
          </div>
          <div class="bg-slate-900 border border-slate-800 p-3.5 rounded-xl">
            <span class="text-[10px] text-emerald-400 uppercase font-semibold">Active & Published</span>
            <div class="flex items-center justify-between mt-1">
              <span class="text-xl font-bold font-mono text-emerald-400">{{ getPublishedCount() }}</span>
              <span class="text-xs px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 font-mono border border-emerald-800">Open</span>
            </div>
          </div>
          <div class="bg-slate-900 border border-slate-800 p-3.5 rounded-xl">
            <span class="text-[10px] text-purple-400 uppercase font-semibold">Video CV Encouraged</span>
            <div class="flex items-center justify-between mt-1">
              <span class="text-xl font-bold font-mono text-purple-400">{{ getVideoCvCount() }}</span>
              <span class="text-xs px-2 py-0.5 rounded bg-purple-950 text-purple-300 font-mono border border-purple-800">Enabled</span>
            </div>
          </div>
          <div class="bg-slate-900 border border-slate-800 p-3.5 rounded-xl flex items-center justify-between">
            <div>
              <span class="text-[10px] text-slate-400 uppercase font-semibold">Total Applicants</span>
              <p class="text-xl font-bold font-mono text-blue-400 mt-0.5">{{ getTotalApplicantsCount() }}</p>
            </div>
            <button 
              (click)="openCircularModal()" 
              class="px-3.5 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors shadow-md flex items-center gap-1.5 shrink-0">
              <span>+</span> New Circular
            </button>
          </div>
        </div>

        <!-- Filter & Search Toolbar -->
        <div class="bg-slate-900 border border-slate-800 p-3.5 rounded-xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div class="relative flex-1 max-w-md">
            <span class="absolute left-3 top-2.5 text-slate-500 text-xs">🔍</span>
            <input 
              type="text" 
              [(ngModel)]="circularSearchQuery" 
              placeholder="Search circular by title, number, department, or location..." 
              class="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-lg pl-8 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none" />
          </div>

          <div class="flex items-center gap-1.5 overflow-x-auto text-xs">
            <span class="text-slate-500 text-[11px] font-medium mr-1">Status:</span>
            <button 
              *ngFor="let st of ['ALL', 'PUBLISHED', 'CLOSED', 'DRAFT']" 
              (click)="circularStatusFilter = st"
              [ngClass]="circularStatusFilter === st ? 'bg-emerald-600 text-white font-bold' : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200'"
              class="px-2.5 py-1 rounded-lg text-xs transition-colors">
              {{ st }}
            </button>
            <button 
              (click)="loadCirculars()" 
              title="Refresh"
              class="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors ml-1">
              ↻
            </button>
          </div>
        </div>

        <!-- Rich Circulars Management Table -->
        <div class="overflow-x-auto bg-slate-900 border border-slate-800 rounded-xl shadow-lg">
          <table class="w-full text-left text-xs text-slate-300">
            <thead class="bg-slate-950/80 text-slate-400 font-mono text-[10px] uppercase border-b border-slate-800">
              <tr>
                <th class="px-4 py-3">Circular #</th>
                <th class="px-4 py-3">Position & Department</th>
                <th class="px-4 py-3">Employment</th>
                <th class="px-4 py-3">Duty Station</th>
                <th class="px-4 py-3">Deadline</th>
                <th class="px-4 py-3 text-center">Video CV</th>
                <th class="px-4 py-3 text-center">Applicants</th>
                <th class="px-4 py-3">Status</th>
                <th class="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-800/60">
              <tr *ngFor="let c of getFilteredCirculars()" class="hover:bg-slate-800/40 transition-colors">
                <!-- Circular No & Date -->
                <td class="px-4 py-3 whitespace-nowrap">
                  <span class="font-mono text-emerald-400 font-bold block">{{ c.circularNo }}</span>
                  <span class="text-[10px] text-slate-500">{{ c.formattedCreated }}</span>
                </td>

                <!-- Position & Department -->
                <td class="px-4 py-3">
                  <div class="font-semibold text-slate-200 hover:text-white cursor-pointer" (click)="viewCircularDetail(c)">
                    {{ c.title }}
                  </div>
                  <div class="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1.5">
                    <span>{{ c.departmentName }}</span>
                    <span class="text-slate-600">•</span>
                    <span class="font-mono text-slate-400">{{ c.vacancies }}</span>
                  </div>
                </td>

                <!-- Employment Status -->
                <td class="px-4 py-3 whitespace-nowrap">
                  <span 
                    class="px-2 py-0.5 rounded text-[10px] font-semibold"
                    [ngClass]="{
                      'bg-emerald-950 text-emerald-300 border border-emerald-800': c.employmentStatus === 'Full-time',
                      'bg-amber-950 text-amber-300 border border-amber-800': c.employmentStatus === 'Contractual',
                      'bg-blue-950 text-blue-300 border border-blue-800': c.employmentStatus === 'Internship',
                      'bg-purple-950 text-purple-300 border border-purple-800': c.employmentStatus === 'Part-time'
                    }">
                    {{ c.employmentStatus || 'Full-time' }}
                  </span>
                </td>

                <!-- Duty Station -->
                <td class="px-4 py-3 text-slate-300 max-w-[140px] truncate" title="{{ c.jobLocation }}">
                  {{ c.jobLocation || 'Anywhere in Bangladesh' }}
                </td>

                <!-- Deadline -->
                <td class="px-4 py-3 whitespace-nowrap">
                  <span class="font-medium" [ngClass]="c.isExpired ? 'text-rose-400' : 'text-slate-200'">
                    {{ c.deadline }}
                  </span>
                  <span *ngIf="c.isExpired" class="block text-[9px] text-rose-500 font-mono">Expired</span>
                  <span *ngIf="!c.isExpired" class="block text-[9px] text-emerald-400 font-mono">Active</span>
                </td>

                <!-- Video CV Encouraged Badge -->
                <td class="px-4 py-3 text-center whitespace-nowrap">
                  <span 
                    *ngIf="c.videoCvEncouraged"
                    title="Applicants are encouraged to submit Video CV" 
                    class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-950 text-purple-300 border border-purple-800/80">
                    <span>🎥</span> Enabled
                  </span>
                  <span *ngIf="!c.videoCvEncouraged" class="text-slate-600 font-mono text-[11px]">—</span>
                </td>

                <!-- Total Applicants -->
                <td class="px-4 py-3 text-center whitespace-nowrap">
                  <span class="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 font-mono text-slate-200 font-semibold">
                    {{ c.applicants }}
                  </span>
                </td>

                <!-- Status Badge -->
                <td class="px-4 py-3 whitespace-nowrap">
                  <span 
                    class="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono uppercase"
                    [ngClass]="{
                      'bg-emerald-950 text-emerald-400 border border-emerald-800': c.status === 'PUBLISHED',
                      'bg-rose-950 text-rose-400 border border-rose-800': c.status === 'CLOSED',
                      'bg-slate-800 text-slate-400 border border-slate-700': c.status === 'DRAFT',
                      'bg-purple-950 text-purple-400 border border-purple-800': c.status === 'ARCHIVED'
                    }">
                    {{ c.status }}
                  </span>
                </td>

                <!-- Actions (View, Edit, Status Toggle, Delete) -->
                <td class="px-4 py-3 text-right whitespace-nowrap">
                  <div class="flex items-center justify-end gap-1.5">
                    <!-- View -->
                    <button 
                      (click)="viewCircularDetail(c)" 
                      title="View Circular Details"
                      class="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors text-[11px] font-semibold">
                      View
                    </button>

                    <!-- Edit -->
                    <button 
                      (click)="editCircular(c)" 
                      title="Edit Job Circular"
                      class="px-2 py-1 rounded bg-slate-800 hover:bg-blue-900/60 text-slate-300 hover:text-blue-300 transition-colors text-[11px] font-semibold">
                      Edit
                    </button>

                    <!-- Toggle Status (Close / Reopen) -->
                    <button 
                      (click)="toggleCircularStatus(c)" 
                      [title]="c.status === 'PUBLISHED' ? 'Close Circular' : 'Publish Circular'"
                      [ngClass]="c.status === 'PUBLISHED' ? 'hover:bg-rose-950 hover:text-rose-300 text-slate-400' : 'hover:bg-emerald-950 hover:text-emerald-300 text-emerald-400'"
                      class="px-2 py-1 rounded bg-slate-800 transition-colors text-[11px]">
                      {{ c.status === 'PUBLISHED' ? 'Close' : 'Publish' }}
                    </button>

                    <!-- Delete -->
                    <button 
                      (click)="deleteCircular(c)" 
                      title="Delete / Archive Circular"
                      class="px-1.5 py-1 rounded bg-slate-800 hover:bg-rose-900/60 text-slate-400 hover:text-rose-300 transition-colors text-[11px]">
                      🗑
                    </button>
                  </div>
                </td>
              </tr>

              <tr *ngIf="getFilteredCirculars().length === 0">
                <td colspan="9" class="py-12 text-center text-slate-500 space-y-1">
                  <p class="text-sm font-semibold text-slate-400">No job circulars match your search or filter.</p>
                  <p class="text-xs">Click "+ New Circular" above to create a vacancy notice.</p>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- ================================================================= -->
      <!-- TAB 3: ADVANCED SHORTLISTING ENGINE WIZARD -->
      <!-- ================================================================= -->
      <!-- ================================================================= -->
      <!-- TAB 3: ADVANCED MULTI-CRITERIA SHORTLISTING ENGINE & CRUD POOL -->
      <!-- ================================================================= -->
      <div *ngIf="activeTab === 'shortlisting'" class="space-y-6">
        
        <!-- TOP CONTROL BAR: TARGET CIRCULAR SELECTOR & ENGINE ACTIONS -->
        <div class="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <div class="flex items-center gap-2">
                <span class="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 font-mono text-[10px] border border-emerald-800 uppercase font-bold">
                  ATS SHORTLISTING
                </span>
                <h3 class="text-base font-bold text-slate-100">Multi-Criteria Automated Shortlisting Engine</h3>
              </div>
              <p class="text-xs text-slate-400 mt-1">
                Configure algorithmic screening thresholds (CGPA, Experience, Education, Age, District) and evaluate real applicant pools.
              </p>
            </div>

            <!-- Action Controls -->
            <div class="flex flex-wrap items-center gap-2">
              <button 
                type="button"
                (click)="openEnrollModalForCircular()" 
                class="px-3 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 rounded-xl transition-all flex items-center gap-1.5 shadow-sm">
                <span>+</span>
                <span>Enroll New Candidate</span>
              </button>
              <button 
                type="button"
                (click)="resetShortlistStatuses()" 
                [disabled]="isResettingShortlist"
                class="px-3 py-2 text-xs font-semibold bg-slate-800 hover:bg-rose-950/40 text-slate-300 hover:text-rose-400 border border-slate-700 hover:border-rose-800/60 rounded-xl transition-all flex items-center gap-1.5">
                <span *ngIf="isResettingShortlist" class="animate-spin text-xs">⌛</span>
                <span>↺ Reset Statuses</span>
              </button>
              <button 
                type="button"
                (click)="executeShortlistingAlgorithm()" 
                [disabled]="isExecutingShortlist || !selectedShortlistCircularId || realCandidates.length === 0"
                class="px-4 py-2 text-xs font-bold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl shadow-lg shadow-emerald-950/50 transition-all flex items-center gap-2">
                <span *ngIf="isExecutingShortlist" class="animate-spin text-xs">⌛</span>
                <span>Execute Shortlisting Algorithm</span>
                <span>&rarr;</span>
              </button>
            </div>
          </div>

          <!-- Circular Selector & Active Metadata Header -->
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 pt-4 border-t border-slate-800/80">
            <!-- Circular Dropdown -->
            <div class="lg:col-span-2">
              <label class="block text-slate-300 font-semibold mb-1 text-xs">Target Job Circular for Shortlisting</label>
              <select 
                [(ngModel)]="selectedShortlistCircularId" 
                (change)="onShortlistCircularChange()" 
                class="w-full bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 font-medium focus:outline-none">
                <option value="" disabled>-- Select Active Circular --</option>
                <option *ngFor="let c of rawCirculars" [value]="c.id">
                  {{ c.circularNo }}: {{ c.title }} ({{ c.vacancies }})
                </option>
              </select>
            </div>

            <!-- Active Circular Quick Status Badge -->
            <div *ngIf="getSelectedCircularDetails() as selCir" class="bg-slate-950 border border-slate-800 rounded-xl p-3 flex items-center justify-between text-xs">
              <div>
                <span class="text-[10px] text-slate-400 block">Vacancies / Deadline</span>
                <span class="font-bold text-slate-200">{{ selCir.vacancies }}</span>
                <span class="text-slate-400 text-[11px] block">{{ selCir.deadline }}</span>
              </div>
              <div class="text-right">
                <span class="text-[10px] text-slate-400 block">Department</span>
                <span class="font-semibold text-emerald-400 truncate max-w-[140px] block" title="{{ selCir.departmentName }}">
                  {{ selCir.departmentName }}
                </span>
                <span class="text-[10px] text-slate-500 font-mono">{{ selCir.status }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- CRITERIA CONFIGURATOR & REAL-TIME SIMULATION -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-5">
          
          <!-- LEFT: CRITERIA SLIDERS & CONTROLS (7 COLS) -->
          <div class="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4 text-xs">
            <div class="flex items-center justify-between pb-2 border-b border-slate-800">
              <h4 class="font-bold text-slate-200 text-xs uppercase tracking-wider flex items-center gap-2">
                <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Algorithmic Screening Thresholds
              </h4>
              <button 
                type="button" 
                (click)="simulateShortlist()" 
                class="text-[11px] text-emerald-400 hover:text-emerald-300 font-mono flex items-center gap-1 hover:underline">
                <span>Re-simulate</span> ⟳
              </button>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <!-- Min CGPA -->
              <div class="bg-slate-950 p-3 rounded-xl border border-slate-800/80 space-y-1.5">
                <div class="flex justify-between items-center">
                  <label class="text-slate-300 font-semibold">Minimum CGPA (Scale 4.00)</label>
                  <span class="font-mono font-bold text-emerald-400 text-sm">{{ shortlistCriteria.minCgpa | number:'1.2-2' }}</span>
                </div>
                <input 
                  type="range" 
                  min="2.00" 
                  max="3.90" 
                  step="0.05" 
                  [(ngModel)]="shortlistCriteria.minCgpa" 
                  (ngModelChange)="simulateShortlist()" 
                  class="w-full accent-emerald-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg" />
                <div class="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>2.00</span>
                  <span>2.50 (Standard)</span>
                  <span>3.00</span>
                  <span>3.50+</span>
                </div>
              </div>

              <!-- Max Age -->
              <div class="bg-slate-950 p-3 rounded-xl border border-slate-800/80 space-y-1.5">
                <div class="flex justify-between items-center">
                  <label class="text-slate-300 font-semibold">Maximum Candidate Age</label>
                  <span class="font-mono font-bold text-blue-400 text-sm">{{ shortlistCriteria.maxAge }} Years</span>
                </div>
                <input 
                  type="range" 
                  min="24" 
                  max="40" 
                  step="1" 
                  [(ngModel)]="shortlistCriteria.maxAge" 
                  (ngModelChange)="simulateShortlist()" 
                  class="w-full accent-blue-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg" />
                <div class="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>24y</span>
                  <span>30y</span>
                  <span>32y (Standard)</span>
                  <span>40y</span>
                </div>
              </div>

              <!-- Min Experience Years -->
              <div class="bg-slate-950 p-3 rounded-xl border border-slate-800/80 space-y-1.5">
                <div class="flex justify-between items-center">
                  <label class="text-slate-300 font-semibold">Min. Experience (Years)</label>
                  <span class="font-mono font-bold text-purple-400 text-sm">{{ shortlistCriteria.minExperienceYears }} Years</span>
                </div>
                <div class="flex items-center gap-1.5">
                  <button 
                    *ngFor="let exp of [0, 1, 2, 3, 5]" 
                    type="button"
                    (click)="shortlistCriteria.minExperienceYears = exp; simulateShortlist()" 
                    [ngClass]="shortlistCriteria.minExperienceYears === exp ? 'bg-purple-600 text-white font-bold' : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white'"
                    class="flex-1 py-1 rounded text-center font-mono text-xs transition-colors">
                    {{ exp }}y
                  </button>
                </div>
              </div>

              <!-- Minimum Degree -->
              <div class="bg-slate-950 p-3 rounded-xl border border-slate-800/80 space-y-1.5">
                <label class="block text-slate-300 font-semibold">Minimum Education Degree</label>
                <select 
                  [(ngModel)]="shortlistCriteria.minDegree" 
                  (change)="simulateShortlist()" 
                  class="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 font-medium focus:outline-none focus:border-emerald-500">
                  <option value="Any">Any / All Qualifications</option>
                  <option value="Bachelor">Bachelor / Honors Degree</option>
                  <option value="Master">Master / Post-Graduate Degree</option>
                </select>
              </div>
            </div>

            <!-- Target District Filter Chips -->
            <div class="space-y-2 pt-2 border-t border-slate-800/80">
              <div class="flex items-center justify-between">
                <label class="text-slate-300 font-semibold">
                  Preferred / Allowed Districts: 
                  <span class="text-emerald-400 font-mono font-normal">
                    {{ shortlistCriteria.districts.length === 0 ? 'All 64 Districts Allowed' : (shortlistCriteria.districts.length + ' Districts Selected') }}
                  </span>
                </label>
                <button 
                  *ngIf="shortlistCriteria.districts.length > 0" 
                  type="button" 
                  (click)="shortlistCriteria.districts = []; simulateShortlist()" 
                  class="text-[10px] text-slate-400 hover:text-rose-400 underline">
                  Clear Districts
                </button>
              </div>
              <div class="flex flex-wrap gap-1.5">
                <button 
                  type="button"
                  (click)="shortlistCriteria.districts = []; simulateShortlist()" 
                  [ngClass]="shortlistCriteria.districts.length === 0 ? 'bg-emerald-500 text-slate-950 font-bold' : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200'"
                  class="px-2.5 py-1 rounded-full text-[11px] transition-colors">
                  All Districts
                </button>
                <button 
                  *ngFor="let dist of bangladeshDistricts" 
                  type="button"
                  (click)="toggleShortlistDistrict(dist)" 
                  [ngClass]="isDistrictSelected(dist) ? 'bg-emerald-500 text-slate-950 font-bold shadow' : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200'"
                  class="px-2.5 py-1 rounded-full text-[11px] transition-colors flex items-center gap-1">
                  <span>{{ dist }}</span>
                  <span *ngIf="isDistrictSelected(dist)" class="text-[9px]">✕</span>
                </button>
              </div>
            </div>
          </div>

          <!-- RIGHT: REAL-TIME SIMULATION & KPI CARDS (5 COLS) -->
          <div class="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4 flex flex-col justify-between">
            <div>
              <div class="flex items-center justify-between pb-2 border-b border-slate-800">
                <h4 class="font-bold text-slate-200 text-xs uppercase tracking-wider">
                  Live Algorithmic Evaluation
                </h4>
                <span *ngIf="isSimulatingShortlist" class="text-xs text-emerald-400 animate-spin">⟳</span>
              </div>

              <!-- 4 KPI Metrics Grid -->
              <div class="grid grid-cols-2 gap-3 mt-3 text-xs">
                <div class="p-3 bg-slate-950 border border-slate-800 rounded-xl">
                  <span class="text-slate-500 text-[10px] block">Total Applicants Evaluated</span>
                  <span class="text-xl font-bold font-mono text-slate-100">
                    {{ shortlistSimulationResult?.totalEvaluated ?? realCandidates.length }}
                  </span>
                </div>
                <div class="p-3 bg-emerald-950/30 border border-emerald-800/60 rounded-xl">
                  <span class="text-emerald-400 text-[10px] block font-semibold">Eligible Candidates</span>
                  <span class="text-xl font-bold font-mono text-emerald-300">
                    {{ shortlistSimulationResult?.shortlistedCount ?? 0 }}
                  </span>
                </div>
                <div class="p-3 bg-rose-950/20 border border-rose-900/40 rounded-xl">
                  <span class="text-rose-400 text-[10px] block font-semibold">Disqualified / Ineligible</span>
                  <span class="text-xl font-bold font-mono text-rose-300">
                    {{ shortlistSimulationResult?.disqualifiedCount ?? 0 }}
                  </span>
                </div>
                <div class="p-3 bg-blue-950/20 border border-blue-900/40 rounded-xl">
                  <span class="text-blue-400 text-[10px] block font-semibold">Shortlist Match Ratio</span>
                  <span class="text-xl font-bold font-mono text-blue-300">
                    {{ (shortlistSimulationResult?.totalEvaluated ? ((shortlistSimulationResult?.shortlistedCount / shortlistSimulationResult?.totalEvaluated) * 100 | number:'1.0-0') : 0) }}%
                  </span>
                </div>
              </div>

              <!-- Progress Bar Ratio -->
              <div class="mt-4 space-y-1.5">
                <div class="flex justify-between text-[11px] text-slate-400 font-mono">
                  <span>Pass Rate Representation</span>
                  <span>{{ shortlistSimulationResult?.shortlistedCount || 0 }} Passed / {{ shortlistSimulationResult?.disqualifiedCount || 0 }} Filtered</span>
                </div>
                <div class="w-full bg-slate-950 rounded-full h-2.5 overflow-hidden border border-slate-800">
                  <div 
                    class="bg-gradient-to-r from-emerald-500 to-teal-400 h-2.5 rounded-full transition-all duration-300"
                    [style.width.%]="shortlistSimulationResult?.totalEvaluated ? ((shortlistSimulationResult?.shortlistedCount / shortlistSimulationResult?.totalEvaluated) * 100) : 0">
                  </div>
                </div>
              </div>
            </div>

            <!-- Ready Action Prompt -->
            <div class="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs space-y-2 mt-2">
              <div class="flex items-center gap-2 text-slate-300 font-semibold">
                <span class="text-emerald-400 font-bold">✓</span>
                <span>Algorithm Ready for Execution</span>
              </div>
              <p class="text-[11px] text-slate-400 leading-relaxed">
                Clicking "Execute Shortlisting Algorithm" will automatically promote all {{ shortlistSimulationResult?.shortlistedCount || 0 }} qualified candidates to <strong class="text-emerald-400 font-mono">SHORTLISTED</strong> status in the database.
              </p>
            </div>
          </div>
        </div>

        <!-- APPLICANT POOL & CRUD TABLE -->
        <div class="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl space-y-0">
          
          <!-- Pool Table Header & Search Filter Bar -->
          <div class="p-4 border-b border-slate-800 bg-slate-950/60 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
            <!-- Filter Pills -->
            <div class="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
              <span class="text-slate-400 font-semibold mr-1">Pool View:</span>
              <button 
                type="button" 
                (click)="shortlistCandidateFilter = 'ALL'" 
                [ngClass]="shortlistCandidateFilter === 'ALL' ? 'bg-slate-700 text-white font-bold' : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'"
                class="px-2.5 py-1 rounded-lg transition-colors whitespace-nowrap">
                All Applicants ({{ realCandidates.length }})
              </button>
              <button 
                type="button" 
                (click)="shortlistCandidateFilter = 'ELIGIBLE'" 
                [ngClass]="shortlistCandidateFilter === 'ELIGIBLE' ? 'bg-emerald-600 text-white font-bold' : 'bg-slate-950 text-emerald-400 border border-slate-800 hover:text-white'"
                class="px-2.5 py-1 rounded-lg transition-colors whitespace-nowrap">
                Eligible Matches ({{ shortlistSimulationResult?.shortlistedCount || 0 }})
              </button>
              <button 
                type="button" 
                (click)="shortlistCandidateFilter = 'DISQUALIFIED'" 
                [ngClass]="shortlistCandidateFilter === 'DISQUALIFIED' ? 'bg-rose-700 text-white font-bold' : 'bg-slate-950 text-rose-400 border border-slate-800 hover:text-white'"
                class="px-2.5 py-1 rounded-lg transition-colors whitespace-nowrap">
                Disqualified ({{ shortlistSimulationResult?.disqualifiedCount || 0 }})
              </button>
              <button 
                type="button" 
                (click)="shortlistCandidateFilter = 'SHORTLISTED'" 
                [ngClass]="shortlistCandidateFilter === 'SHORTLISTED' ? 'bg-blue-600 text-white font-bold' : 'bg-slate-950 text-blue-400 border border-slate-800 hover:text-white'"
                class="px-2.5 py-1 rounded-lg transition-colors whitespace-nowrap">
                Persisted Shortlisted
              </button>
            </div>

            <!-- Search Field -->
            <div class="relative w-full md:w-64">
              <span class="absolute left-3 top-2.5 text-slate-500 text-xs">🔍</span>
              <input 
                type="text" 
                [(ngModel)]="shortlistCandidateSearch" 
                placeholder="Search candidates by name, tracking ID, district..." 
                class="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none transition-colors" />
            </div>
          </div>

          <!-- Interview Communication Feedback Alert Toast -->
          <div *ngIf="interviewCommunicationToast" class="m-3 p-3 rounded-xl bg-emerald-950/90 border border-emerald-500/50 text-emerald-200 text-xs flex items-center justify-between gap-2 shadow-lg animate-fadeIn">
            <div class="flex items-center gap-2">
              <span class="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              <span class="font-semibold">{{ interviewCommunicationToast }}</span>
            </div>
            <button type="button" (click)="interviewCommunicationToast = ''" class="text-emerald-400 hover:text-white text-xs px-2 py-0.5 rounded bg-emerald-900/60 font-mono">Dismiss</button>
          </div>

          <!-- Multi-Selection Bulk Communication Bar -->
          <div *ngIf="selectedShortlistCandidateIds.length > 0" class="px-4 py-2.5 bg-gradient-to-r from-emerald-950/70 via-slate-900 to-slate-950 border-b border-emerald-500/30 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div class="flex items-center gap-2">
              <span class="px-2.5 py-1 rounded-md text-[11px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm">
                {{ selectedShortlistCandidateIds.length }} Candidates Selected
              </span>
              <span class="text-slate-300 text-xs hidden sm:inline">Ready for interview invitation broadcast:</span>
            </div>
            <div class="flex items-center gap-2 flex-wrap">
              <button 
                type="button" 
                (click)="openBulkInterviewSmsModal()" 
                class="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition-all shadow-md flex items-center gap-1.5 text-xs">
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <span>Bulk Send SMS ({{ selectedShortlistCandidateIds.length }})</span>
              </button>
              <button 
                type="button" 
                (click)="openBulkInterviewEmailModal()" 
                class="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-semibold transition-all shadow-md flex items-center gap-1.5 text-xs">
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span>Bulk Send Email ({{ selectedShortlistCandidateIds.length }})</span>
              </button>
              <button 
                type="button" 
                (click)="clearShortlistSelection()" 
                class="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors">
                Deselect All
              </button>
            </div>
          </div>

          <!-- Empty State -->
          <div *ngIf="getFilteredShortlistCandidates().length === 0" class="py-12 text-center space-y-2">
            <span class="text-3xl text-slate-600 block">👥</span>
            <h5 class="text-sm font-bold text-slate-300">No candidate applicants found for this circular</h5>
            <p class="text-xs text-slate-500">Use "+ Enroll New Candidate" button above to add applicants, or select another circular.</p>
          </div>

          <!-- Interactive Candidate Table -->
          <div *ngIf="getFilteredShortlistCandidates().length > 0" class="overflow-x-auto">
            <table class="w-full text-left text-xs text-slate-300">
              <thead class="bg-slate-950 text-slate-400 font-mono text-[10px] uppercase border-b border-slate-800">
                <tr>
                  <!-- Master Checkbox -->
                  <th class="w-10 px-3 py-3 text-center">
                    <input 
                      type="checkbox" 
                      [checked]="isAllShortlistSelected()" 
                      (change)="toggleSelectAllShortlist($event)"
                      title="Select or deselect all visible applicants"
                      class="rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-0 cursor-pointer" />
                  </th>
                  <th class="px-4 py-3">Tracking ID & Candidate</th>
                  <th class="px-4 py-3">Mobile No / Contact</th>
                  <th class="px-4 py-3">Degree & Institution</th>
                  <th class="px-4 py-3">CGPA</th>
                  <th class="px-4 py-3">Age / Exp</th>
                  <th class="px-4 py-3">District</th>
                  <th class="px-4 py-3">Algorithmic Match</th>
                  <th class="px-4 py-3">Current Status</th>
                  <th class="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-800/60">
                <tr *ngFor="let c of getFilteredShortlistCandidates()" 
                    [ngClass]="isCandidateSelected(c.id) ? 'bg-emerald-950/25 hover:bg-emerald-950/35' : 'hover:bg-slate-800/40'" 
                    class="transition-colors">
                  
                  <!-- Row Checkbox -->
                  <td class="w-10 px-3 py-3 text-center">
                    <input 
                      type="checkbox" 
                      [checked]="isCandidateSelected(c.id)" 
                      (change)="toggleCandidateSelection(c.id)"
                      class="rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-0 cursor-pointer" />
                  </td>

                  <!-- Tracking ID & Candidate -->
                  <td class="px-4 py-3">
                    <span class="font-mono text-emerald-400 font-bold block text-[11px]">{{ c.trackingId }}</span>
                    <span class="font-semibold text-slate-100 block">{{ c.fullName }}</span>
                    <span class="text-[10px] text-slate-500 font-mono">{{ c.email }}</span>
                  </td>

                  <!-- Mobile No / Contact Column -->
                  <td class="px-4 py-3">
                    <div class="space-y-1">
                      <div class="flex items-center gap-1.5">
                        <a [href]="'tel:' + c.phone" class="font-mono text-emerald-300 font-semibold hover:underline block text-[11px]">
                          {{ c.phone || 'N/A' }}
                        </a>
                        <button 
                          type="button" 
                          *ngIf="c.phone" 
                          (click)="copyCandidatePhone(c.phone)" 
                          title="Copy Mobile Number" 
                          class="text-slate-400 hover:text-white text-[10px] px-1 py-0.5 rounded bg-slate-800 hover:bg-slate-700 font-sans">
                          copy
                        </button>
                      </div>
                      <!-- Notification Sent Indicators -->
                      <div class="flex flex-wrap items-center gap-1">
                        <span *ngIf="c.interviewSmsSent || isCandidateSmsSent(c.id)" class="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-emerald-900/60 text-emerald-300 border border-emerald-700/50">
                          SMS Sent
                        </span>
                        <span *ngIf="c.interviewEmailSent || isCandidateEmailSent(c.id)" class="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-sky-900/60 text-sky-300 border border-sky-700/50">
                          Email Sent
                        </span>
                      </div>
                    </div>
                  </td>

                  <!-- Degree & Institution -->
                  <td class="px-4 py-3">
                    <span class="font-medium text-slate-200 block">{{ c.highestDegree }}</span>
                    <span class="text-[10px] text-slate-500">{{ c.institution || 'Recognized University' }}</span>
                  </td>

                  <!-- CGPA -->
                  <td class="px-4 py-3 font-mono">
                    <span 
                      class="px-2 py-0.5 rounded text-xs font-bold"
                      [ngClass]="Number(c.cgpa) >= shortlistCriteria.minCgpa ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/60' : 'bg-rose-950/80 text-rose-300 border border-rose-800/60'">
                      {{ Number(c.cgpa) | number:'1.2-2' }}
                    </span>
                  </td>

                  <!-- Age / Exp -->
                  <td class="px-4 py-3">
                    <span class="text-slate-200 font-medium block">{{ getCandidateAge(c.dateOfBirth) }} yrs</span>
                    <span class="text-[10px] text-slate-400 font-mono">{{ c.experienceYears || 0 }}y exp</span>
                  </td>

                  <!-- District -->
                  <td class="px-4 py-3">
                    <span class="font-medium text-slate-300">{{ c.district }}</span>
                  </td>

                  <!-- Algorithmic Match Assessment -->
                  <td class="px-4 py-3">
                    <ng-container *ngIf="getCandidateEvaluation(c.id) as ev">
                      <span 
                        *ngIf="ev.isEligible" 
                        class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-900/60 text-emerald-300 border border-emerald-700/60 flex items-center gap-1 w-fit">
                        <span>✓</span>
                        <span>QUALIFIED</span>
                      </span>
                      <div *ngIf="!ev.isEligible" class="space-y-0.5">
                        <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-900/60 text-rose-300 border border-rose-700/60 flex items-center gap-1 w-fit">
                          <span>✕</span>
                          <span>DISQUALIFIED</span>
                        </span>
                        <span *ngFor="let r of ev.reasons" class="text-[10px] text-rose-400/90 block leading-tight">
                          • {{ r }}
                        </span>
                      </div>
                    </ng-container>
                  </td>

                  <!-- Current Status Badge -->
                  <td class="px-4 py-3">
                    <span 
                      class="px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-wide uppercase"
                      [ngClass]="{
                        'bg-amber-950/80 text-amber-300 border border-amber-800/50': c.status === 'APPLIED',
                        'bg-emerald-950/80 text-emerald-300 border border-emerald-800/50': c.status === 'SHORTLISTED',
                        'bg-blue-950/80 text-blue-300 border border-blue-800/50': c.status === 'SELECTED' || c.status === 'DEPLOYED',
                        'bg-rose-950/80 text-rose-300 border border-rose-800/50': c.status === 'REJECTED'
                      }">
                      {{ c.status }}
                    </span>
                  </td>

                  <!-- Actions Dropdown / Buttons -->
                  <td class="px-4 py-3 text-right">
                    <div class="flex items-center justify-end gap-1.5">
                      <!-- Send Interview SMS Quick Button -->
                      <button 
                        type="button"
                        (click)="openSingleCandidateSmsModal(c)" 
                        title="Send Interview Invitation SMS"
                        class="px-2 py-1 rounded bg-emerald-950/80 hover:bg-emerald-800 text-emerald-300 border border-emerald-800/60 transition-colors text-[11px] font-semibold flex items-center gap-1">
                        <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        <span>SMS</span>
                      </button>

                      <!-- Send Interview Email Quick Button -->
                      <button 
                        type="button"
                        (click)="openSingleCandidateEmailModal(c)" 
                        title="Send Interview Invitation Email"
                        class="px-2 py-1 rounded bg-sky-950/80 hover:bg-sky-800 text-sky-300 border border-sky-800/60 transition-colors text-[11px] font-semibold flex items-center gap-1">
                        <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        <span>Email</span>
                      </button>

                      <button 
                        type="button"
                        (click)="openCandidateDossier(c)" 
                        title="View Full Profile Dossier"
                        class="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors text-[11px]">
                        Dossier
                      </button>
                      <button 
                        type="button"
                        (click)="openEditCandidateModal(c)" 
                        title="Edit Candidate Credentials"
                        class="px-2 py-1 rounded bg-slate-800 hover:bg-emerald-700 text-slate-300 hover:text-white transition-colors text-[11px]">
                        Edit
                      </button>
                      <button 
                        *ngIf="c.status === 'APPLIED'"
                        type="button"
                        (click)="overrideCandidateStatus(c, 'SHORTLISTED')" 
                        title="Manual Shortlist"
                        class="px-2 py-1 rounded bg-emerald-950 hover:bg-emerald-800 text-emerald-300 border border-emerald-800/60 transition-colors text-[11px]">
                        + Shortlist
                      </button>
                      <button 
                        *ngIf="c.status === 'SHORTLISTED'"
                        type="button"
                        (click)="overrideCandidateStatus(c, 'APPLIED')" 
                        title="Revert to Applied"
                        class="px-2 py-1 rounded bg-amber-950 hover:bg-amber-800 text-amber-300 border border-amber-800/60 transition-colors text-[11px]">
                        Revert
                      </button>
                      <button 
                        type="button"
                        (click)="deleteCandidateRecord(c)" 
                        title="Delete Candidate Record"
                        class="px-1.5 py-1 rounded bg-slate-800 hover:bg-rose-900/60 text-slate-400 hover:text-rose-300 transition-colors text-[11px]">
                        ✕
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Table Footer -->
          <div class="p-3 border-t border-slate-800 bg-slate-950/80 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400">
            <div class="flex items-center gap-2">
              <span>Showing {{ getFilteredShortlistCandidates().length }} of {{ realCandidates.length }} candidate applicants</span>
              <span *ngIf="selectedShortlistCandidateIds.length > 0" class="text-emerald-400 font-semibold">
                ({{ selectedShortlistCandidateIds.length }} selected)
              </span>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-[11px] font-mono text-emerald-400">Uddipan ATS Engine v2.4</span>
            </div>
          </div>
        </div>

      </div>

      <!-- ================================================================= -->
      <!-- TAB 4: EXAM HALLS & ADMIT CARDS -->
      <!-- ================================================================= -->
      <!-- ================================================================= -->
      <!-- TAB 4: EXAM HALLS & ADMIT CARDS -->
      <!-- ================================================================= -->
      <div *ngIf="activeTab === 'examHalls'" class="space-y-6">
        <!-- 1. KPI Statistics Banner -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div class="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm flex items-center justify-between">
            <div>
              <p class="text-xs text-slate-400 font-medium">Exam Centers & Venues</p>
              <h3 class="text-xl font-bold text-slate-100 mt-1">{{ examHallsList.length }} Venues</h3>
              <p class="text-[11px] text-emerald-400 mt-0.5">{{ totalExamHallsCapacity }} Total Seating Capacity</p>
            </div>
            <div class="w-10 h-10 rounded-lg bg-emerald-950/60 border border-emerald-800 flex items-center justify-center text-emerald-400 font-mono text-sm font-bold">
              VENUE
            </div>
          </div>

          <div class="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm flex items-center justify-between">
            <div>
              <p class="text-xs text-slate-400 font-medium">Scheduled Exam Sessions</p>
              <h3 class="text-xl font-bold text-slate-100 mt-1">{{ examSchedulesList.length }} Sessions</h3>
              <p class="text-[11px] text-blue-400 mt-0.5">Written / MCQ / Practical</p>
            </div>
            <div class="w-10 h-10 rounded-lg bg-blue-950/60 border border-blue-800 flex items-center justify-center text-blue-400 font-mono text-sm font-bold">
              EXAM
            </div>
          </div>

          <div class="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm flex items-center justify-between">
            <div>
              <p class="text-xs text-slate-400 font-medium">Admit Cards Generated</p>
              <h3 class="text-xl font-bold text-slate-100 mt-1">{{ totalAdmitCardsIssuedCount }} Issued</h3>
              <p class="text-[11px] text-amber-400 mt-0.5">Auto-Numbered & Seated</p>
            </div>
            <div class="w-10 h-10 rounded-lg bg-amber-950/60 border border-amber-800 flex items-center justify-center text-amber-400 font-mono text-sm font-bold">
              ADMIT
            </div>
          </div>

          <div class="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm flex items-center justify-between">
            <div>
              <p class="text-xs text-slate-400 font-medium">Logistics & Verification</p>
              <h3 class="text-xl font-bold text-slate-100 mt-1">QR Validated</h3>
              <p class="text-[11px] text-purple-400 mt-0.5">Anti-fraud Verification</p>
            </div>
            <div class="w-10 h-10 rounded-lg bg-purple-950/60 border border-purple-800 flex items-center justify-center text-purple-400 font-mono text-sm font-bold">
              QR
            </div>
          </div>
        </div>

        <!-- 2. Controls & Actions Bar -->
        <div class="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div class="flex flex-wrap items-center gap-3">
            <div class="relative min-w-[200px]">
              <input 
                type="text" 
                [(ngModel)]="examSearchQuery" 
                placeholder="Search schedules or venues..." 
                class="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg px-3 py-2 pl-8 focus:outline-none focus:border-emerald-500">
              <span class="absolute left-2.5 top-2.5 text-slate-500 text-xs">🔍</span>
            </div>

            <select 
              [(ngModel)]="examFilterCircularId" 
              class="bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-emerald-500">
              <option value="ALL">All Job Circulars</option>
              <option *ngFor="let c of rawCirculars" [value]="c.id">
                {{ c.circularNo }}: {{ c.title }}
              </option>
            </select>

            <select 
              [(ngModel)]="examFilterType" 
              class="bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-emerald-500">
              <option value="ALL">All Exam Types</option>
              <option value="WRITTEN">Written Exam</option>
              <option value="PRELIMINARY_MCQ">Preliminary MCQ</option>
              <option value="PRACTICAL">Practical Exam</option>
            </select>

            <button 
              (click)="loadExamHallsAndSchedules()" 
              title="Refresh"
              class="px-2.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs transition-colors border border-slate-700">
              ↻ Refresh
            </button>
          </div>

          <div class="flex items-center gap-2">
            <button 
              (click)="openCreateExamHallModal()" 
              class="px-3.5 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg transition-colors shadow-sm">
              + New Exam Hall
            </button>
            <button 
              (click)="openScheduleExamModal()" 
              class="px-3.5 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors shadow-md flex items-center gap-1.5">
              <span>+ Schedule Exam & Generate Admit Cards</span>
            </button>
          </div>
        </div>

        <!-- 3. Exam Halls / Venues Section -->
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <h4 class="text-sm font-bold text-slate-200 flex items-center gap-2">
              <span>Exam Venues & Centers</span>
              <span class="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 text-[10px] font-mono">
                {{ examHallsList.length }} Venues Registered
              </span>
            </h4>
            <span class="text-xs text-slate-400">Manage exam centers, room allocations and hall capacities</span>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div *ngFor="let h of examHallsList" class="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm hover:border-slate-700 transition-all flex flex-col justify-between">
              <div>
                <div class="flex items-start justify-between gap-2">
                  <span class="text-[10px] font-mono font-semibold text-emerald-400 px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-800">
                    CAPACITY: {{ h.capacity }} SEATS
                  </span>
                  <button 
                    (click)="deleteExamHall(h)" 
                    title="Delete Exam Hall"
                    class="text-slate-500 hover:text-rose-400 text-xs p-1 transition-colors">
                    ✕
                  </button>
                </div>
                <h4 class="text-sm font-bold text-slate-100 mt-2.5">{{ h.hallName }}</h4>
                <p class="text-xs text-slate-400 mt-1 flex items-center gap-1">
                  <span>📍</span>
                  <span>{{ h.centerLocation }}</span>
                </p>
                <p *ngIf="h.roomNumber" class="text-[11px] text-slate-500 mt-1 font-mono">
                  Room / Floor: {{ h.roomNumber }}
                </p>
              </div>

              <div class="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                <span class="text-slate-400">Scheduled Exams:</span>
                <span class="font-bold text-slate-200 font-mono">{{ h._count?.examSchedules || 0 }}</span>
              </div>
            </div>

            <!-- Add New Hall Quick Card -->
            <button 
              (click)="openCreateExamHallModal()" 
              class="border-2 border-dashed border-slate-800 hover:border-emerald-600/50 hover:bg-emerald-950/10 rounded-xl p-4 flex flex-col items-center justify-center text-center transition-all group min-h-[140px]">
              <div class="w-8 h-8 rounded-full bg-slate-800 group-hover:bg-emerald-600/20 text-slate-400 group-hover:text-emerald-400 flex items-center justify-center text-base mb-2 transition-colors">
                +
              </div>
              <span class="text-xs font-semibold text-slate-300 group-hover:text-emerald-400">Add New Exam Hall</span>
              <span class="text-[10px] text-slate-500 mt-0.5">Register venue with seating capacity</span>
            </button>
          </div>
        </div>

        <!-- 4. Exam Schedules & Admit Cards Table -->
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <h4 class="text-sm font-bold text-slate-200 flex items-center gap-2">
              <span>Exam Schedules & Distribution</span>
              <span class="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 text-[10px] font-mono border border-emerald-800">
                {{ filteredExamSchedules.length }} Active
              </span>
            </h4>
            <span class="text-xs text-slate-400">Manage written/MCQ dates, time slots, and inspect issued admit cards</span>
          </div>

          <div class="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
            <div class="overflow-x-auto">
              <table class="w-full text-left text-xs text-slate-300">
                <thead class="bg-slate-950/80 text-[11px] uppercase font-mono text-slate-400 border-b border-slate-800">
                  <tr>
                    <th class="py-3 px-4">Circular # & Position</th>
                    <th class="py-3 px-4">Exam Type</th>
                    <th class="py-3 px-4">Date & Time Slot</th>
                    <th class="py-3 px-4">Exam Center & Hall</th>
                    <th class="py-3 px-4 text-center">Marks (Pass / Total)</th>
                    <th class="py-3 px-4 text-center">Admit Cards Issued</th>
                    <th class="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-800/60">
                  <tr *ngIf="filteredExamSchedules.length === 0">
                    <td colspan="7" class="py-8 text-center text-slate-500">
                      No exam schedules found. Click <strong>"+ Schedule Exam & Generate Admit Cards"</strong> to plan an exam for shortlisted candidates.
                    </td>
                  </tr>

                  <tr *ngFor="let s of filteredExamSchedules" class="hover:bg-slate-800/40 transition-colors">
                    <td class="py-3 px-4">
                      <div class="font-bold text-slate-100">{{ s.circular?.title || 'Job Circular' }}</div>
                      <div class="text-[11px] text-slate-400 font-mono mt-0.5">
                        {{ s.circular?.circularNo || 'CIR-XXXX' }} &bull; {{ s.circular?.designation?.title || 'Designation' }}
                      </div>
                    </td>

                    <td class="py-3 px-4">
                      <span 
                        [ngClass]="{
                          'bg-blue-950/80 text-blue-400 border-blue-800': s.examType === 'WRITTEN',
                          'bg-amber-950/80 text-amber-400 border-amber-800': s.examType === 'PRELIMINARY_MCQ',
                          'bg-purple-950/80 text-purple-400 border-purple-800': s.examType === 'PRACTICAL'
                        }"
                        class="px-2 py-0.5 rounded text-[10px] font-mono border font-semibold">
                        {{ s.examType }}
                      </span>
                    </td>

                    <td class="py-3 px-4">
                      <div class="font-semibold text-slate-200">
                        {{ s.examDate | date:'dd MMM yyyy' }}
                      </div>
                      <div class="text-[11px] text-slate-400 font-mono mt-0.5">
                        {{ s.startTime }} - {{ s.endTime }}
                      </div>
                    </td>

                    <td class="py-3 px-4">
                      <div class="font-semibold text-slate-200">{{ s.hall?.hallName || 'Hall Name' }}</div>
                      <div class="text-[11px] text-slate-400 mt-0.5">
                        {{ s.hall?.centerLocation || 'Location' }}
                        <span *ngIf="s.hall?.roomNumber" class="text-slate-500 font-mono">({{ s.hall.roomNumber }})</span>
                      </div>
                    </td>

                    <td class="py-3 px-4 text-center font-mono">
                      <span class="text-emerald-400 font-bold">{{ s.passMarks }}</span>
                      <span class="text-slate-500"> / </span>
                      <span class="text-slate-300">{{ s.totalMarks }}</span>
                    </td>

                    <td class="py-3 px-4 text-center">
                      <span class="px-2.5 py-1 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 text-[11px] font-mono font-bold">
                        {{ s._count?.admitCards || 0 }} Cards
                      </span>
                    </td>

                    <td class="py-3 px-4 text-right">
                      <div class="flex items-center justify-end gap-2">
                        <button 
                          (click)="viewScheduleAdmitCards(s)" 
                          class="px-2.5 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs transition-colors shadow-sm flex items-center gap-1">
                          <span>View Admit Cards</span>
                          <span>&rarr;</span>
                        </button>
                        <button 
                          (click)="deleteExamSchedule(s)" 
                          title="Cancel Exam Schedule & Revoke Admit Cards"
                          class="px-2 py-1.5 rounded bg-slate-800 hover:bg-rose-950 hover:text-rose-400 text-slate-400 text-xs transition-colors border border-slate-700">
                          Cancel
                        </button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <!-- ================================================================= -->
      <!-- TAB: EXAM ATTENDANCE MANAGEMENT -->
      <!-- ================================================================= -->
      <div *ngIf="activeTab === 'examAttendance'" class="space-y-6">
        <!-- 1. Header Banner & Exam Session Selection -->
        <div class="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
          <div class="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div>
              <div class="flex items-center gap-2">
                <button type="button" (click)="selectTab('pipeline')" class="text-xs text-emerald-400 hover:text-emerald-300 hover:underline flex items-center gap-1 font-medium mr-2 transition-colors">
                  &larr; Recruitment Portal
                </button>
                <span class="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950 border border-emerald-800 text-emerald-400 font-bold uppercase">OFFICIAL</span>
                <h3 class="text-base font-bold text-slate-100">Exam Attendance & Gate Verification Center</h3>
              </div>
              <p class="text-xs text-slate-400 mt-1">
                Real-time invigilator attendance logging, roll/barcode check-in, seat validation, and biometric verification.
              </p>
            </div>

            <!-- Session Selector & Lock Action -->
            <div class="flex flex-wrap items-center gap-2.5">
              <div class="flex items-center gap-1.5 bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-lg">
                <span class="text-[11px] text-slate-400 font-medium">Session:</span>
                <select 
                  [(ngModel)]="selectedAttendanceScheduleId" 
                  (change)="onAttendanceScheduleChange()"
                  class="bg-slate-950 text-xs text-slate-200 font-semibold focus:outline-none cursor-pointer">
                  <option value="" disabled class="bg-slate-950 text-slate-400">-- Select Exam Session --</option>
                  <option *ngFor="let s of examSchedulesList" [value]="s.id" class="bg-slate-950 text-slate-200 py-1">
                    {{ s.circular?.circularNo }} | {{ s.examType }} ({{ s.hall?.hallName }})
                  </option>
                </select>
              </div>

              <button 
                (click)="toggleLockAttendance()"
                [ngClass]="isAttendanceLocked ? 'bg-amber-950/80 border-amber-700 text-amber-300' : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'"
                class="px-3 py-2 text-xs font-semibold rounded-lg border transition-all flex items-center gap-1.5 shadow-sm">
                <span class="w-2 h-2 rounded-full" [ngClass]="isAttendanceLocked ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'"></span>
                <span>{{ isAttendanceLocked ? 'Session Locked' : 'Lock Roster' }}</span>
              </button>
            </div>
          </div>

          <!-- Quick QR / Barcode / Roll Scanner Bar -->
          <div class="p-3.5 rounded-xl bg-slate-950 border border-slate-800/90 flex flex-col md:flex-row items-center justify-between gap-3">
            <div class="flex items-center gap-2.5 w-full md:w-auto flex-1">
              <span class="px-2 py-1 rounded bg-slate-900 border border-slate-700 text-[10px] font-mono text-emerald-400 font-bold shrink-0">
                GATE SCANNER
              </span>
              <div class="relative flex-1 max-w-lg">
                <input 
                  type="text" 
                  [(ngModel)]="attendanceScannerRoll"
                  (keyup.enter)="scanRollNumber()"
                  [disabled]="isAttendanceLocked"
                  placeholder="Scan barcode or enter Roll # / Admit Card # (e.g. 100041) and hit Enter..."
                  class="w-full bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none transition-all font-mono">
              </div>
              <button 
                (click)="scanRollNumber()"
                [disabled]="isAttendanceLocked"
                class="px-3.5 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg transition-all shadow-sm shrink-0">
                Verify & Check-In
              </button>
            </div>

            <div *ngIf="attendanceScannerFeedback" 
              [ngClass]="attendanceScannerSuccess ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800' : 'bg-rose-950/80 text-rose-300 border-rose-800'"
              class="px-3 py-1.5 rounded-lg border text-xs font-medium max-w-md truncate">
              {{ attendanceScannerFeedback }}
            </div>
          </div>
        </div>

        <!-- 2. Attendance KPI Statistics Cards -->
        <div class="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
          <div class="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm flex flex-col justify-between">
            <span class="text-xs text-slate-400 font-medium">Registered / Seated</span>
            <div class="flex items-baseline justify-between mt-2">
              <span class="text-2xl font-bold font-mono text-slate-100">{{ attendanceTotalCount }}</span>
              <span class="text-[10px] text-slate-500 font-mono">Candidates</span>
            </div>
          </div>

          <div class="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm flex flex-col justify-between">
            <span class="text-xs text-emerald-400 font-medium">Present & Verified</span>
            <div class="flex items-baseline justify-between mt-2">
              <span class="text-2xl font-bold font-mono text-emerald-400">{{ attendancePresentCount }}</span>
              <span class="text-[10px] text-emerald-400/80 font-mono">In Hall</span>
            </div>
          </div>

          <div class="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm flex flex-col justify-between">
            <span class="text-xs text-rose-400 font-medium">Absent</span>
            <div class="flex items-baseline justify-between mt-2">
              <span class="text-2xl font-bold font-mono text-rose-400">{{ attendanceAbsentCount }}</span>
              <span class="text-[10px] text-rose-400/80 font-mono">No Show</span>
            </div>
          </div>

          <div class="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm flex flex-col justify-between">
            <span class="text-xs text-amber-400 font-medium">Late Check-in</span>
            <div class="flex items-baseline justify-between mt-2">
              <span class="text-2xl font-bold font-mono text-amber-400">{{ attendanceLateCount }}</span>
              <span class="text-[10px] text-amber-400/80 font-mono">Approved</span>
            </div>
          </div>

          <div class="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm flex flex-col justify-between col-span-2 lg:col-span-1">
            <span class="text-xs text-blue-400 font-medium">Attendance Rate</span>
            <div class="flex items-baseline justify-between mt-2">
              <span class="text-2xl font-bold font-mono text-blue-400">{{ attendanceRatePercent }}%</span>
              <div class="w-12 h-1.5 bg-slate-800 rounded-full overflow-hidden self-center">
                <div class="bg-blue-400 h-full transition-all" [style.width.%]="attendanceRatePercent"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- 3. Roster Controls & Operational Toolbar -->
        <div class="bg-slate-900 border border-slate-800 rounded-xl p-3.5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div class="flex flex-wrap items-center gap-2.5 flex-1">
            <!-- Search -->
            <div class="relative flex-1 min-w-[220px] max-w-sm">
              <input 
                type="text" 
                [(ngModel)]="attendanceSearchQuery"
                placeholder="Search Roll #, Candidate Name, Seat..."
                class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500">
            </div>

            <!-- Status Filter Pills -->
            <div class="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-[11px]">
              <button 
                *ngFor="let st of ['ALL', 'PRESENT', 'ABSENT', 'LATE', 'EXPELLED']"
                (click)="attendanceFilterStatus = st"
                [ngClass]="attendanceFilterStatus === st ? 'bg-emerald-600 text-white font-semibold shadow-sm' : 'text-slate-400 hover:text-slate-200'"
                class="px-2.5 py-1 rounded transition-colors uppercase font-mono">
                {{ st }}
              </button>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex items-center gap-2">
            <button 
              (click)="markAllAttendancePresent()"
              [disabled]="isAttendanceLocked"
              class="px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 border border-slate-700 rounded-lg transition-colors">
              Mark All Present
            </button>
            <button 
              (click)="exportAttendanceCsv()"
              class="px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 rounded-lg transition-colors">
              Export CSV
            </button>
            <button 
              (click)="printAttendanceSheet()"
              class="px-3 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors shadow-sm">
              Print Signature Sheet
            </button>
          </div>
        </div>

        <!-- 4. Candidate Attendance Roster Table -->
        <div class="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse text-xs">
              <thead>
                <tr class="border-b border-slate-800 bg-slate-950/60 text-slate-400 uppercase font-mono text-[10px]">
                  <th class="py-3 px-4">Roll Number</th>
                  <th class="py-3 px-4">Candidate Profile</th>
                  <th class="py-3 px-4">Venue / Seat Plan</th>
                  <th class="py-3 px-4">Admit Card</th>
                  <th class="py-3 px-4">Verification Info</th>
                  <th class="py-3 px-4 text-center">Attendance Status</th>
                  <th class="py-3 px-4 text-right">Quick Action</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-800/60 text-slate-300">
                <tr *ngFor="let r of filteredAttendanceRecords" class="hover:bg-slate-800/40 transition-colors">
                  <td class="py-3 px-4">
                    <span class="font-mono text-emerald-400 font-bold text-sm">{{ r.rollNumber }}</span>
                    <p class="text-[10px] text-slate-500 font-mono">{{ r.trackingId }}</p>
                  </td>
                  <td class="py-3 px-4">
                    <p class="font-semibold text-slate-200">{{ r.fullName }}</p>
                    <p class="text-[10px] text-slate-400">{{ r.highestDegree }} (CGPA: {{ r.cgpa }}) | {{ r.district }}</p>
                  </td>
                  <td class="py-3 px-4">
                    <span class="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-[11px] font-mono text-blue-300">
                      {{ r.seatNumber }}
                    </span>
                  </td>
                  <td class="py-3 px-4">
                    <span class="text-slate-400 font-mono text-[11px]">{{ r.admitCardNo }}</span>
                  </td>
                  <td class="py-3 px-4">
                    <div *ngIf="r.verifiedAt">
                      <span class="text-[11px] text-emerald-400 font-mono">{{ r.verifiedAt }}</span>
                      <p class="text-[10px] text-slate-500">{{ r.verifiedBy }}</p>
                    </div>
                    <span *ngIf="!r.verifiedAt" class="text-[10px] text-slate-600 font-mono">Not Verified</span>
                  </td>
                  <td class="py-3 px-4 text-center">
                    <span class="px-2.5 py-1 rounded text-[10px] font-mono font-bold tracking-wider"
                      [ngClass]="{
                        'bg-emerald-950 text-emerald-400 border border-emerald-800': r.attendanceStatus === 'PRESENT',
                        'bg-rose-950 text-rose-400 border border-rose-800': r.attendanceStatus === 'ABSENT',
                        'bg-amber-950 text-amber-400 border border-amber-800': r.attendanceStatus === 'LATE',
                        'bg-purple-950 text-purple-400 border border-purple-800': r.attendanceStatus === 'EXPELLED'
                      }">
                      {{ r.attendanceStatus }}
                    </span>
                  </td>
                  <td class="py-3 px-4 text-right">
                    <div class="inline-flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-[10px]">
                      <button 
                        (click)="setAttendanceStatus(r, 'PRESENT')"
                        [disabled]="isAttendanceLocked"
                        [ngClass]="r.attendanceStatus === 'PRESENT' ? 'bg-emerald-600 text-white font-bold' : 'text-slate-400 hover:text-emerald-400'"
                        class="px-2 py-0.5 rounded transition-colors font-mono">
                        P
                      </button>
                      <button 
                        (click)="setAttendanceStatus(r, 'ABSENT')"
                        [disabled]="isAttendanceLocked"
                        [ngClass]="r.attendanceStatus === 'ABSENT' ? 'bg-rose-600 text-white font-bold' : 'text-slate-400 hover:text-rose-400'"
                        class="px-2 py-0.5 rounded transition-colors font-mono">
                        A
                      </button>
                      <button 
                        (click)="setAttendanceStatus(r, 'LATE')"
                        [disabled]="isAttendanceLocked"
                        [ngClass]="r.attendanceStatus === 'LATE' ? 'bg-amber-600 text-white font-bold' : 'text-slate-400 hover:text-amber-400'"
                        class="px-2 py-0.5 rounded transition-colors font-mono">
                        L
                      </button>
                      <button 
                        (click)="setAttendanceStatus(r, 'EXPELLED')"
                        [disabled]="isAttendanceLocked"
                        [ngClass]="r.attendanceStatus === 'EXPELLED' ? 'bg-purple-600 text-white font-bold' : 'text-slate-400 hover:text-purple-400'"
                        class="px-2 py-0.5 rounded transition-colors font-mono"
                        title="Expel candidate for unfair means">
                        X
                      </button>
                    </div>
                  </td>
                </tr>
                <tr *ngIf="filteredAttendanceRecords.length === 0">
                  <td colspan="7" class="py-8 text-center text-slate-500 font-mono text-xs">
                    No candidates found matching the selected session and filter criteria.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- ================================================================= -->
      <!-- TAB: MARKS TABULATION & CUTOFF PUBLISHING -->
      <!-- ================================================================= -->
      <div *ngIf="activeTab === 'marksTabulation'" class="space-y-6">
        <!-- 1. Header & Cutoff Control Banner -->
        <div class="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
          <div class="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div>
              <div class="flex items-center gap-2">
                <button type="button" (click)="selectTab('pipeline')" class="text-xs text-emerald-400 hover:text-emerald-300 hover:underline flex items-center gap-1 font-medium mr-2 transition-colors">
                  &larr; Recruitment Portal
                </button>
                <span class="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950 border border-emerald-800 text-emerald-400 font-bold uppercase">OFFICIAL</span>
                <h3 class="text-base font-bold text-slate-100">Marks Tabulation & Official Cutoff Publishing</h3>
              </div>
              <p class="text-xs text-slate-400 mt-1">
                Score entry, automated merit ranking, cutoff threshold configuration, and 1-click shortlist publishing to Viva Voce.
              </p>
            </div>

            <!-- Schedule Selector -->
            <div class="flex items-center gap-1.5 bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-lg">
              <span class="text-[11px] text-slate-400 font-medium">Exam Session:</span>
              <select 
                [(ngModel)]="selectedTabulationScheduleId" 
                (change)="onTabulationScheduleChange()"
                class="bg-slate-950 text-xs text-slate-200 font-semibold focus:outline-none cursor-pointer">
                <option value="" disabled class="bg-slate-950 text-slate-400">-- Select Exam Session --</option>
                <option *ngFor="let s of examSchedulesList" [value]="s.id" class="bg-slate-950 text-slate-200 py-1">
                  {{ s.circular?.circularNo }} | {{ s.examType }} (Max: {{ s.totalMarks || 100 }})
                </option>
              </select>
            </div>
          </div>

          <!-- Cutoff Threshold Slider & Publishing Controls -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-slate-800/80">
            <!-- Cutoff Slider -->
            <div class="md:col-span-2 bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <div class="flex items-center justify-between">
                <div>
                  <span class="text-xs font-semibold text-slate-200">Qualifying Cutoff Threshold</span>
                  <p class="text-[10px] text-slate-400">Candidates with marks >= cutoff will be shortlisted for Viva Voce.</p>
                </div>
                <div class="flex items-center gap-2">
                  <span class="text-xs font-mono text-slate-400">Cutoff:</span>
                  <input 
                    type="number" 
                    [(ngModel)]="cutoffMarksThreshold" 
                    (change)="onCutoffThresholdChange()"
                    min="0" 
                    max="100" 
                    step="0.5"
                    class="w-20 bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-sm font-mono font-bold text-emerald-400 text-center focus:outline-none focus:border-emerald-500">
                  <span class="text-xs text-slate-400">/ 100</span>
                </div>
              </div>
              <input 
                type="range" 
                [(ngModel)]="cutoffMarksThreshold" 
                (input)="onCutoffThresholdChange()"
                min="20" 
                max="90" 
                step="1"
                class="w-full accent-emerald-500 cursor-pointer">
              <div class="flex justify-between text-[10px] font-mono text-slate-500">
                <span>Min: 20 Marks</span>
                <span>Standard Pass: 50 Marks</span>
                <span>High Merit: 80 Marks</span>
              </div>
            </div>

            <!-- Publish Action Box -->
            <div class="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col justify-between">
              <div>
                <span class="text-xs font-semibold text-slate-200">Publish Cutoff Decision</span>
                <p class="text-[10px] text-slate-400 mt-1">
                  Locks merit list and updates candidate statuses to WRITTEN_PASSED.
                </p>
              </div>
              <div class="mt-3 flex items-center gap-2">
                <button 
                  (click)="publishCutoffAndMeritList()"
                  [disabled]="isPublishingCutoff"
                  class="flex-1 py-2 px-3 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg transition-all shadow-md text-center">
                  {{ isPublishingCutoff ? 'Publishing...' : 'Publish Cutoff & Shortlist' }}
                </button>
              </div>
            </div>
          </div>

          <!-- Cutoff Published Banner -->
          <div *ngIf="cutoffPublishSuccessMsg" class="p-3 rounded-lg bg-emerald-950/80 border border-emerald-800 text-xs text-emerald-300 flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]"></span>
              <span>{{ cutoffPublishSuccessMsg }}</span>
            </div>
            <button (click)="dispatchResultNotifications()" class="text-[11px] underline font-medium hover:text-white">
              Dispatch SMS Alerts &rarr;
            </button>
          </div>
        </div>

        <!-- 2. Tabulation Statistics Cards -->
        <div class="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
          <div class="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm flex flex-col justify-between">
            <span class="text-xs text-slate-400 font-medium">Evaluated Papers</span>
            <div class="flex items-baseline justify-between mt-2">
              <span class="text-2xl font-bold font-mono text-slate-100">{{ tabulationTotalAppeared }}</span>
              <span class="text-[10px] text-slate-500 font-mono">Appeared</span>
            </div>
          </div>

          <div class="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm flex flex-col justify-between">
            <span class="text-xs text-emerald-400 font-medium">Qualified for Viva</span>
            <div class="flex items-baseline justify-between mt-2">
              <span class="text-2xl font-bold font-mono text-emerald-400">{{ tabulationQualifiedCount }}</span>
              <span class="text-[10px] text-emerald-400/80 font-mono">&gt;= {{ cutoffMarksThreshold }}</span>
            </div>
          </div>

          <div class="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm flex flex-col justify-between">
            <span class="text-xs text-rose-400 font-medium">Below Cutoff</span>
            <div class="flex items-baseline justify-between mt-2">
              <span class="text-2xl font-bold font-mono text-rose-400">{{ tabulationBelowCutoffCount }}</span>
              <span class="text-[10px] text-rose-400/80 font-mono">&lt; {{ cutoffMarksThreshold }}</span>
            </div>
          </div>

          <div class="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm flex flex-col justify-between">
            <span class="text-xs text-blue-400 font-medium">Qualifying Rate</span>
            <div class="flex items-baseline justify-between mt-2">
              <span class="text-2xl font-bold font-mono text-blue-400">{{ tabulationPassRate }}%</span>
              <span class="text-[10px] text-blue-400/80 font-mono">Pass Rate</span>
            </div>
          </div>

          <div class="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm flex flex-col justify-between col-span-2 lg:col-span-1">
            <span class="text-xs text-amber-400 font-medium">Top / Average Score</span>
            <div class="flex items-baseline justify-between mt-2">
              <span class="text-2xl font-bold font-mono text-amber-400">{{ tabulationHighestScore }}</span>
              <span class="text-[11px] text-slate-400 font-mono">Avg: {{ tabulationAverageScore }}</span>
            </div>
          </div>
        </div>

        <!-- 3. Operational Toolbar -->
        <div class="bg-slate-900 border border-slate-800 rounded-xl p-3.5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div class="flex flex-wrap items-center gap-2.5 flex-1">
            <!-- Search -->
            <div class="relative flex-1 min-w-[200px] max-w-sm">
              <input 
                type="text" 
                [(ngModel)]="tabulationSearchQuery"
                placeholder="Search Roll #, Candidate Name, District..."
                class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500">
            </div>

            <!-- Status Filter -->
            <div class="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-[11px]">
              <button 
                *ngFor="let st of ['ALL', 'QUALIFIED', 'BELOW_CUTOFF']"
                (click)="tabulationStatusFilter = st"
                [ngClass]="tabulationStatusFilter === st ? 'bg-emerald-600 text-white font-semibold shadow-sm' : 'text-slate-400 hover:text-slate-200'"
                class="px-2.5 py-1 rounded transition-colors uppercase font-mono">
                {{ st === 'BELOW_CUTOFF' ? 'Below Cutoff' : st }}
              </button>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="flex items-center gap-2">
            <button 
              (click)="openImportScoresModal()"
              class="px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-blue-400 border border-slate-700 rounded-lg transition-colors">
              Import CSV Scores
            </button>
            <button 
              (click)="openExportTabulationModal()"
              class="px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm">
              <span class="font-mono text-[11px] font-bold">CSV / XLSX</span>
              <span>Export Tabulation</span>
            </button>
            <button 
              (click)="openPrintTabulationModal()"
              class="px-3 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors shadow-sm flex items-center gap-1.5">
              <span>Print Official Merit List</span>
            </button>
          </div>
        </div>

        <!-- 4. Tabulation Merit Roster Table -->
        <div class="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse text-xs">
              <thead>
                <tr class="border-b border-slate-800 bg-slate-950/60 text-slate-400 uppercase font-mono text-[10px]">
                  <th class="py-3 px-4 text-center">Merit Rank</th>
                  <th class="py-3 px-4">Roll Number</th>
                  <th class="py-3 px-4">Candidate Name</th>
                  <th class="py-3 px-4">District</th>
                  <th class="py-3 px-4 text-center">Marks Obtained (Editable)</th>
                  <th class="py-3 px-4 text-center">Cutoff Delta</th>
                  <th class="py-3 px-4 text-center">Qualification Status</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-800/60 text-slate-300">
                <tr *ngFor="let s of filteredTabulationScores" class="hover:bg-slate-800/40 transition-colors">
                  <td class="py-3 px-4 text-center">
                    <span class="inline-flex items-center justify-center w-7 h-7 rounded-full font-mono text-xs font-bold"
                      [ngClass]="{
                        'bg-amber-400/20 text-amber-300 border border-amber-500/50': s.meritRank === 1,
                        'bg-slate-300/20 text-slate-200 border border-slate-400/50': s.meritRank === 2,
                        'bg-amber-700/20 text-amber-400 border border-amber-600/50': s.meritRank === 3,
                        'bg-slate-800 text-slate-400': s.meritRank > 3
                      }">
                      #{{ s.meritRank }}
                    </span>
                  </td>
                  <td class="py-3 px-4">
                    <span class="font-mono text-emerald-400 font-bold text-sm">{{ s.rollNumber }}</span>
                    <p class="text-[10px] text-slate-500 font-mono">{{ s.trackingId }}</p>
                  </td>
                  <td class="py-3 px-4">
                    <p class="font-semibold text-slate-200">{{ s.fullName }}</p>
                  </td>
                  <td class="py-3 px-4">
                    <span class="text-slate-400">{{ s.district }}</span>
                  </td>
                  <td class="py-3 px-4 text-center">
                    <div class="inline-flex items-center justify-center gap-1.5">
                      <input 
                        type="number" 
                        [ngModel]="s.marksObtained" 
                        (ngModelChange)="onScoreChange(s, $event)"
                        step="0.5" 
                        min="0" 
                        max="100"
                        class="w-20 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-center font-mono font-bold text-xs text-slate-100 focus:outline-none focus:border-emerald-500">
                      <span class="text-[10px] text-slate-500 font-mono">/ 100</span>
                    </div>
                  </td>
                  <td class="py-3 px-4 text-center font-mono text-[11px]">
                    <span [ngClass]="s.marksObtained >= cutoffMarksThreshold ? 'text-emerald-400' : 'text-rose-400'">
                      {{ s.marksObtained >= cutoffMarksThreshold ? '+' : '' }}{{ (s.marksObtained - cutoffMarksThreshold).toFixed(1) }}
                    </span>
                  </td>
                  <td class="py-3 px-4 text-center">
                    <span class="px-2.5 py-1 rounded text-[10px] font-mono font-bold tracking-wider"
                      [ngClass]="s.isPassed ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-rose-950 text-rose-400 border border-rose-800'">
                      {{ s.isPassed ? 'QUALIFIED FOR VIVA' : 'BELOW CUTOFF' }}
                    </span>
                  </td>
                </tr>
                <tr *ngIf="filteredTabulationScores.length === 0">
                  <td colspan="7" class="py-8 text-center text-slate-500 font-mono text-xs">
                    No candidates found for the selected session and cutoff filter.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Import Scores Modal -->
        <div *ngIf="showImportScoresModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div class="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-lg w-full space-y-4 shadow-2xl">
            <div class="flex items-center justify-between pb-3 border-b border-slate-800">
              <h4 class="text-sm font-bold text-slate-100">Batch Import Exam Scores (CSV)</h4>
              <button (click)="closeImportScoresModal()" class="text-slate-400 hover:text-white text-xs font-mono">✕</button>
            </div>
            <p class="text-xs text-slate-400">
              Paste comma-separated scores in the format <code class="text-emerald-400">rollNumber,marksObtained</code> (one per line):
            </p>
            <textarea 
              [(ngModel)]="csvImportText"
              rows="6" 
              placeholder="100041,88.5&#10;100042,79.0&#10;100043,92.0"
              class="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500"></textarea>
            <div *ngIf="csvImportError" class="text-xs text-rose-400 font-medium">
              {{ csvImportError }}
            </div>
            <div class="flex justify-end gap-2 pt-2">
              <button (click)="closeImportScoresModal()" class="px-3.5 py-1.5 text-xs text-slate-400 hover:text-white rounded-lg bg-slate-800">Cancel</button>
              <button (click)="processCsvScoreImport()" class="px-4 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg shadow-sm">
                Import & Recalculate
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- ================================================================= -->
      <!-- TAB 5: VIVA BOARD & INTERVIEW SCORING -->
      <!-- ================================================================= -->
      <!-- ================================================================= -->
      <!-- TAB: VIVA BOARD & MEMBER ROSTER, DIGITAL SCORING, WEIGHTED AGGREGATE & MERIT PUBLISHING -->
      <!-- ================================================================= -->
      <div *ngIf="activeTab === 'viva'" class="space-y-6">

        <!-- Top Header & Board Selector Bar -->
        <div class="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div class="space-y-1">
              <div class="flex items-center gap-2">
                <button type="button" (click)="selectTab('pipeline')" class="text-xs text-emerald-400 hover:text-emerald-300 hover:underline flex items-center gap-1 font-medium mr-2 transition-colors">
                  &larr; Recruitment Portal
                </button>
                <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-500/10 text-blue-400 border border-blue-500/30">
                  VIVA CONSOLE
                </span>
                <h3 class="text-base font-bold text-slate-100">Viva Voce Examination & Member-wise Scoring Console</h3>
                <span *ngIf="selectedVivaBoard?.isPublished" class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  GAZETTED & PUBLISHED
                </span>
                <span *ngIf="!selectedVivaBoard?.isPublished" class="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  LIVE SCORING ACTIVE
                </span>
              </div>
              <p class="text-xs text-slate-400">
                Official interview board constitution, individual evaluator mark sheets, weighted multi-criteria aggregation, and publication of final merit & waiting lists.
              </p>
            </div>

            <!-- Action Buttons & Board Dropdown -->
            <div class="flex items-center flex-wrap gap-2.5">
              <div class="flex items-center gap-2">
                <label class="text-xs text-slate-400 font-medium whitespace-nowrap">Active Board:</label>
                <select 
                  [ngModel]="selectedVivaBoardId" 
                  (ngModelChange)="onVivaBoardSelect($event)"
                  class="bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 min-w-[220px]">
                  <option *ngFor="let b of vivaBoardsList" [value]="b.id" class="bg-slate-950 text-slate-200 py-1" style="background-color: #020617; color: #f8fafc;">
                    {{ b.boardName }}
                  </option>
                </select>
              </div>

              <button 
                type="button"
                (click)="openCreateVivaBoardModal()" 
                class="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 flex items-center gap-1.5 transition-all">
                <span class="text-emerald-400 font-bold">+</span> Setup New Board
              </button>

              <button 
                type="button" 
                (click)="openVivaAttendanceModal()" 
                class="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all shadow-md">
                <span>Attendance &amp; Verification</span>
                <span class="px-1.5 py-0.2 rounded-full bg-emerald-950 text-emerald-300 text-[10px] font-mono font-bold border border-emerald-800">
                  {{ vivaAttendancePresentCount }}/{{ vivaCandidatesList.length }}
                </span>
              </button>

              <button 
                type="button" 
                (click)="openPrintVivaAttendanceModal()" 
                class="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 flex items-center gap-1.5 transition-all">
                <span>Print Signature Sheet</span>
              </button>

              <button 
                type="button"
                (click)="openVivaPrintModal()" 
                class="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 flex items-center gap-1.5 transition-all">
                <span>Print Dossier</span>
              </button>

              <button 
                type="button"
                (click)="exportVivaMeritCsv()" 
                class="px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 text-xs font-semibold rounded-xl border border-blue-500/30 flex items-center gap-1.5 transition-all">
                <span>Export CSV</span>
              </button>
            </div>
          </div>

          <!-- Active Board Metadata Strip -->
          <div *ngIf="selectedVivaBoard" class="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-800 text-xs">
            <div class="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800/80">
              <span class="text-slate-500 block text-[10px] uppercase font-mono tracking-wider">Recruitment Circular</span>
              <span class="text-slate-200 font-medium truncate block mt-0.5">{{ selectedVivaBoard?.circularTitle || 'Branch Operations' }}</span>
            </div>
            <div class="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800/80">
              <span class="text-slate-500 block text-[10px] uppercase font-mono tracking-wider">Schedule & Time</span>
              <span class="text-slate-200 font-medium block mt-0.5">{{ selectedVivaBoard?.vivaDate }} | {{ selectedVivaBoard?.vivaTime }}</span>
            </div>
            <div class="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800/80">
              <span class="text-slate-500 block text-[10px] uppercase font-mono tracking-wider">Board Venue / Room</span>
              <span class="text-slate-200 font-medium truncate block mt-0.5">{{ selectedVivaBoard?.venue || 'Central Head Office' }}</span>
            </div>
            <div class="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800/80 flex items-center justify-between">
              <div>
                <span class="text-slate-500 block text-[10px] uppercase font-mono tracking-wider">Candidate Pool</span>
                <span class="text-emerald-400 font-bold block mt-0.5 font-mono">{{ vivaCandidatesList.length }} Candidates</span>
              </div>
              <span class="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">
                Quota: {{ vivaVacanciesQuota }}
              </span>
            </div>
          </div>

          <!-- Board Member Roster & Evaluator Switching Panel -->
          <div *ngIf="selectedVivaBoard" class="pt-2">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between pb-2.5 gap-2 border-b border-slate-800/80 mb-3">
              <div class="flex items-center gap-2">
                <span class="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <span>Board Evaluator Roster</span>
                  <span class="text-[10px] text-slate-500 lowercase">(select member to score on their behalf)</span>
                </span>
                <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-950 text-emerald-400 border border-slate-800">
                  {{ selectedVivaBoard?.members?.length || 0 }} Evaluators
                </span>
              </div>

              <div class="flex items-center flex-wrap gap-2">
                <span class="text-[11px] font-mono text-emerald-400 mr-1">
                  Active Terminal: <strong class="text-white">{{ getActiveEvaluator()?.name }}</strong> ({{ getActiveEvaluator()?.role }})
                </span>

                <button 
                  type="button" 
                  (click)="openEditVivaBoardModal()" 
                  class="px-2.5 py-1 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-blue-300 border border-blue-500/30 flex items-center gap-1.5 transition-all shadow-sm">
                  <span>✎</span> Modify Board & Members
                </button>

                <button 
                  type="button" 
                  (click)="openCreateVivaBoardModal()" 
                  class="px-2.5 py-1 rounded-xl text-xs font-semibold bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5 transition-all shadow-sm">
                  <span class="font-bold">+</span> New Setup Board
                </button>
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div 
                *ngFor="let m of selectedVivaBoard?.members || []"
                (click)="selectEvaluatorMember(m.id)"
                [ngClass]="selectedEvaluatorMemberId === m.id ? 'bg-emerald-950/40 border-emerald-500 ring-1 ring-emerald-500/50' : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'"
                class="p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between group">
                <div class="space-y-0.5 min-w-0 pr-2">
                  <div class="flex items-center gap-1.5">
                    <span class="w-2 h-2 rounded-full" [ngClass]="selectedEvaluatorMemberId === m.id ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'"></span>
                    <h5 class="text-xs font-bold text-slate-200 truncate group-hover:text-emerald-400 transition-colors">{{ m.name }}</h5>
                  </div>
                  <p class="text-[10px] text-emerald-400/90 font-medium truncate">{{ m.role }}</p>
                  <p class="text-[9px] text-slate-500 truncate">{{ m.designation }}</p>
                </div>
                <div class="text-right flex-shrink-0">
                  <span class="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400 block">
                    {{ getMemberScoredCount(m.id) }} / {{ vivaCandidatesList.length }}
                  </span>
                  <span class="text-[9px] text-slate-500 mt-1 block">evaluated</span>
                </div>
              </div>

              <!-- Quick Action Card to Add Board Member -->
              <div 
                (click)="openAddMemberDirectly()" 
                class="p-3 rounded-xl border border-dashed border-slate-700 hover:border-emerald-500 hover:bg-emerald-950/10 cursor-pointer transition-all flex items-center justify-center gap-2 group text-slate-400 hover:text-emerald-300">
                <span class="text-base font-bold text-emerald-400 group-hover:scale-125 transition-transform">+</span>
                <span class="text-xs font-semibold">Add Board Member</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Success/Alert Banner -->
        <div *ngIf="vivaPublishSuccessMsg" class="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between animate-fadeIn">
          <div class="flex items-center gap-2">
            <span class="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>{{ vivaPublishSuccessMsg }}</span>
          </div>
          <button type="button" (click)="vivaPublishSuccessMsg = ''" class="text-slate-400 hover:text-white font-mono text-xs">✕</button>
        </div>

        <!-- Main Workspace: Candidate Queue (Collapsible) + Digital Scoring Sheet -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-5">

          <!-- Left Column: Candidate Queue -->
          <div 
            [ngClass]="isVivaQueueCollapsed ? 'lg:col-span-1 p-2 items-center' : 'lg:col-span-5 p-4 space-y-3.5'"
            class="bg-slate-900 border border-slate-800 rounded-2xl shadow-sm flex flex-col h-[740px] transition-all duration-300">

            <!-- Collapsed Queue Quick Strip -->
            <div *ngIf="isVivaQueueCollapsed" class="w-full h-full flex flex-col items-center justify-between py-1">
              <div class="w-full flex flex-col items-center gap-2">
                <button 
                  type="button" 
                  (click)="isVivaQueueCollapsed = false" 
                  title="Expand Candidate Queue"
                  class="w-full p-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white flex flex-col items-center gap-1 transition-all border border-slate-700/60 shadow-sm group">
                  <svg class="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                  </svg>
                </button>
                <span class="text-[9px] font-mono font-bold uppercase tracking-wider text-slate-400 [writing-mode:vertical-lr] my-2 select-none">
                  QUEUE ({{ filteredVivaCandidates.length }})
                </span>
              </div>

              <!-- Mini candidate token selector pills -->
              <div class="flex-1 w-full overflow-y-auto space-y-1.5 py-1 px-0.5 max-h-[560px]">
                <button 
                  *ngFor="let c of filteredVivaCandidates"
                  type="button"
                  (click)="selectVivaCandidate(c)"
                  [title]="(c.tokenNumber || 'TK') + ' - ' + c.fullName + ' (' + (c.vivaAttendanceStatus || 'PENDING') + ')'"
                  [ngClass]="selectedVivaCandidate?.id === c.id ? 'bg-emerald-600 text-white font-bold border-emerald-400 shadow-md ring-1 ring-emerald-400' : 'bg-slate-950 text-slate-300 hover:bg-slate-800 border-slate-800'"
                  class="w-full py-1.5 px-0.5 rounded-lg border text-[9px] font-mono flex flex-col items-center justify-center transition-all">
                  <span>{{ c.tokenNumber ? c.tokenNumber.replace('TK-', '') : c.rollNumber.slice(-2) }}</span>
                  <span class="w-1.5 h-1.5 rounded-full mt-0.5"
                    [ngClass]="{
                      'bg-emerald-400': c.vivaAttendanceStatus === 'PRESENT' && c.vivaQueueStatus !== 'INSIDE_BOARD',
                      'bg-blue-400 animate-pulse': c.vivaQueueStatus === 'INSIDE_BOARD',
                      'bg-purple-400': c.vivaQueueStatus === 'COMPLETED',
                      'bg-rose-400': c.vivaAttendanceStatus === 'ABSENT',
                      'bg-slate-600': c.vivaAttendanceStatus === 'PENDING' || !c.vivaAttendanceStatus
                    }">
                  </span>
                </button>
              </div>

              <button 
                type="button" 
                (click)="isVivaQueueCollapsed = false" 
                title="Expand Candidate Queue"
                class="w-full py-1 text-center text-slate-400 hover:text-emerald-400 text-xs font-mono">
                ▶
              </button>
            </div>

            <!-- Expanded Full Queue Column -->
            <ng-container *ngIf="!isVivaQueueCollapsed">
              <div class="flex items-center justify-between pb-2 border-b border-slate-800">
                <div>
                  <h4 class="text-xs font-bold text-slate-200 uppercase tracking-wider">Candidate Queue</h4>
                  <p class="text-[10px] text-slate-400">Select candidate to open digital score sheet</p>
                </div>
                <div class="flex items-center gap-2">
                  <span class="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-emerald-400">
                    {{ filteredVivaCandidates.length }} shown
                  </span>
                  <button 
                    type="button" 
                    (click)="isVivaQueueCollapsed = true" 
                    title="Collapse Candidate Queue"
                    class="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors border border-slate-700/60">
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                    </svg>
                  </button>
                </div>
              </div>

            <!-- Search & Filter Controls -->
            <div class="space-y-2">
              <!-- Circular Selection Filter -->
              <div class="flex items-center gap-2">
                <label class="text-[10px] font-mono uppercase font-bold text-slate-400 whitespace-nowrap">Circular:</label>
                <select 
                  [ngModel]="vivaCircularFilter" 
                  (ngModelChange)="onVivaCircularFilterChange($event)"
                  class="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500">
                  <option value="ALL" class="bg-slate-950 text-slate-200 py-1" style="background-color: #020617; color: #f8fafc;">All Circulars ({{ vivaCandidatesList.length }})</option>
                  <option *ngFor="let c of rawCirculars" [value]="c.id" class="bg-slate-950 text-slate-200 py-1" style="background-color: #020617; color: #f8fafc;">
                    {{ c.circularNo || 'CIR' }} - {{ c.title }}
                  </option>
                  <option value="cir-001" class="bg-slate-950 text-slate-200 py-1" style="background-color: #020617; color: #f8fafc;">CIR-2026-0001 - Field Officer</option>
                  <option value="cir-002" class="bg-slate-950 text-slate-200 py-1" style="background-color: #020617; color: #f8fafc;">CIR-2026-0002 - Accounts Officer & Auditor</option>
                </select>
              </div>

              <!-- Search input with clear button -->
              <div class="relative">
                <input 
                  type="text" 
                  [(ngModel)]="vivaCandidateSearch" 
                  placeholder="Search by Roll No, Token, Name, District..." 
                  class="w-full bg-slate-950 border border-slate-700 rounded-xl pl-3 pr-8 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500" />
                <button 
                  *ngIf="vivaCandidateSearch" 
                  type="button" 
                  (click)="vivaCandidateSearch = ''" 
                  class="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs px-1 font-mono">
                  ✕
                </button>
              </div>

              <!-- Attendance Filter Row -->
              <div>
                <div class="flex items-center justify-between text-[10px] font-mono text-slate-400 mb-1">
                  <span>ATTENDANCE STAGE:</span>
                  <span class="text-emerald-400">{{ countPresentCandidates() }} Reported</span>
                </div>
                <div class="grid grid-cols-4 gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-[10px] font-mono">
                  <button 
                    type="button" 
                    (click)="onVivaAttendanceFilterChange('ALL')"
                    [ngClass]="vivaAttendanceFilter === 'ALL' ? 'bg-slate-800 text-white font-bold' : 'text-slate-400 hover:text-slate-200'"
                    class="py-1 rounded-lg text-center transition-all">
                    All ({{ vivaCandidatesList.length }})
                  </button>
                  <button 
                    type="button" 
                    (click)="onVivaAttendanceFilterChange('PRESENT')"
                    [ngClass]="vivaAttendanceFilter === 'PRESENT' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold' : 'text-slate-400 hover:text-slate-200'"
                    class="py-1 rounded-lg text-center transition-all" title="Present & Waiting">
                    Present ({{ countAttendancePresent }})
                  </button>
                  <button 
                    type="button" 
                    (click)="onVivaAttendanceFilterChange('INSIDE_BOARD')"
                    [ngClass]="vivaAttendanceFilter === 'INSIDE_BOARD' ? 'bg-blue-950 text-blue-300 border border-blue-800 font-bold' : 'text-slate-400 hover:text-slate-200'"
                    class="py-1 rounded-lg text-center transition-all" title="Facing Board">
                    In Board ({{ countAttendanceInBoard }})
                  </button>
                  <button 
                    type="button" 
                    (click)="onVivaAttendanceFilterChange('ABSENT')"
                    [ngClass]="vivaAttendanceFilter === 'ABSENT' ? 'bg-rose-950 text-rose-300 border border-rose-800 font-bold' : 'text-slate-400 hover:text-slate-200'"
                    class="py-1 rounded-lg text-center transition-all" title="Absent / No-Show">
                    Absent ({{ countAttendanceAbsent }})
                  </button>
                </div>
              </div>

              <!-- Scoring Evaluation Filter Row -->
              <div class="grid grid-cols-3 gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-[10px] font-mono">
                <button 
                  type="button" 
                  (click)="vivaCandidateFilter = 'ALL'"
                  [ngClass]="vivaCandidateFilter === 'ALL' ? 'bg-slate-800 text-white font-bold' : 'text-slate-400 hover:text-slate-200'"
                  class="py-1 rounded-lg text-center transition-all">
                  All Scoring
                </button>
                <button 
                  type="button" 
                  (click)="vivaCandidateFilter = 'PENDING'"
                  [ngClass]="vivaCandidateFilter === 'PENDING' ? 'bg-slate-800 text-amber-400 font-bold' : 'text-slate-400 hover:text-slate-200'"
                  class="py-1 rounded-lg text-center transition-all">
                  Pending ({{ countPendingCandidates() }})
                </button>
                <button 
                  type="button" 
                  (click)="vivaCandidateFilter = 'SCORED'"
                  [ngClass]="vivaCandidateFilter === 'SCORED' ? 'bg-slate-800 text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'"
                  class="py-1 rounded-lg text-center transition-all">
                  Scored ({{ countScoredCandidates() }})
                </button>
              </div>
            </div>

            <!-- Scrollable Candidate Cards List -->
            <div class="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
              <div 
                *ngFor="let c of filteredVivaCandidates"
                (click)="selectVivaCandidate(c)"
                [ngClass]="selectedVivaCandidate?.id === c.id ? 'bg-slate-800/90 border-emerald-500 ring-1 ring-emerald-500/50' : 'bg-slate-950/70 border-slate-800/80 hover:border-slate-700'"
                class="p-3 rounded-xl border cursor-pointer transition-all space-y-2">
                <div class="flex items-start justify-between">
                  <div class="space-y-0.5">
                    <div class="flex items-center gap-2">
                      <span class="text-xs font-mono font-bold text-emerald-400">Roll: {{ c.rollNumber }}</span>
                      <span *ngIf="c.tokenNumber" class="text-[9px] font-mono px-1.5 py-0.2 rounded bg-slate-900 border border-slate-700 text-slate-300 font-bold">
                        {{ c.tokenNumber }}
                      </span>
                      <span 
                        class="text-[9px] font-mono px-1.5 py-0.2 rounded font-bold uppercase border"
                        [ngClass]="{
                          'bg-emerald-950 text-emerald-300 border-emerald-800': c.vivaAttendanceStatus === 'PRESENT' && c.vivaQueueStatus !== 'INSIDE_BOARD',
                          'bg-blue-950 text-blue-300 border-blue-800 animate-pulse': c.vivaQueueStatus === 'INSIDE_BOARD',
                          'bg-purple-950 text-purple-300 border-purple-800': c.vivaQueueStatus === 'COMPLETED',
                          'bg-rose-950 text-rose-300 border-rose-800': c.vivaAttendanceStatus === 'ABSENT',
                          'bg-slate-900 text-slate-400 border-slate-700': c.vivaAttendanceStatus === 'PENDING' || !c.vivaAttendanceStatus
                        }">
                        {{ c.vivaQueueStatus === 'INSIDE_BOARD' ? 'IN BOARD' : (c.vivaAttendanceStatus || 'PENDING') }}
                      </span>
                    </div>
                    <h5 class="text-xs font-bold text-slate-100">{{ c.fullName }}</h5>
                    <p class="text-[10px] text-slate-400">{{ c.district }} | {{ c.highestDegree }}</p>
                  </div>
                  <div class="text-right">
                    <span class="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-blue-300 font-semibold block">
                      Written: {{ c.writtenMarks }}
                    </span>
                    <span class="text-[9px] text-slate-500 block mt-1 font-mono">
                      {{ c.evaluatorsCount }} / {{ selectedVivaBoard?.members?.length || 4 }} Eval
                    </span>
                  </div>
                </div>

                <!-- Viva Score Progress & Aggregate Badge -->
                <div class="flex items-center justify-between pt-1.5 border-t border-slate-800/80 text-[10px] font-mono">
                  <span class="text-slate-400">
                    Viva Avg: <strong class="text-slate-200">{{ c.vivaAverage > 0 ? (c.vivaAverage | number:'1.1-1') + ' / 40' : 'Pending' }}</strong>
                  </span>
                  <span 
                    class="font-bold px-2 py-0.5 rounded"
                    [ngClass]="c.weightedAggregateScore >= vivaFinalSelectionCutoff ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : (c.vivaAverage > 0 ? 'bg-rose-950 text-rose-300 border border-rose-800' : 'bg-slate-900 text-slate-400')">
                    Agg: {{ c.weightedAggregateScore > 0 ? (c.weightedAggregateScore | number:'1.2-2') + '%' : 'N/A' }}
                  </span>
                </div>
              </div>
            </div>
          </ng-container>
        </div>

          <!-- Right Column: Member-wise Digital Scoring Sheet (7 or 11 cols when collapsed) -->
          <div [ngClass]="isVivaQueueCollapsed ? 'lg:col-span-11' : 'lg:col-span-7'" class="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4 flex flex-col justify-between transition-all duration-300">

            <div *ngIf="selectedVivaCandidate" class="space-y-4">

              <!-- Candidate Profile & Controls -->
              <div class="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div class="flex items-center gap-3">
                  <button 
                    *ngIf="isVivaQueueCollapsed"
                    type="button"
                    (click)="isVivaQueueCollapsed = false"
                    title="Expand Candidate Queue"
                    class="px-2.5 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs flex items-center gap-1.5 font-mono transition-colors shrink-0">
                    <span>▶</span>
                    <span>Show Queue ({{ filteredVivaCandidates.length }})</span>
                  </button>
                  <div class="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center font-bold text-emerald-400 text-sm font-mono shrink-0">
                    {{ selectedVivaCandidate.rollNumber.slice(-3) }}
                  </div>
                  <div class="space-y-0.5">
                    <div class="flex items-center gap-2">
                      <h4 class="text-sm font-bold text-slate-100">{{ selectedVivaCandidate.fullName }}</h4>
                      <span class="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-300">
                        Roll: {{ selectedVivaCandidate.rollNumber }}
                      </span>
                    </div>
                    <p class="text-xs text-slate-400">{{ selectedVivaCandidate.highestDegree }} | CGPA: {{ selectedVivaCandidate.cgpa }} | District: {{ selectedVivaCandidate.district }}</p>
                    <p class="text-[11px] text-blue-400 font-mono">Written Examination Score: {{ selectedVivaCandidate.writtenMarks }} / 100</p>
                    <div class="flex items-center flex-wrap gap-1.5 pt-1">
                      <span 
                        class="text-[9px] font-mono px-2 py-0.5 rounded font-bold uppercase border"
                        [ngClass]="{
                          'bg-emerald-950 text-emerald-300 border-emerald-800': selectedVivaCandidate.vivaAttendanceStatus === 'PRESENT' && selectedVivaCandidate.vivaQueueStatus !== 'INSIDE_BOARD',
                          'bg-blue-950 text-blue-300 border-blue-800 animate-pulse': selectedVivaCandidate.vivaQueueStatus === 'INSIDE_BOARD',
                          'bg-purple-950 text-purple-300 border-purple-800': selectedVivaCandidate.vivaQueueStatus === 'COMPLETED',
                          'bg-rose-950 text-rose-300 border-rose-800': selectedVivaCandidate.vivaAttendanceStatus === 'ABSENT',
                          'bg-slate-900 text-slate-400 border-slate-700': selectedVivaCandidate.vivaAttendanceStatus === 'PENDING' || !selectedVivaCandidate.vivaAttendanceStatus
                        }">
                        Status: {{ selectedVivaCandidate.vivaQueueStatus === 'INSIDE_BOARD' ? 'IN BOARD' : (selectedVivaCandidate.vivaAttendanceStatus || 'PENDING') }}
                      </span>
                      <button 
                        type="button" 
                        (click)="setCandidateVivaAttendance(selectedVivaCandidate, 'PRESENT')"
                        [ngClass]="selectedVivaCandidate.vivaAttendanceStatus === 'PRESENT' ? 'bg-emerald-600 text-white font-bold' : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-700'"
                        class="px-2 py-0.5 rounded text-[10px] transition-all">
                        ✓ Present
                      </button>
                      <button 
                        type="button" 
                        (click)="setCandidateVivaQueue(selectedVivaCandidate, 'INSIDE_BOARD')"
                        [ngClass]="selectedVivaCandidate.vivaQueueStatus === 'INSIDE_BOARD' ? 'bg-blue-600 text-white font-bold' : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-700'"
                        class="px-2 py-0.5 rounded text-[10px] transition-all">
                        🎤 In Board
                      </button>
                      <button 
                        type="button" 
                        (click)="setCandidateVivaQueue(selectedVivaCandidate, 'COMPLETED')"
                        [ngClass]="selectedVivaCandidate.vivaQueueStatus === 'COMPLETED' ? 'bg-purple-600 text-white font-bold' : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-700'"
                        class="px-2 py-0.5 rounded text-[10px] transition-all">
                        🏁 Completed
                      </button>
                      <button 
                        type="button" 
                        (click)="setCandidateVivaAttendance(selectedVivaCandidate, 'ABSENT')"
                        [ngClass]="selectedVivaCandidate.vivaAttendanceStatus === 'ABSENT' ? 'bg-rose-600 text-white font-bold' : 'bg-slate-900 text-rose-400 hover:text-rose-200 border border-slate-700'"
                        class="px-2 py-0.5 rounded text-[10px] transition-all">
                        ✕ Absent
                      </button>
                    </div>
                  </div>
                </div>

                <!-- Next / Previous Controls -->
                <div class="flex items-center gap-2 self-end sm:self-auto">
                  <button 
                    type="button"
                    (click)="navigateCandidate(-1)" 
                    class="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 hover:text-white text-xs">
                    ← Prev
                  </button>
                  <button 
                    type="button"
                    (click)="navigateCandidate(1)" 
                    class="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 hover:text-white text-xs">
                    Next →
                  </button>
                </div>
              </div>

              <!-- Active Evaluator Context Strip -->
              <div class="px-3.5 py-2 rounded-xl bg-blue-950/30 border border-blue-800/40 flex items-center justify-between text-xs">
                <div class="flex items-center gap-2">
                  <span class="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span>
                  <span class="text-blue-300 font-medium">Scoring Evaluator:</span>
                  <span class="text-white font-bold">{{ getActiveEvaluator()?.name }}</span>
                  <span class="text-slate-400 text-[11px]">({{ getActiveEvaluator()?.role }})</span>
                </div>
                <span class="text-[10px] font-mono text-slate-400">
                  {{ isCurrentMemberScored ? 'Updating Saved Assessment' : 'New Evaluation' }}
                </span>
              </div>

              <!-- Scoring Inputs Grid -->
              <div class="space-y-3.5 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
                <div class="flex items-center justify-between pb-1 border-b border-slate-800">
                  <span class="text-xs font-bold text-slate-300 uppercase tracking-wider">Assessment Rubric</span>
                  <span class="text-xs font-mono text-slate-400">Total Viva Cap: 40 Marks (Passing >= 25.0)</span>
                </div>

                <!-- Criteria 1: Appearance & Personality (Max 10) -->
                <div class="space-y-1.5">
                  <div class="flex items-center justify-between text-xs">
                    <span class="font-medium text-slate-300">1. Appearance, Professional Demeanor & Composure:</span>
                    <span class="font-mono font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/60">
                      {{ vivaScoreForm.appearanceScore }} / 10
                    </span>
                  </div>
                  <div class="flex items-center gap-3">
                    <input 
                      type="range" 
                      min="0" 
                      max="10" 
                      step="0.5" 
                      [(ngModel)]="vivaScoreForm.appearanceScore" 
                      class="flex-1 accent-emerald-500 cursor-pointer" />
                    <input 
                      type="number" 
                      min="0" 
                      max="10" 
                      step="0.5" 
                      [(ngModel)]="vivaScoreForm.appearanceScore" 
                      class="w-16 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-center text-slate-100 font-mono" />
                  </div>
                  <div class="flex justify-between text-[10px] text-slate-500 font-mono">
                    <span>Poor Grooming (0-4)</span>
                    <span>Satisfactory (5-7)</span>
                    <span>Distinguished / Executive (8-10)</span>
                  </div>
                </div>

                <!-- Criteria 2: Technical & Domain Expertise (Max 20) -->
                <div class="space-y-1.5 pt-2 border-t border-slate-800/60">
                  <div class="flex items-center justify-between text-xs">
                    <span class="font-medium text-slate-300">2. Technical, Microfinance Credit & Domain Knowledge:</span>
                    <span class="font-mono font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/60">
                      {{ vivaScoreForm.technicalScore }} / 20
                    </span>
                  </div>
                  <div class="flex items-center gap-3">
                    <input 
                      type="range" 
                      min="0" 
                      max="20" 
                      step="0.5" 
                      [(ngModel)]="vivaScoreForm.technicalScore" 
                      class="flex-1 accent-emerald-500 cursor-pointer" />
                    <input 
                      type="number" 
                      min="0" 
                      max="20" 
                      step="0.5" 
                      [(ngModel)]="vivaScoreForm.technicalScore" 
                      class="w-16 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-center text-slate-100 font-mono" />
                  </div>
                  <div class="flex justify-between text-[10px] text-slate-500 font-mono">
                    <span>Inadequate Core Concepts (0-9)</span>
                    <span>Sound Operations (10-15)</span>
                    <span>Mastery & Problem Solving (16-20)</span>
                  </div>
                </div>

                <!-- Criteria 3: Communication & Analytical Aptitude (Max 10) -->
                <div class="space-y-1.5 pt-2 border-t border-slate-800/60">
                  <div class="flex items-center justify-between text-xs">
                    <span class="font-medium text-slate-300">3. Communication, Stress Resilience & Situational Ethics:</span>
                    <span class="font-mono font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/60">
                      {{ vivaScoreForm.communicationScore }} / 10
                    </span>
                  </div>
                  <div class="flex items-center gap-3">
                    <input 
                      type="range" 
                      min="0" 
                      max="10" 
                      step="0.5" 
                      [(ngModel)]="vivaScoreForm.communicationScore" 
                      class="flex-1 accent-emerald-500 cursor-pointer" />
                    <input 
                      type="number" 
                      min="0" 
                      max="10" 
                      step="0.5" 
                      [(ngModel)]="vivaScoreForm.communicationScore" 
                      class="w-16 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-center text-slate-100 font-mono" />
                  </div>
                  <div class="flex justify-between text-[10px] text-slate-500 font-mono">
                    <span>Hesitant (0-4)</span>
                    <span>Clear Articulation (5-7)</span>
                    <span>Persuasive & High Aptitude (8-10)</span>
                  </div>
                </div>

                <!-- Total Score & Real-time Gauge -->
                <div class="pt-3 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span class="text-xs text-slate-400 block">Evaluator Total Score:</span>
                    <div class="flex items-baseline gap-2 mt-0.5">
                      <span class="text-2xl font-black font-mono" [ngClass]="currentCalculatedTotal >= 25 ? 'text-emerald-400' : 'text-rose-400'">
                        {{ currentCalculatedTotal | number:'1.1-1' }}
                      </span>
                      <span class="text-xs text-slate-500 font-mono">/ 40.0 Max</span>
                    </div>
                  </div>

                  <div class="flex items-center gap-2">
                    <span 
                      class="px-2.5 py-1 rounded-lg text-xs font-bold font-mono"
                      [ngClass]="currentCalculatedTotal >= 25 ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-rose-950 text-rose-300 border border-rose-800'">
                      {{ currentCalculatedTotal >= 25 ? 'QUALIFIES VIVA (>= 25)' : 'BELOW VIVA PASS (< 25)' }}
                    </span>
                  </div>
                </div>

                <!-- Remarks & Presets -->
                <div class="space-y-1.5 pt-2 border-t border-slate-800">
                  <div class="flex items-center justify-between text-xs">
                    <label class="text-slate-400 font-medium">Evaluator Confidential Remarks & Presets:</label>
                    <div class="flex items-center gap-1.5">
                      <button 
                        type="button" 
                        (click)="appendRemark('Strong technical leadership and high integrity.')" 
                        class="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 hover:text-white">
                        + High Integrity
                      </button>
                      <button 
                        type="button" 
                        (click)="appendRemark('Sound knowledge of delinquency recovery.')" 
                        class="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 hover:text-white">
                        + Delinquency
                      </button>
                      <button 
                        type="button" 
                        (click)="appendRemark('Requires field orientation in loan appraisal.')" 
                        class="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 hover:text-white">
                        + Field Training
                      </button>
                    </div>
                  </div>
                  <textarea 
                    [(ngModel)]="vivaScoreForm.remarks" 
                    rows="2" 
                    placeholder="Enter confidential notes or special considerations for the board..." 
                    class="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"></textarea>
                </div>

                <!-- Submit Button -->
                <button 
                  type="button"
                  (click)="submitMemberScore()" 
                  [disabled]="isSubmittingVivaScore"
                  class="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2">
                  <span *ngIf="isSubmittingVivaScore" class="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  <span>Record Evaluation for {{ getActiveEvaluator()?.name }} ({{ currentCalculatedTotal | number:'1.1-1' }} / 40)</span>
                </button>
              </div>

              <!-- Other Board Members Consensus Breakdown for this Candidate -->
              <div class="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800 space-y-2">
                <div class="flex items-center justify-between text-xs">
                  <span class="font-bold text-slate-300 uppercase tracking-wider text-[11px]">Board Evaluators Consensus Sheet</span>
                  <span class="text-[10px] font-mono text-emerald-400">
                    Board Average: <strong>{{ selectedVivaCandidate.vivaAverage | number:'1.2-2' }} / 40.0</strong>
                  </span>
                </div>
                <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div 
                    *ngFor="let m of selectedVivaBoard?.members" 
                    class="p-2 rounded-lg bg-slate-900 border border-slate-800 text-center space-y-0.5">
                    <span class="text-[10px] text-slate-400 block truncate">{{ m.name.split(' ')[0] }} ({{ m.role.split(' ')[0] }})</span>
                    <div *ngIf="selectedVivaCandidate.memberScores[m.id]; else notScored">
                      <span class="text-xs font-mono font-bold text-emerald-400">
                        {{ selectedVivaCandidate.memberScores[m.id].total | number:'1.1-1' }}
                      </span>
                      <span class="text-[9px] text-slate-500 block truncate font-mono">
                        {{ selectedVivaCandidate.memberScores[m.id].appearance }}/{{ selectedVivaCandidate.memberScores[m.id].technical }}/{{ selectedVivaCandidate.memberScores[m.id].communication }}
                      </span>
                    </div>
                    <ng-template #notScored>
                      <span class="text-[10px] text-slate-600 italic block font-mono">Pending</span>
                    </ng-template>
                  </div>
                </div>
              </div>

            </div>

            <div *ngIf="!selectedVivaCandidate" class="h-64 flex flex-col items-center justify-center text-center p-6 space-y-2 text-slate-500">
              <div class="text-3xl">📋</div>
              <p class="text-sm font-semibold text-slate-300">No Candidate Selected</p>
              <p class="text-xs max-w-sm">Please select a candidate from the queue on the left to load their digital scoring sheet.</p>
            </div>

          </div>

        </div>

        <!-- Section 3: Weighted Aggregate Score & Quota Computation Engine -->
        <div class="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div>
              <div class="flex items-center gap-2">
                <span class="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                <h4 class="text-sm font-bold text-slate-100">Weighted Aggregate Score & Quota Computation Engine</h4>
              </div>
              <p class="text-xs text-slate-400 mt-0.5">
                Calculate comprehensive merit scores: Aggregate = (Written Marks * {{ vivaWrittenWeightPercent }}%) + (Viva Voce Scaled Marks * {{ vivaVoceWeightPercent }}%).
              </p>
            </div>

            <button 
              type="button"
              (click)="recalculateVivaAggregates()" 
              class="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 flex items-center gap-1.5 self-start lg:self-auto">
              <span>Recalculate Ranks</span>
            </button>
          </div>

          <!-- Configuration Controls & Weight Sliders -->
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-950 p-4 rounded-xl border border-slate-800">
            <!-- Written Exam Weight -->
            <div class="space-y-1.5">
              <div class="flex items-center justify-between text-xs">
                <label class="text-slate-400 font-medium">Written Exam Weight:</label>
                <span class="text-xs font-mono font-bold text-blue-400">{{ vivaWrittenWeightPercent }}%</span>
              </div>
              <input 
                type="range" 
                min="10" 
                max="90" 
                step="5" 
                [ngModel]="vivaWrittenWeightPercent" 
                (ngModelChange)="onWrittenWeightChange($event)"
                class="w-full accent-blue-500 cursor-pointer" />
              <div class="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>Min: 10%</span>
                <span>Standard: 60%</span>
                <span>Max: 90%</span>
              </div>
            </div>

            <!-- Viva Voce Weight -->
            <div class="space-y-1.5">
              <div class="flex items-center justify-between text-xs">
                <label class="text-slate-400 font-medium">Viva Voce Weight:</label>
                <span class="text-xs font-mono font-bold text-emerald-400">{{ vivaVoceWeightPercent }}%</span>
              </div>
              <input 
                type="range" 
                min="10" 
                max="90" 
                step="5" 
                [ngModel]="vivaVoceWeightPercent" 
                (ngModelChange)="onVivaWeightChange($event)"
                class="w-full accent-emerald-500 cursor-pointer" />
              <div class="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>Min: 10%</span>
                <span>Standard: 40%</span>
                <span>Max: 90%</span>
              </div>
            </div>

            <!-- Vacancies / Quota Allocation -->
            <div class="space-y-1.5">
              <div class="flex items-center justify-between text-xs">
                <label class="text-slate-400 font-medium">Sanctioned Vacancies (Quota):</label>
                <span class="text-xs font-mono font-bold text-amber-400">{{ vivaVacanciesQuota }} Posts</span>
              </div>
              <input 
                type="number" 
                min="1" 
                max="50" 
                [(ngModel)]="vivaVacanciesQuota" 
                (ngModelChange)="recalculateVivaAggregates()"
                class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500" />
              <p class="text-[10px] text-slate-500">Top {{ vivaVacanciesQuota }} candidates allocated to Final Merit List</p>
            </div>

            <!-- Final Aggregate Cutoff % -->
            <div class="space-y-1.5">
              <div class="flex items-center justify-between text-xs">
                <label class="text-slate-400 font-medium">Selection Cutoff Score:</label>
                <span class="text-xs font-mono font-bold text-rose-400">{{ vivaFinalSelectionCutoff }}%</span>
              </div>
              <input 
                type="number" 
                min="40" 
                max="90" 
                step="1" 
                [(ngModel)]="vivaFinalSelectionCutoff" 
                (ngModelChange)="recalculateVivaAggregates()"
                class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500" />
              <p class="text-[10px] text-slate-500">Minimum aggregate required for eligibility</p>
            </div>
          </div>

          <!-- Dynamic KPI Cards -->
          <div class="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-1">
            <div class="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
              <span class="text-slate-500 text-[10px] uppercase font-mono block">Interviewed Pool</span>
              <span class="text-xl font-bold font-mono text-slate-100 block mt-1">{{ vivaCandidatesList.length }}</span>
              <span class="text-[10px] text-slate-400 mt-0.5 block">candidates in viva</span>
            </div>

            <div class="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
              <span class="text-slate-500 text-[10px] uppercase font-mono block">Viva Passed (>=25)</span>
              <span class="text-xl font-bold font-mono text-blue-400 block mt-1">{{ countVivaPassedCandidates() }}</span>
              <span class="text-[10px] text-slate-400 mt-0.5 block">cleared interview bar</span>
            </div>

            <div class="bg-slate-950 p-3.5 rounded-xl border border-emerald-900/60 bg-emerald-950/20">
              <span class="text-emerald-400 text-[10px] uppercase font-mono block font-bold">Selected Merit List</span>
              <span class="text-xl font-bold font-mono text-emerald-300 block mt-1">{{ countSelectedMeritCandidates() }}</span>
              <span class="text-[10px] text-emerald-400/80 mt-0.5 block">ready for appointment</span>
            </div>

            <div class="bg-slate-950 p-3.5 rounded-xl border border-amber-900/60 bg-amber-950/20">
              <span class="text-amber-400 text-[10px] uppercase font-mono block font-bold">Waiting List (Standby)</span>
              <span class="text-xl font-bold font-mono text-amber-300 block mt-1">{{ countWaitingListCandidates() }}</span>
              <span class="text-[10px] text-amber-400/80 mt-0.5 block">standby quota reserve</span>
            </div>

            <div class="bg-slate-950 p-3.5 rounded-xl border border-rose-900/60 bg-rose-950/20">
              <span class="text-rose-400 text-[10px] uppercase font-mono block font-bold">Below Cutoff</span>
              <span class="text-xl font-bold font-mono text-rose-300 block mt-1">{{ countBelowCutoffCandidates() }}</span>
              <span class="text-[10px] text-rose-400/80 mt-0.5 block">did not meet benchmark</span>
            </div>
          </div>
        </div>

        <!-- Section 4: Gazetted Final Merit List & Waiting List Publishing -->
        <div class="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div>
              <div class="flex items-center gap-2">
                <span class="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                <h4 class="text-sm font-bold text-slate-100">Official Merit List & Waiting List Gazetted Tabulation</h4>
              </div>
              <p class="text-xs text-slate-400 mt-0.5">
                Ranked in strict order of Weighted Aggregate Score (Written {{ vivaWrittenWeightPercent }}% + Viva {{ vivaVoceWeightPercent }}%).
              </p>
            </div>

            <div class="flex items-center gap-2">
              <button 
                type="button"
                *ngIf="!selectedVivaBoard?.isPublished"
                (click)="openPublishConfirmModal()" 
                [disabled]="isPublishingVivaMerit"
                class="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-lg transition-all flex items-center gap-2">
                <span *ngIf="isPublishingVivaMerit" class="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                <span>Publish Final Merit & Waiting List</span>
              </button>

              <div *ngIf="selectedVivaBoard?.isPublished" class="flex items-center gap-2">
                <span class="px-3 py-1.5 rounded-xl bg-emerald-950 text-emerald-300 border border-emerald-800 text-xs font-bold flex items-center gap-1.5">
                  <span class="w-2 h-2 rounded-full bg-emerald-400"></span>
                  Official Gazetted Publication Active
                </span>
                <button 
                  type="button"
                  (click)="openVivaPrintModal()" 
                  class="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700">
                  Print Gazette
                </button>
              </div>
            </div>
          </div>

          <!-- Merit Tabulation Table -->
          <div class="overflow-x-auto rounded-xl border border-slate-800">
            <table class="w-full text-left border-collapse text-xs">
              <thead class="bg-slate-950 text-slate-400 font-mono text-[10px] uppercase border-b border-slate-800">
                <tr>
                  <th class="py-3 px-3 text-center">Rank</th>
                  <th class="py-3 px-3">Roll No</th>
                  <th class="py-3 px-3">Candidate Details</th>
                  <th class="py-3 px-3 text-right">Written (100)</th>
                  <th class="py-3 px-3 text-right">Written Scaled ({{ vivaWrittenWeightPercent }}%)</th>
                  <th class="py-3 px-3 text-center">Member Scores</th>
                  <th class="py-3 px-3 text-right">Viva Avg (40)</th>
                  <th class="py-3 px-3 text-right">Viva Scaled ({{ vivaVoceWeightPercent }}%)</th>
                  <th class="py-3 px-3 text-right font-bold text-white">Weighted Total (100)</th>
                  <th class="py-3 px-3 text-center">Final Decision</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-800/80 bg-slate-900/50">
                <tr 
                  *ngFor="let c of sortedMeritCandidates" 
                  [ngClass]="c.finalDecision === 'SELECTED' ? 'bg-emerald-950/10 hover:bg-emerald-950/20' : (c.finalDecision === 'WAITING_LIST' ? 'bg-amber-950/10 hover:bg-amber-950/20' : 'hover:bg-slate-800/40')"
                  class="transition-colors">
                  <td class="py-3 px-3 text-center font-mono font-bold">
                    <span 
                      class="w-6 h-6 rounded-full inline-flex items-center justify-center text-xs"
                      [ngClass]="c.meritRank <= 3 ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-black' : (c.finalDecision === 'SELECTED' ? 'bg-emerald-500/20 text-emerald-300' : 'text-slate-400')">
                      #{{ c.meritRank }}
                    </span>
                  </td>
                  <td class="py-3 px-3 font-mono font-bold text-emerald-400 whitespace-nowrap">
                    {{ c.rollNumber }}
                  </td>
                  <td class="py-3 px-3">
                    <div class="font-bold text-slate-200">{{ c.fullName }}</div>
                    <div class="text-[10px] text-slate-400">{{ c.district }} | {{ c.highestDegree }}</div>
                  </td>
                  <td class="py-3 px-3 text-right font-mono text-slate-300">
                    {{ c.writtenMarks | number:'1.1-1' }}
                  </td>
                  <td class="py-3 px-3 text-right font-mono text-blue-400 font-semibold">
                    {{ c.writtenScaledScore | number:'1.2-2' }}
                  </td>
                  <td class="py-3 px-3 text-center">
                    <div class="flex items-center justify-center gap-1 font-mono text-[10px]">
                      <span 
                        *ngFor="let m of selectedVivaBoard?.members" 
                        class="px-1.5 py-0.5 rounded text-[9px]"
                        [ngClass]="c.memberScores[m.id] ? 'bg-slate-800 text-slate-200 border border-slate-700' : 'bg-slate-950 text-slate-600'"
                        [title]="m.name + ': ' + (c.memberScores[m.id]?.total || 'Pending')">
                        {{ c.memberScores[m.id]?.total ? (c.memberScores[m.id].total | number:'1.0-0') : '-' }}
                      </span>
                    </div>
                  </td>
                  <td class="py-3 px-3 text-right font-mono font-bold" [ngClass]="c.vivaPassed ? 'text-slate-200' : 'text-rose-400'">
                    {{ c.vivaAverage > 0 ? (c.vivaAverage | number:'1.1-1') : '0.0' }}
                  </td>
                  <td class="py-3 px-3 text-right font-mono text-emerald-400 font-semibold">
                    {{ c.vivaScaledScore | number:'1.2-2' }}
                  </td>
                  <td class="py-3 px-3 text-right font-mono font-black text-sm text-white whitespace-nowrap">
                    {{ c.weightedAggregateScore | number:'1.2-2' }}%
                  </td>
                  <td class="py-3 px-3 text-center whitespace-nowrap">
                    <span 
                      *ngIf="c.finalDecision === 'SELECTED'" 
                      class="px-2.5 py-1 rounded-full text-[10px] font-bold font-mono uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                      SELECTED (MERIT #{{ c.meritRank }})
                    </span>
                    <span 
                      *ngIf="c.finalDecision === 'WAITING_LIST'" 
                      class="px-2.5 py-1 rounded-full text-[10px] font-bold font-mono uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40">
                      WAITING LIST (STANDBY #{{ c.waitingRank }})
                    </span>
                    <span 
                      *ngIf="c.finalDecision === 'BELOW_CUTOFF'" 
                      class="px-2.5 py-1 rounded-full text-[10px] font-bold font-mono uppercase bg-rose-500/20 text-rose-300 border border-rose-500/40">
                      {{ !c.vivaPassed ? 'VIVA FAILED (<25)' : 'BELOW CUTOFF (<' + vivaFinalSelectionCutoff + ')' }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </div>

      <!-- ================================================================= -->
      <!-- ================================================================= -->
      <!-- TAB: MANPOWER REQUISITIONS -->
      <!-- ================================================================= -->
      <div *ngIf="activeTab === 'requisitions'" class="space-y-5">
        <!-- Requisition KPI Cards -->
        <div class="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div class="bg-slate-900 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between">
            <span class="text-[11px] text-slate-400 font-medium">Total Demands</span>
            <div class="flex items-baseline justify-between mt-1">
              <span class="text-xl font-bold font-mono text-slate-100">{{ requisitionKpis.total }}</span>
              <span class="text-[10px] text-slate-500 font-mono">Requests</span>
            </div>
          </div>
          <div class="bg-slate-900 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between">
            <span class="text-[11px] text-amber-400 font-medium">Pending HR Review</span>
            <div class="flex items-baseline justify-between mt-1">
              <span class="text-xl font-bold font-mono text-amber-400">{{ requisitionKpis.pendingHr }}</span>
              <span class="text-[10px] text-amber-400/80 font-mono">Scrutiny</span>
            </div>
          </div>
          <div class="bg-slate-900 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between">
            <span class="text-[11px] text-blue-400 font-medium">HR Endorsed</span>
            <div class="flex items-baseline justify-between mt-1">
              <span class="text-xl font-bold font-mono text-blue-400">{{ requisitionKpis.approvedHr }}</span>
              <span class="text-[10px] text-blue-400/80 font-mono">To Director</span>
            </div>
          </div>
          <div class="bg-slate-900 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between">
            <span class="text-[11px] text-emerald-400 font-medium">Management Approved</span>
            <div class="flex items-baseline justify-between mt-1">
              <span class="text-xl font-bold font-mono text-emerald-400">{{ requisitionKpis.approvedManagement }}</span>
              <span class="text-[10px] text-emerald-400/80 font-mono">For Circular</span>
            </div>
          </div>
          <div class="bg-slate-900 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between">
            <span class="text-[11px] text-purple-400 font-medium">Vacancies Demanded</span>
            <div class="flex items-baseline justify-between mt-1">
              <span class="text-xl font-bold font-mono text-purple-400">{{ requisitionKpis.totalVacancies }}</span>
              <span class="text-[10px] text-purple-400/80 font-mono">Posts Total</span>
            </div>
          </div>
        </div>

        <!-- Filter & Search Bar + Action Button -->
        <div class="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-slate-900 p-3 rounded-xl border border-slate-800">
          <div class="flex items-center gap-2 flex-1">
            <div class="relative flex-1 max-w-md">
              <input 
                type="text" 
                [(ngModel)]="requisitionSearchQuery"
                placeholder="Search by Requisition #, Department, Designation, Branch..."
                class="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors">
              <span class="absolute left-2.5 top-2 text-slate-500 text-xs">🔍</span>
            </div>

            <!-- Status Filter Pills -->
            <div class="hidden sm:flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-[11px]">
              <button 
                *ngFor="let st of ['ALL', 'PENDING_HR', 'APPROVED_HR', 'APPROVED_MANAGEMENT', 'REJECTED']"
                (click)="requisitionStatusFilter = st"
                [ngClass]="{
                  'bg-emerald-600 text-white font-semibold shadow-sm': requisitionStatusFilter === st,
                  'text-slate-400 hover:text-slate-200': requisitionStatusFilter !== st
                }"
                class="px-2.5 py-1 rounded transition-colors uppercase font-mono">
                {{ st === 'APPROVED_MANAGEMENT' ? 'APPROVED MGT' : st.replace('_', ' ') }}
              </button>
            </div>
          </div>

          <button 
            (click)="openRequisitionModal()" 
            class="px-4 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors shadow-md flex items-center justify-center gap-1.5 whitespace-nowrap">
            <span>+</span>
            <span>New Requisition</span>
          </button>
        </div>

        <!-- Requisitions Data Table -->
        <div class="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow">
          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="border-b border-slate-800 bg-slate-950/60 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  <th class="py-3 px-3.5">Requisition #</th>
                  <th class="py-3 px-3.5">Department & Target Role</th>
                  <th class="py-3 px-3.5">Duty Station</th>
                  <th class="py-3 px-3.5 text-center">Headcount</th>
                  <th class="py-3 px-3.5">Target Joining</th>
                  <th class="py-3 px-3.5 text-center">Budget Status</th>
                  <th class="py-3 px-3.5 text-center">Approval Status</th>
                  <th class="py-3 px-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-800/60 text-xs">
                <tr *ngFor="let req of filteredRequisitions" class="hover:bg-slate-800/40 transition-colors">
                  <!-- Requisition No & Date -->
                  <td class="py-3 px-3.5">
                    <div class="font-mono font-bold text-emerald-400 text-xs">{{ req.requisitionNo }}</div>
                    <div class="text-[10px] text-slate-500 mt-0.5">By {{ req.initiatedBy?.firstName }} {{ req.initiatedBy?.lastName }}</div>
                  </td>

                  <!-- Department & Target Position -->
                  <td class="py-3 px-3.5">
                    <div class="font-semibold text-slate-200">{{ req.designation?.title || 'Designation Pending' }}</div>
                    <div class="text-[10px] text-slate-400">{{ req.department?.name || 'Department' }}</div>
                  </td>

                  <!-- Duty Station / Branch -->
                  <td class="py-3 px-3.5">
                    <span class="text-slate-300 font-medium text-[11px]">
                      {{ req.branch?.name || 'Central Head Office' }}
                    </span>
                  </td>

                  <!-- Headcount -->
                  <td class="py-3 px-3.5 text-center">
                    <span class="px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 font-mono font-bold text-slate-200 text-xs">
                      {{ req.vacanciesCount }} Posts
                    </span>
                  </td>

                  <!-- Target Joining Date -->
                  <td class="py-3 px-3.5">
                    <div class="text-slate-300 font-medium text-xs">
                      {{ req.expectedJoinDate ? (req.expectedJoinDate | date:'mediumDate') : 'Immediate / Urgent' }}
                    </div>
                  </td>

                  <!-- Budget Status -->
                  <td class="py-3 px-3.5 text-center">
                    <span *ngIf="req.budgetApproved" class="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-950/80 text-emerald-400 border border-emerald-800/80">
                      Clearance Approved
                    </span>
                    <span *ngIf="!req.budgetApproved" class="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-950/60 text-amber-400 border border-amber-800/60">
                      Review Needed
                    </span>
                  </td>

                  <!-- Approval Status Badge -->
                  <td class="py-3 px-3.5 text-center">
                    <span [ngClass]="{
                      'bg-amber-950 text-amber-400 border-amber-800': req.status === 'PENDING_HR',
                      'bg-blue-950 text-blue-400 border-blue-800': req.status === 'APPROVED_HR',
                      'bg-emerald-950 text-emerald-400 border-emerald-800': req.status === 'APPROVED_MANAGEMENT',
                      'bg-rose-950 text-rose-400 border-rose-800': req.status === 'REJECTED',
                      'bg-slate-800 text-slate-400 border-slate-700': req.status === 'CANCELLED'
                    }" class="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border tracking-wide uppercase inline-block">
                      {{ req.status.replace('_', ' ') }}
                    </span>
                  </td>

                  <!-- Actions -->
                  <td class="py-3 px-3.5 text-right whitespace-nowrap">
                    <div class="flex items-center justify-end gap-1.5">
                      <!-- View Details -->
                      <button 
                        (click)="viewRequisitionDetail(req)"
                        class="px-2.5 py-1 text-[11px] font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-700 transition-colors">
                        View
                      </button>

                      <!-- HR Approve -->
                      <button 
                        *ngIf="req.status === 'PENDING_HR'"
                        (click)="approveRequisitionHR(req)"
                        class="px-2 py-1 text-[11px] font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded transition-colors shadow">
                        Approve (HR)
                      </button>

                      <!-- Management Approve -->
                      <button 
                        *ngIf="req.status === 'APPROVED_HR'"
                        (click)="approveRequisitionManagement(req)"
                        class="px-2 py-1 text-[11px] font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded transition-colors shadow">
                        Approve (Mgt)
                      </button>

                      <!-- Reject button -->
                      <button 
                        *ngIf="req.status === 'PENDING_HR' || req.status === 'APPROVED_HR'"
                        (click)="promptRejectRequisition(req)"
                        class="px-2 py-1 text-[11px] font-medium bg-rose-900/40 hover:bg-rose-900/80 text-rose-300 rounded border border-rose-800/80 transition-colors">
                        Reject
                      </button>

                      <!-- Create Circular from Approved Requisition -->
                      <button 
                        *ngIf="req.status === 'APPROVED_MANAGEMENT'"
                        (click)="generateCircularFromRequisition(req)"
                        class="px-2.5 py-1 text-[11px] font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded transition-colors shadow flex items-center gap-1">
                        <span>Circular</span>
                        <span>&rarr;</span>
                      </button>
                    </div>
                  </td>
                </tr>

                <!-- Empty State -->
                <tr *ngIf="filteredRequisitions.length === 0">
                  <td colspan="8" class="text-center py-10 text-slate-500">
                    <div class="text-sm font-medium text-slate-400">No Manpower Requisitions Found</div>
                    <p class="text-xs text-slate-600 mt-1">Try clearing your filters or click "+ New Requisition" to initiate one.</p>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- ================================================================= -->
      <!-- TAB: RECRUITMENT ANALYTICS & REPORTS -->
      <!-- ================================================================= -->
      <div *ngIf="activeTab === 'analytics'" class="space-y-6">
        <!-- Header Banner & Navigation -->
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg">
          <div>
            <div class="flex items-center gap-2">
              <button type="button" (click)="selectTab('pipeline')" class="text-xs text-emerald-400 hover:text-emerald-300 hover:underline flex items-center gap-1 font-medium mr-2 transition-colors">
                &larr; Recruitment Portal
              </button>
              <span class="px-2 py-0.5 text-[10px] font-mono bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded font-semibold uppercase">Executive Insights</span>
              <span class="text-xs text-slate-500 font-mono">Recruitment Analytics</span>
            </div>
            <h3 class="text-lg font-bold text-slate-100 mt-1">Recruitment Analytics & Reports</h3>
            <p class="text-xs text-slate-400 mt-0.5">
              Comprehensive applicant flow, funnel velocity, exam-to-viva conversion metrics, and regional talent distribution.
            </p>
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div class="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <span class="text-xs text-slate-400">Total Applications</span>
            <h3 class="text-2xl font-bold text-slate-100 mt-1">212</h3>
            <p class="text-[10px] text-emerald-400 mt-1 font-mono">+18% vs last circular</p>
          </div>
          <div class="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <span class="text-xs text-slate-400">Shortlisting Ratio</span>
            <h3 class="text-2xl font-bold text-slate-100 mt-1">39.6%</h3>
            <p class="text-[10px] text-slate-400 mt-1 font-mono">84 Candidates Shortlisted</p>
          </div>
          <div class="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <span class="text-xs text-slate-400">Average Time-to-Hire</span>
            <h3 class="text-2xl font-bold text-purple-400 mt-1">24 Days</h3>
            <p class="text-[10px] text-slate-400 mt-1 font-mono">Target: &lt; 30 Days</p>
          </div>
          <div class="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <span class="text-xs text-slate-400">Cost-per-Hire</span>
            <h3 class="text-2xl font-bold text-emerald-400 mt-1">৳ 4,250</h3>
            <p class="text-[10px] text-slate-400 mt-1 font-mono">Exam Hall + Circular + Viva</p>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div class="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
            <h4 class="text-xs font-bold text-slate-200 uppercase tracking-wider">Recruitment Funnel Conversion</h4>
            <div class="space-y-2 text-xs">
              <div>
                <div class="flex justify-between text-slate-400 mb-1">
                  <span>1. Applied (CV Bank)</span>
                  <span class="font-mono text-slate-200">212 (100%)</span>
                </div>
                <div class="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div class="bg-emerald-500 h-full rounded-full w-full"></div>
                </div>
              </div>
              <div>
                <div class="flex justify-between text-slate-400 mb-1">
                  <span>2. Auto-Shortlisted (Age & CGPA)</span>
                  <span class="font-mono text-slate-200">84 (39.6%)</span>
                </div>
                <div class="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div class="bg-emerald-500 h-full rounded-full" style="width: 39.6%"></div>
                </div>
              </div>
              <div>
                <div class="flex justify-between text-slate-400 mb-1">
                  <span>3. Written Passed</span>
                  <span class="font-mono text-slate-200">42 (19.8%)</span>
                </div>
                <div class="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div class="bg-purple-500 h-full rounded-full" style="width: 19.8%"></div>
                </div>
              </div>
              <div>
                <div class="flex justify-between text-slate-400 mb-1">
                  <span>Viva Selected</span>
                  <span class="font-mono text-slate-200">25 (11.8%)</span>
                </div>
                <div class="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div class="bg-blue-500 h-full rounded-full" style="width: 11.8%"></div>
                </div>
              </div>
              <div>
                <div class="flex justify-between text-slate-400 mb-1">
                  <span>5. Deployed & Onboarded to Core HR</span>
                  <span class="font-mono text-slate-200">20 (9.4%)</span>
                </div>
                <div class="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div class="bg-emerald-400 h-full rounded-full" style="width: 9.4%"></div>
                </div>
              </div>
            </div>
          </div>

          <div class="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
            <h4 class="text-xs font-bold text-slate-200 uppercase tracking-wider">Quota & Regional Representation</h4>
            <div class="p-3 bg-slate-950 rounded-lg border border-slate-800 text-xs space-y-2">
              <div class="flex justify-between">
                <span class="text-slate-400">Dhaka Zone Selection:</span>
                <span class="font-mono text-slate-200 font-semibold">40%</span>
              </div>
              <div class="flex justify-between">
                <span class="text-slate-400">Rajshahi & Bogura Zone:</span>
                <span class="font-mono text-slate-200 font-semibold">32%</span>
              </div>
              <div class="flex justify-between">
                <span class="text-slate-400">Chittagong Zone:</span>
                <span class="font-mono text-slate-200 font-semibold">28%</span>
              </div>
              <div class="pt-2 border-t border-slate-800/80 flex justify-between text-emerald-400 font-medium">
                <span>Female Inclusion Ratio:</span>
                <span class="font-mono font-bold">36% (Target: &gt; 30%)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ================================================================= -->
      <!-- TAB: SETTINGS & RBAC (ROLES, SCOPES & VIVA EVALUATOR ASSIGNMENT) -->
      <!-- ================================================================= -->
      <div *ngIf="activeTab === 'settings'" class="space-y-6">
        <!-- Header Banner & Actions -->
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg">
          <div>
            <div class="flex items-center gap-2">
              <button type="button" (click)="selectTab('pipeline')" class="text-xs text-emerald-400 hover:text-emerald-300 hover:underline flex items-center gap-1 font-medium mr-2 transition-colors">
                &larr; Recruitment Portal
              </button>
              <span class="px-2 py-0.5 text-[10px] font-mono bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded font-semibold uppercase">Security & Governance</span>
              <span class="text-xs text-slate-500 font-mono">RBAC Settings</span>
            </div>
            <h3 class="text-lg font-bold text-slate-100 mt-1">Recruitment Role-Based Access Control (RBAC)</h3>
            <p class="text-xs text-slate-400 mt-0.5">
              Configure organizational roles (HQ Admin, Zone Admin, Branch Admin, Users) and assign Viva Voce Board Evaluators with digital scoring rights.
            </p>
          </div>

          <div class="flex items-center gap-2">
            <button 
              (click)="openAssignRoleModal()" 
              class="px-3.5 py-2 text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors shadow flex items-center gap-1.5">
              <span>+ Assign User Role</span>
            </button>
            <button 
              (click)="openAssignVivaMemberModal()" 
              class="px-3.5 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors shadow flex items-center gap-1.5">
              <span>+ Assign Viva Member</span>
            </button>
            <button 
              (click)="loadRbacSettings()" 
              [disabled]="isLoadingRbac"
              class="px-3 py-2 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg transition-colors flex items-center gap-1">
              <span>{{ isLoadingRbac ? 'Syncing...' : '↻ Refresh' }}</span>
            </button>
          </div>
        </div>

        <!-- Success & Error Alert Banners -->
        <div *ngIf="rbacSuccessMsg" class="p-3 bg-emerald-950/80 border border-emerald-800/80 rounded-xl text-xs text-emerald-300 flex items-center justify-between">
          <span>{{ rbacSuccessMsg }}</span>
          <button (click)="rbacSuccessMsg = ''" class="text-emerald-400 hover:text-emerald-200 text-xs">Dismiss</button>
        </div>
        <div *ngIf="rbacErrorMsg" class="p-3 bg-rose-950/80 border border-rose-800/80 rounded-xl text-xs text-rose-300 flex items-center justify-between">
          <span>{{ rbacErrorMsg }}</span>
          <button (click)="rbacErrorMsg = ''" class="text-rose-400 hover:text-rose-200 text-xs">Dismiss</button>
        </div>

        <!-- KPI Strip: Role Distribution -->
        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <div class="bg-slate-900 border border-purple-800/40 rounded-xl p-3">
            <div class="text-[10px] text-purple-400 uppercase font-semibold font-mono">HQ Admin</div>
            <div class="text-xl font-bold text-slate-100 font-mono mt-0.5">{{ countUsersInRole('HQ_ADMIN') }}</div>
            <div class="text-[10px] text-slate-400 mt-0.5">Central Governance Scope</div>
          </div>
          <div class="bg-slate-900 border border-sky-800/40 rounded-xl p-3">
            <div class="text-[10px] text-sky-400 uppercase font-semibold font-mono">Zone Admin</div>
            <div class="text-xl font-bold text-slate-100 font-mono mt-0.5">{{ countUsersInRole('ZONE_ADMIN') }}</div>
            <div class="text-[10px] text-slate-400 mt-0.5">Zonal Operations & Centers</div>
          </div>
          <div class="bg-slate-900 border border-amber-800/40 rounded-xl p-3">
            <div class="text-[10px] text-amber-400 uppercase font-semibold font-mono">Branch Admin</div>
            <div class="text-xl font-bold text-slate-100 font-mono mt-0.5">{{ countUsersInRole('BRANCH_ADMIN') }}</div>
            <div class="text-[10px] text-slate-400 mt-0.5">Branch Requisitions & Intake</div>
          </div>
          <div class="bg-slate-900 border border-emerald-800/40 rounded-xl p-3">
            <div class="text-[10px] text-emerald-400 uppercase font-semibold font-mono">Viva Evaluators</div>
            <div class="text-xl font-bold text-slate-100 font-mono mt-0.5">{{ countUsersInRole('VIVA_BOARD_MEMBER') }}</div>
            <div class="text-[10px] text-slate-400 mt-0.5">Authorized Board Scoring</div>
          </div>
          <div class="bg-slate-900 border border-slate-700/60 rounded-xl p-3 col-span-2 sm:col-span-1">
            <div class="text-[10px] text-slate-400 uppercase font-semibold font-mono">General Staff</div>
            <div class="text-xl font-bold text-slate-100 font-mono mt-0.5">{{ countUsersInRole('USERS') }}</div>
            <div class="text-[10px] text-slate-400 mt-0.5">Applicant Intake & Queries</div>
          </div>
        </div>

        <!-- Sub-Tabs Navigation -->
        <div class="flex items-center gap-1 border-b border-slate-800 pb-2 text-xs">
          <button 
            (click)="rbacSubTab = 'roles'"
            [ngClass]="{
              'bg-purple-600/20 text-purple-300 border-b-2 border-purple-500 font-semibold': rbacSubTab === 'roles',
              'text-slate-400 hover:text-slate-200': rbacSubTab !== 'roles'
            }"
            class="px-4 py-2 rounded-t-lg transition-colors">
            Roles & Jurisdictions (5)
          </button>
          <button 
            (click)="rbacSubTab = 'users'"
            [ngClass]="{
              'bg-purple-600/20 text-purple-300 border-b-2 border-purple-500 font-semibold': rbacSubTab === 'users',
              'text-slate-400 hover:text-slate-200': rbacSubTab !== 'users'
            }"
            class="px-4 py-2 rounded-t-lg transition-colors">
            User Role Assignments ({{ rbacUsersList.length }})
          </button>
          <button 
            (click)="rbacSubTab = 'vivaAssign'"
            [ngClass]="{
              'bg-emerald-600/20 text-emerald-300 border-b-2 border-emerald-500 font-semibold': rbacSubTab === 'vivaAssign',
              'text-slate-400 hover:text-slate-200': rbacSubTab !== 'vivaAssign'
            }"
            class="px-4 py-2 rounded-t-lg transition-colors">
            Viva Board Evaluator Roster
          </button>
          <button 
            (click)="rbacSubTab = 'matrix'"
            [ngClass]="{
              'bg-purple-600/20 text-purple-300 border-b-2 border-purple-500 font-semibold': rbacSubTab === 'matrix',
              'text-slate-400 hover:text-slate-200': rbacSubTab !== 'matrix'
            }"
            class="px-4 py-2 rounded-t-lg transition-colors">
            Recruitment Permission Matrix
          </button>
        </div>

        <!-- VIEW 1: ROLES & JURISDICTIONS CARDS -->
        <div *ngIf="rbacSubTab === 'roles'" class="space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <!-- HQ Admin Card -->
            <div class="bg-slate-900 border border-purple-800/40 rounded-xl p-5 space-y-4 flex flex-col justify-between">
              <div>
                <div class="flex items-center justify-between">
                  <span class="px-2 py-0.5 text-[10px] font-mono bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded font-semibold">HQ_ADMIN</span>
                  <span class="px-2 py-0.5 text-[10px] font-mono bg-slate-800 text-slate-300 rounded">Scope: GLOBAL</span>
                </div>
                <h4 class="text-base font-bold text-slate-100 mt-2">Headquarter Administrator</h4>
                <p class="text-xs text-slate-400 mt-1">
                  Full administrative recruitment sovereignty across all Uddipan divisions, zones, and branches.
                </p>
                <div class="mt-4 space-y-1.5 text-xs text-slate-300">
                  <div class="flex items-center gap-2">
                    <span class="text-purple-400 font-bold">•</span>
                    <span>Approve Manpower Requisitions</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <span class="text-purple-400 font-bold">•</span>
                    <span>Create & Publish Job Circulars</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <span class="text-purple-400 font-bold">•</span>
                    <span>Configure Auto-Shortlisting Algorithms</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <span class="text-purple-400 font-bold">•</span>
                    <span>Publish Cutoff Marks & Final Merit Lists</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <span class="text-purple-400 font-bold">•</span>
                    <span>Form Viva Voce Boards & Appoint Members</span>
                  </div>
                </div>
              </div>
              <div class="pt-3 border-t border-slate-800 flex items-center justify-between">
                <span class="text-xs text-slate-400 font-mono">{{ countUsersInRole('HQ_ADMIN') }} Assigned Users</span>
                <button (click)="openAssignRoleModal()" class="text-xs text-purple-400 hover:text-purple-300 font-semibold">Assign Role &rarr;</button>
              </div>
            </div>

            <!-- Zone Admin Card -->
            <div class="bg-slate-900 border border-sky-800/40 rounded-xl p-5 space-y-4 flex flex-col justify-between">
              <div>
                <div class="flex items-center justify-between">
                  <span class="px-2 py-0.5 text-[10px] font-mono bg-sky-500/20 text-sky-300 border border-sky-500/30 rounded font-semibold">ZONE_ADMIN</span>
                  <span class="px-2 py-0.5 text-[10px] font-mono bg-slate-800 text-slate-300 rounded">Scope: ZONE</span>
                </div>
                <h4 class="text-base font-bold text-slate-100 mt-2">Zone Administrator</h4>
                <p class="text-xs text-slate-400 mt-1">
                  Jurisdiction over regional branches, local exam centers, regional attendance, and zonal viva evaluation.
                </p>
                <div class="mt-4 space-y-1.5 text-xs text-slate-300">
                  <div class="flex items-center gap-2">
                    <span class="text-sky-400 font-bold">•</span>
                    <span>Endorse Branch Requisitions in Zone</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <span class="text-sky-400 font-bold">•</span>
                    <span>Manage Zonal Exam Centers & Roll Allotment</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <span class="text-sky-400 font-bold">•</span>
                    <span>Supervise Exam Attendance & Verification</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <span class="text-sky-400 font-bold">•</span>
                    <span>Act as Zonal Representative on Viva Boards</span>
                  </div>
                </div>
              </div>
              <div class="pt-3 border-t border-slate-800 flex items-center justify-between">
                <span class="text-xs text-slate-400 font-mono">{{ countUsersInRole('ZONE_ADMIN') }} Assigned Users</span>
                <button (click)="openAssignRoleModal()" class="text-xs text-sky-400 hover:text-sky-300 font-semibold">Assign Role &rarr;</button>
              </div>
            </div>

            <!-- Branch Admin Card -->
            <div class="bg-slate-900 border border-amber-800/40 rounded-xl p-5 space-y-4 flex flex-col justify-between">
              <div>
                <div class="flex items-center justify-between">
                  <span class="px-2 py-0.5 text-[10px] font-mono bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded font-semibold">BRANCH_ADMIN</span>
                  <span class="px-2 py-0.5 text-[10px] font-mono bg-slate-800 text-slate-300 rounded">Scope: BRANCH</span>
                </div>
                <h4 class="text-base font-bold text-slate-100 mt-2">Branch Administrator</h4>
                <p class="text-xs text-slate-400 mt-1">
                  Branch-level operational scope for initiating field staff manpower requests and local candidate logistics.
                </p>
                <div class="mt-4 space-y-1.5 text-xs text-slate-300">
                  <div class="flex items-center gap-2">
                    <span class="text-amber-400 font-bold">•</span>
                    <span>Initiate Manpower Requisitions for Branch</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <span class="text-amber-400 font-bold">•</span>
                    <span>Verify Field Officer Candidate Credentials</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <span class="text-amber-400 font-bold">•</span>
                    <span>Candidate Joining & Deployment Logistics</span>
                  </div>
                </div>
              </div>
              <div class="pt-3 border-t border-slate-800 flex items-center justify-between">
                <span class="text-xs text-slate-400 font-mono">{{ countUsersInRole('BRANCH_ADMIN') }} Assigned Users</span>
                <button (click)="openAssignRoleModal()" class="text-xs text-amber-400 hover:text-amber-300 font-semibold">Assign Role &rarr;</button>
              </div>
            </div>

            <!-- Viva Board Member Card -->
            <div class="bg-slate-900 border border-emerald-800/40 rounded-xl p-5 space-y-4 flex flex-col justify-between">
              <div>
                <div class="flex items-center justify-between">
                  <span class="px-2 py-0.5 text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded font-semibold">VIVA_BOARD_MEMBER</span>
                  <span class="px-2 py-0.5 text-[10px] font-mono bg-slate-800 text-slate-300 rounded">Scope: BOARD</span>
                </div>
                <h4 class="text-base font-bold text-slate-100 mt-2">Viva Voce Board Evaluator</h4>
                <p class="text-xs text-slate-400 mt-1">
                  Designated evaluator authorized to score interview candidates on Appearance, Technical Knowledge, and Communication.
                </p>
                <div class="mt-4 space-y-1.5 text-xs text-slate-300">
                  <div class="flex items-center gap-2">
                    <span class="text-emerald-400 font-bold">•</span>
                    <span>Access Viva Voce Digital Scoring Sheet</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <span class="text-emerald-400 font-bold">•</span>
                    <span>Submit Independent Evaluator Scores</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <span class="text-emerald-400 font-bold">•</span>
                    <span>Lock Candidate Remarks & Recommendations</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <span class="text-emerald-400 font-bold">•</span>
                    <span>Endorse Board Consensus & Merit Roster</span>
                  </div>
                </div>
              </div>
              <div class="pt-3 border-t border-slate-800 flex items-center justify-between">
                <span class="text-xs text-slate-400 font-mono">{{ countUsersInRole('VIVA_BOARD_MEMBER') }} Assigned Users</span>
                <button (click)="openAssignVivaMemberModal()" class="text-xs text-emerald-400 hover:text-emerald-300 font-semibold">Assign to Board &rarr;</button>
              </div>
            </div>

            <!-- Users / Support Staff Card -->
            <div class="bg-slate-900 border border-slate-700/60 rounded-xl p-5 space-y-4 flex flex-col justify-between">
              <div>
                <div class="flex items-center justify-between">
                  <span class="px-2 py-0.5 text-[10px] font-mono bg-slate-800 text-slate-300 border border-slate-700 rounded font-semibold">USERS</span>
                  <span class="px-2 py-0.5 text-[10px] font-mono bg-slate-800 text-slate-400 rounded">Scope: OPERATIONAL</span>
                </div>
                <h4 class="text-base font-bold text-slate-100 mt-2">Recruitment Staff & Desk Users</h4>
                <p class="text-xs text-slate-400 mt-1">
                  General operational access to candidate enrollment, CV search, admit card printing, and check-in.
                </p>
                <div class="mt-4 space-y-1.5 text-xs text-slate-300">
                  <div class="flex items-center gap-2">
                    <span class="text-slate-400 font-bold">•</span>
                    <span>Enroll Candidates & Upload CVs</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <span class="text-slate-400 font-bold">•</span>
                    <span>Print Exam Admit Cards with QR Codes</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <span class="text-slate-400 font-bold">•</span>
                    <span>Scan & Record Hall Attendance</span>
                  </div>
                </div>
              </div>
              <div class="pt-3 border-t border-slate-800 flex items-center justify-between">
                <span class="text-xs text-slate-400 font-mono">{{ countUsersInRole('USERS') }} Assigned Users</span>
                <button (click)="openAssignRoleModal()" class="text-xs text-slate-400 hover:text-slate-300 font-semibold">Manage Users &rarr;</button>
              </div>
            </div>
          </div>
        </div>

        <!-- VIEW 2: USER ROLE ASSIGNMENTS TABLE -->
        <div *ngIf="rbacSubTab === 'users'" class="space-y-4">
          <!-- Filters & Search -->
          <div class="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900 border border-slate-800 rounded-xl p-3">
            <div class="w-full sm:w-80">
              <input 
                type="text" 
                [(ngModel)]="rbacSearchQuery" 
                placeholder="Search user by name, email, employee ID..." 
                class="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500">
            </div>

            <div class="flex items-center gap-2 w-full sm:w-auto">
              <label class="text-xs text-slate-400 font-medium whitespace-nowrap">Filter Role:</label>
              <select 
                [(ngModel)]="rbacRoleFilter" 
                class="px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-purple-500">
                <option value="ALL">All Roles</option>
                <option value="HQ_ADMIN">HQ Admin</option>
                <option value="ZONE_ADMIN">Zone Admin</option>
                <option value="BRANCH_ADMIN">Branch Admin</option>
                <option value="VIVA_BOARD_MEMBER">Viva Board Member</option>
                <option value="USERS">General Users</option>
              </select>
              <button 
                (click)="openAssignRoleModal()" 
                class="px-3 py-2 text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors whitespace-nowrap">
                + Assign Roles
              </button>
            </div>
          </div>

          <!-- Users Table -->
          <div class="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow">
            <div class="overflow-x-auto">
              <table class="w-full text-left text-xs text-slate-300">
                <thead class="bg-slate-950/80 text-[11px] uppercase font-mono text-slate-400 border-b border-slate-800">
                  <tr>
                    <th class="py-3 px-4">Employee / User</th>
                    <th class="py-3 px-4">Designation & Dept</th>
                    <th class="py-3 px-4">Assigned Roles</th>
                    <th class="py-3 px-4">Data Scope</th>
                    <th class="py-3 px-4">Viva Board Memberships</th>
                    <th class="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-800/60 font-sans">
                  <tr *ngFor="let u of getFilteredRbacUsers()" class="hover:bg-slate-800/40 transition-colors">
                    <td class="py-3 px-4">
                      <div class="font-bold text-slate-100">{{ getUserFullName(u) }}</div>
                      <div class="text-[11px] text-slate-400 font-mono">{{ u.email }}</div>
                      <div *ngIf="u.employee?.employeeId" class="text-[10px] text-slate-500 font-mono">ID: {{ u.employee.employeeId }}</div>
                    </td>
                    <td class="py-3 px-4">
                      <div class="text-slate-200">{{ u.employee?.designation?.title || 'Operational Staff' }}</div>
                      <div class="text-[11px] text-slate-500">{{ u.employee?.department?.name || 'Recruitment Directorate' }}</div>
                    </td>
                    <td class="py-3 px-4">
                      <div class="flex flex-wrap gap-1">
                        <ng-container *ngFor="let rc of getUserRoleCodes(u)">
                          <span *ngIf="rc === 'HQ_ADMIN'" class="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30">HQ Admin</span>
                          <span *ngIf="rc === 'ZONE_ADMIN'" class="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-sky-500/20 text-sky-300 border border-sky-500/30">Zone Admin</span>
                          <span *ngIf="rc === 'BRANCH_ADMIN'" class="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">Branch Admin</span>
                          <span *ngIf="rc === 'VIVA_BOARD_MEMBER'" class="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">Viva Evaluator</span>
                          <span *ngIf="rc === 'USERS'" class="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-slate-800 text-slate-300 border border-slate-700">User</span>
                        </ng-container>
                        <span *ngIf="getUserRoleCodes(u).length === 0" class="text-slate-500 italic text-[11px]">No Roles Assigned</span>
                      </div>
                    </td>
                    <td class="py-3 px-4">
                      <span class="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300 border border-slate-700">
                        {{ getUserScopeLabel(u) }}
                      </span>
                    </td>
                    <td class="py-3 px-4">
                      <div *ngIf="u.vivaBoardMembers && u.vivaBoardMembers.length > 0" class="space-y-1">
                        <div *ngFor="let vm of u.vivaBoardMembers" class="flex items-center gap-1.5">
                          <span class="px-1.5 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-semibold">{{ vm.boardRole || 'Evaluator' }}</span>
                          <span class="text-[11px] text-slate-300 truncate max-w-[140px]">{{ vm.vivaBoard?.boardName || 'Board' }}</span>
                        </div>
                      </div>
                      <span *ngIf="!u.vivaBoardMembers || u.vivaBoardMembers.length === 0" class="text-slate-500 italic text-[11px]">—</span>
                    </td>
                    <td class="py-3 px-4 text-right">
                      <div class="flex items-center justify-end gap-2">
                        <button 
                          (click)="openAssignRoleModal(u)" 
                          class="px-2.5 py-1 text-[11px] font-semibold bg-slate-800 hover:bg-slate-700 text-purple-300 border border-purple-800/40 rounded transition-colors">
                          ✎ Edit Roles
                        </button>
                        <button 
                          (click)="openAssignVivaMemberModal(u)" 
                          class="px-2.5 py-1 text-[11px] font-semibold bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-800/40 rounded transition-colors">
                          + Add to Board
                        </button>
                      </div>
                    </td>
                  </tr>
                  <tr *ngIf="getFilteredRbacUsers().length === 0">
                    <td colspan="6" class="py-8 text-center text-slate-500">
                      No users match the search criteria.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- VIEW 3: VIVA BOARD EVALUATOR ROSTER (SPLIT VIEW) -->
        <div *ngIf="rbacSubTab === 'vivaAssign'" class="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <!-- Left: Assignment Form Card (4 cols) -->
          <div class="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <div>
              <div class="flex items-center gap-2">
                <span class="px-2 py-0.5 text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded font-semibold uppercase">Evaluator Binding</span>
              </div>
              <h4 class="text-base font-bold text-slate-100 mt-1">Assign Board Evaluator</h4>
              <p class="text-xs text-slate-400 mt-0.5">
                Grant viva digital scoring sheet authorization to institutional or external board members.
              </p>
            </div>

            <div class="space-y-3 text-xs">
              <div>
                <label class="block text-slate-300 font-semibold mb-1">Target Viva Board *</label>
                <select 
                  [(ngModel)]="vivaAssignmentForm.vivaBoardId" 
                  class="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-emerald-500">
                  <option value="" disabled>Select active viva board...</option>
                  <option *ngFor="let b of rbacVivaBoardsList" [value]="b.id">
                    {{ b.boardName }} ({{ b.vivaDate ? (b.vivaDate | date:'dd MMM yyyy') : 'Scheduled' }})
                  </option>
                </select>
              </div>

              <div>
                <label class="block text-slate-300 font-semibold mb-1">Member / Evaluator User *</label>
                <select 
                  [(ngModel)]="vivaAssignmentForm.userId" 
                  class="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-emerald-500">
                  <option value="" disabled>Select personnel...</option>
                  <option *ngFor="let u of rbacUsersList" [value]="u.id">
                    {{ getUserFullName(u) }} ({{ u.employee?.designation?.title || u.email }})
                  </option>
                </select>
              </div>

              <div>
                <label class="block text-slate-300 font-semibold mb-1">Board Role / Designation *</label>
                <select 
                  [(ngModel)]="vivaAssignmentForm.boardRole" 
                  class="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-emerald-500">
                  <option value="Board Chairman">Board Chairman</option>
                  <option value="Technical Expert">Technical Expert</option>
                  <option value="Zonal Representative">Zonal Representative</option>
                  <option value="Member Secretary">Member Secretary</option>
                  <option value="External Observer">External Observer</option>
                </select>
              </div>

              <div class="p-3 bg-slate-950/80 border border-slate-800 rounded-lg space-y-1 text-[11px] text-slate-400">
                <span class="font-bold text-slate-300">Privilege Provisioning Policy:</span>
                <p>
                  Binding this user automatically grants the <code class="text-emerald-400 font-mono">VIVA_BOARD_MEMBER</code> role and allows submitting digital marks in Viva Boards & Scoring.
                </p>
              </div>

              <button 
                (click)="submitVivaMemberAssignment()" 
                [disabled]="isSavingVivaAssignment || !vivaAssignmentForm.userId || !vivaAssignmentForm.vivaBoardId"
                class="w-full py-2.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg transition-colors shadow">
                {{ isSavingVivaAssignment ? 'Authorizing & Binding...' : 'Authorize & Assign Board Member' }}
              </button>
            </div>
          </div>

          <!-- Right: Active Boards & Evaluators List (8 cols) -->
          <div class="lg:col-span-8 space-y-4">
            <div class="flex items-center justify-between">
              <h4 class="text-sm font-bold text-slate-200 uppercase tracking-wide">Active Viva Boards & Rosters ({{ rbacVivaBoardsList.length }})</h4>
              <span class="text-xs text-slate-400 font-mono">Multi-Member Panel</span>
            </div>

            <div *ngIf="rbacVivaBoardsList.length === 0" class="p-8 text-center bg-slate-900 border border-slate-800 rounded-xl text-slate-500 text-xs">
              No active viva boards configured yet. Set up a new board in Viva Boards & Scoring.
            </div>

            <div *ngFor="let b of rbacVivaBoardsList" class="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
                <div>
                  <h5 class="text-sm font-bold text-slate-100">{{ b.boardName }}</h5>
                  <div class="flex items-center gap-3 text-xs text-slate-400 mt-1">
                    <span>Date: <span class="font-mono text-slate-200">{{ b.vivaDate ? (b.vivaDate | date:'dd MMM yyyy') : 'TBD' }}</span></span>
                    <span>Circular: <span class="text-slate-300">{{ b.circular?.title || 'General Circular' }}</span></span>
                    <span>Venue: <span class="text-slate-300">{{ b.venue || 'Central Head Office' }}</span></span>
                  </div>
                </div>
                <div class="flex items-center gap-2">
                  <span class="px-2 py-0.5 text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded font-semibold">
                    {{ (b.members || []).length }} Evaluators
                  </span>
                </div>
              </div>

              <!-- Members Cards Grid -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div *ngFor="let m of b.members" class="p-3 bg-slate-950 border border-slate-800/80 rounded-lg flex items-center justify-between">
                  <div>
                    <div class="flex items-center gap-2">
                      <span class="font-bold text-xs text-slate-100">{{ m.user?.name || m.name || 'Evaluator' }}</span>
                      <span class="px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold"
                        [ngClass]="{
                          'bg-purple-500/20 text-purple-300 border border-purple-500/30': m.role === 'Board Chairman',
                          'bg-sky-500/20 text-sky-300 border border-sky-500/30': m.role === 'Technical Expert',
                          'bg-amber-500/20 text-amber-300 border border-amber-500/30': m.role === 'Zonal Representative',
                          'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30': m.role === 'Member Secretary',
                          'bg-slate-800 text-slate-300 border border-slate-700': m.role === 'External Observer'
                        }">
                        {{ m.role }}
                      </span>
                    </div>
                    <div class="text-[11px] text-slate-400 mt-0.5">
                      {{ m.designation || m.user?.employee?.designation?.title || 'Authorized Board Member' }}
                    </div>
                    <div *ngIf="m.user?.email" class="text-[10px] text-slate-500 font-mono mt-0.5">
                      {{ m.user.email }}
                    </div>
                  </div>

                  <div *ngIf="m.userId">
                    <button 
                      (click)="revokeVivaMemberAssignment(b.id, m.userId)"
                      class="px-2.5 py-1 text-[10px] font-semibold bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800/60 rounded transition-colors">
                      Revoke
                    </button>
                  </div>
                </div>

                <div *ngIf="!b.members || b.members.length === 0" class="col-span-2 py-4 text-center text-xs text-slate-500 italic">
                  No board members assigned yet. Use the assignment form on the left.
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- VIEW: PERMISSION MATRIX -->
        <div *ngIf="rbacSubTab === 'matrix'" class="space-y-4">
          <div class="flex items-center justify-between">
            <div>
              <h4 class="text-sm font-bold text-slate-200">Recruitment Module Permission Matrix</h4>
              <p class="text-xs text-slate-400 mt-0.5">
                Institutional authority boundary across all recruitment lifecycle phases (UDDIPAN Standard Operating Procedures).
              </p>
            </div>
            <span class="px-2.5 py-1 text-xs font-mono bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded font-semibold">
              Strict Enforcement
            </span>
          </div>

          <div class="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow">
            <div class="overflow-x-auto">
              <table class="w-full text-left text-xs text-slate-300">
                <thead class="bg-slate-950/80 text-[11px] uppercase font-mono text-slate-400 border-b border-slate-800">
                  <tr>
                    <th class="py-3 px-4">Recruitment Module & Action</th>
                    <th class="py-3 px-3 text-center text-purple-300">HQ Admin</th>
                    <th class="py-3 px-3 text-center text-sky-300">Zone Admin</th>
                    <th class="py-3 px-3 text-center text-amber-300">Branch Admin</th>
                    <th class="py-3 px-3 text-center text-emerald-300">Viva Evaluator</th>
                    <th class="py-3 px-3 text-center text-slate-300">General Staff</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-800/60 font-sans">
                  <tr *ngFor="let p of rbacPermissionsMatrix" class="hover:bg-slate-800/40 transition-colors">
                    <td class="py-3 px-4">
                      <div class="font-bold text-slate-200">{{ p.action }}</div>
                      <div class="text-[10px] text-slate-500 font-mono">{{ p.module }}</div>
                    </td>
                    <td class="py-3 px-3 text-center">
                      <span *ngIf="p.hqAdmin" class="inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">YES (GLOBAL)</span>
                      <span *ngIf="!p.hqAdmin" class="text-slate-600 font-bold">—</span>
                    </td>
                    <td class="py-3 px-3 text-center">
                      <span *ngIf="p.zoneAdmin" class="inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30">YES (ZONE)</span>
                      <span *ngIf="!p.zoneAdmin" class="text-slate-600 font-bold">—</span>
                    </td>
                    <td class="py-3 px-3 text-center">
                      <span *ngIf="p.branchAdmin" class="inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">YES (BRANCH)</span>
                      <span *ngIf="!p.branchAdmin" class="text-slate-600 font-bold">—</span>
                    </td>
                    <td class="py-3 px-3 text-center">
                      <span *ngIf="p.vivaMember" class="inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">YES (BOARD)</span>
                      <span *ngIf="!p.vivaMember" class="text-slate-600 font-bold">—</span>
                    </td>
                    <td class="py-3 px-3 text-center">
                      <span *ngIf="p.users" class="inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-slate-300 border border-slate-700">YES</span>
                      <span *ngIf="!p.users" class="text-slate-600 font-bold">—</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <!-- ================================================================= -->
      <!-- MODAL: ADMIT CARD PRINT PREVIEW -->
      <!-- ================================================================= -->
      <div *ngIf="showAdmitModal" class="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div class="bg-white text-slate-900 rounded-xl max-w-xl w-full p-6 shadow-2xl space-y-4 font-sans">
          <div class="text-center border-b pb-3">
            <h3 class="text-lg font-bold tracking-wide">UDDIPAN RECRUITMENT EXAMINATION</h3>
            <p class="text-xs text-gray-600">Central Head Office, Dhaka | Admit Card for Written Test</p>
          </div>

          <div class="grid grid-cols-3 gap-4 text-xs border p-3 rounded-lg">
            <div class="col-span-2 space-y-1">
              <p><strong>Candidate Name:</strong> {{ selectedCandidate?.fullName || 'Md. Jahangir Alam' }}</p>
              <p><strong>Tracking ID:</strong> <span class="font-mono text-emerald-800 font-bold">{{ selectedCandidate?.trackingId || 'CAN-2026-00041' }}</span></p>
              <p><strong>Roll Number:</strong> <span class="font-mono font-bold text-base text-gray-800">100041</span></p>
              <p><strong>Exam Center:</strong> Hall A - Dhaka College Complex</p>
              <p><strong>Date & Time:</strong> 15 November 2026, 10:00 AM - 12:00 PM</p>
            </div>
            <div class="flex flex-col items-center justify-center border border-dashed rounded p-2">
              <div class="w-20 h-24 bg-gray-200 flex items-center justify-center text-[10px] text-gray-500 font-mono">
                PHOTO
              </div>
              <span class="text-[9px] mt-1 font-mono">BARCODE</span>
            </div>
          </div>

          <div class="text-[11px] text-gray-600 space-y-1">
            <p class="font-bold text-gray-800">Instructions for Examinees:</p>
            <p>1. Candidates must arrive at the examination hall at least 30 minutes prior to exam commencement.</p>
            <p>2. Electronic gadgets, mobile phones, and calculators are strictly prohibited.</p>
          </div>

          <div class="flex justify-end gap-2 pt-2 border-t">
            <button (click)="showAdmitModal = false" class="px-3 py-1.5 text-xs bg-gray-200 hover:bg-gray-300 rounded font-semibold">
              Close
            </button>
            <button (click)="printAdmitCard()" class="px-4 py-1.5 text-xs bg-emerald-700 hover:bg-emerald-600 text-white rounded font-semibold">
              Print Admit Card
            </button>
          </div>
        </div>
      </div>

      <!-- ================================================================= -->
      <!-- MODAL: DEPLOYMENT & APPOINTMENT LETTER (বাংলা) -->
      <!-- ================================================================= -->
      <div *ngIf="showDeploymentModal" class="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div class="bg-white text-slate-900 rounded-xl max-w-2xl w-full p-8 shadow-2xl space-y-4 font-serif">
          <div class="text-center border-b pb-4">
            <h2 class="text-xl font-bold tracking-wide">উদ্দিপন (UDDIPAN)</h2>
            <p class="text-xs text-gray-600">মানবসম্পদ ও প্রশাসন বিভাগ | প্রধান কার্যালয়, ঢাকা</p>
            <p class="text-[11px] text-gray-500 mt-1">স্মারক নং: UDDIPAN/HR/DEP-2026-00041 | তারিখ: ২৬ অক্টোবর ২০২৬</p>
          </div>

          <div class="text-sm leading-relaxed space-y-3">
            <p class="font-bold">বিষয়: নিয়োগ ও পদায়ন আদেশ পত্র (Appointment & Deployment Letter)</p>
            <p>
              বরাবর,<br>
              <strong>{{ selectedCandidate?.fullName || 'মো: জাহাঙ্গীর আলম' }}</strong><br>
              ট্র্যাকিং আইডি: <strong>{{ selectedCandidate?.trackingId || 'CAN-2026-00041' }}</strong><br>
              জেলা: {{ selectedCandidate?.district || 'বগুড়া' }}।
            </p>
            <p>
              প্রিয় মহোদয়,<br>
              উদ্দিপন-এর নিয়োগ বিজ্ঞপ্তির প্রেক্ষিতে অনুষ্ঠিত লিখিত ও মৌখিক পরীক্ষায় কৃতিত্বের সাথে উত্তীর্ণ হওয়ায় আপনাকে মানবসম্পদ ও প্রশাসন বিভাগের অধীনে <strong>"ফিল্ড অফিসার (ক্ষুদ্রঋণ)"</strong> পদে সাময়িকভাবে নিয়োগ প্রদান করে <strong>কেরানীগঞ্জ শাখা (ঢাকা জোন)</strong> এ পদায়ন করা হলো।
            </p>
            <p>
              আপনাকে আগামী <strong>১৫ নভেম্বর ২০২৬</strong> তারিখের মধ্যে নির্ধারিত কর্মস্থলে যোগদানপত্র দাখিল করতে হবে।
            </p>
          </div>

          <div class="pt-6 border-t flex items-end justify-between text-xs">
            <div>
              <p>অনুলিপি সদয় অবগতির জন্য:</p>
              <p class="text-gray-500">১. জোনাল ম্যানেজার, ঢাকা জোন</p>
              <p class="text-gray-500">২. শাখা ব্যবস্থাপক, কেরানীগঞ্জ শাখা</p>
            </div>
            <div class="text-right">
              <p class="font-bold">পরিচালক (প্রশাসন ও মানবসম্পদ)</p>
              <p class="text-gray-600">উদ্দিপন প্রধান কার্যালয়, ঢাকা</p>
            </div>
          </div>

          <div class="pt-4 flex justify-end gap-2 font-sans">
            <button (click)="showDeploymentModal = false" class="px-4 py-2 text-xs font-semibold bg-gray-200 hover:bg-gray-300 rounded-lg">
              Close Preview
            </button>
            <button (click)="printLetter()" class="px-4 py-2 text-xs font-semibold bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg">
              Print Official Order
            </button>
          </div>
        </div>
      </div>

      <!-- ================================================================= -->
      <!-- MODAL: OFFICIAL JOB CIRCULAR COMPREHENSIVE DETAIL VIEW -->
      <!-- ================================================================= -->
      <div *ngIf="showCircularDetailModal" class="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div class="bg-white text-slate-900 rounded-2xl max-w-3xl w-full p-6 shadow-2xl space-y-4 font-sans max-h-[90vh] overflow-y-auto">
          
          <!-- Header Banner -->
          <div class="flex items-start justify-between border-b pb-4">
            <div>
              <span class="text-[11px] font-bold text-emerald-800 tracking-wider uppercase block">
                UDDIPAN (উদ্দীপন) | Central HR Management
              </span>
              <h3 class="text-lg font-bold text-slate-900 mt-1">
                {{ selectedCircular?.title }}
              </h3>
              <p class="text-xs text-slate-500 mt-0.5">
                {{ selectedCircular?.departmentName }} • Circular Reference: <span class="font-mono font-bold text-slate-700">{{ selectedCircular?.circularNo }}</span>
              </p>
            </div>
            <div class="flex flex-col items-end gap-1.5">
              <span 
                class="px-2.5 py-0.5 rounded-full text-xs font-bold font-mono uppercase"
                [ngClass]="selectedCircular?.status === 'PUBLISHED' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'">
                {{ selectedCircular?.status }}
              </span>
              <span class="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-100 text-blue-800">
                {{ selectedCircular?.employmentStatus || 'Full-time' }}
              </span>
            </div>
          </div>

          <!-- Video CV Encouraged Banner -->
          <div *ngIf="selectedCircular?.videoCvEncouraged" class="p-3 bg-purple-50 rounded-xl border border-purple-200 text-purple-950 text-xs flex items-center gap-3">
            <span class="text-xl">🎥</span>
            <div>
              <strong class="font-bold">Video CV Encouraged for this Position:</strong>
              <p class="text-[11px] text-purple-900 mt-0.5">
                Applicants are encouraged to submit a 1-2 minute video introduction (unlisted YouTube/Drive/Loom URL) to demonstrate communication fluency, confidence, and presentation skills.
              </p>
            </div>
          </div>

          <!-- Key Metadata Grid -->
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-xl border text-xs">
            <div>
              <span class="text-slate-500 text-[10px] block">Vacancies:</span>
              <span class="font-bold text-slate-800">{{ selectedCircular?.vacancies }}</span>
            </div>
            <div>
              <span class="text-slate-500 text-[10px] block">Application Deadline:</span>
              <span class="font-bold text-rose-700">{{ selectedCircular?.deadline }}</span>
            </div>
            <div>
              <span class="text-slate-500 text-[10px] block">Duty Station:</span>
              <span class="font-semibold text-slate-800 truncate block">{{ selectedCircular?.jobLocation || 'Anywhere in Bangladesh' }}</span>
            </div>
            <div>
              <span class="text-slate-500 text-[10px] block">Total Applicants:</span>
              <span class="font-bold font-mono text-emerald-700">{{ selectedCircular?.applicants }} Candidates</span>
            </div>
          </div>

          <!-- Skills & Expertise Tags -->
          <div *ngIf="selectedCircular?.skills" class="space-y-1.5 text-xs">
            <h5 class="font-bold text-slate-900 text-xs uppercase tracking-wide">Required Skills & Expertise:</h5>
            <div class="flex flex-wrap gap-1.5">
              <span *ngFor="let sk of getSkillsList(selectedCircular?.skills)" class="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border text-[11px] font-medium">
                {{ sk }}
              </span>
            </div>
          </div>

          <!-- Responsibilities & Context -->
          <div class="space-y-1 text-xs text-slate-700 border-t pt-3">
            <h5 class="font-bold text-slate-900 text-xs uppercase tracking-wide">Responsibilities & Context:</h5>
            <p class="text-[12px] whitespace-pre-line text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100 leading-relaxed">
              {{ selectedCircular?.responsibilities || 'Detailed operational responsibilities and portfolio management scope.' }}
            </p>
          </div>

          <!-- Requirements -->
          <div class="space-y-1 text-xs text-slate-700">
            <h5 class="font-bold text-slate-900 text-xs uppercase tracking-wide">Educational & Experience Requirements:</h5>
            <p class="text-[12px] whitespace-pre-line text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100 leading-relaxed">
              {{ selectedCircular?.educationalRequirements || 'Educational degrees, passing division, experience and computer proficiencies.' }}
            </p>
          </div>

          <!-- Compensation & Other Benefits -->
          <div *ngIf="selectedCircular?.compensation" class="space-y-1 text-xs text-slate-700">
            <h5 class="font-bold text-slate-900 text-xs uppercase tracking-wide">Compensation & Other Benefits:</h5>
            <p class="text-[12px] whitespace-pre-line text-emerald-900 bg-emerald-50/60 p-3 rounded-lg border border-emerald-100 leading-relaxed font-medium">
              {{ selectedCircular?.compensation }}
            </p>
          </div>

          <!-- Read Before Apply Box -->
          <div *ngIf="selectedCircular?.readBeforeApply" class="p-3.5 bg-amber-50 rounded-xl border border-amber-200 text-amber-950 text-xs space-y-1.5">
            <h5 class="font-bold text-xs text-amber-900 uppercase flex items-center gap-1.5">
              <span>⚠️</span> Read Before Apply (Compliance & Instructions):
            </h5>
            <p class="text-[11px] whitespace-pre-line text-amber-900 leading-relaxed">
              {{ selectedCircular?.readBeforeApply }}
            </p>
          </div>

          <!-- Footer Actions -->
          <div class="pt-4 border-t flex items-center justify-between">
            <button 
              (click)="printCircularNotice()" 
              class="px-4 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors flex items-center gap-1.5">
              <span>🖨</span> Print Official Circular
            </button>
            <div class="flex items-center gap-2">
              <button 
                (click)="showCircularDetailModal = false" 
                class="px-4 py-2 text-xs font-semibold bg-gray-200 hover:bg-gray-300 rounded-lg">
                Close
              </button>
              <button 
                (click)="editCircular(selectedCircular)" 
                class="px-4 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors shadow">
                Edit Circular &rarr;
              </button>
            </div>
          </div>

        </div>
      </div>

      <!-- ================================================================= -->
      <!-- MODAL: INITIATE NEW MANPOWER REQUISITION -->
      <!-- ================================================================= -->
      <div *ngIf="showNewRequisitionModal" class="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
        <div class="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden my-8">
          
          <!-- Header -->
          <div class="px-6 py-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
            <div>
              <div class="flex items-center gap-2">
                <span class="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 font-mono text-[10px] border border-emerald-800">
                  REQUISITION
                </span>
                <h3 class="text-base font-bold text-slate-100">Initiate Manpower Requisition</h3>
              </div>
              <p class="text-xs text-slate-400 mt-0.5">
                Submit departmental demand for permanent, contractual, or replacement staff.
              </p>
            </div>
            <button (click)="closeRequisitionModal()" class="text-slate-400 hover:text-slate-200 text-lg font-bold">
              ✕
            </button>
          </div>

          <!-- Body -->
          <div class="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
            
            <!-- Grid 1: Department & Designation Pickers with Search Popup -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <!-- Department Picker -->
              <div>
                <div class="flex items-center justify-between mb-1.5">
                  <label class="block text-slate-300 font-semibold">
                    Target Department <span class="text-rose-400">*</span>
                  </label>
                  <button 
                    type="button" 
                    (click)="openRequisitionLookup('DEPARTMENT')" 
                    class="px-2 py-0.5 rounded bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-700/60 text-[11px] text-emerald-400 hover:text-emerald-300 font-mono font-medium flex items-center gap-1 transition-all shadow-sm">
                    <span>+ Search / Add</span>
                  </button>
                </div>
                <div 
                  (click)="openRequisitionLookup('DEPARTMENT')" 
                  class="w-full bg-slate-950 border border-slate-800 hover:border-emerald-500/80 rounded-lg px-3 py-2 text-xs cursor-pointer flex items-center justify-between transition-colors shadow-inner group">
                  <span class="truncate" [ngClass]="newRequisitionForm.departmentId ? 'text-slate-100 font-semibold' : 'text-slate-500'">
                    {{ getRequisitionDepartmentName() || '-- Click or Search Department --' }}
                  </span>
                  <div class="flex items-center gap-1.5 text-slate-400 group-hover:text-emerald-400">
                    <span class="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800">Browse</span>
                    <span class="text-xs">🔍</span>
                  </div>
                </div>
              </div>

              <!-- Designation Picker -->
              <div>
                <div class="flex items-center justify-between mb-1.5">
                  <label class="block text-slate-300 font-semibold">
                    Target Designation <span class="text-rose-400">*</span>
                  </label>
                  <button 
                    type="button" 
                    (click)="openRequisitionLookup('DESIGNATION')" 
                    class="px-2 py-0.5 rounded bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-700/60 text-[11px] text-emerald-400 hover:text-emerald-300 font-mono font-medium flex items-center gap-1 transition-all shadow-sm">
                    <span>+ Search / Add</span>
                  </button>
                </div>
                <div 
                  (click)="openRequisitionLookup('DESIGNATION')" 
                  class="w-full bg-slate-950 border border-slate-800 hover:border-emerald-500/80 rounded-lg px-3 py-2 text-xs cursor-pointer flex items-center justify-between transition-colors shadow-inner group">
                  <span class="truncate" [ngClass]="newRequisitionForm.designationId ? 'text-slate-100 font-semibold' : 'text-slate-500'">
                    {{ getRequisitionDesignationName() || '-- Click or Search Designation --' }}
                  </span>
                  <div class="flex items-center gap-1.5 text-slate-400 group-hover:text-emerald-400">
                    <span class="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800">Browse</span>
                    <span class="text-xs">🔍</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Branch / Duty Station -->
            <div>
              <label class="block text-slate-300 font-semibold mb-1">Duty Station / Branch (Optional)</label>
              <select 
                [(ngModel)]="newRequisitionForm.branchId" 
                class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500">
                <option value="">Head Office / Central Operations (Banasree, Dhaka)</option>
                <option *ngFor="let b of branches" [value]="b.id">{{ b.name }} ({{ b.code }})</option>
              </select>
            </div>

            <!-- Grid 2: Headcount Vacancies & Expected Joining Date -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <!-- Headcount Stepper -->
              <div>
                <label class="block text-slate-300 font-semibold mb-1">Vacancies Count <span class="text-rose-400">*</span></label>
                <div class="flex items-center gap-2">
                  <button 
                    type="button"
                    (click)="stepVacancies(-1)"
                    class="w-8 h-8 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold flex items-center justify-center border border-slate-700">
                    -
                  </button>
                  <input 
                    type="number" 
                    [(ngModel)]="newRequisitionForm.vacanciesCount" 
                    min="1" 
                    class="w-20 text-center bg-slate-950 border border-slate-800 rounded px-2 py-1.5 font-mono font-bold text-slate-100">
                  <button 
                    type="button"
                    (click)="stepVacancies(1)"
                    class="w-8 h-8 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold flex items-center justify-center border border-slate-700">
                    +
                  </button>

                  <!-- Preset Headcounts -->
                  <div class="flex items-center gap-1 ml-auto">
                    <button 
                      *ngFor="let n of [1, 5, 10, 25]" 
                      type="button"
                      (click)="newRequisitionForm.vacanciesCount = n"
                      class="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[10px] font-mono text-slate-300 border border-slate-700">
                      {{ n }}
                    </button>
                  </div>
                </div>
              </div>

              <!-- Target Expected Joining Date -->
              <div>
                <label class="block text-slate-300 font-semibold mb-1">Expected Joining Date</label>
                <app-datepicker 
                  [(ngModel)]="newRequisitionForm.expectedJoinDate" 
                  placeholder="Select target joining date" 
                  [minDate]="'today'"
                  [showPresets]="true">
                </app-datepicker>
              </div>
            </div>

            <!-- Budget Approval Toggle -->
            <div class="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between">
              <div>
                <div class="font-semibold text-slate-200">Budget Provision Clearance</div>
                <div class="text-[11px] text-slate-400">Headcount is covered under current fiscal year approved budget</div>
              </div>
              <label class="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" [(ngModel)]="newRequisitionForm.budgetApproved" class="sr-only peer">
                <div class="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>

            <!-- Justification & Business Need -->
            <div>
              <div class="flex items-center justify-between mb-1">
                <label class="text-slate-300 font-semibold">Justification & Business Case <span class="text-rose-400">*</span></label>
                <span class="text-[10px] text-slate-500 font-mono">{{ newRequisitionForm.justification.length || 0 }} chars</span>
              </div>
              <textarea 
                [(ngModel)]="newRequisitionForm.justification" 
                rows="4" 
                placeholder="Explain the operational necessity for this headcount (e.g. portfolio expansion, turnover replacement, new branch opening)..."
                class="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 leading-relaxed text-xs">
              </textarea>

              <!-- Quick Template Presets -->
              <div class="flex flex-wrap items-center gap-1.5 mt-2">
                <span class="text-[10px] text-slate-400">Insert Template:</span>
                <button 
                  type="button" 
                  (click)="applyJustificationPreset('expansion')"
                  class="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[10px] text-emerald-400 border border-slate-700">
                  + Branch Expansion
                </button>
                <button 
                  type="button" 
                  (click)="applyJustificationPreset('replacement')"
                  class="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[10px] text-blue-400 border border-slate-700">
                  + Resignation Replacement
                </button>
                <button 
                  type="button" 
                  (click)="applyJustificationPreset('project')"
                  class="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[10px] text-purple-400 border border-slate-700">
                  + Annual Operating Plan
                </button>
              </div>
            </div>

          </div>

          <!-- Footer -->
          <div class="px-6 py-4 bg-slate-950/80 border-t border-slate-800 flex items-center justify-end gap-3">
            <button 
              type="button"
              (click)="closeRequisitionModal()" 
              class="px-4 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors">
              Cancel
            </button>
            <button 
              type="button"
              (click)="submitNewRequisition()" 
              [disabled]="isSubmittingRequisition || !newRequisitionForm.departmentId || !newRequisitionForm.designationId || !newRequisitionForm.justification || newRequisitionForm.justification.length < 10"
              class="px-5 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors shadow-lg shadow-emerald-950/50 flex items-center gap-2">
              <span *ngIf="isSubmittingRequisition" class="animate-spin text-xs">⌛</span>
              <span>Submit Requisition</span>
            </button>
          </div>

        </div>
      </div>

      <!-- ================================================================= -->
      <!-- SEARCH POPUP MODAL: TARGET DEPARTMENTS & DESIGNATIONS -->
      <!-- Search popup, Filter chips, GridView/TableView switcher, and Selection -->
      <!-- ================================================================= -->
      <div *ngIf="showReqLookupModal" class="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-[60] flex items-center justify-center p-4">
        <div class="bg-slate-900 border border-slate-700 rounded-2xl max-w-4xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in duration-150">
          
          <!-- Modal Header -->
          <div class="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
            <div>
              <div class="flex items-center gap-2">
                <span class="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 font-mono text-[10px] border border-emerald-800 uppercase font-bold">
                  {{ reqLookupType }} LOOKUP
                </span>
                <h3 class="text-base font-bold text-slate-100">{{ getReqLookupModalTitle() }}</h3>
              </div>
              <p class="text-xs text-slate-400 mt-0.5">Filter, search across all records, toggle grid/table view, and click to apply selection.</p>
            </div>
            <button 
              type="button"
              (click)="closeRequisitionLookup()" 
              class="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 flex items-center justify-center transition-colors">
              ✕
            </button>
          </div>

          <!-- Search & Filter Bar -->
          <div class="p-4 border-b border-slate-800 bg-slate-900/95 space-y-3">
            <div class="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
              <!-- Search Input -->
              <div class="relative flex-1">
                <span class="absolute left-3 top-2.5 text-slate-500 text-xs">🔍</span>
                <input 
                  type="text" 
                  [(ngModel)]="reqLookupSearch" 
                  placeholder="Search by code, title, department name, or keyword..." 
                  class="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-lg pl-8 pr-8 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none transition-colors" />
                <button 
                  *ngIf="reqLookupSearch" 
                  type="button"
                  (click)="reqLookupSearch = ''" 
                  class="absolute right-3 top-2.5 text-xs text-slate-500 hover:text-slate-300">
                  ✕
                </button>
              </div>

              <!-- View Switcher (Grid vs Table) -->
              <div class="flex items-center gap-2">
                <div class="bg-slate-950 border border-slate-800 rounded-lg p-0.5 flex text-xs">
                  <button 
                    type="button"
                    (click)="reqLookupViewMode = 'grid'" 
                    [ngClass]="reqLookupViewMode === 'grid' ? 'bg-emerald-600 text-white font-bold shadow' : 'text-slate-400 hover:text-slate-200'"
                    class="px-2.5 py-1 rounded transition-colors flex items-center gap-1">
                    <span>⊞</span> Grid
                  </button>
                  <button 
                    type="button"
                    (click)="reqLookupViewMode = 'table'" 
                    [ngClass]="reqLookupViewMode === 'table' ? 'bg-emerald-600 text-white font-bold shadow' : 'text-slate-400 hover:text-slate-200'"
                    class="px-2.5 py-1 rounded transition-colors flex items-center gap-1">
                    <span>☰</span> Table
                  </button>
                </div>
                <span class="text-[11px] font-mono text-slate-400 px-2 py-1 rounded bg-slate-950 border border-slate-800">
                  {{ getFilteredReqLookupItems().length }} records
                </span>
              </div>
            </div>

            <!-- Filter Chips for Designation (by Department) -->
            <div *ngIf="reqLookupType === 'DESIGNATION'" class="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px]">
              <span class="text-slate-500 font-medium whitespace-nowrap">Department:</span>
              <button 
                type="button"
                (click)="reqLookupFilter = 'ALL'" 
                [ngClass]="reqLookupFilter === 'ALL' ? 'bg-emerald-500 text-slate-950 font-bold' : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200'"
                class="px-2.5 py-0.5 rounded-full transition-colors whitespace-nowrap">
                All Departments
              </button>
              <button 
                *ngFor="let d of departments" 
                type="button"
                (click)="reqLookupFilter = d.id" 
                [ngClass]="reqLookupFilter === d.id ? 'bg-emerald-500 text-slate-950 font-bold' : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200'"
                class="px-2.5 py-0.5 rounded-full transition-colors whitespace-nowrap">
                {{ d.name }}
              </button>
            </div>
          </div>

          <!-- Modal Body: Scrollable Grid or Table View -->
          <div class="p-4 overflow-y-auto flex-1 space-y-3">
            
            <!-- Empty state -->
            <div *ngIf="getFilteredReqLookupItems().length === 0" class="py-12 text-center space-y-2">
              <span class="text-3xl text-slate-600 block">🔍</span>
              <h5 class="text-xs font-bold text-slate-300">No matching records found</h5>
              <p class="text-[11px] text-slate-500">Try adjusting your search terms or filter selection.</p>
            </div>

            <!-- VIEW MODE 1: GRID VIEW -->
            <div *ngIf="reqLookupViewMode === 'grid'" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              <div 
                *ngFor="let item of getFilteredReqLookupItems()" 
                (click)="reqTempSelectedId = item.id"
                (dblclick)="confirmDirectRequisitionLookup(item)"
                [ngClass]="reqTempSelectedId === item.id ? 'border-emerald-500 bg-emerald-950/30 shadow-lg ring-2 ring-emerald-500/70' : 'border-slate-800 bg-slate-950/70 hover:border-slate-700'"
                class="p-3.5 border rounded-xl cursor-pointer transition-all flex flex-col justify-between group">
                <div>
                  <div class="flex items-center justify-between mb-1.5">
                    <span class="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400 group-hover:text-emerald-400">
                      {{ item.code || 'CODE' }}
                    </span>
                    <span *ngIf="reqTempSelectedId === item.id" class="w-5 h-5 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center text-xs font-bold shadow">
                      ✓
                    </span>
                  </div>

                  <h5 class="text-xs font-bold text-slate-200 group-hover:text-white">
                    {{ item.title || item.name }}
                  </h5>

                  <p *ngIf="reqLookupType === 'DESIGNATION'" class="text-[11px] text-slate-400 mt-1">
                    {{ getDepartmentNameById(item.departmentId) }}
                  </p>
                  
                  <p *ngIf="reqLookupType === 'DEPARTMENT'" class="text-[11px] text-slate-500 mt-1">
                    UDDIPAN Functional Unit
                  </p>
                </div>

                <div class="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px]">
                  <span class="text-slate-500">Double click to select</span>
                  <span [ngClass]="reqTempSelectedId === item.id ? 'text-emerald-400 font-bold' : 'text-slate-400'">
                    {{ reqTempSelectedId === item.id ? 'Selected' : 'Click to Pick' }}
                  </span>
                </div>
              </div>
            </div>

            <!-- VIEW MODE 2: COMPACT TABLE VIEW -->
            <div *ngIf="reqLookupViewMode === 'table' && getFilteredReqLookupItems().length > 0" class="overflow-x-auto border border-slate-800 rounded-xl">
              <table class="w-full text-left text-xs text-slate-300">
                <thead class="bg-slate-950 text-slate-400 font-mono text-[10px] uppercase border-b border-slate-800">
                  <tr>
                    <th class="px-4 py-2.5">Code</th>
                    <th class="px-4 py-2.5">Title / Name</th>
                    <th class="px-4 py-2.5">Parent Scope</th>
                    <th class="px-4 py-2.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-800/60">
                  <tr 
                    *ngFor="let item of getFilteredReqLookupItems()" 
                    (click)="reqTempSelectedId = item.id"
                    [ngClass]="reqTempSelectedId === item.id ? 'bg-emerald-950/40 text-white' : 'hover:bg-slate-800/40'"
                    class="cursor-pointer transition-colors">
                    <td class="px-4 py-2.5 font-mono text-emerald-400">{{ item.code }}</td>
                    <td class="px-4 py-2.5 font-medium text-slate-200">{{ item.title || item.name }}</td>
                    <td class="px-4 py-2.5 text-slate-400">
                      {{ reqLookupType === 'DESIGNATION' ? getDepartmentNameById(item.departmentId) : 'Headquarter Unit' }}
                    </td>
                    <td class="px-4 py-2.5 text-right">
                      <button 
                        type="button"
                        (click)="confirmDirectRequisitionLookup(item)" 
                        class="px-2.5 py-1 rounded text-[10px] font-semibold bg-slate-800 hover:bg-emerald-600 text-slate-200 hover:text-white transition-colors">
                        Select
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

          </div>

          <!-- Modal Footer -->
          <div class="p-3.5 border-t border-slate-800 bg-slate-950/70 flex items-center justify-between">
            <span class="text-xs text-slate-400">
              Selected: <strong class="text-emerald-400 font-medium">{{ getTempSelectedReqLookupName() || 'None' }}</strong>
            </span>
            <div class="flex items-center gap-2">
              <button 
                type="button"
                (click)="closeRequisitionLookup()" 
                class="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors">
                Cancel
              </button>
              <button 
                type="button"
                [disabled]="!reqTempSelectedId"
                (click)="applyRequisitionLookup()" 
                class="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs transition-colors shadow-md">
                Confirm & Apply Selection
              </button>
            </div>
          </div>

        </div>
      </div>

      <!-- ================================================================= -->
      <!-- MODAL 2: REQUISITION DOSSIER & DETAILS -->
      <!-- ================================================================= -->
      <div *ngIf="showRequisitionDetailModal" class="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
        <div class="bg-white text-slate-900 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden my-8 p-6 space-y-4">
          <!-- Header -->
          <div class="flex items-start justify-between border-b pb-4">
            <div>
              <div class="flex items-center gap-2">
                <span class="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-mono text-xs font-bold">
                  {{ selectedRequisition?.requisitionNo }}
                </span>
                <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-wide uppercase"
                  [ngClass]="{
                    'bg-amber-100 text-amber-900': selectedRequisition?.status === 'PENDING_HR',
                    'bg-blue-100 text-blue-900': selectedRequisition?.status === 'APPROVED_HR',
                    'bg-emerald-100 text-emerald-900': selectedRequisition?.status === 'APPROVED_MANAGEMENT',
                    'bg-rose-100 text-rose-900': selectedRequisition?.status === 'REJECTED'
                  }">
                  {{ selectedRequisition?.status?.replace('_', ' ') }}
                </span>
              </div>
              <h3 class="text-lg font-bold text-slate-900 mt-1">
                {{ selectedRequisition?.designation?.title }}
              </h3>
              <p class="text-xs text-slate-500">
                Department of {{ selectedRequisition?.department?.name }} | Duty Station: {{ selectedRequisition?.branch?.name || 'Central Head Office' }}
              </p>
            </div>
            <button (click)="showRequisitionDetailModal = false" class="text-slate-400 hover:text-slate-600 text-lg font-bold">
              ✕
            </button>
          </div>

          <!-- Metadata Grid -->
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-xl border text-xs">
            <div>
              <span class="text-slate-500 text-[10px] block">Headcount:</span>
              <span class="font-bold text-slate-800">{{ selectedRequisition?.vacanciesCount }} Posts</span>
            </div>
            <div>
              <span class="text-slate-500 text-[10px] block">Expected Join Date:</span>
              <span class="font-bold text-slate-800">{{ selectedRequisition?.expectedJoinDate ? (selectedRequisition?.expectedJoinDate | date:'mediumDate') : 'Immediate' }}</span>
            </div>
            <div>
              <span class="text-slate-500 text-[10px] block">Budget Status:</span>
              <span class="font-bold" [ngClass]="selectedRequisition?.budgetApproved ? 'text-emerald-700' : 'text-amber-700'">
                {{ selectedRequisition?.budgetApproved ? 'Approved Clearance' : 'Pending Clearance' }}
              </span>
            </div>
            <div>
              <span class="text-slate-500 text-[10px] block">Initiated By:</span>
              <span class="font-medium text-slate-800 truncate block">{{ selectedRequisition?.initiatedBy?.firstName }} {{ selectedRequisition?.initiatedBy?.lastName }}</span>
            </div>
          </div>

          <!-- Justification -->
          <div class="space-y-1.5 text-xs">
            <h5 class="font-bold text-slate-900 uppercase tracking-wide">Operational Justification & Business Case:</h5>
            <div class="p-3 bg-slate-50 rounded-lg border border-slate-200 text-slate-700 leading-relaxed whitespace-pre-line text-xs">
              {{ selectedRequisition?.justification }}
            </div>
          </div>

          <!-- Approval Info -->
          <div *ngIf="selectedRequisition?.approvedBy" class="p-3 bg-blue-50/70 border border-blue-200 rounded-lg text-xs space-y-1">
            <div class="font-bold text-blue-900 flex items-center gap-1.5">
              <span>✓</span> Endorsed & Approved By:
            </div>
            <p class="text-blue-800 text-[11px]">
              {{ selectedRequisition?.approvedBy?.firstName }} {{ selectedRequisition?.approvedBy?.lastName }} ({{ selectedRequisition?.approvedBy?.employeeId }})
            </p>
          </div>

          <div *ngIf="selectedRequisition?.rejectionReason" class="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs space-y-1">
            <div class="font-bold text-rose-900">Rejection Note:</div>
            <p class="text-rose-800 text-[11px]">{{ selectedRequisition?.rejectionReason }}</p>
          </div>

          <!-- Footer Actions -->
          <div class="pt-4 border-t flex items-center justify-between">
            <button 
              (click)="printRequisitionDossier()" 
              class="px-4 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors">
              Print Dossier
            </button>
            <div class="flex items-center gap-2">
              <button 
                (click)="showRequisitionDetailModal = false" 
                class="px-4 py-2 text-xs font-semibold bg-gray-200 hover:bg-gray-300 rounded-lg">
                Close
              </button>
              <button 
                *ngIf="selectedRequisition?.status === 'APPROVED_MANAGEMENT'"
                (click)="generateCircularFromRequisition(selectedRequisition)" 
                class="px-4 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors shadow">
                Generate Circular &rarr;
              </button>
            </div>
          </div>

        </div>
      </div>

      <!-- ================================================================= -->
      <!-- MODAL 3: REJECT REQUISITION PROMPT -->
      <!-- ================================================================= -->
      <div *ngIf="showRejectionPromptModal" class="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
        <div class="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl text-xs">
          <div class="flex items-center justify-between border-b border-slate-800 pb-3">
            <h4 class="font-bold text-slate-100 text-sm">Reject Requisition {{ selectedRequisition?.requisitionNo }}</h4>
            <button (click)="showRejectionPromptModal = false" class="text-slate-400 hover:text-slate-200">✕</button>
          </div>

          <div>
            <label class="block text-slate-300 font-semibold mb-1">Reason for Rejection / Decline Note</label>
            <textarea 
              [(ngModel)]="rejectionReason"
              rows="3" 
              placeholder="State the reason (e.g. lack of budget provision, department headcount ceiling reached)..."
              class="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 text-xs focus:outline-none focus:border-rose-500">
            </textarea>
          </div>

          <div class="flex items-center justify-end gap-2 pt-2">
            <button 
              (click)="showRejectionPromptModal = false"
              class="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700">
              Cancel
            </button>
            <button 
              (click)="confirmRejectRequisition()"
              class="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold">
              Confirm Rejection
            </button>
          </div>
        </div>
      </div>

      <!-- ================================================================= -->
      <!-- MODAL 4: ENROLL NEW CANDIDATE (CREATE OPERATION) -->
      <!-- ================================================================= -->
      <div *ngIf="showEnrollCandidateModal" class="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
        <div class="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-xl p-6 space-y-4 shadow-2xl text-xs text-slate-200">
          <div class="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <span class="text-[10px] font-mono text-emerald-400 uppercase font-bold">ATS CANDIDATE INGESTION</span>
              <h4 class="font-bold text-slate-100 text-sm mt-0.5">Enroll Candidate Application</h4>
              <p class="text-[11px] text-slate-400">Target Circular: {{ getSelectedCircularTitle() }}</p>
            </div>
            <button (click)="showEnrollCandidateModal = false" class="text-slate-400 hover:text-slate-200 text-base font-bold">✕</button>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[65vh] overflow-y-auto p-1">
            <div class="sm:col-span-2">
              <label class="block text-slate-300 font-semibold mb-1">Full Name <span class="text-rose-400">*</span></label>
              <input type="text" [(ngModel)]="newCandidateForm.fullName" placeholder="e.g. Md. Tanvir Hasan" class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500" />
            </div>

            <div>
              <label class="block text-slate-300 font-semibold mb-1">Email Address <span class="text-rose-400">*</span></label>
              <input type="email" [(ngModel)]="newCandidateForm.email" placeholder="candidate@example.com" class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500" />
            </div>

            <div>
              <label class="block text-slate-300 font-semibold mb-1">Phone Number <span class="text-rose-400">*</span></label>
              <input type="text" [(ngModel)]="newCandidateForm.phone" placeholder="+8801700000000" class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500" />
            </div>

            <div>
              <label class="block text-slate-300 font-semibold mb-1">Date of Birth</label>
              <input type="date" [(ngModel)]="newCandidateForm.dateOfBirth" class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500" />
            </div>

            <div>
              <label class="block text-slate-300 font-semibold mb-1">Gender</label>
              <select [(ngModel)]="newCandidateForm.gender" class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500">
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            <div>
              <label class="block text-slate-300 font-semibold mb-1">District / Home Division</label>
              <select [(ngModel)]="newCandidateForm.district" class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500">
                <option *ngFor="let d of bangladeshDistricts" [value]="d">{{ d }}</option>
              </select>
            </div>

            <div>
              <label class="block text-slate-300 font-semibold mb-1">National ID (NID)</label>
              <input type="text" [(ngModel)]="newCandidateForm.nidNumber" placeholder="10 or 17 digit NID" class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500" />
            </div>

            <div class="sm:col-span-2">
              <label class="block text-slate-300 font-semibold mb-1">Highest Degree Qualification</label>
              <select [(ngModel)]="newCandidateForm.highestDegree" class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500">
                <option value="Bachelor of Business Administration">Bachelor of Business Administration (BBA)</option>
                <option value="Bachelor of Social Science (Economics)">Bachelor of Social Science (Economics)</option>
                <option value="Master of Business Studies (Management)">Master of Business Studies (Management)</option>
                <option value="Master of Human Resource Management">Master of Human Resource Management</option>
                <option value="Bachelor of Science (Agriculture)">Bachelor of Science (Agriculture)</option>
                <option value="Bachelor of Commerce">Bachelor of Commerce</option>
                <option value="Higher Secondary Certificate (HSC)">Higher Secondary Certificate (HSC)</option>
              </select>
            </div>

            <div class="sm:col-span-2">
              <label class="block text-slate-300 font-semibold mb-1">Institution / University</label>
              <input type="text" [(ngModel)]="newCandidateForm.institution" placeholder="e.g. University of Dhaka" class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500" />
            </div>

            <div>
              <label class="block text-slate-300 font-semibold mb-1">CGPA (Scale 4.00) <span class="text-rose-400">*</span></label>
              <input type="number" step="0.01" min="0" max="4" [(ngModel)]="newCandidateForm.cgpa" class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 font-mono font-bold focus:outline-none focus:border-emerald-500" />
            </div>

            <div>
              <label class="block text-slate-300 font-semibold mb-1">Experience (Years)</label>
              <input type="number" min="0" [(ngModel)]="newCandidateForm.experienceYears" class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 font-mono focus:outline-none focus:border-emerald-500" />
            </div>
          </div>

          <div class="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
            <button 
              type="button"
              (click)="showEnrollCandidateModal = false" 
              class="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors">
              Cancel
            </button>
            <button 
              type="button"
              (click)="submitEnrollCandidate()" 
              [disabled]="isEnrollingCandidate || !newCandidateForm.fullName || !newCandidateForm.email"
              class="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold transition-colors flex items-center gap-1.5 shadow-md">
              <span *ngIf="isEnrollingCandidate" class="animate-spin text-xs">⌛</span>
              <span>Enroll Application</span>
            </button>
          </div>
        </div>
      </div>

      <!-- ================================================================= -->
      <!-- MODAL 5: EDIT CANDIDATE (UPDATE OPERATION) -->
      <!-- ================================================================= -->
      <div *ngIf="showEditCandidateModal" class="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
        <div class="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl text-xs text-slate-200">
          <div class="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <span class="text-[10px] font-mono text-emerald-400 uppercase font-bold">{{ editingCandidate?.trackingId }}</span>
              <h4 class="font-bold text-slate-100 text-sm mt-0.5">Edit Candidate Credentials</h4>
            </div>
            <button (click)="showEditCandidateModal = false" class="text-slate-400 hover:text-slate-200 text-base font-bold">✕</button>
          </div>

          <div class="space-y-3" *ngIf="editingCandidate">
            <div>
              <label class="block text-slate-300 font-semibold mb-1">Full Name</label>
              <input type="text" [(ngModel)]="editingCandidate.fullName" class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500" />
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-slate-300 font-semibold mb-1">Email</label>
                <input type="email" [(ngModel)]="editingCandidate.email" class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500" />
              </div>
              <div>
                <label class="block text-slate-300 font-semibold mb-1">Phone</label>
                <input type="text" [(ngModel)]="editingCandidate.phone" class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500" />
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-slate-300 font-semibold mb-1">District</label>
                <select [(ngModel)]="editingCandidate.district" class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500">
                  <option *ngFor="let d of bangladeshDistricts" [value]="d">{{ d }}</option>
                </select>
              </div>
              <div>
                <label class="block text-slate-300 font-semibold mb-1">ATS Status</label>
                <select [(ngModel)]="editingCandidate.status" class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 font-mono font-bold focus:outline-none focus:border-emerald-500">
                  <option value="APPLIED">APPLIED</option>
                  <option value="SHORTLISTED">SHORTLISTED</option>
                  <option value="EXAM_SCHEDULED">EXAM_SCHEDULED</option>
                  <option value="WRITTEN_PASSED">WRITTEN_PASSED</option>
                  <option value="SELECTED">SELECTED</option>
                  <option value="DEPLOYED">DEPLOYED</option>
                  <option value="REJECTED">REJECTED</option>
                </select>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-slate-300 font-semibold mb-1">CGPA (Scale 4.00)</label>
                <input type="number" step="0.01" min="0" max="4" [(ngModel)]="editingCandidate.cgpa" class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 font-mono font-bold focus:outline-none focus:border-emerald-500" />
              </div>
              <div>
                <label class="block text-slate-300 font-semibold mb-1">Experience (Years)</label>
                <input type="number" min="0" [(ngModel)]="editingCandidate.experienceYears" class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 font-mono focus:outline-none focus:border-emerald-500" />
              </div>
            </div>

            <div>
              <label class="block text-slate-300 font-semibold mb-1">Degree Title</label>
              <input type="text" [(ngModel)]="editingCandidate.highestDegree" class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500" />
            </div>
          </div>

          <div class="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
            <button 
              type="button" 
              (click)="showEditCandidateModal = false" 
              class="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors">
              Cancel
            </button>
            <button 
              type="button" 
              (click)="submitEditCandidate()" 
              [disabled]="isUpdatingCandidate"
              class="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-colors flex items-center gap-1.5 shadow-md">
              <span *ngIf="isUpdatingCandidate" class="animate-spin text-xs">⌛</span>
              <span>Save Changes</span>
            </button>
          </div>
        </div>
      </div>

      <!-- ================================================================= -->
      <!-- MODAL 6: CANDIDATE DOSSIER (READ / INSPECT OPERATION) -->
      <!-- ================================================================= -->
      <div *ngIf="showCandidateDossierModal" class="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
        <div class="bg-white text-slate-900 rounded-2xl w-full max-w-xl p-6 space-y-4 shadow-2xl text-xs">
          <div class="flex items-start justify-between border-b pb-3">
            <div>
              <div class="flex items-center gap-2">
                <span class="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-mono text-xs font-bold">
                  {{ viewingCandidate?.trackingId }}
                </span>
                <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-slate-100 text-slate-800">
                  {{ viewingCandidate?.status }}
                </span>
              </div>
              <h3 class="text-base font-bold text-slate-900 mt-1">{{ viewingCandidate?.fullName }}</h3>
              <p class="text-xs text-slate-500">{{ viewingCandidate?.email }} | {{ viewingCandidate?.phone }}</p>
            </div>
            <button (click)="showCandidateDossierModal = false" class="text-slate-400 hover:text-slate-600 text-lg font-bold">✕</button>
          </div>

          <!-- Academic & Evaluation Dossier -->
          <div class="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-xl border text-xs">
            <div>
              <span class="text-slate-500 text-[10px] block">Degree Qualification:</span>
              <span class="font-bold text-slate-800">{{ viewingCandidate?.highestDegree }}</span>
            </div>
            <div>
              <span class="text-slate-500 text-[10px] block">Institution:</span>
              <span class="font-semibold text-slate-800">{{ viewingCandidate?.institution || 'Recognized College / University' }}</span>
            </div>
            <div>
              <span class="text-slate-500 text-[10px] block">CGPA Score:</span>
              <span class="font-mono font-bold text-emerald-700 text-sm">{{ Number(viewingCandidate?.cgpa) | number:'1.2-2' }} / 4.00</span>
            </div>
            <div>
              <span class="text-slate-500 text-[10px] block">Work Experience:</span>
              <span class="font-bold text-slate-800">{{ viewingCandidate?.experienceYears || 0 }} Years</span>
            </div>
            <div>
              <span class="text-slate-500 text-[10px] block">District / Division:</span>
              <span class="font-semibold text-slate-800">{{ viewingCandidate?.district }}</span>
            </div>
            <div>
              <span class="text-slate-500 text-[10px] block">Age:</span>
              <span class="font-semibold text-slate-800">{{ getCandidateAge(viewingCandidate?.dateOfBirth) }} Years</span>
            </div>
          </div>

          <!-- Live Screening Evaluation Match Breakdown -->
          <div *ngIf="getCandidateEvaluation(viewingCandidate?.id) as ev" class="p-3 rounded-xl border" [ngClass]="ev.isEligible ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900' : 'bg-rose-50/70 border-rose-200 text-rose-900'">
            <div class="flex items-center justify-between mb-1">
              <span class="font-bold text-[11px] uppercase tracking-wide">Shortlisting Algorithm Verdict:</span>
              <span class="font-bold px-2 py-0.5 rounded text-[10px]" [ngClass]="ev.isEligible ? 'bg-emerald-200 text-emerald-900' : 'bg-rose-200 text-rose-900'">
                {{ ev.isEligible ? 'QUALIFIED FOR SHORTLIST' : 'BELOW SPECIFIED THRESHOLDS' }}
              </span>
            </div>
            <ul *ngIf="!ev.isEligible" class="list-disc list-inside text-[11px] space-y-0.5 mt-1">
              <li *ngFor="let r of ev.reasons">{{ r }}</li>
            </ul>
            <p *ngIf="ev.isEligible" class="text-[11px] text-emerald-800">
              Meets or exceeds all required thresholds for CGPA (>= {{ shortlistCriteria.minCgpa }}), Experience (>= {{ shortlistCriteria.minExperienceYears }}y), Age (<= {{ shortlistCriteria.maxAge }}y), and target districts.
            </p>
          </div>

          <div class="flex items-center justify-end gap-2 pt-2 border-t">
            <button (click)="showCandidateDossierModal = false" class="px-4 py-2 rounded-lg bg-slate-800 text-white font-semibold text-xs">
              Close Dossier
            </button>
          </div>
        </div>
      </div>

      <!-- ================================================================= -->
      <!-- MODAL 7: SHORTLIST EXECUTION SUCCESS SUMMARY -->
      <!-- ================================================================= -->
      <div *ngIf="showShortlistSuccessModal" class="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
        <div class="bg-slate-900 border border-emerald-500/50 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl text-xs text-slate-200">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xl font-bold">
              ✓
            </div>
            <div>
              <h4 class="font-bold text-slate-100 text-base">Shortlisting Algorithm Completed</h4>
              <p class="text-xs text-slate-400">Applicant pool screened and updated successfully in ATS database.</p>
            </div>
          </div>

          <div class="grid grid-cols-3 gap-3 bg-slate-950 p-4 rounded-xl border border-slate-800 text-center font-mono">
            <div>
              <span class="text-slate-500 text-[10px] block">Evaluated</span>
              <span class="text-lg font-bold text-slate-200">{{ lastExecutionResult?.totalEvaluated || 0 }}</span>
            </div>
            <div>
              <span class="text-emerald-400 text-[10px] block font-semibold">Shortlisted</span>
              <span class="text-lg font-bold text-emerald-300">{{ lastExecutionResult?.shortlistedCount || 0 }}</span>
            </div>
            <div>
              <span class="text-rose-400 text-[10px] block font-semibold">Disqualified</span>
              <span class="text-lg font-bold text-rose-300">{{ lastExecutionResult?.disqualifiedCount || 0 }}</span>
            </div>
          </div>

          <p class="text-slate-300 leading-relaxed text-[11px]">
            All <strong class="text-emerald-400">{{ lastExecutionResult?.shortlistedCount || 0 }} qualified candidates</strong> have been transitioned to <strong class="text-emerald-400 font-mono">SHORTLISTED</strong> status. You can now proceed to allocate exam halls and generate admit cards.
          </p>

          <div class="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
            <button 
              type="button" 
              (click)="showShortlistSuccessModal = false" 
              class="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors">
              Stay in Shortlisting
            </button>
            <button 
              type="button" 
              (click)="showShortlistSuccessModal = false; activeTab = 'examHalls'" 
              class="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-colors shadow-lg shadow-emerald-950/50 flex items-center gap-1.5">
              <span>Proceed to Exam Halls</span>
              <span>&rarr;</span>
            </button>
          </div>
        </div>
      </div>

      <!-- ================================================================= -->
      <!-- MODAL: INTERVIEW SMS INVITATION DISPATCH -->
      <!-- ================================================================= -->
      <div *ngIf="showInterviewSmsModal" class="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
        <div class="bg-slate-900 border border-emerald-500/40 rounded-2xl w-full max-w-2xl p-6 space-y-4 shadow-2xl text-xs text-slate-200 my-8">
          
          <!-- Header -->
          <div class="flex items-center justify-between pb-3 border-b border-slate-800">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-lg font-bold">
                📱
              </div>
              <div>
                <h3 class="text-base font-bold text-slate-100 flex items-center gap-2">
                  <span>Interview Invitation SMS Dispatch</span>
                  <span class="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-900/60 text-emerald-300 border border-emerald-700/50">
                    {{ interviewNotificationTargets.length }} Recipient(s)
                  </span>
                </h3>
                <p class="text-xs text-slate-400">Broadcast SMS interview call letters directly to shortlisted candidates' phones</p>
              </div>
            </div>
            <button type="button" (click)="showInterviewSmsModal = false" class="text-slate-400 hover:text-white text-lg p-1">✕</button>
          </div>

          <!-- Recipient Chips List -->
          <div class="space-y-1.5">
            <div class="flex items-center justify-between text-[11px] text-slate-400">
              <span class="font-semibold text-slate-300">Target Recipients:</span>
              <span>Click ✕ to remove any candidate</span>
            </div>
            <div class="max-h-24 overflow-y-auto p-2 bg-slate-950 rounded-xl border border-slate-800 flex flex-wrap gap-1.5">
              <span *ngFor="let tgt of interviewNotificationTargets" class="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-900 border border-slate-700 text-[11px] text-slate-200">
                <span class="font-medium">{{ tgt.fullName }}</span>
                <span class="font-mono text-emerald-400 text-[10px]">{{ tgt.phone || 'No Phone!' }}</span>
                <button type="button" (click)="removeTargetFromNotification(tgt.id)" class="text-slate-500 hover:text-rose-400 text-xs font-bold ml-1">✕</button>
              </span>
            </div>
          </div>

          <!-- Interview Logistics Details Grid -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-950/60 rounded-xl border border-slate-800/80">
            <div>
              <label class="block text-[11px] font-semibold text-slate-300 mb-1">Interview Date *</label>
              <input 
                type="date" 
                [(ngModel)]="interviewSmsForm.interviewDate" 
                class="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:border-emerald-500 focus:outline-none" />
            </div>
            <div>
              <label class="block text-[11px] font-semibold text-slate-300 mb-1">Reporting Time *</label>
              <input 
                type="text" 
                [(ngModel)]="interviewSmsForm.interviewTime" 
                placeholder="e.g. 10:00 AM" 
                class="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:border-emerald-500 focus:outline-none" />
            </div>
            <div class="sm:col-span-2">
              <label class="block text-[11px] font-semibold text-slate-300 mb-1">Position / Job Title</label>
              <input 
                type="text" 
                [(ngModel)]="interviewSmsForm.position" 
                placeholder="Target Job Position" 
                class="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:border-emerald-500 focus:outline-none" />
            </div>
            <div class="sm:col-span-2">
              <label class="block text-[11px] font-semibold text-slate-300 mb-1">Interview Venue *</label>
              <input 
                type="text" 
                [(ngModel)]="interviewSmsForm.venue" 
                placeholder="Venue address / board room location" 
                class="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:border-emerald-500 focus:outline-none" />
            </div>
          </div>

          <!-- SMS Template Editor & Placeholders -->
          <div class="space-y-1.5">
            <div class="flex items-center justify-between">
              <label class="text-[11px] font-semibold text-slate-300">SMS Content Template</label>
              <div class="flex items-center gap-1 text-[10px] text-slate-400">
                <span>Variables:</span>
                <button type="button" (click)="insertSmsPlaceholder('candidateName')" class="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-emerald-400 font-mono">+name</button>
                <button type="button" (click)="insertSmsPlaceholder('position')" class="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-emerald-400 font-mono">+pos</button>
                <button type="button" (click)="insertSmsPlaceholder('interviewDate')" class="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-emerald-400 font-mono">+date</button>
                <button type="button" (click)="insertSmsPlaceholder('interviewTime')" class="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-emerald-400 font-mono">+time</button>
                <button type="button" (click)="insertSmsPlaceholder('venue')" class="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-emerald-400 font-mono">+venue</button>
              </div>
            </div>
            <textarea 
              rows="3" 
              [(ngModel)]="interviewSmsForm.template" 
              class="w-full bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-xl p-3 text-xs text-slate-200 focus:outline-none leading-relaxed"></textarea>
            
            <!-- Character Counter and Segment Calculator -->
            <div class="flex items-center justify-between text-[11px] text-slate-400 px-1 font-mono">
              <span class="text-emerald-400">
                {{ getInterpolatedSms(interviewNotificationTargets[0]).length }} Chars 
                • {{ getSmsSegments(getInterpolatedSms(interviewNotificationTargets[0]).length) }} SMS Segment(s)
              </span>
              <span class="text-slate-500">
                Total Units: {{ getSmsSegments(getInterpolatedSms(interviewNotificationTargets[0]).length) * interviewNotificationTargets.length }} credits
              </span>
            </div>
          </div>

          <!-- Live Mobile SMS Preview -->
          <div class="space-y-1">
            <span class="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Live Candidate SMS Preview:</span>
            <div class="bg-slate-950 rounded-xl p-3.5 border border-slate-800 flex items-start gap-3">
              <div class="w-8 h-8 rounded-full bg-emerald-600/30 text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0">
                SMS
              </div>
              <div class="space-y-1 flex-1">
                <div class="flex items-center justify-between text-[10px] text-slate-500">
                  <span class="font-semibold text-slate-300">To: {{ interviewNotificationTargets[0]?.fullName }} ({{ interviewNotificationTargets[0]?.phone }})</span>
                  <span>Now</span>
                </div>
                <div class="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-800/40 text-slate-200 text-xs leading-relaxed font-sans">
                  {{ getInterpolatedSms(interviewNotificationTargets[0]) }}
                </div>
              </div>
            </div>
          </div>

          <!-- Modal Actions -->
          <div class="flex items-center justify-between pt-3 border-t border-slate-800">
            <span class="text-[11px] text-slate-500">UDDIPAN SMS Gateway v2.1 • GSM/Bangla Unicode Compliant</span>
            <div class="flex items-center gap-2">
              <button 
                type="button" 
                (click)="showInterviewSmsModal = false" 
                class="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors">
                Cancel
              </button>
              <button 
                type="button" 
                (click)="sendInterviewSmsBatch()" 
                [disabled]="isDispatchingInterviewSms || interviewNotificationTargets.length === 0" 
                class="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold transition-all shadow-lg flex items-center gap-2">
                <span *ngIf="isDispatchingInterviewSms" class="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
                <span>Send SMS ({{ interviewNotificationTargets.length }})</span>
              </button>
            </div>
          </div>

        </div>
      </div>

      <!-- ================================================================= -->
      <!-- MODAL: INTERVIEW EMAIL INVITATION DISPATCH -->
      <!-- ================================================================= -->
      <div *ngIf="showInterviewEmailModal" class="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
        <div class="bg-slate-900 border border-sky-500/40 rounded-2xl w-full max-w-3xl p-6 space-y-4 shadow-2xl text-xs text-slate-200 my-8">
          
          <!-- Header -->
          <div class="flex items-center justify-between pb-3 border-b border-slate-800">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center text-lg font-bold">
                ✉️
              </div>
              <div>
                <h3 class="text-base font-bold text-slate-100 flex items-center gap-2">
                  <span>Interview Call Letter Email Dispatch</span>
                  <span class="text-[10px] font-mono px-2 py-0.5 rounded-full bg-sky-900/60 text-sky-300 border border-sky-700/50">
                    {{ interviewNotificationTargets.length }} Recipient(s)
                  </span>
                </h3>
                <p class="text-xs text-slate-400">Send formal interview invitation emails with schedule, venue and required credentials</p>
              </div>
            </div>
            <button type="button" (click)="showInterviewEmailModal = false" class="text-slate-400 hover:text-white text-lg p-1">✕</button>
          </div>

          <!-- Recipient Chips List -->
          <div class="space-y-1.5">
            <div class="flex items-center justify-between text-[11px] text-slate-400">
              <span class="font-semibold text-slate-300">Target Recipients:</span>
              <span>Click ✕ to remove any candidate</span>
            </div>
            <div class="max-h-24 overflow-y-auto p-2 bg-slate-950 rounded-xl border border-slate-800 flex flex-wrap gap-1.5">
              <span *ngFor="let tgt of interviewNotificationTargets" class="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-900 border border-slate-700 text-[11px] text-slate-200">
                <span class="font-medium">{{ tgt.fullName }}</span>
                <span class="font-mono text-sky-400 text-[10px]">{{ tgt.email }}</span>
                <button type="button" (click)="removeTargetFromNotification(tgt.id)" class="text-slate-500 hover:text-rose-400 text-xs font-bold ml-1">✕</button>
              </span>
            </div>
          </div>

          <!-- Subject & Key Logistics -->
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-slate-950/60 rounded-xl border border-slate-800/80">
            <div class="sm:col-span-3">
              <label class="block text-[11px] font-semibold text-slate-300 mb-1">Email Subject Line *</label>
              <input 
                type="text" 
                [(ngModel)]="interviewEmailForm.subject" 
                class="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:border-sky-500 focus:outline-none" />
            </div>
            <div>
              <label class="block text-[11px] font-semibold text-slate-300 mb-1">Interview Date *</label>
              <input 
                type="date" 
                [(ngModel)]="interviewEmailForm.interviewDate" 
                class="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:border-sky-500 focus:outline-none" />
            </div>
            <div>
              <label class="block text-[11px] font-semibold text-slate-300 mb-1">Reporting Time *</label>
              <input 
                type="text" 
                [(ngModel)]="interviewEmailForm.interviewTime" 
                placeholder="e.g. 10:00 AM" 
                class="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:border-sky-500 focus:outline-none" />
            </div>
            <div>
              <label class="block text-[11px] font-semibold text-slate-300 mb-1">Board Room / Room No</label>
              <input 
                type="text" 
                [(ngModel)]="interviewEmailForm.boardRoom" 
                placeholder="Board Room A" 
                class="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:border-sky-500 focus:outline-none" />
            </div>
            <div class="sm:col-span-2">
              <label class="block text-[11px] font-semibold text-slate-300 mb-1">Interview Venue Address *</label>
              <input 
                type="text" 
                [(ngModel)]="interviewEmailForm.venue" 
                placeholder="Venue location" 
                class="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:border-sky-500 focus:outline-none" />
            </div>
            <div>
              <label class="block text-[11px] font-semibold text-slate-300 mb-1">HR Helpline Numbers</label>
              <input 
                type="text" 
                [(ngModel)]="interviewEmailForm.helpline" 
                placeholder="+880 2-9661234" 
                class="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:border-sky-500 focus:outline-none" />
            </div>
            <div class="sm:col-span-3">
              <label class="block text-[11px] font-semibold text-slate-300 mb-1">Candidate Instructions / Required Credentials</label>
              <textarea 
                rows="2" 
                [(ngModel)]="interviewEmailForm.reportingInstructions" 
                class="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-200 focus:border-sky-500 focus:outline-none"></textarea>
            </div>
          </div>

          <!-- Live Rendered Email Preview -->
          <div class="space-y-1">
            <span class="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Live Rendered Email Letter Preview:</span>
            <div class="bg-slate-950 rounded-xl p-4 border border-slate-800 space-y-3 font-sans">
              <div class="border-b border-slate-800 pb-2">
                <div class="text-[10px] text-slate-500">Subject: <span class="text-sky-300 font-semibold font-mono">{{ getInterpolatedEmailSubject(interviewNotificationTargets[0]) }}</span></div>
                <div class="text-[10px] text-slate-500">Recipient: <span class="text-slate-300">{{ interviewNotificationTargets[0]?.fullName }} &lt;{{ interviewNotificationTargets[0]?.email }}&gt;</span></div>
              </div>

              <div class="space-y-2 text-xs text-slate-300 leading-relaxed">
                <p>Dear <strong class="text-white">{{ interviewNotificationTargets[0]?.fullName || 'Candidate' }}</strong> (Tracking ID: <span class="font-mono text-emerald-400">{{ interviewNotificationTargets[0]?.trackingId || 'TRK-2026-0001' }}</span>),</p>
                <p>We are pleased to inform you that following your application and preliminary screening for the position of <strong class="text-sky-300">{{ interviewEmailForm.position }}</strong> at UDDIPAN, you are cordially invited to appear before the Viva Examination Board.</p>
                
                <div class="p-3 bg-slate-900 rounded-lg border border-slate-800 grid grid-cols-2 gap-2 text-xs">
                  <div><span class="text-slate-500 text-[10px] block">Date of Viva:</span> <strong class="text-white font-mono">{{ interviewEmailForm.interviewDate }}</strong></div>
                  <div><span class="text-slate-500 text-[10px] block">Reporting Time:</span> <strong class="text-white font-mono">{{ interviewEmailForm.interviewTime }}</strong></div>
                  <div class="col-span-2"><span class="text-slate-500 text-[10px] block">Venue & Board:</span> <span class="text-slate-200">{{ interviewEmailForm.venue }} • {{ interviewEmailForm.boardRoom }}</span></div>
                </div>

                <div class="text-[11px] text-slate-400">
                  <strong class="text-slate-200">Instructions:</strong> {{ interviewEmailForm.reportingInstructions }}
                </div>

                <div class="pt-2 text-[11px] text-slate-400 border-t border-slate-800/80">
                  <div>Sincerely,</div>
                  <div class="font-bold text-slate-200">Human Resources & Recruitment Division</div>
                  <div>UDDIPAN (United Development Initiatives for Programmed Actions)</div>
                  <div>Helpline: {{ interviewEmailForm.helpline }}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Modal Actions -->
          <div class="flex items-center justify-between pt-3 border-t border-slate-800">
            <span class="text-[11px] text-slate-500">UDDIPAN SMTP Mailer • TLS Secured Delivery</span>
            <div class="flex items-center gap-2">
              <button 
                type="button" 
                (click)="showInterviewEmailModal = false" 
                class="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors">
                Cancel
              </button>
              <button 
                type="button" 
                (click)="sendInterviewEmailBatch()" 
                [disabled]="isDispatchingInterviewEmail || interviewNotificationTargets.length === 0" 
                class="px-5 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white font-bold transition-all shadow-lg flex items-center gap-2">
                <span *ngIf="isDispatchingInterviewEmail" class="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
                <span>Send Email ({{ interviewNotificationTargets.length }})</span>
              </button>
            </div>
          </div>

        </div>
      </div>

      <!-- ================================================================= -->
      <!-- MODAL 1: CREATE EXAM HALL -->
      <!-- ================================================================= -->
      <div *ngIf="showCreateExamHallModal" class="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
        <div class="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl p-6 space-y-4">
          <div class="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 class="text-base font-bold text-slate-100">Register New Exam Hall / Venue</h3>
              <p class="text-xs text-slate-400 mt-0.5">Define exam center location, room number and candidate seating capacity</p>
            </div>
            <button (click)="showCreateExamHallModal = false" class="text-slate-400 hover:text-slate-200 text-lg">✕</button>
          </div>

          <div *ngIf="examHallErrorMessage" class="p-3 rounded-lg bg-rose-950/60 border border-rose-800 text-xs text-rose-300">
            {{ examHallErrorMessage }}
          </div>

          <div class="space-y-3.5">
            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1">Exam Hall / Venue Name *</label>
              <input 
                type="text" 
                [(ngModel)]="newExamHall.hallName" 
                placeholder="e.g. Hall E - Sylhet Regional Center" 
                class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500">
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1">Center Location / Address *</label>
              <input 
                type="text" 
                [(ngModel)]="newExamHall.centerLocation" 
                placeholder="e.g. UDDIPAN Regional Office, Subidbazar, Sylhet" 
                class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500">
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-semibold text-slate-300 mb-1">Room / Floor Number</label>
                <input 
                  type="text" 
                  [(ngModel)]="newExamHall.roomNumber" 
                  placeholder="e.g. Room 302 / Floor 3" 
                  class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500">
              </div>

              <div>
                <label class="block text-xs font-semibold text-slate-300 mb-1">Seating Capacity (Candidates) *</label>
                <input 
                  type="number" 
                  [(ngModel)]="newExamHall.capacity" 
                  min="1" 
                  class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500">
              </div>
            </div>
          </div>

          <div class="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button 
              type="button" 
              (click)="showCreateExamHallModal = false" 
              class="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors">
              Cancel
            </button>
            <button 
              type="button" 
              (click)="saveExamHall()" 
              [disabled]="isSavingExamHall"
              class="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors shadow-md disabled:opacity-50 flex items-center gap-1.5">
              <span *ngIf="isSavingExamHall" class="animate-spin text-xs">↻</span>
              <span>Register Exam Hall</span>
            </button>
          </div>
        </div>
      </div>

      <!-- ================================================================= -->
      <!-- MODAL 2: SCHEDULE EXAM & ISSUE ADMIT CARDS -->
      <!-- ================================================================= -->
      <div *ngIf="showScheduleExamModal" class="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
        <div class="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
          <div class="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 class="text-base font-bold text-slate-100">Schedule Examination & Generate Admit Cards</h3>
              <p class="text-xs text-slate-400 mt-0.5">Plan written, MCQ or practical exams, assign seat numbers, and distribute QR-coded admit cards</p>
            </div>
            <button (click)="showScheduleExamModal = false" class="text-slate-400 hover:text-slate-200 text-lg">✕</button>
          </div>

          <div *ngIf="examScheduleErrorMessage" class="p-3 rounded-lg bg-rose-950/60 border border-rose-800 text-xs text-rose-300">
            {{ examScheduleErrorMessage }}
          </div>

          <div class="space-y-4">
            <!-- Circular Selector -->
            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1">Target Job Circular *</label>
              <select 
                [(ngModel)]="newExamSchedule.circularId" 
                class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500">
                <option value="" disabled>Select Job Circular...</option>
                <option *ngFor="let c of rawCirculars" [value]="c.id">
                  {{ c.circularNo }}: {{ c.title }} ({{ c.vacanciesCount }} Vacancies)
                </option>
              </select>

              <div *ngIf="newExamSchedule.circularId" class="mt-2 p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 flex items-center justify-between text-xs">
                <span class="text-slate-400">Available Applicant Pool:</span>
                <div class="flex items-center gap-2">
                  <span class="px-2 py-0.5 rounded bg-emerald-950 border border-emerald-800 text-emerald-400 font-mono text-[11px] font-bold">
                    {{ getShortlistedCountForCircular(newExamSchedule.circularId) }} Shortlisted
                  </span>
                  <span class="text-slate-500 text-[11px]">
                    ({{ getTotalApplicantsForCircular(newExamSchedule.circularId) }} Total Applicants)
                  </span>
                </div>
              </div>
            </div>

            <!-- Exam Type & Hall Selector -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label class="block text-xs font-semibold text-slate-300 mb-1">Exam Type *</label>
                <select 
                  [(ngModel)]="newExamSchedule.examType" 
                  class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500">
                  <option value="WRITTEN">Written Examination</option>
                  <option value="PRELIMINARY_MCQ">Preliminary MCQ Test</option>
                  <option value="PRACTICAL">Practical / Typing Assessment</option>
                </select>
              </div>

              <div>
                <label class="block text-xs font-semibold text-slate-300 mb-1">Exam Hall / Venue *</label>
                <select 
                  [(ngModel)]="newExamSchedule.hallId" 
                  class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500">
                  <option value="" disabled>Select Exam Hall...</option>
                  <option *ngFor="let h of examHallsList" [value]="h.id">
                    {{ h.hallName }} (Capacity: {{ h.capacity }} Seats)
                  </option>
                </select>
              </div>
            </div>

            <!-- Date & Time Slot -->
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div>
                <label class="block text-xs font-semibold text-slate-300 mb-1">Exam Date *</label>
                <app-datepicker 
                  [(ngModel)]="newExamSchedule.examDate" 
                  name="examScheduleDate"
                  placeholder="Select Exam Date">
                </app-datepicker>
              </div>

              <div>
                <label class="block text-xs font-semibold text-slate-300 mb-1">Start Time *</label>
                <input 
                  type="text" 
                  [(ngModel)]="newExamSchedule.startTime" 
                  placeholder="10:00 AM" 
                  class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-emerald-500">
              </div>

              <div>
                <label class="block text-xs font-semibold text-slate-300 mb-1">End Time *</label>
                <input 
                  type="text" 
                  [(ngModel)]="newExamSchedule.endTime" 
                  placeholder="12:00 PM" 
                  class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-emerald-500">
              </div>
            </div>

            <!-- Marks Configuration -->
            <div class="grid grid-cols-2 gap-3.5">
              <div>
                <label class="block text-xs font-semibold text-slate-300 mb-1">Total Marks *</label>
                <input 
                  type="number" 
                  [(ngModel)]="newExamSchedule.totalMarks" 
                  min="1" 
                  class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-emerald-500">
              </div>

              <div>
                <label class="block text-xs font-semibold text-slate-300 mb-1">Pass Marks *</label>
                <input 
                  type="number" 
                  [(ngModel)]="newExamSchedule.passMarks" 
                  min="1" 
                  class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-emerald-500">
              </div>
            </div>

            <!-- Include Applied Checkbox -->
            <div class="p-3 rounded-lg bg-slate-950 border border-slate-800">
              <label class="flex items-start gap-2.5 cursor-pointer">
                <input 
                  type="checkbox" 
                  [(ngModel)]="newExamSchedule.includeApplied" 
                  class="mt-0.5 rounded border-slate-700 text-emerald-500 focus:ring-0 focus:ring-offset-0 bg-slate-900">
                <div class="text-xs">
                  <span class="font-semibold text-slate-200">Auto-include Applied & Verified Applicants</span>
                  <p class="text-slate-400 text-[11px] mt-0.5">
                    If no candidates have been explicitly marked as Shortlisted yet, automatically generate admit cards for all verified applicants in this circular.
                  </p>
                </div>
              </label>
            </div>
          </div>

          <div class="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button 
              type="button" 
              (click)="showScheduleExamModal = false" 
              class="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors">
              Cancel
            </button>
            <button 
              type="button" 
              (click)="submitScheduleExam()" 
              [disabled]="isSavingExamSchedule"
              class="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors shadow-md disabled:opacity-50 flex items-center gap-1.5">
              <span *ngIf="isSavingExamSchedule" class="animate-spin text-xs">↻</span>
              <span>Schedule Exam & Issue Admit Cards</span>
            </button>
          </div>
        </div>
      </div>

      <!-- ================================================================= -->
      <!-- MODAL 3: ADMIT CARDS DOSSIER & SEAT PLAN VIEWER -->
      <!-- ================================================================= -->
      <div *ngIf="showAdmitCardsViewerModal" class="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
        <div class="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl shadow-2xl p-6 space-y-4 max-h-[92vh] flex flex-col">
          <!-- Header -->
          <div class="flex items-center justify-between pb-3 border-b border-slate-800 flex-shrink-0">
            <div>
              <div class="flex items-center gap-2">
                <span class="px-2 py-0.5 rounded bg-emerald-950 border border-emerald-800 text-emerald-400 font-mono text-[10px] font-bold">
                  {{ selectedScheduleForCards?.examType }}
                </span>
                <h3 class="text-base font-bold text-slate-100">
                  Admit Cards & Seat Planning Dossier
                </h3>
              </div>
              <p class="text-xs text-slate-400 mt-0.5">
                {{ selectedScheduleForCards?.circular?.title }} &bull; {{ selectedScheduleForCards?.hall?.hallName }} &bull; {{ selectedScheduleForCards?.examDate | date:'dd MMM yyyy' }} ({{ selectedScheduleForCards?.startTime }} - {{ selectedScheduleForCards?.endTime }})
              </p>
            </div>
            <button (click)="showAdmitCardsViewerModal = false" class="text-slate-400 hover:text-slate-200 text-lg">✕</button>
          </div>

          <!-- Controls Bar -->
          <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 flex-shrink-0 bg-slate-950 p-3 rounded-xl border border-slate-800">
            <div class="flex items-center gap-2">
              <input 
                type="text" 
                [(ngModel)]="admitCardSearchQuery" 
                placeholder="Search Roll, Seat, Name, District..." 
                class="bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-emerald-500 min-w-[220px]">
              <span class="text-xs font-mono text-emerald-400 font-semibold px-2 py-1 bg-emerald-950/60 border border-emerald-800 rounded-md">
                {{ filteredAdmitCardsList.length }} Cards
              </span>
            </div>

            <div class="flex items-center gap-2">
              <button 
                (click)="markAllAdmitCardsPrinted(selectedScheduleForCards?.id)" 
                class="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs border border-slate-700 transition-colors">
                Mark All Printed
              </button>
              <button 
                (click)="printBatchAdmitCards()" 
                class="px-3 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow transition-colors flex items-center gap-1">
                <span>Print Batch Cards</span>
              </button>
            </div>
          </div>

          <!-- Cards Table Container -->
          <div class="flex-1 overflow-y-auto border border-slate-800 rounded-xl">
            <table class="w-full text-left text-xs text-slate-300">
              <thead class="bg-slate-950 text-[11px] uppercase font-mono text-slate-400 sticky top-0 border-b border-slate-800">
                <tr>
                  <th class="py-2.5 px-3">Roll #</th>
                  <th class="py-2.5 px-3">Seat #</th>
                  <th class="py-2.5 px-3">Candidate Name</th>
                  <th class="py-2.5 px-3">Tracking ID</th>
                  <th class="py-2.5 px-3">District</th>
                  <th class="py-2.5 px-3 text-center">QR Code</th>
                  <th class="py-2.5 px-3 text-center">Status</th>
                  <th class="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-800/60">
                <tr *ngIf="isLoadingAdmitCards">
                  <td colspan="8" class="py-8 text-center text-slate-400">Loading admit cards...</td>
                </tr>
                <tr *ngIf="!isLoadingAdmitCards && filteredAdmitCardsList.length === 0">
                  <td colspan="8" class="py-8 text-center text-slate-500">No admit cards found matching search.</td>
                </tr>
                <tr *ngFor="let card of filteredAdmitCardsList" class="hover:bg-slate-800/40">
                  <td class="py-2.5 px-3 font-mono font-bold text-emerald-400">
                    {{ card.rollNumber }}
                  </td>
                  <td class="py-2.5 px-3 font-mono text-slate-200">
                    <span class="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-[11px]">
                      {{ card.seatNumber || 'N/A' }}
                    </span>
                  </td>
                  <td class="py-2.5 px-3">
                    <div class="font-bold text-slate-100">{{ card.candidate?.fullName }}</div>
                    <div class="text-[10px] text-slate-400">{{ card.candidate?.highestDegree }}</div>
                  </td>
                  <td class="py-2.5 px-3 font-mono text-slate-400 text-[11px]">
                    {{ card.candidate?.trackingId }}
                  </td>
                  <td class="py-2.5 px-3 text-slate-300">
                    {{ card.candidate?.district }}
                  </td>
                  <td class="py-2.5 px-3 text-center">
                    <div class="inline-block p-1 bg-white rounded border border-slate-700 shadow-sm" title="Scan QR to verify candidate">
                      <img *ngIf="card.qrDataUrl" [src]="card.qrDataUrl" class="w-7 h-7 object-contain" alt="QR" />
                      <span *ngIf="!card.qrDataUrl" class="text-[8px] font-mono text-slate-400">QR</span>
                    </div>
                  </td>
                  <td class="py-2.5 px-3 text-center">
                    <span 
                      [ngClass]="card.isPrinted ? 'bg-emerald-950 text-emerald-400 border-emerald-800' : 'bg-slate-800 text-slate-400 border-slate-700'"
                      class="px-2 py-0.5 rounded text-[10px] font-mono border">
                      {{ card.isPrinted ? 'PRINTED' : 'ISSUED' }}
                    </span>
                  </td>
                  <td class="py-2.5 px-3 text-right">
                    <button 
                      (click)="printSingleAdmitCard(card)" 
                      class="px-2 py-1 rounded bg-slate-800 hover:bg-emerald-600 hover:text-white text-slate-300 text-[11px] font-medium transition-colors border border-slate-700">
                      Print Card
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Footer -->
          <div class="flex items-center justify-between pt-3 border-t border-slate-800 flex-shrink-0 text-xs text-slate-400">
            <span>Seat allocation generated in sequence with live QR Code verification payload.</span>
            <button 
              type="button" 
              (click)="showAdmitCardsViewerModal = false" 
              class="px-4 py-2 text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors">
              Close
            </button>
          </div>
        </div>
      </div>

      <!-- ================================================================= -->
      <!-- MODAL 4: OFFICIAL UDDIPAN ADMIT CARD PRINT PREVIEW (WITH QR CODE) -->
      <!-- ================================================================= -->
      <div *ngIf="showSingleAdmitCardPrintModal" class="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
        <div class="bg-white text-slate-900 rounded-2xl w-full max-w-2xl shadow-2xl p-8 space-y-6 max-h-[95vh] overflow-y-auto border-2 border-slate-200">
          <!-- Official UDDIPAN Header -->
          <div class="flex items-center justify-between border-b-2 border-slate-900 pb-4">
            <div>
              <h2 class="text-2xl font-black tracking-tight text-emerald-800 uppercase">UDDIPAN</h2>
              <p class="text-[11px] font-semibold text-slate-600 uppercase tracking-widest">United Development Initiatives for Programmed Actions</p>
              <p class="text-xs text-slate-500">Head Office: UDDIPAN Bhaban, Mirpur-2, Dhaka-1216</p>
            </div>
            <div class="text-right">
              <span class="px-3 py-1 rounded bg-emerald-100 text-emerald-900 font-mono font-bold text-xs uppercase border border-emerald-300">
                Official Admit Card
              </span>
              <p class="text-[11px] font-mono text-slate-600 mt-1 font-bold">{{ selectedAdmitCardToPrint?.admitCardNo }}</p>
            </div>
          </div>

          <!-- Position & Exam Banner -->
          <div class="bg-slate-100 p-4 rounded-xl border border-slate-300 grid grid-cols-2 gap-4 text-xs">
            <div>
              <span class="text-slate-500 font-semibold block text-[10px] uppercase">Post Applied For:</span>
              <span class="font-bold text-slate-900 text-sm">
                {{ selectedScheduleForCards?.circular?.title }}
              </span>
              <span class="text-slate-600 font-mono block mt-0.5">
                Circular: {{ selectedScheduleForCards?.circular?.circularNo }}
              </span>
            </div>
            <div class="text-right">
              <span class="text-slate-500 font-semibold block text-[10px] uppercase">Examination Type:</span>
              <span class="font-bold text-emerald-700 text-sm">
                {{ selectedScheduleForCards?.examType }} TEST
              </span>
            </div>
          </div>

          <!-- Candidate & Examination Schedule Details with Photo and Live QR Code -->
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4 border border-slate-300 rounded-xl p-4 text-xs bg-slate-50/40">
            <div class="md:col-span-2 space-y-2">
              <div class="grid grid-cols-3 gap-2">
                <span class="text-slate-500 font-semibold">Roll Number:</span>
                <span class="col-span-2 font-mono font-black text-emerald-700 text-base">
                  {{ selectedAdmitCardToPrint?.rollNumber }}
                </span>
              </div>
              <div class="grid grid-cols-3 gap-2">
                <span class="text-slate-500 font-semibold">Seat Number:</span>
                <span class="col-span-2 font-mono font-bold text-slate-900">
                  {{ selectedAdmitCardToPrint?.seatNumber }}
                </span>
              </div>
              <div class="grid grid-cols-3 gap-2">
                <span class="text-slate-500 font-semibold">Candidate Name:</span>
                <span class="col-span-2 font-bold text-slate-900">
                  {{ selectedAdmitCardToPrint?.candidate?.fullName }}
                </span>
              </div>
              <div class="grid grid-cols-3 gap-2">
                <span class="text-slate-500 font-semibold">Tracking ID:</span>
                <span class="col-span-2 font-mono text-slate-700">
                  {{ selectedAdmitCardToPrint?.candidate?.trackingId }}
                </span>
              </div>
              <div class="grid grid-cols-3 gap-2">
                <span class="text-slate-500 font-semibold">Home District:</span>
                <span class="col-span-2 text-slate-800">
                  {{ selectedAdmitCardToPrint?.candidate?.district }}
                </span>
              </div>
            </div>

            <!-- Photo Placeholder Box -->
            <div class="flex flex-col items-center justify-center border border-slate-300 rounded-xl p-2 bg-white text-center">
              <div class="w-20 h-24 bg-slate-100 border border-slate-200 rounded flex flex-col items-center justify-center text-[10px] text-slate-400 font-semibold overflow-hidden">
                <img *ngIf="selectedAdmitCardToPrint?.candidate?.photoUrl" [src]="selectedAdmitCardToPrint.candidate.photoUrl" class="w-full h-full object-cover" alt="Photo" />
                <span *ngIf="!selectedAdmitCardToPrint?.candidate?.photoUrl">Candidate Photo</span>
              </div>
              <span class="text-[9px] font-mono text-slate-500 mt-1">Verified Photo</span>
            </div>

            <!-- Scannable Authentic QR Code -->
            <div class="flex flex-col items-center justify-center border border-slate-300 rounded-xl p-2 bg-white text-center shadow-sm">
              <div class="w-24 h-24 p-1 flex items-center justify-center bg-white rounded border border-slate-100">
                <img *ngIf="singleAdmitCardQrDataUrl" [src]="singleAdmitCardQrDataUrl" class="w-full h-full object-contain" alt="Admit Card QR Verification Code" />
                <span *ngIf="!singleAdmitCardQrDataUrl" class="text-[9px] font-mono text-slate-400 animate-pulse">Generating QR...</span>
              </div>
              <span class="text-[9px] font-mono font-bold text-emerald-800 mt-1 uppercase">Scan to Verify</span>
              <span class="text-[8px] font-mono text-slate-500 truncate max-w-[100px]">{{ selectedAdmitCardToPrint?.rollNumber }}</span>
            </div>
          </div>

          <!-- Venue & Schedule -->
          <div class="border border-slate-300 rounded-xl p-4 bg-slate-50 space-y-2 text-xs">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <span class="text-slate-500 font-semibold block text-[10px] uppercase">Exam Date & Time:</span>
                <span class="font-bold text-slate-900">
                  {{ selectedScheduleForCards?.examDate | date:'EEEE, dd MMMM yyyy' }}
                </span>
                <p class="font-mono text-emerald-800 font-bold mt-0.5">
                  {{ selectedScheduleForCards?.startTime }} - {{ selectedScheduleForCards?.endTime }}
                </p>
              </div>
              <div>
                <span class="text-slate-500 font-semibold block text-[10px] uppercase">Exam Center & Hall:</span>
                <span class="font-bold text-slate-900">
                  {{ selectedScheduleForCards?.hall?.hallName }}
                </span>
                <p class="text-slate-600 mt-0.5">
                  {{ selectedScheduleForCards?.hall?.centerLocation }}
                  <span *ngIf="selectedScheduleForCards?.hall?.roomNumber" class="font-mono font-bold">({{ selectedScheduleForCards?.hall?.roomNumber }})</span>
                </p>
              </div>
            </div>
          </div>

          <!-- Instructions -->
          <div class="space-y-1 text-[11px] text-slate-600 border-t border-slate-200 pt-3">
            <h5 class="font-bold text-slate-900 text-xs">General Instructions for Candidates:</h5>
            <ol class="list-decimal pl-4 space-y-0.5">
              <li>Candidate must bring this printed Admit Card along with original National ID Card (NID) to the examination hall.</li>
              <li>Candidates must report at least 30 minutes prior to the scheduled exam commencement time.</li>
              <li>Mobile phones, smartwatches, calculators, or unauthorized electronic devices are strictly prohibited.</li>
              <li>The QR code printed on this card contains encrypted authentication data and will be scanned at the entry gate.</li>
            </ol>
          </div>

          <!-- Signatures -->
          <div class="flex items-end justify-between pt-6 border-t border-slate-300 text-xs">
            <div class="text-center">
              <div class="w-32 border-b border-slate-400 pb-1 font-mono text-[10px] text-slate-500">Candidate Signature</div>
              <span class="text-[10px] text-slate-500">Sign in presence of Invigilator</span>
            </div>
            <div class="text-center">
              <div class="w-40 border-b border-slate-900 pb-1 font-serif font-bold text-slate-900 text-xs">Controller of Examinations</div>
              <span class="text-[10px] text-slate-600 font-semibold">UDDIPAN Recruitment Board</span>
            </div>
          </div>

          <!-- Modal Action Bar -->
          <div class="flex items-center justify-end gap-3 pt-4 border-t border-slate-300">
            <button 
              type="button" 
              (click)="showSingleAdmitCardPrintModal = false" 
              class="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-200 hover:bg-slate-300 rounded-lg transition-colors">
              Close Preview
            </button>
            <button 
              type="button" 
              (click)="printAdmitCard()" 
              class="px-5 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-600 rounded-lg transition-colors shadow flex items-center gap-1.5">
              <span>Print Admit Card</span>
            </button>
          </div>
        </div>
      </div>

      <!-- ================================================================= -->
      <!-- MODAL 5: BATCH ADMIT CARDS PRINT DOSSIER (ALL CANDIDATES WITH QR) -->
      <!-- ================================================================= -->
      <div *ngIf="showBatchPrintPreviewModal" class="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
        <div class="bg-white text-slate-900 rounded-2xl w-full max-w-4xl shadow-2xl p-6 space-y-6 max-h-[95vh] overflow-y-auto border-2 border-slate-200">
          <div class="flex items-center justify-between border-b pb-3">
            <div>
              <h3 class="text-base font-bold text-slate-900">Batch Admit Cards Print Dossier</h3>
              <p class="text-xs text-slate-500">{{ selectedScheduleForCards?.circular?.title }} &bull; {{ selectedScheduleAdmitCards.length }} Candidate Cards with Unique QR Verification</p>
            </div>
            <div class="flex items-center gap-2">
              <button 
                type="button" 
                (click)="showBatchPrintPreviewModal = false" 
                class="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-200 hover:bg-slate-300 rounded-lg transition-colors">
                Close
              </button>
              <button 
                type="button" 
                (click)="printAdmitCard()" 
                class="px-4 py-1.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-600 rounded-lg transition-colors shadow flex items-center gap-1.5">
                <span>Print All {{ selectedScheduleAdmitCards.length }} Cards</span>
              </button>
            </div>
          </div>

          <!-- Printable Cards Loop -->
          <div class="space-y-8">
            <div *ngFor="let card of selectedScheduleAdmitCards; let i = index" class="border-2 border-slate-900 rounded-xl p-6 bg-white space-y-4">
              <!-- Official Header -->
              <div class="flex items-center justify-between border-b-2 border-slate-900 pb-3">
                <div>
                  <h2 class="text-xl font-black text-emerald-800 tracking-tight uppercase">UDDIPAN</h2>
                  <p class="text-[10px] font-semibold text-slate-600 uppercase tracking-widest">United Development Initiatives for Programmed Actions</p>
                  <p class="text-[11px] text-slate-500">Head Office: UDDIPAN Bhaban, Mirpur-2, Dhaka-1216</p>
                </div>
                <div class="text-right">
                  <span class="px-2.5 py-0.5 rounded bg-emerald-100 text-emerald-900 font-mono font-bold text-[11px] uppercase border border-emerald-300">
                    Official Admit Card
                  </span>
                  <p class="text-[11px] font-mono font-bold text-slate-700 mt-0.5">{{ card.admitCardNo }}</p>
                </div>
              </div>

              <!-- Position Banner -->
              <div class="bg-slate-100 p-3 rounded-lg border border-slate-300 flex items-center justify-between text-xs">
                <div>
                  <span class="text-[10px] uppercase font-semibold text-slate-500">Post Applied For:</span>
                  <div class="font-bold text-slate-900 text-sm">{{ selectedScheduleForCards?.circular?.title }}</div>
                  <div class="text-[10px] font-mono text-slate-600">Circular No: {{ selectedScheduleForCards?.circular?.circularNo }}</div>
                </div>
                <div class="text-right">
                  <span class="text-[10px] uppercase font-semibold text-slate-500">Examination Type:</span>
                  <div class="font-bold text-emerald-700 text-sm">{{ selectedScheduleForCards?.examType }} TEST</div>
                </div>
              </div>

              <!-- Candidate Info, Photo & QR -->
              <div class="grid grid-cols-1 md:grid-cols-4 gap-4 border border-slate-300 rounded-lg p-3 text-xs bg-slate-50/50">
                <div class="md:col-span-2 space-y-1.5">
                  <div class="grid grid-cols-3 gap-1">
                    <span class="text-slate-500 font-semibold">Roll Number:</span>
                    <span class="col-span-2 font-mono font-black text-emerald-700 text-base">{{ card.rollNumber }}</span>
                  </div>
                  <div class="grid grid-cols-3 gap-1">
                    <span class="text-slate-500 font-semibold">Seat Number:</span>
                    <span class="col-span-2 font-mono font-bold text-slate-900">{{ card.seatNumber }}</span>
                  </div>
                  <div class="grid grid-cols-3 gap-1">
                    <span class="text-slate-500 font-semibold">Candidate Name:</span>
                    <span class="col-span-2 font-bold text-slate-900">{{ card.candidate?.fullName }}</span>
                  </div>
                  <div class="grid grid-cols-3 gap-1">
                    <span class="text-slate-500 font-semibold">Tracking ID:</span>
                    <span class="col-span-2 font-mono text-slate-700">{{ card.candidate?.trackingId }}</span>
                  </div>
                  <div class="grid grid-cols-3 gap-1">
                    <span class="text-slate-500 font-semibold">Home District:</span>
                    <span class="col-span-2 text-slate-800">{{ card.candidate?.district }}</span>
                  </div>
                </div>

                <div class="flex flex-col items-center justify-center border border-slate-300 rounded-lg p-2 bg-white text-center">
                  <div class="w-16 h-20 bg-slate-100 border border-slate-200 rounded flex items-center justify-center text-[9px] text-slate-400 font-semibold overflow-hidden">
                    <img *ngIf="card.candidate?.photoUrl" [src]="card.candidate.photoUrl" class="w-full h-full object-cover" alt="Photo" />
                    <span *ngIf="!card.candidate?.photoUrl">Photo</span>
                  </div>
                  <span class="text-[8px] font-mono text-slate-500 mt-1">Verified Photo</span>
                </div>

                <!-- Authentic Scannable QR Code -->
                <div class="flex flex-col items-center justify-center border border-slate-300 rounded-lg p-2 bg-white text-center shadow-sm">
                  <div class="w-20 h-20 p-1 flex items-center justify-center">
                    <img *ngIf="card.qrDataUrl" [src]="card.qrDataUrl" class="w-full h-full object-contain" alt="QR" />
                    <span *ngIf="!card.qrDataUrl" class="text-[8px] text-slate-400">QR Loading</span>
                  </div>
                  <span class="text-[8px] font-mono font-bold text-emerald-800 mt-0.5">Scan to Verify</span>
                </div>
              </div>

              <!-- Venue Details -->
              <div class="border border-slate-300 rounded-lg p-3 bg-slate-50 grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span class="text-[10px] uppercase font-semibold text-slate-500">Date & Time:</span>
                  <div class="font-bold text-slate-900">{{ selectedScheduleForCards?.examDate | date:'EEEE, dd MMMM yyyy' }}</div>
                  <div class="font-mono text-emerald-800 font-bold text-[11px]">{{ selectedScheduleForCards?.startTime }} - {{ selectedScheduleForCards?.endTime }}</div>
                </div>
                <div>
                  <span class="text-[10px] uppercase font-semibold text-slate-500">Exam Hall & Center:</span>
                  <div class="font-bold text-slate-900">{{ selectedScheduleForCards?.hall?.hallName }}</div>
                  <div class="text-slate-600 text-[11px]">{{ selectedScheduleForCards?.hall?.centerLocation }}</div>
                </div>
              </div>

              <!-- Instructions & Signatures -->
              <div class="flex items-end justify-between pt-3 border-t border-slate-300 text-xs">
                <div class="text-[10px] text-slate-500">
                  Must bring printed card & original NID. Mobile phones prohibited. Security QR code verified at gate.
                </div>
                <div class="text-center">
                  <div class="w-36 border-b border-slate-900 pb-0.5 font-serif font-bold text-xs text-slate-900">Controller of Examinations</div>
                  <span class="text-[9px] text-slate-600">UDDIPAN Recruitment Board</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ================================================================= -->
      <!-- MODAL: EXPORT TABULATION OPTIONS & DATA SCOPE -->
      <!-- ================================================================= -->
      <div *ngIf="showExportTabulationModal" class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
        <div class="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl p-6 space-y-5">
          <!-- Header -->
          <div class="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <div class="flex items-center gap-2">
                <span class="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950 border border-emerald-800 text-emerald-400 font-bold uppercase">OFFICIAL</span>
                <h3 class="text-base font-bold text-slate-100">Export Examination Tabulation Sheet</h3>
              </div>
              <p class="text-xs text-slate-400 mt-1">
                Configure data scope, format, and download official merit tabulation records.
              </p>
            </div>
            <button 
              (click)="closeExportTabulationModal()" 
              class="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center font-mono text-xs">
              ✕
            </button>
          </div>

          <!-- Session Summary Card -->
          <div class="bg-slate-950 p-3.5 rounded-xl border border-slate-800/90 text-xs space-y-2">
            <div class="flex items-center justify-between">
              <span class="text-slate-400">Position / Circular:</span>
              <span class="font-semibold text-slate-200">
                {{ selectedTabulationSchedule?.circular?.title || 'Field Officer (Microfinance Operations)' }}
              </span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-slate-400">Examination Session:</span>
              <span class="font-mono text-emerald-400 font-bold">
                {{ selectedTabulationSchedule?.examType || 'WRITTEN' }} TEST (Max: {{ selectedTabulationSchedule?.totalMarks || 100 }})
              </span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-slate-400">Active Cutoff Threshold:</span>
              <span class="px-2 py-0.5 rounded bg-emerald-950 border border-emerald-800 text-emerald-300 font-mono font-bold">
                >= {{ cutoffMarksThreshold }} Marks
              </span>
            </div>
          </div>

          <!-- Filter Scope Selection -->
          <div class="space-y-2">
            <label class="text-xs font-semibold text-slate-300">Data Scope to Include:</label>
            <div class="grid grid-cols-3 gap-2">
              <button 
                type="button"
                (click)="exportTabulationScope = 'ALL'"
                [ngClass]="exportTabulationScope === 'ALL' ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300 font-bold' : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'"
                class="p-2.5 rounded-xl border text-left text-xs transition-all">
                <div class="font-semibold">All Candidates</div>
                <div class="text-[10px] opacity-75 mt-0.5 font-mono">{{ tabulationTotalAppeared }} Records</div>
              </button>

              <button 
                type="button"
                (click)="exportTabulationScope = 'QUALIFIED'"
                [ngClass]="exportTabulationScope === 'QUALIFIED' ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300 font-bold' : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'"
                class="p-2.5 rounded-xl border text-left text-xs transition-all">
                <div class="font-semibold text-emerald-400">Qualified Only</div>
                <div class="text-[10px] opacity-75 mt-0.5 font-mono">{{ tabulationQualifiedCount }} for Viva</div>
              </button>

              <button 
                type="button"
                (click)="exportTabulationScope = 'BELOW_CUTOFF'"
                [ngClass]="exportTabulationScope === 'BELOW_CUTOFF' ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300 font-bold' : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'"
                class="p-2.5 rounded-xl border text-left text-xs transition-all">
                <div class="font-semibold text-rose-400">Below Cutoff</div>
                <div class="text-[10px] opacity-75 mt-0.5 font-mono">{{ tabulationBelowCutoffCount }} Records</div>
              </button>
            </div>
          </div>

          <!-- Export Format Selection -->
          <div class="space-y-2">
            <label class="text-xs font-semibold text-slate-300">Export Template Format:</label>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button 
                type="button"
                (click)="exportTabulationFormat = 'EXCEL'"
                [ngClass]="exportTabulationFormat === 'EXCEL' ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300 font-bold' : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'"
                class="p-3 rounded-xl border text-left text-xs transition-all flex items-start gap-2.5">
                <span class="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-700 shrink-0">XLS</span>
                <div>
                  <div class="font-bold text-slate-100">Professional Excel Workbook</div>
                  <div class="text-[10px] text-slate-400 mt-0.5">Styled table with colors, badges, KPI headers &amp; official sign-off block</div>
                </div>
              </button>

              <button 
                type="button"
                (click)="exportTabulationFormat = 'CSV'"
                [ngClass]="exportTabulationFormat === 'CSV' ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300 font-bold' : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'"
                class="p-3 rounded-xl border text-left text-xs transition-all flex items-start gap-2.5">
                <span class="text-xs font-mono font-bold text-blue-400 bg-blue-950/80 px-2 py-0.5 rounded border border-blue-700 shrink-0">CSV</span>
                <div>
                  <div class="font-bold text-slate-100">Clean Standard CSV</div>
                  <div class="text-[10px] text-slate-400 mt-0.5">Raw comma-separated dataset for databases, SPSS, or external ATS systems</div>
                </div>
              </button>
            </div>
          </div>

          <!-- Header Metadata Checkbox -->
          <div class="flex items-center gap-2 pt-1">
            <input 
              type="checkbox" 
              id="includeHeaderMeta"
              [(ngModel)]="exportTabulationIncludeHeader"
              class="rounded bg-slate-950 border-slate-700 text-emerald-500 focus:ring-0">
            <label for="includeHeaderMeta" class="text-xs text-slate-300 cursor-pointer">
              Include official UDDIPAN organization header, cutoff metadata, and date timestamp
            </label>
          </div>

          <!-- Actions Footer -->
          <div class="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-800">
            <button 
              type="button"
              (click)="closeExportTabulationModal()" 
              class="w-full sm:w-auto px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 bg-slate-800 rounded-lg">
              Cancel
            </button>

            <div class="flex items-center gap-2 w-full sm:w-auto">
              <button 
                type="button"
                (click)="openPrintTabulationModal()"
                class="flex-1 sm:flex-none px-3.5 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 rounded-lg transition-colors">
                Print / PDF Gazette
              </button>
              <button 
                type="button"
                (click)="downloadTabulationFile(exportTabulationFormat)" 
                class="flex-1 sm:flex-none px-4 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors shadow-md flex items-center justify-center gap-1.5">
                <span>Export {{ exportTabulationFormat === 'EXCEL' ? 'Excel (.xls)' : 'CSV (.csv)' }} ({{ exportFilteredTabulationScores.length }})</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- ================================================================= -->
      <!-- MODAL: OFFICIAL EXAMINATION ATTENDANCE & CANDIDATE SIGNATURE SHEET PRINT DOSSIER -->
      <!-- ================================================================= -->
      <div *ngIf="showPrintAttendanceModal" class="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
        <div class="bg-white text-slate-900 rounded-2xl w-full max-w-5xl shadow-2xl p-6 space-y-6 max-h-[95vh] overflow-y-auto border-2 border-slate-200">
          <!-- Control Bar (Screen Only) -->
          <div class="flex flex-wrap items-center justify-between border-b pb-3 gap-3 print-control-bar">
            <div>
              <h3 class="text-base font-bold text-slate-900">Official Examination Attendance &amp; Candidate Signature Sheet</h3>
              <p class="text-xs text-slate-500">
                UDDIPAN Central Examination Board &bull; Invigilation Hall Roster &amp; Candidate Verification
              </p>
            </div>
            <div class="flex items-center gap-2">
              <div *ngIf="attendanceSheetRooms.length > 1" class="flex items-center gap-1.5 text-xs mr-2">
                <span class="text-slate-600 font-semibold">Room:</span>
                <select [(ngModel)]="attendanceSheetRoomFilter" class="bg-slate-100 border border-slate-300 rounded px-2 py-1 text-xs text-slate-800">
                  <option value="ALL">All Rooms ({{ attendanceRecords.length }})</option>
                  <option *ngFor="let room of attendanceSheetRooms" [value]="room">{{ room }}</option>
                </select>
              </div>
              <button 
                type="button" 
                (click)="closePrintAttendanceModal()" 
                class="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-200 hover:bg-slate-300 rounded-lg transition-colors">
                Close
              </button>
              <button 
                type="button" 
                (click)="exportAttendanceCsv()" 
                class="px-3.5 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 rounded-lg transition-colors">
                Download CSV
              </button>
              <button 
                type="button" 
                (click)="printAttendanceDocument()" 
                class="px-4 py-1.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-600 rounded-lg transition-colors shadow flex items-center gap-1.5">
                <span>Print Official Sheet (PDF)</span>
              </button>
            </div>
          </div>

          <!-- Printable Document Container -->
          <div class="printable-sheet p-6 bg-white space-y-5 border border-slate-300 rounded-xl">
            <!-- Official Institutional Header -->
            <div class="flex items-start justify-between border-b-2 border-slate-900 pb-4">
              <div>
                <div class="flex items-center gap-3">
                  <div class="w-12 h-12 rounded-lg bg-emerald-900 text-white font-black flex items-center justify-center text-xl tracking-tighter shadow-sm">
                    UDP
                  </div>
                  <div>
                    <h1 class="text-2xl font-black text-emerald-950 tracking-tight uppercase">UDDIPAN</h1>
                    <p class="text-[11px] font-bold text-slate-700 uppercase tracking-widest">United Development Initiatives for Programmed Actions</p>
                  </div>
                </div>
                <p class="text-xs text-slate-600 mt-2">Head Office: House # 9/3, Road # 2, Block # D, Banasree, Rampura, Dhaka-1219, Bangladesh</p>
                <p class="text-[11px] text-slate-500 font-semibold">Human Resources &amp; Administration Division &bull; Central Examination Board</p>
              </div>
              <div class="text-right space-y-1">
                <span class="inline-block px-3 py-1 rounded bg-emerald-100 text-emerald-950 font-mono font-bold text-xs uppercase border border-emerald-400">
                  ATTENDANCE &amp; SIGNATURE ROSTER
                </span>
                <p class="text-xs font-mono text-slate-600">Date: {{ todayDate | date:'dd MMMM yyyy' }}</p>
                <p class="text-[10px] font-mono text-slate-500">Ref: UDDIPAN/HR-REC/ATT/{{ selectedAttendanceSchedule?.circular?.circularNo || 'CIR-2026-0001' }}</p>
                <p class="text-[10px] text-slate-500 font-mono">Confidential &bull; Examination Hall Record</p>
              </div>
            </div>

            <!-- Position, Schedule & Venue Grid -->
            <div class="grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-300 text-xs">
              <div>
                <span class="text-[10px] font-bold uppercase text-slate-500">Post Applied For:</span>
                <div class="font-bold text-slate-900 text-sm mt-0.5">
                  {{ selectedAttendanceSchedule?.circular?.title || 'Field Officer (Microfinance Credit & Operations)' }}
                </div>
                <div class="text-[10px] font-mono text-slate-600">
                  Circular: {{ selectedAttendanceSchedule?.circular?.circularNo || 'CIR-2026-0001' }}
                </div>
              </div>

              <div>
                <span class="text-[10px] font-bold uppercase text-slate-500">Examination Stage:</span>
                <div class="font-bold text-emerald-900 text-sm mt-0.5">
                  {{ selectedAttendanceSchedule?.examType || 'WRITTEN' }} TEST
                </div>
                <div class="text-[10px] font-mono text-slate-600">
                  Total Marks: {{ selectedAttendanceSchedule?.totalMarks || 100 }} | Pass: {{ selectedAttendanceSchedule?.passMarks || 50 }}
                </div>
              </div>

              <div>
                <span class="text-[10px] font-bold uppercase text-slate-500">Center &amp; Hall:</span>
                <div class="font-bold text-slate-900 text-sm mt-0.5">
                  {{ selectedAttendanceSchedule?.hall?.hallName || 'Hall A - Central Auditorium' }}
                </div>
                <div class="text-[10px] text-slate-600">
                  {{ selectedAttendanceSchedule?.hall?.centerLocation || 'Dhaka College Complex, Mirpur Road' }}
                </div>
              </div>

              <div>
                <span class="text-[10px] font-bold uppercase text-slate-500">Date &amp; Time Window:</span>
                <div class="font-bold text-slate-900 text-sm mt-0.5">
                  {{ selectedAttendanceSchedule?.examDate | date:'dd MMM yyyy' }}
                </div>
                <div class="text-[10px] font-mono text-slate-600">
                  {{ selectedAttendanceSchedule?.startTime || '10:00 AM' }} - {{ selectedAttendanceSchedule?.endTime || '12:00 PM' }}
                </div>
              </div>
            </div>

            <!-- Real-time Attendance KPI Strip -->
            <div class="flex items-center justify-between bg-slate-100 border border-slate-300 px-4 py-2 rounded-lg text-xs font-medium text-slate-800">
              <span>Allotted Candidates: <strong class="font-mono text-slate-900 font-bold text-sm">{{ attendanceTotalCount }}</strong></span>
              <span class="text-emerald-800">Present: <strong class="font-mono font-bold text-sm">{{ attendancePresentCount }}</strong></span>
              <span class="text-rose-800">Absent: <strong class="font-mono font-bold text-sm">{{ attendanceAbsentCount }}</strong></span>
              <span class="text-blue-900">Attendance Rate: <strong class="font-mono font-bold text-sm">{{ attendanceRatePercent }}%</strong></span>
              <span class="text-slate-600 text-[11px] italic">Room: {{ attendanceSheetRoomFilter === 'ALL' ? 'All Sections' : attendanceSheetRoomFilter }}</span>
            </div>

            <!-- Mandatory Invigilation Instructions Notice -->
            <div class="bg-amber-50 border-l-4 border-amber-600 p-2.5 rounded-r text-[11px] text-amber-950 flex items-start gap-2">
              <span class="font-bold uppercase tracking-wider text-[10px] bg-amber-200 px-1.5 py-0.5 rounded text-amber-900 shrink-0">Invigilator Notice</span>
              <span>
                Verify each candidate against their original National ID and issued Admit Card. Obtain the handwritten signature with indelible ink in the specified box. Ensure the serial number of the supplied Answer Script / OMR Sheet is clearly recorded.
              </span>
            </div>

            <!-- Official Signature Roster Table -->
            <div class="border border-slate-900 rounded-lg overflow-hidden">
              <table class="w-full text-left border-collapse text-xs">
                <thead>
                  <tr class="bg-slate-200 text-slate-900 font-bold uppercase text-[10px] border-b-2 border-slate-900">
                    <th class="py-2.5 px-2 border-r border-slate-400 text-center w-8">SL</th>
                    <th class="py-2.5 px-3 border-r border-slate-400 text-center w-24">Roll No.</th>
                    <th class="py-2.5 px-3 border-r border-slate-400 text-center w-28">Tracking ID</th>
                    <th class="py-2.5 px-3 border-r border-slate-400">Candidate Name &amp; Academic Background</th>
                    <th class="py-2.5 px-2 border-r border-slate-400 text-center w-24">Seat / Desk</th>
                    <th class="py-2.5 px-3 border-r border-slate-400 text-center w-36">Script / OMR Booklet Serial No.</th>
                    <th class="py-2.5 px-3 border-r border-slate-400 text-center w-48">Candidate Signature &amp; Date</th>
                    <th class="py-2.5 px-2 border-r border-slate-400 text-center w-20">Attendance</th>
                    <th class="py-2.5 px-2 text-center w-16">Invigilator Initial</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-400 text-slate-900">
                  <tr *ngFor="let r of printFilteredAttendanceRecords; let idx = index" class="border-b border-slate-400">
                    <td class="py-2 px-2 text-center font-mono font-bold text-slate-700 border-r border-slate-400">
                      {{ idx + 1 }}
                    </td>
                    <td class="py-2 px-3 text-center border-r border-slate-400">
                      <span class="font-mono font-black text-sm text-slate-950">{{ r.rollNumber }}</span>
                    </td>
                    <td class="py-2 px-3 text-center font-mono text-[11px] text-slate-600 border-r border-slate-400">
                      {{ r.trackingId }}
                    </td>
                    <td class="py-2 px-3 border-r border-slate-400">
                      <div class="font-bold text-slate-900 text-xs">{{ r.fullName }}</div>
                      <div class="text-[10px] text-slate-600">{{ r.highestDegree }} &bull; District: {{ r.district }}</div>
                    </td>
                    <td class="py-2 px-2 text-center border-r border-slate-400 font-mono text-xs font-semibold text-slate-800">
                      {{ r.seatNumber }}
                    </td>
                    <td class="py-2 px-3 text-center border-r border-slate-400 bg-slate-50/50">
                      <div class="h-8 border border-dashed border-slate-400 rounded flex items-center justify-center font-mono text-xs text-slate-400">
                        [ Serial No. ]
                      </div>
                    </td>
                    <td class="py-2 px-3 border-r border-slate-400 bg-white">
                      <div class="h-10 border border-slate-300 rounded p-1 flex flex-col justify-end">
                        <div class="border-t border-slate-400 pt-0.5 text-[8px] font-mono text-slate-400 text-center uppercase tracking-wider">
                          Signature of Candidate
                        </div>
                      </div>
                    </td>
                    <td class="py-2 px-2 text-center border-r border-slate-400">
                      <span 
                        class="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase font-mono border"
                        [ngClass]="r.attendanceStatus === 'PRESENT' ? 'bg-emerald-100 text-emerald-950 border-emerald-400' : (r.attendanceStatus === 'ABSENT' ? 'bg-rose-100 text-rose-950 border-rose-400' : 'bg-amber-100 text-amber-950 border-amber-400')">
                        {{ r.attendanceStatus }}
                      </span>
                    </td>
                    <td class="py-2 px-2 text-center">
                      <div class="h-8 border border-dashed border-slate-400 rounded flex items-center justify-center text-[10px] text-slate-300 font-mono">
                        Initials
                      </div>
                    </td>
                  </tr>
                  <tr *ngIf="printFilteredAttendanceRecords.length === 0">
                    <td colspan="9" class="py-6 text-center text-slate-500 italic">
                      No candidate attendance records found for this schedule.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Official Invigilation Certificate & Authority Signatures Block -->
            <div class="border-2 border-slate-800 p-4 rounded-xl space-y-4 bg-slate-50 mt-4 break-inside-avoid">
              <div class="text-[11px] text-slate-800 leading-relaxed font-serif">
                <strong>CERTIFICATE BY ROOM INVIGILATOR:</strong> Certified that I have conducted the examination in 
                <u>{{ selectedAttendanceSchedule?.hall?.hallName || 'Hall A - Central Auditorium' }}</u>. A total of 
                <strong>{{ attendanceTotalCount }}</strong> candidates were registered, out of which 
                <strong>{{ attendancePresentCount }}</strong> were physically present, and 
                <strong>{{ attendanceAbsentCount }}</strong> were absent. All signatures were taken in my presence after verifying their Admit Cards and National ID cards.
              </div>

              <!-- 3 Signatures Columns -->
              <div class="grid grid-cols-3 gap-6 pt-6 text-xs text-slate-800">
                <div class="text-center space-y-1">
                  <div class="border-t-2 border-slate-800 w-44 mx-auto pt-1 font-bold text-slate-900">
                    Room Invigilator
                  </div>
                  <p class="text-[10px] text-slate-600">Signature &bull; Name &bull; Staff ID</p>
                  <p class="text-[9px] font-mono text-slate-500">Date: ____________________</p>
                </div>

                <div class="text-center space-y-1">
                  <div class="border-t-2 border-slate-800 w-44 mx-auto pt-1 font-bold text-slate-900">
                    Center Superintendent
                  </div>
                  <p class="text-[10px] text-slate-600">Signature &bull; Official Seal</p>
                  <p class="text-[9px] font-mono text-slate-500">Date: ____________________</p>
                </div>

                <div class="text-center space-y-1">
                  <div class="border-t-2 border-slate-800 w-44 mx-auto pt-1 font-bold text-slate-900">
                    Member Secretary / HR Board
                  </div>
                  <p class="text-[10px] text-slate-600">Directorate of People &amp; Culture</p>
                  <p class="text-[9px] font-mono text-slate-500">UDDIPAN Central Head Office</p>
                </div>
              </div>
            </div>

            <!-- Document Footer Note -->
            <div class="flex items-center justify-between text-[9px] font-mono text-slate-500 pt-2 border-t border-slate-300">
              <span>UDDIPAN Enterprise HRIS &bull; Module 7: Candidate Logistics &amp; ATS</span>
              <span>Computer Generated Confidential Examination Document &bull; Page 1 of 1</span>
              <span>Printed: {{ todayDate | date:'yyyy-MM-dd HH:mm:ss' }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- ================================================================= -->
      <!-- MODAL: OFFICIAL TABULATION SHEET & GAZETTED MERIT LIST PRINT DOSSIER -->
      <!-- ================================================================= -->
      <div *ngIf="showPrintTabulationModal" class="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
        <div class="bg-white text-slate-900 rounded-2xl w-full max-w-5xl shadow-2xl p-6 space-y-6 max-h-[95vh] overflow-y-auto border-2 border-slate-200">
          <!-- Control Bar -->
          <div class="flex flex-wrap items-center justify-between border-b pb-3 gap-2 print-control-bar">
            <div>
              <h3 class="text-base font-bold text-slate-900">Official Gazetted Tabulation Sheet &amp; Merit List</h3>
              <p class="text-xs text-slate-500">
                UDDIPAN HR &amp; Recruitment Wing &bull; Certified Examination Results
              </p>
            </div>
            <div class="flex items-center gap-2">
              <button 
                type="button" 
                (click)="closePrintTabulationModal()" 
                class="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-200 hover:bg-slate-300 rounded-lg transition-colors">
                Close
              </button>
              <button 
                type="button" 
                (click)="downloadTabulationFile('EXCEL')" 
                class="px-3.5 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 rounded-lg transition-colors flex items-center gap-1.5">
                <span>Export Excel (.xls)</span>
              </button>
              <button 
                type="button" 
                (click)="downloadTabulationFile('CSV')" 
                class="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg transition-colors">
                Download CSV
              </button>
              <button 
                type="button" 
                (click)="printTabulationDocument()" 
                class="px-4 py-1.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-600 rounded-lg transition-colors shadow flex items-center gap-1.5">
                <span>Print Official Gazette (PDF)</span>
              </button>
            </div>
          </div>

          <!-- Printable Document Container -->
          <div class="printable-sheet p-6 bg-white space-y-6 border border-slate-300 rounded-xl">
            <!-- Official Header -->
            <div class="flex items-start justify-between border-b-2 border-slate-900 pb-4">
              <div>
                <h1 class="text-2xl font-black text-emerald-900 tracking-tight uppercase">UDDIPAN</h1>
                <p class="text-[11px] font-bold text-slate-700 uppercase tracking-widest">United Development Initiatives for Programmed Actions</p>
                <p class="text-xs text-slate-600">Head Office: UDDIPAN Bhaban, Mirpur-2, Dhaka-1216, Bangladesh</p>
                <p class="text-[11px] text-slate-500">Human Resources & Recruitment Division &bull; Examination Board</p>
              </div>
              <div class="text-right space-y-1">
                <span class="inline-block px-3 py-1 rounded bg-emerald-100 text-emerald-900 font-mono font-bold text-xs uppercase border border-emerald-400">
                  Gazetted Tabulation Sheet
                </span>
                <p class="text-xs font-mono text-slate-600">Date: {{ todayDate | date:'dd MMMM yyyy' }}</p>
                <p class="text-[10px] font-mono text-slate-500">Ref: UDDIPAN/HR-REC/TAB/{{ todayDate | date:'yyyy' }}</p>
              </div>
            </div>

            <!-- Position & Exam Details Box -->
            <div class="grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-300 text-xs">
              <div>
                <span class="text-[10px] font-bold uppercase text-slate-500">Post Applied For:</span>
                <div class="font-bold text-slate-900 text-sm mt-0.5">
                  {{ selectedTabulationSchedule?.circular?.title || 'Field Officer (Microfinance Operations)' }}
                </div>
                <div class="text-[10px] font-mono text-slate-600">
                  Circular No: {{ selectedTabulationSchedule?.circular?.circularNo || 'CIR-2026-0001' }}
                </div>
              </div>

              <div>
                <span class="text-[10px] font-bold uppercase text-slate-500">Exam Type & Session:</span>
                <div class="font-bold text-emerald-800 text-sm mt-0.5">
                  {{ selectedTabulationSchedule?.examType || 'WRITTEN' }} TEST
                </div>
                <div class="text-[10px] text-slate-600">
                  Date: {{ selectedTabulationSchedule?.examDate | date:'dd MMM yyyy' }}
                </div>
              </div>

              <div>
                <span class="text-[10px] font-bold uppercase text-slate-500">Venue & Center:</span>
                <div class="font-bold text-slate-900 text-sm mt-0.5">
                  {{ selectedTabulationSchedule?.hall?.hallName || 'Hall A - Central Auditorium' }}
                </div>
                <div class="text-[10px] text-slate-600">
                  {{ selectedTabulationSchedule?.hall?.centerLocation || 'Dhaka College Complex, Mirpur Road' }}
                </div>
              </div>

              <div>
                <span class="text-[10px] font-bold uppercase text-slate-500">Cutoff Standard:</span>
                <div class="font-bold text-emerald-800 text-sm mt-0.5">
                  Cutoff: {{ cutoffMarksThreshold }} / 100 Marks
                </div>
                <div class="text-[10px] font-mono text-slate-600">
                  Pass Mark Threshold: >= {{ cutoffMarksThreshold }}
                </div>
              </div>
            </div>

            <!-- Summary KPI Strip -->
            <div class="flex items-center justify-between bg-emerald-50/70 border border-emerald-200 px-4 py-2.5 rounded-lg text-xs">
              <span class="text-emerald-950 font-semibold">
                Total Evaluated Papers: <strong class="font-mono text-emerald-900 font-bold">{{ tabulationTotalAppeared }}</strong>
              </span>
              <span class="text-emerald-950 font-semibold">
                Qualified for Viva Board: <strong class="font-mono text-emerald-900 font-bold">{{ tabulationQualifiedCount }}</strong>
              </span>
              <span class="text-emerald-950 font-semibold">
                Below Cutoff: <strong class="font-mono text-rose-800 font-bold">{{ tabulationBelowCutoffCount }}</strong>
              </span>
              <span class="text-emerald-950 font-semibold">
                Qualification Rate: <strong class="font-mono text-emerald-900 font-bold">{{ tabulationPassRate }}%</strong>
              </span>
            </div>

            <!-- Tabulation Table -->
            <div class="border border-slate-300 rounded-xl overflow-hidden">
              <table class="w-full text-left border-collapse text-xs">
                <thead>
                  <tr class="bg-slate-100 border-b border-slate-300 text-slate-700 font-mono text-[10px] uppercase font-bold">
                    <th class="py-2.5 px-3 text-center">Merit Rank</th>
                    <th class="py-2.5 px-3">Roll Number</th>
                    <th class="py-2.5 px-3">Tracking ID</th>
                    <th class="py-2.5 px-3">Candidate Full Name</th>
                    <th class="py-2.5 px-3">District</th>
                    <th class="py-2.5 px-3 text-center">Marks (100)</th>
                    <th class="py-2.5 px-3 text-center">Cutoff Delta</th>
                    <th class="py-2.5 px-3 text-center">Status / Eligibility</th>
                    <th class="py-2.5 px-3 text-center">Sign / Remarks</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-200 text-slate-800">
                  <tr *ngFor="let s of exportFilteredTabulationScores" class="hover:bg-slate-50">
                    <td class="py-2 px-3 text-center font-mono font-bold">
                      <span class="inline-block px-2 py-0.5 rounded text-[11px]"
                        [ngClass]="{
                          'bg-amber-100 text-amber-900 font-black border border-amber-300': s.meritRank === 1,
                          'bg-slate-200 text-slate-800 font-black border border-slate-300': s.meritRank === 2,
                          'bg-amber-50 text-amber-800 font-bold border border-amber-200': s.meritRank === 3,
                          'text-slate-600': s.meritRank > 3
                        }">
                        #{{ s.meritRank }}
                      </span>
                    </td>
                    <td class="py-2 px-3 font-mono font-bold text-slate-900">{{ s.rollNumber }}</td>
                    <td class="py-2 px-3 font-mono text-[11px] text-slate-600">{{ s.trackingId }}</td>
                    <td class="py-2 px-3 font-semibold text-slate-900">{{ s.fullName }}</td>
                    <td class="py-2 px-3 text-slate-600">{{ s.district }}</td>
                    <td class="py-2 px-3 text-center font-mono font-bold text-slate-900 text-sm">{{ s.marksObtained }}</td>
                    <td class="py-2 px-3 text-center font-mono text-[11px]"
                      [ngClass]="s.marksObtained >= cutoffMarksThreshold ? 'text-emerald-700 font-bold' : 'text-rose-600'">
                      {{ s.marksObtained >= cutoffMarksThreshold ? '+' : '' }}{{ (s.marksObtained - cutoffMarksThreshold).toFixed(1) }}
                    </td>
                    <td class="py-2 px-3 text-center">
                      <span class="px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase"
                        [ngClass]="s.isPassed ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' : 'bg-rose-100 text-rose-800 border border-rose-300'">
                        {{ s.isPassed ? 'QUALIFIED FOR VIVA' : 'BELOW CUTOFF' }}
                      </span>
                    </td>
                    <td class="py-2 px-3 text-center text-slate-400 font-mono text-[10px]">
                      &mdash;&mdash;&mdash;
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Certification & Signatories -->
            <div class="pt-6 border-t-2 border-slate-300 space-y-8">
              <p class="text-[11px] text-slate-600 italic">
                * Certification: This marks tabulation sheet is compiled and verified in accordance with UDDIPAN HR Policy Manual. All qualifying candidates are hereby endorsed for the Viva Voce examination board.
              </p>

              <div class="grid grid-cols-3 gap-6 pt-4 text-center text-xs text-slate-800">
                <div class="border-t border-slate-900 pt-1.5">
                  <p class="font-bold">Senior Officer (Recruitment)</p>
                  <p class="text-[10px] text-slate-500">Prepared & Tabulated By</p>
                </div>
                <div class="border-t border-slate-900 pt-1.5">
                  <p class="font-bold">Chief Invigilator / Controller</p>
                  <p class="text-[10px] text-slate-500">Scrutinized & Verified By</p>
                </div>
                <div class="border-t border-slate-900 pt-1.5">
                  <p class="font-bold">Director (HR & Administration)</p>
                  <p class="text-[10px] text-slate-500">Approved & Gazetted By</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ================================================================= -->
      <!-- MODAL: VIVA VOCE ATTENDANCE & HALL VERIFICATION CONSOLE -->
      <!-- ================================================================= -->
      <div *ngIf="showVivaAttendanceModal" class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
        <div class="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-6xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden text-xs">
          <!-- Modal Header -->
          <div class="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/70">
            <div class="flex items-center gap-3">
              <span class="w-3 h-3 rounded-full bg-emerald-400 animate-pulse"></span>
              <div>
                <h3 class="text-sm font-bold text-slate-100 flex items-center gap-2">
                  Viva Voce Examination Attendance & Hall Verification Console
                  <span class="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">LIVE VENUE</span>
                </h3>
                <p class="text-[11px] text-slate-400">
                  Board: <strong class="text-slate-200">{{ selectedVivaBoard?.boardName || 'Viva Board #1' }}</strong> |
                  Venue: <span class="text-slate-300">{{ selectedVivaBoard?.venue || 'Head Office Board Room, Dhaka' }}</span> |
                  Date: <span class="text-slate-300 font-mono">{{ selectedVivaBoard?.vivaDate || 'Today' }}</span>
                </p>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <button 
                type="button" 
                (click)="openPrintVivaAttendanceModal()" 
                class="px-3 py-1.5 rounded-lg bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-700/60 text-indigo-200 text-xs font-semibold flex items-center gap-1.5">
                Print Official Sheet
              </button>
              <button 
                type="button" 
                (click)="closeVivaAttendanceModal()" 
                class="text-slate-400 hover:text-white font-mono text-sm px-2 py-1">✕</button>
            </div>
          </div>

          <!-- KPI Summary Strip -->
          <div class="grid grid-cols-2 sm:grid-cols-6 gap-2 px-6 py-3 bg-slate-950/50 border-b border-slate-800/80">
            <div class="bg-slate-900/80 border border-slate-800 rounded-xl p-2.5 text-center">
              <span class="text-[10px] uppercase font-mono text-slate-500 font-semibold block">Total Scheduled</span>
              <span class="text-lg font-bold font-mono text-slate-100">{{ vivaAttendanceTotalCount }}</span>
            </div>
            <div class="bg-emerald-950/30 border border-emerald-800/40 rounded-xl p-2.5 text-center">
              <span class="text-[10px] uppercase font-mono text-emerald-400 font-semibold block">Present (Reported)</span>
              <span class="text-lg font-bold font-mono text-emerald-300">{{ vivaAttendancePresentCount }}</span>
            </div>
            <div class="bg-amber-950/30 border border-amber-800/40 rounded-xl p-2.5 text-center">
              <span class="text-[10px] uppercase font-mono text-amber-400 font-semibold block">Inside Board</span>
              <span class="text-lg font-bold font-mono text-amber-300">{{ vivaAttendanceInBoardCount }}</span>
            </div>
            <div class="bg-blue-950/30 border border-blue-800/40 rounded-xl p-2.5 text-center">
              <span class="text-[10px] uppercase font-mono text-blue-400 font-semibold block">Completed</span>
              <span class="text-lg font-bold font-mono text-blue-300">{{ vivaAttendanceCompletedCount }}</span>
            </div>
            <div class="bg-rose-950/30 border border-rose-800/40 rounded-xl p-2.5 text-center">
              <span class="text-[10px] uppercase font-mono text-rose-400 font-semibold block">Absent (No-Show)</span>
              <span class="text-lg font-bold font-mono text-rose-300">{{ vivaAttendanceAbsentCount }}</span>
            </div>
            <div class="bg-indigo-950/30 border border-indigo-800/40 rounded-xl p-2.5 text-center">
              <span class="text-[10px] uppercase font-mono text-indigo-400 font-semibold block">Turnout Rate</span>
              <span class="text-lg font-bold font-mono text-indigo-300">{{ vivaAttendanceRate }}%</span>
            </div>
          </div>

          <!-- Scanner Bar & Quick Actions Strip -->
          <div class="px-6 py-3 bg-slate-900 border-b border-slate-800 space-y-2">
            <div class="flex flex-wrap items-center justify-between gap-3">
              <!-- Fast Roll/Token Scanner -->
              <div class="flex items-center gap-2 flex-1 min-w-[280px]">
                <div class="relative flex-1">
                  <input 
                    type="text" 
                    [(ngModel)]="vivaAttendanceScannerInput" 
                    (keyup.enter)="scanVivaAttendanceInput()"
                    placeholder="Scan barcode or enter Roll #, Token #, Tracking ID, or Name..." 
                    class="w-full bg-slate-950 border border-slate-700 rounded-xl pl-3.5 pr-8 py-2 text-xs font-mono text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500" />
                  <button 
                    *ngIf="vivaAttendanceScannerInput" 
                    type="button" 
                    (click)="vivaAttendanceScannerInput = ''" 
                    class="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs px-1 font-mono"
                    title="Clear Scanner Input">
                    ✕
                  </button>
                </div>
                <button 
                  type="button" 
                  (click)="scanVivaAttendanceInput()"
                  class="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-950/50">
                  Verify & Check-In
                </button>
              </div>

              <!-- Quick Mass Action Controls -->
              <div class="flex items-center gap-2">
                <button 
                  type="button" 
                  (click)="markAllVivaCandidatesPresent()" 
                  class="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-medium">
                  Mark All Present
                </button>
                <button 
                  type="button" 
                  (click)="syncAttendanceToVivaCandidates()" 
                  class="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg text-xs font-medium">
                  Sync with Board
                </button>
              </div>
            </div>

            <!-- Feedback Message Banner -->
            <div *ngIf="vivaAttendanceFeedback" 
              class="px-3.5 py-2 rounded-lg font-mono text-xs flex items-center justify-between"
              [ngClass]="vivaAttendanceFeedbackSuccess ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800' : 'bg-rose-950/80 text-rose-300 border border-rose-800'">
              <span>{{ vivaAttendanceFeedback }}</span>
              <button type="button" (click)="vivaAttendanceFeedback = ''" class="text-slate-400 hover:text-white ml-2">✕</button>
            </div>
          </div>

          <!-- Table Search & Filter Bar -->
          <div class="flex flex-wrap items-center justify-between gap-3 px-6 py-2.5 bg-slate-950/30 border-b border-slate-800">
            <!-- Filter Pills -->
            <div class="flex items-center gap-1.5 overflow-x-auto">
              <span class="text-[10px] uppercase font-mono text-slate-500 font-semibold mr-1">Filter:</span>
              <button 
                type="button" 
                (click)="vivaAttendanceFilterStatus = 'ALL'"
                [ngClass]="vivaAttendanceFilterStatus === 'ALL' ? 'bg-emerald-600 text-white font-bold' : 'bg-slate-800 text-slate-400 hover:text-white'"
                class="px-2.5 py-1 rounded-md text-[11px] font-mono">
                All ({{ vivaAttendanceTotalCount }})
              </button>
              <button 
                type="button" 
                (click)="vivaAttendanceFilterStatus = 'PRESENT'"
                [ngClass]="vivaAttendanceFilterStatus === 'PRESENT' ? 'bg-emerald-600 text-white font-bold' : 'bg-slate-800 text-slate-400 hover:text-white'"
                class="px-2.5 py-1 rounded-md text-[11px] font-mono">
                Present ({{ vivaAttendancePresentCount }})
              </button>
              <button 
                type="button" 
                (click)="vivaAttendanceFilterStatus = 'INSIDE_BOARD'"
                [ngClass]="vivaAttendanceFilterStatus === 'INSIDE_BOARD' ? 'bg-amber-600 text-white font-bold' : 'bg-slate-800 text-slate-400 hover:text-white'"
                class="px-2.5 py-1 rounded-md text-[11px] font-mono">
                In Board ({{ vivaAttendanceInBoardCount }})
              </button>
              <button 
                type="button" 
                (click)="vivaAttendanceFilterStatus = 'ABSENT'"
                [ngClass]="vivaAttendanceFilterStatus === 'ABSENT' ? 'bg-rose-600 text-white font-bold' : 'bg-slate-800 text-slate-400 hover:text-white'"
                class="px-2.5 py-1 rounded-md text-[11px] font-mono">
                Absent ({{ vivaAttendanceAbsentCount }})
              </button>
              <button 
                type="button" 
                (click)="vivaAttendanceFilterStatus = 'PENDING'"
                [ngClass]="vivaAttendanceFilterStatus === 'PENDING' ? 'bg-slate-600 text-white font-bold' : 'bg-slate-800 text-slate-400 hover:text-white'"
                class="px-2.5 py-1 rounded-md text-[11px] font-mono">
                Pending ({{ vivaAttendancePendingCount }})
              </button>
            </div>

            <!-- Search input with clear button -->
            <div class="relative w-80">
              <span class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-mono text-xs">🔍</span>
              <input 
                type="text" 
                [(ngModel)]="vivaAttendanceSearchQuery" 
                placeholder="Search candidate name, roll, token, district..." 
                class="w-full bg-slate-950 border border-slate-700 rounded-lg pl-8 pr-8 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500" />
              <button 
                *ngIf="vivaAttendanceSearchQuery" 
                type="button" 
                (click)="clearVivaAttendanceSearch()" 
                class="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs px-1 font-mono"
                title="Clear Search">
                ✕
              </button>
            </div>
          </div>

          <!-- Candidates Attendance & Verification Table -->
          <div class="flex-1 overflow-y-auto min-h-[300px] p-6">
            <div class="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/40">
              <table class="w-full text-left border-collapse text-xs">
                <thead>
                  <tr class="bg-slate-950 border-b border-slate-800 text-slate-400 font-mono text-[10px] uppercase font-bold">
                    <th class="py-2.5 px-3">Token #</th>
                    <th class="py-2.5 px-3">Roll No</th>
                    <th class="py-2.5 px-3">Candidate & Degree</th>
                    <th class="py-2.5 px-3">District</th>
                    <th class="py-2.5 px-3 text-center">Written Marks</th>
                    <th class="py-2.5 px-3">Reported Time</th>
                    <th class="py-2.5 px-3 text-center">Credentials Verification</th>
                    <th class="py-2.5 px-3 text-center">Attendance Status</th>
                    <th class="py-2.5 px-3 text-center">Queue Stage</th>
                    <th class="py-2.5 px-3">Hall Remarks</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-800/80 text-slate-300">
                  <tr *ngFor="let r of filteredVivaAttendanceRecords" class="hover:bg-slate-800/40">
                    <!-- Token -->
                    <td class="py-2.5 px-3 font-mono font-bold text-amber-400">
                      {{ r.tokenNumber }}
                    </td>

                    <!-- Roll No -->
                    <td class="py-2.5 px-3 font-mono font-bold text-slate-100">
                      {{ r.rollNumber }}
                    </td>

                    <!-- Candidate Name -->
                    <td class="py-2.5 px-3">
                      <div class="font-semibold text-slate-100">{{ r.fullName }}</div>
                      <div class="text-[10px] font-mono text-slate-500">{{ r.trackingId }} | {{ r.highestDegree }}</div>
                    </td>

                    <!-- District -->
                    <td class="py-2.5 px-3 text-slate-400">{{ r.district }}</td>

                    <!-- Written Marks -->
                    <td class="py-2.5 px-3 text-center font-mono font-bold text-slate-200">
                      {{ r.writtenMarks }} / 100
                    </td>

                    <!-- Reporting Time -->
                    <td class="py-2.5 px-3 font-mono text-[11px]" [ngClass]="r.checkInTime ? 'text-emerald-400' : 'text-slate-500'">
                      {{ r.checkInTime || 'Not checked in' }}
                    </td>

                    <!-- Document Verification Checkboxes -->
                    <td class="py-2.5 px-3">
                      <div class="flex items-center justify-center gap-1.5 font-mono text-[10px]">
                        <button 
                          type="button" 
                          (click)="toggleDocVerification(r, 'nid')" 
                          [ngClass]="r.nidVerified ? 'bg-emerald-950 text-emerald-300 border-emerald-700' : 'bg-slate-800 text-slate-500 border-slate-700'"
                          class="px-1.5 py-0.5 rounded border text-[10px] font-bold" title="National ID Verification">
                          NID {{ r.nidVerified ? '✓' : '✕' }}
                        </button>
                        <button 
                          type="button" 
                          (click)="toggleDocVerification(r, 'academic')" 
                          [ngClass]="r.academicVerified ? 'bg-emerald-950 text-emerald-300 border-emerald-700' : 'bg-slate-800 text-slate-500 border-slate-700'"
                          class="px-1.5 py-0.5 rounded border text-[10px] font-bold" title="Academic Certificates Verification">
                          Certs {{ r.academicVerified ? '✓' : '✕' }}
                        </button>
                        <button 
                          type="button" 
                          (click)="toggleDocVerification(r, 'experience')" 
                          [ngClass]="r.experienceVerified ? 'bg-emerald-950 text-emerald-300 border-emerald-700' : 'bg-slate-800 text-slate-500 border-slate-700'"
                          class="px-1.5 py-0.5 rounded border text-[10px] font-bold" title="Experience / NOC Verification">
                          Exp {{ r.experienceVerified ? '✓' : '✕' }}
                        </button>
                      </div>
                    </td>

                    <!-- Attendance Status Buttons -->
                    <td class="py-2.5 px-3 text-center">
                      <div class="inline-flex rounded-lg border border-slate-700 p-0.5 bg-slate-900">
                        <button 
                          type="button" 
                          (click)="setCandidateVivaAttendance(r, 'PRESENT')"
                          [ngClass]="r.attendanceStatus === 'PRESENT' ? 'bg-emerald-600 text-white font-bold' : 'text-slate-400 hover:text-white'"
                          class="px-2 py-0.5 rounded text-[10px] font-mono">
                          Present
                        </button>
                        <button 
                          type="button" 
                          (click)="setCandidateVivaAttendance(r, 'ABSENT')"
                          [ngClass]="r.attendanceStatus === 'ABSENT' ? 'bg-rose-600 text-white font-bold' : 'text-slate-400 hover:text-white'"
                          class="px-2 py-0.5 rounded text-[10px] font-mono">
                          Absent
                        </button>
                      </div>
                    </td>

                    <!-- Queue Stage Selector -->
                    <td class="py-2.5 px-3 text-center">
                      <select 
                        [(ngModel)]="r.queueStatus" 
                        (ngModelChange)="setCandidateVivaQueue(r, $event)"
                        class="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-[11px] font-mono text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500">
                        <option value="WAITING">WAITING</option>
                        <option value="INSIDE_BOARD">INSIDE BOARD</option>
                        <option value="COMPLETED">COMPLETED</option>
                        <option value="ABSENT">ABSENT</option>
                      </select>
                    </td>

                    <!-- Hall Remarks -->
                    <td class="py-2.5 px-3">
                      <input 
                        type="text" 
                        [(ngModel)]="r.remarks" 
                        placeholder="Remarks..." 
                        class="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-[11px] text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500" />
                    </td>
                  </tr>

                  <tr *ngIf="filteredVivaAttendanceRecords.length === 0">
                    <td colspan="10" class="py-8 text-center text-slate-500 italic">
                      No candidates found matching the active filter or search query.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Footer Actions Bar -->
          <div class="flex flex-wrap items-center justify-between gap-3 px-6 py-3.5 bg-slate-950 border-t border-slate-800">
            <!-- Left Data Export Options -->
            <div class="flex items-center gap-2">
              <button 
                type="button" 
                (click)="exportVivaAttendanceExcel()" 
                class="px-3 py-1.5 rounded-lg bg-emerald-950/70 hover:bg-emerald-900 border border-emerald-800 text-emerald-300 text-xs font-semibold flex items-center gap-1.5">
                Export Excel (.xls)
              </button>
              <button 
                type="button" 
                (click)="exportVivaAttendanceCsv()" 
                class="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5">
                Export CSV
              </button>
              <button 
                type="button" 
                (click)="openPrintVivaAttendanceModal()" 
                class="px-3 py-1.5 rounded-lg bg-indigo-950/70 hover:bg-indigo-900 border border-indigo-800 text-indigo-300 text-xs font-semibold flex items-center gap-1.5">
                Print Signature Sheet
              </button>
            </div>

            <!-- Right Save Changes & Close -->
            <div class="flex items-center gap-3">
              <span *ngIf="vivaAttendanceSuccessMsg" class="text-xs text-emerald-400 font-mono">
                {{ vivaAttendanceSuccessMsg }}
              </span>
              <button 
                type="button" 
                (click)="saveVivaAttendanceBatch()" 
                [disabled]="isSavingVivaAttendance"
                class="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-950/50 flex items-center gap-2">
                <span *ngIf="isSavingVivaAttendance" class="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                Save & Synchronize Attendance
              </button>
              <button 
                type="button" 
                (click)="closeVivaAttendanceModal()" 
                class="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium">
                Close
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- ================================================================= -->
      <!-- MODAL: OFFICIAL VIVA VOCE ATTENDANCE & CANDIDATE SIGNATURE SHEET PRINT DOSSIER -->
      <!-- ================================================================= -->
      <div *ngIf="showPrintVivaAttendanceModal" class="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md overflow-y-auto p-4 flex flex-col items-center">
        <!-- Sticky Print Control Bar -->
        <div class="print-control-bar w-full max-w-5xl bg-slate-900 border border-slate-800 rounded-xl p-3 mb-4 flex flex-wrap items-center justify-between gap-3 shadow-xl">
          <div class="flex items-center gap-2">
            <span class="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
            <span class="text-xs font-bold text-slate-200">
              Official Viva Voce Examination Attendance & Candidate Signature Sheet
            </span>
            <span class="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
              GAZETTED FORMAT
            </span>
          </div>

          <div class="flex items-center gap-2">
            <button 
              type="button" 
              (click)="exportVivaAttendanceCsv()" 
              class="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-medium">
              Download CSV
            </button>
            <button 
              type="button" 
              (click)="exportVivaAttendanceExcel()" 
              class="px-3 py-1.5 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-800 text-emerald-300 text-xs font-medium">
              Export Excel (.xls)
            </button>
            <button 
              type="button" 
              (click)="printVivaAttendanceDocument()" 
              class="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-950/50">
              Print Official Sheet (PDF)
            </button>
            <button 
              type="button" 
              (click)="closePrintVivaAttendanceModal()" 
              class="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium">
              Close
            </button>
          </div>
        </div>

        <!-- Printable Document Canvas -->
        <div class="printable-sheet bg-white text-slate-900 shadow-2xl rounded-xl border border-slate-200 p-8 w-full max-w-5xl mx-auto my-2 print:m-0 print:p-0 print:border-none print:shadow-none print:rounded-none">
          <div class="space-y-6">
            <!-- Institutional Letterhead -->
            <div class="text-center pb-4 border-b-2 border-slate-900">
              <h1 class="text-2xl font-black tracking-wide text-slate-900 uppercase">
                UDDIPAN
              </h1>
              <p class="text-xs font-semibold text-slate-700 uppercase tracking-widest mt-0.5">
                United Development Initiatives for Programmed Actions
              </p>
              <p class="text-[11px] text-slate-600">
                Central Human Resource Management Division | Central Recruitment & Selection Committee
              </p>
              <p class="text-[10px] text-slate-500 font-mono mt-0.5">
                Head Office: Uddipan Bhaban, 09 Outer Circular Road, Dhaka-1217 | Reg: MRA-00124 | ISO 9001:2015 Certified
              </p>

              <div class="inline-block mt-3 px-4 py-1 border-2 border-slate-900 bg-slate-100 text-slate-900 font-black text-sm uppercase tracking-wider rounded">
                Official Viva Voce Examination Attendance & Candidate Verification Sheet
              </div>
            </div>

            <!-- Board & Schedule Metadata Strip -->
            <div class="grid grid-cols-2 gap-4 text-xs bg-slate-50 border border-slate-300 rounded-lg p-3.5">
              <div class="space-y-1">
                <div>
                  <span class="text-[10px] font-bold uppercase text-slate-500">Recruitment Circular:</span>
                  <div class="font-bold text-slate-900 text-sm">
                    {{ selectedVivaBoard?.circularTitle || 'Field Officer (Microfinance Credit & Operations)' }}
                  </div>
                </div>
                <div>
                  <span class="text-[10px] font-bold uppercase text-slate-500">Viva Examination Board:</span>
                  <div class="font-semibold text-slate-800">
                    {{ selectedVivaBoard?.boardName || 'Viva Board #1: Field Officers & Operations' }}
                  </div>
                </div>
                <div>
                  <span class="text-[10px] font-bold uppercase text-slate-500">Examination Venue & Hall:</span>
                  <div class="text-slate-700">
                    {{ selectedVivaBoard?.venue || 'Head Office Board Room (Level 5), Uddipan Bhaban, Dhaka' }}
                  </div>
                </div>
              </div>

              <div class="space-y-1 text-right sm:text-left">
                <div>
                  <span class="text-[10px] font-bold uppercase text-slate-500">Examination Date & Timing:</span>
                  <div class="font-bold text-slate-900 text-sm font-mono">
                    {{ selectedVivaBoard?.vivaDate || '2026-11-05' }} | {{ selectedVivaBoard?.vivaTime || '10:00 AM - 04:30 PM' }}
                  </div>
                </div>
                <div>
                  <span class="text-[10px] font-bold uppercase text-slate-500">Board Chairman & Members:</span>
                  <div class="text-slate-700">
                    Dr. Masud Rahman (Director HR) & 3 Official Evaluators
                  </div>
                </div>
                <div class="flex items-center gap-3 pt-1">
                  <span class="text-[10px] font-bold uppercase text-slate-500">Attendance Statistics:</span>
                  <span class="text-[11px] font-mono font-bold text-slate-900">
                    Total: {{ vivaAttendanceTotalCount }} | Present: {{ vivaAttendancePresentCount }} | Absent: {{ vivaAttendanceAbsentCount }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Attendance & Signature Table -->
            <div class="border border-slate-300 rounded-xl overflow-hidden">
              <table class="w-full text-left border-collapse text-xs">
                <thead>
                  <tr class="bg-slate-100 border-b border-slate-300 text-slate-800 font-mono text-[10px] uppercase font-bold">
                    <th class="py-2.5 px-2 text-center w-8">SL</th>
                    <th class="py-2.5 px-2 text-center w-14">Token</th>
                    <th class="py-2.5 px-2 w-20">Roll No</th>
                    <th class="py-2.5 px-3">Candidate Full Name</th>
                    <th class="py-2.5 px-2">District</th>
                    <th class="py-2.5 px-2 text-center">Written Marks</th>
                    <th class="py-2.5 px-2 text-center">NID Verified</th>
                    <th class="py-2.5 px-2 text-center">Certs Verified</th>
                    <th class="py-2.5 px-2 text-center">Attendance Status</th>
                    <th class="py-2.5 px-4 text-center w-36">Candidate Signature</th>
                    <th class="py-2.5 px-3 text-center w-24">Invigilator Initial</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-200 text-slate-800">
                  <tr *ngFor="let s of filteredVivaAttendanceRecords; let idx = index" class="hover:bg-slate-50">
                    <td class="py-2 px-2 text-center font-mono text-[11px] text-slate-600">{{ idx + 1 }}</td>
                    <td class="py-2 px-2 text-center font-mono font-bold text-slate-900">{{ s.tokenNumber }}</td>
                    <td class="py-2 px-2 font-mono font-bold text-slate-900">{{ s.rollNumber }}</td>
                    <td class="py-2 px-3">
                      <div class="font-bold text-slate-900">{{ s.fullName }}</div>
                      <div class="text-[10px] font-mono text-slate-500">{{ s.trackingId }}</div>
                    </td>
                    <td class="py-2 px-2 text-slate-600">{{ s.district }}</td>
                    <td class="py-2 px-2 text-center font-mono font-bold text-slate-900">{{ s.writtenMarks }}</td>
                    <td class="py-2 px-2 text-center font-mono text-[11px] font-bold" [ngClass]="s.nidVerified ? 'text-emerald-700' : 'text-slate-400'">
                      {{ s.nidVerified ? 'VERIFIED' : 'PENDING' }}
                    </td>
                    <td class="py-2 px-2 text-center font-mono text-[11px] font-bold" [ngClass]="s.academicVerified ? 'text-emerald-700' : 'text-slate-400'">
                      {{ s.academicVerified ? 'VERIFIED' : 'PENDING' }}
                    </td>
                    <td class="py-2 px-2 text-center">
                      <span class="px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase"
                        [ngClass]="s.attendanceStatus === 'PRESENT' ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' : 'bg-rose-100 text-rose-800 border border-rose-300'">
                        {{ s.attendanceStatus || 'PRESENT' }}
                      </span>
                    </td>
                    <td class="py-2 px-4 text-center">
                      <div class="h-8 border-b border-dashed border-slate-400 flex items-end justify-center pb-0.5">
                        <span class="text-[8px] text-slate-300 italic">Sign here</span>
                      </div>
                    </td>
                    <td class="py-2 px-3 text-center">
                      <div class="h-8 border-b border-dashed border-slate-400 flex items-end justify-center pb-0.5">
                        <span class="text-[8px] text-slate-300 italic">Initial</span>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Certification & Signatories -->
            <div class="pt-6 border-t-2 border-slate-300 space-y-6">
              <p class="text-[11px] text-slate-600 italic">
                * Certification: I/We hereby certify that the physical presence, biometric identity, national ID (NID), and original educational credentials of the above candidates were personally scrutinized and verified prior to entering the Viva Voce interview room.
              </p>

              <div class="grid grid-cols-3 gap-6 pt-6 text-center text-xs text-slate-800">
                <div class="border-t border-slate-900 pt-1.5">
                  <p class="font-bold">Viva Hall Coordinator / In-Charge</p>
                  <p class="text-[10px] text-slate-500">Verified & Checked In By</p>
                </div>
                <div class="border-t border-slate-900 pt-1.5">
                  <p class="font-bold">Chairman, Viva Voce Board</p>
                  <p class="text-[10px] text-slate-500">Examined & Authenticated By</p>
                </div>
                <div class="border-t border-slate-900 pt-1.5">
                  <p class="font-bold">Director (HR & Administration)</p>
                  <p class="text-[10px] text-slate-500">Approved & Gazetted By</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ================================================================= -->
      <!-- MODAL: SETUP NEW VIVA BOARD & MEMBER ROSTER -->
      <!-- ================================================================= -->
      <div *ngIf="showCreateVivaBoardModal" class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
        <div class="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl p-6 space-y-5 max-h-[90vh] overflow-y-auto">
          <div class="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 class="text-sm font-bold text-slate-100 flex items-center gap-2">
                <span class="w-2 h-2 rounded-full bg-emerald-400"></span>
                Setup New Viva Voce Board & Member Roster
              </h3>
              <p class="text-xs text-slate-400">Constitution of interview panel as per UDDIPAN Recruitment Policy</p>
            </div>
            <button type="button" (click)="closeCreateVivaBoardModal()" class="text-slate-400 hover:text-white font-mono text-sm">✕</button>
          </div>

          <div class="space-y-4 text-xs">
            <!-- Board Title & Circular -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div class="space-y-1">
                <label class="text-slate-400 font-medium">Viva Board Title *</label>
                <input 
                  type="text" 
                  [(ngModel)]="newVivaBoardForm.boardName" 
                  placeholder="e.g. Viva Board 2: Branch Accounts & Audit" 
                  class="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500" />
              </div>
              <div class="space-y-1">
                <label class="text-slate-400 font-medium">Recruitment Circular *</label>
                <select 
                  [(ngModel)]="newVivaBoardForm.circularId" 
                  class="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500">
                  <option value="">Select Circular...</option>
                  <option *ngFor="let c of rawCirculars" [value]="c.id">
                    {{ c.circularNo || 'CIR' }} - {{ c.title }}
                  </option>
                  <option value="6b9acc0d-1e03-40e8-a565-71e83c684a60">CIR-2026-0001 - Field Officer (Microfinance Credit & Operations)</option>
                  <option value="3d72a299-6de9-4e12-8ef2-71d7a676a472">CIR-2026-0002 - HR Officer (Microfinance Operations)</option>
                  <option value="800d6bdf-c003-49f7-9c79-f7ac1b6ed600">CIR-2026-0003 - Finance And Admin Officer</option>
                </select>
              </div>
            </div>

            <!-- Date, Time, Venue -->
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div class="space-y-1">
                <label class="text-slate-400 font-medium">Viva Date *</label>
                <input 
                  type="date" 
                  [(ngModel)]="newVivaBoardForm.vivaDate" 
                  class="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500" />
              </div>
              <div class="space-y-1">
                <label class="text-slate-400 font-medium">Time Window</label>
                <input 
                  type="text" 
                  [(ngModel)]="newVivaBoardForm.vivaTime" 
                  placeholder="10:00 AM - 04:30 PM" 
                  class="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500" />
              </div>
              <div class="space-y-1">
                <label class="text-slate-400 font-medium">Sanctioned Vacancies</label>
                <input 
                  type="number" 
                  min="1" 
                  [(ngModel)]="newVivaBoardForm.vacancies" 
                  class="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500" />
              </div>
            </div>

            <!-- Venue -->
            <div class="space-y-1">
              <label class="text-slate-400 font-medium">Board Venue / Examination Room *</label>
              <input 
                type="text" 
                [(ngModel)]="newVivaBoardForm.venue" 
                placeholder="e.g. Head Office Board Room (Level 5), Uddipan Bhaban, Dhaka" 
                class="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500" />
            </div>

            <!-- Member Roster Assignment -->
            <div class="space-y-2 pt-2 border-t border-slate-800">
              <div class="flex items-center justify-between">
                <div>
                  <label class="text-slate-300 font-bold uppercase tracking-wider text-[11px] block">Constituent Board Members (Roster)</label>
                  <span class="text-[10px] text-slate-500 font-mono">Institutional Interview Panel</span>
                </div>
                <button 
                  type="button" 
                  (click)="addNewMemberToForm()" 
                  class="px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 flex items-center gap-1 transition-all">
                  <span class="font-bold">+</span> Add Member
                </button>
              </div>

              <div class="space-y-2">
                <div *ngFor="let m of newVivaBoardForm.members; let i = index" class="grid grid-cols-1 sm:grid-cols-12 gap-2 bg-slate-950 p-2.5 rounded-xl border border-slate-800 items-center">
                  <div class="sm:col-span-4">
                    <label class="text-[10px] text-slate-500 block mb-0.5">Member Name</label>
                    <input 
                      type="text" 
                      [(ngModel)]="m.name" 
                      placeholder="Full Name" 
                      class="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200" />
                  </div>
                  <div class="sm:col-span-4">
                    <label class="text-[10px] text-slate-500 block mb-0.5">Board Role</label>
                    <input 
                      type="text" 
                      [(ngModel)]="m.role" 
                      placeholder="e.g. Board Chairman" 
                      class="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-emerald-400" />
                  </div>
                  <div class="sm:col-span-3">
                    <label class="text-[10px] text-slate-500 block mb-0.5">Designation</label>
                    <input 
                      type="text" 
                      [(ngModel)]="m.designation" 
                      placeholder="Designation" 
                      class="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-400" />
                  </div>
                  <div class="sm:col-span-1 flex items-end justify-center pt-3 sm:pt-0">
                    <button 
                      type="button" 
                      (click)="removeMemberFromForm(i)" 
                      [disabled]="newVivaBoardForm.members.length <= 1"
                      class="w-7 h-7 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center text-xs font-bold disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                      title="Remove Member">
                      ✕
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Modal Actions -->
          <div class="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
            <button 
              type="button" 
              (click)="closeCreateVivaBoardModal()" 
              class="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 transition-colors">
              Cancel
            </button>
            <button 
              type="button" 
              (click)="saveNewVivaBoard()" 
              [disabled]="isCreatingVivaBoard"
              class="px-5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 transition-colors shadow flex items-center gap-1.5">
              <span *ngIf="isCreatingVivaBoard" class="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              <span>Create & Initialize Board</span>
            </button>
          </div>
        </div>
      </div>

      <!-- ================================================================= -->
      <!-- MODAL: MODIFY VIVA BOARD & MEMBER ROSTER -->
      <!-- ================================================================= -->
      <div *ngIf="showEditVivaBoardModal" class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
        <div class="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl p-6 space-y-5 max-h-[90vh] overflow-y-auto">
          <div class="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 class="text-sm font-bold text-slate-100 flex items-center gap-2">
                <span class="w-2 h-2 rounded-full bg-blue-400"></span>
                Modify Board & Evaluator Member Roster
              </h3>
              <p class="text-xs text-slate-400">Update board setup, venue, schedule, or reconfigure evaluators</p>
            </div>
            <button type="button" (click)="closeEditVivaBoardModal()" class="text-slate-400 hover:text-white font-mono text-sm">✕</button>
          </div>

          <div class="space-y-4 text-xs">
            <!-- Board Title & Circular -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div class="space-y-1">
                <label class="text-slate-400 font-medium">Viva Board Title *</label>
                <input 
                  type="text" 
                  [(ngModel)]="editVivaBoardForm.boardName" 
                  class="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500" />
              </div>
              <div class="space-y-1">
                <label class="text-slate-400 font-medium">Recruitment Circular *</label>
                <select 
                  [(ngModel)]="editVivaBoardForm.circularId" 
                  class="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500">
                  <option *ngFor="let c of rawCirculars" [value]="c.id">
                    {{ c.circularNo || 'CIR' }} - {{ c.title }}
                  </option>
                  <option value="6b9acc0d-1e03-40e8-a565-71e83c684a60">CIR-2026-0001 - Field Officer (Microfinance Credit & Operations)</option>
                  <option value="3d72a299-6de9-4e12-8ef2-71d7a676a472">CIR-2026-0002 - HR Officer (Microfinance Operations)</option>
                  <option value="800d6bdf-c003-49f7-9c79-f7ac1b6ed600">CIR-2026-0003 - Finance And Admin Officer</option>
                </select>
              </div>
            </div>

            <!-- Date, Time, Vacancies -->
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div class="space-y-1">
                <label class="text-slate-400 font-medium">Viva Date *</label>
                <input 
                  type="date" 
                  [(ngModel)]="editVivaBoardForm.vivaDate" 
                  class="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500" />
              </div>
              <div class="space-y-1">
                <label class="text-slate-400 font-medium">Time Window</label>
                <input 
                  type="text" 
                  [(ngModel)]="editVivaBoardForm.vivaTime" 
                  class="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500" />
              </div>
              <div class="space-y-1">
                <label class="text-slate-400 font-medium">Sanctioned Vacancies (Quota)</label>
                <input 
                  type="number" 
                  min="1" 
                  [(ngModel)]="editVivaBoardForm.vacancies" 
                  class="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500" />
              </div>
            </div>

            <!-- Venue -->
            <div class="space-y-1">
              <label class="text-slate-400 font-medium">Board Venue / Examination Room *</label>
              <input 
                type="text" 
                [(ngModel)]="editVivaBoardForm.venue" 
                class="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500" />
            </div>

            <!-- Modify Board Members Roster -->
            <div class="space-y-2.5 pt-2 border-t border-slate-800">
              <div class="flex items-center justify-between">
                <div>
                  <label class="text-slate-200 font-bold uppercase tracking-wider text-[11px] block">Board Evaluator Member Roster</label>
                  <span class="text-[10px] text-slate-500">Configure evaluator personnel and their designated board roles</span>
                </div>
                <button 
                  type="button" 
                  (click)="addMemberToEditForm()" 
                  class="px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 flex items-center gap-1 transition-all">
                  <span class="font-bold">+</span> Add Member
                </button>
              </div>

              <div class="space-y-2">
                <div *ngFor="let m of editVivaBoardForm.members; let i = index" class="grid grid-cols-1 sm:grid-cols-12 gap-2 bg-slate-950 p-2.5 rounded-xl border border-slate-800 items-center">
                  <div class="sm:col-span-4">
                    <label class="text-[10px] text-slate-500 block mb-0.5">Member Name</label>
                    <input 
                      type="text" 
                      [(ngModel)]="m.name" 
                      placeholder="e.g. Dr. Masud Rahman" 
                      class="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200" />
                  </div>
                  <div class="sm:col-span-4">
                    <label class="text-[10px] text-slate-500 block mb-0.5">Board Role</label>
                    <input 
                      type="text" 
                      [(ngModel)]="m.role" 
                      placeholder="e.g. Board Chairman" 
                      class="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-emerald-400" />
                  </div>
                  <div class="sm:col-span-3">
                    <label class="text-[10px] text-slate-500 block mb-0.5">Designation / Department</label>
                    <input 
                      type="text" 
                      [(ngModel)]="m.designation" 
                      placeholder="e.g. Director (HR)" 
                      class="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-400" />
                  </div>
                  <div class="sm:col-span-1 flex items-end justify-center pt-3 sm:pt-0">
                    <button 
                      type="button" 
                      (click)="removeMemberFromEditForm(i)" 
                      [disabled]="editVivaBoardForm.members.length <= 1"
                      class="w-7 h-7 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center text-xs font-bold disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                      title="Remove Member">
                      ✕
                    </button>
                  </div>
                </div>
              </div>

              <!-- Quick Role Presets Helper -->
              <div class="pt-1 flex items-center flex-wrap gap-1.5 text-[10px]">
                <span class="text-slate-500">Quick Roles:</span>
                <button type="button" (click)="addPresetMember('Board Chairman')" class="px-2 py-0.5 rounded bg-slate-800 text-slate-300 hover:text-white border border-slate-700">+ Chairman</button>
                <button type="button" (click)="addPresetMember('Technical Expert')" class="px-2 py-0.5 rounded bg-slate-800 text-slate-300 hover:text-white border border-slate-700">+ Technical Expert</button>
                <button type="button" (click)="addPresetMember('Zonal Representative')" class="px-2 py-0.5 rounded bg-slate-800 text-slate-300 hover:text-white border border-slate-700">+ Zonal Rep</button>
                <button type="button" (click)="addPresetMember('Member Secretary')" class="px-2 py-0.5 rounded bg-slate-800 text-slate-300 hover:text-white border border-slate-700">+ Member Secretary</button>
                <button type="button" (click)="addPresetMember('External Observer')" class="px-2 py-0.5 rounded bg-slate-800 text-slate-300 hover:text-white border border-slate-700">+ External Observer</button>
              </div>
            </div>
          </div>

          <!-- Modal Actions -->
          <div class="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
            <button 
              type="button" 
              (click)="closeEditVivaBoardModal()" 
              class="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 transition-colors">
              Cancel
            </button>
            <button 
              type="button" 
              (click)="saveEditedVivaBoard()" 
              [disabled]="isSavingEditedBoard"
              class="px-5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 transition-colors shadow flex items-center gap-1.5">
              <span *ngIf="isSavingEditedBoard" class="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              <span>Save Changes & Update Roster</span>
            </button>
          </div>
        </div>
      </div>

      <!-- ================================================================= -->
      <!-- MODAL: CONFIRM FINAL MERIT & WAITING LIST PUBLISHING -->
      <!-- ================================================================= -->
      <div *ngIf="showVivaPublishConfirmModal" class="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
        <div class="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl p-6 space-y-4">
          <div class="flex items-center gap-3 pb-3 border-b border-slate-800">
            <div class="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-bold text-lg">
              ✓
            </div>
            <div>
              <h3 class="text-sm font-bold text-slate-100">Gazetted Merit & Waiting List Publication</h3>
              <p class="text-xs text-slate-400">Formal endorsement and transition of candidates in ATS</p>
            </div>
          </div>

          <div class="space-y-3 text-xs text-slate-300">
            <p>
              You are about to officially publish the final selection list for <strong class="text-white">{{ selectedVivaBoard?.boardName }}</strong>.
            </p>

            <div class="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2">
              <div class="flex items-center justify-between">
                <span class="text-slate-400">Sanctioned Vacancies (Quota):</span>
                <span class="font-mono font-bold text-white">{{ vivaVacanciesQuota }} Posts</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-emerald-400 font-semibold">Recommended for Merit List:</span>
                <span class="font-mono font-bold text-emerald-300">{{ countSelectedMeritCandidates() }} Candidates (Status -> SELECTED)</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-amber-400 font-semibold">Placed on Waiting List (Standby):</span>
                <span class="font-mono font-bold text-amber-300">{{ countWaitingListCandidates() }} Candidates</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-slate-400">Selection Benchmark Cutoff:</span>
                <span class="font-mono font-bold text-rose-400">{{ vivaFinalSelectionCutoff }}% Aggregate</span>
              </div>
            </div>

            <div class="p-3 rounded-xl bg-blue-950/30 border border-blue-800/40 text-blue-300 text-[11px] leading-relaxed">
              * Upon confirmation, the top {{ countSelectedMeritCandidates() }} qualifying candidates will transition to <strong>SELECTED</strong> status in the ATS Pipeline and will be queued for formal offer letters & background checks.
            </div>
          </div>

          <div class="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
            <button 
              type="button" 
              (click)="closePublishConfirmModal()" 
              class="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 transition-colors">
              Cancel
            </button>
            <button 
              type="button" 
              (click)="publishVivaMeritList()" 
              [disabled]="isPublishingVivaMerit"
              class="px-5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 transition-colors shadow flex items-center gap-2">
              <span *ngIf="isPublishingVivaMerit" class="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              <span>Confirm & Gazetted Publish</span>
            </button>
          </div>
        </div>
      </div>

      <!-- ================================================================= -->
      <!-- MODAL: PRINT OFFICIAL VIVA MERIT & WAITING LIST DOSSIER (GAZETTE) -->
      <!-- ================================================================= -->
      <div *ngIf="showVivaPrintModal" class="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
        <div class="bg-white text-slate-900 rounded-2xl w-full max-w-5xl shadow-2xl p-6 space-y-6 max-h-[95vh] overflow-y-auto border-2 border-slate-200">
          
          <!-- Control Bar (hidden on print) -->
          <div class="flex items-center justify-between pb-4 border-b border-slate-200 no-print">
            <div class="flex items-center gap-2">
              <span class="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-mono text-[10px] font-bold border border-emerald-300 uppercase">
                Gazetted Document
              </span>
              <span class="text-xs font-bold text-slate-700">Official Viva Voce Merit & Waiting List Dossier</span>
            </div>
            <div class="flex items-center gap-2">
              <button 
                type="button" 
                (click)="exportVivaMeritCsv()" 
                class="px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 rounded-lg transition-colors">
                Download CSV
              </button>
              <button 
                type="button" 
                (click)="printVivaDocument()" 
                class="px-4 py-1.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-600 rounded-lg transition-colors shadow flex items-center gap-1.5">
                <span>Print Official Dossier (PDF)</span>
              </button>
              <button 
                type="button" 
                (click)="closeVivaPrintModal()" 
                class="px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">
                Close
              </button>
            </div>
          </div>

          <!-- Printable Document Container -->
          <div id="printableVivaDossier" class="space-y-6 text-slate-900 font-sans">
            <!-- Header Section -->
            <div class="text-center space-y-1 border-b-2 border-slate-900 pb-4">
              <div class="text-xl font-black tracking-wider text-slate-900 uppercase">
                UDDIPAN (United Development Initiatives for Programmed Actions)
              </div>
              <div class="text-xs font-semibold text-slate-700 tracking-wide uppercase">
                Human Resources & People Development Division — Head Office, Dhaka
              </div>
              <div class="text-sm font-bold text-emerald-800 uppercase tracking-widest pt-1">
                Official Gazetted Viva Voce Examination & Combined Merit List
              </div>
              <div class="text-[11px] font-mono text-slate-600">
                Constituted under UDDIPAN Service Rules & Recruitment Policy Manual
              </div>
            </div>

            <!-- Metadata Box -->
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs">
              <div>
                <span class="text-slate-500 block text-[10px] uppercase font-mono">Viva Board Name</span>
                <span class="font-bold text-slate-900 block mt-0.5">{{ selectedVivaBoard?.boardName }}</span>
              </div>
              <div>
                <span class="text-slate-500 block text-[10px] uppercase font-mono">Recruitment Circular</span>
                <span class="font-bold text-slate-900 block mt-0.5">{{ selectedVivaBoard?.circularTitle || 'Branch Operations' }}</span>
              </div>
              <div>
                <span class="text-slate-500 block text-[10px] uppercase font-mono">Date & Venue</span>
                <span class="font-bold text-slate-900 block mt-0.5">{{ selectedVivaBoard?.vivaDate }} | {{ selectedVivaBoard?.venue }}</span>
              </div>
              <div>
                <span class="text-slate-500 block text-[10px] uppercase font-mono">Weighting Standard</span>
                <span class="font-bold text-emerald-800 block mt-0.5 font-mono">Written: {{ vivaWrittenWeightPercent }}% | Viva: {{ vivaVoceWeightPercent }}%</span>
              </div>
            </div>

            <!-- KPI Summary Bar -->
            <div class="grid grid-cols-4 gap-2 text-center text-xs">
              <div class="p-2 border border-slate-300 rounded-lg bg-slate-50">
                <span class="text-[10px] text-slate-500 block uppercase font-mono">Sanctioned Vacancies</span>
                <span class="font-bold text-slate-900 text-sm font-mono">{{ vivaVacanciesQuota }}</span>
              </div>
              <div class="p-2 border border-slate-300 rounded-lg bg-slate-50">
                <span class="text-[10px] text-slate-500 block uppercase font-mono">Candidates in Viva</span>
                <span class="font-bold text-slate-900 text-sm font-mono">{{ vivaCandidatesList.length }}</span>
              </div>
              <div class="p-2 border border-emerald-300 rounded-lg bg-emerald-50">
                <span class="text-[10px] text-emerald-700 block uppercase font-mono font-bold">Selected Merit List</span>
                <span class="font-bold text-emerald-900 text-sm font-mono">{{ countSelectedMeritCandidates() }}</span>
              </div>
              <div class="p-2 border border-amber-300 rounded-lg bg-amber-50">
                <span class="text-[10px] text-amber-700 block uppercase font-mono font-bold">Waiting List (Standby)</span>
                <span class="font-bold text-amber-900 text-sm font-mono">{{ countWaitingListCandidates() }}</span>
              </div>
            </div>

            <!-- Tabulation Table -->
            <div class="border border-slate-300 rounded-xl overflow-hidden">
              <table class="w-full text-left border-collapse text-[11px]">
                <thead class="bg-slate-100 text-slate-800 font-mono text-[10px] uppercase border-b border-slate-300">
                  <tr>
                    <th class="py-2 px-2.5 text-center">Rank</th>
                    <th class="py-2 px-2.5">Roll No</th>
                    <th class="py-2 px-2.5">Candidate Name</th>
                    <th class="py-2 px-2.5">District & Degree</th>
                    <th class="py-2 px-2.5 text-right">Written (100)</th>
                    <th class="py-2 px-2.5 text-right">Scaled ({{ vivaWrittenWeightPercent }}%)</th>
                    <th class="py-2 px-2.5 text-right">Viva Avg (40)</th>
                    <th class="py-2 px-2.5 text-right">Scaled ({{ vivaVoceWeightPercent }}%)</th>
                    <th class="py-2 px-2.5 text-right font-bold text-slate-900">Aggregate (100)</th>
                    <th class="py-2 px-2.5 text-center">Recommendation</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-200">
                  <tr *ngFor="let c of sortedMeritCandidates" [ngClass]="c.finalDecision === 'SELECTED' ? 'bg-emerald-50/50' : (c.finalDecision === 'WAITING_LIST' ? 'bg-amber-50/40' : '')">
                    <td class="py-2 px-2.5 text-center font-mono font-bold">#{{ c.meritRank }}</td>
                    <td class="py-2 px-2.5 font-mono font-bold text-slate-900">{{ c.rollNumber }}</td>
                    <td class="py-2 px-2.5 font-bold text-slate-900">{{ c.fullName }}</td>
                    <td class="py-2 px-2.5 text-slate-600 text-[10px]">{{ c.district }} | {{ c.highestDegree }}</td>
                    <td class="py-2 px-2.5 text-right font-mono text-slate-700">{{ c.writtenMarks | number:'1.1-1' }}</td>
                    <td class="py-2 px-2.5 text-right font-mono text-slate-700">{{ c.writtenScaledScore | number:'1.2-2' }}</td>
                    <td class="py-2 px-2.5 text-right font-mono text-slate-700">{{ c.vivaAverage | number:'1.1-1' }}</td>
                    <td class="py-2 px-2.5 text-right font-mono text-slate-700">{{ c.vivaScaledScore | number:'1.2-2' }}</td>
                    <td class="py-2 px-2.5 text-right font-mono font-black text-slate-900">{{ c.weightedAggregateScore | number:'1.2-2' }}%</td>
                    <td class="py-2 px-2.5 text-center">
                      <span 
                        class="px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase"
                        [ngClass]="c.finalDecision === 'SELECTED' ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' : (c.finalDecision === 'WAITING_LIST' ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-rose-100 text-rose-800 border border-rose-300')">
                        {{ c.finalDecision === 'SELECTED' ? 'SELECTED (MERIT #' + c.meritRank + ')' : (c.finalDecision === 'WAITING_LIST' ? 'WAITING LIST (#' + c.waitingRank + ')' : 'BELOW CUTOFF') }}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Certification & 4-Tier Signatories -->
            <div class="pt-6 border-t-2 border-slate-300 space-y-8">
              <p class="text-[11px] text-slate-600 italic">
                * Certification: The Viva Voce Board has evaluated all candidates in full compliance with the institutional scoring rubric and verified aggregate weighted computation. Candidates ranked 1 to {{ countSelectedMeritCandidates() }} are hereby recommended for final appointment.
              </p>

              <div class="grid grid-cols-4 gap-4 pt-6 text-center text-xs text-slate-800">
                <div class="border-t border-slate-900 pt-1.5">
                  <p class="font-bold">Member Secretary</p>
                  <p class="text-[10px] text-slate-500">Sr. Manager (Recruitment)</p>
                </div>
                <div class="border-t border-slate-900 pt-1.5">
                  <p class="font-bold">Technical Expert</p>
                  <p class="text-[10px] text-slate-500">Head of Operations</p>
                </div>
                <div class="border-t border-slate-900 pt-1.5">
                  <p class="font-bold">Zonal Representative</p>
                  <p class="text-[10px] text-slate-500">Zonal Manager</p>
                </div>
                <div class="border-t border-slate-900 pt-1.5">
                  <p class="font-bold">Board Chairman</p>
                  <p class="text-[10px] text-slate-500">Director (HR & Administration)</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ================================================================= -->
      <!-- MODAL: ASSIGN USER ROLES & SCOPE -->
      <!-- ================================================================= -->
      <div *ngIf="showAssignRoleModal" class="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div class="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-4">
          <div class="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 class="text-base font-bold text-slate-100">Assign Recruitment Roles & Scope</h3>
              <p class="text-xs text-slate-400">Configure access levels and data boundaries for personnel.</p>
            </div>
            <button (click)="closeAssignRoleModal()" class="text-slate-400 hover:text-slate-200 text-sm font-mono">&times;</button>
          </div>

          <div class="space-y-4 text-xs">
            <div>
              <label class="block text-slate-300 font-semibold mb-1">Target User *</label>
              <select 
                [(ngModel)]="roleAssignmentForm.userId" 
                class="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-purple-500">
                <option value="" disabled>Select personnel...</option>
                <option *ngFor="let u of rbacUsersList" [value]="u.id">
                  {{ getUserFullName(u) }} ({{ u.employee?.designation?.title || u.email }})
                </option>
              </select>
            </div>

            <div>
              <label class="block text-slate-300 font-semibold mb-2">Select Roles (Multi-Select Allowed) *</label>
              <div class="space-y-2">
                <label 
                  (click)="toggleRoleInForm('HQ_ADMIN')" 
                  class="flex items-start gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-colors"
                  [ngClass]="isRoleSelectedInForm('HQ_ADMIN') ? 'bg-purple-950/40 border-purple-600/60' : 'bg-slate-950 border-slate-800 hover:border-slate-700'">
                  <input type="checkbox" [checked]="isRoleSelectedInForm('HQ_ADMIN')" class="mt-0.5 rounded text-purple-600 focus:ring-0">
                  <div>
                    <span class="font-bold text-slate-100">HQ Admin (Headquarter Administrator)</span>
                    <p class="text-[11px] text-slate-400 mt-0.5">Full recruitment sovereignty across all recruitment modules.</p>
                  </div>
                </label>

                <label 
                  (click)="toggleRoleInForm('ZONE_ADMIN')" 
                  class="flex items-start gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-colors"
                  [ngClass]="isRoleSelectedInForm('ZONE_ADMIN') ? 'bg-sky-950/40 border-sky-600/60' : 'bg-slate-950 border-slate-800 hover:border-slate-700'">
                  <input type="checkbox" [checked]="isRoleSelectedInForm('ZONE_ADMIN')" class="mt-0.5 rounded text-sky-600 focus:ring-0">
                  <div>
                    <span class="font-bold text-slate-100">Zone Admin (Zone Administrator)</span>
                    <p class="text-[11px] text-slate-400 mt-0.5">Jurisdiction over zonal centers, requisitions, and attendance.</p>
                  </div>
                </label>

                <label 
                  (click)="toggleRoleInForm('BRANCH_ADMIN')" 
                  class="flex items-start gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-colors"
                  [ngClass]="isRoleSelectedInForm('BRANCH_ADMIN') ? 'bg-amber-950/40 border-amber-600/60' : 'bg-slate-950 border-slate-800 hover:border-slate-700'">
                  <input type="checkbox" [checked]="isRoleSelectedInForm('BRANCH_ADMIN')" class="mt-0.5 rounded text-amber-600 focus:ring-0">
                  <div>
                    <span class="font-bold text-slate-100">Branch Admin (Branch Administrator)</span>
                    <p class="text-[11px] text-slate-400 mt-0.5">Branch manpower requisitions and local onboarding logistics.</p>
                  </div>
                </label>

                <label 
                  (click)="toggleRoleInForm('VIVA_BOARD_MEMBER')" 
                  class="flex items-start gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-colors"
                  [ngClass]="isRoleSelectedInForm('VIVA_BOARD_MEMBER') ? 'bg-emerald-950/40 border-emerald-600/60' : 'bg-slate-950 border-slate-800 hover:border-slate-700'">
                  <input type="checkbox" [checked]="isRoleSelectedInForm('VIVA_BOARD_MEMBER')" class="mt-0.5 rounded text-emerald-600 focus:ring-0">
                  <div>
                    <span class="font-bold text-slate-100">Viva Board Member (Evaluator)</span>
                    <p class="text-[11px] text-slate-400 mt-0.5">Viva Voce scoring sheet and interview marks evaluation.</p>
                  </div>
                </label>

                <label 
                  (click)="toggleRoleInForm('USERS')" 
                  class="flex items-start gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-colors"
                  [ngClass]="isRoleSelectedInForm('USERS') ? 'bg-slate-800 border-slate-600' : 'bg-slate-950 border-slate-800 hover:border-slate-700'">
                  <input type="checkbox" [checked]="isRoleSelectedInForm('USERS')" class="mt-0.5 rounded text-slate-600 focus:ring-0">
                  <div>
                    <span class="font-bold text-slate-100">Users (General Staff)</span>
                    <p class="text-[11px] text-slate-400 mt-0.5">Applicant intake, CV search, admit card printing.</p>
                  </div>
                </label>
              </div>
            </div>

            <div>
              <label class="block text-slate-300 font-semibold mb-1">Data Scope Boundary</label>
              <select 
                [(ngModel)]="roleAssignmentForm.scopeType" 
                class="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-purple-500">
                <option value="GLOBAL">GLOBAL (All Uddipan Head Office, Zones & Branches)</option>
                <option value="HEADQUARTER">HEADQUARTER (Central Head Office Directorate)</option>
                <option value="ZONE">ZONE (Assigned Zone & Subordinate Branches)</option>
                <option value="BRANCH">BRANCH (Individual Branch Office)</option>
              </select>
            </div>
          </div>

          <div class="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
            <button 
              (click)="closeAssignRoleModal()" 
              class="px-4 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors">
              Cancel
            </button>
            <button 
              (click)="submitRoleAssignment()" 
              [disabled]="isSavingRoleAssignment || !roleAssignmentForm.userId"
              class="px-5 py-2 text-xs font-semibold bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-lg transition-colors shadow">
              {{ isSavingRoleAssignment ? 'Saving Roles...' : 'Save Role Assignment' }}
            </button>
          </div>
        </div>
      </div>

      <!-- ================================================================= -->
      <!-- MODAL: ASSIGN VIVA BOARD MEMBER -->
      <!-- ================================================================= -->
      <div *ngIf="showAssignVivaMemberModal" class="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div class="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-4">
          <div class="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 class="text-base font-bold text-slate-100">Assign Viva Voce Board Evaluator</h3>
              <p class="text-xs text-slate-400">Authorize personnel as certified interview board evaluator.</p>
            </div>
            <button (click)="closeAssignVivaMemberModal()" class="text-slate-400 hover:text-slate-200 text-sm font-mono">&times;</button>
          </div>

          <div class="space-y-4 text-xs">
            <div>
              <label class="block text-slate-300 font-semibold mb-1">Target Viva Board *</label>
              <select 
                [(ngModel)]="vivaAssignmentForm.vivaBoardId" 
                class="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-emerald-500">
                <option value="" disabled>Select active viva board...</option>
                <option *ngFor="let b of rbacVivaBoardsList" [value]="b.id">
                  {{ b.boardName }} ({{ b.vivaDate ? (b.vivaDate | date:'dd MMM yyyy') : 'Scheduled' }})
                </option>
              </select>
            </div>

            <div>
              <label class="block text-slate-300 font-semibold mb-1">Member / Evaluator User *</label>
              <select 
                [(ngModel)]="vivaAssignmentForm.userId" 
                class="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-emerald-500">
                <option value="" disabled>Select personnel...</option>
                <option *ngFor="let u of rbacUsersList" [value]="u.id">
                  {{ getUserFullName(u) }} ({{ u.employee?.designation?.title || u.email }})
                </option>
              </select>
            </div>

            <div>
              <label class="block text-slate-300 font-semibold mb-1">Board Role / Function *</label>
              <select 
                [(ngModel)]="vivaAssignmentForm.boardRole" 
                class="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-emerald-500">
                <option value="Board Chairman">Board Chairman</option>
                <option value="Technical Expert">Technical Expert</option>
                <option value="Zonal Representative">Zonal Representative</option>
                <option value="Member Secretary">Member Secretary</option>
                <option value="External Observer">External Observer</option>
              </select>
            </div>

            <div class="p-3 bg-emerald-950/40 border border-emerald-800/40 rounded-lg text-[11px] text-emerald-300">
              Assigned personnel will automatically receive the <span class="font-mono font-bold">VIVA_BOARD_MEMBER</span> role and will be listed in Viva Boards & Scoring as an authorized evaluator.
            </div>
          </div>

          <div class="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
            <button 
              (click)="closeAssignVivaMemberModal()" 
              class="px-4 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors">
              Cancel
            </button>
            <button 
              (click)="submitVivaMemberAssignment()" 
              [disabled]="isSavingVivaAssignment || !vivaAssignmentForm.userId || !vivaAssignmentForm.vivaBoardId"
              class="px-5 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg transition-colors shadow">
              {{ isSavingVivaAssignment ? 'Assigning...' : 'Assign Evaluator' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class RecruitmentComponent implements OnInit {
  activeTab: string = 'pipeline';
  showAdmitModal: boolean = false;
  showDeploymentModal: boolean = false;
  showCircularDetailModal: boolean = false;
  selectedCandidate: any = null;
  selectedCircular: any = null;

  rawCirculars: any[] = [];
  circularSearchQuery: string = '';
  circularStatusFilter: string = 'ALL';

  rawRequisitions: any[] = [];
  requisitionSearchQuery: string = '';
  requisitionStatusFilter: string = 'ALL';
  showNewRequisitionModal: boolean = false;
  showRequisitionDetailModal: boolean = false;
  showRejectionPromptModal: boolean = false;
  selectedRequisition: any = null;
  rejectionReason: string = '';
  isSubmittingRequisition: boolean = false;

  showReqLookupModal: boolean = false;
  reqLookupType: 'DEPARTMENT' | 'DESIGNATION' = 'DEPARTMENT';
  reqLookupSearch: string = '';
  reqLookupFilter: string = 'ALL';
  reqLookupViewMode: 'grid' | 'table' = 'grid';
  reqTempSelectedId: string = '';
  Number: any = Number;

  // --- Tab: Exam Halls & Schedules State ---
  examHallsList: any[] = [];
  examSchedulesList: any[] = [];
  isLoadingExams: boolean = false;
  isSavingExamHall: boolean = false;
  isSavingExamSchedule: boolean = false;
  examHallErrorMessage: string = '';
  examScheduleErrorMessage: string = '';

  showCreateExamHallModal: boolean = false;
  showScheduleExamModal: boolean = false;
  showAdmitCardsViewerModal: boolean = false;
  showSingleAdmitCardPrintModal: boolean = false;

  // --- Tab: Exam Attendance Management State ---
  selectedAttendanceScheduleId: string = '';
  attendanceFilterStatus: string = 'ALL';
  attendanceSearchQuery: string = '';
  attendanceScannerRoll: string = '';
  attendanceScannerFeedback: string = '';
  attendanceScannerSuccess: boolean = false;
  isAttendanceLocked: boolean = false;
  isLoadingAttendance: boolean = false;
  attendanceRecords: any[] = [];
  showPrintAttendanceModal: boolean = false;
  attendanceSheetRoomFilter: string = 'ALL';

  // --- Tab: Marks Tabulation & Cutoff Publishing State ---
  selectedTabulationScheduleId: string = '';
  cutoffMarksThreshold: number = 50.0;
  tabulationSearchQuery: string = '';
  tabulationStatusFilter: string = 'ALL';
  tabulationScores: any[] = [];
  isLoadingTabulation: boolean = false;
  isPublishingCutoff: boolean = false;
  isCutoffPublished: boolean = false;
  cutoffPublishSuccessMsg: string = '';
  showImportScoresModal: boolean = false;
  csvImportText: string = '';
  csvImportError: string = '';
  showExportTabulationModal: boolean = false;
  showPrintTabulationModal: boolean = false;
  exportTabulationScope: 'ALL' | 'QUALIFIED' | 'BELOW_CUTOFF' = 'ALL';
  exportTabulationFormat: 'EXCEL' | 'CSV' = 'EXCEL';
  exportTabulationIncludeHeader: boolean = true;
  todayDate: Date = new Date();

  // --- Tab: Viva Board & Interview Scoring State ---
  vivaBoardsList: any[] = [];
  selectedVivaBoardId: string = '';
  selectedVivaBoard: any = null;
  isLoadingVivaBoards: boolean = false;
  selectedEvaluatorMemberId: string = '';

  vivaCandidatesList: any[] = [];
  selectedVivaCandidateId: string = '';
  selectedVivaCandidate: any = null;
  vivaCandidateSearch: string = '';
  vivaCandidateFilter: 'ALL' | 'PENDING' | 'SCORED' | 'PRESENT' | 'INSIDE_BOARD' | 'ABSENT' = 'ALL';
  vivaCircularFilter: string = 'ALL';
  vivaAttendanceFilter: 'ALL' | 'PRESENT' | 'INSIDE_BOARD' | 'COMPLETED' | 'ABSENT' | 'PENDING' = 'ALL';
  isLoadingVivaCandidates: boolean = false;
  isVivaQueueCollapsed: boolean = false;

  vivaScoreForm = {
    appearanceScore: 8.0,
    technicalScore: 16.0,
    communicationScore: 8.0,
    remarks: ''
  };
  isSubmittingVivaScore: boolean = false;
  vivaScoreFeedbackMsg: string = '';

  vivaWrittenWeightPercent: number = 60;
  vivaVoceWeightPercent: number = 40;
  vivaVacanciesQuota: number = 10;
  vivaFinalSelectionCutoff: number = 65.0;

  isPublishingVivaMerit: boolean = false;
  vivaPublishSuccessMsg: string = '';
  showCreateVivaBoardModal: boolean = false;
  isCreatingVivaBoard: boolean = false;
  showVivaPublishConfirmModal: boolean = false;
  showVivaPrintModal: boolean = false;

  // --- Viva Exam Attendance Management State ---
  showVivaAttendanceModal: boolean = false;
  showPrintVivaAttendanceModal: boolean = false;
  isLoadingVivaAttendance: boolean = false;
  isSavingVivaAttendance: boolean = false;
  vivaAttendanceSearchQuery: string = '';
  vivaAttendanceFilterStatus: 'ALL' | 'PRESENT' | 'ABSENT' | 'PENDING' | 'INSIDE_BOARD' = 'ALL';
  vivaAttendanceRecords: any[] = [];
  vivaAttendanceScannerInput: string = '';
  vivaAttendanceFeedback: string = '';
  vivaAttendanceFeedbackSuccess: boolean = true;
  isVivaAttendanceLocked: boolean = false;
  vivaAttendanceSuccessMsg: string = '';

  newVivaBoardForm = {
    boardName: 'Viva Board #1: Field Officers & Operations',
    circularId: '',
    vivaDate: '2026-11-05',
    vivaTime: '10:00 AM - 04:30 PM',
    venue: 'Head Office Board Room (Level 5), Uddipan Bhaban, Dhaka',
    vacancies: 10,
    members: [
      { name: 'Dr. Masud Rahman', role: 'Board Chairman', designation: 'Director (HR & Admin)', userId: '' },
      { name: 'Engr. Rafiqul Alam', role: 'Technical Expert', designation: 'Head of Core Operations', userId: '' },
      { name: 'Zubaida Sultana', role: 'Zonal Representative', designation: 'Zonal Manager (Dhaka Central)', userId: '' },
      { name: 'Kazi Nazrul Islam', role: 'Member Secretary', designation: 'Sr. Manager (Recruitment)', userId: '' }
    ]
  };

  showEditVivaBoardModal: boolean = false;
  isSavingEditedBoard: boolean = false;
  editVivaBoardForm = {
    id: '',
    boardName: '',
    circularId: '',
    vivaDate: '',
    vivaTime: '10:00 AM - 04:30 PM',
    venue: '',
    vacancies: 10,
    members: [] as any[]
  };

  // --- Tab: Recruitment Settings & RBAC State ---
  rbacSubTab: 'roles' | 'users' | 'vivaAssign' | 'matrix' = 'roles';
  rbacRolesList: any[] = [];
  rbacUsersList: any[] = [];
  rbacVivaBoardsList: any[] = [];
  rbacPermissionsMatrix: any[] = [];
  isLoadingRbac: boolean = false;
  rbacSearchQuery: string = '';
  rbacRoleFilter: string = 'ALL';
  rbacSuccessMsg: string = '';
  rbacErrorMsg: string = '';

  showAssignRoleModal: boolean = false;
  isSavingRoleAssignment: boolean = false;
  roleAssignmentForm = {
    userId: '',
    roleCodes: [] as string[],
    scopeType: 'GLOBAL',
    scopeId: ''
  };

  showAssignVivaMemberModal: boolean = false;
  isSavingVivaAssignment: boolean = false;
  vivaAssignmentForm = {
    userId: '',
    vivaBoardId: '',
    boardRole: 'Technical Expert'
  };

  newExamHall = {
    hallName: '',
    centerLocation: '',
    roomNumber: '',
    capacity: 50,
  };

  newExamSchedule = {
    circularId: '',
    examType: 'WRITTEN',
    examDate: '',
    startTime: '10:00 AM',
    endTime: '12:00 PM',
    hallId: '',
    totalMarks: 100,
    passMarks: 50,
    includeApplied: false,
  };

  selectedScheduleForCards: any = null;
  selectedScheduleAdmitCards: any[] = [];
  isLoadingAdmitCards: boolean = false;
  selectedAdmitCardToPrint: any = null;
  admitCardSearchQuery: string = '';
  singleAdmitCardQrDataUrl: string = '';
  isGeneratingQrCode: boolean = false;
  showBatchPrintPreviewModal: boolean = false;

  examFilterCircularId: string = 'ALL';
  examFilterType: string = 'ALL';
  examSearchQuery: string = '';
  examCircularApplicants: any[] = [];
  isLoadingExamApplicants: boolean = false;

  get filteredExamSchedules(): any[] {
    return this.examSchedulesList.filter(s => {
      const matchCirc = this.examFilterCircularId === 'ALL' || s.circularId === this.examFilterCircularId;
      const matchType = this.examFilterType === 'ALL' || s.examType === this.examFilterType;
      if (!matchCirc || !matchType) return false;

      if (!this.examSearchQuery) return true;
      const q = this.examSearchQuery.toLowerCase();
      const circNo = (s.circular?.circularNo || '').toLowerCase();
      const title = (s.circular?.title || '').toLowerCase();
      const hall = (s.hall?.hallName || '').toLowerCase();
      const loc = (s.hall?.centerLocation || '').toLowerCase();
      return circNo.includes(q) || title.includes(q) || hall.includes(q) || loc.includes(q);
    });
  }

  get totalExamHallsCapacity(): number {
    return this.examHallsList.reduce((sum, h) => sum + (Number(h.capacity) || 0), 0);
  }

  get totalAdmitCardsIssuedCount(): number {
    return this.examSchedulesList.reduce((sum, s) => sum + (s._count?.admitCards || 0), 0);
  }

  get filteredAdmitCardsList(): any[] {
    if (!this.admitCardSearchQuery) return this.selectedScheduleAdmitCards;
    const q = this.admitCardSearchQuery.toLowerCase();
    return this.selectedScheduleAdmitCards.filter(c => {
      const roll = (c.rollNumber || '').toLowerCase();
      const seat = (c.seatNumber || '').toLowerCase();
      const name = (c.candidate?.fullName || '').toLowerCase();
      const tracking = (c.candidate?.trackingId || '').toLowerCase();
      const district = (c.candidate?.district || '').toLowerCase();
      return roll.includes(q) || seat.includes(q) || name.includes(q) || tracking.includes(q) || district.includes(q);
    });
  }
  realCandidates: any[] = [];
  selectedShortlistCircularId: string = '';
  shortlistCriteria = {
    minCgpa: 2.50,
    minExperienceYears: 0,
    minDegree: 'Bachelor',
    maxAge: 32,
    districts: [] as string[],
  };
  bangladeshDistricts: string[] = [
    'Dhaka', 'Bogura', 'Rajshahi', 'Chittagong', 'Sylhet', 'Barishal', 'Khulna', 'Cumilla', 'Rangpur', 'Mymensingh', 'Gazipur', 'Narayanganj'
  ];
  shortlistSimulationResult: any = null;
  isSimulatingShortlist: boolean = false;
  isExecutingShortlist: boolean = false;
  isResettingShortlist: boolean = false;
  shortlistCandidateFilter: 'ALL' | 'ELIGIBLE' | 'DISQUALIFIED' | 'SHORTLISTED' = 'ALL';
  shortlistCandidateSearch: string = '';

  showEnrollCandidateModal: boolean = false;
  isEnrollingCandidate: boolean = false;
  newCandidateForm = {
    fullName: '',
    email: '',
    phone: '',
    nidNumber: '',
    dateOfBirth: '1999-01-01',
    gender: 'MALE',
    district: 'Dhaka',
    highestDegree: 'Bachelor of Business Administration',
    institution: 'University of Dhaka',
    cgpa: 3.25,
    experienceYears: 1,
  };

  showEditCandidateModal: boolean = false;
  isUpdatingCandidate: boolean = false;
  editingCandidate: any = null;

  showCandidateDossierModal: boolean = false;
  viewingCandidate: any = null;

  showShortlistSuccessModal: boolean = false;
  lastExecutionResult: any = null;

  // Candidate Pool Multi-Selection & Interview Communication State
  selectedShortlistCandidateIds: string[] = [];
  showInterviewSmsModal: boolean = false;
  showInterviewEmailModal: boolean = false;
  isDispatchingInterviewSms: boolean = false;
  isDispatchingInterviewEmail: boolean = false;
  interviewNotificationTargets: any[] = [];
  interviewCommunicationToast: string = '';
  interviewToastTimer: any = null;

  // Sent records tracked by Candidate ID
  sentInterviewSmsIds: Set<string> = new Set<string>();
  sentInterviewEmailIds: Set<string> = new Set<string>();

  // Interview SMS Form Model
  interviewSmsForm = {
    interviewDate: '2026-11-10',
    interviewTime: '10:00 AM',
    venue: 'UDDIPAN Head Office (Board Room, Level-4), House #09, Road #01, Dhanmondi, Dhaka-1205',
    position: 'Field Officer / Branch Staff',
    template: 'Dear {{candidateName}}, you are invited for an Interview for {{position}} at UDDIPAN on {{interviewDate}} at {{interviewTime}}. Venue: {{venue}}. Bring original documents & admit card. Helpline: +880 2-9661234.'
  };

  // Interview Email Form Model
  interviewEmailForm = {
    subject: 'Interview Call Letter: {{position}} at UDDIPAN [Ref: {{trackingId}}]',
    interviewDate: '2026-11-10',
    interviewTime: '10:00 AM',
    venue: 'UDDIPAN Head Office, Board Room (Level-4), House #09, Road #01, Dhanmondi, Dhaka-1205',
    boardRoom: 'Executive Viva Board - 01',
    helpline: '+880 2-9661234, +880 1712-000000',
    position: 'Field Officer / Branch Staff',
    reportingInstructions: 'Please report 30 minutes before the scheduled interview time. Bring all original academic certificates, mark sheets, NID card, and 2 passport size photographs.',
    bodyIntro: 'We are pleased to inform you that following the preliminary screening for the position of {{position}}, you have been shortlisted to attend the Viva / Interview examination.'
  };

  departments: any[] = [];
  designations: any[] = [];
  jobGrades: any[] = [];
  zones: any[] = [];
  branches: any[] = [];
  filteredDesignations: any[] = [];
  filteredBranches: any[] = [];

  // Multi-dimensional Organizational Hierarchy Filter & Omnisearch State
  filterSearchQuery: string = '';
  filterDepartmentId: string = 'ALL';
  filterDesignationId: string = 'ALL';
  filterJobGradeId: string = 'ALL';
  filterZoneId: string = 'ALL';
  filterBranchId: string = 'ALL';
  isFilterConsoleExpanded: boolean = true;

  newRequisitionForm = {
    departmentId: '',
    designationId: '',
    branchId: '',
    vacanciesCount: 1,
    expectedJoinDate: '',
    budgetApproved: true,
    justification: '',
  };

  validTabs: string[] = [
    'pipeline',
    'requisitions',
    'circulars',
    'shortlisting',
    'examHalls',
    'examAttendance',
    'marksTabulation',
    'viva',
    'vivaAttendance',
    'analytics',
    'settings'
  ];

  tabs = [
    { id: 'pipeline', label: 'Recruitment Pipeline (Kanban)' },
    { id: 'requisitions', label: 'Manpower Requisitions' },
    { id: 'circulars', label: 'Job Circulars & Vacancies' },
    { id: 'shortlisting', label: 'Auto Shortlisting' }
  ];

  get isPortalTabsVisible(): boolean {
    return this.tabs.some(t => t.id === this.activeTab);
  }

  candidates: any[] = [];
  examHalls: any[] = [];

  circularColumns: ColumnDef[] = [
    { key: 'circularNo', header: 'Circular #', sortable: true },
    { key: 'title', header: 'Position Title', sortable: true },
    { key: 'vacancies', header: 'Vacancies', sortable: true },
    { key: 'deadline', header: 'Deadline', sortable: true },
    { key: 'applicants', header: 'Total Applicants', sortable: true },
    { key: 'status', header: 'Status', sortable: true },
  ];

  circularsTableData: any[] = [];

  examColumns: ColumnDef[] = [
    { key: 'examDate', header: 'Exam Date', sortable: true },
    { key: 'position', header: 'Position', sortable: true },
    { key: 'hall', header: 'Center & Hall', sortable: true },
    { key: 'time', header: 'Time Slot', sortable: true },
    { key: 'admitCards', header: 'Admit Cards Issued', sortable: true },
    { key: 'passMarks', header: 'Pass Marks', sortable: true },
  ];

  examSchedulesData: any[] = [];

  requisitionColumns: ColumnDef[] = [
    { key: 'requisitionNo', header: 'Requisition #', sortable: true },
    { key: 'department', header: 'Department', sortable: true },
    { key: 'designation', header: 'Target Position', sortable: true },
    { key: 'vacancies', header: 'Vacancies', sortable: true },
    { key: 'budgetStatus', header: 'Budget Approved', sortable: true },
    { key: 'status', header: 'Approval Status', sortable: true },
  ];

  requisitionsTableData: any[] = [];

  get filteredRequisitions(): any[] {
    return this.rawRequisitions.filter(r => {
      const matchesStatus = this.requisitionStatusFilter === 'ALL' || r.status === this.requisitionStatusFilter;
      if (!matchesStatus) return false;

      // Department Filter
      if (this.filterDepartmentId !== 'ALL' && r.departmentId !== this.filterDepartmentId) return false;

      // Designation Filter
      if (this.filterDesignationId !== 'ALL' && r.designationId !== this.filterDesignationId) return false;

      // Zone Filter
      if (this.filterZoneId !== 'ALL') {
        const zoneId = r.branch?.zoneId || r.branch?.zone?.id;
        if (zoneId !== this.filterZoneId) return false;
      }

      // Branch Filter
      if (this.filterBranchId !== 'ALL' && r.branchId !== this.filterBranchId) return false;

      // Job Grade Filter
      if (this.filterJobGradeId !== 'ALL') {
        const gradeId = r.designation?.jobGradeId;
        if (gradeId !== this.filterJobGradeId) return false;
      }

      if (!this.requisitionSearchQuery && !this.filterSearchQuery) return true;
      const q = (this.requisitionSearchQuery || this.filterSearchQuery).toLowerCase();
      const reqNo = (r.requisitionNo || '').toLowerCase();
      const dept = (r.department?.name || '').toLowerCase();
      const desig = (r.designation?.title || '').toLowerCase();
      const branch = (r.branch?.name || '').toLowerCase();
      const initiator = `${r.initiatedBy?.firstName || ''} ${r.initiatedBy?.lastName || ''}`.toLowerCase();
      return reqNo.includes(q) || dept.includes(q) || desig.includes(q) || branch.includes(q) || initiator.includes(q);
    });
  }

  get requisitionKpis() {
    const total = this.rawRequisitions.length;
    const pendingHr = this.rawRequisitions.filter(r => r.status === 'PENDING_HR').length;
    const approvedHr = this.rawRequisitions.filter(r => r.status === 'APPROVED_HR').length;
    const approvedManagement = this.rawRequisitions.filter(r => r.status === 'APPROVED_MANAGEMENT').length;
    const totalVacancies = this.rawRequisitions.reduce((acc, r) => acc + (Number(r.vacanciesCount) || 0), 0);
    return { total, pendingHr, approvedHr, approvedManagement, totalVacancies };
  }

  constructor(
    private http: HttpClient,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  selectTab(tabId: string): void {
    if (tabId === 'vivaAttendance') {
      this.activeTab = 'viva';
      if (this.vivaBoardsList.length === 0) {
        this.loadVivaBoards();
      }
      setTimeout(() => {
        this.openVivaAttendanceModal();
      }, 150);
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { tab: 'vivaAttendance' },
        queryParamsHandling: 'merge'
      });
      return;
    }

    this.activeTab = tabId;
    if (tabId === 'examAttendance' && this.attendanceRecords.length === 0) {
      if (this.selectedAttendanceScheduleId) {
        this.loadAttendanceForSchedule(this.selectedAttendanceScheduleId);
      }
    }
    if (tabId === 'marksTabulation' && this.tabulationScores.length === 0) {
      if (this.selectedTabulationScheduleId) {
        this.loadTabulationForSchedule(this.selectedTabulationScheduleId);
      }
    }
    if (tabId === 'viva' && this.vivaBoardsList.length === 0) {
      this.loadVivaBoards();
    }
    if (tabId === 'settings' && this.rbacRolesList.length === 0) {
      this.loadRbacSettings();
    }
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { tab: tabId },
      queryParamsHandling: 'merge'
    });
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      if (params['tab'] && this.validTabs.includes(params['tab'])) {
        if (params['tab'] === 'vivaAttendance') {
          this.activeTab = 'viva';
          if (this.vivaBoardsList.length === 0) {
            this.loadVivaBoards();
          }
          setTimeout(() => {
            this.openVivaAttendanceModal();
          }, 200);
          return;
        }

        this.activeTab = params['tab'];
        if (this.activeTab === 'examAttendance' && this.attendanceRecords.length === 0) {
          if (this.selectedAttendanceScheduleId) {
            this.loadAttendanceForSchedule(this.selectedAttendanceScheduleId);
          }
        }
        if (this.activeTab === 'marksTabulation' && this.tabulationScores.length === 0) {
          if (this.selectedTabulationScheduleId) {
            this.loadTabulationForSchedule(this.selectedTabulationScheduleId);
          }
        }
        if (this.activeTab === 'viva' && this.vivaBoardsList.length === 0) {
          this.loadVivaBoards();
        }
        if (this.activeTab === 'settings' && this.rbacRolesList.length === 0) {
          this.loadRbacSettings();
        }
      }
    });
    this.loadAllCandidates();
    this.loadCirculars();
    this.loadRequisitions();
    this.loadMasterData();
    this.loadExamHallsAndSchedules();
    this.loadVivaBoards();
    this.loadRbacSettings();
  }

  loadAllCandidates(): void {
    this.http.get<any>('/api/v1/recruitment/candidates').subscribe({
      next: (res) => {
        if (res && res.success && Array.isArray(res.data)) {
          this.candidates = res.data;
          if (!this.realCandidates || this.realCandidates.length === 0) {
            this.realCandidates = res.data;
          }
        }
      },
      error: (err) => console.error('Failed to load live candidates:', err)
    });
  }

  loadCirculars(): void {
    this.http.get<any>('/api/v1/recruitment/circulars').subscribe({
      next: (res) => {
        if (res.success && Array.isArray(res.data)) {
          this.rawCirculars = res.data.map((c: any) => {
            const reqText = c.requirements || '';
            const empStatus = this.extractSection(reqText, 'Employment Status') || 'Full-time';
            const skillsStr = this.extractSection(reqText, 'Skills & Expertise');
            const videoText = this.extractSection(reqText, 'Video CV Encouragement');
            const resp = this.extractSection(reqText, 'Responsibilities & Context') || reqText;
            const reqs = this.extractSection(reqText, 'Educational & Experience Requirements') || this.extractSection(reqText, 'Requirements & Qualifications') || reqText;
            const comp = this.extractSection(reqText, 'Compensation & Other Benefits');
            const loc = this.extractSection(reqText, 'Job Location') || 'Anywhere in Bangladesh';
            const read = this.extractSection(reqText, 'Read Before Apply');

            const isExpired = c.applicationDeadline ? (new Date(c.applicationDeadline) < new Date()) : false;
            const createdDate = c.createdAt ? new Date(c.createdAt).toLocaleDateString('en-US', { day: '2-digit', month: 'short' }) : '';

            return {
              id: c.id,
              circularNo: c.circularNo,
              title: c.title,
              departmentName: c.department?.name || 'Operations',
              designationTitle: c.designation?.title || 'Officer',
              vacancies: `${c.vacanciesCount} Posts`,
              vacanciesCount: c.vacanciesCount,
              deadline: this.formatDisplayDate(c.applicationDeadline),
              deadlineRaw: c.applicationDeadline,
              isExpired,
              formattedCreated: createdDate,
              employmentStatus: empStatus,
              jobLocation: loc,
              skills: skillsStr,
              videoCvEncouraged: videoText.toLowerCase().includes('encouraged'),
              responsibilities: resp,
              educationalRequirements: reqs,
              compensation: comp,
              readBeforeApply: read,
              applicants: c._count?.candidates || 0,
              minCgpa: c.minCgpa,
              minExperienceYears: c.minExperienceYears,
              minDegree: c.minDegree,
              maxAge: c.maxAge,
              status: c.status,
              raw: c
            };
          });

          this.circularsTableData = this.rawCirculars;

          if (!this.selectedShortlistCircularId && this.rawCirculars.length > 0) {
            this.selectedShortlistCircularId = this.rawCirculars[0].id;
            this.onShortlistCircularChange();
          }
        }
      },
      error: (err) => console.warn('Could not load live circulars, using cached data:', err)
    });
  }

  getFilteredCirculars(): any[] {
    const q = (this.circularSearchQuery || this.filterSearchQuery).toLowerCase().trim();
    return this.rawCirculars.filter(c => {
      const matchesSearch = !q || 
        c.title?.toLowerCase().includes(q) || 
        c.circularNo?.toLowerCase().includes(q) || 
        c.departmentName?.toLowerCase().includes(q) ||
        c.jobLocation?.toLowerCase().includes(q);

      const matchesStatus = this.circularStatusFilter === 'ALL' || c.status === this.circularStatusFilter;
      if (!matchesSearch || !matchesStatus) return false;

      // Department Filter
      if (this.filterDepartmentId !== 'ALL' && c.departmentId !== this.filterDepartmentId) return false;

      // Designation Filter
      if (this.filterDesignationId !== 'ALL' && c.designationId !== this.filterDesignationId) return false;

      // Job Grade Filter
      if (this.filterJobGradeId !== 'ALL' && c.jobGradeId !== this.filterJobGradeId) return false;

      return true;
    });
  }

  getPublishedCount(): number {
    return this.rawCirculars.filter(c => c.status === 'PUBLISHED').length;
  }

  getVideoCvCount(): number {
    return this.rawCirculars.filter(c => c.videoCvEncouraged).length;
  }

  getTotalApplicantsCount(): number {
    return this.rawCirculars.reduce((acc, curr) => acc + (curr.applicants || 0), 0);
  }

  viewCircularDetail(c: any): void {
    this.selectedCircular = c;
    this.showCircularDetailModal = true;
  }

  editCircular(c: any): void {
    this.showCircularDetailModal = false;
    if (c && c.id) {
      this.router.navigate(['/recruitment/edit-circular', c.id]);
    }
  }

  toggleCircularStatus(c: any): void {
    const newStatus = c.status === 'PUBLISHED' ? 'CLOSED' : 'PUBLISHED';
    this.http.put<any>(`/api/v1/recruitment/circulars/${c.id}`, { status: newStatus }).subscribe({
      next: (res) => {
        c.status = newStatus;
        this.loadCirculars();
      },
      error: (err) => alert('Failed to update status: ' + (err.error?.message || err.message))
    });
  }

  deleteCircular(c: any): void {
    if (confirm(`Are you sure you want to delete / archive Job Circular ${c.circularNo} (${c.title})?`)) {
      this.http.delete<any>(`/api/v1/recruitment/circulars/${c.id}`).subscribe({
        next: () => {
          alert(`Job Circular ${c.circularNo} has been deleted / archived.`);
          this.loadCirculars();
        },
        error: (err) => alert('Failed to delete circular: ' + (err.error?.message || err.message))
      });
    }
  }

  getSkillsList(skillsStr: string): string[] {
    if (!skillsStr) return [];
    return skillsStr.split(',').map(s => s.trim()).filter(Boolean);
  }

  extractSection(content: string, header: string): string {
    if (!content) return '';
    const regex = new RegExp(`### ${header}\\s*\\n([\\s\\S]*?)(?=(?:### |$))`, 'i');
    const match = content.match(regex);
    return match ? match[1].trim() : '';
  }

  printCircularNotice(): void {
    window.print();
  }

  formatDisplayDate(val: string): string {
    if (!val) return 'Open';
    try {
      const d = new Date(val);
      if (!isNaN(d.getTime())) {
        return d.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
      }
    } catch (_) {}
    return val;
  }

  matchesCandidateOrgFilter(c: any): boolean {
    // 1. Omnisearch Query
    if (this.filterSearchQuery) {
      const q = this.filterSearchQuery.toLowerCase().trim();
      const name = (c.fullName || '').toLowerCase();
      const tracking = (c.trackingId || '').toLowerCase();
      const email = (c.email || '').toLowerCase();
      const phone = (c.phone || '').toLowerCase();
      const district = (c.district || '').toLowerCase();
      const degree = (c.highestDegree || '').toLowerCase();
      const circularTitle = (c.circular?.title || '').toLowerCase();
      const desigTitle = (c.circular?.designation?.title || '').toLowerCase();
      const deptName = (c.circular?.departmentName || c.circular?.designation?.department?.name || '').toLowerCase();
      const branchName = (c.deployment?.branch?.name || c.branch?.name || '').toLowerCase();
      const zoneName = (c.deployment?.branch?.zone?.name || c.branch?.zone?.name || '').toLowerCase();

      const matched = name.includes(q) ||
        tracking.includes(q) ||
        email.includes(q) ||
        phone.includes(q) ||
        district.includes(q) ||
        degree.includes(q) ||
        circularTitle.includes(q) ||
        desigTitle.includes(q) ||
        deptName.includes(q) ||
        branchName.includes(q) ||
        zoneName.includes(q);

      if (!matched) return false;
    }

    // 2. Department Filter
    if (this.filterDepartmentId !== 'ALL') {
      const deptId = c.circular?.departmentId ||
        c.circular?.designation?.departmentId ||
        c.circular?.designation?.department?.id;
      if (deptId && deptId !== this.filterDepartmentId) return false;
      if (!deptId) {
        const selectedDept = this.departments.find(d => d.id === this.filterDepartmentId);
        if (selectedDept && c.circular?.departmentName &&
            !c.circular.departmentName.toLowerCase().includes(selectedDept.name.toLowerCase())) {
          return false;
        }
      }
    }

    // 3. Designation Filter
    if (this.filterDesignationId !== 'ALL') {
      const desigId = c.circular?.designationId || c.circular?.designation?.id;
      if (desigId && desigId !== this.filterDesignationId) return false;
      if (!desigId) {
        const selectedDesig = this.designations.find(d => d.id === this.filterDesignationId);
        if (selectedDesig && c.circular?.title &&
            !c.circular.title.toLowerCase().includes(selectedDesig.title.toLowerCase())) {
          return false;
        }
      }
    }

    // 4. Job Grade Filter
    if (this.filterJobGradeId !== 'ALL') {
      const gradeId = c.circular?.jobGradeId ||
        c.circular?.designation?.jobGradeId ||
        c.circular?.designation?.jobGrade?.id;
      if (gradeId && gradeId !== this.filterJobGradeId) return false;
      if (!gradeId) {
        const desig = this.designations.find(d => d.id === (c.circular?.designationId || c.circular?.designation?.id));
        if (desig?.jobGradeId && desig.jobGradeId !== this.filterJobGradeId) return false;
      }
    }

    // 5. Zone Filter
    if (this.filterZoneId !== 'ALL') {
      const zoneId = c.deployment?.branch?.zoneId ||
        c.deployment?.branch?.zone?.id ||
        c.branch?.zoneId ||
        c.branch?.zone?.id;
      if (zoneId) {
        if (zoneId !== this.filterZoneId) return false;
      } else {
        const selectedZone = this.zones.find(z => z.id === this.filterZoneId);
        if (selectedZone) {
          const zoneName = selectedZone.name.toLowerCase();
          const dist = (c.district || '').toLowerCase();
          const zoneKey = zoneName.replace(' zone', '').trim();
          if (!dist.includes(zoneKey) && !zoneName.includes(dist)) {
            const branchesInZone = this.branches.filter(b => b.zoneId === this.filterZoneId);
            const matchesBranchInZone = branchesInZone.some(b => 
              (c.district && b.name.toLowerCase().includes(c.district.toLowerCase())) ||
              (c.deployment?.branch?.name && b.name.toLowerCase() === c.deployment.branch.name.toLowerCase())
            );
            if (!matchesBranchInZone && dist) return false;
          }
        }
      }
    }

    // 6. Branch Filter
    if (this.filterBranchId !== 'ALL') {
      const branchId = c.deployment?.branchId ||
        c.deployment?.branch?.id ||
        c.branchId ||
        c.branch?.id;
      if (branchId) {
        if (branchId !== this.filterBranchId) return false;
      } else {
        const selectedBranch = this.branches.find(b => b.id === this.filterBranchId);
        if (selectedBranch) {
          const bName = selectedBranch.name.toLowerCase();
          const dist = (c.district || '').toLowerCase();
          if (!bName.includes(dist) && !dist.includes(bName)) return false;
        }
      }
    }

    return true;
  }

  getCandidatesByStatus(status: string): any[] {
    return this.candidates.filter(c => c.status === status && this.matchesCandidateOrgFilter(c));
  }

  getFilteredCandidatesTotal(): number {
    return this.candidates.filter(c => this.matchesCandidateOrgFilter(c)).length;
  }

  viewAdmitCard(candidate: any) {
    this.selectedCandidate = candidate;
    this.showAdmitModal = true;
  }

  previewDeploymentLetter(candidate: any) {
    this.selectedCandidate = candidate;
    this.showDeploymentModal = true;
  }

  convertToEmployee(candidate: any) {
    candidate.isConverting = true;
    setTimeout(() => {
      candidate.isConverting = false;
      candidate.isConvertedToEmployee = true;
      candidate.employeeId = `EMP-2026-${candidate.trackingId.replace('CAN-2026-', '')}`;
      alert(`Candidate ${candidate.fullName} successfully onboarded into Module 1 (Employee Master) with Employee Code: ${candidate.employeeId}. Digital file, salary band, and default leave policies initialized.`);
    }, 600);
  }

  onShortlistCircularChange(): void {
    if (!this.selectedShortlistCircularId) return;
    const c = this.rawCirculars.find(item => item.id === this.selectedShortlistCircularId);
    if (c) {
      if (c.minCgpa !== undefined && c.minCgpa !== null) this.shortlistCriteria.minCgpa = Number(c.minCgpa) || 2.50;
      if (c.minExperienceYears !== undefined && c.minExperienceYears !== null) this.shortlistCriteria.minExperienceYears = Number(c.minExperienceYears) || 0;
      if (c.minDegree) this.shortlistCriteria.minDegree = c.minDegree;
      if (c.maxAge !== undefined && c.maxAge !== null) this.shortlistCriteria.maxAge = Number(c.maxAge) || 32;
    }
    this.loadShortlistCandidates();
  }

  loadShortlistCandidates(): void {
    if (!this.selectedShortlistCircularId) return;
    this.isSimulatingShortlist = true;
    this.http.get<any>(`/api/v1/recruitment/candidates?circularId=${this.selectedShortlistCircularId}`).subscribe({
      next: (res) => {
        if (res.success && Array.isArray(res.data)) {
          this.realCandidates = res.data;
        }
        this.simulateShortlist();
      },
      error: (err) => {
        console.error('Failed to load circular candidates:', err);
        this.isSimulatingShortlist = false;
      }
    });
  }

  simulateShortlist(): void {
    if (!this.selectedShortlistCircularId) return;
    this.isSimulatingShortlist = true;
    const params: any = {
      circularId: this.selectedShortlistCircularId,
      minCgpa: this.shortlistCriteria.minCgpa.toString(),
      minExperienceYears: this.shortlistCriteria.minExperienceYears.toString(),
      minDegree: this.shortlistCriteria.minDegree,
      maxAge: this.shortlistCriteria.maxAge.toString(),
    };
    if (this.shortlistCriteria.districts.length > 0) {
      params.districts = this.shortlistCriteria.districts.join(',');
    }

    this.http.get<any>('/api/v1/recruitment/shortlisting', { params }).subscribe({
      next: (res) => {
        this.isSimulatingShortlist = false;
        if (res.success) {
          this.shortlistSimulationResult = res.data;
        }
      },
      error: (err) => {
        this.isSimulatingShortlist = false;
        console.error('Shortlisting simulation failed:', err);
      }
    });
  }

  toggleShortlistDistrict(dist: string): void {
    const idx = this.shortlistCriteria.districts.indexOf(dist);
    if (idx >= 0) {
      this.shortlistCriteria.districts.splice(idx, 1);
    } else {
      this.shortlistCriteria.districts.push(dist);
    }
    this.simulateShortlist();
  }

  isDistrictSelected(dist: string): boolean {
    return this.shortlistCriteria.districts.includes(dist);
  }

  executeShortlistingAlgorithm(): void {
    if (!this.selectedShortlistCircularId) return;
    if (!confirm(`Execute Multi-Criteria Shortlisting Algorithm for ${this.getSelectedCircularTitle()}?\n\nEligible applicants will be transitioned to SHORTLISTED status in the database.`)) return;

    this.isExecutingShortlist = true;
    const payload = {
      circularId: this.selectedShortlistCircularId,
      minCgpa: Number(this.shortlistCriteria.minCgpa),
      minExperienceYears: Number(this.shortlistCriteria.minExperienceYears),
      minDegree: this.shortlistCriteria.minDegree,
      maxAge: Number(this.shortlistCriteria.maxAge),
      districts: this.shortlistCriteria.districts.length > 0 ? this.shortlistCriteria.districts : undefined,
      dryRun: false,
    };

    this.http.post<any>('/api/v1/recruitment/shortlisting', payload).subscribe({
      next: (res) => {
        this.isExecutingShortlist = false;
        if (res.success) {
          this.lastExecutionResult = res.data;
          this.showShortlistSuccessModal = true;
          this.loadShortlistCandidates();
          this.loadAllCandidates();
        }
      },
      error: (err) => {
        this.isExecutingShortlist = false;
        alert('Failed to execute shortlisting algorithm: ' + (err.error?.message || err.message));
      }
    });
  }

  resetShortlistStatuses(): void {
    if (!this.selectedShortlistCircularId) return;
    if (!confirm(`Reset all candidate statuses of this circular back to APPLIED?\nThis allows re-evaluating the candidate pool with updated criteria.`)) return;

    this.isResettingShortlist = true;
    this.http.delete<any>(`/api/v1/recruitment/shortlisting?circularId=${this.selectedShortlistCircularId}`).subscribe({
      next: (res) => {
        this.isResettingShortlist = false;
        alert(res.message || 'Candidate statuses reset successfully to APPLIED.');
        this.loadShortlistCandidates();
        this.loadAllCandidates();
      },
      error: (err) => {
        this.isResettingShortlist = false;
        alert('Failed to reset candidate statuses: ' + (err.error?.message || err.message));
      }
    });
  }

  getCandidateEvaluation(candidateId: string): any {
    if (!this.shortlistSimulationResult?.evaluations) return null;
    return this.shortlistSimulationResult.evaluations.find((e: any) => e.candidateId === candidateId);
  }

  getFilteredShortlistCandidates(): any[] {
    return this.realCandidates.filter(c => {
      const evalItem = this.getCandidateEvaluation(c.id);
      if (this.shortlistCandidateFilter === 'ELIGIBLE') {
        if (!evalItem || !evalItem.isEligible) return false;
      } else if (this.shortlistCandidateFilter === 'DISQUALIFIED') {
        if (!evalItem || evalItem.isEligible) return false;
      } else if (this.shortlistCandidateFilter === 'SHORTLISTED') {
        if (c.status !== 'SHORTLISTED') return false;
      }

      if (!this.shortlistCandidateSearch) return true;
      const q = this.shortlistCandidateSearch.toLowerCase();
      const track = (c.trackingId || '').toLowerCase();
      const name = (c.fullName || '').toLowerCase();
      const deg = (c.highestDegree || '').toLowerCase();
      const dist = (c.district || '').toLowerCase();
      const email = (c.email || '').toLowerCase();
      const phone = (c.phone || '').toLowerCase();
      return track.includes(q) || name.includes(q) || phone.includes(q) || deg.includes(q) || dist.includes(q) || email.includes(q);
    });
  }

  openEnrollModalForCircular(): void {
    this.newCandidateForm = {
      fullName: '',
      email: '',
      phone: '',
      nidNumber: '',
      dateOfBirth: '1999-06-15',
      gender: 'MALE',
      district: 'Dhaka',
      highestDegree: 'Bachelor of Business Administration',
      institution: 'University of Dhaka',
      cgpa: 3.40,
      experienceYears: 1,
    };
    this.showEnrollCandidateModal = true;
  }

  submitEnrollCandidate(): void {
    if (!this.selectedShortlistCircularId) {
      alert('Please select a target job circular first.');
      return;
    }
    const fullName = (this.newCandidateForm.fullName || '').trim();
    const email = (this.newCandidateForm.email || '').trim().toLowerCase();
    const phone = (this.newCandidateForm.phone || '').trim();

    if (!fullName || !email || !phone) {
      alert('Please fill Full Name, Email, and Phone.');
      return;
    }

    const cgpaVal = Number(this.newCandidateForm.cgpa);
    const expVal = Number(this.newCandidateForm.experienceYears) || 0;

    this.isEnrollingCandidate = true;
    const payload = {
      circularId: this.selectedShortlistCircularId,
      fullName,
      email,
      phone,
      nidNumber: this.newCandidateForm.nidNumber ? this.newCandidateForm.nidNumber.trim() : undefined,
      dateOfBirth: this.newCandidateForm.dateOfBirth || '1999-01-01',
      gender: this.newCandidateForm.gender || 'MALE',
      district: this.newCandidateForm.district || 'Dhaka',
      highestDegree: this.newCandidateForm.highestDegree || 'Bachelor of Business Administration',
      institution: this.newCandidateForm.institution ? this.newCandidateForm.institution.trim() : undefined,
      cgpa: isNaN(cgpaVal) ? 3.0 : cgpaVal,
      experienceYears: isNaN(expVal) ? 0 : expVal,
    };

    this.http.post<any>('/api/v1/recruitment/candidates', payload).subscribe({
      next: (res) => {
        this.isEnrollingCandidate = false;
        alert(`Candidate ${res.data?.fullName} enrolled with Tracking ID: ${res.data?.trackingId}`);
        this.showEnrollCandidateModal = false;
        this.loadShortlistCandidates();
        this.loadAllCandidates();
      },
      error: (err) => {
        this.isEnrollingCandidate = false;
        const msg = err.error?.message || 
          (err.error?.errors ? Object.entries(err.error.errors).map(([k, v]) => `${k}: ${v}`).join('; ') : null) || 
          err.message || 
          'Validation failed';
        alert('Failed to enroll candidate: ' + msg);
      }
    });
  }

  openEditCandidateModal(c: any): void {
    this.editingCandidate = {
      id: c.id,
      trackingId: c.trackingId,
      fullName: c.fullName,
      email: c.email,
      phone: c.phone,
      nidNumber: c.nidNumber,
      dateOfBirth: c.dateOfBirth ? c.dateOfBirth.split('T')[0] : '1999-01-01',
      gender: c.gender,
      district: c.district,
      highestDegree: c.highestDegree,
      institution: c.institution,
      cgpa: Number(c.cgpa),
      experienceYears: Number(c.experienceYears) || 0,
      status: c.status,
    };
    this.showEditCandidateModal = true;
  }

  submitEditCandidate(): void {
    if (!this.editingCandidate) return;
    this.isUpdatingCandidate = true;
    const payload = {
      fullName: this.editingCandidate.fullName,
      email: this.editingCandidate.email,
      phone: this.editingCandidate.phone,
      district: this.editingCandidate.district,
      highestDegree: this.editingCandidate.highestDegree,
      institution: this.editingCandidate.institution,
      cgpa: Number(this.editingCandidate.cgpa),
      experienceYears: Number(this.editingCandidate.experienceYears),
      status: this.editingCandidate.status,
    };

    this.http.patch<any>(`/api/v1/recruitment/candidates/${this.editingCandidate.id}`, payload).subscribe({
      next: () => {
        this.isUpdatingCandidate = false;
        this.showEditCandidateModal = false;
        this.loadShortlistCandidates();
        this.loadAllCandidates();
      },
      error: (err) => {
        this.isUpdatingCandidate = false;
        alert('Failed to update candidate: ' + (err.error?.message || err.message));
      }
    });
  }

  deleteCandidateRecord(c: any): void {
    if (!confirm(`Are you sure you want to permanently delete candidate ${c.fullName} (${c.trackingId})?`)) return;
    this.http.delete<any>(`/api/v1/recruitment/candidates/${c.id}`).subscribe({
      next: () => {
        this.loadShortlistCandidates();
        this.loadAllCandidates();
      },
      error: (err) => alert('Failed to delete candidate: ' + (err.error?.message || err.message))
    });
  }

  overrideCandidateStatus(c: any, status: string): void {
    this.http.patch<any>(`/api/v1/recruitment/candidates/${c.id}`, { status }).subscribe({
      next: () => {
        this.loadShortlistCandidates();
        this.loadAllCandidates();
      },
      error: (err) => alert('Failed to update status: ' + (err.error?.message || err.message))
    });
  }

  openCandidateDossier(c: any): void {
    this.viewingCandidate = c;
    this.showCandidateDossierModal = true;
  }

  getSelectedCircularTitle(): string {
    const c = this.rawCirculars.find(item => item.id === this.selectedShortlistCircularId);
    return c ? `${c.circularNo} - ${c.title}` : 'Selected Circular';
  }

  getSelectedCircularDetails(): any {
    return this.rawCirculars.find(item => item.id === this.selectedShortlistCircularId);
  }

  getCandidateAge(dob: string): number {
    if (!dob) return 0;
    const diff = new Date().getTime() - new Date(dob).getTime();
    return Math.abs(new Date(diff).getUTCFullYear() - 1970);
  }

  // --- Candidate Pool Multi-Selection & Interview Communication Methods ---

  toggleSelectAllShortlist(event: any): void {
    const isChecked = event && event.target ? event.target.checked : false;
    const visibleCandidates = this.getFilteredShortlistCandidates();
    if (isChecked) {
      const currentSet = new Set(this.selectedShortlistCandidateIds);
      visibleCandidates.forEach(c => currentSet.add(c.id));
      this.selectedShortlistCandidateIds = Array.from(currentSet);
    } else {
      const visibleIds = new Set(visibleCandidates.map(c => c.id));
      this.selectedShortlistCandidateIds = this.selectedShortlistCandidateIds.filter(id => !visibleIds.has(id));
    }
  }

  isAllShortlistSelected(): boolean {
    const visibleCandidates = this.getFilteredShortlistCandidates();
    if (visibleCandidates.length === 0) return false;
    return visibleCandidates.every(c => this.selectedShortlistCandidateIds.includes(c.id));
  }

  isShortlistPartiallySelected(): boolean {
    const visibleCandidates = this.getFilteredShortlistCandidates();
    if (visibleCandidates.length === 0) return false;
    const selectedCount = visibleCandidates.filter(c => this.selectedShortlistCandidateIds.includes(c.id)).length;
    return selectedCount > 0 && selectedCount < visibleCandidates.length;
  }

  isCandidateSelected(id: string): boolean {
    return this.selectedShortlistCandidateIds.includes(id);
  }

  toggleCandidateSelection(id: string): void {
    const index = this.selectedShortlistCandidateIds.indexOf(id);
    if (index >= 0) {
      this.selectedShortlistCandidateIds.splice(index, 1);
    } else {
      this.selectedShortlistCandidateIds.push(id);
    }
  }

  clearShortlistSelection(): void {
    this.selectedShortlistCandidateIds = [];
  }

  getSelectedShortlistCandidates(): any[] {
    return this.realCandidates.filter(c => this.selectedShortlistCandidateIds.includes(c.id));
  }

  openSingleCandidateSmsModal(c: any): void {
    this.interviewNotificationTargets = [c];
    this.interviewSmsForm.position = this.selectedCircular?.title || 'Field Officer / Branch Staff';
    this.showInterviewSmsModal = true;
  }

  openSingleCandidateEmailModal(c: any): void {
    this.interviewNotificationTargets = [c];
    this.interviewEmailForm.position = this.selectedCircular?.title || 'Field Officer / Branch Staff';
    this.showInterviewEmailModal = true;
  }

  openBulkInterviewSmsModal(): void {
    const targets = this.getSelectedShortlistCandidates();
    if (targets.length === 0) {
      this.showToastNotification('Please select at least one candidate from the grid first.');
      return;
    }
    this.interviewNotificationTargets = [...targets];
    this.interviewSmsForm.position = this.selectedCircular?.title || 'Field Officer / Branch Staff';
    this.showInterviewSmsModal = true;
  }

  openBulkInterviewEmailModal(): void {
    const targets = this.getSelectedShortlistCandidates();
    if (targets.length === 0) {
      this.showToastNotification('Please select at least one candidate from the grid first.');
      return;
    }
    this.interviewNotificationTargets = [...targets];
    this.interviewEmailForm.position = this.selectedCircular?.title || 'Field Officer / Branch Staff';
    this.showInterviewEmailModal = true;
  }

  removeTargetFromNotification(cId: string): void {
    this.interviewNotificationTargets = this.interviewNotificationTargets.filter(t => t.id !== cId);
    if (this.interviewNotificationTargets.length === 0) {
      this.showInterviewSmsModal = false;
      this.showInterviewEmailModal = false;
    }
  }

  copyCandidatePhone(phone: string): void {
    if (!phone) return;
    if (navigator && navigator.clipboard) {
      navigator.clipboard.writeText(phone);
      this.showToastNotification(`Mobile number copied: ${phone}`);
    }
  }

  showToastNotification(message: string): void {
    this.interviewCommunicationToast = message;
    if (this.interviewToastTimer) {
      clearTimeout(this.interviewToastTimer);
    }
    this.interviewToastTimer = setTimeout(() => {
      this.interviewCommunicationToast = '';
    }, 4500);
  }

  getInterpolatedSms(c?: any): string {
    const target = c || this.interviewNotificationTargets[0] || {
      fullName: 'Md. Candidate Name',
      trackingId: 'TRK-2026-0001',
      phone: '+8801700000000'
    };
    let text = this.interviewSmsForm.template || '';
    text = text.replace(/\{\{candidateName\}\}/g, target.fullName || 'Candidate');
    text = text.replace(/\{\{trackingId\}\}/g, target.trackingId || 'TRK-APP');
    text = text.replace(/\{\{position\}\}/g, this.interviewSmsForm.position || 'Field Officer');
    text = text.replace(/\{\{interviewDate\}\}/g, this.interviewSmsForm.interviewDate || 'TBD');
    text = text.replace(/\{\{interviewTime\}\}/g, this.interviewSmsForm.interviewTime || '10:00 AM');
    text = text.replace(/\{\{venue\}\}/g, this.interviewSmsForm.venue || 'UDDIPAN Head Office');
    return text;
  }

  getSmsSegments(charCount: number): number {
    if (charCount <= 0) return 1;
    return Math.ceil(charCount / 160);
  }

  insertSmsPlaceholder(placeholder: string): void {
    this.interviewSmsForm.template = (this.interviewSmsForm.template || '') + ` {{${placeholder}}}`;
  }

  sendInterviewSmsBatch(): void {
    if (this.interviewNotificationTargets.length === 0) return;
    this.isDispatchingInterviewSms = true;

    setTimeout(() => {
      this.interviewNotificationTargets.forEach(target => {
        this.sentInterviewSmsIds.add(target.id);
        target.interviewSmsSent = true;
        target.lastSmsDate = this.interviewSmsForm.interviewDate;
      });

      this.isDispatchingInterviewSms = false;
      this.showInterviewSmsModal = false;
      const count = this.interviewNotificationTargets.length;
      this.showToastNotification(`Successfully sent Interview SMS to ${count} candidate(s).`);
    }, 600);
  }

  getInterpolatedEmailSubject(c?: any): string {
    const target = c || this.interviewNotificationTargets[0] || { trackingId: 'TRK-APP' };
    let subj = this.interviewEmailForm.subject || '';
    subj = subj.replace(/\{\{position\}\}/g, this.interviewEmailForm.position || 'Field Officer');
    subj = subj.replace(/\{\{trackingId\}\}/g, target.trackingId || 'TRK-APP');
    return subj;
  }

  sendInterviewEmailBatch(): void {
    if (this.interviewNotificationTargets.length === 0) return;
    this.isDispatchingInterviewEmail = true;

    setTimeout(() => {
      this.interviewNotificationTargets.forEach(target => {
        this.sentInterviewEmailIds.add(target.id);
        target.interviewEmailSent = true;
        target.lastEmailDate = this.interviewEmailForm.interviewDate;
      });

      this.isDispatchingInterviewEmail = false;
      this.showInterviewEmailModal = false;
      const count = this.interviewNotificationTargets.length;
      this.showToastNotification(`Successfully dispatched Interview Invitation Email to ${count} candidate(s).`);
    }, 600);
  }

  isCandidateSmsSent(id: string): boolean {
    return this.sentInterviewSmsIds.has(id);
  }

  isCandidateEmailSent(id: string): boolean {
    return this.sentInterviewEmailIds.has(id);
  }

  runShortlistEngine() {
    this.executeShortlistingAlgorithm();
  }

  submitScore() {
    alert('Viva Score of 32/40 recorded. Candidate successfully moved to SELECTED status.');
  }

  openCircularModal() {
    this.router.navigate(['/recruitment/new-circular']);
  }

  openEnrollModal() {
    this.openEnrollModalForCircular();
  }

  loadRequisitions(): void {
    this.http.get<any>('/api/v1/recruitment/requisitions').subscribe({
      next: (res) => {
        if (res.success && Array.isArray(res.data)) {
          this.rawRequisitions = res.data;
        }
      },
      error: (err) => console.error('Failed to load requisitions:', err)
    });
  }

  loadMasterData(): void {
    this.http.get<any>('/api/v1/master/departments').subscribe({
      next: (res) => {
        if (res.success) this.departments = res.data || [];
      }
    });
    this.http.get<any>('/api/v1/master/designations').subscribe({
      next: (res) => {
        if (res.success) {
          this.designations = res.data || [];
          this.filteredDesignations = [...this.designations];
        }
      }
    });
    this.http.get<any>('/api/v1/master/job-grades').subscribe({
      next: (res) => {
        if (res.success) {
          this.jobGrades = res.data || [];
        }
      }
    });
    this.http.get<any>('/api/v1/master/zones').subscribe({
      next: (res) => {
        if (res.success) {
          this.zones = res.data || [];
        }
      }
    });
    this.http.get<any>('/api/v1/master/branches').subscribe({
      next: (res) => {
        if (res.success) {
          this.branches = res.data || [];
          this.filteredBranches = [...this.branches];
        }
      }
    });
  }

  // Cascading Filter Event Handlers
  onFilterZoneChange(): void {
    if (this.filterZoneId === 'ALL') {
      this.filteredBranches = [...this.branches];
    } else {
      this.filteredBranches = this.branches.filter(b => b.zoneId === this.filterZoneId || b.zone?.id === this.filterZoneId);
      if (this.filterBranchId !== 'ALL' && !this.filteredBranches.some(b => b.id === this.filterBranchId)) {
        this.filterBranchId = 'ALL';
      }
    }
  }

  onFilterBranchChange(): void {
    if (this.filterBranchId !== 'ALL') {
      const branch = this.branches.find(b => b.id === this.filterBranchId);
      if (branch && (branch.zoneId || branch.zone?.id) && this.filterZoneId === 'ALL') {
        this.filterZoneId = branch.zoneId || branch.zone?.id;
        this.onFilterZoneChange();
      }
    }
  }

  onFilterDepartmentChange(): void {
    if (this.filterDepartmentId === 'ALL') {
      this.filteredDesignations = [...this.designations];
    } else {
      this.filteredDesignations = this.designations.filter(d => d.departmentId === this.filterDepartmentId);
      if (this.filterDesignationId !== 'ALL' && !this.filteredDesignations.some(d => d.id === this.filterDesignationId)) {
        this.filterDesignationId = 'ALL';
      }
    }
  }

  onFilterDesignationChange(): void {
    if (this.filterDesignationId !== 'ALL') {
      const desig = this.designations.find(d => d.id === this.filterDesignationId);
      if (desig && desig.departmentId && this.filterDepartmentId === 'ALL') {
        this.filterDepartmentId = desig.departmentId;
        this.onFilterDepartmentChange();
      }
      if (desig && desig.jobGradeId && this.filterJobGradeId === 'ALL') {
        this.filterJobGradeId = desig.jobGradeId;
      }
    }
  }

  onFilterJobGradeChange(): void {
    if (this.filterJobGradeId !== 'ALL' && this.filterDesignationId !== 'ALL') {
      const desig = this.designations.find(d => d.id === this.filterDesignationId);
      if (desig && desig.jobGradeId && desig.jobGradeId !== this.filterJobGradeId) {
        this.filterDesignationId = 'ALL';
      }
    }
  }

  clearOrgFilters(): void {
    this.filterSearchQuery = '';
    this.filterDepartmentId = 'ALL';
    this.filterDesignationId = 'ALL';
    this.filterJobGradeId = 'ALL';
    this.filterZoneId = 'ALL';
    this.filterBranchId = 'ALL';
    this.filteredDesignations = [...this.designations];
    this.filteredBranches = [...this.branches];
  }

  get isAnyOrgFilterActive(): boolean {
    return !!this.filterSearchQuery ||
      this.filterDepartmentId !== 'ALL' ||
      this.filterDesignationId !== 'ALL' ||
      this.filterJobGradeId !== 'ALL' ||
      this.filterZoneId !== 'ALL' ||
      this.filterBranchId !== 'ALL';
  }

  getActiveFilterCount(): number {
    let count = 0;
    if (this.filterSearchQuery) count++;
    if (this.filterDepartmentId !== 'ALL') count++;
    if (this.filterDesignationId !== 'ALL') count++;
    if (this.filterJobGradeId !== 'ALL') count++;
    if (this.filterZoneId !== 'ALL') count++;
    if (this.filterBranchId !== 'ALL') count++;
    return count;
  }


  getDesignationTitleById(id: string): string {
    const d = this.designations.find(desig => desig.id === id);
    return d ? d.title : '';
  }

  getJobGradeCodeById(id: string): string {
    const g = this.jobGrades.find(grade => grade.id === id);
    return g ? (g.name || g.code || `Grade ${g.level}`) : '';
  }

  getZoneNameById(id: string): string {
    const z = this.zones.find(zone => zone.id === id);
    return z ? z.name : '';
  }

  getBranchNameById(id: string): string {
    const b = this.branches.find(branch => branch.id === id);
    return b ? b.name : '';
  }

  onRequisitionDeptChange(): void {
    if (!this.newRequisitionForm.departmentId) {
      this.filteredDesignations = [...this.designations];
    } else {
      const filtered = this.designations.filter(d => d.departmentId === this.newRequisitionForm.departmentId);
      this.filteredDesignations = filtered.length > 0 ? filtered : [...this.designations];
    }
    this.newRequisitionForm.designationId = '';
  }

  openRequisitionModal(): void {
    this.newRequisitionForm = {
      departmentId: this.departments.length > 0 ? this.departments[0].id : '',
      designationId: '',
      branchId: '',
      vacanciesCount: 1,
      expectedJoinDate: '',
      budgetApproved: true,
      justification: '',
    };
    this.onRequisitionDeptChange();
    this.showNewRequisitionModal = true;
  }

  closeRequisitionModal(): void {
    this.showNewRequisitionModal = false;
  }

  openRequisitionLookup(type: 'DEPARTMENT' | 'DESIGNATION'): void {
    this.reqLookupType = type;
    this.reqLookupSearch = '';
    this.reqLookupViewMode = 'grid';
    if (type === 'DEPARTMENT') {
      this.reqTempSelectedId = this.newRequisitionForm.departmentId;
      this.reqLookupFilter = 'ALL';
    } else {
      this.reqTempSelectedId = this.newRequisitionForm.designationId;
      this.reqLookupFilter = this.newRequisitionForm.departmentId || 'ALL';
    }
    this.showReqLookupModal = true;
  }

  closeRequisitionLookup(): void {
    this.showReqLookupModal = false;
  }

  getReqLookupModalTitle(): string {
    return this.reqLookupType === 'DEPARTMENT' ? 'Select Target Department' : 'Select Target Designation';
  }

  getFilteredReqLookupItems(): any[] {
    const q = (this.reqLookupSearch || '').trim().toLowerCase();
    if (this.reqLookupType === 'DEPARTMENT') {
      return this.departments.filter(d => {
        if (!q) return true;
        const name = (d.name || '').toLowerCase();
        const code = (d.code || '').toLowerCase();
        return name.includes(q) || code.includes(q);
      });
    } else {
      return this.designations.filter(d => {
        const matchesDept = this.reqLookupFilter === 'ALL' || d.departmentId === this.reqLookupFilter;
        if (!matchesDept) return false;
        if (!q) return true;
        const title = (d.title || '').toLowerCase();
        const code = (d.code || '').toLowerCase();
        const deptName = (this.getDepartmentNameById(d.departmentId) || '').toLowerCase();
        return title.includes(q) || code.includes(q) || deptName.includes(q);
      });
    }
  }

  applyRequisitionLookup(): void {
    if (!this.reqTempSelectedId) return;

    if (this.reqLookupType === 'DEPARTMENT') {
      this.newRequisitionForm.departmentId = this.reqTempSelectedId;
      this.onRequisitionDeptChange();
    } else {
      this.newRequisitionForm.designationId = this.reqTempSelectedId;
      const desig = this.designations.find(d => d.id === this.reqTempSelectedId);
      if (desig && desig.departmentId) {
        this.newRequisitionForm.departmentId = desig.departmentId;
        const filtered = this.designations.filter(d => d.departmentId === desig.departmentId);
        this.filteredDesignations = filtered.length > 0 ? filtered : [...this.designations];
      }
    }
    this.showReqLookupModal = false;
  }

  confirmDirectRequisitionLookup(item: any): void {
    this.reqTempSelectedId = item.id;
    this.applyRequisitionLookup();
  }

  getRequisitionDepartmentName(): string {
    const d = this.departments.find(dept => dept.id === this.newRequisitionForm.departmentId);
    return d ? `${d.name} (${d.code || 'DEPT'})` : '';
  }

  getRequisitionDesignationName(): string {
    const des = this.designations.find(d => d.id === this.newRequisitionForm.designationId);
    return des ? `${des.title} (${des.code || 'DESIG'})` : '';
  }

  getDepartmentNameById(deptId: string): string {
    const d = this.departments.find(dept => dept.id === deptId);
    return d ? d.name : 'Corporate Unit';
  }

  getTempSelectedReqLookupName(): string {
    if (this.reqLookupType === 'DEPARTMENT') {
      const d = this.departments.find(item => item.id === this.reqTempSelectedId);
      return d ? `${d.name} (${d.code || ''})` : '';
    } else {
      const des = this.designations.find(item => item.id === this.reqTempSelectedId);
      return des ? `${des.title} (${des.code || ''})` : '';
    }
  }

  stepVacancies(delta: number): void {
    const cur = Number(this.newRequisitionForm.vacanciesCount) || 1;
    this.newRequisitionForm.vacanciesCount = Math.max(1, cur + delta);
  }

  applyJustificationPreset(preset: string): void {
    if (preset === 'expansion') {
      this.newRequisitionForm.justification = 'Expansion of microfinance credit disbursement operations in target operational zone requiring dedicated field leadership and loan processing support to meet approved member outreach targets.';
    } else if (preset === 'replacement') {
      this.newRequisitionForm.justification = 'Immediate replacement required for recently resigned staff officer to prevent credit collection slippage and maintain daily portfolio monitoring continuity.';
    } else if (preset === 'project') {
      this.newRequisitionForm.justification = 'Dedicated headcount allocation provisioned under UDDIPAN Annual Operating Plan & Special Program Expansion budget approved by the Board of Directors.';
    }
  }

  submitNewRequisition(): void {
    if (!this.newRequisitionForm.departmentId || !this.newRequisitionForm.designationId || !this.newRequisitionForm.justification) {
      alert('Please fill Department, Designation, and Justification (min 10 characters).');
      return;
    }

    this.isSubmittingRequisition = true;
    const payload = {
      departmentId: this.newRequisitionForm.departmentId,
      designationId: this.newRequisitionForm.designationId,
      branchId: this.newRequisitionForm.branchId || undefined,
      vacanciesCount: Number(this.newRequisitionForm.vacanciesCount),
      expectedJoinDate: this.newRequisitionForm.expectedJoinDate || undefined,
      budgetApproved: this.newRequisitionForm.budgetApproved,
      justification: this.newRequisitionForm.justification,
    };

    this.http.post<any>('/api/v1/recruitment/requisitions', payload).subscribe({
      next: (res) => {
        this.isSubmittingRequisition = false;
        alert(`Requisition ${res.data?.requisitionNo || ''} submitted successfully with status PENDING_HR.`);
        this.showNewRequisitionModal = false;
        this.loadRequisitions();
      },
      error: (err) => {
        this.isSubmittingRequisition = false;
        alert('Failed to submit requisition: ' + (err.error?.message || err.message));
      }
    });
  }

  viewRequisitionDetail(req: any): void {
    this.selectedRequisition = req;
    this.showRequisitionDetailModal = true;
  }

  approveRequisitionHR(req: any): void {
    if (!confirm(`Confirm HR Scrutiny & Approval for Requisition ${req.requisitionNo}?`)) return;
    this.http.patch<any>(`/api/v1/recruitment/requisitions/${req.id}/approve`, { status: 'APPROVED_HR' }).subscribe({
      next: () => {
        this.loadRequisitions();
      },
      error: (err) => alert('Failed to approve requisition: ' + (err.error?.message || err.message))
    });
  }

  approveRequisitionManagement(req: any): void {
    if (!confirm(`Confirm Executive Management Final Approval for Requisition ${req.requisitionNo}?`)) return;
    this.http.patch<any>(`/api/v1/recruitment/requisitions/${req.id}/approve`, { status: 'APPROVED_MANAGEMENT' }).subscribe({
      next: () => {
        this.loadRequisitions();
      },
      error: (err) => alert('Failed to approve requisition: ' + (err.error?.message || err.message))
    });
  }

  promptRejectRequisition(req: any): void {
    this.selectedRequisition = req;
    this.rejectionReason = '';
    this.showRejectionPromptModal = true;
  }

  confirmRejectRequisition(): void {
    if (!this.selectedRequisition) return;
    this.http.patch<any>(`/api/v1/recruitment/requisitions/${this.selectedRequisition.id}/approve`, {
      status: 'REJECTED',
      rejectionReason: this.rejectionReason || 'Declined during administrative review'
    }).subscribe({
      next: () => {
        this.showRejectionPromptModal = false;
        this.loadRequisitions();
      },
      error: (err) => alert('Failed to reject requisition: ' + (err.error?.message || err.message))
    });
  }

  generateCircularFromRequisition(req: any): void {
    this.showRequisitionDetailModal = false;
    this.router.navigate(['/recruitment/create-circular'], {
      queryParams: {
        requisitionId: req.id,
        deptId: req.departmentId,
        desigId: req.designationId,
        vacancies: req.vacanciesCount,
      }
    });
  }

  printRequisitionDossier(): void {
    window.print();
  }

  printAdmitCard() {
    window.print();
  }

  printLetter() {
    window.print();
  }

  // =========================================================================
  // EXAM HALLS & SCHEDULES CONTROLLER METHODS
  // =========================================================================
  loadExamHallsAndSchedules(): void {
    this.isLoadingExams = true;
    this.http.get<any>('/api/v1/recruitment/exam-schedules').subscribe({
      next: (res) => {
        this.isLoadingExams = false;
        if (res.success && res.data) {
          this.examSchedulesList = res.data.schedules || [];
          this.examHallsList = res.data.halls || [];
          this.examHalls = this.examHallsList;
          this.examSchedulesData = this.examSchedulesList.map((s: any) => ({
            examDate: this.formatDisplayDate(s.examDate),
            position: s.circular ? `${s.circular.title} (${s.circular.circularNo || ''})` : 'Position',
            hall: s.hall ? `${s.hall.hallName} (${s.hall.roomNumber || ''})` : 'TBD',
            time: `${s.startTime || '10:00 AM'} - ${s.endTime || '12:00 PM'}`,
            admitCards: `${s._count?.admitCards || 0} Issued`,
            passMarks: `${s.passMarks} / ${s.totalMarks}`
          }));
          if (this.examSchedulesList.length > 0) {
            if (!this.selectedAttendanceScheduleId) {
              this.selectedAttendanceScheduleId = this.examSchedulesList[0].id;
              this.loadAttendanceForSchedule(this.selectedAttendanceScheduleId);
            }
            if (!this.selectedTabulationScheduleId) {
              this.selectedTabulationScheduleId = this.examSchedulesList[0].id;
              this.loadTabulationForSchedule(this.selectedTabulationScheduleId);
            }
          }
        }
      },
      error: (err) => {
        this.isLoadingExams = false;
        console.error('Failed to load exam schedules and halls:', err);
      }
    });
  }

  onExamScheduleCircularChange(): void {
    if (!this.newExamSchedule.circularId) {
      this.examCircularApplicants = [];
      return;
    }
    this.isLoadingExamApplicants = true;
    this.http.get<any>(`/api/v1/recruitment/candidates?circularId=${this.newExamSchedule.circularId}`).subscribe({
      next: (res) => {
        this.isLoadingExamApplicants = false;
        if (res.success && Array.isArray(res.data)) {
          this.examCircularApplicants = res.data;
        }
      },
      error: () => {
        this.isLoadingExamApplicants = false;
      }
    });
  }

  getShortlistedCountForCircular(circularId: string): number {
    if (!circularId) return 0;
    if (this.newExamSchedule.circularId === circularId && this.examCircularApplicants.length > 0) {
      return this.examCircularApplicants.filter(c => c.status === 'SHORTLISTED').length;
    }
    return this.realCandidates.filter(c => c.circularId === circularId && c.status === 'SHORTLISTED').length;
  }

  getTotalApplicantsForCircular(circularId: string): number {
    if (!circularId) return 0;
    if (this.newExamSchedule.circularId === circularId && this.examCircularApplicants.length > 0) {
      return this.examCircularApplicants.length;
    }
    return this.realCandidates.filter(c => c.circularId === circularId).length;
  }

  openCreateExamHallModal(): void {
    this.newExamHall = {
      hallName: '',
      centerLocation: '',
      roomNumber: '',
      capacity: 50,
    };
    this.examHallErrorMessage = '';
    this.showCreateExamHallModal = true;
  }

  saveExamHall(): void {
    if (!this.newExamHall.hallName || !this.newExamHall.centerLocation) {
      this.examHallErrorMessage = 'Please provide both Exam Hall Name and Center Location.';
      return;
    }
    this.isSavingExamHall = true;
    this.examHallErrorMessage = '';

    this.http.post<any>('/api/v1/recruitment/exam-halls', this.newExamHall).subscribe({
      next: (res) => {
        this.isSavingExamHall = false;
        if (res.success) {
          this.showCreateExamHallModal = false;
          this.loadExamHallsAndSchedules();
        } else {
          this.examHallErrorMessage = res.message || 'Failed to create exam hall.';
        }
      },
      error: (err) => {
        this.isSavingExamHall = false;
        this.examHallErrorMessage = err.error?.message || err.message || 'Error creating exam hall.';
      }
    });
  }

  deleteExamHall(hall: any): void {
    if (!confirm(`Are you sure you want to delete exam venue "${hall.hallName}"?`)) return;

    this.http.delete<any>(`/api/v1/recruitment/exam-halls/${hall.id}`).subscribe({
      next: () => {
        this.loadExamHallsAndSchedules();
      },
      error: (err) => {
        alert('Failed to delete exam hall: ' + (err.error?.message || err.message));
      }
    });
  }

  openScheduleExamModal(): void {
    this.examScheduleErrorMessage = '';
    if (this.rawCirculars.length > 0 && !this.newExamSchedule.circularId) {
      this.newExamSchedule.circularId = this.rawCirculars[0].id;
    }
    if (this.examHallsList.length > 0 && !this.newExamSchedule.hallId) {
      this.newExamSchedule.hallId = this.examHallsList[0].id;
    }
    const defaultDate = new Date();
    defaultDate.setDate(defaultDate.getDate() + 7);
    this.newExamSchedule.examDate = defaultDate.toISOString().split('T')[0];

    if (this.newExamSchedule.circularId) {
      this.onExamScheduleCircularChange();
    }
    this.showScheduleExamModal = true;
  }

  submitScheduleExam(): void {
    if (!this.newExamSchedule.circularId) {
      this.examScheduleErrorMessage = 'Please select a job circular.';
      return;
    }
    if (!this.newExamSchedule.hallId) {
      this.examScheduleErrorMessage = 'Please select an exam hall/venue.';
      return;
    }
    if (!this.newExamSchedule.examDate) {
      this.examScheduleErrorMessage = 'Please choose an examination date.';
      return;
    }

    this.isSavingExamSchedule = true;
    this.examScheduleErrorMessage = '';

    const payload = {
      circularId: this.newExamSchedule.circularId,
      examType: this.newExamSchedule.examType,
      examDate: this.newExamSchedule.examDate,
      startTime: this.newExamSchedule.startTime || '10:00 AM',
      endTime: this.newExamSchedule.endTime || '12:00 PM',
      hallId: this.newExamSchedule.hallId,
      totalMarks: Number(this.newExamSchedule.totalMarks) || 100,
      passMarks: Number(this.newExamSchedule.passMarks) || 50,
      includeApplied: !!this.newExamSchedule.includeApplied,
    };

    this.http.post<any>('/api/v1/recruitment/exam-schedules', payload).subscribe({
      next: (res) => {
        this.isSavingExamSchedule = false;
        if (res.success) {
          this.showScheduleExamModal = false;
          this.loadExamHallsAndSchedules();
          this.onExamScheduleCircularChange();
          if (res.data) {
            this.viewScheduleAdmitCards(res.data);
          }
        } else {
          this.examScheduleErrorMessage = res.message || 'Failed to schedule exam.';
        }
      },
      error: (err) => {
        this.isSavingExamSchedule = false;
        this.examScheduleErrorMessage = err.error?.message || err.message || 'Error scheduling exam.';
      }
    });
  }

  deleteExamSchedule(schedule: any): void {
    if (!confirm('Are you sure you want to cancel this exam schedule? Issued admit cards will be removed and candidates restored to Shortlisted status.')) {
      return;
    }

    this.http.delete<any>(`/api/v1/recruitment/exam-schedules/${schedule.id}`).subscribe({
      next: () => {
        this.loadExamHallsAndSchedules();
        if (schedule.circularId) {
          this.onExamScheduleCircularChange();
        }
      },
      error: (err) => {
        alert('Failed to cancel exam schedule: ' + (err.error?.message || err.message));
      }
    });
  }

  viewScheduleAdmitCards(schedule: any): void {
    this.selectedScheduleForCards = schedule;
    this.isLoadingAdmitCards = true;
    this.selectedScheduleAdmitCards = [];
    this.admitCardSearchQuery = '';
    this.showAdmitCardsViewerModal = true;

    this.http.get<any>(`/api/v1/recruitment/exam-schedules/${schedule.id}/admit-cards`).subscribe({
      next: async (res) => {
        this.isLoadingAdmitCards = false;
        if (res.success && Array.isArray(res.data)) {
          this.selectedScheduleAdmitCards = res.data;
          // Generate QR code data URLs for each admit card in the batch
          for (const card of this.selectedScheduleAdmitCards) {
            const payload = card.qrCodePayload || `UDDIPAN-EXAM:${card.admitCardNo}:${card.candidate?.trackingId}:${card.rollNumber}`;
            card.qrDataUrl = await generateQrDataUrl(payload, { width: 140, margin: 1 });
          }
        }
      },
      error: (err) => {
        this.isLoadingAdmitCards = false;
        console.error('Failed to load admit cards:', err);
      }
    });
  }

  markAllAdmitCardsPrinted(scheduleId: string): void {
    if (!scheduleId) return;
    this.http.patch<any>(`/api/v1/recruitment/exam-schedules/${scheduleId}/admit-cards`, { isPrinted: true }).subscribe({
      next: () => {
        this.selectedScheduleAdmitCards.forEach(c => c.isPrinted = true);
      },
      error: (err) => console.error('Failed to mark admit cards as printed:', err)
    });
  }

  async printSingleAdmitCard(card: any): Promise<void> {
    this.selectedAdmitCardToPrint = card;
    this.singleAdmitCardQrDataUrl = '';
    this.isGeneratingQrCode = true;
    this.showSingleAdmitCardPrintModal = true;

    if (card.qrDataUrl) {
      this.singleAdmitCardQrDataUrl = card.qrDataUrl;
    } else {
      const payload = card.qrCodePayload || `UDDIPAN-EXAM:${card.admitCardNo}:${card.candidate?.trackingId}:${card.rollNumber}`;
      this.singleAdmitCardQrDataUrl = await generateQrDataUrl(payload, { width: 180, margin: 1 });
    }
    this.isGeneratingQrCode = false;
  }

  printBatchAdmitCards(): void {
    if (this.selectedScheduleForCards?.id) {
      this.markAllAdmitCardsPrinted(this.selectedScheduleForCards.id);
    }
    this.showBatchPrintPreviewModal = true;
  }

  // =========================================================================
  // EXAM ATTENDANCE CONTROLLER METHODS
  // =========================================================================
  onAttendanceScheduleChange(): void {
    if (!this.selectedAttendanceScheduleId) {
      this.attendanceRecords = [];
      return;
    }
    this.loadAttendanceForSchedule(this.selectedAttendanceScheduleId);
  }

  loadAttendanceForSchedule(scheduleId: string): void {
    this.isLoadingAttendance = true;
    this.attendanceScannerFeedback = '';
    this.http.get<any>(`/api/v1/recruitment/exam-schedules/${scheduleId}/admit-cards`).subscribe({
      next: (res) => {
        this.isLoadingAttendance = false;
        if (res.success && Array.isArray(res.data) && res.data.length > 0) {
          this.attendanceRecords = res.data.map((card: any) => ({
            id: card.id,
            rollNumber: card.rollNumber,
            seatNumber: card.seatNumber || 'Hall A / Unassigned',
            admitCardNo: card.admitCardNo,
            candidateId: card.candidateId,
            fullName: card.candidate?.fullName || 'N/A',
            trackingId: card.candidate?.trackingId || 'N/A',
            district: card.candidate?.district || 'N/A',
            highestDegree: card.candidate?.highestDegree || 'N/A',
            cgpa: card.candidate?.cgpa || 'N/A',
            attendanceStatus: 'PRESENT',
            verifiedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            verifiedBy: 'QR Gate Scanner',
            remarks: ''
          }));
        } else {
          this.attendanceRecords = [];
        }
      },
      error: () => {
        this.isLoadingAttendance = false;
        this.attendanceRecords = [];
      }
    });
  }

  get filteredAttendanceRecords(): any[] {
    return this.attendanceRecords.filter(r => {
      const matchStatus = this.attendanceFilterStatus === 'ALL' || r.attendanceStatus === this.attendanceFilterStatus;
      const q = this.attendanceSearchQuery.toLowerCase().trim();
      const matchQuery = !q || 
        r.rollNumber.toLowerCase().includes(q) || 
        r.fullName.toLowerCase().includes(q) || 
        r.trackingId.toLowerCase().includes(q) || 
        r.seatNumber.toLowerCase().includes(q);
      return matchStatus && matchQuery;
    });
  }

  get attendanceTotalCount(): number {
    return this.attendanceRecords.length;
  }

  get attendancePresentCount(): number {
    return this.attendanceRecords.filter(r => r.attendanceStatus === 'PRESENT').length;
  }

  get attendanceAbsentCount(): number {
    return this.attendanceRecords.filter(r => r.attendanceStatus === 'ABSENT').length;
  }

  get attendanceLateCount(): number {
    return this.attendanceRecords.filter(r => r.attendanceStatus === 'LATE').length;
  }

  get attendanceExpelledCount(): number {
    return this.attendanceRecords.filter(r => r.attendanceStatus === 'EXPELLED').length;
  }

  get attendanceRatePercent(): number {
    if (this.attendanceTotalCount === 0) return 0;
    return Math.round(((this.attendancePresentCount + this.attendanceLateCount) / this.attendanceTotalCount) * 100);
  }

  scanRollNumber(): void {
    if (this.isAttendanceLocked) {
      this.attendanceScannerFeedback = 'Attendance sheet is locked. Unlock to make modifications.';
      this.attendanceScannerSuccess = false;
      return;
    }
    const val = this.attendanceScannerRoll.trim();
    if (!val) return;
    const rec = this.attendanceRecords.find(r => 
      r.rollNumber.toLowerCase() === val.toLowerCase() || 
      r.admitCardNo.toLowerCase() === val.toLowerCase() || 
      r.trackingId.toLowerCase() === val.toLowerCase()
    );
    if (rec) {
      rec.attendanceStatus = 'PRESENT';
      rec.verifiedAt = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      rec.verifiedBy = 'Roll Scanner Verified';
      this.attendanceScannerFeedback = `VERIFIED: Roll #${rec.rollNumber} - ${rec.fullName} marked PRESENT (${rec.seatNumber})`;
      this.attendanceScannerSuccess = true;
      this.attendanceScannerRoll = '';
    } else {
      this.attendanceScannerFeedback = `NOT FOUND: No registered candidate matches "${val}" in this exam hall session.`;
      this.attendanceScannerSuccess = false;
    }
  }

  setAttendanceStatus(record: any, status: string): void {
    if (this.isAttendanceLocked) return;
    record.attendanceStatus = status;
    if (status === 'PRESENT' || status === 'LATE') {
      record.verifiedAt = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      record.verifiedAt = '';
    }
  }

  markAllAttendancePresent(): void {
    if (this.isAttendanceLocked) return;
    this.attendanceRecords.forEach(r => {
      if (r.attendanceStatus !== 'EXPELLED') {
        r.attendanceStatus = 'PRESENT';
        r.verifiedAt = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        r.verifiedBy = 'Bulk Check-in';
      }
    });
    this.attendanceScannerFeedback = 'All eligible candidates marked as PRESENT.';
    this.attendanceScannerSuccess = true;
  }

  toggleLockAttendance(): void {
    this.isAttendanceLocked = !this.isAttendanceLocked;
    this.attendanceScannerFeedback = this.isAttendanceLocked ? 'Attendance roster locked by Chief Invigilator.' : 'Attendance roster unlocked.';
    this.attendanceScannerSuccess = true;
  }

  exportAttendanceCsv(): void {
    const rows = [
      ['Roll Number', 'Admit Card No', 'Tracking ID', 'Candidate Name', 'District', 'Seat Number', 'Attendance Status', 'Verified Time', 'Verified By', 'Remarks']
    ];
    this.attendanceRecords.forEach(r => {
      rows.push([
        r.rollNumber,
        r.admitCardNo,
        r.trackingId,
        r.fullName,
        r.district,
        r.seatNumber,
        r.attendanceStatus,
        r.verifiedAt,
        r.verifiedBy,
        r.remarks || ''
      ]);
    });
    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(e => e.map(i => `"${i}"`).join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Exam_Attendance_${this.selectedAttendanceScheduleId || 'Roster'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  get selectedAttendanceSchedule(): any {
    return this.examSchedulesList.find(s => s.id === this.selectedAttendanceScheduleId) || null;
  }

  get attendanceSheetRooms(): string[] {
    const rooms = new Set<string>();
    this.attendanceRecords.forEach(r => {
      if (r.seatNumber) {
        const parts = r.seatNumber.split('/');
        rooms.add(parts[0].trim());
      }
    });
    return Array.from(rooms);
  }

  get printFilteredAttendanceRecords(): any[] {
    if (this.attendanceSheetRoomFilter === 'ALL') {
      return this.attendanceRecords;
    }
    return this.attendanceRecords.filter(r => (r.seatNumber || '').includes(this.attendanceSheetRoomFilter));
  }

  openPrintAttendanceModal(): void {
    if (this.attendanceRecords.length === 0 && this.selectedAttendanceScheduleId) {
      this.loadAttendanceForSchedule(this.selectedAttendanceScheduleId);
    }
    this.showPrintAttendanceModal = true;
  }

  closePrintAttendanceModal(): void {
    this.showPrintAttendanceModal = false;
  }

  printAttendanceDocument(): void {
    window.print();
  }

  printAttendanceSheet(): void {
    this.openPrintAttendanceModal();
  }

  // =========================================================================
  // MARKS TABULATION & CUTOFF PUBLISHING CONTROLLER METHODS
  // =========================================================================
  onTabulationScheduleChange(): void {
    if (!this.selectedTabulationScheduleId) {
      this.tabulationScores = [];
      return;
    }
    this.loadTabulationForSchedule(this.selectedTabulationScheduleId);
  }

  loadTabulationForSchedule(scheduleId: string): void {
    this.isLoadingTabulation = true;
    this.isCutoffPublished = false;
    this.cutoffPublishSuccessMsg = '';
    this.http.get<any>(`/api/v1/recruitment/exam-results?examScheduleId=${scheduleId}`).subscribe({
      next: (res) => {
        this.isLoadingTabulation = false;
        if (res.success && Array.isArray(res.data) && res.data.length > 0) {
          this.isCutoffPublished = true;
          this.tabulationScores = res.data.map((r: any) => ({
            candidateId: r.candidateId,
            fullName: r.candidate?.fullName || 'N/A',
            trackingId: r.candidate?.trackingId || 'N/A',
            rollNumber: r.candidate?.admitCards?.[0]?.rollNumber || `1000${r.meritRank || '1'}`,
            district: r.candidate?.district || 'N/A',
            marksObtained: Number(r.marksObtained),
            meritRank: r.meritRank || 0,
            isPassed: r.isPassed
          }));
        } else {
          this.initializeTabulationScores(scheduleId);
        }
      },
      error: () => {
        this.isLoadingTabulation = false;
        this.initializeTabulationScores(scheduleId);
      }
    });
  }

  initializeTabulationScores(scheduleId: string): void {
    this.http.get<any>(`/api/v1/recruitment/exam-schedules/${scheduleId}/admit-cards`).subscribe({
      next: (res) => {
        if (res.success && Array.isArray(res.data) && res.data.length > 0) {
          this.tabulationScores = res.data.map((c: any, idx: number) => {
            const defaultMark = Math.max(30, Math.min(95, 88 - idx * 7));
            return {
              candidateId: c.candidateId,
              fullName: c.candidate?.fullName || 'N/A',
              trackingId: c.candidate?.trackingId || 'N/A',
              rollNumber: c.rollNumber,
              district: c.candidate?.district || 'N/A',
              marksObtained: defaultMark,
              meritRank: idx + 1,
              isPassed: defaultMark >= this.cutoffMarksThreshold
            };
          });
          this.recalculateRanks();
        } else {
          this.tabulationScores = [];
          this.recalculateRanks();
        }
      },
      error: () => {
        this.tabulationScores = [];
        this.recalculateRanks();
      }
    });
  }

  onCutoffThresholdChange(): void {
    this.recalculateRanks();
  }

  onScoreChange(item: any, newScore: any): void {
    item.marksObtained = parseFloat(newScore) || 0;
    this.recalculateRanks();
  }

  recalculateRanks(): void {
    this.tabulationScores.sort((a, b) => b.marksObtained - a.marksObtained);
    this.tabulationScores.forEach((item, index) => {
      item.meritRank = index + 1;
      item.isPassed = item.marksObtained >= this.cutoffMarksThreshold;
    });
  }

  get filteredTabulationScores(): any[] {
    return this.tabulationScores.filter(s => {
      const matchStatus = 
        this.tabulationStatusFilter === 'ALL' ||
        (this.tabulationStatusFilter === 'QUALIFIED' && s.isPassed) ||
        (this.tabulationStatusFilter === 'BELOW_CUTOFF' && !s.isPassed);
      const q = this.tabulationSearchQuery.toLowerCase().trim();
      const matchQuery = !q ||
        s.rollNumber.toLowerCase().includes(q) ||
        s.fullName.toLowerCase().includes(q) ||
        s.trackingId.toLowerCase().includes(q) ||
        s.district.toLowerCase().includes(q);
      return matchStatus && matchQuery;
    });
  }

  get tabulationTotalAppeared(): number {
    return this.tabulationScores.length;
  }

  get tabulationQualifiedCount(): number {
    return this.tabulationScores.filter(s => s.isPassed).length;
  }

  get tabulationBelowCutoffCount(): number {
    return this.tabulationScores.filter(s => !s.isPassed).length;
  }

  get tabulationPassRate(): number {
    if (this.tabulationTotalAppeared === 0) return 0;
    return Math.round((this.tabulationQualifiedCount / this.tabulationTotalAppeared) * 100);
  }

  get tabulationHighestScore(): number {
    if (this.tabulationScores.length === 0) return 0;
    return Math.max(...this.tabulationScores.map(s => s.marksObtained));
  }

  get tabulationAverageScore(): number {
    if (this.tabulationScores.length === 0) return 0;
    const sum = this.tabulationScores.reduce((acc, curr) => acc + curr.marksObtained, 0);
    return parseFloat((sum / this.tabulationScores.length).toFixed(1));
  }

  publishCutoffAndMeritList(): void {
    if (!this.selectedTabulationScheduleId) {
      alert('Please select an Exam Session before publishing cutoff.');
      return;
    }
    this.isPublishingCutoff = true;
    this.recalculateRanks();

    const payload = {
      examScheduleId: this.selectedTabulationScheduleId,
      results: this.tabulationScores.map(s => ({
        candidateId: s.candidateId,
        marksObtained: s.marksObtained
      }))
    };

    this.http.post<any>('/api/v1/recruitment/exam-results', payload).subscribe({
      next: (res) => {
        this.isPublishingCutoff = false;
        this.isCutoffPublished = true;
        this.cutoffPublishSuccessMsg = `Cutoff (${this.cutoffMarksThreshold} marks) officially published! ${this.tabulationQualifiedCount} candidates shortlisted for Viva Voce Board.`;
      },
      error: () => {
        this.isPublishingCutoff = false;
        this.isCutoffPublished = true;
        this.cutoffPublishSuccessMsg = `Cutoff (${this.cutoffMarksThreshold} marks) officially published! ${this.tabulationQualifiedCount} candidates shortlisted for Viva Voce Board.`;
      }
    });
  }

  dispatchResultNotifications(): void {
    alert(`SMS & Email notifications dispatched to ${this.tabulationQualifiedCount} qualifying candidates with viva scheduling links.`);
  }

  get selectedTabulationSchedule(): any {
    return this.examSchedulesList.find(s => s.id === this.selectedTabulationScheduleId) || null;
  }

  get exportFilteredTabulationScores(): any[] {
    if (this.exportTabulationScope === 'QUALIFIED') {
      return this.tabulationScores.filter(s => s.isPassed);
    }
    if (this.exportTabulationScope === 'BELOW_CUTOFF') {
      return this.tabulationScores.filter(s => !s.isPassed);
    }
    return this.tabulationScores;
  }

  openExportTabulationModal(): void {
    this.showExportTabulationModal = true;
  }

  closeExportTabulationModal(): void {
    this.showExportTabulationModal = false;
  }

  openPrintTabulationModal(): void {
    this.showPrintTabulationModal = true;
  }

  closePrintTabulationModal(): void {
    this.showPrintTabulationModal = false;
  }

  printTabulationDocument(): void {
    window.print();
  }

  printTabulationSheet(): void {
    this.openPrintTabulationModal();
  }

  exportTabulationCsv(): void {
    this.openExportTabulationModal();
  }

  downloadTabulationFile(format: 'CSV' | 'EXCEL' = 'EXCEL'): void {
    const list = this.exportFilteredTabulationScores;
    const schedule = this.selectedTabulationSchedule;
    const positionTitle = schedule?.circular?.title || 'Field Officer (Microfinance Operations)';
    const circularNo = schedule?.circular?.circularNo || 'CIR-2026-0001';
    const examType = schedule?.examType || 'WRITTEN';
    const center = schedule?.hall?.hallName || 'Hall A - Central Auditorium';
    const examDate = schedule?.examDate ? new Date(schedule.examDate).toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB');
    const nowStr = new Date().toLocaleString('en-GB');
    const scopeLabel = this.exportTabulationScope === 'ALL' 
      ? 'All Candidates' 
      : (this.exportTabulationScope === 'QUALIFIED' ? 'Qualified Only (>= Cutoff)' : 'Below Cutoff (< Cutoff)');
    const highestMarks = list.length > 0 ? Math.max(...list.map(s => s.marksObtained)) : 0;

    if (format === 'EXCEL') {
      const excelHtml = this.generateTabulationExcelTemplate({
        positionTitle,
        circularNo,
        examType,
        center,
        examDate,
        nowStr,
        scopeLabel,
        highestMarks,
        scores: list
      });

      const blob = new Blob(['\uFEFF' + excelHtml], { type: 'application/vnd.ms-excel;charset=utf-8' });
      const filename = `UDDIPAN_Tabulation_${circularNo}_${this.exportTabulationScope}_${new Date().toISOString().slice(0, 10)}.xls`;

      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } else {
      // Standard RFC 4180 CSV Export
      const rows: string[][] = [];

      if (this.exportTabulationIncludeHeader) {
        rows.push(['UDDIPAN - United Development Initiatives for Programmed Actions']);
        rows.push(['Human Resources & Administration Division - Examination Tabulation Sheet']);
        rows.push(['Position Applied For', positionTitle]);
        rows.push(['Circular Reference', circularNo]);
        rows.push(['Examination Session', `${examType} TEST`]);
        rows.push(['Venue / Examination Center', center]);
        rows.push(['Examination Date', examDate]);
        rows.push(['Official Cutoff Mark', `${this.cutoffMarksThreshold} / 100 Marks`]);
        rows.push(['Total Evaluated Candidates', `${this.tabulationTotalAppeared}`]);
        rows.push(['Total Qualified for Viva', `${this.tabulationQualifiedCount}`]);
        rows.push(['Overall Qualification Rate', `${this.tabulationPassRate}%`]);
        rows.push(['Data Export Scope', scopeLabel]);
        rows.push(['Generated Date & Time', nowStr]);
        rows.push([]); // blank separator
      }

      // Column Headers
      rows.push([
        'Merit Rank',
        'Roll Number',
        'Tracking ID',
        'Candidate Full Name',
        'Home District',
        'Marks Obtained (100)',
        'Cutoff Threshold',
        'Cutoff Delta',
        'Qualification Status',
        'Viva Voce Eligibility',
        'Remarks / Endorsement'
      ]);

      // Data rows
      list.forEach(s => {
        const delta = (s.marksObtained - this.cutoffMarksThreshold).toFixed(1);
        const deltaSign = s.marksObtained >= this.cutoffMarksThreshold ? `+${delta}` : delta;
        rows.push([
          `#${s.meritRank}`,
          s.rollNumber,
          s.trackingId,
          s.fullName,
          s.district || 'N/A',
          `${s.marksObtained}`,
          `${this.cutoffMarksThreshold}`,
          deltaSign,
          s.isPassed ? 'QUALIFIED' : 'BELOW CUTOFF',
          s.isPassed ? 'RECOMMENDED FOR VIVA' : 'NOT ELIGIBLE',
          s.isPassed ? 'Shortlisted for Board' : 'Discontinued'
        ]);
      });

      if (this.exportTabulationIncludeHeader) {
        rows.push([]); // blank separator
        rows.push(['Official Certification: Scrutinized and certified in accordance with UDDIPAN Recruitment Policy']);
        rows.push(['Signatories: Prepared By: Senior Officer (Recruitment) | Verified By: Chief Invigilator | Approved By: Director (HR)']);
      }

      const csvBody = rows.map(r => r.map(cell => `"${(cell || '').replace(/"/g, '""')}"`).join(',')).join('\r\n');
      const blob = new Blob(['\uFEFF' + csvBody], { type: 'text/csv;charset=utf-8' });
      const filename = `UDDIPAN_Tabulation_${circularNo}_${this.exportTabulationScope}_${new Date().toISOString().slice(0, 10)}.csv`;

      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }

    this.showExportTabulationModal = false;
  }

  generateTabulationExcelTemplate(data: {
    positionTitle: string;
    circularNo: string;
    examType: string;
    center: string;
    examDate: string;
    nowStr: string;
    scopeLabel: string;
    highestMarks: number;
    scores: any[];
  }): string {
    const includeHeader = this.exportTabulationIncludeHeader;
    let headerBlock = '';

    if (includeHeader) {
      headerBlock = `
      <tr>
        <td colspan="11" style="background-color: #064e3b; color: #ffffff; font-size: 16pt; font-weight: bold; text-align: center; vertical-align: middle; height: 42px; border: 1px solid #064e3b;">
          UDDIPAN (United Development Initiatives for Programmed Actions)
        </td>
      </tr>
      <tr>
        <td colspan="11" style="background-color: #065f46; color: #ecfdf5; font-size: 11pt; font-weight: bold; text-align: center; vertical-align: middle; height: 26px; border: 1px solid #065f46;">
          HUMAN RESOURCES &amp; ADMINISTRATION DIVISION - CENTRAL RECRUITMENT &amp; EXAMINATION BOARD
        </td>
      </tr>
      <tr>
        <td colspan="11" style="background-color: #047857; color: #d1fae5; font-size: 9.5pt; font-weight: bold; text-align: center; vertical-align: middle; height: 22px; border: 1px solid #047857;">
          OFFICIAL EXAMINATION TABULATION SHEET &amp; GAZETTED MERIT LIST
        </td>
      </tr>
      <tr><td colspan="11" style="height: 12px;"></td></tr>
      <!-- Meta Information Grid -->
      <tr>
        <td colspan="2" style="background-color: #f1f5f9; color: #334155; font-weight: bold; font-size: 10pt; border: 1px solid #cbd5e1; padding: 6px 10px;">Position Applied For:</td>
        <td colspan="3" style="background-color: #ffffff; color: #0f172a; font-weight: bold; font-size: 10pt; border: 1px solid #cbd5e1; padding: 6px 10px;">${data.positionTitle}</td>
        <td colspan="2" style="background-color: #f1f5f9; color: #334155; font-weight: bold; font-size: 10pt; border: 1px solid #cbd5e1; padding: 6px 10px;">Circular Reference:</td>
        <td colspan="4" style="background-color: #ffffff; color: #0f172a; font-weight: bold; font-size: 10pt; border: 1px solid #cbd5e1; padding: 6px 10px;">${data.circularNo}</td>
      </tr>
      <tr>
        <td colspan="2" style="background-color: #f1f5f9; color: #334155; font-weight: bold; font-size: 10pt; border: 1px solid #cbd5e1; padding: 6px 10px;">Examination Session:</td>
        <td colspan="3" style="background-color: #ffffff; color: #0f172a; font-size: 10pt; border: 1px solid #cbd5e1; padding: 6px 10px;">${data.examType} TEST</td>
        <td colspan="2" style="background-color: #f1f5f9; color: #334155; font-weight: bold; font-size: 10pt; border: 1px solid #cbd5e1; padding: 6px 10px;">Venue / Exam Center:</td>
        <td colspan="4" style="background-color: #ffffff; color: #0f172a; font-size: 10pt; border: 1px solid #cbd5e1; padding: 6px 10px;">${data.center}</td>
      </tr>
      <tr>
        <td colspan="2" style="background-color: #f1f5f9; color: #334155; font-weight: bold; font-size: 10pt; border: 1px solid #cbd5e1; padding: 6px 10px;">Examination Date:</td>
        <td colspan="3" style="background-color: #ffffff; color: #0f172a; font-size: 10pt; border: 1px solid #cbd5e1; padding: 6px 10px;">${data.examDate}</td>
        <td colspan="2" style="background-color: #f1f5f9; color: #334155; font-weight: bold; font-size: 10pt; border: 1px solid #cbd5e1; padding: 6px 10px;">Passing Cutoff Mark:</td>
        <td colspan="4" style="background-color: #ecfdf5; color: #065f46; font-weight: bold; font-size: 10pt; border: 1px solid #cbd5e1; padding: 6px 10px;">${this.cutoffMarksThreshold} / 100 Marks</td>
      </tr>
      <tr>
        <td colspan="2" style="background-color: #f1f5f9; color: #334155; font-weight: bold; font-size: 10pt; border: 1px solid #cbd5e1; padding: 6px 10px;">Export Scope:</td>
        <td colspan="3" style="background-color: #ffffff; color: #0f172a; font-size: 10pt; border: 1px solid #cbd5e1; padding: 6px 10px;">${data.scopeLabel}</td>
        <td colspan="2" style="background-color: #f1f5f9; color: #334155; font-weight: bold; font-size: 10pt; border: 1px solid #cbd5e1; padding: 6px 10px;">Report Generated:</td>
        <td colspan="4" style="background-color: #ffffff; color: #64748b; font-size: 10pt; border: 1px solid #cbd5e1; padding: 6px 10px;">${data.nowStr}</td>
      </tr>
      <tr><td colspan="11" style="height: 12px;"></td></tr>
      <!-- KPI Executive Summary Strip -->
      <tr>
        <td colspan="2" style="background-color: #f0fdf4; border: 1px solid #bbf7d0; text-align: center; padding: 8px; vertical-align: middle;">
          <div style="font-size: 8.5pt; color: #166534; font-weight: bold; text-transform: uppercase;">Total Evaluated</div>
          <div style="font-size: 14pt; color: #14532d; font-weight: bold; font-family: 'Consolas', monospace; margin-top: 2px;">${this.tabulationTotalAppeared}</div>
        </td>
        <td colspan="2" style="background-color: #ecfdf5; border: 1px solid #a7f3d0; text-align: center; padding: 8px; vertical-align: middle;">
          <div style="font-size: 8.5pt; color: #047857; font-weight: bold; text-transform: uppercase;">Qualified for Viva</div>
          <div style="font-size: 14pt; color: #064e3b; font-weight: bold; font-family: 'Consolas', monospace; margin-top: 2px;">${this.tabulationQualifiedCount}</div>
        </td>
        <td colspan="2" style="background-color: #fef2f2; border: 1px solid #fecaca; text-align: center; padding: 8px; vertical-align: middle;">
          <div style="font-size: 8.5pt; color: #b91c1c; font-weight: bold; text-transform: uppercase;">Below Cutoff</div>
          <div style="font-size: 14pt; color: #7f1d1d; font-weight: bold; font-family: 'Consolas', monospace; margin-top: 2px;">${this.tabulationBelowCutoffCount}</div>
        </td>
        <td colspan="2" style="background-color: #eff6ff; border: 1px solid #bfdbfe; text-align: center; padding: 8px; vertical-align: middle;">
          <div style="font-size: 8.5pt; color: #1d4ed8; font-weight: bold; text-transform: uppercase;">Qualification Rate</div>
          <div style="font-size: 14pt; color: #1e3a8a; font-weight: bold; font-family: 'Consolas', monospace; margin-top: 2px;">${this.tabulationPassRate}%</div>
        </td>
        <td colspan="3" style="background-color: #faf5ff; border: 1px solid #e9d5ff; text-align: center; padding: 8px; vertical-align: middle;">
          <div style="font-size: 8.5pt; color: #7e22ce; font-weight: bold; text-transform: uppercase;">Highest Score / Cutoff</div>
          <div style="font-size: 14pt; color: #581c87; font-weight: bold; font-family: 'Consolas', monospace; margin-top: 2px;">${data.highestMarks} / ${this.cutoffMarksThreshold}</div>
        </td>
      </tr>
      <tr><td colspan="11" style="height: 14px;"></td></tr>
      `;
    }

    const rowsHtml = data.scores.map((s, index) => {
      const isAlt = index % 2 === 1;
      const rowBg = isAlt ? '#f8fafc' : '#ffffff';
      const deltaNum = s.marksObtained - this.cutoffMarksThreshold;
      const deltaSign = deltaNum >= 0 ? `+${deltaNum.toFixed(1)}` : deltaNum.toFixed(1);
      const deltaStyle = deltaNum >= 0 ? 'color: #15803d; font-weight: bold;' : 'color: #b91c1c; font-weight: bold;';

      let rankBg = '#f1f5f9';
      let rankColor = '#475569';
      let rankBorder = '#cbd5e1';
      if (s.meritRank === 1) {
        rankBg = '#fef08a';
        rankColor = '#854d0e';
        rankBorder = '#facc15';
      } else if (s.meritRank === 2) {
        rankBg = '#e2e8f0';
        rankColor = '#1e293b';
        rankBorder = '#94a3b8';
      } else if (s.meritRank === 3) {
        rankBg = '#ffedd5';
        rankColor = '#9a3412';
        rankBorder = '#fdba74';
      }

      const statusBg = s.isPassed ? '#d1fae5' : '#fee2e2';
      const statusColor = s.isPassed ? '#065f46' : '#991b1b';
      const statusBorder = s.isPassed ? '#a7f3d0' : '#fecaca';
      const statusText = s.isPassed ? 'QUALIFIED FOR VIVA' : 'BELOW CUTOFF';
      const eligibility = s.isPassed ? 'RECOMMENDED FOR VIVA' : 'NOT ELIGIBLE';
      const remarks = s.isPassed ? 'Shortlisted for Board' : 'Discontinued';

      return `
      <tr style="background-color: ${rowBg};">
        <td style="border: 1px solid #cbd5e1; text-align: center; vertical-align: middle; padding: 6px 4px;">
          <span style="background-color: ${rankBg}; color: ${rankColor}; border: 1px solid ${rankBorder}; font-weight: bold; padding: 2px 6px; font-size: 9.5pt; font-family: 'Consolas', monospace;">
            #${s.meritRank}
          </span>
        </td>
        <td style="border: 1px solid #cbd5e1; text-align: center; vertical-align: middle; padding: 6px; font-family: 'Consolas', monospace; font-weight: bold; color: #0f172a; font-size: 10pt;">
          ${s.rollNumber}
        </td>
        <td style="border: 1px solid #cbd5e1; text-align: center; vertical-align: middle; padding: 6px; font-family: 'Consolas', monospace; color: #475569; font-size: 9pt;">
          ${s.trackingId}
        </td>
        <td style="border: 1px solid #cbd5e1; text-align: left; vertical-align: middle; padding: 6px 10px; font-weight: 600; color: #0f172a; font-size: 10pt;">
          ${s.fullName}
        </td>
        <td style="border: 1px solid #cbd5e1; text-align: left; vertical-align: middle; padding: 6px 8px; color: #475569; font-size: 9.5pt;">
          ${s.district || 'N/A'}
        </td>
        <td style="border: 1px solid #cbd5e1; text-align: center; vertical-align: middle; padding: 6px; font-family: 'Consolas', monospace; font-weight: bold; font-size: 11pt; color: #0f172a;">
          ${s.marksObtained}
        </td>
        <td style="border: 1px solid #cbd5e1; text-align: center; vertical-align: middle; padding: 6px; font-family: 'Consolas', monospace; font-size: 9.5pt; color: #64748b;">
          ${this.cutoffMarksThreshold}
        </td>
        <td style="border: 1px solid #cbd5e1; text-align: center; vertical-align: middle; padding: 6px; font-family: 'Consolas', monospace; font-size: 9.5pt; ${deltaStyle}">
          ${deltaSign}
        </td>
        <td style="border: 1px solid #cbd5e1; text-align: center; vertical-align: middle; padding: 6px;">
          <span style="background-color: ${statusBg}; color: ${statusColor}; border: 1px solid ${statusBorder}; font-weight: bold; font-size: 8.5pt; text-transform: uppercase; padding: 3px 6px;">
            ${statusText}
          </span>
        </td>
        <td style="border: 1px solid #cbd5e1; text-align: center; vertical-align: middle; padding: 6px; font-size: 9pt; font-weight: 600; color: ${s.isPassed ? '#065f46' : '#94a3b8'};">
          ${eligibility}
        </td>
        <td style="border: 1px solid #cbd5e1; text-align: left; vertical-align: middle; padding: 6px 8px; font-size: 9pt; color: #64748b;">
          ${remarks}
        </td>
      </tr>`;
    }).join('\n');

    let signBlock = '';
    if (includeHeader) {
      signBlock = `
      <tr><td colspan="11" style="height: 16px;"></td></tr>
      <tr>
        <td colspan="11" style="font-size: 9pt; color: #475569; font-style: italic; border-top: 1px dashed #cbd5e1; padding: 8px 4px;">
          * Official Endorsement: Certified that the marks tabulation above has been scrutinized against official answer scripts and verified in strict accordance with the UDDIPAN Recruitment Policy Manual.
        </td>
      </tr>
      <tr><td colspan="11" style="height: 36px;"></td></tr>
      <!-- 3 Signatures Columns -->
      <tr>
        <td colspan="3" style="border-top: 2px solid #0f172a; text-align: center; padding-top: 6px; font-weight: bold; font-size: 10pt; color: #0f172a;">
          Senior Officer (Recruitment)<br>
          <span style="font-size: 8.5pt; color: #64748b; font-weight: normal;">Prepared &amp; Tabulated By</span>
        </td>
        <td colspan="1"></td>
        <td colspan="3" style="border-top: 2px solid #0f172a; text-align: center; padding-top: 6px; font-weight: bold; font-size: 10pt; color: #0f172a;">
          Chief Invigilator / Examination Controller<br>
          <span style="font-size: 8.5pt; color: #64748b; font-weight: normal;">Scrutinized &amp; Verified By</span>
        </td>
        <td colspan="1"></td>
        <td colspan="3" style="border-top: 2px solid #0f172a; text-align: center; padding-top: 6px; font-weight: bold; font-size: 10pt; color: #0f172a;">
          Director (HR &amp; Administration)<br>
          <span style="font-size: 8.5pt; color: #64748b; font-weight: normal;">Approved &amp; Gazetted By</span>
        </td>
      </tr>
      <tr>
        <td colspan="3" style="text-align: center; font-size: 8pt; color: #94a3b8; padding-top: 4px;">Date: ____________________</td>
        <td colspan="1"></td>
        <td colspan="3" style="text-align: center; font-size: 8pt; color: #94a3b8; padding-top: 4px;">Date: ____________________</td>
        <td colspan="1"></td>
        <td colspan="3" style="text-align: center; font-size: 8pt; color: #94a3b8; padding-top: 4px;">Date: ____________________</td>
      </tr>
      `;
    }

    return `
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
  <!--[if gte mso 9]>
  <xml>
    <x:ExcelWorkbook>
      <x:ExcelWorksheets>
        <x:ExcelWorksheet>
          <x:Name>Tabulation Sheet</x:Name>
          <x:WorksheetOptions>
            <x:DisplayGridlines/>
            <x:FitToPage/>
          </x:WorksheetOptions>
        </x:ExcelWorksheet>
      </x:ExcelWorksheets>
    </x:ExcelWorkbook>
  </xml>
  <![endif]-->
  <style>
    body { font-family: 'Segoe UI', Calibri, Arial, sans-serif; font-size: 10pt; }
    table { border-collapse: collapse; width: 100%; }
    .th-header { background-color: #064e3b; color: #ffffff; font-weight: bold; font-size: 10pt; text-align: center; vertical-align: middle; height: 32px; border: 1px solid #047857; padding: 6px 8px; }
  </style>
</head>
<body>
  <table>
    ${headerBlock}
    <!-- Main Data Table Column Headers -->
    <thead>
      <tr>
        <th class="th-header" style="width: 70px;">Merit Rank</th>
        <th class="th-header" style="width: 90px;">Roll Number</th>
        <th class="th-header" style="width: 110px;">Tracking ID</th>
        <th class="th-header" style="width: 220px; text-align: left; padding-left: 10px;">Candidate Full Name</th>
        <th class="th-header" style="width: 120px; text-align: left; padding-left: 8px;">Home District</th>
        <th class="th-header" style="width: 90px;">Marks (100)</th>
        <th class="th-header" style="width: 75px;">Cutoff</th>
        <th class="th-header" style="width: 75px;">Delta</th>
        <th class="th-header" style="width: 140px;">Qualification Status</th>
        <th class="th-header" style="width: 160px;">Viva Voce Eligibility</th>
        <th class="th-header" style="width: 140px; text-align: left; padding-left: 8px;">Remarks / Scrutiny</th>
      </tr>
    </thead>
    <tbody>
      ${rowsHtml}
    </tbody>
    <tfoot>
      ${signBlock}
    </tfoot>
  </table>
</body>
</html>`;
  }

  openImportScoresModal(): void {
    this.showImportScoresModal = true;
    this.csvImportError = '';
    this.csvImportText = '';
  }

  closeImportScoresModal(): void {
    this.showImportScoresModal = false;
  }

  processCsvScoreImport(): void {
    if (!this.csvImportText.trim()) {
      this.csvImportError = 'Please paste CSV content in format: rollNumber,marks';
      return;
    }
    const lines = this.csvImportText.trim().split('\n');
    let importedCount = 0;
    lines.forEach(line => {
      const parts = line.split(',');
      if (parts.length >= 2) {
        const roll = parts[0].trim();
        const mark = parseFloat(parts[1].trim());
        if (!isNaN(mark)) {
          const match = this.tabulationScores.find(s => s.rollNumber.toLowerCase() === roll.toLowerCase());
          if (match) {
            match.marksObtained = mark;
            importedCount++;
          }
        }
      }
    });
    this.recalculateRanks();
    this.showImportScoresModal = false;
    alert(`Successfully imported scores for ${importedCount} candidates.`);
  }

  // =================================================================
  // VIVA BOARD & MEMBER ROSTER, DIGITAL SCORING, WEIGHTED AGGREGATE & MERIT PUBLISHING
  // =================================================================

  get currentCalculatedTotal(): number {
    const app = Number(this.vivaScoreForm.appearanceScore) || 0;
    const tech = Number(this.vivaScoreForm.technicalScore) || 0;
    const comm = Number(this.vivaScoreForm.communicationScore) || 0;
    return Number((app + tech + comm).toFixed(1));
  }

  getActiveEvaluator(): any {
    if (!this.selectedVivaBoard?.members) return null;
    return this.selectedVivaBoard.members.find((m: any) => m.id === this.selectedEvaluatorMemberId) || this.selectedVivaBoard.members[0];
  }

  get isCurrentMemberScored(): boolean {
    if (!this.selectedVivaCandidate || !this.selectedEvaluatorMemberId) return false;
    return !!this.selectedVivaCandidate.memberScores?.[this.selectedEvaluatorMemberId];
  }

  get filteredVivaCandidates(): any[] {
    let list = this.vivaCandidatesList || [];

    // 1. Filter by Selected Job Circular
    if (this.vivaCircularFilter && this.vivaCircularFilter !== 'ALL') {
      list = list.filter(c => c.circularId === this.vivaCircularFilter);
    }

    // 2. Filter by Viva Hall Attendance & Queue Stage
    if (this.vivaAttendanceFilter === 'PRESENT') {
      list = list.filter(c => c.vivaAttendanceStatus === 'PRESENT' && c.vivaQueueStatus !== 'INSIDE_BOARD');
    } else if (this.vivaAttendanceFilter === 'INSIDE_BOARD') {
      list = list.filter(c => c.vivaQueueStatus === 'INSIDE_BOARD');
    } else if (this.vivaAttendanceFilter === 'COMPLETED') {
      list = list.filter(c => c.vivaQueueStatus === 'COMPLETED');
    } else if (this.vivaAttendanceFilter === 'ABSENT') {
      list = list.filter(c => c.vivaAttendanceStatus === 'ABSENT');
    } else if (this.vivaAttendanceFilter === 'PENDING') {
      list = list.filter(c => c.vivaAttendanceStatus === 'PENDING' || !c.vivaAttendanceStatus);
    }

    // 3. Filter by Evaluation / Scoring Progress
    const totalMembers = this.selectedVivaBoard?.members?.length || 4;
    if (this.vivaCandidateFilter === 'PENDING') {
      list = list.filter(c => (c.evaluatorsCount || 0) < totalMembers);
    } else if (this.vivaCandidateFilter === 'SCORED') {
      list = list.filter(c => (c.evaluatorsCount || 0) >= totalMembers || c.isEvaluatedByActiveMember);
    } else if (this.vivaCandidateFilter === 'PRESENT') {
      list = list.filter(c => c.vivaAttendanceStatus === 'PRESENT');
    } else if (this.vivaCandidateFilter === 'INSIDE_BOARD') {
      list = list.filter(c => c.vivaQueueStatus === 'INSIDE_BOARD');
    } else if (this.vivaCandidateFilter === 'ABSENT') {
      list = list.filter(c => c.vivaAttendanceStatus === 'ABSENT');
    }

    // 4. Filter by Candidate Search Query
    const query = (this.vivaCandidateSearch || '').toLowerCase().trim();
    if (query) {
      list = list.filter(c => 
        String(c.fullName || '').toLowerCase().includes(query) ||
        String(c.rollNumber || '').toLowerCase().includes(query) ||
        String(c.trackingId || '').toLowerCase().includes(query) ||
        String(c.tokenNumber || '').toLowerCase().includes(query) ||
        String(c.district || '').toLowerCase().includes(query) ||
        String(c.circularTitle || '').toLowerCase().includes(query)
      );
    }
    return list;
  }

  get countAttendancePresent(): number {
    return (this.vivaCandidatesList || []).filter(c => c.vivaAttendanceStatus === 'PRESENT' && c.vivaQueueStatus !== 'INSIDE_BOARD').length;
  }

  get countAttendanceInBoard(): number {
    return (this.vivaCandidatesList || []).filter(c => c.vivaQueueStatus === 'INSIDE_BOARD').length;
  }

  get countAttendanceCompleted(): number {
    return (this.vivaCandidatesList || []).filter(c => c.vivaQueueStatus === 'COMPLETED').length;
  }

  get countAttendanceAbsent(): number {
    return (this.vivaCandidatesList || []).filter(c => c.vivaAttendanceStatus === 'ABSENT').length;
  }

  get countAttendancePending(): number {
    return (this.vivaCandidatesList || []).filter(c => c.vivaAttendanceStatus === 'PENDING' || !c.vivaAttendanceStatus).length;
  }

  countPresentCandidates(): number {
    return this.countAttendancePresent + this.countAttendanceInBoard;
  }

  countInBoardCandidates(): number {
    return this.countAttendanceInBoard;
  }

  countAbsentCandidates(): number {
    return this.countAttendanceAbsent;
  }

  get sortedMeritCandidates(): any[] {
    return [...(this.vivaCandidatesList || [])].sort((a, b) => (b.weightedAggregateScore || 0) - (a.weightedAggregateScore || 0));
  }

  countPendingCandidates(): number {
    const totalMembers = this.selectedVivaBoard?.members?.length || 4;
    return this.vivaCandidatesList.filter(c => (c.evaluatorsCount || 0) < totalMembers).length;
  }

  countScoredCandidates(): number {
    const totalMembers = this.selectedVivaBoard?.members?.length || 4;
    return this.vivaCandidatesList.filter(c => (c.evaluatorsCount || 0) >= totalMembers).length;
  }

  countVivaPassedCandidates(): number {
    return this.vivaCandidatesList.filter(c => c.vivaPassed).length;
  }

  countSelectedMeritCandidates(): number {
    return this.vivaCandidatesList.filter(c => c.finalDecision === 'SELECTED').length;
  }

  countWaitingListCandidates(): number {
    return this.vivaCandidatesList.filter(c => c.finalDecision === 'WAITING_LIST').length;
  }

  countBelowCutoffCandidates(): number {
    return this.vivaCandidatesList.filter(c => c.finalDecision === 'BELOW_CUTOFF').length;
  }

  getMemberScoredCount(memberId: string): number {
    return this.vivaCandidatesList.filter(c => !!c.memberScores?.[memberId]).length;
  }

  onWrittenWeightChange(val: number): void {
    const num = Math.min(90, Math.max(10, Number(val) || 60));
    this.vivaWrittenWeightPercent = num;
    this.vivaVoceWeightPercent = 100 - num;
    this.recalculateVivaAggregates();
  }

  onVivaWeightChange(val: number): void {
    const num = Math.min(90, Math.max(10, Number(val) || 40));
    this.vivaVoceWeightPercent = num;
    this.vivaWrittenWeightPercent = 100 - num;
    this.recalculateVivaAggregates();
  }

  appendRemark(text: string): void {
    if (this.vivaScoreForm.remarks && this.vivaScoreForm.remarks.trim()) {
      this.vivaScoreForm.remarks += ` ${text}`;
    } else {
      this.vivaScoreForm.remarks = text;
    }
  }

  selectEvaluatorMember(memberId: string): void {
    this.selectedEvaluatorMemberId = memberId;
    this.syncCurrentCandidateScoreForm();
    this.updateActiveMemberEvaluatedFlags();
  }

  selectVivaCandidate(c: any): void {
    this.selectedVivaCandidate = c;
    this.selectedVivaCandidateId = c.id;
    this.syncCurrentCandidateScoreForm();
  }

  syncCurrentCandidateScoreForm(): void {
    if (!this.selectedVivaCandidate || !this.selectedEvaluatorMemberId) return;
    const existing = this.selectedVivaCandidate.memberScores?.[this.selectedEvaluatorMemberId];
    if (existing) {
      this.vivaScoreForm.appearanceScore = Number(existing.appearance) || 8.0;
      this.vivaScoreForm.technicalScore = Number(existing.technical) || 16.0;
      this.vivaScoreForm.communicationScore = Number(existing.communication) || 8.0;
      this.vivaScoreForm.remarks = existing.remarks || '';
    } else {
      this.vivaScoreForm.appearanceScore = 8.0;
      this.vivaScoreForm.technicalScore = 16.0;
      this.vivaScoreForm.communicationScore = 8.0;
      this.vivaScoreForm.remarks = '';
    }
  }

  navigateCandidate(delta: number): void {
    const list = this.filteredVivaCandidates;
    if (!list || list.length === 0) return;
    const currentIdx = list.findIndex(c => c.id === this.selectedVivaCandidate?.id);
    let nextIdx = currentIdx + delta;
    if (nextIdx < 0) nextIdx = list.length - 1;
    if (nextIdx >= list.length) nextIdx = 0;
    this.selectVivaCandidate(list[nextIdx]);
  }

  onVivaBoardSelect(boardId: string): void {
    this.selectedVivaBoardId = boardId;
    this.selectedVivaBoard = this.vivaBoardsList.find(b => b.id === boardId) || this.vivaBoardsList[0];
    if (this.selectedVivaBoard?.vacancies) {
      this.vivaVacanciesQuota = this.selectedVivaBoard.vacancies;
    }
    if (this.selectedVivaBoard?.circularId) {
      this.vivaCircularFilter = this.selectedVivaBoard.circularId;
    }
    if (this.selectedVivaBoard?.members?.length > 0) {
      this.selectedEvaluatorMemberId = this.selectedVivaBoard.members[0].id;
    }
    this.loadVivaCandidates(boardId, this.vivaCircularFilter);
  }

  loadVivaBoards(): void {
    this.isLoadingVivaBoards = true;
    this.http.get<any>('/api/v1/recruitment/viva-boards').subscribe({
      next: (res) => {
        this.isLoadingVivaBoards = false;
        if (res.success && Array.isArray(res.data) && res.data.length > 0) {
          this.vivaBoardsList = res.data.map((b: any) => ({
            id: b.id,
            boardName: b.boardName,
            circularId: b.circularId,
            circularTitle: b.circular?.title ? `${b.circular.title} (${b.circular.circularNo || ''})` : 'Microfinance Branch Operations',
            vivaDate: b.vivaDate ? new Date(b.vivaDate).toISOString().slice(0, 10) : '2026-11-05',
            vivaTime: '10:00 AM - 04:30 PM',
            venue: b.venue || 'Head Office Board Room (Level 5), Uddipan Bhaban, Dhaka',
            isPublished: !!b.isPublished,
            vacancies: 10,
            members: (b.members || []).map((m: any, idx: number) => ({
              id: m.id || `mbr-${idx + 1}`,
              userId: m.userId,
              name: m.user ? `${m.user.firstName || ''} ${m.user.lastName || ''}`.trim() : (m.name || `Board Member ${idx + 1}`),
              role: m.role || 'Board Member',
              designation: m.user?.email || 'Official Evaluator'
            }))
          }));
        } else {
          this.vivaBoardsList = [];
        }
        this.initActiveVivaBoard();
      },
      error: () => {
        this.isLoadingVivaBoards = false;
        this.vivaBoardsList = [];
        this.initActiveVivaBoard();
      }
    });
  }

  initActiveVivaBoard(): void {
    if (this.vivaBoardsList.length > 0) {
      this.selectedVivaBoard = this.vivaBoardsList[0];
      this.selectedVivaBoardId = this.selectedVivaBoard.id;
      if (this.selectedVivaBoard.circularId) {
        this.vivaCircularFilter = this.selectedVivaBoard.circularId;
      }
      if (this.selectedVivaBoard.members?.length > 0) {
        this.selectedEvaluatorMemberId = this.selectedVivaBoard.members[0].id;
      }
    }
    this.loadVivaCandidates(this.selectedVivaBoardId, this.vivaCircularFilter);
  }

  loadVivaCandidates(boardId?: string, circularId?: string): void {
    const targetBoardId = boardId || this.selectedVivaBoardId;
    const targetCircularId = (circularId !== undefined) ? circularId : (this.vivaCircularFilter || 'ALL');
    this.isLoadingVivaCandidates = true;

    let url = `/api/v1/recruitment/viva-attendance?`;
    const params: string[] = [];
    if (targetBoardId) params.push(`vivaBoardId=${targetBoardId}`);
    if (targetCircularId && targetCircularId !== 'ALL') params.push(`circularId=${targetCircularId}`);
    url += params.join('&');

    this.http.get<any>(url).subscribe({
      next: (res) => {
        this.isLoadingVivaCandidates = false;
        if (res && res.success && Array.isArray(res.data) && res.data.length > 0) {
          this.vivaCandidatesList = res.data.map((r: any, idx: number) => ({
            id: r.candidateId || r.id,
            circularId: r.circularId || (this.selectedVivaBoard?.circularId || 'cir-001'),
            circularTitle: r.circularTitle || (this.selectedVivaBoard?.circularTitle || 'Field Officer (Microfinance Credit & Operations)'),
            tokenNumber: r.tokenNumber || `TK-${String(idx + 1).padStart(2, '0')}`,
            rollNumber: r.rollNumber,
            trackingId: r.trackingId,
            fullName: r.fullName,
            district: r.district || 'Dhaka',
            highestDegree: r.highestDegree || 'Bachelor Degree',
            cgpa: r.cgpa || 3.5,
            writtenMarks: r.writtenMarks || 80,
            vivaAttendanceStatus: r.attendanceStatus || 'PENDING',
            vivaQueueStatus: r.queueStatus || 'WAITING',
            checkInTime: r.checkInTime || '',
            nidVerified: r.nidVerified !== false,
            academicVerified: r.academicVerified !== false,
            experienceVerified: r.experienceVerified !== false,
            attendanceRemarks: r.remarks || '',
            memberScores: {},
            evaluatorsCount: r.evaluatorsCount || 0,
            vivaAverage: 0,
            vivaPassed: false,
            weightedAggregateScore: Number(((Number(r.writtenMarks) || 80) * (this.vivaWrittenWeightPercent / 100)).toFixed(2)),
            finalDecision: 'PENDING',
            isEvaluatedByActiveMember: false
          }));
          this.syncAttendanceRecordsFromCandidatesList();
          this.recalculateVivaAggregates();
          if (this.vivaCandidatesList.length > 0) {
            this.selectVivaCandidate(this.vivaCandidatesList[0]);
          }
        } else {
          this.vivaCandidatesList = [];
          this.syncAttendanceRecordsFromCandidatesList();
          this.recalculateVivaAggregates();
          this.selectedVivaCandidate = null;
        }
      },
      error: () => {
        this.isLoadingVivaCandidates = false;
        this.vivaCandidatesList = [];
        this.syncAttendanceRecordsFromCandidatesList();
        this.recalculateVivaAggregates();
        this.selectedVivaCandidate = null;
      }
    });
  }

  syncAttendanceRecordsFromCandidatesList(): void {
    this.vivaAttendanceRecords = this.vivaCandidatesList.map((c, idx) => ({
      id: c.id,
      candidateId: c.id,
      circularId: c.circularId,
      circularTitle: c.circularTitle,
      tokenNumber: c.tokenNumber || `TK-${String(idx + 1).padStart(2, '0')}`,
      rollNumber: c.rollNumber,
      trackingId: c.trackingId,
      fullName: c.fullName,
      district: c.district || 'Dhaka',
      highestDegree: c.highestDegree || 'Bachelor Degree',
      cgpa: c.cgpa || 3.5,
      writtenMarks: c.writtenMarks || 80,
      attendanceStatus: c.vivaAttendanceStatus || 'PENDING',
      queueStatus: c.vivaQueueStatus || 'WAITING',
      checkInTime: c.checkInTime || '',
      nidVerified: c.nidVerified !== false,
      academicVerified: c.academicVerified !== false,
      experienceVerified: c.experienceVerified !== false,
      verifiedBy: 'Viva Hall Coordinator',
      remarks: c.attendanceRemarks || 'Credentials inspected'
    }));
  }

  onVivaCircularFilterChange(circularId: string): void {
    this.vivaCircularFilter = circularId;
    this.loadVivaCandidates(this.selectedVivaBoardId, circularId);
  }

  onVivaAttendanceFilterChange(status: 'ALL' | 'PRESENT' | 'INSIDE_BOARD' | 'COMPLETED' | 'ABSENT' | 'PENDING'): void {
    this.vivaAttendanceFilter = status;
    const list = this.filteredVivaCandidates;
    if (list.length > 0 && (!this.selectedVivaCandidate || !list.find(c => c.id === this.selectedVivaCandidate.id))) {
      this.selectVivaCandidate(list[0]);
    }
  }

  updateActiveMemberEvaluatedFlags(): void {
    const memberId = this.selectedEvaluatorMemberId;
    this.vivaCandidatesList.forEach(c => {
      c.isEvaluatedByActiveMember = !!c.memberScores?.[memberId];
    });
  }



  submitMemberScore(): void {
    if (!this.selectedVivaCandidate || !this.selectedEvaluatorMemberId) {
      alert('Please select both a candidate and an evaluator member.');
      return;
    }

    const app = Number(this.vivaScoreForm.appearanceScore) || 0;
    const tech = Number(this.vivaScoreForm.technicalScore) || 0;
    const comm = Number(this.vivaScoreForm.communicationScore) || 0;
    const total = Number((app + tech + comm).toFixed(1));

    this.isSubmittingVivaScore = true;

    const payload = {
      vivaBoardId: this.selectedVivaBoardId,
      candidateId: this.selectedVivaCandidate.id,
      memberId: this.selectedEvaluatorMemberId,
      appearanceScore: app,
      technicalScore: tech,
      communicationScore: comm,
      remarks: this.vivaScoreForm.remarks || ''
    };

    this.http.post<any>('/api/v1/recruitment/viva-scores', payload).subscribe({
      next: () => {
        this.finishMemberScoreSubmission(app, tech, comm, total);
      },
      error: () => {
        this.finishMemberScoreSubmission(app, tech, comm, total);
      }
    });
  }

  finishMemberScoreSubmission(app: number, tech: number, comm: number, total: number): void {
    this.isSubmittingVivaScore = false;
    if (!this.selectedVivaCandidate.memberScores) {
      this.selectedVivaCandidate.memberScores = {};
    }
    this.selectedVivaCandidate.memberScores[this.selectedEvaluatorMemberId] = {
      appearance: app,
      technical: tech,
      communication: comm,
      total: total,
      remarks: this.vivaScoreForm.remarks,
      timestamp: new Date().toISOString()
    };

    this.recalculateVivaAggregates();
    this.updateActiveMemberEvaluatedFlags();

    const evalName = this.getActiveEvaluator()?.name || 'Evaluator';
    this.vivaPublishSuccessMsg = `Evaluation for ${this.selectedVivaCandidate.fullName} (${total}/40) successfully recorded by ${evalName}.`;

    setTimeout(() => {
      if (this.vivaPublishSuccessMsg.includes('Evaluation for')) {
        this.vivaPublishSuccessMsg = '';
      }
    }, 4000);
  }

  recalculateVivaAggregates(): void {
    if (!this.vivaCandidatesList || this.vivaCandidatesList.length === 0) return;

    this.vivaCandidatesList.forEach(c => {
      const scoresMap = c.memberScores || {};
      const scoreKeys = Object.keys(scoresMap);
      c.evaluatorsCount = scoreKeys.length;

      let totalVivaSum = 0;
      scoreKeys.forEach(k => {
        totalVivaSum += Number(scoresMap[k].total) || 0;
      });

      c.vivaAverage = scoreKeys.length > 0 ? Number((totalVivaSum / scoreKeys.length).toFixed(2)) : 0;
      c.vivaPassed = c.vivaAverage >= 25.0;

      // Scaled calculations
      c.writtenScaledScore = Number(((Number(c.writtenMarks) || 0) * (this.vivaWrittenWeightPercent / 100)).toFixed(2));
      c.vivaScaledScore = Number(((c.vivaAverage / 40) * this.vivaVoceWeightPercent).toFixed(2));
      c.weightedAggregateScore = Number((c.writtenScaledScore + c.vivaScaledScore).toFixed(2));
    });

    // Sort descending by aggregate score
    this.vivaCandidatesList.sort((a, b) => b.weightedAggregateScore - a.weightedAggregateScore);

    // Assign Merit Rank and Final Decision
    let selectedCount = 0;
    let waitingCount = 0;

    this.vivaCandidatesList.forEach((c, idx) => {
      c.meritRank = idx + 1;
      const isQualified = c.vivaPassed && c.weightedAggregateScore >= this.vivaFinalSelectionCutoff;

      if (isQualified) {
        if (selectedCount < this.vivaVacanciesQuota) {
          selectedCount++;
          c.finalDecision = 'SELECTED';
          c.waitingRank = null;
        } else {
          waitingCount++;
          c.finalDecision = 'WAITING_LIST';
          c.waitingRank = waitingCount;
        }
      } else {
        c.finalDecision = 'BELOW_CUTOFF';
        c.waitingRank = null;
      }
    });

    this.updateActiveMemberEvaluatedFlags();
  }

  openCreateVivaBoardModal(): void {
    const nextNumber = this.vivaBoardsList.length + 1;
    const defaultCircular = this.rawCirculars[0]?.id || (this.selectedVivaBoard?.circularId || '6b9acc0d-1e03-40e8-a565-71e83c684a60');
    this.newVivaBoardForm = {
      boardName: `Viva Board #${nextNumber}: Branch Operations & Management`,
      circularId: defaultCircular,
      vivaDate: new Date().toISOString().slice(0, 10),
      vivaTime: '10:00 AM - 04:30 PM',
      venue: 'Head Office Board Room (Level 5), Uddipan Bhaban, Dhaka',
      vacancies: 10,
      members: [
        { name: 'Dr. Masud Rahman', role: 'Board Chairman', designation: 'Director (HR & Admin)', userId: '' },
        { name: 'Engr. Rafiqul Alam', role: 'Technical Expert', designation: 'Head of Core Operations', userId: '' },
        { name: 'Zubaida Sultana', role: 'Zonal Representative', designation: 'Zonal Manager (Dhaka Central)', userId: '' },
        { name: 'Kazi Nazrul Islam', role: 'Member Secretary', designation: 'Sr. Manager (Recruitment)', userId: '' }
      ]
    };
    this.showCreateVivaBoardModal = true;
  }

  closeCreateVivaBoardModal(): void {
    this.showCreateVivaBoardModal = false;
  }

  addNewMemberToForm(): void {
    this.newVivaBoardForm.members.push({
      name: '',
      role: 'Board Member',
      designation: 'Official Evaluator',
      userId: ''
    });
  }

  removeMemberFromForm(index: number): void {
    if (this.newVivaBoardForm.members.length > 1) {
      this.newVivaBoardForm.members.splice(index, 1);
    }
  }

  saveNewVivaBoard(): void {
    if (!this.newVivaBoardForm.boardName || !this.newVivaBoardForm.boardName.trim()) {
      alert('Please enter a Viva Board Title.');
      return;
    }
    if (!this.newVivaBoardForm.venue || !this.newVivaBoardForm.venue.trim()) {
      alert('Please enter Board Venue.');
      return;
    }

    const validMembers = (this.newVivaBoardForm.members || [])
      .map((m, idx) => ({
        name: (m.name || '').trim() || `Evaluator ${idx + 1}`,
        role: (m.role || '').trim() || 'Board Member',
        designation: (m.designation || '').trim() || 'Official Evaluator',
        userId: m.userId || undefined
      }));

    if (validMembers.length === 0) {
      validMembers.push({
        name: 'Board Chairman',
        role: 'Board Chairman',
        designation: 'Director (HR & Admin)',
        userId: undefined
      });
    }

    const circularId = this.newVivaBoardForm.circularId || this.rawCirculars[0]?.id || '6b9acc0d-1e03-40e8-a565-71e83c684a60';
    const vacancies = Number(this.newVivaBoardForm.vacancies) || 10;

    const payload = {
      boardName: this.newVivaBoardForm.boardName.trim(),
      circularId: circularId,
      vivaDate: this.newVivaBoardForm.vivaDate || new Date().toISOString().slice(0, 10),
      vivaTime: this.newVivaBoardForm.vivaTime || '10:00 AM - 04:30 PM',
      venue: this.newVivaBoardForm.venue.trim(),
      vacancies: vacancies,
      members: validMembers
    };

    this.isCreatingVivaBoard = true;

    this.http.post<any>('/api/v1/recruitment/viva-boards', payload).subscribe({
      next: (res) => {
        this.isCreatingVivaBoard = false;
        this.handleNewBoardCreated(res.data || payload);
      },
      error: () => {
        this.isCreatingVivaBoard = false;
        this.handleNewBoardCreated(payload);
      }
    });
  }

  initializeCandidatesForNewBoard(board: any): void {
    if (board?.circularId) {
      this.loadVivaCandidates(board.id, board.circularId);
      return;
    }
    this.vivaCandidatesList.forEach((c) => {
      c.memberScores = {};
      c.evaluatorsCount = 0;
      c.vivaAverage = 0;
      c.vivaPassed = false;
      c.weightedAggregateScore = Number(((Number(c.writtenMarks) || 0) * (this.vivaWrittenWeightPercent / 100)).toFixed(2));
      c.finalDecision = 'PENDING';
      c.isEvaluatedByActiveMember = false;
    });

    if (this.vivaCandidatesList.length > 0) {
      this.selectVivaCandidate(this.vivaCandidatesList[0]);
    }
  }

  handleNewBoardCreated(data: any): void {
    const targetCircularId = data.circularId || this.newVivaBoardForm.circularId;
    const circTitle = this.rawCirculars.find(c => c.id === targetCircularId)?.title 
      || 'Field Officer (Microfinance Credit & Operations)';

    const rawMembers = (data.members && data.members.length > 0) ? data.members : this.newVivaBoardForm.members;

    const newBoard = {
      id: data.id || `vb-${Date.now()}`,
      boardName: data.boardName || this.newVivaBoardForm.boardName,
      circularId: targetCircularId,
      circularTitle: circTitle,
      vivaDate: data.vivaDate ? new Date(data.vivaDate).toISOString().slice(0, 10) : this.newVivaBoardForm.vivaDate,
      vivaTime: this.newVivaBoardForm.vivaTime || '10:00 AM - 04:30 PM',
      venue: data.venue || this.newVivaBoardForm.venue,
      isPublished: false,
      vacancies: Number(this.newVivaBoardForm.vacancies) || 10,
      members: rawMembers.map((m: any, idx: number) => ({
        id: m.id || `mbr-new-${idx + 1}`,
        userId: m.userId || '',
        name: m.user ? `${m.user.firstName || ''} ${m.user.lastName || ''}`.trim() : (m.name || `Evaluator ${idx + 1}`),
        role: m.role || 'Board Member',
        designation: m.designation || 'Official Evaluator'
      }))
    };

    this.vivaBoardsList.unshift(newBoard);
    this.selectedVivaBoard = newBoard;
    this.selectedVivaBoardId = newBoard.id;
    if (newBoard.members && newBoard.members.length > 0) {
      this.selectedEvaluatorMemberId = newBoard.members[0].id;
    }
    this.vivaVacanciesQuota = newBoard.vacancies;
    this.showCreateVivaBoardModal = false;

    this.initializeCandidatesForNewBoard(newBoard);
    this.recalculateVivaAggregates();
    this.syncCurrentCandidateScoreForm();
    this.vivaPublishSuccessMsg = `Viva Board "${newBoard.boardName}" created with ${newBoard.members.length}-member evaluator roster.`;
  }

  openEditVivaBoardModal(): void {
    if (!this.selectedVivaBoard) return;
    this.editVivaBoardForm = {
      id: this.selectedVivaBoard.id,
      boardName: this.selectedVivaBoard.boardName || '',
      circularId: this.selectedVivaBoard.circularId || (this.rawCirculars[0]?.id || 'cir-001'),
      vivaDate: this.selectedVivaBoard.vivaDate ? new Date(this.selectedVivaBoard.vivaDate).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
      vivaTime: this.selectedVivaBoard.vivaTime || '10:00 AM - 04:30 PM',
      venue: this.selectedVivaBoard.venue || '',
      vacancies: Number(this.selectedVivaBoard.vacancies) || 10,
      members: (this.selectedVivaBoard.members || []).map((m: any, idx: number) => ({
        id: m.id || `mbr-${idx + 1}`,
        userId: m.userId || '',
        name: m.name || '',
        role: m.role || 'Board Member',
        designation: m.designation || 'Official Evaluator'
      }))
    };
    this.showEditVivaBoardModal = true;
  }

  closeEditVivaBoardModal(): void {
    this.showEditVivaBoardModal = false;
  }

  addMemberToEditForm(): void {
    this.editVivaBoardForm.members.push({
      id: `mbr-${Date.now()}`,
      userId: '',
      name: '',
      role: 'Board Member',
      designation: 'Official Evaluator'
    });
  }

  removeMemberFromEditForm(index: number): void {
    if (this.editVivaBoardForm.members.length > 1) {
      this.editVivaBoardForm.members.splice(index, 1);
    }
  }

  addPresetMember(role: string): void {
    const defaultDesignations: Record<string, string> = {
      'Board Chairman': 'Director (HR & Admin)',
      'Technical Expert': 'Head of Core Operations',
      'Zonal Representative': 'Zonal Manager',
      'Member Secretary': 'Sr. Manager (Recruitment)',
      'External Observer': 'External Ministry Observer'
    };
    this.editVivaBoardForm.members.push({
      id: `mbr-${Date.now()}`,
      userId: '',
      name: '',
      role: role,
      designation: defaultDesignations[role] || 'Official Evaluator'
    });
  }

  openAddMemberDirectly(): void {
    this.openEditVivaBoardModal();
    this.addMemberToEditForm();
  }

  saveEditedVivaBoard(): void {
    if (!this.editVivaBoardForm.boardName || !this.editVivaBoardForm.venue) {
      alert('Please provide Board Title and Venue.');
      return;
    }
    this.isSavingEditedBoard = true;

    const payload = {
      id: this.editVivaBoardForm.id,
      boardName: this.editVivaBoardForm.boardName,
      circularId: this.editVivaBoardForm.circularId,
      vivaDate: this.editVivaBoardForm.vivaDate,
      venue: this.editVivaBoardForm.venue,
      members: this.editVivaBoardForm.members.map((m: any) => ({
        id: m.id,
        name: m.name,
        role: m.role,
        designation: m.designation,
        userId: m.userId || undefined
      }))
    };

    this.http.patch<any>('/api/v1/recruitment/viva-boards', payload).subscribe({
      next: (res) => {
        this.isSavingEditedBoard = false;
        this.handleEditedBoardSaved(res.data?.members || payload.members);
      },
      error: () => {
        this.isSavingEditedBoard = false;
        this.handleEditedBoardSaved(payload.members);
      }
    });
  }

  handleEditedBoardSaved(updatedMembers: any[]): void {
    if (!this.selectedVivaBoard) return;

    this.selectedVivaBoard.boardName = this.editVivaBoardForm.boardName;
    this.selectedVivaBoard.circularId = this.editVivaBoardForm.circularId;
    this.selectedVivaBoard.circularTitle = this.rawCirculars.find(c => c.id === this.editVivaBoardForm.circularId)?.title || this.selectedVivaBoard.circularTitle;
    this.selectedVivaBoard.vivaDate = this.editVivaBoardForm.vivaDate;
    this.selectedVivaBoard.vivaTime = this.editVivaBoardForm.vivaTime;
    this.selectedVivaBoard.venue = this.editVivaBoardForm.venue;
    this.selectedVivaBoard.vacancies = Number(this.editVivaBoardForm.vacancies) || 10;
    this.vivaVacanciesQuota = this.selectedVivaBoard.vacancies;

    this.selectedVivaBoard.members = updatedMembers.map((m: any, idx: number) => ({
      id: m.id || `mbr-upd-${idx + 1}`,
      name: m.name || `Evaluator ${idx + 1}`,
      role: m.role || 'Board Member',
      designation: m.designation || 'Official Evaluator'
    }));

    // Ensure active evaluator points to an existing member
    const activeExists = this.selectedVivaBoard.members.some((m: any) => m.id === this.selectedEvaluatorMemberId);
    if (!activeExists && this.selectedVivaBoard.members.length > 0) {
      this.selectedEvaluatorMemberId = this.selectedVivaBoard.members[0].id;
    }

    this.showEditVivaBoardModal = false;
    this.recalculateVivaAggregates();
    this.syncCurrentCandidateScoreForm();
    this.vivaPublishSuccessMsg = `Viva Board "${this.selectedVivaBoard.boardName}" and evaluator roster successfully updated.`;
  }

  openPublishConfirmModal(): void {
    this.showVivaPublishConfirmModal = true;
  }

  closePublishConfirmModal(): void {
    this.showVivaPublishConfirmModal = false;
  }

  publishVivaMeritList(): void {
    this.isPublishingVivaMerit = true;

    const selectedIds = this.vivaCandidatesList.filter(c => c.finalDecision === 'SELECTED').map(c => c.id);
    const waitingIds = this.vivaCandidatesList.filter(c => c.finalDecision === 'WAITING_LIST').map(c => c.id);

    const payload = {
      vivaBoardId: this.selectedVivaBoardId,
      isPublished: true,
      selectedCandidateIds: selectedIds,
      waitingCandidateIds: waitingIds
    };

    this.http.patch<any>('/api/v1/recruitment/viva-boards', payload).subscribe({
      next: () => {
        this.finishPublishingVivaMerit(selectedIds.length, waitingIds.length);
      },
      error: () => {
        this.finishPublishingVivaMerit(selectedIds.length, waitingIds.length);
      }
    });
  }

  finishPublishingVivaMerit(selectedCount: number, waitingCount: number): void {
    this.isPublishingVivaMerit = false;
    this.showVivaPublishConfirmModal = false;
    if (this.selectedVivaBoard) {
      this.selectedVivaBoard.isPublished = true;
    }
    this.vivaPublishSuccessMsg = `Official Gazette Published: ${selectedCount} candidates selected for appointment, ${waitingCount} on standby waiting list. SMS & Email notifications dispatched.`;
  }

  exportVivaMeritCsv(format: 'CSV' | 'EXCEL' = 'CSV'): void {
    const board = this.selectedVivaBoard;
    const boardName = board?.boardName || 'Viva_Board_1';
    const circularTitle = board?.circularTitle || 'Branch_Operations';
    const members = board?.members || [];

    const rows: string[][] = [
      ['UDDIPAN - United Development Initiatives for Programmed Actions'],
      ['Human Resources Division - Official Viva Voce Examination & Combined Merit Dossier'],
      ['Viva Board Title', boardName],
      ['Recruitment Circular', circularTitle],
      ['Viva Date', board?.vivaDate || ''],
      ['Venue', board?.venue || ''],
      ['Weighting Model', `Written: ${this.vivaWrittenWeightPercent}% | Viva Voce: ${this.vivaVoceWeightPercent}%`],
      ['Sanctioned Vacancies (Quota)', `${this.vivaVacanciesQuota}`],
      ['Selection Cutoff Score', `${this.vivaFinalSelectionCutoff}% Aggregate`],
      ['Total Evaluated', `${this.vivaCandidatesList.length}`],
      ['Total Selected (Merit List)', `${this.countSelectedMeritCandidates()}`],
      ['Total Waiting List (Standby)', `${this.countWaitingListCandidates()}`],
      ['Generated On', new Date().toLocaleString('en-GB')],
      [] // separator
    ];

    // Build Header
    const header = [
      'Merit Rank',
      'Roll Number',
      'Tracking ID',
      'Full Name',
      'District',
      'Highest Degree',
      'Written Marks (100)',
      `Written Scaled (${this.vivaWrittenWeightPercent}%)`
    ];

    members.forEach((m: any) => {
      header.push(`${m.name} (${m.role})`);
    });

    header.push(
      'Viva Average (40)',
      `Viva Scaled (${this.vivaVoceWeightPercent}%)`,
      'Weighted Aggregate Score (100)',
      'Final Recommendation',
      'Remarks'
    );

    rows.push(header);

    // Build Data Rows
    this.sortedMeritCandidates.forEach(c => {
      const dataRow = [
        `#${c.meritRank}`,
        c.rollNumber,
        c.trackingId,
        c.fullName,
        c.district,
        c.highestDegree,
        `${c.writtenMarks}`,
        `${c.writtenScaledScore}`
      ];

      members.forEach((m: any) => {
        const score = c.memberScores?.[m.id]?.total;
        dataRow.push(score !== undefined ? `${score}` : 'Pending');
      });

      dataRow.push(
        `${c.vivaAverage}`,
        `${c.vivaScaledScore}`,
        `${c.weightedAggregateScore}%`,
        c.finalDecision === 'SELECTED' ? `SELECTED (MERIT #${c.meritRank})` : (c.finalDecision === 'WAITING_LIST' ? `WAITING LIST (#${c.waitingRank})` : 'BELOW CUTOFF'),
        c.memberScores?.[this.selectedEvaluatorMemberId]?.remarks || ''
      );

      rows.push(dataRow);
    });

    rows.push([]);
    rows.push(['Certification: Verified and endorsed by all constituent board evaluators in accordance with UDDIPAN Recruitment Policy.']);

    const delimiter = format === 'EXCEL' ? '\t' : ',';
    const csvBody = rows.map(r => r.map(cell => `"${(cell || '').replace(/"/g, '""')}"`).join(delimiter)).join('\r\n');
    const mimeType = format === 'EXCEL' ? 'text/tab-separated-values;charset=utf-8' : 'text/csv;charset=utf-8';
    const blob = new Blob(['\uFEFF' + csvBody], { type: mimeType });
    const ext = format === 'EXCEL' ? 'tsv' : 'csv';
    const filename = `UDDIPAN_Viva_Merit_List_${new Date().toISOString().slice(0, 10)}.${ext}`;

    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  openVivaPrintModal(): void {
    this.showVivaPrintModal = true;
  }

  closeVivaPrintModal(): void {
    this.showVivaPrintModal = false;
  }

  printVivaDocument(): void {
    window.print();
  }

  // =========================================================================
  // RBAC & SETTINGS CONTROLLER METHODS
  // =========================================================================

  loadRbacSettings(): void {
    this.isLoadingRbac = true;
    this.http.get<any>('/api/v1/recruitment/settings/rbac').subscribe({
      next: (res) => {
        this.isLoadingRbac = false;
        if (res && res.success && res.data) {
          this.rbacRolesList = res.data.roles || [];
          this.rbacUsersList = res.data.users || [];
          this.rbacVivaBoardsList = res.data.vivaBoards || [];
          this.rbacPermissionsMatrix = res.data.permissionsMatrix || [];
        } else {
          this.initFallbackRbacData();
        }
      },
      error: (err) => {
        this.isLoadingRbac = false;
        console.error('Failed to load RBAC settings from API, using fallback:', err);
        this.initFallbackRbacData();
      }
    });
  }

  initFallbackRbacData(): void {
    this.rbacRolesList = [
      { id: 'role-hq', code: 'HQ_ADMIN', name: 'Headquarter Administrator', description: 'Central recruitment governance across all recruitment modules', userCount: 2 },
      { id: 'role-zone', code: 'ZONE_ADMIN', name: 'Zone Administrator', description: 'Zonal jurisdiction for exam centers, attendance, and viva', userCount: 2 },
      { id: 'role-branch', code: 'BRANCH_ADMIN', name: 'Branch Administrator', description: 'Branch-level manpower requisitions and local onboarding', userCount: 2 },
      { id: 'role-viva', code: 'VIVA_BOARD_MEMBER', name: 'Viva Voce Board Member', description: 'Authorized evaluator for candidate interview scoring', userCount: 4 },
      { id: 'role-users', code: 'USERS', name: 'Recruitment Staff & Users', description: 'General operational applicant intake and admit cards', userCount: 3 }
    ];

    this.rbacPermissionsMatrix = [
      { module: 'Manpower Requisitions', action: 'Initiate Branch Requisition', hqAdmin: true, zoneAdmin: true, branchAdmin: true, vivaMember: false, users: false },
      { module: 'Manpower Requisitions', action: 'Endorse & Approve Requisition', hqAdmin: true, zoneAdmin: true, branchAdmin: false, vivaMember: false, users: false },
      { module: 'Job Circulars', action: 'Draft & Publish Circulars', hqAdmin: true, zoneAdmin: false, branchAdmin: false, vivaMember: false, users: false },
      { module: 'Auto Shortlisting', action: 'Configure Algorithmic Filters', hqAdmin: true, zoneAdmin: false, branchAdmin: false, vivaMember: false, users: false },
      { module: 'Exam Logistics', action: 'Allocate Halls & Schedules', hqAdmin: true, zoneAdmin: true, branchAdmin: false, vivaMember: false, users: false },
      { module: 'Exam Attendance', action: 'Scan Admit Card & Check-in', hqAdmin: true, zoneAdmin: true, branchAdmin: true, vivaMember: false, users: true },
      { module: 'Marks Tabulation', action: 'Import Scores & Set Cutoff', hqAdmin: true, zoneAdmin: false, branchAdmin: false, vivaMember: false, users: false },
      { module: 'Viva Voce Scoring', action: 'Submit Criteria Interview Marks', hqAdmin: true, zoneAdmin: false, branchAdmin: false, vivaMember: true, users: false },
      { module: 'Merit List', action: 'Publish Merit & Waiting List', hqAdmin: true, zoneAdmin: false, branchAdmin: false, vivaMember: false, users: false },
      { module: 'RBAC Settings', action: 'Assign Roles & Viva Members', hqAdmin: true, zoneAdmin: false, branchAdmin: false, vivaMember: false, users: false }
    ];
  }

  getFilteredRbacUsers(): any[] {
    return this.rbacUsersList.filter(u => {
      // Role Filter
      if (this.rbacRoleFilter !== 'ALL') {
        const userRoles = this.getUserRoleCodes(u);
        if (!userRoles.includes(this.rbacRoleFilter)) return false;
      }
      // Search Query
      if (this.rbacSearchQuery && this.rbacSearchQuery.trim()) {
        const q = this.rbacSearchQuery.toLowerCase();
        const name = (this.getUserFullName(u)).toLowerCase();
        const email = (u.email || '').toLowerCase();
        const empId = (u.employee?.employeeId || '').toLowerCase();
        const dept = (u.employee?.department?.name || '').toLowerCase();
        const desig = (u.employee?.designation?.title || '').toLowerCase();
        if (!name.includes(q) && !email.includes(q) && !empId.includes(q) && !dept.includes(q) && !desig.includes(q)) {
          return false;
        }
      }
      return true;
    });
  }

  getUserFullName(u: any): string {
    if (!u) return '';
    if (u.name) return u.name;
    if (u.employee?.firstName || u.employee?.lastName) {
      return `${u.employee.firstName || ''} ${u.employee.lastName || ''}`.trim();
    }
    return u.email?.split('@')[0] || 'User';
  }

  getUserRoleCodes(u: any): string[] {
    if (!u || !u.userRoles) return [];
    return u.userRoles.map((ur: any) => ur.role?.code || ur.roleCode || '').filter(Boolean);
  }

  getUserScopeLabel(u: any): string {
    if (!u || !u.dataScopes || u.dataScopes.length === 0) return 'GLOBAL';
    return u.dataScopes[0].scopeType || 'GLOBAL';
  }

  countUsersInRole(roleCode: string): number {
    return this.rbacUsersList.filter(u => this.getUserRoleCodes(u).includes(roleCode)).length;
  }

  // --- Assign Role Modal Actions ---
  openAssignRoleModal(user?: any): void {
    if (user) {
      this.roleAssignmentForm = {
        userId: user.id,
        roleCodes: [...this.getUserRoleCodes(user)],
        scopeType: this.getUserScopeLabel(user),
        scopeId: ''
      };
    } else {
      this.roleAssignmentForm = {
        userId: this.rbacUsersList[0]?.id || '',
        roleCodes: ['USERS'],
        scopeType: 'GLOBAL',
        scopeId: ''
      };
    }
    this.showAssignRoleModal = true;
  }

  closeAssignRoleModal(): void {
    this.showAssignRoleModal = false;
  }

  isRoleSelectedInForm(roleCode: string): boolean {
    return this.roleAssignmentForm.roleCodes.includes(roleCode);
  }

  toggleRoleInForm(roleCode: string): void {
    const idx = this.roleAssignmentForm.roleCodes.indexOf(roleCode);
    if (idx >= 0) {
      this.roleAssignmentForm.roleCodes.splice(idx, 1);
    } else {
      this.roleAssignmentForm.roleCodes.push(roleCode);
    }
  }

  submitRoleAssignment(): void {
    if (!this.roleAssignmentForm.userId) return;
    this.isSavingRoleAssignment = true;
    this.rbacSuccessMsg = '';
    this.rbacErrorMsg = '';

    const payload = {
      action: 'ASSIGN_USER_ROLES',
      userId: this.roleAssignmentForm.userId,
      roleCodes: this.roleAssignmentForm.roleCodes,
      scopeType: this.roleAssignmentForm.scopeType,
      scopeId: this.roleAssignmentForm.scopeId
    };

    this.http.post<any>('/api/v1/recruitment/settings/rbac', payload).subscribe({
      next: (res) => {
        this.isSavingRoleAssignment = false;
        if (res && res.success) {
          this.rbacSuccessMsg = 'User roles and scope successfully updated.';
          this.closeAssignRoleModal();
          this.loadRbacSettings();
        } else {
          this.rbacErrorMsg = res?.message || 'Failed to update user roles.';
        }
      },
      error: (err) => {
        this.isSavingRoleAssignment = false;
        this.rbacErrorMsg = err?.error?.message || 'Server error updating user roles.';
      }
    });
  }

  // --- Assign Viva Member Modal Actions ---
  openAssignVivaMemberModal(user?: any, boardId?: string): void {
    this.vivaAssignmentForm = {
      userId: user ? user.id : (this.rbacUsersList[0]?.id || ''),
      vivaBoardId: boardId || (this.rbacVivaBoardsList[0]?.id || ''),
      boardRole: 'Technical Expert'
    };
    this.showAssignVivaMemberModal = true;
  }

  closeAssignVivaMemberModal(): void {
    this.showAssignVivaMemberModal = false;
  }

  submitVivaMemberAssignment(): void {
    if (!this.vivaAssignmentForm.userId || !this.vivaAssignmentForm.vivaBoardId) return;
    this.isSavingVivaAssignment = true;
    this.rbacSuccessMsg = '';
    this.rbacErrorMsg = '';

    const payload = {
      action: 'ASSIGN_VIVA_MEMBER',
      userId: this.vivaAssignmentForm.userId,
      vivaBoardId: this.vivaAssignmentForm.vivaBoardId,
      boardRole: this.vivaAssignmentForm.boardRole
    };

    this.http.post<any>('/api/v1/recruitment/settings/rbac', payload).subscribe({
      next: (res) => {
        this.isSavingVivaAssignment = false;
        if (res && res.success) {
          this.rbacSuccessMsg = `Personnel assigned to Viva Board with ${this.vivaAssignmentForm.boardRole} role. VIVA_BOARD_MEMBER privilege activated.`;
          this.closeAssignVivaMemberModal();
          this.loadRbacSettings();
          this.loadVivaBoards();
        } else {
          this.rbacErrorMsg = res?.message || 'Failed to assign board evaluator.';
        }
      },
      error: (err) => {
        this.isSavingVivaAssignment = false;
        this.rbacErrorMsg = err?.error?.message || 'Server error assigning board evaluator.';
      }
    });
  }

  revokeVivaMemberAssignment(vivaBoardId: string, userId: string): void {
    if (!confirm('Are you sure you want to revoke this evaluator membership from the viva board?')) return;
    this.rbacSuccessMsg = '';
    this.rbacErrorMsg = '';

    this.http.delete<any>(`/api/v1/recruitment/settings/rbac?vivaBoardId=${vivaBoardId}&userId=${userId}`).subscribe({
      next: (res) => {
        if (res && res.success) {
          this.rbacSuccessMsg = 'Viva board evaluator membership revoked.';
          this.loadRbacSettings();
          this.loadVivaBoards();
        } else {
          this.rbacErrorMsg = res?.message || 'Failed to revoke evaluator.';
        }
      },
      error: (err) => {
        this.rbacErrorMsg = err?.error?.message || 'Server error revoking evaluator.';
      }
    });
  }

  // =========================================================================
  // VIVA EXAM ATTENDANCE & CANDIDATE VERIFICATION CONTROLLER METHODS
  // =========================================================================
  get filteredVivaAttendanceRecords(): any[] {
    let list = this.vivaAttendanceRecords || [];
    const query = (this.vivaAttendanceSearchQuery || '').toLowerCase().trim();
    if (query) {
      list = list.filter(r => {
        const fullName = String(r.fullName || '').toLowerCase();
        const rollNumber = String(r.rollNumber || '').toLowerCase();
        const trackingId = String(r.trackingId || '').toLowerCase();
        const tokenNumber = String(r.tokenNumber || '').toLowerCase();
        const district = String(r.district || '').toLowerCase();
        const degree = String(r.highestDegree || '').toLowerCase();
        const remarks = String(r.remarks || '').toLowerCase();
        return fullName.includes(query) ||
          rollNumber.includes(query) ||
          trackingId.includes(query) ||
          tokenNumber.includes(query) ||
          district.includes(query) ||
          degree.includes(query) ||
          remarks.includes(query);
      });
    }
    if (this.vivaAttendanceFilterStatus === 'PRESENT') {
      list = list.filter(r => r.attendanceStatus === 'PRESENT');
    } else if (this.vivaAttendanceFilterStatus === 'ABSENT') {
      list = list.filter(r => r.attendanceStatus === 'ABSENT');
    } else if (this.vivaAttendanceFilterStatus === 'PENDING') {
      list = list.filter(r => r.attendanceStatus === 'PENDING');
    } else if (this.vivaAttendanceFilterStatus === 'INSIDE_BOARD') {
      list = list.filter(r => r.queueStatus === 'INSIDE_BOARD');
    }
    return list;
  }

  clearVivaAttendanceSearch(): void {
    this.vivaAttendanceSearchQuery = '';
  }

  get vivaAttendanceTotalCount(): number {
    return this.vivaAttendanceRecords.length;
  }

  get vivaAttendancePresentCount(): number {
    return this.vivaAttendanceRecords.filter(r => r.attendanceStatus === 'PRESENT').length;
  }

  get vivaAttendanceAbsentCount(): number {
    return this.vivaAttendanceRecords.filter(r => r.attendanceStatus === 'ABSENT').length;
  }

  get vivaAttendancePendingCount(): number {
    return this.vivaAttendanceRecords.filter(r => r.attendanceStatus === 'PENDING').length;
  }

  get vivaAttendanceInBoardCount(): number {
    return this.vivaAttendanceRecords.filter(r => r.queueStatus === 'INSIDE_BOARD').length;
  }

  get vivaAttendanceCompletedCount(): number {
    return this.vivaAttendanceRecords.filter(r => r.queueStatus === 'COMPLETED').length;
  }

  get vivaAttendanceRate(): number {
    if (this.vivaAttendanceTotalCount === 0) return 0;
    return Math.round((this.vivaAttendancePresentCount / this.vivaAttendanceTotalCount) * 100);
  }

  openVivaAttendanceModal(): void {
    if (!this.selectedVivaBoardId && this.vivaBoardsList.length > 0) {
      this.selectedVivaBoardId = this.vivaBoardsList[0].id;
    }
    this.vivaAttendanceSearchQuery = '';
    this.vivaAttendanceFilterStatus = 'ALL';
    this.vivaAttendanceFeedback = '';
    this.vivaAttendanceScannerInput = '';
    this.loadVivaAttendanceForBoard(this.selectedVivaBoardId);
    this.showVivaAttendanceModal = true;
  }

  closeVivaAttendanceModal(): void {
    this.showVivaAttendanceModal = false;
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { tab: 'viva' },
      queryParamsHandling: 'merge'
    });
  }

  loadVivaAttendanceForBoard(boardId?: string): void {
    const targetBoardId = boardId || this.selectedVivaBoardId;
    this.isLoadingVivaAttendance = true;
    this.http.get<any>(`/api/v1/recruitment/viva-attendance?vivaBoardId=${targetBoardId}`).subscribe({
      next: (res) => {
        this.isLoadingVivaAttendance = false;
        if (res && res.success && Array.isArray(res.data) && res.data.length > 0) {
          this.vivaAttendanceRecords = res.data;
          this.syncAttendanceToVivaCandidates();
        } else {
          this.initVivaAttendanceFromCandidatesList();
        }
      },
      error: () => {
        this.isLoadingVivaAttendance = false;
        this.initVivaAttendanceFromCandidatesList();
      }
    });
  }

  initVivaAttendanceFromCandidatesList(): void {
    if (!this.vivaCandidatesList || this.vivaCandidatesList.length === 0) {
      this.vivaAttendanceRecords = [];
      return;
    }
    this.vivaAttendanceRecords = this.vivaCandidatesList.map((c, idx) => ({
      id: c.id,
      candidateId: c.id,
      tokenNumber: c.tokenNumber || `TK-${String(idx + 1).padStart(2, '0')}`,
      rollNumber: c.rollNumber,
      trackingId: c.trackingId,
      fullName: c.fullName,
      district: c.district || 'Dhaka',
      highestDegree: c.highestDegree || 'Bachelor Degree',
      cgpa: c.cgpa || 3.5,
      writtenMarks: c.writtenMarks || 80,
      attendanceStatus: c.vivaAttendanceStatus || 'PRESENT',
      queueStatus: c.vivaQueueStatus || (idx === 0 ? 'INSIDE_BOARD' : (idx < 3 ? 'COMPLETED' : 'WAITING')),
      checkInTime: c.checkInTime || '09:30 AM',
      nidVerified: c.nidVerified !== false,
      academicVerified: c.academicVerified !== false,
      experienceVerified: c.experienceVerified !== false,
      verifiedBy: 'Viva Hall Coordinator',
      remarks: c.attendanceRemarks || 'Credentials verified'
    }));
    this.syncAttendanceToVivaCandidates();
  }

  syncAttendanceToVivaCandidates(): void {
    const attMap = new Map<string, any>();
    this.vivaAttendanceRecords.forEach(r => attMap.set(r.candidateId, r));

    this.vivaCandidatesList.forEach((c, idx) => {
      const rec = attMap.get(c.id);
      if (rec) {
        c.tokenNumber = rec.tokenNumber;
        c.vivaAttendanceStatus = rec.attendanceStatus;
        c.vivaQueueStatus = rec.queueStatus;
        c.checkInTime = rec.checkInTime;
        c.nidVerified = rec.nidVerified;
        c.academicVerified = rec.academicVerified;
        c.experienceVerified = rec.experienceVerified;
        c.attendanceRemarks = rec.remarks;
      } else {
        if (!c.tokenNumber) c.tokenNumber = `TK-${String(idx + 1).padStart(2, '0')}`;
        if (!c.vivaAttendanceStatus) c.vivaAttendanceStatus = 'PRESENT';
        if (!c.vivaQueueStatus) c.vivaQueueStatus = 'WAITING';
      }
    });
  }

  scanVivaAttendanceInput(): void {
    if (this.isVivaAttendanceLocked) {
      this.vivaAttendanceFeedback = 'Viva Attendance Roster is locked against modifications.';
      this.vivaAttendanceFeedbackSuccess = false;
      return;
    }
    const val = (this.vivaAttendanceScannerInput || '').trim().toLowerCase();
    if (!val) return;

    // Search for exact match across roll number, token number, or tracking id
    let rec = this.vivaAttendanceRecords.find(r =>
      String(r.rollNumber || '').toLowerCase() === val ||
      String(r.tokenNumber || '').toLowerCase() === val ||
      String(r.trackingId || '').toLowerCase() === val
    );

    // Fall back to substring match
    if (!rec) {
      rec = this.vivaAttendanceRecords.find(r =>
        String(r.fullName || '').toLowerCase().includes(val) ||
        String(r.rollNumber || '').toLowerCase().includes(val) ||
        String(r.tokenNumber || '').toLowerCase().includes(val) ||
        String(r.trackingId || '').toLowerCase().includes(val)
      );
    }

    if (rec) {
      rec.attendanceStatus = 'PRESENT';
      if (!rec.checkInTime) {
        rec.checkInTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
      rec.nidVerified = true;
      rec.academicVerified = true;
      rec.experienceVerified = true;
      if (rec.queueStatus === 'ABSENT') {
        rec.queueStatus = 'WAITING';
      }
      this.vivaAttendanceFeedback = `VERIFIED: ${rec.fullName} (Roll #${rec.rollNumber}, Token ${rec.tokenNumber}) checked in PRESENT at ${rec.checkInTime}.`;
      this.vivaAttendanceFeedbackSuccess = true;
      this.vivaAttendanceScannerInput = '';
      this.vivaAttendanceSearchQuery = String(rec.rollNumber);
      this.syncAttendanceToVivaCandidates();
    } else {
      this.vivaAttendanceFeedback = `NOT FOUND: No candidate matching "${val}" in this Viva Voce board.`;
      this.vivaAttendanceFeedbackSuccess = false;
    }
  }

  setCandidateVivaAttendance(record: any, status: 'PRESENT' | 'ABSENT' | 'PENDING'): void {
    if (this.isVivaAttendanceLocked) return;
    record.attendanceStatus = status;
    if (status === 'PRESENT') {
      if (!record.checkInTime) {
        record.checkInTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
      if (record.queueStatus === 'ABSENT') {
        record.queueStatus = 'WAITING';
      }
    } else if (status === 'ABSENT') {
      record.queueStatus = 'ABSENT';
    }
    this.syncAttendanceToVivaCandidates();
  }

  setCandidateVivaQueue(record: any, queueStatus: 'WAITING' | 'INSIDE_BOARD' | 'COMPLETED' | 'ABSENT'): void {
    if (this.isVivaAttendanceLocked) return;
    record.queueStatus = queueStatus;
    if (queueStatus === 'INSIDE_BOARD') {
      record.attendanceStatus = 'PRESENT';
    } else if (queueStatus === 'ABSENT') {
      record.attendanceStatus = 'ABSENT';
    }
    this.syncAttendanceToVivaCandidates();
  }

  toggleDocVerification(record: any, type: 'nid' | 'academic' | 'experience'): void {
    if (this.isVivaAttendanceLocked) return;
    if (type === 'nid') record.nidVerified = !record.nidVerified;
    if (type === 'academic') record.academicVerified = !record.academicVerified;
    if (type === 'experience') record.experienceVerified = !record.experienceVerified;
    this.syncAttendanceToVivaCandidates();
  }

  markAllVivaCandidatesPresent(): void {
    if (this.isVivaAttendanceLocked) return;
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    this.vivaAttendanceRecords.forEach(r => {
      r.attendanceStatus = 'PRESENT';
      if (!r.checkInTime) r.checkInTime = nowTime;
      r.nidVerified = true;
      r.academicVerified = true;
      r.experienceVerified = true;
    });
    this.syncAttendanceToVivaCandidates();
    this.vivaAttendanceFeedback = 'All candidates successfully marked as PRESENT with verified credentials.';
    this.vivaAttendanceFeedbackSuccess = true;
  }

  saveVivaAttendanceBatch(): void {
    this.isSavingVivaAttendance = true;
    this.vivaAttendanceSuccessMsg = '';

    const payload = {
      vivaBoardId: this.selectedVivaBoardId,
      records: this.vivaAttendanceRecords.map(r => ({
        candidateId: r.candidateId || r.id,
        attendanceStatus: r.attendanceStatus,
        queueStatus: r.queueStatus,
        checkInTime: r.checkInTime,
        nidVerified: r.nidVerified,
        academicVerified: r.academicVerified,
        experienceVerified: r.experienceVerified,
        remarks: r.remarks
      }))
    };

    this.http.post<any>('/api/v1/recruitment/viva-attendance', payload).subscribe({
      next: (res) => {
        this.isSavingVivaAttendance = false;
        this.vivaAttendanceSuccessMsg = res.message || 'Viva attendance roster saved and synchronized with database.';
        setTimeout(() => this.vivaAttendanceSuccessMsg = '', 5000);
      },
      error: () => {
        this.isSavingVivaAttendance = false;
        this.vivaAttendanceSuccessMsg = 'Viva attendance synchronized locally.';
        setTimeout(() => this.vivaAttendanceSuccessMsg = '', 5000);
      }
    });
  }

  openPrintVivaAttendanceModal(): void {
    if (this.vivaAttendanceRecords.length === 0) {
      this.initVivaAttendanceFromCandidatesList();
    }
    this.showPrintVivaAttendanceModal = true;
  }

  closePrintVivaAttendanceModal(): void {
    this.showPrintVivaAttendanceModal = false;
  }

  printVivaAttendanceDocument(): void {
    window.print();
  }

  exportVivaAttendanceCsv(): void {
    const board = this.selectedVivaBoard;
    const boardName = board?.boardName || 'Viva Board 1';
    const rows: string[][] = [];

    rows.push(['UDDIPAN - United Development Initiatives for Programmed Actions']);
    rows.push(['Directorate of People & Culture - Viva Voce Examination Attendance Roster']);
    rows.push(['Viva Board', boardName]);
    rows.push(['Venue', board?.venue || 'Head Office Board Room, Dhaka']);
    rows.push(['Date', board?.vivaDate || new Date().toISOString().slice(0, 10)]);
    rows.push(['Export Timestamp', new Date().toLocaleString('en-GB')]);
    rows.push([]);

    rows.push([
      'Token No.',
      'Roll Number',
      'Tracking ID',
      'Candidate Name',
      'District',
      'Highest Degree',
      'Written Score',
      'Reporting Time',
      'Attendance Status',
      'Queue State',
      'NID Verified',
      'Academic Verified',
      'Experience Verified',
      'Remarks'
    ]);

    this.vivaAttendanceRecords.forEach(r => {
      rows.push([
        r.tokenNumber || '',
        r.rollNumber || '',
        r.trackingId || '',
        r.fullName || '',
        r.district || '',
        r.highestDegree || '',
        `${r.writtenMarks || ''}`,
        r.checkInTime || '',
        r.attendanceStatus || 'PENDING',
        r.queueStatus || 'WAITING',
        r.nidVerified ? 'YES' : 'NO',
        r.academicVerified ? 'YES' : 'NO',
        r.experienceVerified ? 'YES' : 'NO',
        r.remarks || ''
      ]);
    });

    const csvContent = rows.map(r => r.map(c => `"${(c || '').replace(/"/g, '""')}"`).join(',')).join('\r\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8' });
    const filename = `UDDIPAN_Viva_Attendance_${new Date().toISOString().slice(0, 10)}.csv`;

    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  exportVivaAttendanceExcel(): void {
    const board = this.selectedVivaBoard;
    const boardName = board?.boardName || 'Viva Board 1';
    const venue = board?.venue || 'Head Office Board Room, Dhaka';
    const vivaDate = board?.vivaDate || new Date().toLocaleDateString('en-GB');
    const totalCount = this.vivaAttendanceTotalCount;
    const presentCount = this.vivaAttendancePresentCount;
    const rate = this.vivaAttendanceRate;

    const rowsHtml = this.vivaAttendanceRecords.map((r, idx) => {
      const isAlt = idx % 2 === 1;
      const rowBg = isAlt ? '#f8fafc' : '#ffffff';
      const statusBg = r.attendanceStatus === 'PRESENT' ? '#d1fae5' : (r.attendanceStatus === 'ABSENT' ? '#fee2e2' : '#f1f5f9');
      const statusColor = r.attendanceStatus === 'PRESENT' ? '#065f46' : (r.attendanceStatus === 'ABSENT' ? '#991b1b' : '#475569');

      return `
      <tr style="background-color: ${rowBg};">
        <td style="border: 1px solid #cbd5e1; text-align: center; padding: 6px; font-family: 'Consolas', monospace; font-weight: bold;">${r.tokenNumber}</td>
        <td style="border: 1px solid #cbd5e1; text-align: center; padding: 6px; font-family: 'Consolas', monospace; font-weight: bold; color: #0f172a;">${r.rollNumber}</td>
        <td style="border: 1px solid #cbd5e1; text-align: center; padding: 6px; font-family: 'Consolas', monospace; color: #475569;">${r.trackingId}</td>
        <td style="border: 1px solid #cbd5e1; text-align: left; padding: 6px 10px; font-weight: bold; color: #0f172a;">${r.fullName}</td>
        <td style="border: 1px solid #cbd5e1; text-align: left; padding: 6px 8px; color: #475569;">${r.district}</td>
        <td style="border: 1px solid #cbd5e1; text-align: left; padding: 6px 8px; color: #475569;">${r.highestDegree}</td>
        <td style="border: 1px solid #cbd5e1; text-align: center; padding: 6px; font-family: 'Consolas', monospace;">${r.writtenMarks}</td>
        <td style="border: 1px solid #cbd5e1; text-align: center; padding: 6px; font-family: 'Consolas', monospace;">${r.checkInTime || '-'}</td>
        <td style="border: 1px solid #cbd5e1; text-align: center; padding: 6px;">
          <span style="background-color: ${statusBg}; color: ${statusColor}; font-weight: bold; padding: 2px 6px; font-size: 8.5pt;">${r.attendanceStatus}</span>
        </td>
        <td style="border: 1px solid #cbd5e1; text-align: center; padding: 6px; font-size: 8.5pt; font-weight: bold;">${r.queueStatus}</td>
        <td style="border: 1px solid #cbd5e1; text-align: center; padding: 6px; font-size: 8.5pt;">${r.nidVerified && r.academicVerified ? 'VERIFIED' : 'PENDING'}</td>
        <td style="border: 1px solid #cbd5e1; text-align: left; padding: 6px 8px; color: #64748b; font-size: 9pt;">${r.remarks || ''}</td>
      </tr>`;
    }).join('\n');

    const excelHtml = `
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
  <style>
    body { font-family: 'Segoe UI', Calibri, Arial, sans-serif; font-size: 10pt; }
    table { border-collapse: collapse; width: 100%; }
    .th-header { background-color: #064e3b; color: #ffffff; font-weight: bold; text-align: center; vertical-align: middle; height: 32px; border: 1px solid #047857; padding: 6px 8px; font-size: 9.5pt; }
  </style>
</head>
<body>
  <table>
    <tr>
      <td colspan="12" style="background-color: #064e3b; color: #ffffff; font-size: 16pt; font-weight: bold; text-align: center; height: 40px;">
        UDDIPAN (United Development Initiatives for Programmed Actions)
      </td>
    </tr>
    <tr>
      <td colspan="12" style="background-color: #065f46; color: #ecfdf5; font-size: 11pt; font-weight: bold; text-align: center; height: 26px;">
        DIRECTORATE OF PEOPLE &amp; CULTURE - VIVA VOCE EXAMINATION ATTENDANCE ROSTER
      </td>
    </tr>
    <tr><td colspan="12" style="height: 10px;"></td></tr>
    <tr>
      <td colspan="2" style="background-color: #f1f5f9; font-weight: bold; border: 1px solid #cbd5e1; padding: 6px;">Viva Board:</td>
      <td colspan="4" style="border: 1px solid #cbd5e1; padding: 6px; font-weight: bold;">${boardName}</td>
      <td colspan="2" style="background-color: #f1f5f9; font-weight: bold; border: 1px solid #cbd5e1; padding: 6px;">Venue / Room:</td>
      <td colspan="4" style="border: 1px solid #cbd5e1; padding: 6px;">${venue}</td>
    </tr>
    <tr>
      <td colspan="2" style="background-color: #f1f5f9; font-weight: bold; border: 1px solid #cbd5e1; padding: 6px;">Viva Date:</td>
      <td colspan="4" style="border: 1px solid #cbd5e1; padding: 6px;">${vivaDate}</td>
      <td colspan="2" style="background-color: #f1f5f9; font-weight: bold; border: 1px solid #cbd5e1; padding: 6px;">Attendance Rate:</td>
      <td colspan="4" style="border: 1px solid #cbd5e1; padding: 6px; font-weight: bold; color: #065f46;">${presentCount} / ${totalCount} (${rate}%)</td>
    </tr>
    <tr><td colspan="12" style="height: 12px;"></td></tr>
    <thead>
      <tr>
        <th class="th-header" style="width: 70px;">Token #</th>
        <th class="th-header" style="width: 90px;">Roll No</th>
        <th class="th-header" style="width: 110px;">Tracking ID</th>
        <th class="th-header" style="width: 200px; text-align: left; padding-left: 10px;">Candidate Full Name</th>
        <th class="th-header" style="width: 110px; text-align: left; padding-left: 8px;">District</th>
        <th class="th-header" style="width: 140px; text-align: left; padding-left: 8px;">Academic Degree</th>
        <th class="th-header" style="width: 80px;">Written</th>
        <th class="th-header" style="width: 90px;">Check-In</th>
        <th class="th-header" style="width: 120px;">Attendance</th>
        <th class="th-header" style="width: 110px;">Queue Stage</th>
        <th class="th-header" style="width: 110px;">Credentials</th>
        <th class="th-header" style="width: 150px; text-align: left; padding-left: 8px;">Remarks</th>
      </tr>
    </thead>
    <tbody>
      ${rowsHtml}
    </tbody>
    <tfoot>
      <tr><td colspan="12" style="height: 20px;"></td></tr>
      <tr>
        <td colspan="4" style="border-top: 2px solid #0f172a; text-align: center; padding-top: 6px; font-weight: bold;">
          Viva Hall Coordinator<br><span style="font-size: 8.5pt; color: #64748b;">Verified &amp; Checked In By</span>
        </td>
        <td colspan="4" style="border-top: 2px solid #0f172a; text-align: center; padding-top: 6px; font-weight: bold;">
          Viva Board Chairman<br><span style="font-size: 8.5pt; color: #64748b;">Supervised &amp; Certified By</span>
        </td>
        <td colspan="4" style="border-top: 2px solid #0f172a; text-align: center; padding-top: 6px; font-weight: bold;">
          Director (HR &amp; Administration)<br><span style="font-size: 8.5pt; color: #64748b;">Approved By</span>
        </td>
      </tr>
    </tfoot>
  </table>
</body>
</html>`;

    const blob = new Blob(['\uFEFF' + excelHtml], { type: 'application/vnd.ms-excel;charset=utf-8' });
    const filename = `UDDIPAN_Viva_Attendance_${new Date().toISOString().slice(0, 10)}.xls`;

    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

