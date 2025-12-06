import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth-middleware';

export async function GET(req: Request) {
  try {
    // Note: In Next.js route handlers the request is a Web Request, but our helper expects NextRequest for cookies.
    // We'll construct a minimal NextRequest-like object by importing NextRequest if needed, but simpler approach:
    // Use the built-in cookies via NextResponse since authenticateRequest expects NextRequest, we'll call it via dynamic import.
    const { NextRequest } = await import('next/server');
    const nextReq = new NextRequest(req.url, { headers: req.headers as any });

    const authUser = await authenticateRequest(nextReq as any);
    if (!authUser) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    // Return minimal safe user data
    const safeUser = {
      id: authUser.id,
      username: authUser.username,
      name: authUser.name,
      isAdmin: authUser.isAdmin,
      team: authUser.team
    };

    return NextResponse.json({ authenticated: true, user: safeUser });
  } catch (error) {
    console.error('Error in /api/auth/me:', error);
    return NextResponse.json({ authenticated: false }, { status: 500 });
  }
}
