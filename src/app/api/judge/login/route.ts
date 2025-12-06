import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { judges } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET!;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();

    console.log('Judge login attempt for username:', username);

    if (!username || !password) {
      return NextResponse.json({ 
        success: false, 
        error: "Username and password are required" 
      }, { status: 400 });
    }

    // Check if judge exists in judges table
    const judgeUser = await db.select()
      .from(judges)
      .where(eq(judges.username, username))
      .limit(1);

    if (judgeUser.length === 0) {
      console.log('No judge found for username:', username);
      return NextResponse.json({ 
        success: false, 
        error: "Invalid judge credentials" 
      }, { status: 401 });
    }

    const judge = judgeUser[0];

    // Verify password
    const isValidPassword = await bcrypt.compare(password, judge.password);

    if (!isValidPassword) {
      console.log('Judge password mismatch for username:', username);
      return NextResponse.json({ 
        success: false, 
        error: "Invalid judge credentials" 
      }, { status: 401 });
    }

    // Create JWT token for judge
    const judgeTokenPayload = {
      judgeId: judge.id,
      username: judge.username,
      role: 'judge',
      isJudge: true
    };

    const judgeToken = jwt.sign(judgeTokenPayload, JWT_SECRET, { expiresIn: '24h' });

    // Create response with authentication cookies
    const response = NextResponse.json({ 
      success: true, 
      message: "Judge login successful",
      judge: {
        id: judge.id,
        username: judge.username,
        name: judge.name
      },
      token: judgeToken
    });

    // Set secure judge authentication cookie with JWT token
    response.cookies.set("judge-token", judgeToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/'
    });

    // Set judge authentication flag that the client can read
    response.cookies.set("judge-auth", "true", {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/'
    });

    // Store minimal judge user data in cookie for client-side display
    response.cookies.set("judge-user", JSON.stringify({
      id: judge.id,
      username: judge.username,
      name: judge.name
    }), {
      httpOnly: false, // Allow client-side access for user data
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/'
    });

    return response;

  } catch (error) {
    console.error("Judge login error:", error);
    return NextResponse.json({ 
      success: false, 
      error: "Login failed" 
    }, { status: 500 });
  }
}