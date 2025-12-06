
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from '@/db/index';
import { admins } from '@/db/schema';
import { eq } from 'drizzle-orm';
import jwt from "jsonwebtoken";
import { checkRateLimit, createSafeErrorResponse } from '@/lib/utils';

export async function POST(req: NextRequest) {
  try {
    // Get client IP for rate limiting
    const clientIP = req.headers.get('x-forwarded-for') ||
                     req.headers.get('x-real-ip') ||
                     'unknown';

    // Rate limit: 3 admin login attempts per 15 minutes per IP (stricter for admin)
    const rateLimit = checkRateLimit(`admin_login_${clientIP}`, 3, 15 * 60 * 1000);

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
  
  console.log('Admin login attempt for username:', username);
  
  // Find admin by username
  const admin = await db.select().from(admins).where(eq(admins.username, username)).limit(1);
  
  if (!admin.length) {
    console.log('No admin found for username:', username);
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }
  
  const valid = await bcrypt.compare(password, admin[0].password);
  
  if (!valid) {
    console.log('Password mismatch for username:', username);
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }
  // Set admin session with JWT
  const JWT_SECRET = process.env.JWT_SECRET;
  if (!JWT_SECRET) {
    return NextResponse.json({ error: "Server misconfiguration: JWT_SECRET missing" }, { status: 500 });
  }

  // Use admin id for JWT payload
  const adminId = admin[0].id;
  const token = jwt.sign({ userId: adminId, isAdmin: true }, JWT_SECRET, { expiresIn: "24h" });

  // Set cookie using NextResponse
  const response = NextResponse.json({ success: true }, { status: 200 });
  response.cookies.set("auth-token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24, // 24 hours
    path: "/"
  });
  return response;
  } catch (error) {
    console.error('Admin login error:', error);
    const safeError = createSafeErrorResponse(error, 'Login failed');
    return NextResponse.json({ 
      error: safeError.error,
      details: safeError.details
    }, { status: safeError.statusCode });
  }
}
