// src/lib/auth-middleware.ts
import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';
import { db } from '@/db';
import { user, teams } from '@/db/schema';
import { eq } from 'drizzle-orm';

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required and must be set');
}

if (JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET must be at least 32 characters long for security');
}

// Now we know JWT_SECRET is defined and long enough
const validatedJWT_SECRET = JWT_SECRET;

interface AuthUser {
  id: string;
  username: string;
  name: string;
  isAdmin: boolean;
  team: {
    id: number | null;
    name: string | null;
    college: string | null;
  } | null;
}

export async function authenticateRequest(req: NextRequest): Promise<AuthUser | null> {
  try {
    // Try to get token from cookie first, then from Authorization header
    let token = req.cookies.get('auth-token')?.value;

    if (!token) {
      const authHeader = req.headers.get('Authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }

    if (!token) {
      return null;
    }

    // Verify JWT token
    const decoded = jwt.verify(token, validatedJWT_SECRET) as any;

    if (!decoded.userId) {
      return null;
    }

    // Try user table first
    const foundUsers = await db
      .select({
        id: user.id,
        username: user.username,
        name: user.name,
        isAdmin: user.isAdmin,
        teamId: user.teamId,
      })
      .from(user)
      .where(eq(user.id, decoded.userId))
      .limit(1);

    if (foundUsers.length > 0) {
      const foundUser = foundUsers[0];
      // Get user's team information using teamId
      let userTeam = null;
      if (foundUser.teamId) {
        const teamResult = await db
          .select({
            teamId: teams.id,
            teamName: teams.name,
            college: teams.college,
          })
          .from(teams)
          .where(eq(teams.id, foundUser.teamId))
          .limit(1);
        if (teamResult.length > 0) {
          userTeam = teamResult[0];
        }
      }
      return {
        id: String(foundUser.id),
        username: String(foundUser.username),
        name: String(foundUser.name),
        isAdmin: Boolean(foundUser.isAdmin),
        team: userTeam ? {
          id: userTeam.teamId ?? null,
          name: userTeam.teamName ?? null,
          college: userTeam.college ?? null,
        } : null
      };
    }

    // If not found in user table, try admins table
    const { admins } = await import('@/db/schema');
    const foundAdmins = await db
      .select({
        id: admins.id,
        username: admins.username,
        name: admins.username, // fallback, no name field
        isAdmin: admins.id, // will be overridden to true below
        teamId: admins.id, // will be overridden to null below
      })
      .from(admins)
      .where(eq(admins.id, decoded.userId))
      .limit(1);

    if (foundAdmins.length > 0) {
      const foundAdmin = foundAdmins[0];
      return {
        id: String(foundAdmin.id),
        username: String(foundAdmin.username),
        name: String(foundAdmin.username), // Use username as name for admins
        isAdmin: true,
        team: null
      };
    }

    return null;
  } catch (error) {
    console.error('Authentication error:', error);
    return null;
  }
}

export async function requireAuth(req: NextRequest): Promise<AuthUser> {
  const authUser = await authenticateRequest(req);
  
  if (!authUser) {
    throw new Error('Authentication required');
  }

  return authUser;
}

export async function requireAdmin(req: NextRequest): Promise<AuthUser> {
  const authUser = await requireAuth(req);
  
  if (!authUser.isAdmin) {
    throw new Error('Admin access required');
  }

  return authUser;
}

export async function requireJudge(req: NextRequest): Promise<boolean> {
  try {
    // Check for secure judge JWT token
    const judgeToken = req.cookies.get('judge-token')?.value;
    const adminAuthUser = await authenticateRequest(req);
    
    // Admin users can access judge functionality
    if (adminAuthUser?.isAdmin) {
      return true;
    }

    if (!judgeToken) {
      return false;
    }

    // Verify judge JWT token
    const decoded = jwt.verify(judgeToken, validatedJWT_SECRET) as any;
    
    return decoded.isJudge === true && decoded.judgeId;
  } catch (error) {
    console.error('Judge authentication error:', error);
    return false;
  }
}

export async function requireJudgeAuth(req: NextRequest): Promise<void> {
  const isJudge = await requireJudge(req);
  
  if (!isJudge) {
    throw new Error('Judge authentication required');
  }
}

// Helper function to check if user is team leader (can be used if needed)
export async function requireTeamLeader(req: NextRequest): Promise<AuthUser> {
  const authUser = await requireAuth(req);
  
  if (!authUser.team) {
    throw new Error('Team membership required');
  }

  // Additional team leader validation can be added here if you have leader roles
  return authUser;
}