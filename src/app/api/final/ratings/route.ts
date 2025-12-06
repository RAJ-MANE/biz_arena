// src/app/api/final/ratings/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { peerRatings, rounds, teams } from '@/db/schema';
import { eq, and, avg, count } from 'drizzle-orm';
import { requireAuth } from '@/lib/auth-middleware';

// POST handler - Submit peer rating (Authenticated users during final round)
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const authUser = await requireAuth(request);
    
    const { fromTeamId, toTeamId, rating } = await request.json();
    
    if (!fromTeamId || !toTeamId || rating === undefined) {
      return NextResponse.json({ 
        error: 'From team ID, to team ID, and rating are required', 
        code: 'MISSING_REQUIRED_FIELDS' 
      }, { status: 400 });
    }

    // Verify user belongs to the from team or is admin
    if (!authUser.isAdmin && (!authUser.team || authUser.team.id !== fromTeamId)) {
      return NextResponse.json({ 
        error: 'You can only submit ratings for your own team', 
        code: 'UNAUTHORIZED_TEAM' 
      }, { status: 403 });
    }

    // Validate rating range (3-10)
    if (!Number.isInteger(rating) || rating < 3 || rating > 10) {
      return NextResponse.json({ 
        error: 'Rating must be an integer between 3 and 10', 
        code: 'INVALID_RATING' 
      }, { status: 400 });
    }

    // Check if rating is currently active using the DB-backed rating state
    try {
      const { getRatingStateFromDb } = await import('@/lib/rating-state-db');
      const ratingState = await getRatingStateFromDb();
      if (!ratingState || !ratingState.ratingActive || ratingState.currentPhase !== 'rating-active') {
        return NextResponse.json({ 
          error: 'Rating is not currently active', 
          code: 'RATING_NOT_ACTIVE' 
        }, { status: 403 });
      }
    } catch (error) {
      console.error('Error checking rating status via DB:', error);
      return NextResponse.json({ 
        error: 'Failed to verify rating status', 
        code: 'RATING_CHECK_FAILED' 
      }, { status: 500 });
    }

    // Check if the rating team is qualified (only for non-admin users)
    if (!authUser.isAdmin) {
      try {
        const qualifiedRes = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/final/qualified-teams`);
        if (qualifiedRes.ok) {
          const qualifiedData = await qualifiedRes.json();
          const isQualified = qualifiedData.qualifiedTeams.some((team: any) => team.teamId === fromTeamId);
          
          if (!isQualified) {
            return NextResponse.json({ 
              error: 'Team is not qualified to submit peer ratings', 
              code: 'TEAM_NOT_QUALIFIED' 
            }, { status: 403 });
          }
        }
      } catch (error) {
        console.error('Error checking team qualification:', error);
        // Continue if qualification check fails (fallback to allow rating)
      }
    }

    // Cannot rate own team
    if (fromTeamId === toTeamId) {
      return NextResponse.json({ 
        error: 'Cannot rate your own team', 
        code: 'SELF_RATING_NOT_ALLOWED' 
      }, { status: 400 });
    }

    // Verify both teams exist
    const fromTeam = await db.select().from(teams).where(eq(teams.id, fromTeamId)).limit(1);
    const toTeam = await db.select().from(teams).where(eq(teams.id, toTeamId)).limit(1);

    if (fromTeam.length === 0 || toTeam.length === 0) {
      return NextResponse.json({ 
        error: 'One or both teams not found', 
        code: 'TEAM_NOT_FOUND' 
      }, { status: 404 });
    }

    // Check if team already rated this target team
    const existingRating = await db
      .select()
      .from(peerRatings)
      .where(and(
        eq(peerRatings.fromTeamId, fromTeamId),
        eq(peerRatings.toTeamId, toTeamId)
      ))
      .limit(1);

    if (existingRating.length > 0) {
      return NextResponse.json({ 
        error: 'Team has already rated this target team', 
        code: 'ALREADY_RATED' 
      }, { status: 409 });
    }

    const newRating = await db.insert(peerRatings).values({
      fromTeamId: fromTeamId,
      toTeamId: toTeamId,
      rating: rating,
      createdAt: new Date(),
    }).returning();

    return NextResponse.json({
      success: true,
      rating: newRating[0],
      message: `Successfully rated ${toTeam[0].name} with ${rating}/10`
    }, { status: 201 });

  } catch (error: any) {
    console.error('POST peer rating error:', error);
    
    if (error.message === 'Authentication required') {
      return NextResponse.json({ 
        error: 'Authentication required', 
        code: 'UNAUTHENTICATED' 
      }, { status: 401 });
    }

    return NextResponse.json({ 
      error: 'Failed to submit peer rating',
      details: error.message || 'Unknown error'
    }, { status: 500 });
  }
}

// GET handler - Get peer ratings with filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const teamId = searchParams.get('teamId');
    const fromTeamId = searchParams.get('fromTeamId');

    // Filter by specific criteria
    const whereConditions = [];
    if (teamId) {
      whereConditions.push(eq(peerRatings.toTeamId, parseInt(teamId)));
    }
    if (fromTeamId) {
      whereConditions.push(eq(peerRatings.fromTeamId, parseInt(fromTeamId)));
    }

    let ratings;
    if (whereConditions.length > 0) {
      ratings = await db
        .select({
          id: peerRatings.id,
          fromTeamId: peerRatings.fromTeamId,
          toTeamId: peerRatings.toTeamId,
          rating: peerRatings.rating,
          createdAt: peerRatings.createdAt,
        })
        .from(peerRatings)
        .where(and(...whereConditions))
        .orderBy(peerRatings.createdAt);
    } else {
      ratings = await db
        .select({
          id: peerRatings.id,
          fromTeamId: peerRatings.fromTeamId,
          toTeamId: peerRatings.toTeamId,
          rating: peerRatings.rating,
          createdAt: peerRatings.createdAt,
        })
        .from(peerRatings)
        .orderBy(peerRatings.createdAt);
    }

    // If requesting specific team ratings, include summary stats
    if (teamId && !fromTeamId) {
      const teamRatings: any[] = ratings;
      const totalRating = teamRatings.reduce((sum: number, r: any) => sum + r.rating, 0);
      const averageRating = teamRatings.length > 0 ? totalRating / teamRatings.length : 0;

      return NextResponse.json({
        teamId: parseInt(teamId),
        ratings: teamRatings,
        // Provide total peer rating for final display
        totalRating: totalRating,
        // Keep averageRating for compatibility but map to totalRating so older clients show totals
        averageRating: totalRating,
        ratingCount: teamRatings.length,
      });
    }

    return NextResponse.json({
      ratings: ratings,
      count: ratings.length
    });

  } catch (error) {
    console.error('GET peer ratings error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch peer ratings',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
