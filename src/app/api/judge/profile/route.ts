import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { judges } from "@/db/schema";
import { eq } from "drizzle-orm";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET!;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}

// GET handler - Get current judge's profile information
export async function GET(request: NextRequest) {
  try {
    // Get judge token from cookie
    const judgeToken = request.cookies.get('judge-token')?.value;
    
    if (!judgeToken) {
      return NextResponse.json({ 
        error: 'Judge authentication required',
        code: 'NO_JUDGE_TOKEN'
      }, { status: 401 });
    }

    // Verify and decode JWT token
    let decoded;
    try {
      decoded = jwt.verify(judgeToken, JWT_SECRET) as any;
    } catch (error) {
      return NextResponse.json({ 
        error: 'Invalid judge token',
        code: 'INVALID_TOKEN'
      }, { status: 401 });
    }

    if (!decoded.judgeId || !decoded.isJudge) {
      return NextResponse.json({ 
        error: 'Invalid judge token payload',
        code: 'INVALID_JUDGE_TOKEN'
      }, { status: 401 });
    }

    // Get judge information from database
    const judgeUser = await db.select({
      id: judges.id,
      username: judges.username,
      name: judges.name,
      createdAt: judges.createdAt
    })
    .from(judges)
    .where(eq(judges.id, decoded.judgeId))
    .limit(1);

    if (judgeUser.length === 0) {
      return NextResponse.json({ 
        error: 'Judge not found in database',
        code: 'JUDGE_NOT_FOUND'
      }, { status: 404 });
    }

    const judge = judgeUser[0];

    return NextResponse.json({
      success: true,
      judge: {
        id: judge.id,
        username: judge.username,
        name: judge.name,
        role: 'judge',
        createdAt: judge.createdAt
      }
    });

  } catch (error) {
    console.error('GET judge profile error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch judge profile',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}