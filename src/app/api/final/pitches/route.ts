// src/app/api/final/pitches/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { finalPitches, teams } from '@/db/schema';
import { eq } from 'drizzle-orm';

// GET handler - List all final pitches with team info
export async function GET(request: NextRequest) {
  try {
    const pitchesWithTeams = await db
      .select({
        id: finalPitches.id,
        teamId: finalPitches.teamId,
        teamName: teams.name,
        teamCollege: teams.college,
        presentedAt: finalPitches.presentedAt,
        createdAt: finalPitches.createdAt,
      })
      .from(finalPitches)
      .leftJoin(teams, eq(finalPitches.teamId, teams.id))
      .orderBy(finalPitches.presentedAt, finalPitches.createdAt);

    return NextResponse.json({
      pitches: pitchesWithTeams,
      count: pitchesWithTeams.length
    });
  } catch (error) {
    console.error('GET final pitches error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch final pitches',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}