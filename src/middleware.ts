import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export default function middleware(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value;

  console.log('[Middleware] Path:', request.nextUrl.pathname);
  console.log('[Middleware] Cookie exists:', !!token);
  console.log('[Middleware] Cookie name checked:', 'auth_token');
  console.log('[Middleware] JWT verification:', 'Skipped (Edge runtime lacks secret, relying on backend verification)');

  if (request.nextUrl.pathname.startsWith('/admin/dashboard')) {
    if (!token) {
      console.log('[Middleware] Access Denied: Missing auth_token cookie. Redirecting to /admin/login');
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
  }

  if (request.nextUrl.pathname === '/admin/login') {
    if (token) {
      console.log('[Middleware] Access Granted: Valid auth_token found. Redirecting to /admin/dashboard');
      return NextResponse.redirect(new URL('/admin/dashboard', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/dashboard/:path*', '/admin/login'],
};
