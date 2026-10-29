import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '@core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen bg-slate-950 flex flex-col justify-center items-center px-4 font-sans select-none">
      <div class="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl">
        <!-- Logo & Title -->
        <div class="text-center mb-8">
          <div class="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-600 font-bold text-white text-xl shadow-lg shadow-emerald-900/40 mb-3">
            U
          </div>
          <h2 class="text-xl font-bold text-slate-100 uppercase tracking-wider">UDDIPAN HRIS</h2>
          <p class="text-xs text-slate-400 mt-1">Enterprise Human Resource Information System</p>
        </div>

        <!-- Error Message Banner -->
        <div *ngIf="errorMessage" class="mb-4 p-3 rounded-lg bg-rose-950/80 border border-rose-800 text-rose-300 text-xs">
          {{ errorMessage }}
        </div>

        <!-- Login Form -->
        <form (ngSubmit)="onSubmit()" class="space-y-4">
          <div>
            <label class="block text-xs font-medium text-slate-300 mb-1">Email Address</label>
            <input 
              type="email" 
              name="email"
              [(ngModel)]="email" 
              required
              placeholder="admin@hris.local" 
              class="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" />
          </div>

          <div>
            <label class="block text-xs font-medium text-slate-300 mb-1">Password</label>
            <input 
              type="password" 
              name="password"
              [(ngModel)]="password" 
              required
              placeholder="••••••••" 
              class="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" />
          </div>

          <div class="pt-2">
            <button 
              type="submit" 
              [disabled]="loading"
              class="w-full py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold text-sm shadow-md transition-all">
              <span *ngIf="!loading">Sign In to Dashboard</span>
              <span *ngIf="loading">Authenticating...</span>
            </button>
          </div>
        </form>

        <!-- Default Credentials Helper Card -->
        <div class="mt-6 pt-4 border-t border-slate-800 text-center text-[11px] text-slate-500">
          Default Super Admin: <span class="text-slate-400 font-mono">admin&#64;hris.local</span> / <span class="text-slate-400 font-mono">admin123</span>
        </div>
      </div>
    </div>
  `
})
export class LoginComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  email: string = 'admin@hris.local';
  password: string = 'admin123';
  loading: boolean = false;
  errorMessage: string = '';

  onSubmit() {
    this.loading = true;
    this.errorMessage = '';

    this.authService.login({ email: this.email, password: this.password }).subscribe({
      next: (res) => {
        this.loading = false;
        if (res.success) {
          this.router.navigate(['/dashboard']);
        }
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.error?.message || 'Authentication failed. Please check credentials.';
      }
    });
  }
}
