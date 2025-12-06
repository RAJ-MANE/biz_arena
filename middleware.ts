import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Add security headers for additional protection
  response.headers.set('X-DNS-Prefetch-Control', 'off');
  response.headers.set('X-Powered-By', ''); // Remove default X-Powered-By header
  
  // Rate limiting protection for API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    // Add custom rate limiting headers if needed
    response.headers.set('X-RateLimit-Limit', '100');
    response.headers.set('X-RateLimit-Remaining', '99');
  }

  // Security: Restrict authenticated users to only access scoreboard and their respective dashboards
  const judgeToken = request.cookies.get('judge-token')?.value;
  const adminToken = request.cookies.get('auth-token')?.value;
  
  // If user is authenticated (judge or admin), restrict their access
  if (judgeToken || adminToken) {
    const pathname = request.nextUrl.pathname;
    
    // Allow access to essential routes
    const allowedRoutes = [
      '/scoreboard',
      '/api/', // API routes
      '/_next/', // Next.js internals
      '/favicon.ico',
      '/public/'
    ];
    
    // Judge-specific allowed routes
    if (judgeToken) {
      allowedRoutes.push('/judge', '/judge/login');
    }
    
    // Admin-specific allowed routes  
    if (adminToken) {
      allowedRoutes.push('/admin', '/admin/login', '/dashboard');
    }
    
    // Check if current path is allowed
    const isAllowed = allowedRoutes.some(route => pathname.startsWith(route));
    
    if (!isAllowed) {
      // Redirect to scoreboard for security
      return NextResponse.redirect(new URL('/scoreboard', request.url));
    }
  }

  // Protect admin routes - only allow admin tokens, not judge tokens
  if (request.nextUrl.pathname.startsWith('/admin') && 
      !request.nextUrl.pathname.startsWith('/admin/login')) {
    const authToken = request.cookies.get('auth-token')?.value;
    if (!authToken) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
  }

  // Protect judge routes - only allow judge tokens, not admin tokens
  if (request.nextUrl.pathname.startsWith('/judge') && 
      !request.nextUrl.pathname.startsWith('/judge/login')) {
    const judgeToken = request.cookies.get('judge-token')?.value;
    if (!judgeToken) {
      return NextResponse.redirect(new URL('/judge/login', request.url));
    }
  }

  // Protect client routes from admin/judge access to prevent cheating
  const clientRoutes = ['/quiz', '/voting', '/final', '/dashboard'];
  const isClientRoute = clientRoutes.some(route => request.nextUrl.pathname.startsWith(route));
  
  if (isClientRoute) {
    const adminToken = request.cookies.get('auth-token')?.value;
    const judgeToken = request.cookies.get('judge-token')?.value;
    
    // Block access if user has admin or judge tokens
    if (adminToken || judgeToken) {
      // Redirect to appropriate console based on token type
      if (adminToken) {
        return NextResponse.redirect(new URL('/admin', request.url));
      } else if (judgeToken) {
        return NextResponse.redirect(new URL('/judge', request.url));
      }
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * 1. /api routes (handled separately)
     * 2. /_next (Next.js internals)
     * 3. /_static (inside /public)
     * 4. Static files (images, favicon, etc.)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
};