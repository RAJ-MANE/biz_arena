// src/app/api/judges/scores/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { judgeScores, rounds, teams } from '@/db/schema';
import { eq, and, sum, avg, count } from 'drizzle-orm';
import { requireJudgeAuth } from '@/lib/auth-middleware';

// POST handler - Submit judge score (Judge authentication required during final round)
export async function POST(request: NextRequest) {
  try {
    // Require judge authentication
    await requireJudgeAuth(request);
    
    const { judgeName, teamId, score } = await request.json();
    
    if (!judgeName || !teamId || score === undefined) {
      return NextResponse.json({ 
        error: 'Judge name, team ID, and score are required', 
        code: 'MISSING_REQUIRED_FIELDS' 
      }, { status: 400 });
    }

    // Validate score is integer between 30-100
    if (!Number.isInteger(score) || score < 30 || score > 100) {
      return NextResponse.json({ 
        error: 'Score must be an integer between 30 and 100', 
        code: 'INVALID_SCORE' 
      }, { status: 400 });
    }

    // Validate judge name
    if (judgeName.trim().length < 1 || judgeName.trim().length > 100) {
      return NextResponse.json({ 
        error: 'Judge name must be between 1-100 characters', 
        code: 'INVALID_JUDGE_NAME' 
      }, { status: 400 });
    }

    // Check if rating is currently active using DB-backed rating state
    try {
      const { getRatingStateFromDb } = await import('@/lib/rating-state-db');
      const ratingState = await getRatingStateFromDb();
      if (!ratingState || !ratingState.ratingActive || ratingState.currentPhase !== 'rating-active') {
        return NextResponse.json({ 
          error: 'Rating is not currently active', 
          code: 'RATING_NOT_ACTIVE' 
        }, { status: 400 });
      }
    } catch (error) {
      console.error('Error checking rating status via DB:', error);
      return NextResponse.json({ 
        error: 'Failed to verify rating status', 
        code: 'RATING_CHECK_FAILED' 
      }, { status: 500 });
    }

    // Verify team exists
    const team = await db
      .select()
      .from(teams)
      .where(eq(teams.id, teamId))
      .limit(1);

    if (team.length === 0) {
      return NextResponse.json({ 
        error: 'Team not found', 
        code: 'TEAM_NOT_FOUND' 
      }, { status: 404 });
    }

    // Check if this judge already scored this team
    const existingScore = await db
      .select()
      .from(judgeScores)
      .where(and(
        eq(judgeScores.judgeName, judgeName.trim()),
        eq(judgeScores.teamId, teamId)
      ))
      .limit(1);

    if (existingScore.length > 0) {
      return NextResponse.json({ 
        error: 'This judge has already scored this team', 
        code: 'ALREADY_SCORED' 
      }, { status: 409 });
    }

    const newScore = await db.insert(judgeScores).values({
      judgeName: judgeName.trim(),
      teamId: teamId,
      score: score,
      round: 'FINAL',
      createdAt: new Date(),
    }).returning();

    return NextResponse.json({
      success: true,
      score: newScore[0],
      message: `Judge ${judgeName.trim()} scored ${team[0].name} with ${score} points`
    }, { status: 201 });

  } catch (error: any) {
    console.error('POST judge score error:', error);
    
    if (error.message === 'Authentication required') {
      return NextResponse.json({ 
        error: 'Authentication required', 
        code: 'UNAUTHENTICATED' 
      }, { status: 401 });
    }
    
    if (error.message === 'Judge authentication required') {
      return NextResponse.json({ 
        error: 'Judge authentication required', 
        code: 'JUDGE_AUTH_REQUIRED' 
      }, { status: 403 });
    }

    return NextResponse.json({ 
      error: 'Failed to submit judge score',
      details: error.message || 'Unknown error'
    }, { status: 500 });
  }
}

// GET handler - Get judge scores with filtering and stats
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const teamId = searchParams.get('teamId');
    const judgeName = searchParams.get('judgeName');

    // Apply filters
    const whereConditions = [];
    if (teamId) {
      whereConditions.push(eq(judgeScores.teamId, parseInt(teamId)));
    }
    if (judgeName) {
      whereConditions.push(eq(judgeScores.judgeName, judgeName));
    }

    let scores;
    if (whereConditions.length > 0) {
      scores = await db
        .select({
          id: judgeScores.id,
          judgeName: judgeScores.judgeName,
          teamId: judgeScores.teamId,
          score: judgeScores.score,
          round: judgeScores.round,
          createdAt: judgeScores.createdAt,
        })
        .from(judgeScores)
        .where(and(...whereConditions))
        .orderBy(judgeScores.createdAt);
    } else {
      scores = await db
        .select({
          id: judgeScores.id,
          judgeName: judgeScores.judgeName,
          teamId: judgeScores.teamId,
          score: judgeScores.score,
          round: judgeScores.round,
          createdAt: judgeScores.createdAt,
        })
        .from(judgeScores)
        .orderBy(judgeScores.createdAt);
    }

    // If requesting specific team scores, include summary stats
    if (teamId && !judgeName) {
      const teamScores: any[] = scores;
      const totalScore = teamScores.reduce((sum: number, s: any) => sum + s.score, 0);
      const averageScore = teamScores.length > 0 ? totalScore / teamScores.length : 0;

      return NextResponse.json({
        teamId: parseInt(teamId),
        scores: teamScores,
        // Provide totalScore as authoritative value for final display
        totalScore: totalScore,
        // Keep averageScore for backward compatibility but map to totalScore so front-ends using `average` will see totals instead
        averageScore: totalScore,
        judgeCount: teamScores.length,
      });
    }

    return NextResponse.json({
      scores: scores,
      count: scores.length
    });

  } catch (error) {
    console.error('GET judge scores error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch judge scores',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}