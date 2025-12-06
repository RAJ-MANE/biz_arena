import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-middleware';
import { startPitchCycleInDb, setTeamInDb, getVotingStateFromDb } from '@/lib/voting-state-db';

export async function POST(request: NextRequest) {
  try {
    await requireAdmin(request);
    const body = await request.json().catch(() => ({}));
    const { teamId, teamName } = body;

    if (teamId && teamName) {
      await setTeamInDb({ id: teamId, name: teamName });
    }

    await startPitchCycleInDb(teamId, teamName);

    const state = await getVotingStateFromDb();
    return NextResponse.json({ success: true, votingState: state });
  } catch (err: any) {
    console.error('POST /api/admin/voting/start-cycle error', err);
    if (err?.message === 'Authentication required') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Failed to start cycle', details: err?.message }, { status: 500 });
  }
}
