import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { tokenConversions, quizSubmissions, rounds } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { requireAuth } from '@/lib/auth-middleware';

// POST handler - Convert tokens to votes (Authenticated users during voting round)
export async function POST(request: NextRequest) {
  try {
    // Authenticate the user
    const authUser = await requireAuth(request);

    const { teamId, quantity = 1 } = await request.json();
    if (!teamId) {
      return NextResponse.json({ 
        error: 'Team ID is required', 
        code: 'MISSING_REQUIRED_FIELDS' 
      }, { status: 400 });
    }

    // Validate quantity
    if (!Number.isInteger(quantity) || quantity < 1) {
      return NextResponse.json({ 
        error: 'Quantity must be a positive integer', 
        code: 'INVALID_QUANTITY' 
      }, { status: 400 });
    }

    // Verify user belongs to the team or is admin
    if (!authUser.isAdmin && (!authUser.team || authUser.team.id !== teamId)) {
      return NextResponse.json({ 
        error: 'You can only convert tokens for your own team', 
        code: 'UNAUTHORIZED_TEAM' 
      }, { status: 403 });
    }

    // Check if voting round is active
    const votingRound = await db
      .select()
      .from(rounds)
      .where(and(
        eq(rounds.name, 'VOTING'),
        eq(rounds.status, 'ACTIVE')
      ))
      .limit(1);

    if (votingRound.length === 0) {
      return NextResponse.json({ 
        error: 'Voting round is not currently active', 
        code: 'VOTING_NOT_ACTIVE' 
      }, { status: 400 });
    }

    // Get team's quiz submission to check available tokens
    const quizSubmission = await db
      .select()
      .from(quizSubmissions)
      .where(eq(quizSubmissions.teamId, teamId))
      .limit(1);

    if (quizSubmission.length === 0) {
      return NextResponse.json({ 
        error: 'Team has not completed quiz yet', 
        code: 'NO_QUIZ_SUBMISSION' 
      }, { status: 400 });
    }

    const submission = quizSubmission[0];
    const available = {
      marketing: submission.remainingMarketing ?? submission.tokensMarketing,
      capital: submission.remainingCapital ?? submission.tokensCapital,
      team: submission.remainingTeam ?? submission.tokensTeam,
      strategy: submission.remainingStrategy ?? submission.tokensStrategy,
    };

    // Calculate maximum possible conversions based on available tokens
    const maxPossibleConversions = Math.min(
      available.marketing,
      available.capital,
      available.team,
      available.strategy
    );

    // Check if any conversion is possible
    if (maxPossibleConversions < 1) {
      return NextResponse.json({ 
        error: 'Insufficient tokens: need at least 1 in each category (Marketing, Capital, Team, Strategy)', 
        code: 'INSUFFICIENT_TOKENS',
        currentTokens: available,
        maxPossibleConversions: 0
      }, { status: 400 });
    }

    // Validate requested quantity doesn't exceed maximum possible
    if (quantity > maxPossibleConversions) {
      return NextResponse.json({ 
        error: `Cannot convert ${quantity} tokens. Maximum possible conversions: ${maxPossibleConversions}`, 
        code: 'QUANTITY_EXCEEDS_MAXIMUM',
        currentTokens: available,
        maxPossibleConversions: maxPossibleConversions,
        requestedQuantity: quantity
      }, { status: 400 });
    }

    // Create token conversion record
    const newConversion = await db.insert(tokenConversions).values([
      {
        teamId: teamId,
        category: 'ALL',
        tokensUsed: quantity * 4, // 4 tokens per conversion (1 from each category)
        votesGained: quantity,
        createdAt: new Date(),
      }
    ]).returning();

    // Deduct tokens from team's remaining balance
    const updatedSubmission = await db
      .update(quizSubmissions)
      .set({
        remainingMarketing: Math.max(0, available.marketing - quantity),
        remainingCapital: Math.max(0, available.capital - quantity),
        remainingTeam: Math.max(0, available.team - quantity),
        remainingStrategy: Math.max(0, available.strategy - quantity),
      })
      .where(eq(quizSubmissions.teamId, teamId))
      .returning();

    // Calculate new remaining tokens after deduction
    const newRemainingTokens = {
      marketing: Math.max(0, available.marketing - quantity),
      capital: Math.max(0, available.capital - quantity),
      team: Math.max(0, available.team - quantity),
      strategy: Math.max(0, available.strategy - quantity),
    };

    return NextResponse.json({
      success: true,
      conversion: newConversion[0],
      tokensUsed: quantity * 4,
      votesGained: quantity,
      tokensBeforeConversion: available,
      remainingTokens: newRemainingTokens,
      maxPossibleConversions: Math.min(...Object.values(newRemainingTokens)),
      message: `Successfully converted ${quantity} token${quantity > 1 ? 's' : ''} from each category → ${quantity} vote${quantity > 1 ? 's' : ''}. Tokens have been deducted from your balance.`
    }, { status: 201 });

  } catch (error: any) {
    console.error('POST token conversion error:', error);
    
    // Handle authentication errors
    if (error.message === 'Authentication required') {
      return NextResponse.json({ 
        error: 'Authentication required', 
        code: 'UNAUTHENTICATED' 
      }, { status: 401 });
    }
    
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message || 'Unknown error'
    }, { status: 500 });
  }
}

// GET handler - Get token conversion status for team
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const teamId = searchParams.get('teamId');

    if (!teamId) {
      return NextResponse.json({ 
        error: 'Team ID is required', 
        code: 'MISSING_TEAM_ID' 
      }, { status: 400 });
    }

    // Get team's conversions
    const conversions = await db
      .select()
      .from(tokenConversions)
      .where(eq(tokenConversions.teamId, parseInt(teamId)));

    // Get team's quiz submission for available tokens
    const quizSubmission = await db
      .select()
      .from(quizSubmissions)
      .where(eq(quizSubmissions.teamId, parseInt(teamId)))
      .limit(1);

    const availableTokens = quizSubmission.length > 0 ? {
      marketing: quizSubmission[0].remainingMarketing ?? quizSubmission[0].tokensMarketing,
      capital: quizSubmission[0].remainingCapital ?? quizSubmission[0].tokensCapital,
      team: quizSubmission[0].remainingTeam ?? quizSubmission[0].tokensTeam,
      strategy: quizSubmission[0].remainingStrategy ?? quizSubmission[0].tokensStrategy,
    } : {
      marketing: 0,
      capital: 0,
      team: 0,
      strategy: 0,
    };

    const originalTokens = quizSubmission.length > 0 ? {
      marketing: quizSubmission[0].tokensMarketing,
      capital: quizSubmission[0].tokensCapital,
      team: quizSubmission[0].tokensTeam,
      strategy: quizSubmission[0].tokensStrategy,
    } : {
      marketing: 0,
      capital: 0,
      team: 0,
      strategy: 0,
    };

  // Calculate total votes gained from conversions
  const convs: any[] = conversions;
  const totalVotesGained = convs.reduce((sum: number, conv: any) => sum + conv.votesGained, 0);

    // Calculate maximum possible conversions based on current available tokens
    const maxPossibleConversions = Math.min(
      availableTokens.marketing,
      availableTokens.capital,
      availableTokens.team,
      availableTokens.strategy
    );

    // Check if team can convert tokens (has tokens available)
    const canConvert = maxPossibleConversions >= 1;

    return NextResponse.json({
      teamId: parseInt(teamId),
      conversions: conversions,
      originalTokens: originalTokens,
      availableTokens: availableTokens,
      totalVotesGained: totalVotesGained,
      canConvert: canConvert,
      maxPossibleConversions: maxPossibleConversions,
      hasQuizSubmission: quizSubmission.length > 0,
    });

  } catch (error) {
    console.error('GET token conversions error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}