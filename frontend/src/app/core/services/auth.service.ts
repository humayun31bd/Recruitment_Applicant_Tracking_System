import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { User, AuthResponse } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly apiUrl = '/api/v1/auth';
  private readonly USER_KEY = 'hris_user_profile';

  // In-memory token storage (never persisted to localStorage to prevent XSS theft)
  // claude.md Rule 20: "Local storage se saare tokens hata do"
  private inMemoryToken: string | null = null;

  currentUserSignal = signal<User | null>(this.getStoredUser());
  isAuthenticated = computed(() => !!this.currentUserSignal());

  constructor(private http: HttpClient, private router: Router) {
    // Purge any legacy tokens from localStorage to maintain strict compliance
    try {
      localStorage.removeItem('hris_access_token');
    } catch {}
  }

  login(credentials: { email: string; password: string; mfaToken?: string }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, credentials, { withCredentials: true }).pipe(
      tap((res) => {
        if (res.success && res.data) {
          // Store token in memory only; session is persisted via secure httpOnly SameSite=Strict cookies
          this.inMemoryToken = res.data.accessToken;
          sessionStorage.setItem(this.USER_KEY, JSON.stringify(res.data.user));
          this.currentUserSignal.set(res.data.user);
        }
      })
    );
  }

  logout(): void {
    this.http.post(`${this.apiUrl}/logout`, {}, { withCredentials: true }).subscribe({
      next: () => {},
      error: () => {}
    });

    this.inMemoryToken = null;
    sessionStorage.removeItem(this.USER_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.currentUserSignal.set(null);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return this.inMemoryToken;
  }

  hasRole(role: string): boolean {
    const user = this.currentUserSignal();
    return user ? user.roles.includes(role) : false;
  }

  hasPermission(permission: string): boolean {
    const user = this.currentUserSignal();
    return user ? user.permissions.includes(permission) : false;
  }

  private getStoredUser(): User | null {
    try {
      const stored = sessionStorage.getItem(this.USER_KEY) || localStorage.getItem(this.USER_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }
}
