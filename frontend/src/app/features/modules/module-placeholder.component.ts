import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-module-placeholder',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-6">
      <div class="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center max-w-2xl mx-auto shadow-xl">
        <div class="w-12 h-12 rounded-xl bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 font-mono font-bold text-lg flex items-center justify-center mx-auto mb-4">
          {{ moduleCode }}
        </div>
        <h2 class="text-xl font-bold text-slate-100">{{ moduleTitle }}</h2>
        <p class="text-xs text-slate-400 mt-2 max-w-md mx-auto leading-relaxed">
          {{ moduleDescription }}
        </p>

        <div class="mt-6 pt-6 border-t border-slate-800 text-left space-y-3">
          <h4 class="text-xs font-semibold text-slate-300 uppercase tracking-wider">Sub-Modules Configured in DFD:</h4>
          <ul class="text-xs text-slate-400 space-y-1.5 list-disc list-inside">
            <li *ngFor="let item of subModules">{{ item }}</li>
          </ul>
        </div>
      </div>
    </div>
  `
})
export class ModulePlaceholderComponent implements OnInit {
  moduleCode: string = '';
  moduleTitle: string = '';
  moduleDescription: string = '';
  subModules: string[] = [];

  constructor(private route: ActivatedRoute) {}

  ngOnInit() {
    this.route.data.subscribe((data) => {
      this.moduleCode = data['code'] || 'MODULE';
      this.moduleTitle = data['title'] || 'HRIS Sub-System';
      this.moduleDescription = data['description'] || 'Business logic and workflow interface.';
      this.subModules = data['subModules'] || [];
    });
  }
}
