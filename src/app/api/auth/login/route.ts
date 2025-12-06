import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { user, teams } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { compareSync } from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { checkRateLimit, createSafeErrorResponse } from '@/lib/utils';

const JWT_SECRET = process.env.JWT_SECRET!;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}

export async function POST(req: NextRequest) {
  try {
    // Get client IP for rate limiting
    const clientIP = req.headers.get('x-forwarded-for') ||
                     req.headers.get('x-real-ip') ||
                     'unknown';

    // Rate limit: 5 login attempts per 15 minutes per IP
    const rateLimit = checkRateLimit(`login_${clientIP}`, 5, 15 * 60 * 1000);

    if (!rateLimit.allowed) {
      return NextResponse.json({
        error: 'Too many login attempts. Please try again later.',
        retryAfter: Math.ceil((rateLimit.resetTime - Date.now()) / 1000)
      }, {
        status: 429,
        headers: {
          'Retry-After': Math.ceil((rateLimit.resetTime - Date.now()) / 1000).toString(),
          'X-RateLimit-Remaining': rateLimit.remaining.toString(),
          'X-RateLimit-Reset': rateLimit.resetTime.toString()
        }
      });
    }

    const { username, password } = await req.json();
    
    if (!username || !password) {
      return NextResponse.json({ 
        error: 'Username and password are required' 
      }, { status: 400 });
    }

    // Find user by username (case insensitive) with team info
    const foundUsers = await db
      .select({
        id: user.id,
        username: user.username,
        name: user.name,
        password: user.password,
        isAdmin: user.isAdmin,
        teamId: user.teamId,
      })
      .from(user)
      .where(eq(user.username, username.trim().toLowerCase()))
      .limit(1);

    if (foundUsers.length === 0) {
      return NextResponse.json({ 
        error: 'Invalid username or password' 
      }, { status: 401 });
    }

    const foundUser = foundUsers[0];

    // Verify password
    const isPasswordValid = compareSync(password, foundUser.password);
    if (!isPasswordValid) {
      return NextResponse.json({ 
        error: 'Invalid username or password' 
      }, { status: 401 });
    }

    // Get user's team information from database
    let userTeam = null;
    if (foundUser.teamId) {
      const teamResult = await db
        .select()
        .from(teams)
        .where(eq(teams.id, foundUser.teamId))
        .limit(1);
      
      if (teamResult.length > 0) {
        userTeam = teamResult[0];
      }
    }

    // Create JWT token
    const tokenPayload = { 
      userId: foundUser.id, 
      username: foundUser.username,
      isAdmin: foundUser.isAdmin,
      teamId: foundUser.teamId,
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '7d' });

    // Prepare user response with full team information
    const userResponse = {
      id: foundUser.id,
      username: foundUser.username,
      name: foundUser.name,
      isAdmin: foundUser.isAdmin,
      teamId: foundUser.teamId,
      team: userTeam ? {
        id: userTeam.id,
        name: userTeam.name,
        college: userTeam.college,
        role: 'leader' // Since this user represents the team
      } : null,
    };

    // Create response with secure httpOnly cookie
    const response = NextResponse.json({ 
      success: true, 
      message: 'Login successful',
      user: userResponse,
      token // Also return token for client-side storage if needed
    });

    // Set httpOnly cookie for server-side authentication
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/'
    });

    return response;

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ 
      error: 'Login failed. Please try again.',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// GET handler - Check authentication status
export async function GET(req: NextRequest) {
  try {
    // Try to get token from cookie
    const token = req.cookies.get('auth-token')?.value;
    
    if (!token) {
      return NextResponse.json({ 
        authenticated: false,
        user: null 
      });
    }

    // Verify JWT token
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    if (!decoded.userId) {
      return NextResponse.json({ 
        authenticated: false,
        user: null 
      });
    }

    // Get current user info from database
    const foundUsers = await db
      .select({
        id: user.id,
        username: user.username,
        name: user.name,
        isAdmin: user.isAdmin,
        teamId: user.teamId,
      })
      .from(user)
      .where(eq(user.id, decoded.userId))
      .limit(1);

    if (foundUsers.length === 0) {
      return NextResponse.json({ 
        authenticated: false,
        user: null 
      });
    }

    const foundUser = foundUsers[0];

    // Get user's team information from database
    let userTeam = null;
    if (foundUser.teamId) {
      const teamResult = await db
        .select()
        .from(teams)
        .where(eq(teams.id, foundUser.teamId))
        .limit(1);
      
      if (teamResult.length > 0) {
        userTeam = teamResult[0];
      }
    }

    const userResponse = {
      id: foundUser.id,
      username: foundUser.username,
      name: foundUser.name,
      isAdmin: foundUser.isAdmin,
      teamId: foundUser.teamId,
      team: userTeam ? {
        id: userTeam.id,
        name: userTeam.name,
        college: userTeam.college,
        role: 'leader'
      } : null,
    };

    return NextResponse.json({ 
      authenticated: true,
      user: userResponse 
    });

  } catch (error) {
    console.error('Auth check error:', error);
    return NextResponse.json({ 
      authenticated: false,
      user: null 
    });
  }
}