import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === '/admin/login') {
    return NextResponse.next();
  }

  if (pathname.startsWith('/admin')) {
    const adminRefreshToken = request.cookies.get('admin-refresh-token');

    if (!adminRefreshToken) {
      const loginUrl = new URL('/admin/login', request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  const userAuthRoutes = ['/tao-bai-dang', '/tai-khoan'];
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
  matcher: ['/admin/:path*', '/admin', '/tao-bai-dang', '/tai-khoan']
};
