import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET || 'secret-vad-analysis-platform-key-2026';
const secretKey = new TextEncoder().encode(JWT_SECRET);

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('auth-token')?.value;

  // Define route check helpers
  const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/register');
  const isProtectedRoute = 
    pathname.startsWith('/dashboard') || 
    pathname.startsWith('/upload') || 
    pathname.startsWith('/analysis') || 
    pathname.startsWith('/history') || 
    pathname.startsWith('/settings') ||
    pathname.startsWith('/api/analyze') ||
    pathname.startsWith('/api/reports');

  // Verify JWT if token exists
  let payload = null;
  if (token) {
    try {
      const verified = await jwtVerify(token, secretKey);
      payload = verified.payload;
    } catch (err) {
      console.warn('JWT verification failed in proxy:', err);
    }
  }

  // Route protection rules:
  // 1. Unauthenticated users accessing protected routes -> redirect to login
  if (isProtectedRoute && !payload) {
    const loginUrl = new URL('/login', request.url);
    // Remember where they tried to go
    loginUrl.searchParams.set('callbackUrl', pathname);
    
    // Clear invalid token cookie if present
    const response = NextResponse.redirect(loginUrl);
    if (token) {
      response.cookies.delete('auth-token');
    }
    return response;
  }

  // 2. Authenticated users accessing login/register -> redirect to dashboard
  if (isAuthPage && payload) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

// Config to specify which paths the proxy runs on
export const config = {
  matcher: [
    '/login',
    '/register',
    '/dashboard/:path*',
    '/upload/:path*',
    '/analysis/:path*',
    '/history/:path*',
    '/settings/:path*',
    '/api/analyze/:path*',
    '/api/reports/:path*',
  ],
};
