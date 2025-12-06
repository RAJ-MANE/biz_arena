import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { votes, teams } from '@/db/schema';
import { sql, eq, and, notInArray } from 'drizzle-orm';

/**
 * Auto-complete missing votes for Round 2
 * 
 * When a team doesn't vote for another team during the voting window,
 * this endpoint automatically casts a YES vote on their behalf.
 * 
 * This should be called by admin when closing the voting phase.
 */
export async function POST(req: NextRequest) {
  try {
    const { teamId } = await req.json();

    if (!teamId) {
      return NextResponse.json({ error: 'teamId is required' }, { status: 400 });
    }

    // Get all teams
    const allTeams = await db.select({ id: teams.id, name: teams.name }).from(teams);
    
    // Get votes already cast by this team
    const existingVotes = await db
      .select({ toTeamId: votes.toTeamId })
      .from(votes)
      .where(eq(votes.fromTeamId, teamId));
    
    const votedTeamIds = existingVotes.map((v: any) => v.toTeamId);
    
    // Find teams that haven't been voted for (excluding self)
    const unvotedTeams = allTeams.filter(
      (team: any) => team.id !== teamId && !votedTeamIds.includes(team.id)
    );

    if (unvotedTeams.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No missing votes to complete',
        autoVotes: 0,
      });
    }

    // Insert automatic YES votes for all unvoted teams
    const autoVotes = unvotedTeams.map((team: any) => ({
      fromTeamId: teamId,
      toTeamId: team.id,
      value: 1, // YES vote
      isAutomatic: true, // Flag to indicate this was auto-generated
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    await db.insert(votes).values(autoVotes);

    return NextResponse.json({
      success: true,
      message: `Auto-completed ${autoVotes.length} missing vote(s) as YES`,
      autoVotes: autoVotes.length,
      teams: unvotedTeams.map((t: any) => ({ id: t.id, name: t.name })),
      warnings: unvotedTeams.map((t: any) => 
        `You missed voting for ${t.name}. An automatic YES vote has been cast on your behalf.`
      ),
    });
  } catch (error) {
    console.error('Auto-complete votes error:', error);
    return NextResponse.json(
      { error: 'Failed to auto-complete votes' },
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
      // Get votes already cast by this team
      const existingVotes = await db
        .select({ toTeamId: votes.toTeamId })
        .from(votes)
        .where(eq(votes.fromTeamId, team.id));
      
      const votedTeamIds = existingVotes.map((v: any) => v.toTeamId);
      
      // Find teams that haven't been voted for (excluding self)
      const unvotedTeams = allTeams.filter(
        (t: any) => t.id !== team.id && !votedTeamIds.includes(t.id)
      );

      if (unvotedTeams.length > 0) {
        // Insert automatic YES votes
        const autoVotes = unvotedTeams.map((t: any) => ({
          fromTeamId: team.id,
          toTeamId: t.id,
          value: 1, // YES vote
          isAutomatic: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        }));

        await db.insert(votes).values(autoVotes);

        results.push({
          teamId: team.id,
          teamName: team.name,
          autoVotesCount: autoVotes.length,
          unvotedTeams: unvotedTeams.map((t: any) => t.name),
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Auto-completed votes for ${results.length} team(s)`,
      results,
      totalAutoVotes: results.reduce((sum, r) => sum + r.autoVotesCount, 0),
    });
  } catch (error) {
    console.error('Batch auto-complete votes error:', error);
    return NextResponse.json(
      { error: 'Failed to auto-complete votes for all teams' },
      { status: 500 }
    );
  }
}
