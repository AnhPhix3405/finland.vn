import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname === '/admin/login') {
    return NextResponse.next()
  }
  if (pathname.startsWith('/admin')) {
    const adminRefreshToken = request.cookies.get('admin-refresh-token');

    if (!adminRefreshToken) {
      const loginUrl = new URL('/admin/login', request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/admin']
};
