import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const jwtSecret = new TextEncoder().encode(process.env.JWT_SECRET || 'secret');

async function isValidToken(token: string): Promise<boolean> {
  try {
    await jwtVerify(token, jwtSecret);
    return true;
  } catch {
    return false;
  }
}

export default async function middleware(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value;
  const isDashboard = request.nextUrl.pathname.startsWith('/admin/dashboard');
  const isLogin = request.nextUrl.pathname === '/admin/login';
  const isAdminRoot = request.nextUrl.pathname === '/admin';

  if (isAdminRoot) {
    return NextResponse.redirect(new URL('/admin/dashboard', request.url));
  }

  if (isDashboard) {
    if (!token || !(await isValidToken(token))) {
      const response = NextResponse.redirect(new URL('/admin/login', request.url));
      response.cookies.delete('auth_token');
      return response;
    }
  }

  if (isLogin) {
    if (token && (await isValidToken(token))) {
      return NextResponse.redirect(new URL('/admin/dashboard', request.url));
    }

    if (token) {
      const response = NextResponse.next();
      response.cookies.delete('auth_token');
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin', '/admin/dashboard/:path*', '/admin/login'],
};
