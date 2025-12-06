import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { votes, quizSubmissions, teamApprovalRates, teams } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';

/**
 * POST /api/voting/calculate-approval-rates
 * 
 * Admin endpoint to calculate approval rates after Round 2 (voting) completes.
 * Implements Round 2 scoring logic:
 * - Tallies raw YES and NO votes for each team
 * - Applies quiz-based influence (Marketing boosts YES, Capital reduces NO)
 * - Calculates approval rate A[t] = Y_eff / (Y_eff + N_eff)
 */
export async function POST(req: NextRequest) {
  try {
    // Hyperparameters for quiz influence
    const ALPHA = 0.10; // up to +10% YES boost at max marketing
    const BETA = 0.10;  // up to -10% NO reduction at max capital

    // Get all teams
    const allTeams = await db.select().from(teams);

    if (allTeams.length === 0) {
      return NextResponse.json({ 
        error: 'No teams found', 
        code: 'NO_TEAMS' 
      }, { status: 400 });
    }

    const approvalRates = [];

    for (const team of allTeams) {
      const teamId = team.id;

      // Get raw vote tallies
      const voteData = await db
        .select({
          yesCount: sql<number>`COALESCE(SUM(CASE WHEN ${votes.value} = 1 THEN 1 ELSE 0 END), 0)`,
          noCount: sql<number>`COALESCE(SUM(CASE WHEN ${votes.value} = -1 THEN 1 ELSE 0 END), 0)`,
        })
        .from(votes)
        .where(eq(votes.toTeamId, teamId));

      const Y_raw = Number(voteData[0]?.yesCount) || 0;
      const N_raw = Number(voteData[0]?.noCount) || 0;

      // Get normalized quiz scores for influence
      const quizData = await db
        .select({
          marketingNorm: quizSubmissions.marketingNorm,
          capitalNorm: quizSubmissions.capitalNorm,
        })
        .from(quizSubmissions)
        .where(eq(quizSubmissions.teamId, teamId))
        .limit(1);

      const M_norm = quizData.length > 0 && quizData[0].marketingNorm 
        ? parseFloat(quizData[0].marketingNorm) 
        : 0;
      const C_norm = quizData.length > 0 && quizData[0].capitalNorm 
        ? parseFloat(quizData[0].capitalNorm) 
        : 0;

      // Apply quiz-based influence
      const Y_eff = Y_raw * (1 + ALPHA * M_norm);
      const N_eff = Math.max(0, N_raw * (1 - BETA * C_norm));

      // Calculate approval rate
      const denom = Y_eff + N_eff;
      const A = denom > 0 ? Y_eff / denom : 0.5; // neutral fallback if no votes

      // Store approval rate
      await db
        .insert(teamApprovalRates)
        .values({
          teamId: teamId,
          yesRaw: Y_raw,
          noRaw: N_raw,
          yesEffective: Y_eff.toFixed(6),
          noEffective: N_eff.toFixed(6),
          approvalRate: A.toFixed(6),
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: teamApprovalRates.teamId,
          set: {
            yesRaw: Y_raw,
            noRaw: N_raw,
            yesEffective: Y_eff.toFixed(6),
            noEffective: N_eff.toFixed(6),
            approvalRate: A.toFixed(6),
            updatedAt: new Date(),
          },
        });

      approvalRates.push({
        teamId,
        teamName: team.name,
        Y_raw,
        N_raw,
        M_norm: M_norm.toFixed(4),
        C_norm: C_norm.toFixed(4),
        Y_eff: Y_eff.toFixed(2),
        N_eff: N_eff.toFixed(2),
        approvalRate: A.toFixed(4),
      });
    }

    return NextResponse.json({
      message: 'Approval rates calculated successfully',
      totalTeams: allTeams.length,
      hyperparameters: { ALPHA, BETA },
      approvalRates,
    }, { status: 200 });

  } catch (error: any) {
    console.error('POST calculate-approval-rates error:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error.message 
    }, { status: 500 });
  }
}
