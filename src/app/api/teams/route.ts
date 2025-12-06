import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../db/index';
import { teams, user, systemSettings } from '../../../db/schema';
import { eq, sql } from 'drizzle-orm';
import { authenticateRequest } from '@/lib/auth-middleware';

// GET handler - List all teams with basic info (public endpoint)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');


    // Get teams basic info only
    const teamsWithInfo = await db
      .select({
        id: teams.id,
        name: teams.name,
        college: teams.college,
        createdAt: teams.createdAt,
      })
      .from(teams)
      .orderBy(teams.createdAt)
      .limit(limit)
      .offset(offset);

    return NextResponse.json(teamsWithInfo);

  } catch (error) {
    console.error('GET teams error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch teams', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

// POST handler - Create new team (authenticated users only)
export async function POST(request: NextRequest) {
  try {
    const authUser = await authenticateRequest(request);
    
    if (!authUser) {
      return NextResponse.json({ 
        error: 'Authentication required', 
        code: 'UNAUTHENTICATED' 
      }, { status: 401 });
    }

    // Check registration deadline
    const deadlineSetting = await db
      .select()
      .from(systemSettings)
      .where(eq(systemSettings.key, 'registration_deadline'))
      .limit(1);

    if (deadlineSetting.length > 0 && deadlineSetting[0].value) {
      const deadline = new Date(deadlineSetting[0].value);
      const now = new Date();
      
      if (!isNaN(deadline.getTime()) && now > deadline) {
        return NextResponse.json({ 
          error: 'Team registration deadline has passed. Registration is now closed.', 
          code: 'REGISTRATION_DEADLINE_PASSED',
          deadline: deadline.toISOString()
        }, { status: 403 });
      }
    }

    const { name, college } = await request.json();
    
    // Validate required fields
    if (!name || !college) {
      return NextResponse.json({ 
        error: 'Team name and college are required', 
        code: 'MISSING_REQUIRED_FIELDS' 
      }, { status: 400 });
    }

    // Validate field lengths
    if (name.trim().length < 2 || name.trim().length > 100) {
      return NextResponse.json({ 
        error: 'Team name must be between 2-100 characters', 
        code: 'INVALID_NAME_LENGTH' 
      }, { status: 400 });
    }

    if (college.trim().length < 2 || college.trim().length > 200) {
      return NextResponse.json({ 
        error: 'College name must be between 2-200 characters', 
        code: 'INVALID_COLLEGE_LENGTH' 
      }, { status: 400 });
    }


    // Check if team name already exists
    const existingTeamName = await db
      .select()
      .from(teams)
      .where(eq(teams.name, name.trim()))
      .limit(1);

    if (existingTeamName.length > 0) {
      return NextResponse.json({ 
        error: 'Team name already exists. Please choose a different name.', 
        code: 'DUPLICATE_TEAM_NAME' 
      }, { status: 409 });
    }

    // Create team (no leaderId, no teamMembers)
    const newTeam = await db.insert(teams).values({
      name: name.trim(),
      college: college.trim(),
      // Ensure teams start with 3 tokens in each category
      tokensMarketing: 3,
      tokensCapital: 3,
      tokensTeam: 3,
      tokensStrategy: 3,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();

    return NextResponse.json({
      id: newTeam[0].id,
      name: newTeam[0].name,
      college: newTeam[0].college,
      createdAt: newTeam[0].createdAt,
      // Expose initial token counts for verification
      tokensMarketing: newTeam[0].tokensMarketing ?? 3,
      tokensCapital: newTeam[0].tokensCapital ?? 3,
      tokensTeam: newTeam[0].tokensTeam ?? 3,
      tokensStrategy: newTeam[0].tokensStrategy ?? 3,
    }, { status: 201 });

  } catch (error) {
    console.error('POST teams error:', error);
    
    // Handle authentication errors
    if (error instanceof Error && error.message.includes('Authentication')) {
      return NextResponse.json({ 
        error: 'Authentication required', 
        code: 'UNAUTHENTICATED' 
      }, { status: 401 });
    }

    // Handle database constraint violations
    if (error && typeof error === 'object' && 'message' in error) {
      const errorMessage = (error as any).message;
      if (errorMessage.includes('UNIQUE constraint failed')) {
        if (errorMessage.includes('name')) {
          return NextResponse.json({ 
            error: 'Team name already exists', 
            code: 'DUPLICATE_TEAM_NAME' 
          }, { status: 409 });
        }
      }
    }
    
    return NextResponse.json({ 
      error: 'Failed to create team', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}