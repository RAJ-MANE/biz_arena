import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { teams, user } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { requireAuth } from '@/lib/auth-middleware';

// GET handler - Get single team by ID (basic info only)
export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const teamId = parseInt(id);
    if (!teamId || isNaN(teamId)) {
      return NextResponse.json({ error: 'Valid team ID is required', code: 'INVALID_ID' }, { status: 400 });
    }
    const team = await db.select().from(teams).where(eq(teams.id, teamId)).limit(1);
    if (team.length === 0) {
      return NextResponse.json({ error: 'Team not found', code: 'TEAM_NOT_FOUND' }, { status: 404 });
    }
    return NextResponse.json(team[0]);
  } catch (error) {
    console.error('GET team error:', error);
    return NextResponse.json({ error: 'Failed to fetch team', details: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}

// PATCH handler - Update team (authenticated user only)
export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const teamId = parseInt(id);
    if (!teamId || isNaN(teamId)) {
      return NextResponse.json({ error: 'Valid team ID is required', code: 'INVALID_ID' }, { status: 400 });
    }
    const authUser = await requireAuth(request);
    if (!authUser) {
      return NextResponse.json({ error: 'Authentication required', code: 'UNAUTHENTICATED' }, { status: 401 });
    }
    const updates = await request.json();
    const allowedFields = ['name', 'college'];
    const filteredUpdates: Record<string, string> = {};
    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key) && value) {
        const stringValue = typeof value === 'string' ? value.trim() : String(value).trim();
        if (key === 'name') {
          if (stringValue.length < 2 || stringValue.length > 100) {
            return NextResponse.json({ error: 'Team name must be between 2-100 characters', code: 'INVALID_NAME_LENGTH' }, { status: 400 });
          }
          // Check if name already exists (excluding current team)
          const existingTeam = await db.select().from(teams).where(eq(teams.name, stringValue)).limit(1);
          const conflictingTeam = existingTeam.find((t: any) => t.id !== teamId);
          if (conflictingTeam) {
            return NextResponse.json({ error: 'Team name already exists', code: 'DUPLICATE_TEAM_NAME' }, { status: 409 });
          }
        }
        if (key === 'college') {
          if (stringValue.length < 2 || stringValue.length > 200) {
            return NextResponse.json({ error: 'College name must be between 2-200 characters', code: 'INVALID_COLLEGE_LENGTH' }, { status: 400 });
          }
        }
        filteredUpdates[key] = stringValue;
      }
    }
    if (Object.keys(filteredUpdates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update', code: 'NO_VALID_FIELDS' }, { status: 400 });
    }
    const updatedTeam = await db.update(teams).set({ ...filteredUpdates, updatedAt: new Date() }).where(eq(teams.id, teamId)).returning();
    if (updatedTeam.length === 0) {
      return NextResponse.json({ error: 'Team not found', code: 'TEAM_NOT_FOUND' }, { status: 404 });
    }
    return NextResponse.json({ ...updatedTeam[0], message: 'Team updated successfully' });
  } catch (error: any) {
    console.error('PATCH team error:', error);
    return NextResponse.json({ error: 'Failed to update team', details: error.message || 'Unknown error' }, { status: 500 });
  }
}

// DELETE handler - Delete team (authenticated user only, with restrictions)
export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const teamId = parseInt(id);
    if (!teamId || isNaN(teamId)) {
      return NextResponse.json({ error: 'Valid team ID is required', code: 'INVALID_ID' }, { status: 400 });
    }
    const authUser = await requireAuth(request);
    if (!authUser) {
      return NextResponse.json({ error: 'Authentication required', code: 'UNAUTHENTICATED' }, { status: 401 });
    }
    // Check if team has submitted quiz (prevent deletion if they have)
    const { quizSubmissions } = await import('@/db/schema');
    const hasQuizSubmission = await db.select().from(quizSubmissions).where(eq(quizSubmissions.teamId, teamId)).limit(1);
    if (hasQuizSubmission.length > 0) {
      return NextResponse.json({ error: 'Cannot delete team after quiz submission. Please contact admin.', code: 'QUIZ_SUBMITTED' }, { status: 409 });
    }
    // Check if team has any votes or other competition activity
    const { votes, pitches } = await import('@/db/schema');
    const hasVotes = await db.select().from(votes).where(eq(votes.fromTeamId, teamId)).limit(1);
    const hasPitches = await db.select().from(pitches).where(eq(pitches.teamId, teamId)).limit(1);
    if (hasVotes.length > 0 || hasPitches.length > 0) {
      return NextResponse.json({ error: 'Cannot delete team after competition activity. Please contact admin.', code: 'COMPETITION_ACTIVITY_EXISTS' }, { status: 409 });
    }
    // Delete team
    const deletedTeam = await db.delete(teams).where(eq(teams.id, teamId)).returning();
    if (deletedTeam.length === 0) {
      return NextResponse.json({ error: 'Team not found', code: 'TEAM_NOT_FOUND' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Team successfully deleted', team: deletedTeam[0] });
  } catch (error: any) {
    console.error('DELETE team error:', error);
    return NextResponse.json({ error: 'Failed to delete team', details: error.message || 'Unknown error' }, { status: 500 });
  }
}