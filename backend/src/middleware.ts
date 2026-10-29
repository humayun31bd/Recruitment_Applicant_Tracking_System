import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, verifyCsrfRequest } from './lib/security';

const ALLOWED_ORIGINS = new Set([
  'http://localhost:4200',
  'http://localhost:3000',
  'http://127.0.0.1:4200',
  'http://127.0.0.1:3000',
]);

export function middleware(req: NextRequest) {
  const origin = req.headers.get('origin');
  const isApiRoute = req.nextUrl.pathname.startsWith('/api/');

  // 1. CORS Tightening (claude.md Rule 23: "CORS settings tight karo")
  let allowOrigin = '';
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    allowOrigin = origin;
  } else if (!origin && process.env.NODE_ENV !== 'production') {
    allowOrigin = 'http://localhost:4200';
  }

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    const preflightHeaders = new Headers();
    if (allowOrigin) {
      preflightHeaders.set('Access-Control-Allow-Origin', allowOrigin);
      preflightHeaders.set('Access-Control-Allow-Credentials', 'true');
    }
    preflightHeaders.set(
      'Access-Control-Allow-Methods',
      'GET,OPTIONS,PATCH,DELETE,POST,PUT'
    );
    preflightHeaders.set(
      'Access-Control-Allow-Headers',
      'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
    );
    return new NextResponse(null, { status: 204, headers: preflightHeaders });
  }

  // 2. Global API Rate Limiting (claude.md Rule 12: "Rate limiting add karo")
  if (isApiRoute) {
    const clientIp = req.headers.get('x-forwarded-for') || req.ip || 'anonymous';
    const rateCheck = checkRateLimit(`api_${clientIp}`, 120, 60 * 1000); // 120 req/min
    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          success: false,
          message: 'API rate limit exceeded. Please throttle your requests.',
        },
        {
          status: 429,
          headers: { 'Retry-After': '60' },
        }
      );
    }
  }

  // 3. CSRF Protection for mutating requests (claude.md Rule 7: "CSRF protection add karo")
  if (isApiRoute && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    const isCsrfSafe = verifyCsrfRequest(req);
    if (!isCsrfSafe) {
      return NextResponse.json(
        {
          success: false,
          message: 'CSRF verification failed: Forbidden cross-origin request.',
        },
        { status: 403 }
      );
    }
  }

  // Proceed with request
  const response = NextResponse.next();

  // 4. Tight Security Headers (claude.md Rule 6: "Cross-site scripting block karo")
  if (allowOrigin) {
    response.headers.set('Access-Control-Allow-Origin', allowOrigin);
    response.headers.set('Access-Control-Allow-Credentials', 'true');
  }

  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' http://localhost:4200 http://localhost:3000; frame-ancestors 'none';"
  );
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  return response;
}

export const config = {
  matcher: ['/api/:path*'],
};
