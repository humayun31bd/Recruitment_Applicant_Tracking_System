import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface WorkflowStepView {
  stepOrder: number;
  stepName: string;
  approverRole: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SENT_BACK' | 'WAITING';
  actorName?: string;
  remarks?: string;
  timestamp?: string;
}

@Component({
  selector: 'app-approval-stepper',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="w-full bg-slate-850 border border-slate-800 rounded-xl p-5 my-4">
      <h3 class="text-sm font-semibold tracking-wider text-slate-400 uppercase mb-4">
        Approval Lifecycle Pipeline
      </h3>
      
      <div class="relative flex items-center justify-between">
        <!-- Connecting Line -->
        <div class="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-0.5 bg-slate-700 -z-0"></div>

        <div *ngFor="let step of steps; let i = index" class="relative z-10 flex flex-col items-center group">
          <!-- Step Indicator Dot -->
          <div 
            [ngClass]="{
              'bg-emerald-500 text-white ring-4 ring-emerald-500/20': step.status === 'APPROVED',
              'bg-amber-500 text-slate-900 ring-4 ring-amber-500/20 animate-pulse': step.status === 'PENDING',
              'bg-rose-500 text-white ring-4 ring-rose-500/20': step.status === 'REJECTED',
              'bg-purple-500 text-white ring-4 ring-purple-500/20': step.status === 'SENT_BACK',
              'bg-slate-800 text-slate-400 border border-slate-700': step.status === 'WAITING'
            }"
            class="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shadow-md transition-all duration-200">
            {{ step.stepOrder }}
          </div>

          <!-- Step Label -->
          <div class="mt-2 text-center">
            <p class="text-xs font-medium text-slate-200">{{ step.stepName }}</p>
            <p class="text-[10px] text-slate-400">{{ step.approverRole }}</p>
            
            <span 
              [ngClass]="{
                'text-emerald-400 bg-emerald-950/60 border-emerald-800': step.status === 'APPROVED',
                'text-amber-400 bg-amber-950/60 border-amber-800': step.status === 'PENDING',
                'text-rose-400 bg-rose-950/60 border-rose-800': step.status === 'REJECTED',
                'text-purple-400 bg-purple-950/60 border-purple-800': step.status === 'SENT_BACK',
                'text-slate-500 bg-slate-900 border-slate-800': step.status === 'WAITING'
              }"
              class="inline-block mt-1 text-[9px] px-2 py-0.5 rounded-full border font-semibold tracking-wide">
              {{ step.status }}
            </span>
          </div>
        </div>
      </div>
    </div>
  `
})
export class ApprovalStepperComponent {
  @Input() steps: WorkflowStepView[] = [];
}
