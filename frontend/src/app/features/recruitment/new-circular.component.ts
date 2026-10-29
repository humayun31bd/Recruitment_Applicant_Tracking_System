import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router, ActivatedRoute } from '@angular/router';
import { DatepickerComponent } from '@shared/components/datepicker/datepicker.component';

export type LookupType = 'DEPARTMENT' | 'DESIGNATION' | 'JOB_GRADE';

export interface EmploymentStatusOption {
  id: string;
  label: string;
  badgeClass: string;
}

@Component({
  selector: 'app-new-circular',
  standalone: true,
  imports: [CommonModule, FormsModule, DatepickerComponent],
  template: `
    <div class="max-w-7xl mx-auto space-y-6">
      <!-- Breadcrumb & Header -->
      <div class="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <div class="flex items-center gap-2">
            <span class="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 font-mono text-xs border border-emerald-800">
              MODULE 7.2
            </span>
            <h2 class="text-xl font-bold text-slate-100">
              {{ isEditMode ? 'Edit Official Job Circular: ' + (circularNo || '') : 'Create Official Job Circular' }}
            </h2>
          </div>
          <p class="text-xs text-slate-400 mt-1">
            {{ isEditMode ? 'Update circular parameters, deadline, requirements, and candidate screening criteria.' : 'Configure vacancy circular, employment status, video CV preferences, auto-screening thresholds, and deployment channels.' }}
          </p>
        </div>
        <button (click)="cancel()" class="px-3.5 py-1.5 text-xs font-medium text-slate-400 hover:text-slate-200 border border-slate-700 rounded-lg hover:bg-slate-800 transition-colors">
          &larr; Cancel & Return
        </button>
      </div>

      <!-- Stepper Indicator -->
      <div class="flex items-center gap-4 text-xs font-semibold bg-slate-900 border border-slate-800 p-3 rounded-xl">
        <div class="flex items-center gap-2 cursor-pointer" (click)="currentStep = 1" [ngClass]="currentStep === 1 ? 'text-emerald-400' : 'text-slate-500'">
          <span class="w-5 h-5 rounded-full flex items-center justify-center text-[10px]" [ngClass]="currentStep === 1 ? 'bg-emerald-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-400'">1</span>
          <span>Role & Engagement</span>
        </div>
        <span class="text-slate-700">&rarr;</span>
        <div class="flex items-center gap-2 cursor-pointer" (click)="currentStep = 2" [ngClass]="currentStep === 2 ? 'text-emerald-400' : 'text-slate-500'">
          <span class="w-5 h-5 rounded-full flex items-center justify-center text-[10px]" [ngClass]="currentStep === 2 ? 'bg-emerald-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-400'">2</span>
          <span>Skills & Video CV</span>
        </div>
        <span class="text-slate-700">&rarr;</span>
        <div class="flex items-center gap-2 cursor-pointer" (click)="currentStep = 3" [ngClass]="currentStep === 3 ? 'text-emerald-400' : 'text-slate-500'">
          <span class="w-5 h-5 rounded-full flex items-center justify-center text-[10px]" [ngClass]="currentStep === 3 ? 'bg-emerald-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-400'">3</span>
          <span>JD, Benefits & Guidelines</span>
        </div>
      </div>

      <!-- Split Screen Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <!-- LEFT: BUILDER FORM (7 COLS) -->
        <div class="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-5">
          
          <!-- STEP 1: Requisition, Role, Status & Location -->
          <div *ngIf="currentStep === 1" class="space-y-4">
            <div class="flex items-center justify-between border-b border-slate-800 pb-2">
              <h4 class="text-sm font-bold text-slate-200">Step 1: Role, Engagement & Duty Station</h4>
              <span class="text-[11px] text-emerald-400 font-mono">Organogram Linked</span>
            </div>
            
            <div *ngIf="!isEditMode">
              <label class="block text-xs font-medium text-slate-300 mb-1">Link Approved Manpower Requisition (Optional)</label>
              <select [(ngModel)]="form.requisitionId" (change)="onRequisitionSelect()" class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500">
                <option value="">-- Standalone Circular (Direct Posting) --</option>
                <option *ngFor="let req of approvedRequisitions" [value]="req.id">
                  {{ req.requisitionNo }} - {{ req.designation?.title }} ({{ req.vacanciesCount }} Posts, {{ req.department?.name }})
                </option>
              </select>
              <p class="text-[10px] text-slate-500 mt-1">Selecting an approved requisition auto-fills department, designation, and vacancy headcount.</p>
            </div>

            <!-- Position Title & Vacancies -->
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div class="sm:col-span-2">
                <label class="block text-xs font-medium text-slate-300 mb-1">Position / Circular Title *</label>
                <input type="text" [(ngModel)]="form.title" class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500" placeholder="e.g. Field Officer (Credit Operations)" />
              </div>
              <div>
                <label class="block text-xs font-medium text-slate-300 mb-1">Vacancies Count *</label>
                <input type="number" min="1" [(ngModel)]="form.vacanciesCount" class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500" />
              </div>
            </div>

            <!-- Employment Status Selector -->
            <div>
              <div class="flex items-center justify-between mb-1.5">
                <label class="block text-xs font-medium text-slate-300">
                  Employment Status <span class="text-rose-400">*</span>
                </label>
                <span class="text-[10px] text-slate-500">Contractual engagement category</span>
              </div>
              <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button 
                  type="button" 
                  *ngFor="let es of employmentStatusOptions" 
                  (click)="form.employmentStatus = es.label"
                  [ngClass]="form.employmentStatus === es.label ? 'bg-emerald-600 text-white font-bold border-emerald-500 shadow-md ring-1 ring-emerald-400' : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200 hover:border-slate-700'"
                  class="px-3 py-2 rounded-lg border text-xs text-center transition-all">
                  {{ es.label }}
                </button>
              </div>
            </div>

            <!-- ADVANCED POPUP LOOKUP SELECTORS: DEPT, DESIG, JOB GRADE -->
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <!-- 1. Department Picker -->
              <div>
                <div class="flex items-center justify-between mb-1">
                  <label class="block text-xs font-medium text-slate-300">Department *</label>
                  <button type="button" (click)="openLookup('DEPARTMENT')" class="text-[10px] text-emerald-400 hover:text-emerald-300 font-mono hover:underline flex items-center gap-0.5">
                    <span>Search</span> &rarr;
                  </button>
                </div>
                <div (click)="openLookup('DEPARTMENT')" class="w-full bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-lg px-3 py-2 text-xs cursor-pointer flex items-center justify-between transition-colors shadow-inner">
                  <span class="truncate" [ngClass]="form.departmentId ? 'text-slate-200 font-medium' : 'text-slate-500'">
                    {{ getSelectedDepartmentName() || '-- Select Dept --' }}
                  </span>
                  <span class="text-slate-400 hover:text-emerald-400 text-xs ml-1">🔍</span>
                </div>
              </div>

              <!-- 2. Designation Picker -->
              <div>
                <div class="flex items-center justify-between mb-1">
                  <label class="block text-xs font-medium text-slate-300">Designation *</label>
                  <button type="button" (click)="openLookup('DESIGNATION')" class="text-[10px] text-emerald-400 hover:text-emerald-300 font-mono hover:underline flex items-center gap-0.5">
                    <span>Search</span> &rarr;
                  </button>
                </div>
                <div (click)="openLookup('DESIGNATION')" class="w-full bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-lg px-3 py-2 text-xs cursor-pointer flex items-center justify-between transition-colors shadow-inner">
                  <span class="truncate" [ngClass]="form.designationId ? 'text-slate-200 font-medium' : 'text-slate-500'">
                    {{ getSelectedDesignationTitle() || '-- Select Designation --' }}
                  </span>
                  <span class="text-slate-400 hover:text-emerald-400 text-xs ml-1">🔍</span>
                </div>
              </div>

              <!-- 3. Job Grade Picker -->
              <div>
                <div class="flex items-center justify-between mb-1">
                  <label class="block text-xs font-medium text-slate-300">Job Grade *</label>
                  <button type="button" (click)="openLookup('JOB_GRADE')" class="text-[10px] text-emerald-400 hover:text-emerald-300 font-mono hover:underline flex items-center gap-0.5">
                    <span>Search</span> &rarr;
                  </button>
                </div>
                <div (click)="openLookup('JOB_GRADE')" class="w-full bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-lg px-3 py-2 text-xs cursor-pointer flex items-center justify-between transition-colors shadow-inner">
                  <span class="truncate" [ngClass]="form.jobGradeId ? 'text-slate-200 font-medium' : 'text-slate-500'">
                    {{ getSelectedJobGradeCode() || '-- Select Grade --' }}
                  </span>
                  <span class="text-slate-400 hover:text-emerald-400 text-xs ml-1">🔍</span>
                </div>
              </div>
            </div>

            <!-- Application Deadline & Deployment Scope -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 items-start">
              <div>
                <app-datepicker 
                  [(ngModel)]="form.applicationDeadline" 
                  name="applicationDeadline"
                  label="Application Deadline" 
                  placeholder="Choose deadline date..."
                  [minDate]="todayStr"
                  [showPresets]="true"
                  [required]="true"
                  helperText="Candidates may apply online until 11:59 PM on this date">
                </app-datepicker>
              </div>
              <div>
                <label class="block text-xs font-medium text-slate-300 mb-1">Deployment Scope</label>
                <select [(ngModel)]="form.deploymentScope" class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500">
                  <option value="ALL_BANGLADESH">All Bangladesh (Any Uddipan Branch)</option>
                  <option value="HEAD_OFFICE">Head Office (Dhaka)</option>
                  <option value="ZONE_SPECIFIC">Zone Specific (Rural / Urban)</option>
                </select>
                <p class="text-[10px] text-slate-500 mt-1">Geographic posting eligibility specified in circular</p>
              </div>
            </div>

            <!-- Job Location Field -->
            <div class="space-y-1.5 pt-1">
              <div class="flex items-center justify-between">
                <label class="block text-xs font-medium text-slate-300">
                  Job Location (Duty Station) <span class="text-rose-400">*</span>
                </label>
                <span class="text-[10px] text-slate-500">Official duty assignment station</span>
              </div>
              <input 
                type="text" 
                [(ngModel)]="form.jobLocation" 
                class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500" 
                placeholder="e.g. Anywhere in Bangladesh, Head Office (Dhaka), Bogura Zone" />
              <div class="flex flex-wrap items-center gap-1.5 pt-0.5">
                <span class="text-[10px] text-slate-500 mr-1">Quick Select:</span>
                <button 
                  type="button" 
                  *ngFor="let loc of locationPresets" 
                  (click)="form.jobLocation = loc" 
                  [ngClass]="form.jobLocation === loc ? 'bg-emerald-950 text-emerald-400 border-emerald-700 font-semibold' : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'"
                  class="text-[10px] px-2 py-0.5 rounded border transition-colors">
                  {{ loc }}
                </button>
              </div>
            </div>

            <!-- Circular Status (If Edit Mode) -->
            <div *ngIf="isEditMode" class="pt-2 border-t border-slate-800">
              <label class="block text-xs font-medium text-slate-300 mb-1">Circular Publishing Status</label>
              <div class="grid grid-cols-4 gap-2">
                <button 
                  type="button" 
                  *ngFor="let st of ['PUBLISHED', 'CLOSED', 'DRAFT', 'ARCHIVED']"
                  (click)="form.status = st"
                  [ngClass]="form.status === st ? 'bg-emerald-600 text-white font-bold' : 'bg-slate-950 text-slate-400 border border-slate-800'"
                  class="px-2.5 py-1.5 rounded-lg text-xs transition-colors">
                  {{ st }}
                </button>
              </div>
            </div>

            <div class="flex justify-end pt-3">
              <button 
                [disabled]="!form.title || !form.departmentId || !form.designationId || !form.jobGradeId || !form.applicationDeadline || !form.jobLocation"
                (click)="currentStep = 2" 
                class="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-xs rounded-lg transition-colors shadow">
                Proceed to Skills & Criteria &rarr;
              </button>
            </div>
          </div>

          <!-- STEP 2: Screening Thresholds, Skills & Expertise & Video CV -->
          <div *ngIf="currentStep === 2" class="space-y-4">
            <div class="flex items-center justify-between border-b border-slate-800 pb-2">
              <h4 class="text-sm font-bold text-slate-200">Step 2: Skills, ATS Thresholds & Video CV</h4>
              <span class="text-[11px] text-purple-400 font-mono">Automated Screening</span>
            </div>

            <!-- ============================================== -->
            <!-- SKILLS & EXPERTISE PICKER -->
            <!-- ============================================== -->
            <div class="space-y-2 bg-slate-950/70 border border-slate-800 rounded-xl p-3.5">
              <div class="flex items-center justify-between">
                <div>
                  <label class="block text-xs font-bold text-slate-200">
                    Skills & Expertise <span class="text-emerald-400">*</span>
                  </label>
                  <p class="text-[10px] text-slate-400">Add key functional, analytical, and field proficiencies</p>
                </div>
                <span class="text-[10px] text-emerald-400 font-mono">{{ form.skills.length }} Selected</span>
              </div>

              <!-- Selected Skills Chips -->
              <div class="flex flex-wrap items-center gap-1.5 min-h-[32px] p-2 bg-slate-900 border border-slate-800 rounded-lg">
                <span *ngIf="form.skills.length === 0" class="text-[11px] text-slate-500 italic">
                  No skills tagged yet. Click suggested tags below or type custom skills.
                </span>
                <span 
                  *ngFor="let s of form.skills; let idx = index" 
                  class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 text-xs border border-emerald-800/80 font-medium">
                  <span>{{ s }}</span>
                  <button type="button" (click)="removeSkill(idx)" class="text-emerald-500 hover:text-rose-400 text-xs">✕</button>
                </span>
              </div>

              <!-- Custom Skill Input -->
              <div class="flex items-center gap-2">
                <input 
                  type="text" 
                  [(ngModel)]="skillInput" 
                  (keydown.enter)="$event.preventDefault(); addCustomSkill()"
                  placeholder="Type skill & press Enter (e.g. Risk Analysis, MIS)" 
                  class="flex-1 bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none" />
                <button 
                  type="button" 
                  (click)="addCustomSkill()" 
                  class="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-colors shrink-0">
                  + Add Skill
                </button>
              </div>

              <!-- Pre-configured Quick Skills -->
              <div class="flex flex-wrap items-center gap-1.5 pt-1">
                <span class="text-[10px] text-slate-500 mr-1">Suggestions:</span>
                <button 
                  type="button" 
                  *ngFor="let sk of suggestedSkills" 
                  (click)="toggleSkill(sk)"
                  [ngClass]="form.skills.includes(sk) ? 'bg-emerald-950 text-emerald-400 border-emerald-700 font-semibold' : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'"
                  class="text-[10px] px-2 py-0.5 rounded border transition-colors">
                  {{ form.skills.includes(sk) ? '✓ ' + sk : '+ ' + sk }}
                </button>
              </div>
            </div>

            <!-- ============================================== -->
            <!-- APPLICANTS ARE ENCOURAGED TO SUBMIT VIDEO CV -->
            <!-- ============================================== -->
            <div 
              (click)="form.encourageVideoCv = !form.encourageVideoCv"
              [ngClass]="form.encourageVideoCv ? 'border-purple-600 bg-purple-950/20 shadow-md ring-1 ring-purple-500/40' : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'"
              class="p-3.5 border rounded-xl cursor-pointer transition-all flex items-start gap-3 select-none">
              
              <div class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5" 
                [ngClass]="form.encourageVideoCv ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-400'">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>

              <div class="flex-1">
                <div class="flex items-center justify-between">
                  <h5 class="text-xs font-bold" [ngClass]="form.encourageVideoCv ? 'text-purple-300' : 'text-slate-200'">
                    Applicants are encouraged to submit Video CV
                  </h5>
                  <span 
                    class="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold"
                    [ngClass]="form.encourageVideoCv ? 'bg-purple-950 text-purple-300 border border-purple-800' : 'bg-slate-900 text-slate-500 border border-slate-800'">
                    {{ form.encourageVideoCv ? 'ENABLED' : 'OPTIONAL' }}
                  </span>
                </div>
                <p class="text-[11px] text-slate-400 mt-1 leading-relaxed">
                  Enables applicants to provide a 1-2 minute unlisted YouTube, Google Drive, or Loom self-introduction video URL to assess verbal English/Bengali communication, confidence, and presentation skills before written exams.
                </p>
              </div>
            </div>

            <!-- ATS Screening Thresholds -->
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-medium text-slate-300 mb-1">Minimum Degree Required</label>
                <select [(ngModel)]="form.minDegree" class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500">
                  <option value="HSC">Higher Secondary (HSC)</option>
                  <option value="Diploma">Diploma</option>
                  <option value="Bachelor">Bachelor Degree</option>
                  <option value="Master">Master Degree</option>
                </select>
              </div>
              <div>
                <label class="block text-xs font-medium text-slate-300 mb-1">Minimum CGPA (Scale 4.00)</label>
                <input type="number" step="0.05" [(ngModel)]="form.minCgpa" class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500" />
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-medium text-slate-300 mb-1">Maximum Age Limit (Years)</label>
                <input type="number" [(ngModel)]="form.maxAge" class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500" />
              </div>
              <div>
                <label class="block text-xs font-medium text-slate-300 mb-1">Min. Experience (Years)</label>
                <input type="number" [(ngModel)]="form.minExperienceYears" class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500" />
              </div>
            </div>

            <div class="p-3.5 bg-slate-950 rounded-lg border border-slate-800 space-y-2.5 text-xs">
              <span class="font-semibold text-slate-300 block">Mandatory Screening Flags:</span>
              <label class="flex items-center gap-2 text-slate-400 cursor-pointer hover:text-slate-300">
                <input type="checkbox" [(ngModel)]="form.requiresMotorcycle" class="rounded bg-slate-900 border-slate-700 text-emerald-500 focus:ring-0" />
                Must possess valid Motorcycle Driving License (Field Operations)
              </label>
              <label class="flex items-center gap-2 text-slate-400 cursor-pointer hover:text-slate-300">
                <input type="checkbox" [(ngModel)]="form.willingRural" class="rounded bg-slate-900 border-slate-700 text-emerald-500 focus:ring-0" />
                Willing to work anywhere in rural branch offices of UDDIPAN
              </label>
              <label class="flex items-center gap-2 text-slate-400 cursor-pointer hover:text-slate-300">
                <input type="checkbox" [(ngModel)]="form.computerAptitude" class="rounded bg-slate-900 border-slate-700 text-emerald-500 focus:ring-0" />
                Working knowledge of Computer & Microfinance Loan Accounting
              </label>
            </div>

            <div class="flex justify-between pt-3">
              <button (click)="currentStep = 1" class="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg transition-colors">
                &larr; Back
              </button>
              <button (click)="currentStep = 3" class="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-lg transition-colors shadow">
                Proceed to JD & Publish &rarr;
              </button>
            </div>
          </div>

          <!-- STEP 3: Responsibilities, Requirements, Benefits & Guidelines -->
          <div *ngIf="currentStep === 3" class="space-y-4">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-2.5 gap-2">
              <div>
                <div class="flex items-center gap-2">
                  <h4 class="text-sm font-bold text-slate-200">Step 3: Specifications, Requirements & Benefits</h4>
                  <span class="text-[10px] px-1.5 py-0.5 rounded bg-blue-950 text-blue-400 font-mono border border-blue-900">M7.2</span>
                </div>
                <p class="text-[11px] text-slate-400 mt-0.5">Specify core responsibilities, qualifications, compensation package, and mandatory notices.</p>
              </div>
              <button 
                type="button" 
                (click)="loadSampleTemplate()" 
                class="px-2.5 py-1 text-[11px] font-mono bg-emerald-950 hover:bg-emerald-900 text-emerald-400 border border-emerald-800 rounded-lg transition-colors flex items-center gap-1.5 shrink-0 self-start sm:self-auto">
                <span>⚡</span> Load Standard Uddipan Template
              </button>
            </div>

            <!-- 1. Responsibilities & Context (REQUIRED) -->
            <div class="space-y-1">
              <div class="flex items-center justify-between">
                <label class="block text-xs font-semibold text-slate-200">
                  Responsibilities & Context <span class="text-rose-400">*</span>
                </label>
                <span class="text-[10px] font-mono" [ngClass]="(form.responsibilities?.length || 0) >= 10 ? 'text-emerald-400' : 'text-amber-400'">
                  {{ form.responsibilities?.length || 0 }} chars (Min 10 required)
                </span>
              </div>
              <textarea 
                rows="4" 
                [(ngModel)]="form.responsibilities" 
                class="w-full bg-slate-950 border rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 font-sans leading-relaxed" 
                [ngClass]="(!form.responsibilities || form.responsibilities.length < 10) ? 'border-amber-900/60' : 'border-slate-800'"
                placeholder="Detail day-to-day duties, reporting hierarchy, member group supervision, credit operations, and organizational context..."></textarea>
              <p *ngIf="!form.responsibilities || form.responsibilities.length < 10" class="text-[10px] text-amber-400/90">
                Please enter at least 10 characters for Responsibilities & Context.
              </p>
            </div>

            <!-- 2. Requirements (REQUIRED) -->
            <div class="space-y-1">
              <div class="flex items-center justify-between">
                <label class="block text-xs font-semibold text-slate-200">
                  Requirements (Educational, Professional & Technical) <span class="text-rose-400">*</span>
                </label>
                <span class="text-[10px] font-mono" [ngClass]="(form.requirements?.length || 0) >= 10 ? 'text-emerald-400' : 'text-amber-400'">
                  {{ form.requirements?.length || 0 }} chars (Min 10 required)
                </span>
              </div>
              <textarea 
                rows="4" 
                [(ngModel)]="form.requirements" 
                class="w-full bg-slate-950 border rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 font-sans leading-relaxed" 
                [ngClass]="(!form.requirements || form.requirements.length < 10) ? 'border-amber-900/60' : 'border-slate-800'"
                placeholder="Detail mandatory educational qualifications, passing divisions/CGPA, required experience years, and technical competencies..."></textarea>
              <p *ngIf="!form.requirements || form.requirements.length < 10" class="text-[10px] text-amber-400/90">
                Please enter at least 10 characters for Requirements.
              </p>
            </div>

            <!-- 3. Compensation & Other Benefits -->
            <div class="space-y-1.5 bg-slate-950/60 border border-slate-800/80 p-3 rounded-xl">
              <div class="flex items-center justify-between">
                <div>
                  <label class="block text-xs font-semibold text-slate-200">
                    Compensation & Other Benefits
                  </label>
                  <p class="text-[10px] text-slate-400">Salary structure, bonuses, allowances, and social safety nets</p>
                </div>
                <span class="text-[10px] text-emerald-400 font-mono">
                  Scale: {{ getSelectedJobGradeCode() || 'Grade-08' }}
                </span>
              </div>

              <!-- Quick Benefit Presets -->
              <div class="flex flex-wrap items-center gap-1.5 pt-1">
                <span class="text-[10px] text-slate-500">Add Quick Perk:</span>
                <button 
                  type="button" 
                  *ngFor="let b of benefitOptions" 
                  (click)="addBenefitTag(b)" 
                  class="text-[10px] px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700/80 hover:border-emerald-700 text-slate-300 hover:text-emerald-300 transition-colors">
                  + {{ b }}
                </button>
              </div>

              <textarea 
                rows="3" 
                [(ngModel)]="form.compensation" 
                class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 font-sans leading-relaxed mt-1" 
                placeholder="e.g. Monthly salary as per UDDIPAN Pay Scale, 2 Festival Bonuses, Contributory Provident Fund, Gratuity, Medical coverage..."></textarea>
            </div>

            <!-- 4. Read Before Apply (REQUIRED) -->
            <div class="space-y-1.5 bg-rose-950/20 border border-rose-900/50 p-3.5 rounded-xl">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-1.5">
                  <span class="text-rose-400 text-xs font-bold">⚠️</span>
                  <label class="block text-xs font-bold text-rose-300">
                    Read Before Apply <span class="text-rose-400">*</span>
                  </label>
                </div>
                <span class="text-[10px] font-mono" [ngClass]="(form.readBeforeApply?.length || 0) >= 10 ? 'text-emerald-400' : 'text-rose-400'">
                  {{ form.readBeforeApply?.length || 0 }} chars (Min 10 required)
                </span>
              </div>
              <p class="text-[10px] text-slate-400">Important instructions for applicants, non-persuasion disqualification warning, document verification, and submission terms.</p>
              <textarea 
                rows="3" 
                [(ngModel)]="form.readBeforeApply" 
                class="w-full bg-slate-950 border rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-rose-500 font-sans leading-relaxed" 
                [ngClass]="(!form.readBeforeApply || form.readBeforeApply.length < 10) ? 'border-rose-900/80' : 'border-slate-800'"
                placeholder="e.g. Only shortlisted applicants will be called for examination. Any persuasion or canvassing will lead to immediate disqualification. Selected candidates must present original academic documents..."></textarea>
              <p *ngIf="!form.readBeforeApply || form.readBeforeApply.length < 10" class="text-[10px] text-rose-400">
                Please enter at least 10 characters for Read Before Apply instructions.
              </p>
            </div>

            <!-- Distribution Channels -->
            <div class="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-2 text-xs">
              <span class="font-semibold text-slate-300 block">Distribution Channels:</span>
              <div class="grid grid-cols-2 gap-2 text-slate-400">
                <label class="flex items-center gap-2">
                  <input type="checkbox" checked disabled class="rounded bg-slate-900 text-emerald-500" />
                  Uddipan Web Career Portal (Public)
                </label>
                <label class="flex items-center gap-2 cursor-pointer hover:text-slate-300">
                  <input type="checkbox" [(ngModel)]="form.publishIjp" class="rounded bg-slate-900 border-slate-700 text-emerald-500" />
                  Internal Job Posting (IJP) for Staff
                </label>
              </div>
            </div>

            <!-- Validation Error Notice if Incomplete -->
            <div *ngIf="!isStep3Valid()" class="p-2.5 rounded-lg bg-amber-950/30 border border-amber-900/60 text-[11px] text-amber-300 flex items-center justify-between">
              <span>Required fields remaining to publish:</span>
              <span class="font-mono text-[10px] text-amber-400">
                <span *ngIf="!form.responsibilities || form.responsibilities.length < 10">[Responsibilities] </span>
                <span *ngIf="!form.requirements || form.requirements.length < 10">[Requirements] </span>
                <span *ngIf="!form.readBeforeApply || form.readBeforeApply.length < 10">[Read Before Apply] </span>
              </span>
            </div>

            <div class="flex justify-between pt-3">
              <button (click)="currentStep = 2" class="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg transition-colors">
                &larr; Back
              </button>
              <button 
                (click)="submitCircular()" 
                [disabled]="isSubmitting || !isStep3Valid()" 
                class="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs rounded-lg shadow-lg transition-all flex items-center gap-2">
                <span *ngIf="isSubmitting" class="animate-spin text-xs">⌛</span>
                <span>{{ isSubmitting ? 'Saving Circular...' : (isEditMode ? 'Update Job Circular' : 'Publish Job Circular Now') }}</span>
              </button>
            </div>
          </div>

        </div>

        <!-- RIGHT: LIVE PREVIEW (5 COLS) -->
        <div class="lg:col-span-5 bg-white text-slate-900 rounded-xl p-5 shadow-2xl border border-slate-200 space-y-4 font-sans sticky top-6">
          <div class="flex items-center justify-between border-b pb-3">
            <div>
              <span class="text-[10px] font-bold text-emerald-800 tracking-wider">UDDIPAN (উদ্দীপন)</span>
              <h3 class="text-base font-bold text-slate-900 mt-0.5">{{ form.title || 'Position Title Preview' }}</h3>
              <p class="text-[11px] text-slate-500">{{ getDepartmentName() }}</p>
            </div>
            <div class="flex flex-col items-end gap-1">
              <span class="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-mono text-[10px] font-bold">
                {{ circularNo || 'CIR-LIVE' }}
              </span>
              <span class="px-2 py-0.5 rounded text-[9px] font-semibold bg-blue-100 text-blue-800">
                {{ form.employmentStatus }}
              </span>
            </div>
          </div>

          <!-- Video CV Encouraged Banner in Preview -->
          <div *ngIf="form.encourageVideoCv" class="p-2.5 bg-purple-50 rounded-lg border border-purple-200 text-purple-900 text-xs flex items-center gap-2">
            <span class="text-base">🎥</span>
            <div class="text-[11px]">
              <span class="font-bold">Video CV Encouraged:</span> Candidates are welcome to submit a 1-2 min video introduction URL.
            </div>
          </div>

          <div class="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-3 rounded-lg border">
            <div>
              <span class="text-slate-500 text-[10px]">Vacancies:</span>
              <p class="font-bold text-slate-800">{{ form.vacanciesCount || 1 }} Posts</p>
            </div>
            <div>
              <span class="text-slate-500 text-[10px]">Application Deadline:</span>
              <p class="font-bold text-rose-700">{{ formatPreviewDeadline(form.applicationDeadline) }}</p>
            </div>
            <div>
              <span class="text-slate-500 text-[10px]">Duty Station:</span>
              <p class="font-semibold text-slate-800 truncate" title="{{ form.jobLocation }}">{{ form.jobLocation || 'Anywhere in Bangladesh' }}</p>
            </div>
            <div>
              <span class="text-slate-500 text-[10px]">Salary & Grade:</span>
              <p class="font-semibold text-emerald-700">{{ getGradeSalaryPreview() }}</p>
            </div>
            <div class="col-span-2">
              <span class="text-slate-500 text-[10px]">Min. Qualification:</span>
              <p class="font-semibold text-slate-800">{{ form.minDegree || 'Bachelor' }} (CGPA: {{ form.minCgpa || '2.50' }}, Exp: {{ form.minExperienceYears || 0 }} yrs)</p>
            </div>
          </div>

          <!-- Live Preview: Skills & Expertise -->
          <div class="space-y-1 text-xs" *ngIf="form.skills.length > 0">
            <h5 class="font-bold text-slate-900 text-xs">Required Skills & Expertise:</h5>
            <div class="flex flex-wrap gap-1">
              <span *ngFor="let s of form.skills" class="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border text-[10px] font-medium">
                {{ s }}
              </span>
            </div>
          </div>

          <!-- Live Preview: Responsibilities & Context -->
          <div class="space-y-1 text-xs text-slate-700 border-t pt-2">
            <h5 class="font-bold text-slate-900 text-xs flex items-center justify-between">
              <span>Responsibilities & Context:</span>
              <span *ngIf="form.responsibilities?.length >= 10" class="text-[9px] text-emerald-700 font-mono">Ready</span>
            </h5>
            <p class="text-[11px] whitespace-pre-line text-slate-600 max-h-32 overflow-y-auto bg-slate-50 p-2 rounded border border-slate-100">
              {{ form.responsibilities || 'Responsibilities & organizational context will render here...' }}
            </p>
          </div>

          <!-- Live Preview: Requirements -->
          <div class="space-y-1 text-xs text-slate-700">
            <h5 class="font-bold text-slate-900 text-xs flex items-center justify-between">
              <span>Requirements & Qualifications:</span>
              <span *ngIf="form.requirements?.length >= 10" class="text-[9px] text-emerald-700 font-mono">Ready</span>
            </h5>
            <p class="text-[11px] whitespace-pre-line text-slate-600 max-h-32 overflow-y-auto bg-slate-50 p-2 rounded border border-slate-100">
              {{ form.requirements || 'Educational credentials, competencies, and experience requirements...' }}
            </p>
          </div>

          <!-- Live Preview: Compensation & Other Benefits -->
          <div class="space-y-1 text-xs text-slate-700" *ngIf="form.compensation">
            <h5 class="font-bold text-slate-900 text-xs">Compensation & Other Benefits:</h5>
            <p class="text-[11px] whitespace-pre-line text-emerald-800 max-h-24 overflow-y-auto bg-emerald-50/50 p-2 rounded border border-emerald-100 font-medium">
              {{ form.compensation }}
            </p>
          </div>

          <!-- Live Preview: Read Before Apply -->
          <div class="space-y-1 text-xs" *ngIf="form.readBeforeApply">
            <div class="p-2.5 bg-amber-50 rounded-lg border border-amber-200 text-amber-950 space-y-1">
              <h5 class="font-bold text-[11px] text-amber-900 uppercase flex items-center gap-1">
                <span>⚠️</span> Read Before Apply:
              </h5>
              <p class="text-[10px] whitespace-pre-line text-amber-900 leading-relaxed max-h-24 overflow-y-auto">
                {{ form.readBeforeApply }}
              </p>
            </div>
          </div>

          <div *ngIf="form.requiresMotorcycle || form.willingRural" class="pt-2 border-t text-[11px] text-slate-600 space-y-1">
            <p class="font-bold text-slate-800 text-[10px] uppercase">Special Conditions:</p>
            <p *ngIf="form.requiresMotorcycle" class="text-emerald-800">• Valid Motorcycle Driving License required</p>
            <p *ngIf="form.willingRural" class="text-slate-700">• Willingness to serve in rural branch networks</p>
          </div>

          <div class="pt-3 border-t text-[10px] text-slate-500 flex justify-between items-center">
            <span>Uddipan Central HR Verification</span>
            <span class="font-mono font-bold text-slate-700">HRIS-ATS-2026</span>
          </div>
        </div>
      </div>

      <!-- ================================================================= -->
      <!-- ADVANCED LOOKUP & SELECTION POPUP MODAL (SEARCH, GRID/TABLE, FILTER) -->
      <!-- ================================================================= -->
      <div *ngIf="showLookupModal" class="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div class="bg-slate-900 border border-slate-700 rounded-2xl max-w-4xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in duration-150">
          
          <!-- Modal Header -->
          <div class="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
            <div>
              <div class="flex items-center gap-2">
                <span class="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 font-mono text-[10px] border border-emerald-800 uppercase">
                  MASTER DATA LOOKUP
                </span>
                <h3 class="text-base font-bold text-slate-100">{{ getLookupModalTitle() }}</h3>
              </div>
              <p class="text-xs text-slate-400 mt-0.5">Filter, search across all records, and click to apply selection.</p>
            </div>
            <button (click)="closeLookup()" class="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 flex items-center justify-center transition-colors">
              ✕
            </button>
          </div>

          <!-- Search & Filter Bar -->
          <div class="p-4 border-b border-slate-800 bg-slate-900/90 space-y-3">
            <div class="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
              <!-- Search Input -->
              <div class="relative flex-1">
                <span class="absolute left-3 top-2.5 text-slate-500 text-xs">🔍</span>
                <input 
                  type="text" 
                  [(ngModel)]="lookupSearch" 
                  placeholder="Search by code, title, department, or keyword..." 
                  class="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-lg pl-8 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none" />
                <button *ngIf="lookupSearch" (click)="lookupSearch = ''" class="absolute right-3 top-2.5 text-xs text-slate-500 hover:text-slate-300">
                  ✕
                </button>
              </div>

              <!-- View Switcher & Action -->
              <div class="flex items-center gap-2">
                <div class="bg-slate-950 border border-slate-800 rounded-lg p-0.5 flex text-xs">
                  <button 
                    (click)="lookupViewMode = 'grid'" 
                    [ngClass]="lookupViewMode === 'grid' ? 'bg-emerald-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'"
                    class="px-2.5 py-1 rounded transition-colors flex items-center gap-1">
                    <span>⊞</span> Grid
                  </button>
                  <button 
                    (click)="lookupViewMode = 'table'" 
                    [ngClass]="lookupViewMode === 'table' ? 'bg-emerald-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'"
                    class="px-2.5 py-1 rounded transition-colors flex items-center gap-1">
                    <span>☰</span> Table
                  </button>
                </div>
              </div>
            </div>

            <!-- Filter Chips (For Designation & Grade) -->
            <div *ngIf="lookupType === 'DESIGNATION'" class="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px]">
              <span class="text-slate-500 font-medium">Department:</span>
              <button 
                (click)="lookupFilter = 'ALL'" 
                [ngClass]="lookupFilter === 'ALL' ? 'bg-emerald-500 text-slate-950 font-bold' : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200'"
                class="px-2.5 py-0.5 rounded-full transition-colors whitespace-nowrap">
                All Departments
              </button>
              <button 
                *ngFor="let d of departments" 
                (click)="lookupFilter = d.id" 
                [ngClass]="lookupFilter === d.id ? 'bg-emerald-500 text-slate-950 font-bold' : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200'"
                class="px-2.5 py-0.5 rounded-full transition-colors whitespace-nowrap">
                {{ d.name }}
              </button>
            </div>
          </div>

          <!-- Modal Body: Scrollable Grid or Table View -->
          <div class="p-4 overflow-y-auto flex-1 space-y-3">
            
            <!-- Empty state -->
            <div *ngIf="getFilteredLookupItems().length === 0" class="py-12 text-center space-y-2">
              <span class="text-2xl text-slate-600">🔍</span>
              <h5 class="text-xs font-bold text-slate-400">No matching records found</h5>
              <p class="text-[11px] text-slate-500">Try adjusting your search terms or filter selection.</p>
            </div>

            <!-- VIEW MODE 1: GRID VIEW -->
            <div *ngIf="lookupViewMode === 'grid'" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              <div 
                *ngFor="let item of getFilteredLookupItems()" 
                (click)="tempSelectedId = item.id"
                (dblclick)="confirmDirect(item)"
                [ngClass]="tempSelectedId === item.id ? 'border-emerald-500 bg-emerald-950/20 shadow-md ring-1 ring-emerald-500' : 'border-slate-800 bg-slate-950/70 hover:border-slate-700'"
                class="p-3.5 border rounded-xl cursor-pointer transition-all flex flex-col justify-between group">
                <div>
                  <div class="flex items-center justify-between mb-1.5">
                    <span class="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400 group-hover:text-emerald-400">
                      {{ item.code || item.gradeCode }}
                    </span>
                    <span *ngIf="tempSelectedId === item.id" class="w-4 h-4 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center text-[10px] font-bold">
                      ✓
                    </span>
                  </div>

                  <h5 class="text-xs font-bold text-slate-200 group-hover:text-white">
                    {{ item.title || item.name || item.gradeCode }}
                  </h5>

                  <p *ngIf="lookupType === 'DESIGNATION'" class="text-[11px] text-slate-400 mt-1">
                    {{ getDepartmentNameById(item.departmentId) }}
                  </p>
                  
                  <div *ngIf="lookupType === 'JOB_GRADE'" class="text-[11px] text-slate-400 mt-1 space-y-0.5">
                    <div>Level: <span class="text-slate-200 font-semibold">{{ item.level }}</span></div>
                    <div class="text-emerald-400 font-mono font-medium">৳ {{ item.minSalary | number }} - {{ item.maxSalary | number }}</div>
                  </div>

                  <p *ngIf="lookupType === 'DEPARTMENT'" class="text-[11px] text-slate-500 mt-1">
                    UDDIPAN Functional Unit
                  </p>
                </div>

                <div class="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px]">
                  <span class="text-slate-500">Double click to select</span>
                  <span [ngClass]="tempSelectedId === item.id ? 'text-emerald-400 font-bold' : 'text-slate-400'">
                    {{ tempSelectedId === item.id ? 'Selected' : 'Click to Pick' }}
                  </span>
                </div>
              </div>
            </div>

            <!-- VIEW MODE 2: COMPACT TABLE VIEW -->
            <div *ngIf="lookupViewMode === 'table'" class="overflow-x-auto border border-slate-800 rounded-xl">
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
                    *ngFor="let item of getFilteredLookupItems()" 
                    (click)="tempSelectedId = item.id"
                    [ngClass]="tempSelectedId === item.id ? 'bg-emerald-950/30' : 'hover:bg-slate-800/40'"
                    class="cursor-pointer transition-colors">
                    <td class="px-4 py-2.5 font-mono text-emerald-400">{{ item.code || item.gradeCode }}</td>
                    <td class="px-4 py-2.5 font-medium text-slate-200">{{ item.title || item.name || item.gradeCode }}</td>
                    <td class="px-4 py-2.5 text-slate-400">
                      {{ lookupType === 'DESIGNATION' ? getDepartmentNameById(item.departmentId) : 'Headquarter Unit' }}
                    </td>
                    <td class="px-4 py-2.5 text-right">
                      <button 
                        (click)="confirmDirect(item)" 
                        class="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 hover:bg-emerald-600 text-slate-200 hover:text-white transition-colors">
                        Select
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

          </div>

          <!-- Modal Footer -->
          <div class="p-3.5 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
            <span class="text-xs text-slate-400">
              Selected: <strong class="text-emerald-400 font-medium">{{ getTempSelectedItemName() || 'None' }}</strong>
            </span>
            <div class="flex items-center gap-2">
              <button (click)="closeLookup()" class="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors">
                Cancel
              </button>
              <button 
                [disabled]="!tempSelectedId"
                (click)="applyLookup()" 
                class="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs transition-colors shadow-md">
                Confirm & Apply Selection
              </button>
            </div>
          </div>

        </div>
      </div>

    </div>
  `
})
export class NewCircularComponent implements OnInit {
  currentStep = 1;
  isSubmitting = false;
  isEditMode = false;
  circularId: string | null = null;
  circularNo: string = '';

  approvedRequisitions: any[] = [];
  departments: any[] = [];
  designations: any[] = [];
  jobGrades: any[] = [];

  // Popup Lookup Modal State
  showLookupModal: boolean = false;
  lookupType: LookupType = 'DESIGNATION';
  lookupSearch: string = '';
  lookupFilter: string = 'ALL';
  lookupViewMode: 'grid' | 'table' = 'grid';
  tempSelectedId: string = '';
  todayStr: string = new Date().toISOString().split('T')[0];

  skillInput: string = '';

  employmentStatusOptions: EmploymentStatusOption[] = [
    { id: 'FULL_TIME', label: 'Full-time', badgeClass: 'bg-emerald-100 text-emerald-800' },
    { id: 'CONTRACTUAL', label: 'Contractual', badgeClass: 'bg-amber-100 text-amber-800' },
    { id: 'INTERNSHIP', label: 'Internship', badgeClass: 'bg-blue-100 text-blue-800' },
    { id: 'PART_TIME', label: 'Part-time', badgeClass: 'bg-purple-100 text-purple-800' },
  ];

  suggestedSkills: string[] = [
    'Microfinance Operations',
    'Credit Risk & Appraisal',
    'Loan Accounting',
    'Community Mobilization',
    'PAR Management',
    'MIS & Data Entry',
    'Audit & Compliance',
    'Motorcycle Driving',
    'MS Excel & Spreadsheets',
    'Field Reporting'
  ];

  locationPresets: string[] = [
    'Anywhere in Bangladesh',
    'Head Office, Banasree, Dhaka',
    'Dhaka Zone (Rural & Urban)',
    'Chittagong Zone',
    'Rajshahi & Bogura Zone',
    'Barishal Zone'
  ];

  benefitOptions: string[] = [
    '2 Festival Bonuses per year',
    'Contributory Provident Fund (CPF)',
    'Gratuity Benefit',
    'Staff Welfare Fund (SWF) Grants',
    'Mobile & Internet Allowance',
    'Group Life & Medical Insurance',
    'Annual Salary Increment'
  ];

  form: any = {
    requisitionId: '',
    title: '',
    departmentId: '',
    designationId: '',
    jobGradeId: '',
    vacanciesCount: 1,
    applicationDeadline: '',
    deploymentScope: 'ALL_BANGLADESH',
    jobLocation: 'Anywhere in Bangladesh',
    employmentStatus: 'Full-time',
    skills: ['Microfinance Operations', 'Credit Risk & Appraisal'],
    encourageVideoCv: true,
    responsibilities: '',
    requirements: '',
    compensation: '',
    readBeforeApply: '',
    minDegree: 'Bachelor',
    minCgpa: 2.50,
    maxAge: 32,
    minExperienceYears: 0,
    requiresMotorcycle: true,
    willingRural: true,
    computerAptitude: true,
    publishIjp: true,
    status: 'PUBLISHED',
  };

  constructor(
    private http: HttpClient, 
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.circularId = this.route.snapshot.paramMap.get('id');
    if (this.circularId) {
      this.isEditMode = true;
    }

    this.loadHierarchyData();
    this.loadApprovedRequisitions();

    this.route.queryParams.subscribe(params => {
      if (params['requisitionId']) {
        this.form.requisitionId = params['requisitionId'];
      }
      if (params['deptId']) {
        this.form.departmentId = params['deptId'];
      }
      if (params['desigId']) {
        this.form.designationId = params['desigId'];
      }
      if (params['vacancies']) {
        this.form.vacanciesCount = Number(params['vacancies']);
      }
    });

    if (this.isEditMode && this.circularId) {
      this.loadCircularForEdit(this.circularId);
    }
  }

  loadHierarchyData() {
    this.http.get<any>('/api/v1/master/hierarchy').subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.departments = res.data.departments || [];
          this.designations = res.data.designations || [];
          this.jobGrades = res.data.jobGrades || [];
        }
      },
      error: (err) => console.error('Failed to load hierarchy:', err)
    });
  }

  loadApprovedRequisitions() {
    this.http.get<any>('/api/v1/recruitment/requisitions?status=APPROVED_MANAGEMENT').subscribe({
      next: (res) => {
        if (res.success) {
          this.approvedRequisitions = res.data || [];
        }
      },
      error: (err) => console.error('Failed to load approved requisitions:', err)
    });
  }

  loadCircularForEdit(id: string) {
    this.http.get<any>(`/api/v1/recruitment/circulars/${id}`).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          const c = res.data;
          this.circularNo = c.circularNo;
          this.form.title = c.title;
          this.form.departmentId = c.departmentId;
          this.form.designationId = c.designationId;
          this.form.jobGradeId = c.jobGradeId;
          this.form.vacanciesCount = c.vacanciesCount;
          this.form.status = c.status;
          this.form.requisitionId = c.requisitionId || '';
          this.form.minDegree = c.minDegree || 'Bachelor';
          this.form.minCgpa = c.minCgpa ? Number(c.minCgpa) : 2.50;
          this.form.maxAge = c.maxAge || 32;
          this.form.minExperienceYears = c.minExperienceYears || 0;

          if (c.applicationDeadline) {
            const d = new Date(c.applicationDeadline);
            if (!isNaN(d.getTime())) {
              this.form.applicationDeadline = d.toISOString().split('T')[0];
            }
          }

          // Parse markdown sections from stored requirements
          const rawText = c.requirements || '';
          const resp = this.extractSection(rawText, 'Responsibilities & Context');
          const reqs = this.extractSection(rawText, 'Educational & Experience Requirements') || this.extractSection(rawText, 'Requirements & Qualifications');
          const comp = this.extractSection(rawText, 'Compensation & Other Benefits');
          const loc = this.extractSection(rawText, 'Job Location');
          const read = this.extractSection(rawText, 'Read Before Apply');
          const emp = this.extractSection(rawText, 'Employment Status');
          const skillsText = this.extractSection(rawText, 'Skills & Expertise');
          const videoText = this.extractSection(rawText, 'Video CV Encouragement');

          this.form.responsibilities = resp || rawText;
          this.form.requirements = reqs || rawText;
          this.form.compensation = comp || '';
          this.form.readBeforeApply = read || '';
          if (loc) this.form.jobLocation = loc;
          if (emp) this.form.employmentStatus = emp;
          if (skillsText) {
            this.form.skills = skillsText.split(',').map(s => s.trim()).filter(Boolean);
          }
          if (videoText) {
            this.form.encourageVideoCv = videoText.toLowerCase().includes('encouraged');
          }
        }
      },
      error: (err) => console.error('Failed to load circular for edit:', err)
    });
  }

  extractSection(content: string, header: string): string {
    if (!content) return '';
    const regex = new RegExp(`### ${header}\\s*\\n([\\s\\S]*?)(?=(?:### |$))`, 'i');
    const match = content.match(regex);
    return match ? match[1].trim() : '';
  }

  onRequisitionSelect() {
    if (!this.form.requisitionId) return;
    const selected = this.approvedRequisitions.find(r => r.id === this.form.requisitionId);
    if (selected) {
      this.form.departmentId = selected.departmentId;
      this.form.designationId = selected.designationId;
      this.form.vacanciesCount = selected.vacanciesCount;
      this.form.title = `${selected.designation?.title || 'Officer'} (${selected.department?.name || 'Operations'})`;
      
      const des = this.designations.find(d => d.id === selected.designationId);
      if (des && des.jobGradeId) {
        this.form.jobGradeId = des.jobGradeId;
      }
    }
  }

  // Skills Management
  addCustomSkill(): void {
    const val = this.skillInput.trim();
    if (val && !this.form.skills.includes(val)) {
      this.form.skills.push(val);
      this.skillInput = '';
    }
  }

  toggleSkill(skill: string): void {
    const idx = this.form.skills.indexOf(skill);
    if (idx >= 0) {
      this.form.skills.splice(idx, 1);
    } else {
      this.form.skills.push(skill);
    }
  }

  removeSkill(index: number): void {
    this.form.skills.splice(index, 1);
  }

  addBenefitTag(tag: string): void {
    if (!this.form.compensation) {
      this.form.compensation = `• ${tag}`;
    } else if (!this.form.compensation.includes(tag)) {
      this.form.compensation += `\n• ${tag}`;
    }
  }

  isStep3Valid(): boolean {
    const hasResp = !!this.form.responsibilities && this.form.responsibilities.trim().length >= 10;
    const hasReq = !!this.form.requirements && this.form.requirements.trim().length >= 10;
    const hasRead = !!this.form.readBeforeApply && this.form.readBeforeApply.trim().length >= 10;
    return hasResp && hasReq && hasRead;
  }

  loadSampleTemplate(): void {
    const roleTitle = this.form.title || 'Officer (Microfinance Operations)';
    this.form.responsibilities = `• Execute daily operations and credit portfolio management for ${roleTitle}.\n• Conduct customer visits, loan appraisals, and ensure 100% adherence to UDDIPAN standard microfinance credit policies.\n• Supervise field groups, maintain timely disbursement & recovery records, and resolve member queries.\n• Prepare daily cash reconciliation and monthly progress summaries for regional supervision.`;
    
    this.form.requirements = `• Bachelor Degree in Business, Economics, Social Sciences, or relevant discipline from a recognized university.\n• Minimum CGPA 2.50 out of 4.00 (or 2nd Class/Division equivalent).\n• Age limit maximum 32 years as on circular deadline date.\n• Strong verbal and written communication skills in Bengali and English.\n• Computer proficiency in MS Office, basic spreadsheets, and email correspondence.\n• Hardworking, honest, and dedicated to rural socio-economic empowerment.`;

    this.form.compensation = `• Monthly salary as per UDDIPAN Job Grade & Pay Scale with initial probation benefits.\n• Two Festival Bonuses per calendar year.\n• Contributory Provident Fund (CPF) and Gratuity as per company rules.\n• Staff Welfare Fund (SWF) medical and benevolent assistance coverage.\n• Mobile phone allowance and field conveyance/travel allowances (TA/DA).\n• Yearly performance increment and career promotion ladder.`;

    this.form.readBeforeApply = `• Eligible and interested candidates must submit their application online through UDDIPAN HRIS portal.\n• Hardcopy applications or direct submissions will NOT be entertained.\n• Any persuasion, lobbying, or submission of false/forged credentials will cause instant cancellation of candidature.\n• Only shortlisted applicants will be notified via SMS and Email for the Written Exam and Viva Board.\n• Selected candidates must produce original academic credentials, certificates, and NID during the Viva Board.\n• UDDIPAN reserves the right to modify vacancy count or cancel the circular without assigning any explanation.`;

    this.form.encourageVideoCv = true;
    if (this.form.skills.length === 0) {
      this.form.skills = ['Microfinance Operations', 'Credit Risk & Appraisal', 'Community Mobilization', 'Loan Accounting'];
    }
  }

  // =========================================================================
  // LOOKUP MODAL CONTROLLERS & CASCADING LOGIC
  // =========================================================================
  openLookup(type: LookupType) {
    this.lookupType = type;
    this.lookupSearch = '';
    this.lookupFilter = 'ALL';
    this.lookupViewMode = 'grid';

    if (type === 'DEPARTMENT') this.tempSelectedId = this.form.departmentId;
    if (type === 'DESIGNATION') this.tempSelectedId = this.form.designationId;
    if (type === 'JOB_GRADE') this.tempSelectedId = this.form.jobGradeId;

    this.showLookupModal = true;
  }

  closeLookup() {
    this.showLookupModal = false;
  }

  confirmDirect(item: any) {
    this.tempSelectedId = item.id;
    this.applyLookup();
  }

  applyLookup() {
    if (!this.tempSelectedId) return;

    if (this.lookupType === 'DEPARTMENT') {
      this.form.departmentId = this.tempSelectedId;
    } else if (this.lookupType === 'DESIGNATION') {
      this.form.designationId = this.tempSelectedId;
      const des = this.designations.find(d => d.id === this.tempSelectedId);
      if (des) {
        if (des.departmentId) this.form.departmentId = des.departmentId;
        if (des.jobGradeId) this.form.jobGradeId = des.jobGradeId;
        if (!this.form.title) this.form.title = des.title;
      }
    } else if (this.lookupType === 'JOB_GRADE') {
      this.form.jobGradeId = this.tempSelectedId;
    }

    this.showLookupModal = false;
  }

  getFilteredLookupItems(): any[] {
    const q = this.lookupSearch.toLowerCase().trim();

    if (this.lookupType === 'DEPARTMENT') {
      return this.departments.filter(d => 
        !q || d.name?.toLowerCase().includes(q) || d.code?.toLowerCase().includes(q)
      );
    }

    if (this.lookupType === 'DESIGNATION') {
      return this.designations.filter(des => {
        const matchesFilter = this.lookupFilter === 'ALL' || des.departmentId === this.lookupFilter;
        const matchesSearch = !q || des.title?.toLowerCase().includes(q) || des.code?.toLowerCase().includes(q);
        return matchesFilter && matchesSearch;
      });
    }

    if (this.lookupType === 'JOB_GRADE') {
      return this.jobGrades.filter(g => 
        !q || g.gradeCode?.toLowerCase().includes(q) || String(g.level).includes(q)
      );
    }

    return [];
  }

  getLookupModalTitle(): string {
    if (this.lookupType === 'DEPARTMENT') return 'Select Department (ডিপার্টমেন্ট নির্বাচন)';
    if (this.lookupType === 'DESIGNATION') return 'Select Designation (পদবী নির্বাচন)';
    if (this.lookupType === 'JOB_GRADE') return 'Select Job Grade & Pay Scale (গ্রেড নির্বাচন)';
    return 'Entity Selection';
  }

  getTempSelectedItemName(): string {
    if (!this.tempSelectedId) return '';
    if (this.lookupType === 'DEPARTMENT') {
      return this.departments.find(d => d.id === this.tempSelectedId)?.name || '';
    }
    if (this.lookupType === 'DESIGNATION') {
      return this.designations.find(d => d.id === this.tempSelectedId)?.title || '';
    }
    if (this.lookupType === 'JOB_GRADE') {
      const g = this.jobGrades.find(g => g.id === this.tempSelectedId);
      return g ? `${g.gradeCode} (Level ${g.level})` : '';
    }
    return '';
  }

  // Display Helpers for Form UI
  getSelectedDepartmentName(): string {
    return this.departments.find(d => d.id === this.form.departmentId)?.name || '';
  }

  getSelectedDesignationTitle(): string {
    return this.designations.find(d => d.id === this.form.designationId)?.title || '';
  }

  getSelectedJobGradeCode(): string {
    const g = this.jobGrades.find(g => g.id === this.form.jobGradeId);
    return g ? `${g.gradeCode} (Lvl ${g.level})` : '';
  }

  getDepartmentName(): string {
    const dept = this.departments.find(d => d.id === this.form.departmentId);
    return dept ? dept.name : 'Department of Microfinance Operations';
  }

  getDepartmentNameById(deptId: string): string {
    return this.departments.find(d => d.id === deptId)?.name || 'General Operations';
  }

  getGradeSalaryPreview(): string {
    const g = this.jobGrades.find(g => g.id === this.form.jobGradeId);
    if (!g) return 'Grade-08 (৳18,000 - 32,000)';
    return `${g.gradeCode} (৳ ${Number(g.minSalary).toLocaleString()} - ${Number(g.maxSalary).toLocaleString()})`;
  }

  formatPreviewDeadline(val: string): string {
    if (!val) return 'Open / Not Set';
    try {
      const parts = val.split('-');
      if (parts.length === 3) {
        const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
        if (!isNaN(d.getTime())) {
          return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric', weekday: 'short' });
        }
      }
    } catch (_) {}
    return val;
  }

  submitCircular() {
    this.isSubmitting = true;

    const skillsSection = this.form.skills && this.form.skills.length > 0 
      ? this.form.skills.join(', ') 
      : 'General Competencies';

    const videoSection = this.form.encourageVideoCv 
      ? 'Applicants are encouraged to submit a 1-2 minute Video CV self-introduction link (YouTube/Drive/Loom).' 
      : 'Standard CV Submission.';

    const combinedRequirements = [
      `### Employment Status\n${this.form.employmentStatus || 'Full-time'}`,
      `### Skills & Expertise\n${skillsSection}`,
      `### Video CV Encouragement\n${videoSection}`,
      `### Responsibilities & Context\n${(this.form.responsibilities || '').trim()}`,
      `### Educational & Experience Requirements\n${(this.form.requirements || '').trim()}`,
      `### Compensation & Other Benefits\n${this.form.compensation ? this.form.compensation.trim() : 'As per UDDIPAN HR Policy & Pay Scale'}`,
      `### Job Location\n${(this.form.jobLocation || 'Anywhere in Bangladesh').trim()}`,
      `### Read Before Apply\n${(this.form.readBeforeApply || '').trim()}`
    ].join('\n\n');

    const payload: any = {
      title: this.form.title,
      departmentId: this.form.departmentId,
      designationId: this.form.designationId,
      jobGradeId: this.form.jobGradeId,
      vacanciesCount: Number(this.form.vacanciesCount),
      applicationDeadline: this.form.applicationDeadline,
      requirements: combinedRequirements,
      requisitionId: this.form.requisitionId || undefined,
      minDegree: this.form.minDegree,
      minCgpa: Number(this.form.minCgpa),
      maxAge: Number(this.form.maxAge),
      minExperienceYears: Number(this.form.minExperienceYears),
    };

    if (this.isEditMode) {
      payload.status = this.form.status;
      this.http.put<any>(`/api/v1/recruitment/circulars/${this.circularId}`, payload).subscribe({
        next: (res) => {
          this.isSubmitting = false;
          alert(`Job Circular ${res.data?.circularNo || ''} has been updated successfully.`);
          this.router.navigate(['/recruitment'], { queryParams: { tab: 'circulars' } });
        },
        error: (err) => {
          this.isSubmitting = false;
          alert('Failed to update circular: ' + (err.error?.message || err.message));
        }
      });
    } else {
      this.http.post<any>('/api/v1/recruitment/circulars', payload).subscribe({
        next: (res) => {
          this.isSubmitting = false;
          alert(`Job Circular ${res.data?.circularNo || ''} has been created and published successfully.`);
          this.router.navigate(['/recruitment'], { queryParams: { tab: 'circulars' } });
        },
        error: (err) => {
          this.isSubmitting = false;
          alert('Failed to publish circular: ' + (err.error?.message || err.message));
        }
      });
    }
  }

  cancel() {
    this.router.navigate(['/recruitment'], { queryParams: { tab: 'circulars' } });
  }
}
