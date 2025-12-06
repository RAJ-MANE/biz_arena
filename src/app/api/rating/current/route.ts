import { NextRequest, NextResponse } from 'next/server';
import { ratingEmitter } from '@/lib/rating-emitter';
import {
  getRatingStateFromDb,
  setTeamInDb,
  startRatingCycleInDb,
  startQnaPauseInDb,
  startRatingWarningInDb,
  startRatingPhaseInDb,
  stopRatingCycleInDb,
  setAllPitchesCompletedInDb,
  maybeAdvancePhaseOnRead,
} from '@/lib/rating-state-db';

// Helper function to check admin authentication (both JWT and cookie-based)
function checkAdminAuth(req: NextRequest): boolean {
  // Check cookie-based admin auth first
  const cookieHeader = req.headers.get("cookie") || "";
  if (cookieHeader.includes("admin-auth=true")) {
    return true;
  }
  return false;
}

// Use centralized rating-state module (sharedRatingState for direct reference when needed)

// GET handler - Get current rating state (public endpoint)
export async function GET(request: NextRequest) {
  try {
    // Return centralized rating state (read-only). Advance phases if needed.
    try {
      await maybeAdvancePhaseOnRead();
    } catch (err) {
      console.error('Error advancing rating phase on read:', err);
    }
    const currentState = await getRatingStateFromDb();
    console.log('GET /api/rating/current - returning centralized state (db):', currentState);
    return NextResponse.json(currentState);
  } catch (error) {
    console.error('GET rating current error:', error);
    return NextResponse.json({ 
      error: 'Failed to get rating state',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// POST handler - Set current pitching team or start rating cycle (Admin only)
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
    
    // Handle rating cycle actions via centralized module
    if (requestBody.action) {
      switch (requestBody.action) {
        case 'start':
          await startRatingCycleInDb();
          return NextResponse.json({ success: true, ratingState: await getRatingStateFromDb(), message: 'Rating cycle started successfully' });
        case 'start-qna':
          await startQnaPauseInDb();
          return NextResponse.json({ success: true, ratingState: await getRatingStateFromDb(), message: 'Q&A session started successfully' });
        case 'start-rating':
          // start with warning phase
          await startRatingWarningInDb();
          return NextResponse.json({ success: true, ratingState: await getRatingStateFromDb(), message: 'Rating warning started - 5 seconds until rating begins' });
        case 'stop':
          await stopRatingCycleInDb();
          return NextResponse.json({ success: true, ratingState: await getRatingStateFromDb(), message: 'Rating cycle stopped successfully' });
        default:
          return NextResponse.json({ error: 'Invalid action. Supported actions: start, start-qna, start-rating, stop' }, { status: 400 });
      }
    }
    
    // Handle setting current team (legacy functionality)
    const { teamId, teamName } = requestBody;
    let name = teamName;
    
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
    
  // Set the team using DB-backed state
  await setTeamInDb(teamId && name ? { id: teamId, name } : null);
  // Emit explicit teamChanged event for compatibility is handled by broadcast
  return NextResponse.json({ success: true, ratingState: await getRatingStateFromDb(), message: (await getRatingStateFromDb()).team ? `Set current team to ${name}` : 'Cleared current team' });

  } catch (error: any) {
    console.error('POST rating current error:', error);
    
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
      error: 'Failed to set rating state',
      details: error.message || 'Unknown error'
    }, { status: 500 });
  }
}

// PATCH handler - Update rating state (Admin only)
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

    const { ratingActive, allPitchesCompleted, ratingCycleActive, currentPhase, phaseTimeLeft, cycleStartTime, phaseStartTime } = await request.json();

    // Apply updates to DB-backed rating state
    try {
      const { db } = await import('@/db');
      const { ratingState } = await import('@/db/schema');
      const { eq } = await import('drizzle-orm');

      const updates: any = { updated_at: new Date() };
      if (typeof ratingActive === 'boolean') updates.rating_active = ratingActive;
      if (typeof allPitchesCompleted === 'boolean') updates.all_pitches_completed = allPitchesCompleted;
      if (typeof ratingCycleActive === 'boolean') {
        updates.rating_cycle_active = ratingCycleActive;
        if (!ratingCycleActive) {
          updates.current_phase = 'idle';
          updates.phase_start_ts = null;
          updates.cycle_start_ts = null;
          updates.rating_active = false;
        }
      }
      if (currentPhase && ['idle', 'pitching', 'qna-pause', 'rating-warning', 'rating-active'].includes(currentPhase)) {
        updates.current_phase = currentPhase;
      }
      // Accept explicit timestamps (ms since epoch) or null
      if (typeof cycleStartTime === 'number') updates.cycle_start_ts = new Date(cycleStartTime);
      if (cycleStartTime === null) updates.cycle_start_ts = null;
      if (typeof phaseStartTime === 'number') updates.phase_start_ts = new Date(phaseStartTime);
      if (phaseStartTime === null) updates.phase_start_ts = null;

      await db.update(ratingState).set(updates).where(eq(ratingState.id, 1));
      // Broadcast updated state
      const updated = await getRatingStateFromDb();
      ratingEmitter.broadcast({ type: 'ratingStateChanged', data: updated });

      return NextResponse.json({ success: true, ratingState: updated, message: 'Rating state updated successfully' });
    } catch (err) {
      console.error('Error updating rating state in DB:', err);
      return NextResponse.json({ error: 'Failed to update rating state', details: err instanceof Error ? err.message : String(err) }, { status: 500 });
    }

  } catch (error: any) {
    console.error('PATCH rating current error:', error);
    
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
      error: 'Failed to update rating state',
      details: error.message || 'Unknown error'
    }, { status: 500 });
  }
}