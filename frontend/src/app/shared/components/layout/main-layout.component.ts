import { Component, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '@core/services/auth.service';

interface NavItem {
  label: string;
  route: string;
  moduleCode: string;
}

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="flex h-screen bg-slate-950 overflow-hidden font-sans">
      <!-- Sidebar -->
      <aside 
        [ngClass]="isSidebarCollapsed ? 'w-20' : 'w-64'" 
        class="bg-slate-900 border-r border-slate-800 flex flex-col justify-between shrink-0 select-none transition-all duration-300 ease-in-out">
        <div>
          <!-- Brand Logo Header -->
          <div class="h-16 flex items-center border-b border-slate-800 transition-all duration-300"
               [ngClass]="isSidebarCollapsed ? 'justify-center px-2' : 'px-5 justify-between'">
            <div class="flex items-center gap-3 overflow-hidden">
              <div class="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center font-bold text-white shadow-lg shadow-emerald-900/30 shrink-0">
                U
              </div>
              <div *ngIf="!isSidebarCollapsed" class="truncate transition-opacity duration-200">
                <h1 class="text-sm font-bold tracking-wider text-slate-100 uppercase truncate">UDDIPAN</h1>
                <p class="text-[10px] text-emerald-400 font-medium truncate">Enterprise HRIS Portal</p>
              </div>
            </div>
            <button 
              *ngIf="!isSidebarCollapsed"
              type="button"
              (click)="toggleSidebar()"
              title="Collapse sidebar (Ctrl+B)"
              class="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              </svg>
            </button>
          </div>

          <!-- Nav Menu List -->
          <nav class="p-2.5 space-y-1 overflow-y-auto overflow-x-hidden max-h-[calc(100vh-140px)] text-xs">
            <div *ngIf="!isSidebarCollapsed" class="px-3 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Core Modules
            </div>

            <!-- Overview Dashboard -->
            <a routerLink="/dashboard" 
               routerLinkActive="bg-emerald-600/15 text-emerald-400 border-emerald-500 font-semibold shadow-sm" 
               [routerLinkActiveOptions]="{exact: true}"
               [title]="'Overview Dashboard'"
               [ngClass]="isSidebarCollapsed ? 'justify-center px-2 py-2.5' : 'px-3 py-2.5 gap-3'"
               class="flex items-center rounded-xl text-slate-300 hover:bg-slate-800/80 hover:text-white transition-all border-l-2 border-transparent group">
              <svg class="w-5 h-5 shrink-0 text-slate-400 group-hover:text-emerald-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
              </svg>
              <span *ngIf="!isSidebarCollapsed" class="truncate">Overview Dashboard</span>
            </a>

            <div *ngIf="!isSidebarCollapsed" class="px-3 pt-3 pb-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              DFD Business Modules
            </div>
            <div *ngIf="isSidebarCollapsed" class="my-2 border-t border-slate-800/80 mx-2" title="DFD Business Modules"></div>

            <a *ngFor="let item of navItemsBefore" 
               [routerLink]="item.route" 
               routerLinkActive="bg-emerald-600/15 text-emerald-400 border-emerald-500 font-semibold"
               [title]="item.label"
               [ngClass]="isSidebarCollapsed ? 'justify-center px-2 py-2' : 'justify-between px-3 py-2'"
               class="flex items-center rounded-xl text-slate-300 hover:bg-slate-800/80 hover:text-white transition-all border-l-2 border-transparent group">
              <span *ngIf="!isSidebarCollapsed" class="truncate">{{ item.label }}</span>
              <span class="text-[10px] px-2 py-1 rounded-lg bg-slate-800 text-slate-300 border border-slate-700/80 font-mono font-bold group-hover:bg-slate-700 group-hover:text-white transition-colors shrink-0">
                {{ item.moduleCode }}
              </span>
            </a>

            <!-- Grouping: Recruitment Management (Module 7) -->
            <div class="space-y-0.5">
              <div 
                (click)="toggleRecruitmentGroup()"
                [title]="'Module 7: Recruitment Management'"
                [ngClass]="{
                  'bg-emerald-600/15 text-emerald-400 border-emerald-500 font-semibold': isRecruitmentActive(),
                  'text-slate-300 hover:bg-slate-800/80 hover:text-white border-transparent': !isRecruitmentActive(),
                  'justify-center px-2 py-2': isSidebarCollapsed,
                  'justify-between px-3 py-2': !isSidebarCollapsed
                }"
                class="flex items-center rounded-xl cursor-pointer transition-all border-l-2 select-none relative group">
                
                <div *ngIf="!isSidebarCollapsed" class="flex items-center gap-2 truncate">
                  <span class="w-1.5 h-1.5 rounded-full shrink-0" [ngClass]="isRecruitmentActive() ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]' : 'bg-slate-600'"></span>
                  <span class="truncate">Recruitment Management</span>
                </div>

                <div class="flex items-center gap-1.5">
                  <span class="text-[10px] px-2 py-1 rounded-lg border font-mono font-bold transition-all shrink-0"
                    [ngClass]="isRecruitmentActive() ? 'bg-emerald-950 text-emerald-300 border-emerald-700 shadow-sm' : 'bg-slate-800 text-slate-300 border-slate-700/80 group-hover:bg-slate-700 group-hover:text-white'">
                    M7
                  </span>
                  <span *ngIf="!isSidebarCollapsed" class="text-[9px] font-mono text-slate-500 transition-transform duration-200" [class.rotate-180]="isRecruitmentOpen">
                    ▼
                  </span>
                </div>

                <span *ngIf="isSidebarCollapsed && isRecruitmentActive()" class="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]"></span>
              </div>

              <!-- Submenu Items (when expanded) -->
              <div *ngIf="!isSidebarCollapsed && isRecruitmentOpen" class="space-y-0.5 pl-2 mt-0.5 border-l border-emerald-900/40 ml-3">
                <a *ngFor="let sub of recruitmentSubItems"
                  [routerLink]="['/recruitment']"
                  [queryParams]="{ tab: sub.id }"
                  class="flex items-center justify-between px-3 py-1.5 rounded-lg transition-all text-xs border-l-2 border-transparent"
                  [ngClass]="{
                    'bg-emerald-600/15 text-emerald-300 font-semibold border-emerald-400 shadow-sm': isRecruitmentTabActive(sub.id),
                    'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60': !isRecruitmentTabActive(sub.id)
                  }">
                  <span class="truncate">{{ sub.label }}</span>
                  <span class="text-[8px] font-mono px-1.5 py-0.5 rounded shrink-0 ml-1.5"
                    [ngClass]="{
                      'bg-emerald-950 text-emerald-300 border border-emerald-800': isRecruitmentTabActive(sub.id),
                      'bg-slate-800 text-slate-500 border border-slate-700/60': !isRecruitmentTabActive(sub.id)
                    }">
                    {{ sub.badge }}
                  </span>
                </a>
              </div>
            </div>

            <a *ngFor="let item of navItemsAfter" 
               [routerLink]="item.route" 
               routerLinkActive="bg-emerald-600/15 text-emerald-400 border-emerald-500 font-semibold"
               [title]="item.label"
               [ngClass]="isSidebarCollapsed ? 'justify-center px-2 py-2' : 'justify-between px-3 py-2'"
               class="flex items-center rounded-xl text-slate-300 hover:bg-slate-800/80 hover:text-white transition-all border-l-2 border-transparent group">
              <span *ngIf="!isSidebarCollapsed" class="truncate">{{ item.label }}</span>
              <span class="text-[10px] px-2 py-1 rounded-lg bg-slate-800 text-slate-300 border border-slate-700/80 font-mono font-bold group-hover:bg-slate-700 group-hover:text-white transition-colors shrink-0">
                {{ item.moduleCode }}
              </span>
            </a>

            <!-- Grouping: General Settings -->
            <div class="pt-2">
              <div *ngIf="!isSidebarCollapsed">
                <button 
                  type="button"
                  (click)="isSettingsOpen = !isSettingsOpen"
                  class="w-full flex items-center justify-between px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider hover:text-slate-200 transition-colors">
                  <span class="flex items-center gap-1.5">
                    <span class="text-blue-400 font-mono">⚙</span>
                    <span>General Settings</span>
                  </span>
                  <span class="text-[9px] font-mono text-slate-500 transition-transform" [class.rotate-180]="isSettingsOpen">▼</span>
                </button>

                <div *ngIf="isSettingsOpen" class="space-y-0.5 pl-2 mt-1 border-l border-slate-800 ml-3">
                  <a routerLink="/settings/company" routerLinkActive="bg-emerald-600/10 text-emerald-400 font-semibold"
                    class="flex items-center justify-between px-3 py-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-all text-xs">
                    <span>Company</span>
                    <span class="text-[9px] font-mono text-emerald-400/90 bg-emerald-950/70 border border-emerald-900/60 px-1 rounded">Root</span>
                  </a>
                  <a routerLink="/settings/zones" routerLinkActive="bg-emerald-600/10 text-emerald-400 font-semibold"
                    class="flex items-center justify-between px-3 py-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-all text-xs">
                    <span>Zones</span>
                    <span class="text-[9px] font-mono text-slate-400 bg-slate-800/80 px-1 rounded">Zone</span>
                  </a>
                  <a routerLink="/settings/branches" routerLinkActive="bg-emerald-600/10 text-emerald-400 font-semibold"
                    class="flex items-center justify-between px-3 py-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-all text-xs">
                    <span>Branches</span>
                    <span class="text-[9px] font-mono text-slate-400 bg-slate-800/80 px-1 rounded">Branch</span>
                  </a>
                  <a routerLink="/settings/departments" routerLinkActive="bg-emerald-600/10 text-emerald-400 font-semibold"
                    class="flex items-center justify-between px-3 py-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-all text-xs">
                    <span>Departments</span>
                    <span class="text-[9px] font-mono text-slate-400 bg-slate-800/80 px-1 rounded">Dept</span>
                  </a>
                  <a routerLink="/settings/designations" routerLinkActive="bg-emerald-600/10 text-emerald-400 font-semibold"
                    class="flex items-center justify-between px-3 py-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-all text-xs">
                    <span>Designations</span>
                    <span class="text-[9px] font-mono text-slate-400 bg-slate-800/80 px-1 rounded">Roles</span>
                  </a>
                  <a routerLink="/settings/job-grades" routerLinkActive="bg-emerald-600/10 text-emerald-400 font-semibold"
                    class="flex items-center justify-between px-3 py-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-all text-xs">
                    <span>Job Grades</span>
                    <span class="text-[9px] font-mono text-slate-400 bg-slate-800/80 px-1 rounded">Pay</span>
                  </a>
                  <a [routerLink]="['/recruitment']" [queryParams]="{ tab: 'settings' }"
                    [ngClass]="isRecruitmentTabActive('settings') ? 'bg-emerald-600/10 text-emerald-400 font-semibold' : ''"
                    class="flex items-center justify-between px-3 py-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-all text-xs">
                    <span>Settings &amp; RBAC</span>
                    <span class="text-[9px] font-mono text-purple-400 bg-purple-950/80 border border-purple-900/60 px-1 rounded">RBAC</span>
                  </a>
                </div>
              </div>

              <!-- Collapsed Settings Icon Link -->
              <div *ngIf="isSidebarCollapsed" class="flex justify-center">
                <a routerLink="/settings/company" [title]="'General Settings'"
                   routerLinkActive="bg-emerald-600/15 text-emerald-400 border-emerald-500 font-semibold"
                   class="flex items-center justify-center p-2 rounded-xl text-slate-300 hover:bg-slate-800 hover:text-white transition-all group">
                  <span class="w-9 h-9 rounded-xl flex items-center justify-center font-mono font-bold text-xs bg-slate-800 text-slate-300 group-hover:bg-slate-700 group-hover:text-white border border-slate-700/80">
                    ⚙
                  </span>
                </a>
              </div>
            </div>
          </nav>
        </div>

        <!-- User Quick Card & Collapse Control Footer -->
        <div class="border-t border-slate-800 bg-slate-900/60 shrink-0">
          <!-- Expanded View -->
          <div *ngIf="!isSidebarCollapsed" class="p-3 space-y-2">
            <div class="flex items-center justify-between">
              <div class="truncate mr-2">
                <p class="text-xs font-semibold text-slate-200 truncate">
                  {{ currentUser()?.firstName }} {{ currentUser()?.lastName }}
                </p>
                <p class="text-[10px] text-slate-400 truncate">{{ currentUser()?.email }}</p>
              </div>
              <button (click)="logout()" title="Logout"
                class="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 hover:text-rose-400 text-slate-400 transition-colors">
                <span class="text-xs font-semibold">Exit</span>
              </button>
            </div>
            
            <button 
              type="button" 
              (click)="toggleSidebar()" 
              class="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-slate-950/60 hover:bg-slate-800/80 text-slate-400 hover:text-slate-200 border border-slate-800 transition-colors text-xs">
              <span class="flex items-center gap-2">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                </svg>
                <span>Collapse Sidebar</span>
              </span>
              <span class="text-[9px] font-mono text-slate-500 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">Ctrl+B</span>
            </button>
          </div>

          <!-- Collapsed View -->
          <div *ngIf="isSidebarCollapsed" class="p-2 flex flex-col items-center gap-2">
            <div 
              [title]="(currentUser()?.firstName || 'User') + ' ' + (currentUser()?.lastName || '') + ' (' + (currentUser()?.email || '') + ')'"
              class="w-9 h-9 rounded-xl bg-emerald-950 border border-emerald-700 text-emerald-300 flex items-center justify-center font-bold text-xs cursor-pointer shadow-sm">
              {{ (currentUser()?.firstName?.[0] || 'U') }}
            </div>
            <button (click)="logout()" title="Logout"
              class="p-2 rounded-xl bg-slate-800 hover:bg-rose-950 hover:text-rose-400 text-slate-400 transition-colors">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
            <button 
              type="button" 
              (click)="toggleSidebar()" 
              title="Expand Sidebar (Ctrl+B)"
              class="w-full flex items-center justify-center p-2 rounded-xl text-slate-400 hover:text-emerald-400 hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-700">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </aside>

      <!-- Main Content Area -->
      <div class="flex-1 flex flex-col min-w-0 overflow-hidden">
        <!-- Top Navbar -->
        <header class="h-16 bg-slate-900/90 backdrop-blur border-b border-slate-800 flex items-center justify-between px-6 shrink-0">
          <div class="flex items-center gap-3">
            <button 
              type="button"
              (click)="toggleSidebar()" 
              [title]="isSidebarCollapsed ? 'Expand sidebar (Ctrl+B)' : 'Collapse sidebar (Ctrl+B)'"
              class="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-all border border-slate-700/60 flex items-center justify-center shadow-sm">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <span class="text-xs text-slate-400 font-medium">Headquarter: Dhaka</span>
            <span class="text-slate-600">|</span>
            <span class="text-xs text-emerald-400 font-medium">PostgreSQL: Connected</span>
          </div>

          <div class="flex items-center gap-4">
            <div class="flex items-center gap-1.5">
              <span *ngFor="let role of currentUser()?.roles"
                class="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-950 border border-emerald-800 text-emerald-300">
                {{ role }}
              </span>
            </div>
          </div>
        </header>

        <!-- Routed Page Content -->
        <main class="flex-1 overflow-y-auto p-6 bg-slate-950">
          <router-outlet></router-outlet>
        </main>
      </div>
    </div>
  `
})
export class MainLayoutComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  currentUser = this.authService.currentUserSignal;
  isSettingsOpen: boolean = true;
  isRecruitmentOpen: boolean = true;
  isSidebarCollapsed: boolean = (typeof window !== 'undefined' && localStorage.getItem('uddipan_sidebar_collapsed') === 'true');

  @HostListener('window:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent) {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'b') {
      event.preventDefault();
      this.toggleSidebar();
    }
  }

  toggleSidebar(): void {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('uddipan_sidebar_collapsed', String(this.isSidebarCollapsed));
      } catch (e) {
        // ignore localStorage access limitations
      }
    }
  }

  navItemsBefore: NavItem[] = [
    { label: 'Module 1: Administration & Succession', route: '/admin-succession', moduleCode: 'M1' },
    { label: 'Module 2: Employee Loan', route: '/loans', moduleCode: 'M2' },
    { label: 'Module 3: Employee Welfare Fund', route: '/welfare-fund', moduleCode: 'M3' },
    { label: 'Module 4: Provident Fund (CPF)', route: '/provident-fund', moduleCode: 'M4' },
    { label: 'Module 5: Gratuity & Separation', route: '/gratuity-separation', moduleCode: 'M5' },
    { label: 'Module 6: Enterprise Payroll', route: '/payroll', moduleCode: 'M6' },
  ];

  recruitmentSubItems = [
    { id: 'pipeline', label: 'Recruitment Pipeline Dashboard', badge: 'KANBAN' },
    { id: 'requisitions', label: 'Manpower Requisitions', badge: 'REQ' },
    { id: 'circulars', label: 'Job Circulars & Vacancies', badge: 'CIRC' },
    { id: 'shortlisting', label: 'Auto Shortlisting Engine', badge: 'CV' },
    { id: 'examHalls', label: 'Exam Halls & Schedules', badge: 'EXAM' },
    { id: 'examAttendance', label: 'Exam Attendance Management', badge: 'ATTND' },
    { id: 'marksTabulation', label: 'Marks Tabulation & Cutoff Publishing', badge: 'MARKS' },
    { id: 'viva', label: 'Viva Boards & Scoring', badge: 'VIVA' },
    { id: 'vivaAttendance', label: 'Viva Candidate Attendance', badge: 'V-ATT' },
    { id: 'analytics', label: 'Recruitment Analytics', badge: 'KPI' },
    { id: 'settings', label: 'Settings & RBAC', badge: 'RBAC' }
  ];

  navItemsAfter: NavItem[] = [
    { label: 'Module 8: Training Management', route: '/training', moduleCode: 'M8' },
  ];

  isRecruitmentActive(): boolean {
    return this.router.url.startsWith('/recruitment');
  }

  isRecruitmentTabActive(tabId: string): boolean {
    if (!this.router.url.startsWith('/recruitment')) return false;
    const urlTree = this.router.parseUrl(this.router.url);
    const activeTab = urlTree.queryParams['tab'] || 'pipeline';
    return activeTab === tabId;
  }

  toggleRecruitmentGroup(): void {
    if (this.isSidebarCollapsed) {
      this.isSidebarCollapsed = false;
      this.isRecruitmentOpen = true;
      return;
    }
    this.isRecruitmentOpen = !this.isRecruitmentOpen;
  }

  logout() {
    this.authService.logout();
  }
}
