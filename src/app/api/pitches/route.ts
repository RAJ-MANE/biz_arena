import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { pitches, teams, rounds } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { requireAuth } from '@/lib/auth-middleware';

// GET handler - List all pitches
export async function GET(request: NextRequest) {
  try {
    const pitchesWithTeams = await db
      .select({
        id: pitches.id,
        teamId: pitches.teamId,
        teamName: teams.name,
        videoUrl: pitches.videoUrl,
        deckUrl: pitches.deckUrl,
        presentedAt: pitches.presentedAt,
        createdAt: pitches.createdAt,
      })
      .from(pitches)
      .leftJoin(teams, eq(pitches.teamId, teams.id))
      .orderBy(pitches.presentedAt, pitches.createdAt);

    return NextResponse.json(pitchesWithTeams);
  } catch (error) {
    console.error('GET pitches error:', error);
    return NextResponse.json({ error: 'Internal server error: ' + error }, { status: 500 });
  }
}

// POST handler - Create pitch (Team leaders only during voting round)
export async function POST(request: NextRequest) {
  try {
    // Require user authentication
    const authUser = await requireAuth(request);
    
    const { teamId, videoUrl, deckUrl } = await request.json();
    
    if (!teamId) {
      return NextResponse.json({ 
        error: 'Team ID is required', 
        code: 'MISSING_TEAM_ID' 
      }, { status: 400 });
    }

    // Verify user belongs to the team they're submitting for
    if (authUser.team?.id !== teamId) {
      return NextResponse.json({ 
        error: 'You can only submit pitches for your own team', 
        code: 'UNAUTHORIZED_TEAM_ACCESS' 
      }, { status: 403 });
    }

    // Check if voting round is active
    const votingRound = await db
      .select()
      .from(rounds)
      .where(and(
        eq(rounds.name, 'VOTING'),
        eq(rounds.status, 'ACTIVE')
      ))
      .limit(1);

    if (votingRound.length === 0) {
      return NextResponse.json({ 
        error: 'Voting round is not currently active', 
        code: 'VOTING_NOT_ACTIVE' 
      }, { status: 400 });
    }

    // Check if team already has a pitch
    const existingPitch = await db
      .select()
      .from(pitches)
      .where(eq(pitches.teamId, teamId))
      .limit(1);

    if (existingPitch.length > 0) {
      return NextResponse.json({ 
        error: 'Team already has a pitch', 
        code: 'PITCH_EXISTS' 
      }, { status: 409 });
    }

    const newPitch = await db.insert(pitches).values([
      {
        teamId: teamId,
        videoUrl: videoUrl?.trim() || null,
        deckUrl: deckUrl?.trim() || null,
        presentedAt: new Date(),
        createdAt: new Date(),
      }
    ]).returning();

    return NextResponse.json(newPitch[0], { status: 201 });
  } catch (error) {
    console.error('POST pitches error:', error);
    return NextResponse.json({ error: 'Internal server error: ' + error }, { status: 500 });
  }
}