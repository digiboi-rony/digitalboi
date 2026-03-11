import { NextResponse } from 'next/server';

const PUBLIC_PATHS = ['/auth/login', '/auth/register', '/auth/forgot-password', '/api/auth/login', '/api/auth/register', '/api/auth/forgot-password'];

export function middleware(request) {
  const { pathname } = request.nextUrl;
  const isPublic = PUBLIC_PATHS.some(p => pathname.startsWith(p));
  const isApiAuth = pathname.startsWith('/api/auth');
  const isStatic = pathname.startsWith('/_next') || pathname.startsWith('/favicon') || pathname.startsWith('/manifest') || pathname.startsWith('/icon');

  if (isStatic || isPublic || isApiAuth) return NextResponse.next();

  // Check for token in cookies or Authorization header
  const token = request.cookies.get('digiboi_token')?.value;
  const authHeader = request.headers.get('authorization');
  const hasToken = token || (authHeader?.startsWith('Bearer ') && authHeader.length > 10);

  // For API routes - return 401 if no token
  if (pathname.startsWith('/api/') && !hasToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // For page routes - redirect to login if no token
  if (!pathname.startsWith('/api/') && !hasToken) {
    const url = request.nextUrl.clone();
    url.pathname = '/auth/login';
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|manifest.json|icon).*)'],
};
