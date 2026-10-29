import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';

export type SettingsTab = 'company' | 'departments' | 'designations' | 'job-grades' | 'zones' | 'branches';

@Component({
  selector: 'app-general-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6 max-w-7xl mx-auto">
      <!-- Notification Banner -->
      <div *ngIf="notification" class="p-3.5 rounded-xl border flex items-center justify-between text-xs transition-all shadow-md"
        [ngClass]="notification.type === 'success' ? 'bg-emerald-950/80 border-emerald-800 text-emerald-200' : 'bg-red-950/80 border-red-800 text-red-200'">
        <div class="flex items-center gap-2">
          <span class="font-bold">{{ notification.type === 'success' ? '✓' : '!' }}</span>
          <span>{{ notification.message }}</span>
        </div>
        <button (click)="notification = null" class="text-slate-400 hover:text-slate-200 text-xs">✕</button>
      </div>

      <!-- Title & Actions Header -->
      <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div class="flex items-center gap-2">
            <span class="px-2 py-0.5 rounded bg-blue-950 text-blue-400 font-mono text-xs border border-blue-800 uppercase font-semibold">
              GENERAL SETTINGS MASTER
            </span>
            <h2 class="text-xl font-bold text-slate-100">Hierarchy & Geographical Infrastructure</h2>
          </div>
          <p class="text-xs text-slate-400 mt-1">
            Complete CRUD management for corporate departments, job designations, salary grades, operational zones, and branch network.
          </p>
        </div>

        <div class="flex items-center gap-2">
          <button (click)="openCreateModal()" class="px-4 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors shadow-md flex items-center gap-1.5">
            <span class="text-sm font-bold">+</span>
            <span>New {{ getCreateButtonLabel() }}</span>
          </button>
        </div>
      </div>

      <!-- Navigation Tabs & Toolbar -->
      <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-3">
        <!-- Tabs -->
        <div class="flex items-center gap-1 text-xs font-medium bg-slate-900 border border-slate-800 p-1 rounded-xl overflow-x-auto">
          <button 
            (click)="setTab('company')"
            [ngClass]="activeTab === 'company' ? 'bg-emerald-600 text-white font-bold shadow' : 'text-slate-400 hover:text-slate-200'"
            class="px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap">
            <span>Company</span>
            <span class="px-1.5 py-0.2 rounded text-[10px]" [ngClass]="activeTab === 'company' ? 'bg-emerald-700 text-white' : 'bg-slate-800 text-slate-400'">
              {{ companies.length }}
            </span>
          </button>

          <button 
            (click)="setTab('departments')"
            [ngClass]="activeTab === 'departments' ? 'bg-emerald-600 text-white font-bold shadow' : 'text-slate-400 hover:text-slate-200'"
            class="px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap">
            <span>Departments</span>
            <span class="px-1.5 py-0.2 rounded text-[10px]" [ngClass]="activeTab === 'departments' ? 'bg-emerald-700 text-white' : 'bg-slate-800 text-slate-400'">
              {{ departments.length }}
            </span>
          </button>

          <button 
            (click)="setTab('designations')"
            [ngClass]="activeTab === 'designations' ? 'bg-emerald-600 text-white font-bold shadow' : 'text-slate-400 hover:text-slate-200'"
            class="px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap">
            <span>Designations</span>
            <span class="px-1.5 py-0.2 rounded text-[10px]" [ngClass]="activeTab === 'designations' ? 'bg-emerald-700 text-white' : 'bg-slate-800 text-slate-400'">
              {{ designations.length }}
            </span>
          </button>

          <button 
            (click)="setTab('job-grades')"
            [ngClass]="activeTab === 'job-grades' ? 'bg-emerald-600 text-white font-bold shadow' : 'text-slate-400 hover:text-slate-200'"
            class="px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap">
            <span>Job Grades</span>
            <span class="px-1.5 py-0.2 rounded text-[10px]" [ngClass]="activeTab === 'job-grades' ? 'bg-emerald-700 text-white' : 'bg-slate-800 text-slate-400'">
              {{ jobGrades.length }}
            </span>
          </button>

          <button 
            (click)="setTab('zones')"
            [ngClass]="activeTab === 'zones' ? 'bg-emerald-600 text-white font-bold shadow' : 'text-slate-400 hover:text-slate-200'"
            class="px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap">
            <span>Zones</span>
            <span class="px-1.5 py-0.2 rounded text-[10px]" [ngClass]="activeTab === 'zones' ? 'bg-emerald-700 text-white' : 'bg-slate-800 text-slate-400'">
              {{ zones.length }}
            </span>
          </button>

          <button 
            (click)="setTab('branches')"
            [ngClass]="activeTab === 'branches' ? 'bg-emerald-600 text-white font-bold shadow' : 'text-slate-400 hover:text-slate-200'"
            class="px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap">
            <span>Branches (Zone-Wise)</span>
            <span class="px-1.5 py-0.2 rounded text-[10px]" [ngClass]="activeTab === 'branches' ? 'bg-emerald-700 text-white' : 'bg-slate-800 text-slate-400'">
              {{ branches.length }}
            </span>
          </button>
        </div>

        <!-- Search Bar, Company Scope Filter & View Mode Toggle -->
        <div class="flex flex-wrap items-center gap-2.5">
          <!-- Company Scope Filter -->
          <div class="flex items-center gap-1.5 text-xs bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1">
            <span class="text-slate-400 text-[10px] font-mono uppercase whitespace-nowrap">Company:</span>
            <select 
              [(ngModel)]="companyFilter" 
              (change)="onCompanyFilterChange()"
              class="bg-slate-950 border border-slate-800 text-emerald-400 font-semibold rounded px-2 py-0.5 text-xs focus:border-emerald-500 focus:outline-none max-w-[170px] truncate">
              <option value="ALL">All Companies</option>
              <option *ngFor="let c of companies" [value]="c.id">{{ c.code }}</option>
            </select>
          </div>

          <div class="relative w-56">
            <span class="absolute left-3 top-2 text-slate-500 text-xs">🔍</span>
            <input 
              type="text" 
              [(ngModel)]="searchQuery" 
              placeholder="Search code, name, location..." 
              class="w-full bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none" />
            <button *ngIf="searchQuery" (click)="searchQuery = ''" class="absolute right-2.5 top-2 text-xs text-slate-500 hover:text-slate-300">
              ✕
            </button>
          </div>

          <div class="bg-slate-900 border border-slate-800 rounded-lg p-0.5 flex text-xs shrink-0">
            <button 
              (click)="viewMode = 'grid'" 
              [ngClass]="viewMode === 'grid' ? 'bg-slate-800 text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'"
              class="px-2.5 py-1 rounded transition-colors" title="Grid View">
              ⊞ Grid
            </button>
            <button 
              (click)="viewMode = 'table'" 
              [ngClass]="viewMode === 'table' ? 'bg-slate-800 text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'"
              class="px-2.5 py-1 rounded transition-colors" title="Table View">
              ☰ Table
            </button>
          </div>
        </div>
      </div>

      <!-- Quick Filter Chips: When in Designations Tab -->
      <div *ngIf="activeTab === 'designations'" class="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        <span class="text-slate-500 text-[11px] font-medium">Department:</span>
        <button 
          (click)="deptFilter = 'ALL'"
          [ngClass]="deptFilter === 'ALL' ? 'bg-emerald-500 text-slate-950 font-bold' : 'bg-slate-900 text-slate-400 border border-slate-800'"
          class="px-2.5 py-0.5 rounded-full text-[11px] transition-colors whitespace-nowrap">
          All ({{ designations.length }})
        </button>
        <button 
          *ngFor="let d of departments"
          (click)="deptFilter = d.id"
          [ngClass]="deptFilter === d.id ? 'bg-emerald-500 text-slate-950 font-bold' : 'bg-slate-900 text-slate-400 border border-slate-800'"
          class="px-2.5 py-0.5 rounded-full text-[11px] transition-colors whitespace-nowrap">
          {{ d.name }}
        </button>
      </div>

      <!-- Quick Filter Chips: When in Branches Tab (Zone-Wise Filter) -->
      <div *ngIf="activeTab === 'branches'" class="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        <span class="text-slate-500 text-[11px] font-medium">Zone Filter:</span>
        <button 
          (click)="zoneFilter = 'ALL'"
          [ngClass]="zoneFilter === 'ALL' ? 'bg-emerald-500 text-slate-950 font-bold' : 'bg-slate-900 text-slate-400 border border-slate-800'"
          class="px-2.5 py-0.5 rounded-full text-[11px] transition-colors whitespace-nowrap">
          All Zones ({{ branches.length }})
        </button>
        <button 
          *ngFor="let z of zones"
          (click)="zoneFilter = z.id"
          [ngClass]="zoneFilter === z.id ? 'bg-emerald-500 text-slate-950 font-bold' : 'bg-slate-900 text-slate-400 border border-slate-800'"
          class="px-2.5 py-0.5 rounded-full text-[11px] transition-colors whitespace-nowrap">
          {{ z.name }}
        </button>
      </div>

      <!-- =================================================================== -->
      <!-- TAB CONTENT: COMPANY -->
      <!-- =================================================================== -->
      <div *ngIf="activeTab === 'company'">
        <div *ngIf="viewMode === 'grid'" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div *ngFor="let c of getFilteredCompanies()" class="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl p-4 transition-all hover:shadow-lg flex flex-col justify-between group">
            <div>
              <div class="flex items-center justify-between">
                <span class="px-2 py-0.5 rounded bg-slate-950 text-emerald-400 font-mono text-[10px] border border-slate-800 font-bold">
                  {{ c.code }}
                </span>
                <span class="text-[10px] px-2 py-0.5 rounded bg-blue-950/60 text-blue-300 border border-blue-800 font-mono">
                  ENTERPRISE ROOT
                </span>
              </div>
              <h4 class="text-sm font-bold text-slate-100 mt-2.5 group-hover:text-emerald-300 transition-colors">
                {{ c.name }}
              </h4>
              <p class="text-xs text-slate-400 mt-1">
                {{ c.address || 'Address not registered' }}
              </p>

              <div class="mt-3 flex flex-wrap gap-1.5 text-[10px]">
                <span *ngIf="c.phone" class="px-2 py-0.5 rounded bg-slate-950 text-slate-300 border border-slate-800 font-mono">
                  Tel: {{ c.phone }}
                </span>
                <span *ngIf="c.email" class="px-2 py-0.5 rounded bg-slate-950 text-slate-300 border border-slate-800 font-mono">
                  Email: {{ c.email }}
                </span>
              </div>
            </div>

            <div class="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
              <div class="flex items-center gap-2 text-slate-500 text-[11px] font-mono">
                <span>{{ c._count?.zones ?? getCompanyZones(c.id).length }} Zones</span>
                <span>•</span>
                <span>{{ c._count?.departments ?? getCompanyDepartments(c.id).length }} Depts</span>
              </div>
              <div class="flex items-center gap-2">
                <button (click)="toggleCompanyExpand(c.id)" class="text-blue-400 hover:text-blue-300 font-medium text-[11px]">
                  {{ expandedCompanyId === c.id ? 'Hide Tree' : 'Org Tree' }}
                </button>
                <span class="text-slate-700">|</span>
                <button (click)="openEditModal('COMPANY', c)" class="text-emerald-400 hover:text-emerald-300 font-medium text-[11px]">
                  Edit
                </button>
                <span class="text-slate-700">|</span>
                <button (click)="openDeleteConfirm('COMPANY', c)" class="text-red-400 hover:text-red-300 font-medium text-[11px]">
                  Delete
                </button>
              </div>
            </div>

            <!-- Company-Wise Organizational Tree -->
            <div *ngIf="expandedCompanyId === c.id" class="mt-3 pt-3 border-t border-slate-800/80 space-y-3">
              <div class="text-[11px] font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
                <span>Structure: {{ c.name }}</span>
                <span class="text-[10px] text-emerald-400">Company-Scoped Alls</span>
              </div>

              <!-- Geographical: Zones & Branches -->
              <div class="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800">
                <div class="text-[11px] font-bold text-emerald-400 mb-1.5 flex items-center justify-between">
                  <span>Geographical Network (Zones & Branches)</span>
                  <span class="text-[10px] text-slate-500 font-mono">{{ getCompanyBranches(c.id).length }} Branches Total</span>
                </div>
                <div *ngIf="getCompanyZones(c.id).length === 0" class="text-slate-500 text-[10px]">No zones linked to this company.</div>
                <div *ngFor="let z of getCompanyZones(c.id)" class="mb-2 last:mb-0 border-l border-emerald-900/60 pl-2">
                  <div class="text-[11px] font-semibold text-slate-200">
                    <span class="font-mono text-emerald-400">{{ z.code }}</span> &mdash; {{ z.name }}
                  </div>
                  <div class="flex flex-wrap gap-1 mt-1">
                    <span *ngFor="let b of getBranchesForZone(z.id)" class="px-1.5 py-0.5 rounded text-[10px] bg-slate-900 text-slate-300 border border-slate-800">
                      {{ b.code }} ({{ b.name }})
                    </span>
                    <span *ngIf="getBranchesForZone(z.id).length === 0" class="text-slate-600 text-[10px]">No branches in zone</span>
                  </div>
                </div>
              </div>

              <!-- Functional: Departments & Designations & Grades -->
              <div class="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800">
                <div class="text-[11px] font-bold text-blue-400 mb-1.5 flex items-center justify-between">
                  <span>Corporate Units (Departments & Roles)</span>
                  <span class="text-[10px] text-slate-500 font-mono">{{ getCompanyDesignations(c.id).length }} Designations Total</span>
                </div>
                <div *ngIf="getCompanyDepartments(c.id).length === 0" class="text-slate-500 text-[10px]">No departments linked to this company.</div>
                <div *ngFor="let d of getCompanyDepartments(c.id)" class="mb-2 last:mb-0 border-l border-blue-900/60 pl-2">
                  <div class="text-[11px] font-semibold text-slate-200">
                    <span class="font-mono text-blue-400">{{ d.code }}</span> &mdash; {{ d.name }}
                  </div>
                  <div class="flex flex-wrap gap-1 mt-1">
                    <span *ngFor="let des of getDesignationsForDept(d.id)" class="px-1.5 py-0.5 rounded text-[10px] bg-slate-900 text-slate-300 border border-slate-800">
                      {{ des.title }} <span *ngIf="des.jobGrade?.gradeCode" class="text-purple-400 font-mono text-[9px]">[{{ des.jobGrade.gradeCode }}]</span>
                    </span>
                    <span *ngIf="getDesignationsForDept(d.id).length === 0" class="text-slate-600 text-[10px]">No designations</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div *ngIf="viewMode === 'table'" class="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <table class="w-full text-left text-xs text-slate-300">
            <thead class="bg-slate-950 text-slate-400 font-mono text-[10px] uppercase border-b border-slate-800">
              <tr>
                <th class="p-3">Entity Code</th>
                <th class="p-3">Company / Org Name</th>
                <th class="p-3">Headquarters Address</th>
                <th class="p-3">Contact Information</th>
                <th class="p-3">Zones & Depts</th>
                <th class="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-800">
              <tr *ngFor="let c of getFilteredCompanies()" class="hover:bg-slate-800/40 transition-colors">
                <td class="p-3 font-mono text-emerald-400 font-bold">{{ c.code }}</td>
                <td class="p-3 font-semibold text-slate-100">{{ c.name }}</td>
                <td class="p-3 text-slate-300">{{ c.address || '—' }}</td>
                <td class="p-3 text-slate-400 font-mono text-[11px]">
                  <div>{{ c.phone || '—' }}</div>
                  <div class="text-slate-500">{{ c.email || '—' }}</div>
                </td>
                <td class="p-3 text-slate-400 font-mono text-[11px]">
                  <span class="text-emerald-400 font-bold">{{ c._count?.zones ?? zones.length }}</span> Zones /
                  <span class="text-blue-400 font-bold">{{ c._count?.departments ?? departments.length }}</span> Depts
                </td>
                <td class="p-3 text-right">
                  <div class="flex items-center justify-end gap-1.5">
                    <button (click)="openEditModal('COMPANY', c)" class="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] transition-colors">
                      Edit
                    </button>
                    <button (click)="openDeleteConfirm('COMPANY', c)" class="px-2.5 py-1 rounded bg-red-950/40 hover:bg-red-900/60 text-red-300 border border-red-800/50 text-[11px] transition-colors">
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- =================================================================== -->
      <!-- TAB CONTENT: DEPARTMENTS -->
      <!-- =================================================================== -->
      <div *ngIf="activeTab === 'departments'">
        <div *ngIf="viewMode === 'grid'" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div *ngFor="let d of getFilteredDepartments()" class="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl p-4 transition-all hover:shadow-lg flex flex-col justify-between group">
            <div>
              <div class="flex items-center justify-between">
                <span class="px-2 py-0.5 rounded bg-slate-950 text-emerald-400 font-mono text-[10px] border border-slate-800 font-bold">
                  {{ d.code }}
                </span>
                <span class="text-[10px] text-slate-500 font-mono">UDDIPAN HO</span>
              </div>
              <h4 class="text-sm font-bold text-slate-100 mt-2.5 group-hover:text-emerald-300 transition-colors">
                {{ d.name }}
              </h4>
              <p class="text-xs text-slate-400 mt-1">Core Operational Division</p>
            </div>
            <div class="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
              <span class="text-slate-500 text-[11px]">
                {{ d._count?.designations || getDesignationCount(d.id) }} Designations
              </span>
              <div class="flex items-center gap-2">
                <button (click)="openEditModal('DEPARTMENT', d)" class="text-emerald-400 hover:text-emerald-300 font-medium text-[11px]">
                  Edit
                </button>
                <span class="text-slate-700">|</span>
                <button (click)="openDeleteConfirm('DEPARTMENT', d)" class="text-red-400 hover:text-red-300 font-medium text-[11px]">
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>

        <div *ngIf="viewMode === 'table'" class="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <table class="w-full text-left text-xs text-slate-300">
            <thead class="bg-slate-950 text-slate-400 font-mono text-[10px] uppercase border-b border-slate-800">
              <tr>
                <th class="p-3">Dept Code</th>
                <th class="p-3">Department Name</th>
                <th class="p-3">Total Designations</th>
                <th class="p-3">Company</th>
                <th class="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-800">
              <tr *ngFor="let d of getFilteredDepartments()" class="hover:bg-slate-800/40 transition-colors">
                <td class="p-3 font-mono text-emerald-400 font-bold">{{ d.code }}</td>
                <td class="p-3 font-semibold text-slate-100">{{ d.name }}</td>
                <td class="p-3 text-slate-400">{{ d._count?.designations || getDesignationCount(d.id) }} Posts</td>
                <td class="p-3 text-slate-400 font-mono text-[11px]">UDDIPAN</td>
                <td class="p-3 text-right">
                  <div class="flex items-center justify-end gap-1.5">
                    <button (click)="openEditModal('DEPARTMENT', d)" class="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] transition-colors">
                      Edit
                    </button>
                    <button (click)="openDeleteConfirm('DEPARTMENT', d)" class="px-2.5 py-1 rounded bg-red-950/40 hover:bg-red-900/60 text-red-300 border border-red-800/50 text-[11px] transition-colors">
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- =================================================================== -->
      <!-- TAB CONTENT: DESIGNATIONS -->
      <!-- =================================================================== -->
      <div *ngIf="activeTab === 'designations'">
        <div *ngIf="viewMode === 'grid'" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div *ngFor="let des of getFilteredDesignations()" class="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl p-4 transition-all hover:shadow-lg flex flex-col justify-between group">
            <div>
              <div class="flex items-center justify-between">
                <span class="px-2 py-0.5 rounded bg-slate-950 text-emerald-400 font-mono text-[10px] border border-slate-800 font-bold">
                  {{ des.code }}
                </span>
                <span class="text-[10px] px-2 py-0.5 rounded bg-purple-950/60 text-purple-300 border border-purple-800 font-mono">
                  {{ des.jobGrade?.gradeCode || 'Grade N/A' }}
                </span>
              </div>
              <h4 class="text-sm font-bold text-slate-100 mt-2.5 group-hover:text-emerald-300 transition-colors">
                {{ des.title }}
              </h4>
              <p class="text-xs text-slate-400 mt-1">
                {{ des.department?.name || getDepartmentNameById(des.departmentId) }}
              </p>
            </div>
            <div class="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
              <span class="text-emerald-400 font-mono text-[11px]">
                ৳ {{ (des.jobGrade?.minSalary | number) || '15,000' }} - {{ (des.jobGrade?.maxSalary | number) || '30,000' }}
              </span>
              <div class="flex items-center gap-2">
                <button (click)="openEditModal('DESIGNATION', des)" class="text-emerald-400 hover:text-emerald-300 font-medium text-[11px]">
                  Edit
                </button>
                <span class="text-slate-700">|</span>
                <button (click)="openDeleteConfirm('DESIGNATION', des)" class="text-red-400 hover:text-red-300 font-medium text-[11px]">
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>

        <div *ngIf="viewMode === 'table'" class="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <table class="w-full text-left text-xs text-slate-300">
            <thead class="bg-slate-950 text-slate-400 font-mono text-[10px] uppercase border-b border-slate-800">
              <tr>
                <th class="p-3">Designation Code</th>
                <th class="p-3">Official Title</th>
                <th class="p-3">Assigned Department</th>
                <th class="p-3">Pay Scale / Grade</th>
                <th class="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-800">
              <tr *ngFor="let des of getFilteredDesignations()" class="hover:bg-slate-800/40 transition-colors">
                <td class="p-3 font-mono text-emerald-400 font-bold">{{ des.code }}</td>
                <td class="p-3 font-semibold text-slate-100">{{ des.title }}</td>
                <td class="p-3 text-slate-300">{{ des.department?.name || getDepartmentNameById(des.departmentId) }}</td>
                <td class="p-3 font-mono text-purple-300">
                  {{ des.jobGrade?.gradeCode || 'Grade 08' }} 
                  <span class="text-slate-500 text-[10px]">(৳ {{ (des.jobGrade?.minSalary | number) || '18,000' }})</span>
                </td>
                <td class="p-3 text-right">
                  <div class="flex items-center justify-end gap-1.5">
                    <button (click)="openEditModal('DESIGNATION', des)" class="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] transition-colors">
                      Edit
                    </button>
                    <button (click)="openDeleteConfirm('DESIGNATION', des)" class="px-2.5 py-1 rounded bg-red-950/40 hover:bg-red-900/60 text-red-300 border border-red-800/50 text-[11px] transition-colors">
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- =================================================================== -->
      <!-- TAB CONTENT: JOB GRADES -->
      <!-- =================================================================== -->
      <div *ngIf="activeTab === 'job-grades'">
        <div *ngIf="viewMode === 'grid'" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div *ngFor="let g of getFilteredJobGrades()" class="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl p-4 transition-all hover:shadow-lg flex flex-col justify-between group">
            <div>
              <div class="flex items-center justify-between">
                <span class="px-2 py-0.5 rounded bg-slate-950 text-purple-400 font-mono text-[10px] border border-slate-800 font-bold">
                  {{ g.gradeCode }}
                </span>
                <span class="text-[10px] font-mono text-slate-400">Level {{ g.level }}</span>
              </div>
              <h4 class="text-base font-bold text-slate-100 mt-2.5 group-hover:text-purple-300 transition-colors">
                Pay Band: {{ g.gradeCode }}
              </h4>
              <p class="text-xs text-slate-400 mt-1">Salary Range Bracket</p>
              <div class="mt-2 text-sm font-mono font-bold text-emerald-400">
                ৳ {{ g.minSalary | number }} &mdash; ৳ {{ g.maxSalary | number }}
              </div>
            </div>
            <div class="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
              <span class="text-slate-500 text-[11px]">{{ g._count?.designations || 0 }} Associated Titles</span>
              <div class="flex items-center gap-2">
                <button (click)="openEditModal('JOB_GRADE', g)" class="text-purple-400 hover:text-purple-300 font-medium text-[11px]">
                  Edit Scale
                </button>
                <span class="text-slate-700">|</span>
                <button (click)="openDeleteConfirm('JOB_GRADE', g)" class="text-red-400 hover:text-red-300 font-medium text-[11px]">
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>

        <div *ngIf="viewMode === 'table'" class="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <table class="w-full text-left text-xs text-slate-300">
            <thead class="bg-slate-950 text-slate-400 font-mono text-[10px] uppercase border-b border-slate-800">
              <tr>
                <th class="p-3">Grade Code</th>
                <th class="p-3">Hierarchy Level</th>
                <th class="p-3">Minimum Salary (৳)</th>
                <th class="p-3">Maximum Salary (৳)</th>
                <th class="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-800">
              <tr *ngFor="let g of getFilteredJobGrades()" class="hover:bg-slate-800/40 transition-colors">
                <td class="p-3 font-mono text-purple-300 font-bold">{{ g.gradeCode }}</td>
                <td class="p-3 text-slate-200 font-semibold">Level {{ g.level }}</td>
                <td class="p-3 font-mono text-emerald-400">৳ {{ g.minSalary | number }}</td>
                <td class="p-3 font-mono text-emerald-400">৳ {{ g.maxSalary | number }}</td>
                <td class="p-3 text-right">
                  <div class="flex items-center justify-end gap-1.5">
                    <button (click)="openEditModal('JOB_GRADE', g)" class="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] transition-colors">
                      Edit
                    </button>
                    <button (click)="openDeleteConfirm('JOB_GRADE', g)" class="px-2.5 py-1 rounded bg-red-950/40 hover:bg-red-900/60 text-red-300 border border-red-800/50 text-[11px] transition-colors">
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- =================================================================== -->
      <!-- TAB CONTENT: ZONES -->
      <!-- =================================================================== -->
      <div *ngIf="activeTab === 'zones'">
        <div *ngIf="viewMode === 'grid'" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div *ngFor="let z of getFilteredZones()" class="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl p-4 transition-all hover:shadow-lg flex flex-col justify-between group">
            <div>
              <div class="flex items-center justify-between">
                <span class="px-2 py-0.5 rounded bg-slate-950 text-blue-400 font-mono text-[10px] border border-slate-800 font-bold">
                  {{ z.code }}
                </span>
                <span class="text-[10px] text-slate-500 font-mono">REGIONAL HQ</span>
              </div>
              <h4 class="text-sm font-bold text-slate-100 mt-2.5 group-hover:text-blue-300 transition-colors">
                {{ z.name }}
              </h4>
              <p class="text-xs text-slate-400 mt-1">Geographic Operational Zone</p>
            </div>
            <div class="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
              <span class="text-slate-500 text-[11px]">
                {{ z._count?.branches || getBranchCountByZone(z.id) }} Network Branches
              </span>
              <div class="flex items-center gap-2">
                <button (click)="openEditModal('ZONE', z)" class="text-blue-400 hover:text-blue-300 font-medium text-[11px]">
                  Edit
                </button>
                <span class="text-slate-700">|</span>
                <button (click)="openDeleteConfirm('ZONE', z)" class="text-red-400 hover:text-red-300 font-medium text-[11px]">
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>

        <div *ngIf="viewMode === 'table'" class="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <table class="w-full text-left text-xs text-slate-300">
            <thead class="bg-slate-950 text-slate-400 font-mono text-[10px] uppercase border-b border-slate-800">
              <tr>
                <th class="p-3">Zone Code</th>
                <th class="p-3">Operational Zone Name</th>
                <th class="p-3">Total Branches</th>
                <th class="p-3">Company</th>
                <th class="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-800">
              <tr *ngFor="let z of getFilteredZones()" class="hover:bg-slate-800/40 transition-colors">
                <td class="p-3 font-mono text-blue-400 font-bold">{{ z.code }}</td>
                <td class="p-3 font-semibold text-slate-100">{{ z.name }}</td>
                <td class="p-3 text-slate-400">{{ z._count?.branches || getBranchCountByZone(z.id) }} Branches</td>
                <td class="p-3 text-slate-400 font-mono text-[11px]">UDDIPAN</td>
                <td class="p-3 text-right">
                  <div class="flex items-center justify-end gap-1.5">
                    <button (click)="openEditModal('ZONE', z)" class="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] transition-colors">
                      Edit
                    </button>
                    <button (click)="openDeleteConfirm('ZONE', z)" class="px-2.5 py-1 rounded bg-red-950/40 hover:bg-red-900/60 text-red-300 border border-red-800/50 text-[11px] transition-colors">
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- =================================================================== -->
      <!-- TAB CONTENT: BRANCHES  -->
      <!-- =================================================================== -->
      <div *ngIf="activeTab === 'branches'">
        <div *ngIf="viewMode === 'grid'" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div *ngFor="let b of getFilteredBranches()" class="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl p-4 transition-all hover:shadow-lg flex flex-col justify-between group">
            <div>
              <div class="flex items-center justify-between">
                <span class="px-2 py-0.5 rounded bg-slate-950 text-emerald-400 font-mono text-[10px] border border-slate-800 font-bold">
                  {{ b.code }}
                </span>
                <span 
                  [ngClass]="b.type === 'RURAL' ? 'bg-amber-950/60 text-amber-400 border-amber-800' : 'bg-emerald-950/60 text-emerald-400 border-emerald-800'"
                  class="text-[10px] px-2 py-0.5 rounded border font-mono">
                  {{ b.type || 'URBAN' }}
                </span>
              </div>
              <h4 class="text-sm font-bold text-slate-100 mt-2.5 group-hover:text-emerald-300 transition-colors">
                {{ b.name }}
              </h4>
              <p class="text-xs text-slate-400 mt-1">
                Zone: <span class="text-slate-200 font-medium">{{ b.zone?.name || getZoneNameById(b.zoneId) }}</span>
              </p>
              <p *ngIf="b.address" class="text-[11px] text-slate-500 mt-1 truncate">
                📍 {{ b.address }}
              </p>
            </div>

            <div class="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
              <span class="text-slate-500 text-[11px]">
                {{ b._count?.users || 0 }} Stationed Staff
              </span>
              <div class="flex items-center gap-2">
                <button (click)="openEditModal('BRANCH', b)" class="text-emerald-400 hover:text-emerald-300 font-medium text-[11px]">
                  Edit
                </button>
                <span class="text-slate-700">|</span>
                <button (click)="openDeleteConfirm('BRANCH', b)" class="text-red-400 hover:text-red-300 font-medium text-[11px]">
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>

        <div *ngIf="viewMode === 'table'" class="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <table class="w-full text-left text-xs text-slate-300">
            <thead class="bg-slate-950 text-slate-400 font-mono text-[10px] uppercase border-b border-slate-800">
              <tr>
                <th class="p-3">Branch Code</th>
                <th class="p-3">Branch Name</th>
                <th class="p-3">Zone</th>
                <th class="p-3">Area Type</th>
                <th class="p-3">Address</th>
                <th class="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-800">
              <tr *ngFor="let b of getFilteredBranches()" class="hover:bg-slate-800/40 transition-colors">
                <td class="p-3 font-mono text-emerald-400 font-bold">{{ b.code }}</td>
                <td class="p-3 font-semibold text-slate-100">{{ b.name }}</td>
                <td class="p-3 text-slate-200">{{ b.zone?.name || getZoneNameById(b.zoneId) }}</td>
                <td class="p-3">
                  <span 
                    [ngClass]="b.type === 'RURAL' ? 'bg-amber-950/60 text-amber-400 border-amber-800' : 'bg-emerald-950/60 text-emerald-400 border-emerald-800'"
                    class="text-[10px] px-2 py-0.5 rounded border font-mono">
                    {{ b.type }}
                  </span>
                </td>
                <td class="p-3 text-slate-400 text-[11px] truncate max-w-xs">{{ b.address || 'Standard Uddipan Branch Office' }}</td>
                <td class="p-3 text-right">
                  <div class="flex items-center justify-end gap-1.5">
                    <button (click)="openEditModal('BRANCH', b)" class="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] transition-colors">
                      Edit
                    </button>
                    <button (click)="openDeleteConfirm('BRANCH', b)" class="px-2.5 py-1 rounded bg-red-950/40 hover:bg-red-900/60 text-red-300 border border-red-800/50 text-[11px] transition-colors">
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- =================================================================== -->
      <!-- MODAL POPUP: CREATE OR EDIT ENTITY -->
      <!-- =================================================================== -->
      <div *ngIf="showModal" class="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div class="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden flex flex-col animate-in fade-in duration-150">
          
          <!-- Modal Header -->
          <div class="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
            <div>
              <span class="text-[10px] font-mono font-bold uppercase" [ngClass]="isEditMode ? 'text-blue-400' : 'text-emerald-400'">
                {{ isEditMode ? 'EDIT MASTER RECORD' : 'CREATE NEW RECORD' }}
              </span>
              <h3 class="text-base font-bold text-slate-100">
                {{ modalTitle }}
              </h3>
            </div>
            <button (click)="closeModal()" class="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 flex items-center justify-center transition-colors">
              ✕
            </button>
          </div>

          <!-- Modal Form Body -->
          <div class="p-5 space-y-4 text-xs">
            
            <!-- COMPANY FORM -->
            <div *ngIf="modalEntityType === 'COMPANY'" class="space-y-3">
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block font-medium text-slate-300 mb-1">Company Code *</label>
                  <input type="text" [(ngModel)]="companyForm.code" placeholder="e.g. UDDIPAN" class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 font-mono uppercase focus:border-emerald-500 focus:outline-none" />
                </div>
                <div>
                  <label class="block font-medium text-slate-300 mb-1">Corporate Entity Name *</label>
                  <input type="text" [(ngModel)]="companyForm.name" placeholder="e.g. Uddipan MFI / Corporate" class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:border-emerald-500 focus:outline-none" />
                </div>
              </div>
              <div>
                <label class="block font-medium text-slate-300 mb-1">Headquarters Physical Address</label>
                <input type="text" [(ngModel)]="companyForm.address" placeholder="e.g. House 9/A, Road 1, Dhanmondi R/A, Dhaka" class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:border-emerald-500 focus:outline-none" />
              </div>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block font-medium text-slate-300 mb-1">Contact Phone</label>
                  <input type="text" [(ngModel)]="companyForm.phone" placeholder="e.g. +880 2-9118533" class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 font-mono focus:border-emerald-500 focus:outline-none" />
                </div>
                <div>
                  <label class="block font-medium text-slate-300 mb-1">Official Email</label>
                  <input type="email" [(ngModel)]="companyForm.email" placeholder="e.g. info@uddipan.org" class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 font-mono focus:border-emerald-500 focus:outline-none" />
                </div>
              </div>
            </div>

            <!-- DEPARTMENT FORM -->
            <div *ngIf="modalEntityType === 'DEPARTMENT'" class="space-y-3">
              <div>
                <label class="block font-medium text-slate-300 mb-1">Company / Organization *</label>
                <select [(ngModel)]="deptForm.companyId" class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:border-emerald-500 focus:outline-none">
                  <option *ngFor="let c of companies" [value]="c.id">{{ c.code }} &mdash; {{ c.name }}</option>
                </select>
              </div>
              <div>
                <label class="block font-medium text-slate-300 mb-1">Department Code *</label>
                <input type="text" [(ngModel)]="deptForm.code" placeholder="e.g. DEP-AUDIT" class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 font-mono focus:border-emerald-500 focus:outline-none" />
              </div>
              <div>
                <label class="block font-medium text-slate-300 mb-1">Department Name *</label>
                <input type="text" [(ngModel)]="deptForm.name" placeholder="e.g. Internal Audit & Compliance" class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:border-emerald-500 focus:outline-none" />
              </div>
            </div>

            <!-- DESIGNATION FORM -->
            <div *ngIf="modalEntityType === 'DESIGNATION'" class="space-y-3">
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block font-medium text-slate-300 mb-1">Designation Code *</label>
                  <input type="text" [(ngModel)]="desigForm.code" placeholder="e.g. DES-AUDITOR" class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 font-mono focus:border-emerald-500 focus:outline-none" />
                </div>
                <div>
                  <label class="block font-medium text-slate-300 mb-1">Assigned Department *</label>
                  <select [(ngModel)]="desigForm.departmentId" class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:border-emerald-500 focus:outline-none">
                    <option value="">-- Select Dept --</option>
                    <option *ngFor="let d of departments" [value]="d.id">{{ d.name }}</option>
                  </select>
                </div>
              </div>
              <div>
                <label class="block font-medium text-slate-300 mb-1">Official Position Title *</label>
                <input type="text" [(ngModel)]="desigForm.title" placeholder="e.g. Senior Internal Auditor" class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:border-emerald-500 focus:outline-none" />
              </div>
              <div>
                <label class="block font-medium text-slate-300 mb-1">Associated Job Grade & Pay Scale</label>
                <select [(ngModel)]="desigForm.jobGradeId" class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:border-emerald-500 focus:outline-none">
                  <option value="">-- None (No Assigned Scale) --</option>
                  <option *ngFor="let g of jobGrades" [value]="g.id">{{ g.gradeCode }} (Level {{ g.level }} | ৳ {{ g.minSalary | number }} - {{ g.maxSalary | number }})</option>
                </select>
              </div>
            </div>

            <!-- JOB GRADE FORM -->
            <div *ngIf="modalEntityType === 'JOB_GRADE'" class="space-y-3">
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block font-medium text-slate-300 mb-1">Grade Code *</label>
                  <input type="text" [(ngModel)]="gradeForm.gradeCode" placeholder="e.g. GRADE-09" class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 font-mono focus:border-emerald-500 focus:outline-none" />
                </div>
                <div>
                  <label class="block font-medium text-slate-300 mb-1">Hierarchy Level *</label>
                  <input type="number" min="1" max="20" [(ngModel)]="gradeForm.level" class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:border-emerald-500 focus:outline-none" />
                </div>
              </div>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block font-medium text-slate-300 mb-1">Minimum Basic Salary (৳) *</label>
                  <input type="number" [(ngModel)]="gradeForm.minSalary" class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 font-mono focus:border-emerald-500 focus:outline-none" />
                </div>
                <div>
                  <label class="block font-medium text-slate-300 mb-1">Maximum Basic Salary (৳) *</label>
                  <input type="number" [(ngModel)]="gradeForm.maxSalary" class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 font-mono focus:border-emerald-500 focus:outline-none" />
                </div>
              </div>
            </div>

            <!-- ZONE FORM -->
            <div *ngIf="modalEntityType === 'ZONE'" class="space-y-3">
              <div>
                <label class="block font-medium text-slate-300 mb-1">Company / Organization *</label>
                <select [(ngModel)]="zoneForm.companyId" class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:border-emerald-500 focus:outline-none">
                  <option *ngFor="let c of companies" [value]="c.id">{{ c.code }} &mdash; {{ c.name }}</option>
                </select>
              </div>
              <div>
                <label class="block font-medium text-slate-300 mb-1">Zone Code *</label>
                <input type="text" [(ngModel)]="zoneForm.code" placeholder="e.g. ZONE-RAJ" class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 font-mono focus:border-emerald-500 focus:outline-none" />
              </div>
              <div>
                <label class="block font-medium text-slate-300 mb-1">Operational Zone Name *</label>
                <input type="text" [(ngModel)]="zoneForm.name" placeholder="e.g. Rajshahi & Bogura Zone" class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:border-emerald-500 focus:outline-none" />
              </div>
            </div>

            <!-- BRANCH FORM -->
            <div *ngIf="modalEntityType === 'BRANCH'" class="space-y-3">
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block font-medium text-slate-300 mb-1">Branch Code *</label>
                  <input type="text" [(ngModel)]="branchForm.code" placeholder="e.g. BR-BGR" class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 font-mono focus:border-emerald-500 focus:outline-none" />
                </div>
                <div>
                  <label class="block font-medium text-slate-300 mb-1">Assigned Zone *</label>
                  <select [(ngModel)]="branchForm.zoneId" class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:border-emerald-500 focus:outline-none">
                    <option value="">-- Select Zone --</option>
                    <option *ngFor="let z of zones" [value]="z.id">{{ z.name }}</option>
                  </select>
                </div>
              </div>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block font-medium text-slate-300 mb-1">Branch Name *</label>
                  <input type="text" [(ngModel)]="branchForm.name" placeholder="e.g. Bogura Sadar Branch" class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:border-emerald-500 focus:outline-none" />
                </div>
                <div>
                  <label class="block font-medium text-slate-300 mb-1">Area Category *</label>
                  <select [(ngModel)]="branchForm.type" class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:border-emerald-500 focus:outline-none">
                    <option value="URBAN">URBAN (City/District)</option>
                    <option value="RURAL">RURAL (Field Unit)</option>
                    <option value="ZONE_OFFICE">ZONE OFFICE</option>
                    <option value="HEAD_OFFICE">HEAD OFFICE</option>
                  </select>
                </div>
              </div>
              <div>
                <label class="block font-medium text-slate-300 mb-1">Physical Address</label>
                <input type="text" [(ngModel)]="branchForm.address" placeholder="e.g. Station Road, Bogura Town" class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:border-emerald-500 focus:outline-none" />
              </div>
            </div>

          </div>

          <!-- Modal Actions Footer -->
          <div class="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-end gap-2">
            <button (click)="closeModal()" class="px-4 py-2 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 text-xs transition-colors">
              Cancel
            </button>
            <button (click)="saveRecord()" [disabled]="isSubmitting" class="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs transition-colors shadow">
              {{ isSubmitting ? 'Saving...' : (isEditMode ? 'Update Record' : 'Save Record') }}
            </button>
          </div>

        </div>
      </div>

      <!-- =================================================================== -->
      <!-- MODAL POPUP: CONFIRM DELETE -->
      <!-- =================================================================== -->
      <div *ngIf="showDeleteModal" class="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div class="bg-slate-900 border border-red-900/50 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden p-6 text-center animate-in fade-in duration-150">
          <div class="w-12 h-12 rounded-full bg-red-950/60 text-red-400 border border-red-800 flex items-center justify-center mx-auto mb-4 text-xl font-bold font-mono">
            !
          </div>
          <h3 class="text-base font-bold text-slate-100">Confirm Deletion</h3>
          <p class="text-xs text-slate-300 mt-2">
            Are you sure you want to permanently delete this {{ deleteEntityLabel }}:
            <br/>
            <span class="font-mono font-bold text-red-300 mt-1 inline-block">
              {{ itemToDelete?.code || itemToDelete?.gradeCode }} &mdash; {{ itemToDelete?.name || itemToDelete?.title || itemToDelete?.gradeCode }}
            </span>?
          </p>
          <p class="text-[11px] text-slate-500 mt-2">
            This operation verifies database integrity. Deletion is rejected if employees, active requisitions, or subordinate records are linked.
          </p>

          <div *ngIf="deleteErrorMessage" class="mt-3 p-3 rounded-lg bg-red-950/90 border border-red-800 text-red-200 text-xs text-left">
            {{ deleteErrorMessage }}
          </div>

          <div class="mt-6 flex items-center justify-center gap-3">
            <button (click)="closeDeleteModal()" class="px-4 py-2 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 text-xs transition-colors">
              Cancel
            </button>
            <button (click)="confirmDelete()" [disabled]="isDeleting" class="px-5 py-2 rounded-lg bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-bold text-xs transition-colors shadow">
              {{ isDeleting ? 'Deleting...' : 'Confirm Delete' }}
            </button>
          </div>
        </div>
      </div>

    </div>
  `
})
export class GeneralSettingsComponent implements OnInit {
  activeTab: SettingsTab = 'company';
  viewMode: 'grid' | 'table' = 'grid';
  searchQuery: string = '';
  companyFilter: string = 'ALL';
  deptFilter: string = 'ALL';
  zoneFilter: string = 'ALL';
  expandedCompanyId: string | null = null;

  companies: any[] = [];
  departments: any[] = [];
  designations: any[] = [];
  jobGrades: any[] = [];
  zones: any[] = [];
  branches: any[] = [];

  // Notification Toast Banner
  notification: { message: string; type: 'success' | 'error' } | null = null;

  // Create / Edit Modal State
  showModal: boolean = false;
  isEditMode: boolean = false;
  modalEntityType: 'COMPANY' | 'DEPARTMENT' | 'DESIGNATION' | 'JOB_GRADE' | 'ZONE' | 'BRANCH' = 'COMPANY';
  modalTitle: string = '';
  isSubmitting: boolean = false;

  // Delete Modal State
  showDeleteModal: boolean = false;
  isDeleting: boolean = false;
  deleteEntityType: 'COMPANY' | 'DEPARTMENT' | 'DESIGNATION' | 'JOB_GRADE' | 'ZONE' | 'BRANCH' = 'COMPANY';
  deleteEntityLabel: string = '';
  itemToDelete: any = null;
  deleteErrorMessage: string = '';

  companyForm = { id: '', code: '', name: '', address: '', phone: '', email: '' };
  deptForm = { id: '', code: '', name: '', companyId: '' };
  desigForm = { id: '', code: '', title: '', departmentId: '', jobGradeId: '' };
  gradeForm = { id: '', gradeCode: '', level: 1, minSalary: 25000, maxSalary: 45000 };
  zoneForm = { id: '', code: '', name: '', companyId: '' };
  branchForm = { id: '', code: '', name: '', type: 'URBAN', zoneId: '', address: '' };

  constructor(
    private http: HttpClient,
    private route: ActivatedRoute,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const tab = params['tab'];
      if (tab === 'company' || tab === 'departments' || tab === 'designations' || tab === 'job-grades' || tab === 'zones' || tab === 'branches') {
        this.activeTab = tab;
      }
    });

    this.loadData();
  }

  showToast(message: string, type: 'success' | 'error' = 'success') {
    this.notification = { message, type };
    setTimeout(() => {
      if (this.notification?.message === message) {
        this.notification = null;
      }
    }, 5000);
  }

  setTab(tab: SettingsTab) {
    this.activeTab = tab;
    this.searchQuery = '';
    this.deptFilter = 'ALL';
    this.zoneFilter = 'ALL';
    this.router.navigate(['/settings', tab]);
  }

  loadData() {
    this.http.get<any>('/api/v1/master/hierarchy').subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.companies = res.data.companies || [];
          this.departments = res.data.departments || [];
          this.designations = res.data.designations || [];
          this.jobGrades = res.data.jobGrades || [];
          this.zones = res.data.zones || [];
          this.branches = res.data.branches || [];
        }
      },
      error: (err) => console.error('Failed to load master hierarchy:', err)
    });
  }

  onCompanyFilterChange(): void {
    this.deptFilter = 'ALL';
    this.zoneFilter = 'ALL';
  }

  toggleCompanyExpand(companyId: string): void {
    this.expandedCompanyId = this.expandedCompanyId === companyId ? null : companyId;
  }

  getCompanyZones(companyId: string): any[] {
    return this.zones.filter(z => z.companyId === companyId);
  }

  getBranchesForZone(zoneId: string): any[] {
    return this.branches.filter(b => b.zoneId === zoneId);
  }

  getCompanyBranches(companyId: string): any[] {
    const zoneIds = new Set(this.getCompanyZones(companyId).map(z => z.id));
    return this.branches.filter(b => zoneIds.has(b.zoneId));
  }

  getCompanyDepartments(companyId: string): any[] {
    return this.departments.filter(d => d.companyId === companyId);
  }

  getDesignationsForDept(deptId: string): any[] {
    return this.designations.filter(des => des.departmentId === deptId);
  }

  getCompanyDesignations(companyId: string): any[] {
    const deptIds = new Set(this.getCompanyDepartments(companyId).map(d => d.id));
    return this.designations.filter(des => deptIds.has(des.departmentId));
  }

  getCompanyNameById(companyId: string): string {
    return this.companies.find(c => c.id === companyId)?.name || 'Enterprise Corporate';
  }

  getFilteredCompanies(): any[] {
    const q = this.searchQuery.toLowerCase().trim();
    return this.companies.filter(c =>
      (!q || c.name?.toLowerCase().includes(q) || c.code?.toLowerCase().includes(q) || c.address?.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q) || c.phone?.toLowerCase().includes(q))
    );
  }

  getFilteredDepartments(): any[] {
    const q = this.searchQuery.toLowerCase().trim();
    return this.departments.filter(d => {
      const matchCompany = this.companyFilter === 'ALL' || d.companyId === this.companyFilter;
      const matchSearch = !q || d.name?.toLowerCase().includes(q) || d.code?.toLowerCase().includes(q);
      return matchCompany && matchSearch;
    });
  }

  getFilteredDesignations(): any[] {
    const q = this.searchQuery.toLowerCase().trim();
    return this.designations.filter(des => {
      const dept = this.departments.find(d => d.id === des.departmentId);
      const matchCompany = this.companyFilter === 'ALL' || des.department?.companyId === this.companyFilter || dept?.companyId === this.companyFilter;
      const matchDept = this.deptFilter === 'ALL' || des.departmentId === this.deptFilter;
      const matchSearch = !q || des.title?.toLowerCase().includes(q) || des.code?.toLowerCase().includes(q);
      return matchCompany && matchDept && matchSearch;
    });
  }

  getFilteredJobGrades(): any[] {
    const q = this.searchQuery.toLowerCase().trim();
    return this.jobGrades.filter(g =>
      !q || g.gradeCode?.toLowerCase().includes(q) || String(g.level).includes(q)
    );
  }

  getFilteredZones(): any[] {
    const q = this.searchQuery.toLowerCase().trim();
    return this.zones.filter(z => {
      const matchCompany = this.companyFilter === 'ALL' || z.companyId === this.companyFilter;
      const matchSearch = !q || z.name?.toLowerCase().includes(q) || z.code?.toLowerCase().includes(q);
      return matchCompany && matchSearch;
    });
  }

  getFilteredBranches(): any[] {
    const q = this.searchQuery.toLowerCase().trim();
    return this.branches.filter(b => {
      const branchZone = this.zones.find(z => z.id === b.zoneId);
      const matchCompany = this.companyFilter === 'ALL' || b.zone?.companyId === this.companyFilter || branchZone?.companyId === this.companyFilter;
      const matchZone = this.zoneFilter === 'ALL' || b.zoneId === this.zoneFilter;
      const matchSearch = !q || b.name?.toLowerCase().includes(q) || b.code?.toLowerCase().includes(q) || b.address?.toLowerCase().includes(q);
      return matchCompany && matchZone && matchSearch;
    });
  }

  getCreateButtonLabel(): string {
    if (this.activeTab === 'company') return 'Company';
    if (this.activeTab === 'departments') return 'Department';
    if (this.activeTab === 'designations') return 'Designation';
    if (this.activeTab === 'job-grades') return 'Job Grade';
    if (this.activeTab === 'zones') return 'Zone';
    if (this.activeTab === 'branches') return 'Branch';
    return 'Record';
  }

  getDepartmentNameById(deptId: string): string {
    return this.departments.find(d => d.id === deptId)?.name || 'General Operations';
  }

  getZoneNameById(zoneId: string): string {
    return this.zones.find(z => z.id === zoneId)?.name || 'Central Zone';
  }

  getDesignationCount(deptId: string): number {
    return this.designations.filter(des => des.departmentId === deptId).length;
  }

  getBranchCountByZone(zoneId: string): number {
    return this.branches.filter(b => b.zoneId === zoneId).length;
  }

  openCreateModal() {
    this.isEditMode = false;
    const defaultCompanyId = this.companyFilter !== 'ALL' ? this.companyFilter : (this.companies[0]?.id || '');

    if (this.activeTab === 'company') {
      this.modalEntityType = 'COMPANY';
      this.modalTitle = 'Register New Enterprise / Company Entity';
      this.companyForm = { id: '', code: '', name: '', address: '', phone: '', email: '' };
    } else if (this.activeTab === 'departments') {
      this.modalEntityType = 'DEPARTMENT';
      this.modalTitle = 'Create New Department Unit';
      this.deptForm = { id: '', code: '', name: '', companyId: defaultCompanyId };
    } else if (this.activeTab === 'designations') {
      this.modalEntityType = 'DESIGNATION';
      this.modalTitle = 'Create New Official Designation';
      this.desigForm = { id: '', code: '', title: '', departmentId: this.departments[0]?.id || '', jobGradeId: this.jobGrades[0]?.id || '' };
    } else if (this.activeTab === 'job-grades') {
      this.modalEntityType = 'JOB_GRADE';
      this.modalTitle = 'Create New Pay Scale Job Grade';
      this.gradeForm = { id: '', gradeCode: '', level: this.jobGrades.length + 1, minSalary: 25000, maxSalary: 45000 };
    } else if (this.activeTab === 'zones') {
      this.modalEntityType = 'ZONE';
      this.modalTitle = 'Create New Operational Zone';
      this.zoneForm = { id: '', code: '', name: '', companyId: defaultCompanyId };
    } else if (this.activeTab === 'branches') {
      this.modalEntityType = 'BRANCH';
      this.modalTitle = 'Create New Branch Office';
      this.branchForm = { id: '', code: '', name: '', type: 'URBAN', zoneId: this.zones[0]?.id || '', address: '' };
    }
    this.showModal = true;
  }

  openEditModal(type: 'COMPANY' | 'DEPARTMENT' | 'DESIGNATION' | 'JOB_GRADE' | 'ZONE' | 'BRANCH', item: any) {
    this.isEditMode = true;
    this.modalEntityType = type;

    if (type === 'COMPANY') {
      this.modalTitle = `Edit Company: ${item.name}`;
      this.companyForm = {
        id: item.id,
        code: item.code,
        name: item.name,
        address: item.address || '',
        phone: item.phone || '',
        email: item.email || ''
      };
    } else if (type === 'DEPARTMENT') {
      this.modalTitle = `Edit Department: ${item.name}`;
      this.deptForm = { id: item.id, code: item.code, name: item.name, companyId: item.companyId || (this.companies[0]?.id || '') };
    } else if (type === 'DESIGNATION') {
      this.modalTitle = `Edit Designation: ${item.title}`;
      this.desigForm = { id: item.id, code: item.code, title: item.title, departmentId: item.departmentId, jobGradeId: item.jobGradeId || '' };
    } else if (type === 'JOB_GRADE') {
      this.modalTitle = `Edit Job Grade: ${item.gradeCode}`;
      this.gradeForm = { id: item.id, gradeCode: item.gradeCode, level: item.level, minSalary: Number(item.minSalary), maxSalary: Number(item.maxSalary) };
    } else if (type === 'ZONE') {
      this.modalTitle = `Edit Zone: ${item.name}`;
      this.zoneForm = { id: item.id, code: item.code, name: item.name, companyId: item.companyId || (this.companies[0]?.id || '') };
    } else if (type === 'BRANCH') {
      this.modalTitle = `Edit Branch: ${item.name}`;
      this.branchForm = { id: item.id, code: item.code, name: item.name, type: item.type || 'URBAN', zoneId: item.zoneId, address: item.address || '' };
    }

    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
  }

  openDeleteConfirm(type: 'COMPANY' | 'DEPARTMENT' | 'DESIGNATION' | 'JOB_GRADE' | 'ZONE' | 'BRANCH', item: any) {
    this.deleteEntityType = type;
    this.itemToDelete = item;
    this.deleteErrorMessage = '';
    this.deleteEntityLabel = type.toLowerCase().replace('_', ' ');
    this.showDeleteModal = true;
  }

  closeDeleteModal() {
    this.showDeleteModal = false;
    this.itemToDelete = null;
    this.deleteErrorMessage = '';
  }

  confirmDelete() {
    if (!this.itemToDelete) return;
    this.isDeleting = true;
    this.deleteErrorMessage = '';

    let endpoint = '';
    if (this.deleteEntityType === 'COMPANY') endpoint = `/api/v1/master/companies/${this.itemToDelete.id}`;
    else if (this.deleteEntityType === 'DEPARTMENT') endpoint = `/api/v1/master/departments/${this.itemToDelete.id}`;
    else if (this.deleteEntityType === 'DESIGNATION') endpoint = `/api/v1/master/designations/${this.itemToDelete.id}`;
    else if (this.deleteEntityType === 'JOB_GRADE') endpoint = `/api/v1/master/job-grades/${this.itemToDelete.id}`;
    else if (this.deleteEntityType === 'ZONE') endpoint = `/api/v1/master/zones/${this.itemToDelete.id}`;
    else if (this.deleteEntityType === 'BRANCH') endpoint = `/api/v1/master/branches/${this.itemToDelete.id}`;

    this.http.delete<any>(endpoint).subscribe({
      next: (res) => {
        this.isDeleting = false;
        this.closeDeleteModal();
        this.loadData();
        this.showToast(res.message || 'Record deleted successfully.', 'success');
      },
      error: (err) => {
        this.isDeleting = false;
        const msg = err.error?.message || err.message || 'Failed to delete record';
        this.deleteErrorMessage = msg;
        this.showToast(msg, 'error');
      }
    });
  }

  saveRecord() {
    this.isSubmitting = true;

    if (this.modalEntityType === 'COMPANY') {
      const code = (this.companyForm.code || '').trim().toUpperCase();
      const name = (this.companyForm.name || '').trim();

      if (!code || code.length < 2) {
        this.isSubmitting = false;
        this.showToast('Company code must be at least 2 characters (e.g. UDDIPAN).', 'error');
        return;
      }
      if (!name || name.length < 3) {
        this.isSubmitting = false;
        this.showToast('Company name must be at least 3 characters.', 'error');
        return;
      }

      const payload = {
        code,
        name,
        address: this.companyForm.address ? this.companyForm.address.trim() : null,
        phone: this.companyForm.phone ? this.companyForm.phone.trim() : null,
        email: this.companyForm.email ? this.companyForm.email.trim() : null,
      };

      const req$ = this.isEditMode
        ? this.http.put<any>(`/api/v1/master/companies/${this.companyForm.id}`, payload)
        : this.http.post<any>('/api/v1/master/companies', payload);

      req$.subscribe({
        next: (res) => {
          this.isSubmitting = false;
          this.closeModal();
          this.loadData();
          this.showToast(res.message || (this.isEditMode ? 'Company updated successfully!' : 'Company created successfully!'));
        },
        error: (err) => {
          this.isSubmitting = false;
          const msg = err.error?.message || err.message || 'Failed to save company';
          this.showToast(msg, 'error');
        }
      });
    } else if (this.modalEntityType === 'DEPARTMENT') {
      const code = (this.deptForm.code || '').trim().toUpperCase();
      const name = (this.deptForm.name || '').trim();

      if (!code || code.length < 2) {
        this.isSubmitting = false;
        this.showToast('Department code must be at least 2 characters.', 'error');
        return;
      }
      if (!name || name.length < 3) {
        this.isSubmitting = false;
        this.showToast('Department name must be at least 3 characters.', 'error');
        return;
      }

      const payload = {
        code,
        name,
        companyId: this.deptForm.companyId || undefined,
      };
      const req$ = this.isEditMode
        ? this.http.put<any>(`/api/v1/master/departments/${this.deptForm.id}`, payload)
        : this.http.post<any>('/api/v1/master/departments', payload);

      req$.subscribe({
        next: (res) => {
          this.isSubmitting = false;
          this.closeModal();
          this.loadData();
          this.showToast(res.message || (this.isEditMode ? 'Department updated successfully!' : 'Department created successfully!'));
        },
        error: (err) => {
          this.isSubmitting = false;
          const msg = err.error?.message || err.message || 'Failed to save department';
          this.showToast(msg, 'error');
        }
      });
    } else if (this.modalEntityType === 'DESIGNATION') {
      const code = (this.desigForm.code || '').trim().toUpperCase();
      const title = (this.desigForm.title || '').trim();

      if (!code || code.length < 2) {
        this.isSubmitting = false;
        this.showToast('Designation code must be at least 2 characters.', 'error');
        return;
      }
      if (!title || title.length < 2) {
        this.isSubmitting = false;
        this.showToast('Designation title must be at least 2 characters.', 'error');
        return;
      }
      if (!this.desigForm.departmentId) {
        this.isSubmitting = false;
        this.showToast('Please select an assigned Department.', 'error');
        return;
      }

      const payload = {
        code,
        title,
        departmentId: this.desigForm.departmentId,
        jobGradeId: this.desigForm.jobGradeId || null,
      };
      const req$ = this.isEditMode
        ? this.http.put<any>(`/api/v1/master/designations/${this.desigForm.id}`, payload)
        : this.http.post<any>('/api/v1/master/designations', payload);

      req$.subscribe({
        next: (res) => {
          this.isSubmitting = false;
          this.closeModal();
          this.loadData();
          this.showToast(res.message || (this.isEditMode ? 'Designation updated successfully!' : 'Designation created successfully!'));
        },
        error: (err) => {
          this.isSubmitting = false;
          const msg = err.error?.message || err.message || 'Failed to save designation';
          this.showToast(msg, 'error');
        }
      });
    } else if (this.modalEntityType === 'JOB_GRADE') {
      const gradeCode = (this.gradeForm.gradeCode || '').trim().toUpperCase();
      const level = Number(this.gradeForm.level);
      const minSalary = Number(this.gradeForm.minSalary);
      const maxSalary = Number(this.gradeForm.maxSalary);

      if (!gradeCode || gradeCode.length < 2) {
        this.isSubmitting = false;
        this.showToast('Job grade code must be at least 2 characters.', 'error');
        return;
      }
      if (isNaN(minSalary) || minSalary < 0 || isNaN(maxSalary) || maxSalary < minSalary) {
        this.isSubmitting = false;
        this.showToast('Please specify valid salary brackets (Max salary must exceed Min salary).', 'error');
        return;
      }

      const payload = { gradeCode, level, minSalary, maxSalary };
      const req$ = this.isEditMode
        ? this.http.put<any>(`/api/v1/master/job-grades/${this.gradeForm.id}`, payload)
        : this.http.post<any>('/api/v1/master/job-grades', payload);

      req$.subscribe({
        next: (res) => {
          this.isSubmitting = false;
          this.closeModal();
          this.loadData();
          this.showToast(res.message || (this.isEditMode ? 'Job Grade updated successfully!' : 'Job Grade created successfully!'));
        },
        error: (err) => {
          this.isSubmitting = false;
          const msg = err.error?.message || err.message || 'Failed to save job grade';
          this.showToast(msg, 'error');
        }
      });
    } else if (this.modalEntityType === 'ZONE') {
      const code = (this.zoneForm.code || '').trim().toUpperCase();
      const name = (this.zoneForm.name || '').trim();

      if (!code || code.length < 2) {
        this.isSubmitting = false;
        this.showToast('Zone code must be at least 2 characters (e.g. ZONE-DHK).', 'error');
        return;
      }
      if (!name || name.length < 3) {
        this.isSubmitting = false;
        this.showToast('Zone name must be at least 3 characters.', 'error');
        return;
      }

      const payload = {
        code,
        name,
        companyId: this.zoneForm.companyId || undefined,
      };
      const req$ = this.isEditMode
        ? this.http.put<any>(`/api/v1/master/zones/${this.zoneForm.id}`, payload)
        : this.http.post<any>('/api/v1/master/zones', payload);

      req$.subscribe({
        next: (res) => {
          this.isSubmitting = false;
          this.closeModal();
          this.loadData();
          this.showToast(res.message || (this.isEditMode ? 'Zone updated successfully!' : 'Zone created successfully!'));
        },
        error: (err) => {
          this.isSubmitting = false;
          const msg = err.error?.message || err.message || 'Failed to save zone';
          this.showToast(msg, 'error');
        }
      });
    } else if (this.modalEntityType === 'BRANCH') {
      const code = (this.branchForm.code || '').trim().toUpperCase();
      const name = (this.branchForm.name || '').trim();

      if (!code || code.length < 2) {
        this.isSubmitting = false;
        this.showToast('Branch code must be at least 2 characters.', 'error');
        return;
      }
      if (!name || name.length < 3) {
        this.isSubmitting = false;
        this.showToast('Branch name must be at least 3 characters.', 'error');
        return;
      }
      if (!this.branchForm.zoneId) {
        this.isSubmitting = false;
        this.showToast('Please select an assigned Operational Zone for the branch.', 'error');
        return;
      }

      const payload = {
        code,
        name,
        type: this.branchForm.type,
        zoneId: this.branchForm.zoneId,
        address: this.branchForm.address ? this.branchForm.address.trim() : null,
      };
      const req$ = this.isEditMode
        ? this.http.put<any>(`/api/v1/master/branches/${this.branchForm.id}`, payload)
        : this.http.post<any>('/api/v1/master/branches', payload);

      req$.subscribe({
        next: (res) => {
          this.isSubmitting = false;
          this.closeModal();
          this.loadData();
          this.showToast(res.message || (this.isEditMode ? 'Branch updated successfully!' : 'Branch created successfully!'));
        },
        error: (err) => {
          this.isSubmitting = false;
          const msg = err.error?.message || err.message || 'Failed to save branch';
          this.showToast(msg, 'error');
        }
      });
    }
  }
}
