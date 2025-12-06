import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-middleware';
import { stopPitchCycleInDb, getVotingStateFromDb } from '@/lib/voting-state-db';

export async function POST(request: NextRequest) {
  try {
    await requireAdmin(request);
    await stopPitchCycleInDb();
    const state = await getVotingStateFromDb();
    return NextResponse.json({ success: true, votingState: state });
  } catch (err: any) {
    console.error('POST /api/admin/voting/stop-cycle error', err);
    if (err?.message === 'Authentication required') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Failed to stop cycle', details: err?.message }, { status: 500 });
  }
}
