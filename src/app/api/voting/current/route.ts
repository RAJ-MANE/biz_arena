import { NextRequest, NextResponse } from 'next/server';
import { votingEmitter } from '@/lib/voting-emitter';
import {
  getVotingStateFromDb,
  setTeamInDb,
  startPitchCycleInDb,
  stopPitchCycleInDb,
  setAllPitchesCompletedInDb,
  maybeAdvancePhaseOnRead
} from '@/lib/voting-state-db';

// Helper function to check admin authentication (JWT-based only)
function checkAdminAuth(req: NextRequest): boolean {
  try {
    const { requireAdmin } = require('@/lib/auth-middleware');
    // This will throw if not authenticated
    requireAdmin(req);
    return true;
  } catch (error) {
    return false;
  }
}

// Centralized voting state and ticker live in `src/lib/voting-state.ts`.
// Use `getVotingState()` to read authoritative state and the exported helpers
// (`setTeam`, `startPitchCycle`, `startPrep`, `startVotingPhase`, `stopPitchCycle`,
// `setVotingActiveManually`) to mutate state so all changes are consistently
// timestamped and broadcast via SSE.

// GET handler - Get current voting state (public endpoint)
export async function GET(request: NextRequest) {
  try {
    // Ensure any elapsed transitions are applied then return DB-derived state
    await maybeAdvancePhaseOnRead();
    const current = await getVotingStateFromDb();
    console.log('GET /api/voting/current - returning DB-backed voting state');
    return NextResponse.json(current);
  } catch (error) {
    console.error('GET voting current error:', error);
    return NextResponse.json({ 
      error: 'Failed to get voting state',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// POST handler - Set current pitching team (Admin only)
export async function POST(request: NextRequest) {
  try {
    // Check admin authentication (cookie-based or JWT-based)
    const hasAdminAuth = checkAdminAuth(request);
    if (!hasAdminAuth) {
      // Fall back to JWT-based authentication
      try {
        const { requireAdmin } = await import('@/lib/auth-middleware');
        await requireAdmin(request);
      } catch (error) {
        return NextResponse.json({ 
          error: 'Admin access required', 
          code: 'ADMIN_REQUIRED' 
        }, { status: 403 });
      }
    }

    const requestBody = await request.json();
    const { teamId, teamName } = requestBody;
    const action = requestBody.action as string | undefined;
    let name = teamName;

    // Manual control actions have been removed. The pitch cycle and voting
    // phases are fully automated by the centralized ticker. Ignore any
    // 'action' parameter sent from clients and proceed to handle team updates.
    
    // Try to get real team name from DB if not provided
    if (!name && teamId) {
      try {
        const { db } = await import('@/db');
        const { teams } = await import('@/db/schema');
        const { eq } = await import('drizzle-orm');
        
        const team = await db.select().from(teams).where(eq(teams.id, teamId)).limit(1);
        if (team.length > 0 && team[0].name) {
          name = team[0].name;
        }
      } catch (dbError) {
        console.error('Error fetching team name:', dbError);
      }
    }
    
    // Persist the team selection to the DB and return updated state
    await setTeamInDb(teamId && name ? { id: teamId, name } : null);
    const updated = await getVotingStateFromDb();
    return NextResponse.json({ success: true, votingState: updated, message: updated.team ? `Set current team to ${name}` : 'Cleared current team' });

  } catch (error: any) {
    console.error('POST voting current error:', error);
    
    // Handle authentication errors
    if (error.message === 'Authentication required') {
      return NextResponse.json({ 
        error: 'Authentication required', 
        code: 'UNAUTHENTICATED' 
      }, { status: 401 });
    }
    
    if (error.message === 'Admin access required') {
      return NextResponse.json({ 
        error: 'Admin access required', 
        code: 'ADMIN_REQUIRED' 
      }, { status: 403 });
    }

    return NextResponse.json({ 
      error: 'Failed to set voting state',
      details: error.message || 'Unknown error'
    }, { status: 500 });
  }
}

// PATCH handler - Update voting state (Admin only)
export async function PATCH(request: NextRequest) {
  try {
    // Check admin authentication (cookie-based or JWT-based)
    const hasAdminAuth = checkAdminAuth(request);
    if (!hasAdminAuth) {
      // Fall back to JWT-based authentication
      try {
        const { requireAdmin } = await import('@/lib/auth-middleware');
        await requireAdmin(request);
      } catch (error) {
        return NextResponse.json({ 
          error: 'Admin access required', 
          code: 'ADMIN_REQUIRED' 
        }, { status: 403 });
      }
    }

    const body = await request.json();
    const { allPitchesCompleted, pitchCycleActive, action } = body;

    // Only allow toggling 'allPitchesCompleted' and provide a guarded server-side
    // 'stop' action for ending the cycle. Starting cycles should use admin start endpoint.
    if (typeof allPitchesCompleted === 'boolean') {
      await setAllPitchesCompletedInDb(allPitchesCompleted);
    }

    if (typeof pitchCycleActive === 'boolean' && pitchCycleActive === false) {
      // Allowed: admin can request to stop the cycle
      await stopPitchCycleInDb();
    }

    const updated = await getVotingStateFromDb();
    return NextResponse.json({ success: true, votingState: updated, message: 'Voting state updated successfully' });

  } catch (error: any) {
    console.error('PATCH voting current error:', error);
    
    // Handle authentication errors
    if (error.message === 'Authentication required') {
      return NextResponse.json({ 
        error: 'Authentication required', 
        code: 'UNAUTHENTICATED' 
      }, { status: 401 });
    }
    
    if (error.message === 'Admin access required') {
      return NextResponse.json({ 
        error: 'Admin access required', 
        code: 'ADMIN_REQUIRED' 
      }, { status: 403 });
    }

    return NextResponse.json({ 
      error: 'Failed to update voting state',
      details: error.message || 'Unknown error'
    }, { status: 500 });
  }
}