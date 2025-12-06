import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { user, teams } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { hashSync } from 'bcryptjs';
import { sanitizeInput } from '@/lib/utils';

export async function POST(req: NextRequest) {
  try {
    const { username, password, name, teamName, college } = await req.json();
    
    // Sanitize inputs
    const sanitizedUsername = sanitizeInput(username || '');
    const sanitizedName = sanitizeInput(name || '');
    const sanitizedTeamName = sanitizeInput(teamName || '');
    const sanitizedCollege = sanitizeInput(college || '');
    
    // Validate required fields
    if (!sanitizedUsername || !password || !sanitizedName || !sanitizedTeamName || !sanitizedCollege) {
      return NextResponse.json({ 
        error: 'All fields are required (username, password, name, teamName, college)' 
      }, { status: 400 });
    }

    // Validate input lengths and format
    if (sanitizedUsername.length < 3 || sanitizedUsername.length > 50) {
      return NextResponse.json({ error: 'Username must be between 3-50 characters' }, { status: 400 });
    }
    if (password.length < 10 ||
        !/[A-Z]/.test(password) ||
        !/[a-z]/.test(password) ||
        !/[0-9]/.test(password) ||
        !/[^A-Za-z0-9]/.test(password)
    ) {
      return NextResponse.json({ error: 'Password must be at least 10 characters and include uppercase, lowercase, number, and special character' }, { status: 400 });
    }
    if (sanitizedName.length > 100) {
      return NextResponse.json({ error: 'Name must be less than 100 characters' }, { status: 400 });
    }
    if (sanitizedTeamName.length > 100) {
      return NextResponse.json({ error: 'Team name must be less than 100 characters' }, { status: 400 });
    }
    if (sanitizedCollege.length > 200) {
      return NextResponse.json({ error: 'College name must be less than 200 characters' }, { status: 400 });
    }

    // Check if username already exists
    const existingUser = await db
      .select({ id: user.id })
      .from(user)
      .where(eq(user.username, sanitizedUsername.trim().toLowerCase()));
      
    if (existingUser.length > 0) {
      return NextResponse.json({ error: 'Username already taken' }, { status: 409 });
    }

    // Check if team name already exists
    const existingTeam = await db
      .select({ id: teams.id })
      .from(teams)
      .where(eq(teams.name, sanitizedTeamName.trim()));
      
    if (existingTeam.length > 0) {
      return NextResponse.json({ error: 'Team name already taken' }, { status: 409 });
    }

    // Generate unique user ID
    const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Hash password
    const hashedPassword = hashSync(password, 12);

    // Create team first
    const newTeam = await db.insert(teams).values({
      name: sanitizedTeamName.trim(),
      college: sanitizedCollege.trim(),
      // Ensure teams start with 3 tokens in each category
      tokensMarketing: 3,
      tokensCapital: 3,
      tokensTeam: 3,
      tokensStrategy: 3,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();

    // Create user and assign them to the team
    const newUser = await db.insert(user).values({
      id: userId,
      username: sanitizedUsername.trim().toLowerCase(),
      name: sanitizedName.trim(),
      password: hashedPassword,
      isAdmin: false,
      teamId: newTeam[0].id, // Assign user to the team
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();


    return NextResponse.json({ 
      success: true,
      user: {
        id: newUser[0].id,
        username: newUser[0].username,
        name: newUser[0].name,
        teamId: newUser[0].teamId,
      },
      team: {
        id: newTeam[0].id,
        name: newTeam[0].name,
        college: newTeam[0].college,
        // Expose initial token counts so callers can verify initialization immediately
        tokensMarketing: newTeam[0].tokensMarketing ?? 3,
        tokensCapital: newTeam[0].tokensCapital ?? 3,
        tokensTeam: newTeam[0].tokensTeam ?? 3,
        tokensStrategy: newTeam[0].tokensStrategy ?? 3,
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    
    // Handle specific database errors
    if (error && typeof error === 'object' && 'message' in error) {
      const errorMessage = (error as any).message;
      if (errorMessage.includes('UNIQUE constraint failed')) {
        if (errorMessage.includes('username')) {
          return NextResponse.json({ error: 'Username already taken' }, { status: 409 });
        }
        if (errorMessage.includes('name')) {
          return NextResponse.json({ error: 'Team name already taken' }, { status: 409 });
        }
      }
    }
    
    return NextResponse.json({ error: 'Registration failed. Please try again.' }, { status: 500 });
  }
}