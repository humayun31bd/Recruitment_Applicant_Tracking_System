import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface ColumnDef {
  key: string;
  header: string;
  sortable?: boolean;
}

@Component({
  selector: 'app-data-table',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="w-full bg-slate-850 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
      <!-- Toolbar -->
      <div class="p-4 border-b border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div class="relative w-full sm:w-72">
          <input 
            type="text" 
            [(ngModel)]="searchQuery" 
            (ngModelChange)="onSearchChange()"
            placeholder="Search records..." 
            class="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
        </div>
        <div class="flex items-center gap-2">
          <button 
            (click)="exportCsv.emit()" 
            class="px-3 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg transition-colors">
            Export CSV
          </button>
          <button 
            (click)="refresh.emit()" 
            class="px-3 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors">
            Refresh
          </button>
        </div>
      </div>

      <!-- Table Body -->
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse text-xs">
          <thead>
            <tr class="bg-slate-900/80 border-b border-slate-800 text-slate-400 font-semibold tracking-wider uppercase">
              <th *ngFor="let col of columns" class="px-4 py-3 cursor-pointer select-none hover:text-slate-200" (click)="sort(col.key)">
                <div class="flex items-center gap-1.5">
                  <span>{{ col.header }}</span>
                  <span *ngIf="sortColumn === col.key" class="text-[10px] text-emerald-400">
                    {{ sortDirection === 'asc' ? '▲' : '▼' }}
                  </span>
                </div>
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-800/60">
            <tr *ngFor="let row of paginatedData" class="hover:bg-slate-800/40 transition-colors">
              <td *ngFor="let col of columns" class="px-4 py-3 text-slate-300">
                {{ row[col.key] }}
              </td>
            </tr>
            <tr *ngIf="paginatedData.length === 0">
              <td [attr.colspan]="columns.length" class="px-4 py-8 text-center text-slate-500">
                No matching records found
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination Footer -->
      <div class="p-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
        <div>
          Showing {{ startIndex + 1 }} to {{ endIndex }} of {{ filteredData.length }} entries
        </div>
        <div class="flex items-center gap-1">
          <button 
            [disabled]="currentPage === 1" 
            (click)="setPage(currentPage - 1)" 
            class="px-2.5 py-1 rounded bg-slate-800 disabled:opacity-40 hover:bg-slate-700 text-slate-300">
            Prev
          </button>
          <span class="px-2">Page {{ currentPage }} of {{ totalPages }}</span>
          <button 
            [disabled]="currentPage === totalPages || totalPages === 0" 
            (click)="setPage(currentPage + 1)" 
            class="px-2.5 py-1 rounded bg-slate-800 disabled:opacity-40 hover:bg-slate-700 text-slate-300">
            Next
          </button>
        </div>
      </div>
    </div>
  `
})
export class DataTableComponent {
  @Input() columns: ColumnDef[] = [];
  @Input() data: any[] = [];
  @Output() refresh = new EventEmitter<void>();
  @Output() exportCsv = new EventEmitter<void>();

  searchQuery: string = '';
  sortColumn: string = '';
  sortDirection: 'asc' | 'desc' = 'asc';
  currentPage: number = 1;
  pageSize: number = 10;

  get filteredData(): any[] {
    let result = [...this.data];
    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase();
      result = result.filter(row =>
        Object.values(row).some(val => String(val).toLowerCase().includes(q))
      );
    }
    if (this.sortColumn) {
      result.sort((a, b) => {
        const valA = a[this.sortColumn];
        const valB = b[this.sortColumn];
        if (valA < valB) return this.sortDirection === 'asc' ? -1 : 1;
        if (valA > valB) return this.sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return result;
  }

  get paginatedData(): any[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredData.slice(start, start + this.pageSize);
  }

  get totalPages(): number {
    return Math.ceil(this.filteredData.length / this.pageSize) || 1;
  }

  get startIndex(): number {
    return (this.currentPage - 1) * this.pageSize;
  }

  get endIndex(): number {
    return Math.min(this.startIndex + this.pageSize, this.filteredData.length);
  }

  onSearchChange() {
    this.currentPage = 1;
  }

  sort(key: string) {
    if (this.sortColumn === key) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = key;
      this.sortDirection = 'asc';
    }
  }

  setPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }
}
