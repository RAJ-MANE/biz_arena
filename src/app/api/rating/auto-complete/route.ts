import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { peerRatings, teams } from '@/db/schema';
import { eq } from 'drizzle-orm';

/**
 * Auto-complete missing peer ratings for Round 3
 * 
 * When a team doesn't rate another team during the rating window,
 * this endpoint automatically assigns a neutral rating of 6.5 (midpoint of 3-10 scale).
 * 
 * Auto-ratings are flagged but included in average calculations as neutral scores.
 * 
 * This should be called by admin when closing the rating phase.
 */
export async function POST(req: NextRequest) {
  try {
    const { teamId } = await req.json();

    if (!teamId) {
      return NextResponse.json({ error: 'teamId is required' }, { status: 400 });
    }

    // Get all teams
    const allTeams = await db.select({ id: teams.id, name: teams.name }).from(teams);
    
    // Get ratings already submitted by this team
    const existingRatings = await db
      .select({ toTeamId: peerRatings.toTeamId })
      .from(peerRatings)
      .where(eq(peerRatings.fromTeamId, teamId));
    
    const ratedTeamIds = existingRatings.map((r: any) => r.toTeamId);
    
    // Find teams that haven't been rated (excluding self)
    const unratedTeams = allTeams.filter(
      (team: any) => team.id !== teamId && !ratedTeamIds.includes(team.id)
    );

    if (unratedTeams.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No missing ratings to complete',
        autoRatings: 0,
      });
    }

    // Insert automatic neutral ratings (6.5 = midpoint of 3-10 scale)
    const autoRatings = unratedTeams.map((team: any) => ({
      fromTeamId: teamId,
      toTeamId: team.id,
      rating: 6.5, // Neutral score (midpoint of 3-10 range)
      isAutomatic: true, // Flag to indicate auto-generated rating
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    await db.insert(peerRatings).values(autoRatings);

    return NextResponse.json({
      success: true,
      message: `Auto-completed ${autoRatings.length} missing rating(s) as neutral (6.5/10)`,
      autoRatings: autoRatings.length,
      teams: unratedTeams.map((t: any) => ({ id: t.id, name: t.name })),
      warnings: unratedTeams.map((t: any) => 
        `You missed rating ${t.name}. An automatic neutral rating of 6.5/10 has been assigned.`
      ),
    });
  } catch (error) {
    console.error('Auto-complete ratings error:', error);
    return NextResponse.json(
      { error: 'Failed to auto-complete ratings' },
      { status: 500 }
    );
  }
}

/**
 * Batch auto-complete for all teams
 * Admin can call this without teamId to process all teams
 */
export async function PUT(req: NextRequest) {
  try {
    // Get all teams
    const allTeams = await db.select({ id: teams.id, name: teams.name }).from(teams);
    
    const results = [];
    
    for (const team of allTeams) {
      // Get ratings already submitted by this team
      const existingRatings = await db
        .select({ toTeamId: peerRatings.toTeamId })
        .from(peerRatings)
        .where(eq(peerRatings.fromTeamId, team.id));
      
      const ratedTeamIds = existingRatings.map((r: any) => r.toTeamId);
      
      // Find teams that haven't been rated (excluding self)
      const unratedTeams = allTeams.filter(
        (t: any) => t.id !== team.id && !ratedTeamIds.includes(t.id)
      );

      if (unratedTeams.length > 0) {
        // Insert automatic neutral ratings (6.5 = midpoint of 3-10 scale)
        const autoRatings = unratedTeams.map((t: any) => ({
          fromTeamId: team.id,
          toTeamId: t.id,
          rating: 6.5, // Neutral score (midpoint of 3-10 range)
          isAutomatic: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        }));

        await db.insert(peerRatings).values(autoRatings);

        results.push({
          teamId: team.id,
          teamName: team.name,
          autoRatingsCount: autoRatings.length,
          unratedTeams: unratedTeams.map((t: any) => t.name),
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Auto-completed ratings for ${results.length} team(s)`,
      results,
      totalAutoRatings: results.reduce((sum, r) => sum + r.autoRatingsCount, 0),
    });
  } catch (error) {
    console.error('Batch auto-complete ratings error:', error);
    return NextResponse.json(
      { error: 'Failed to auto-complete ratings for all teams' },
      { status: 500 }
    );
  }
}
