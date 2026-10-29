import { 
  Component, 
  Input, 
  Output, 
  EventEmitter, 
  forwardRef, 
  ElementRef, 
  HostListener, 
  OnInit 
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';

export interface CalendarDay {
  date: Date;
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  isDisabled: boolean;
  dateString: string; // YYYY-MM-DD
}

@Component({
  selector: 'app-datepicker',
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DatepickerComponent),
      multi: true
    }
  ],
  template: `
    <div class="relative w-full" (click)="$event.stopPropagation()">
      <!-- Label -->
      <label *ngIf="label" class="block text-xs font-medium text-slate-300 mb-1">
        {{ label }}
        <span *ngIf="required" class="text-rose-400">*</span>
      </label>

      <!-- Input Trigger Field -->
      <div 
        (click)="toggleCalendar()"
        [ngClass]="{
          'border-emerald-500 ring-1 ring-emerald-500/50': isOpen,
          'border-slate-800 hover:border-slate-700': !isOpen,
          'opacity-50 cursor-not-allowed': disabled,
          'cursor-pointer': !disabled
        }"
        class="w-full bg-slate-950 border rounded-lg px-3 py-2 text-xs flex items-center justify-between transition-colors shadow-inner select-none group">
        
        <div class="flex items-center gap-2 min-w-0">
          <svg class="w-4 h-4 text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          
          <span *ngIf="value" class="text-slate-100 font-medium truncate">
            {{ formatDisplayDate(value) }}
          </span>
          <span *ngIf="!value" class="text-slate-500 truncate">
            {{ placeholder }}
          </span>
        </div>

        <div class="flex items-center gap-1.5 shrink-0 ml-2">
          <!-- Clear Button -->
          <button 
            *ngIf="value && !disabled"
            type="button" 
            (click)="clearDate($event)"
            title="Clear date"
            class="text-slate-500 hover:text-slate-300 text-xs px-1 rounded hover:bg-slate-800 transition-colors">
            ✕
          </button>
          
          <!-- Dropdown Arrow -->
          <svg 
            class="w-3.5 h-3.5 text-slate-400 transition-transform duration-200"
            [class.rotate-180]="isOpen"
            fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      <!-- Helper Text -->
      <p *ngIf="helperText" class="text-[10px] text-slate-500 mt-1">
        {{ helperText }}
      </p>

      <!-- Calendar Popover Modal / Dropdown -->
      <div 
        *ngIf="isOpen"
        class="absolute left-0 top-full mt-1.5 z-50 w-80 bg-slate-900 border border-slate-700/80 rounded-xl shadow-2xl p-3.5 space-y-3 animate-in fade-in zoom-in-95 duration-150">
        
        <!-- Header: Month & Year Controls -->
        <div class="flex items-center justify-between pb-2 border-b border-slate-800">
          <button 
            type="button" 
            (click)="prevMonth()" 
            class="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors text-xs font-bold">
            &larr;
          </button>

          <div class="flex items-center gap-1.5">
            <!-- Month Dropdown -->
            <select 
              [ngModel]="currentMonth" 
              (ngModelChange)="onMonthChange($event)"
              class="bg-slate-950 border border-slate-800 rounded-md px-2 py-1 text-xs font-semibold text-slate-200 focus:outline-none focus:border-emerald-500">
              <option *ngFor="let m of monthNames; let i = index" [value]="i">
                {{ m }}
              </option>
            </select>

            <!-- Year Dropdown -->
            <select 
              [ngModel]="currentYear" 
              (ngModelChange)="onYearChange($event)"
              class="bg-slate-950 border border-slate-800 rounded-md px-2 py-1 text-xs font-semibold text-slate-200 focus:outline-none focus:border-emerald-500">
              <option *ngFor="let y of availableYears" [value]="y">
                {{ y }}
              </option>
            </select>
          </div>

          <button 
            type="button" 
            (click)="nextMonth()" 
            class="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors text-xs font-bold">
            &rarr;
          </button>
        </div>

        <!-- Quick Shortcut Presets for Job Deadlines -->
        <div *ngIf="showPresets" class="space-y-1">
          <span class="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">
            Quick Deadline Presets:
          </span>
          <div class="grid grid-cols-3 gap-1">
            <button 
              type="button"
              *ngFor="let preset of presets"
              (click)="applyPreset(preset.days)"
              class="px-2 py-1 text-[10px] font-medium bg-slate-950 hover:bg-emerald-950 hover:text-emerald-300 text-slate-400 border border-slate-800 hover:border-emerald-800/80 rounded transition-all truncate text-center">
              {{ preset.label }}
            </button>
          </div>
        </div>

        <!-- Day of Week Headers -->
        <div class="grid grid-cols-7 gap-1 text-center font-mono text-[10px] text-slate-500 uppercase font-semibold">
          <span *ngFor="let day of weekDays">{{ day }}</span>
        </div>

        <!-- Day Cells Grid -->
        <div class="grid grid-cols-7 gap-1 text-center text-xs">
          <button 
            type="button"
            *ngFor="let day of calendarDays"
            [disabled]="day.isDisabled"
            (click)="selectDate(day)"
            [ngClass]="{
              'bg-emerald-600 text-white font-bold shadow-md ring-1 ring-emerald-400': day.isSelected,
              'text-slate-200 hover:bg-slate-800 hover:text-emerald-300': !day.isSelected && !day.isDisabled && day.isCurrentMonth,
              'text-slate-600 hover:bg-slate-800/50': !day.isSelected && !day.isDisabled && !day.isCurrentMonth,
              'opacity-20 cursor-not-allowed line-through': day.isDisabled,
              'border border-emerald-500/40 font-semibold': day.isToday && !day.isSelected
            }"
            class="h-8 rounded-lg flex items-center justify-center transition-all select-none">
            {{ day.dayNumber }}
          </button>
        </div>

        <!-- Popover Footer -->
        <div class="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px]">
          <button 
            type="button" 
            (click)="selectToday()" 
            class="text-emerald-400 hover:text-emerald-300 font-semibold transition-colors">
            Today
          </button>
          
          <button 
            type="button" 
            (click)="closeCalendar()" 
            class="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors font-medium text-[10px]">
            Done
          </button>
        </div>
      </div>
    </div>
  `
})
export class DatepickerComponent implements OnInit, ControlValueAccessor {
  @Input() label: string = '';
  @Input() placeholder: string = 'Select deadline date';
  @Input() value: string = ''; // Format: YYYY-MM-DD
  @Input() minDate: string = ''; // e.g. 'today' or '2026-10-27'
  @Input() maxDate: string = '';
  @Input() showPresets: boolean = true;
  @Input() required: boolean = false;
  @Input() helperText: string = '';
  @Input() disabled: boolean = false;

  @Output() valueChange = new EventEmitter<string>();

  isOpen: boolean = false;
  currentMonth: number = new Date().getMonth();
  currentYear: number = new Date().getFullYear();
  calendarDays: CalendarDay[] = [];

  monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  availableYears: number[] = [];

  presets = [
    { label: '+7 Days', days: 7 },
    { label: '+15 Days', days: 15 },
    { label: '+21 Days', days: 21 },
    { label: '+30 Days (1M)', days: 30 },
    { label: '+45 Days', days: 45 },
    { label: '+60 Days (2M)', days: 60 },
  ];

  private onChange: (val: string) => void = () => {};
  private onTouched: () => void = () => {};

  constructor(private elementRef: ElementRef) {}

  ngOnInit(): void {
    const startYear = new Date().getFullYear() - 1;
    this.availableYears = Array.from({ length: 12 }, (_, i) => startYear + i);
    
    if (this.value) {
      this.initCalendarFromValue(this.value);
    } else {
      this.currentMonth = new Date().getMonth();
      this.currentYear = new Date().getFullYear();
    }
    this.generateCalendar();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.isOpen = false;
    }
  }

  @HostListener('document:keydown.escape')
  onEscapePress(): void {
    this.isOpen = false;
  }

  toggleCalendar(): void {
    if (this.disabled) return;
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      if (this.value) {
        this.initCalendarFromValue(this.value);
      }
      this.generateCalendar();
    }
  }

  closeCalendar(): void {
    this.isOpen = false;
    this.onTouched();
  }

  initCalendarFromValue(val: string): void {
    const parts = val.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      if (!isNaN(year) && !isNaN(month)) {
        this.currentYear = year;
        this.currentMonth = month;
      }
    }
  }

  prevMonth(): void {
    if (this.currentMonth === 0) {
      this.currentMonth = 11;
      this.currentYear--;
    } else {
      this.currentMonth--;
    }
    this.generateCalendar();
  }

  nextMonth(): void {
    if (this.currentMonth === 11) {
      this.currentMonth = 0;
      this.currentYear++;
    } else {
      this.currentMonth++;
    }
    this.generateCalendar();
  }

  onMonthChange(newMonth: number): void {
    this.currentMonth = Number(newMonth);
    this.generateCalendar();
  }

  onYearChange(newYear: number): void {
    this.currentYear = Number(newYear);
    this.generateCalendar();
  }

  generateCalendar(): void {
    const firstDayOfMonth = new Date(this.currentYear, this.currentMonth, 1);
    const lastDayOfMonth = new Date(this.currentYear, this.currentMonth + 1, 0);
    const startingDayOfWeek = firstDayOfMonth.getDay();
    const daysInMonth = lastDayOfMonth.getDate();

    const today = new Date();
    const todayStr = this.formatDateString(today);

    let minDateObj: Date | null = null;
    if (this.minDate === 'today') {
      minDateObj = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    } else if (this.minDate) {
      const parts = this.minDate.split('-');
      if (parts.length === 3) {
        minDateObj = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      }
    }

    let maxDateObj: Date | null = null;
    if (this.maxDate) {
      const parts = this.maxDate.split('-');
      if (parts.length === 3) {
        maxDateObj = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      }
    }

    const days: CalendarDay[] = [];

    // Previous month filler days
    const prevMonthLastDay = new Date(this.currentYear, this.currentMonth, 0).getDate();
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const d = new Date(this.currentYear, this.currentMonth - 1, prevMonthLastDay - i);
      const dStr = this.formatDateString(d);
      days.push({
        date: d,
        dayNumber: prevMonthLastDay - i,
        isCurrentMonth: false,
        isToday: dStr === todayStr,
        isSelected: dStr === this.value,
        isDisabled: this.isDateDisabled(d, minDateObj, maxDateObj),
        dateString: dStr
      });
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(this.currentYear, this.currentMonth, i);
      const dStr = this.formatDateString(d);
      days.push({
        date: d,
        dayNumber: i,
        isCurrentMonth: true,
        isToday: dStr === todayStr,
        isSelected: dStr === this.value,
        isDisabled: this.isDateDisabled(d, minDateObj, maxDateObj),
        dateString: dStr
      });
    }

    // Next month filler days to complete 6 weeks (42 cells) or minimum 35 cells
    const remainingCells = 42 - days.length;
    for (let i = 1; i <= remainingCells; i++) {
      const d = new Date(this.currentYear, this.currentMonth + 1, i);
      const dStr = this.formatDateString(d);
      days.push({
        date: d,
        dayNumber: i,
        isCurrentMonth: false,
        isToday: dStr === todayStr,
        isSelected: dStr === this.value,
        isDisabled: this.isDateDisabled(d, minDateObj, maxDateObj),
        dateString: dStr
      });
    }

    this.calendarDays = days;
  }

  isDateDisabled(date: Date, min: Date | null, max: Date | null): boolean {
    const checkDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    if (min && checkDate.getTime() < min.getTime()) {
      return true;
    }
    if (max && checkDate.getTime() > max.getTime()) {
      return true;
    }
    return false;
  }

  selectDate(day: CalendarDay): void {
    if (day.isDisabled) return;
    this.value = day.dateString;
    this.emitChange();
    this.isOpen = false;
    this.generateCalendar();
  }

  selectToday(): void {
    const today = new Date();
    const todayStr = this.formatDateString(today);
    
    // Check if today is disabled
    let minDateObj: Date | null = null;
    if (this.minDate === 'today') {
      minDateObj = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    } else if (this.minDate) {
      const parts = this.minDate.split('-');
      if (parts.length === 3) {
        minDateObj = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      }
    }
    if (minDateObj && today.getTime() < minDateObj.getTime()) return;

    this.currentMonth = today.getMonth();
    this.currentYear = today.getFullYear();
    this.value = todayStr;
    this.emitChange();
    this.isOpen = false;
    this.generateCalendar();
  }

  applyPreset(daysToAdd: number): void {
    const target = new Date();
    target.setDate(target.getDate() + daysToAdd);
    this.currentMonth = target.getMonth();
    this.currentYear = target.getFullYear();
    this.value = this.formatDateString(target);
    this.emitChange();
    this.isOpen = false;
    this.generateCalendar();
  }

  clearDate(event: MouseEvent): void {
    event.stopPropagation();
    this.value = '';
    this.emitChange();
    this.generateCalendar();
  }

  formatDateString(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  formatDisplayDate(val: string): string {
    if (!val) return '';
    try {
      const parts = val.split('-');
      if (parts.length === 3) {
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const day = parseInt(parts[2], 10);
        const d = new Date(year, month, day);
        if (!isNaN(d.getTime())) {
          const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
          const monthName = d.toLocaleDateString('en-US', { month: 'short' });
          return `${day} ${monthName} ${year} (${dayName})`;
        }
      }
    } catch (_) {}
    return val;
  }

  private emitChange(): void {
    this.onChange(this.value);
    this.valueChange.emit(this.value);
    this.onTouched();
  }

  // ControlValueAccessor methods
  writeValue(value: any): void {
    this.value = value || '';
    if (this.value) {
      this.initCalendarFromValue(this.value);
    }
    this.generateCalendar();
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState?(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }
}
