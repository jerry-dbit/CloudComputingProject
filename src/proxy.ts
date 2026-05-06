import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { parseSessionValue, SESSION_COOKIE_NAME } from '@/lib/auth/session';

const PUBLIC_PATHS = new Set([
  '/',
  '/api/auth/github',
  '/api/auth/github/callback',
  '/auth/github/callback',
  '/api/auth/me',
  '/api/auth/logout',
]);

const PROTECTED_PREFIXES = ['/dashboard', '/documents', '/rooms', '/settings', '/api'];

function isPublic(pathname: string) {
  if (PUBLIC_PATHS.has(pathname)) return true;
  if (pathname.startsWith('/_next')) return true;
  if (pathname.startsWith('/favicon')) return true;
  if (pathname.startsWith('/public')) return true;
  return false;
}

function isProtected(pathname: string) {
  return PROTECTED_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPublic(pathname) || !isProtected(pathname)) {
    return NextResponse.next();
  }

  const session = parseSessionValue(request.cookies.get(SESSION_COOKIE_NAME)?.value);
  if (session) {
    return NextResponse.next();
  }

  const loginUrl = new URL('/', request.url);
  loginUrl.searchParams.set('next', pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: '/:path*',
};
