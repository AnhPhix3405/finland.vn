import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const requests = new Map<string, { count: number; start: number }>();

const WINDOW_MS = 60 * 1000;
const LIMIT = 20;

function rateLimit(ip: string): { allowed: boolean; remaining: number; resetIn: number } {
  const now = Date.now();

  const record = requests.get(ip);

  if (!record) {
    requests.set(ip, { count: 1, start: now });
    return { allowed: true, remaining: LIMIT - 1, resetIn: WINDOW_MS };
  }

  if (now - record.start > WINDOW_MS) {
    requests.set(ip, { count: 1, start: now });
    return { allowed: true, remaining: LIMIT - 1, resetIn: WINDOW_MS };
  }

  record.count++;

  if (record.count > LIMIT) {
    const resetIn = WINDOW_MS - (now - record.start);
    return { allowed: false, remaining: 0, resetIn };
  }

  return { allowed: true, remaining: LIMIT - record.count, resetIn: WINDOW_MS - (now - record.start) };
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === '/admin/login') {
    return NextResponse.next();
  }

  if (pathname.startsWith('/api')) {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim()
      || request.headers.get('x-real-ip')
      || 'unknown';

    const result = rateLimit(ip);

    if (!result.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: 'Quá nhiều yêu cầu. Vui lòng thử lại sau.',
          retryAfter: Math.ceil(result.resetIn / 1000)
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil(result.resetIn / 1000)),
            'X-RateLimit-Limit': String(LIMIT),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(result.resetIn),
          }
        }
      );
    }

    const response = NextResponse.next();

    response.headers.set('X-RateLimit-Limit', String(LIMIT));
    response.headers.set('X-RateLimit-Remaining', String(result.remaining));
    response.headers.set('X-RateLimit-Reset', String(result.resetIn));

    return response;
  }

  if (pathname.startsWith('/admin')) {
    const adminRefreshToken = request.cookies.get('admin-refresh-token');

    if (!adminRefreshToken) {
      const loginUrl = new URL('/admin/login', request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  const userAuthRoutes = ['/tao-bai-dang', '/tai-khoan', '/bai-viet'];
  const isUserAuthRoute = userAuthRoutes.some(route => pathname.startsWith(route));

  if (isUserAuthRoute) {
    const userRefreshToken = request.cookies.get('refresh-token');

    if (!userRefreshToken) {
      const loginUrl = new URL('/dang-nhap', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/admin', '/tao-bai-dang', '/tai-khoan', '/bai-viet/:path*', '/api/:path*']
};
