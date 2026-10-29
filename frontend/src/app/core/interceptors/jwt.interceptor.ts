import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();

  // If request URL is relative (e.g. '/api/...'), route to backend on http://localhost:3000
  let targetUrl = req.url;
  if (targetUrl.startsWith('/api/')) {
    targetUrl = `http://localhost:3000${targetUrl}`;
  }

  const headers: Record<string, string> = {
    'X-Requested-With': 'XMLHttpRequest', // CSRF defense header
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const cloned = req.clone({
    url: targetUrl,
    withCredentials: true, // Enables httpOnly secure cookie transmission
    setHeaders: headers,
  });

  return next(cloned);
};
