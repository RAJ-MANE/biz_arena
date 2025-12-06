import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { votes, rounds, user } from '@/db/schema';
import { eq, and, count } from 'drizzle-orm';
import jwt from 'jsonwebtoken';
import { createSafeErrorResponse } from '@/lib/utils';

const JWT_SECRET = process.env.JWT_SECRET!;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}

// POST handler - Cast vote (Team leaders only during voting round)
export async function POST(request: NextRequest) {
  try {
    // Get authentication from cookie or Authorization header
    let token = request.cookies.get('auth-token')?.value;
    if (!token) {
      // fallback to Authorization: Bearer <token>
      const authHeader = request.headers.get('authorization') || request.headers.get('Authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }

    if (!token) {
      return NextResponse.json({ 
        error: 'Authentication required - please log in', 
        code: 'UNAUTHENTICATED' 
      }, { status: 401 });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET) as any;
    } catch (jwtError) {
      console.warn('Invalid token provided to /api/votes:', jwtError);
      return NextResponse.json({ 
        error: 'Invalid authentication token - please log in again', 
        code: 'INVALID_TOKEN' 
      }, { status: 401 });
    }

    if (!decoded?.userId) {
      return NextResponse.json({ 
        error: 'Invalid user session - please log in again', 
        code: 'INVALID_SESSION' 
      }, { status: 401 });
    }

    const body = await request.json();
    let { fromTeamId, toTeamId, value } = body;

    // Coerce numeric IDs (client may send strings)
    fromTeamId = typeof fromTeamId === 'string' ? parseInt(fromTeamId) : fromTeamId;
    toTeamId = typeof toTeamId === 'string' ? parseInt(toTeamId) : toTeamId;

    if (!fromTeamId || !toTeamId || (value !== 1 && value !== -1)) {
      return NextResponse.json({ 
        error: 'From team ID, to team ID, and valid vote value (+1 or -1) are required', 
        code: 'MISSING_REQUIRED_FIELDS' 
      }, { status: 400 });
    }

    // Validate that the user belongs to the team they're voting for
    const userRecord = await db
      .select({ teamId: user.teamId })
      .from(user)
      .where(eq(user.id, decoded.userId))
      .limit(1);

    if (userRecord.length === 0) {
      // If token corresponds to an admin account, return clearer message
      try {
        const { admins } = await import('@/db/schema');
        const foundAdmin = await db
          .select()
          .from(admins)
          .where(eq(admins.id, decoded.userId))
          .limit(1);
        if (foundAdmin.length > 0) {
          return NextResponse.json({
            error: 'Admin accounts cannot cast team votes. Sign in with a team account.',
            code: 'ADMIN_CANNOT_VOTE'
          }, { status: 403 });
        }
      } catch (adminCheckErr) {
        console.warn('Admin lookup failed while handling missing user in /api/votes:', adminCheckErr);
      }

      return NextResponse.json({ 
        error: 'User not found (token valid but user record missing). Please sign in again with a team account.', 
        code: 'USER_NOT_FOUND' 
      }, { status: 404 });
    }

    if (userRecord[0].teamId !== fromTeamId) {
      return NextResponse.json({ 
        error: 'You can only vote as a member of your own team', 
        code: 'TEAM_MEMBERSHIP_REQUIRED' 
      }, { status: 403 });
    }

    // No teamMembers check; allow all authenticated users

    // Check if rating is currently active (using the rating API) for final round team voting
    // Check whether voting/rating is active. Be defensive: if the rating API call fails, fall back
    // to checking the rounds table so transient failures don't block voting.
    let isRatingActive = false;
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 2000);

      const ratingResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/rating/current`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal
      });
      clearTimeout(timeout);

      if (ratingResponse.ok) {
        const ratingState = await ratingResponse.json();
        isRatingActive = Boolean(ratingState.ratingActive && ratingState.currentPhase === 'rating-active');
      } else {
        console.warn('Rating API responded non-OK while checking voting status:', ratingResponse.status);
      }
    } catch (err) {
      console.warn('Non-fatal: failed to fetch rating/current while checking voting status:', err);
      // Continue - we'll rely on rounds table as the primary fallback
      isRatingActive = false;
    }

    // Check if voting round is active (fallback for non-finals voting)
    const votingRound = await db
      .select()
      .from(rounds)
      .where(and(
        eq(rounds.name, 'VOTING'),
        eq(rounds.status, 'ACTIVE')
      ))
      .limit(1);

    const isVotingRoundActive = votingRound.length > 0;

    if (!isRatingActive && !isVotingRoundActive) {
      return NextResponse.json({ 
        error: 'Neither final rating nor voting round is currently active', 
        code: 'VOTING_NOT_ACTIVE' 
      }, { status: 400 });
    }

    // Cannot vote for own team
    if (fromTeamId === toTeamId) {
      return NextResponse.json({ 
        error: 'Cannot vote for your own team', 
        code: 'SELF_VOTE_NOT_ALLOWED' 
      }, { status: 400 });
    }

    // Check if team already voted for this target team
    const existingVote = await db
      .select()
      .from(votes)
      .where(and(
        eq(votes.fromTeamId, fromTeamId),
        eq(votes.toTeamId, toTeamId)
      ))
      .limit(1);

    if (existingVote.length > 0) {
      return NextResponse.json({ 
        error: 'Team has already voted for this target team', 
        code: 'ALREADY_VOTED' 
      }, { status: 409 });
    }

    // If downvote, check team downvote limit (max 3)
    if (value === -1) {
      const downvoteCount = await db
        .select({ count: count() })
        .from(votes)
        .where(and(
          eq(votes.fromTeamId, fromTeamId),
          eq(votes.value, -1)
        ));

      if (downvoteCount[0]?.count >= 3) {
        return NextResponse.json({ 
          error: 'Team has reached maximum of 3 downvotes', 
          code: 'DOWNVOTE_LIMIT_EXCEEDED' 
        }, { status: 400 });
      }
    }

    const newVote = await db.insert(votes).values([
      {
        fromTeamId: fromTeamId,
        toTeamId: toTeamId,
        value: value,
        createdAt: new Date(),
      }
    ]).returning();

    return NextResponse.json({
      success: true,
      message: `Vote recorded successfully (${value === 1 ? 'Yes' : 'No'})`,
      vote: newVote[0]
    }, { status: 201 });
  } catch (error) {
    console.error('POST votes error:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    const safeError = createSafeErrorResponse(error, 'Failed to cast vote');
    return NextResponse.json({ 
      error: safeError.error,
      details: safeError.details
    }, { status: safeError.statusCode });
  }
}

// GET handler - Get voting statistics
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const teamId = searchParams.get('teamId');
    const fromTeamId = searchParams.get('fromTeamId');

    if (fromTeamId) {
      // Get voting status for a specific team (what votes they've cast)
      const teamVotes = await db
        .select()
        .from(votes)
        .where(eq(votes.fromTeamId, parseInt(fromTeamId)))
        .orderBy(votes.createdAt);

  const downvoteCount = teamVotes.filter((v: any) => v.value === -1).length;
  const votedTeams = teamVotes.map((v: any) => v.toTeamId);

      return NextResponse.json({
        fromTeamId: parseInt(fromTeamId),
        votescast: teamVotes,
        downvoteCount,
        remainingDownvotes: Math.max(0, 3 - downvoteCount),
        votedTeams,
      });
    } else if (teamId) {
      // Get votes for specific team (what votes they've received)
      const teamVotes = await db
        .select()
        .from(votes)
        .where(eq(votes.toTeamId, parseInt(teamId)))
        .orderBy(votes.createdAt);

  const upvotes = teamVotes.filter((v: any) => v.value === 1).length;
  const downvotes = teamVotes.filter((v: any) => v.value === -1).length;
      const totalVotes = upvotes - downvotes;

      return NextResponse.json({
        teamId: parseInt(teamId),
        upvotes,
        downvotes,
        totalVotes,
        votes: teamVotes,
      });
    } else {
      // Get all votes summary
      const allVotes = await db
        .select()
        .from(votes)
        .orderBy(votes.createdAt);

      return NextResponse.json(allVotes);
    }
  } catch (error) {
    console.error('GET votes error:', error);
    const safeError = createSafeErrorResponse(error, 'Failed to fetch voting data');
    return NextResponse.json({ 
      error: safeError.error,
      details: safeError.details
    }, { status: safeError.statusCode });
  }
}