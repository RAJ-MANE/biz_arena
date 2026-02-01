import { NextRequest, NextResponse } from 'next/server';

// Dynamically import the DB at runtime so the admin API remains usable even when DATABASE_URL
// is not configured (useful for local dev without a DB). If DB is unavailable, handlers can
// return safe defaults instead of crashing the whole app.
let _db: any = null;
let _roundsSchema: any = null;
async function getDbAndSchema() {
  if (_db && _roundsSchema) return { db: _db, rounds: _roundsSchema };
  try {
    const dbModule = await import('@/db');
    const schemaModule = await import('@/db/schema');
    _db = dbModule.db;
    _roundsSchema = schemaModule.rounds;
    return { db: _db, rounds: _roundsSchema };
  } catch (err) {
    console.warn('DB not available for rounds API:', err?.message || err);
    return { db: null, rounds: null };
  }
}

import { eq } from 'drizzle-orm';
import { requireAdmin, authenticateRequest } from '@/lib/auth-middleware';

// Helper function to check admin authentication (both JWT and cookie-based)
function checkAdminAuth(req: NextRequest): boolean {
  // Check cookie-based admin auth first
  const cookieHeader = req.headers.get("cookie") || "";
  if (cookieHeader.includes("admin-auth=true")) {
    return true;
  }
  return false;
}

// GET handler - List all rounds (public endpoint)
export async function GET(request: NextRequest) {
  try {
    const { db, rounds } = await getDbAndSchema();

    // If DB is not available, return a sensible in-memory default so the admin UI is functional
    if (!db || !rounds) {
      const now = new Date();
      const defaultRounds = [
        { id: 1, name: 'QUIZ', day: 1, status: 'PENDING', startsAt: null, endsAt: null, createdAt: now, updatedAt: now },
        { id: 2, name: 'VOTING', day: 2, status: 'PENDING', startsAt: null, endsAt: null, createdAt: now, updatedAt: now },
        { id: 3, name: 'FINAL', day: 2, status: 'PENDING', startsAt: null, endsAt: null, createdAt: now, updatedAt: now },
      ];

      const enrichedRounds = defaultRounds.map((round: any) => {
        const now2 = new Date();
        const isActive = round.status === 'ACTIVE';
        const isPending = round.status === 'PENDING';
        const isCompleted = round.status === 'COMPLETED';

        return {
          ...round,
          isActive,
          isPending,
          isCompleted,
          canStart: false,
          canEnd: false,
          timeUntilStart: null,
          timeUntilEnd: null,
        };
      });

      return NextResponse.json(enrichedRounds);
    }

    let allRounds = await db
      .select()
      .from(rounds)
      .orderBy(rounds.day, rounds.id);

    // If no rounds exist in the DB, create safe defaults so the admin UI has Start/Stop controls available
    if (allRounds.length === 0) {
      console.log('No rounds found - inserting default QUIZ, VOTING, FINAL rounds');
      const now = new Date();
      await db.insert(rounds).values([
        { name: 'QUIZ', day: 1, status: 'PENDING', createdAt: now, updatedAt: now },
        { name: 'VOTING', day: 2, status: 'PENDING', createdAt: now, updatedAt: now },
        { name: 'FINAL', day: 2, status: 'PENDING', createdAt: now, updatedAt: now },
      ]);

      // Re-fetch after insertion
      allRounds = await db
        .select()
        .from(rounds)
        .orderBy(rounds.day, rounds.id);
    }

  // Add computed fields
  const enrichedRounds = allRounds.map((round: any) => {
      const now = new Date();
      const isActive = round.status === 'ACTIVE';
      const isPending = round.status === 'PENDING';
      const isCompleted = round.status === 'COMPLETED';

      let canStart = false;
      let canEnd = false;

      let startTime: Date | null = null;
      let endTime: Date | null = null;
      if (round.startsAt) {
        startTime = new Date(round.startsAt);
        if (isNaN(startTime.getTime())) startTime = null;
      }
      if (round.endsAt) {
        endTime = new Date(round.endsAt);
        if (isNaN(endTime.getTime())) endTime = null;
      }

      if (startTime && endTime) {
        canStart = isPending && now >= startTime;
        canEnd = isActive && now >= endTime;
      }

      return {
        ...round,
        isActive,
        isPending,
        isCompleted,
        canStart,
        canEnd,
        timeUntilStart: startTime ? Math.max(0, startTime.getTime() - now.getTime()) : null,
        timeUntilEnd: endTime ? Math.max(0, endTime.getTime() - now.getTime()) : null,
      };
    });

    return NextResponse.json(enrichedRounds);

  } catch (error) {
    console.error('GET rounds error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch rounds',
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

// PATCH handler - Update round status (Admin only)
export async function PATCH(request: NextRequest) {
  try {
    // Check admin authentication (cookie-based or JWT-based)
    const hasAdminAuth = checkAdminAuth(request);
    if (!hasAdminAuth) {
      // Fall back to JWT-based authentication
      try {
        await requireAdmin(request);
      } catch (error) {
        return NextResponse.json({ 
          error: 'Admin access required', 
          code: 'ADMIN_REQUIRED' 
        }, { status: 403 });
      }
    }

    const { roundId, status, startsAt, endsAt } = await request.json();
    
    if (!roundId) {
      return NextResponse.json({ 
        error: 'Round ID is required', 
        code: 'MISSING_ROUND_ID' 
      }, { status: 400 });
    }

    // Validate roundId is a number
    const numericRoundId = Number(roundId);
    if (!Number.isInteger(numericRoundId) || numericRoundId < 1) {
      return NextResponse.json({ 
        error: 'Round ID must be a valid positive integer', 
        code: 'INVALID_ROUND_ID' 
      }, { status: 400 });
    }

    const validStatuses = ['PENDING', 'ACTIVE', 'COMPLETED'];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json({ 
        error: 'Invalid status. Must be PENDING, ACTIVE, or COMPLETED', 
        code: 'INVALID_STATUS' 
      }, { status: 400 });
    }

    // Check if round exists
    const existingRound = await db
      .select()
      .from(rounds)
      .where(eq(rounds.id, numericRoundId))
      .limit(1);

    if (existingRound.length === 0) {
      return NextResponse.json({ 
        error: 'Round not found', 
        code: 'ROUND_NOT_FOUND' 
      }, { status: 404 });
    }

    // Build update object
    const updateData: Record<string, any> = {
      updatedAt: new Date(),
    };

    if (status) {
      updateData.status = status;
      
      // Auto-set timestamps based on status
      if (status === 'ACTIVE' && !existingRound[0].startsAt) {
        updateData.startsAt = new Date();
      }
      if (status === 'COMPLETED' && !existingRound[0].endsAt) {
        updateData.endsAt = new Date();
      }
    }

    if (startsAt) {
      const startDate = new Date(startsAt);
      if (isNaN(startDate.getTime())) {
        return NextResponse.json({ 
          error: 'Invalid start date format', 
          code: 'INVALID_START_DATE' 
        }, { status: 400 });
      }
      updateData.startsAt = startDate;
    }

    if (endsAt) {
      const endDate = new Date(endsAt);
      if (isNaN(endDate.getTime())) {
        return NextResponse.json({ 
          error: 'Invalid end date format', 
          code: 'INVALID_END_DATE' 
        }, { status: 400 });
      }
      updateData.endsAt = endDate;
    }

    // Validate start/end date logic
    if (updateData.startsAt && updateData.endsAt && updateData.startsAt.getTime() >= updateData.endsAt.getTime()) {
      return NextResponse.json({ 
        error: 'Start date must be before end date', 
        code: 'INVALID_DATE_RANGE' 
      }, { status: 400 });
    }

    // Special validation for quiz round
    if (existingRound[0].name === 'QUIZ' && status === 'ACTIVE') {
      // Check if there are questions available
      const { questions } = await import('@/db/schema');
      const questionCountResult = await db.select().from(questions);
      const questionCount = questionCountResult.length;
      if (questionCount < 15) {
        return NextResponse.json({ 
          error: 'Cannot activate quiz round: Need at least 15 questions', 
          code: 'INSUFFICIENT_QUESTIONS' 
        }, { status: 400 });
      }
    }

    const updatedRound = await db
      .update(rounds)
      .set(updateData)
      .where(eq(rounds.id, numericRoundId))
      .returning();

    return NextResponse.json({
      ...updatedRound[0],
      message: `Round ${existingRound[0].name} successfully updated`
    });

  } catch (error: any) {
    console.error('PATCH rounds error:', error);
    
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
      error: 'Failed to update round',
      details: error.message || 'Unknown error' 
    }, { status: 500 });
  }
}

// POST handler - Create new round (Admin only)
export async function POST(request: NextRequest) {
  try {
    // Check admin authentication (cookie-based or JWT-based)
    const hasAdminAuth = checkAdminAuth(request);
    if (!hasAdminAuth) {
      // Fall back to JWT-based authentication
      try {
        await requireAdmin(request);
      } catch (error) {
        return NextResponse.json({ 
          error: 'Admin access required', 
          code: 'ADMIN_REQUIRED' 
        }, { status: 403 });
      }
    }

    const { name, day, description, startsAt, endsAt } = await request.json();
    
    if (!name || !day) {
      return NextResponse.json({ 
        error: 'Name and day are required', 
        code: 'MISSING_REQUIRED_FIELDS' 
      }, { status: 400 });
    }

    // Validate name
    const validNames = ['QUIZ', 'VOTING', 'FINAL'];
    if (!validNames.includes(name.toUpperCase())) {
      return NextResponse.json({ 
        error: 'Invalid round name. Must be QUIZ, VOTING, or FINAL', 
        code: 'INVALID_ROUND_NAME' 
      }, { status: 400 });
    }

    // Validate day
    if (!Number.isInteger(day) || day < 1) {
      return NextResponse.json({ 
        error: 'Day must be a positive integer', 
        code: 'INVALID_DAY' 
      }, { status: 400 });
    }

    // Check if round already exists
    const existingRound = await db
      .select()
      .from(rounds)
      .where(eq(rounds.name, name.toUpperCase()))
      .limit(1);

    if (existingRound.length > 0) {
      return NextResponse.json({ 
        error: 'Round with this name already exists', 
        code: 'DUPLICATE_ROUND' 
      }, { status: 409 });
    }

    // Validate dates if provided
    let startDate = null;
    let endDate = null;
    
    if (startsAt) {
      startDate = new Date(startsAt);
      if (isNaN(startDate.getTime())) {
        return NextResponse.json({ 
          error: 'Invalid start date format', 
          code: 'INVALID_START_DATE' 
        }, { status: 400 });
      }
    }

    if (endsAt) {
      endDate = new Date(endsAt);
      if (isNaN(endDate.getTime())) {
        return NextResponse.json({ 
          error: 'Invalid end date format', 
          code: 'INVALID_END_DATE' 
        }, { status: 400 });
      }
    }

    if (startDate && endDate && startDate.getTime() >= endDate.getTime()) {
      return NextResponse.json({ 
        error: 'Start date must be before end date', 
        code: 'INVALID_DATE_RANGE' 
      }, { status: 400 });
    }

    const newRound = await db.insert(rounds).values({
      name: name.toUpperCase(),
      day: day,
      status: 'PENDING',
      startsAt: startDate,
      endsAt: endDate,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();

    return NextResponse.json(newRound[0], { status: 201 });

  } catch (error: any) {
    console.error('POST rounds error:', error);
    
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
      error: 'Failed to create round',
      details: error.message || 'Unknown error' 
    }, { status: 500 });
  }
}