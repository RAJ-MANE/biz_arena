import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { teams } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { requireAuth } from '@/lib/auth-middleware';

export async function POST(req: NextRequest) {
  try {
    const authUser = await requireAuth(req);

    const teamId = authUser.team?.id ?? null;
    if (!teamId) {
      return NextResponse.json({ error: 'User is not associated with a team', code: 'NO_TEAM' }, { status: 400 });
    }

    // Fetch current team tokens
  const existing = await db.select().from(teams).where(eq(teams.id, Number(teamId))).limit(1);
    if (existing.length === 0) {
      return NextResponse.json({ error: 'Team not found', code: 'TEAM_NOT_FOUND' }, { status: 404 });
    }

    const team = existing[0] as any;

    // Ensure each token category is at least 3 (idempotent)
    const newMarketing = Math.max((team.tokensMarketing ?? 0), 3);
    const newCapital = Math.max((team.tokensCapital ?? 0), 3);
    const newTeam = Math.max((team.tokensTeam ?? 0), 3);
    const newStrategy = Math.max((team.tokensStrategy ?? 0), 3);

    // Only update if any value is less than 3
    if (team.tokensMarketing < 3 || team.tokensCapital < 3 || team.tokensTeam < 3 || team.tokensStrategy < 3) {
      await db.update(teams).set({
        tokensMarketing: newMarketing,
        tokensCapital: newCapital,
        tokensTeam: newTeam,
        tokensStrategy: newStrategy,
      }).where(eq(teams.id, teamId));
    }

    return NextResponse.json({
      success: true,
      tokens: {
        marketing: newMarketing,
        capital: newCapital,
        team: newTeam,
        strategy: newStrategy,
      }
    });
  } catch (error: any) {
    console.error('/api/quiz/start error', error);
    if (error?.message === 'Authentication required') {
      return NextResponse.json({ error: 'Authentication required', code: 'UNAUTHENTICATED' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal server error', details: error?.message }, { status: 500 });
  }
}
