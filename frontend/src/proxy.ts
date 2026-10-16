import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const userStr = request.cookies.get('user')?.value;
  const path = request.nextUrl.pathname;

  const isPublicPath = path === '/login' || path === '/signup';

  let user = null;
  if (userStr) {
    try {
      user = JSON.parse(decodeURIComponent(userStr));
    } catch (e) {
      console.error(e);
    }
  }

  if (!token && !isPublicPath && path !== '/') {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (token && isPublicPath && user) {
    if (user.role === 'Doctor') {
      return NextResponse.redirect(new URL('/doctor/dashboard', request.url));
    }
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  const patientPaths = ['/dashboard', '/upload', '/games', '/appointments'];
  if (token && user?.role === 'Doctor' && patientPaths.some(p => path === p)) {
    return NextResponse.redirect(new URL('/doctor/dashboard', request.url));
  }

  const doctorPaths = ['/doctor/dashboard', '/patients'];
  if (token && user?.role === 'Patient' && (doctorPaths.some(p => path === p) || path.startsWith('/patients/'))) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/',
    '/login',
    '/signup',
    '/dashboard',
    '/upload',
    '/games',
    '/appointments',
    '/doctor/:path*',
    '/patients/:path*',
  ],
};
