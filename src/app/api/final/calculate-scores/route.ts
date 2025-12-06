import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { teams, quizSubmissions, teamApprovalRates, peerRatings, judgeScores } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';

/**
 * GET /api/final/calculate-scores
 * 
 * Calculate final scores combining all three rounds:
 * - Round 1: Quiz influence index Q_index[t]
 * - Round 2: Approval rate A[t]
 * - Round 3: Judge normalized score J_norm[t] and Peer normalized score P_norm[t]
 * 
 * Final_score[t] = w_J * J_norm[t] + w_P * P_norm[t] + w_A * A[t] + w_Q * Q_index[t]
 * 
 * Weights: w_J=0.55, w_P=0.25, w_A=0.15, w_Q=0.05
 */
export async function GET(req: NextRequest) {
  try {
    // Fixed weights (sum to 1.0)
    const w_J = 0.55;  // Judges
    const w_P = 0.25;  // Peers
    const w_A = 0.15;  // Approval (Round 2)
    const w_Q = 0.05;  // Quiz

    // Get all teams
    const allTeams = await db.select().from(teams);

    if (allTeams.length === 0) {
      return NextResponse.json({ 
        error: 'No teams found', 
        code: 'NO_TEAMS' 
      }, { status: 400 });
    }

    const finalScores = [];

    for (const team of allTeams) {
      const teamId = team.id;

      // Get Q_index from Round 1 (quiz)
      const quizData = await db
        .select({ quizIndex: quizSubmissions.quizIndex })
        .from(quizSubmissions)
        .where(eq(quizSubmissions.teamId, teamId))
        .limit(1);

      const Q_index = quizData.length > 0 && quizData[0].quizIndex 
        ? parseFloat(quizData[0].quizIndex) 
        : 0;

      // Get A (approval rate) from Round 2 (voting)
      const approvalData = await db
        .select({ approvalRate: teamApprovalRates.approvalRate })
        .from(teamApprovalRates)
        .where(eq(teamApprovalRates.teamId, teamId))
        .limit(1);

      const A = approvalData.length > 0 && approvalData[0].approvalRate 
        ? parseFloat(approvalData[0].approvalRate) 
        : 0.5; // neutral fallback

      // Get judge scores from Round 3 (30-100 range)
      const judgeData = await db
        .select({
          avgScore: sql<number>`COALESCE(AVG(CAST(${judgeScores.score} AS DECIMAL)), 0)`,
          judgeCount: sql<number>`COUNT(${judgeScores.id})`,
        })
        .from(judgeScores)
        .where(eq(judgeScores.teamId, teamId));

      const J_avg = Number(judgeData[0]?.avgScore) || 0;
      const judgeCount = Number(judgeData[0]?.judgeCount) || 0;
      
      // Normalize judge score from [30, 100] to [0, 1]
      const J_norm = judgeCount > 0 
        ? Math.max(0, Math.min(1, (J_avg - 30) / 70)) 
        : 0;

      // Get peer ratings from Round 3 (3-10 range)
      const peerData = await db
        .select({
          avgRating: sql<number>`COALESCE(AVG(CAST(${peerRatings.rating} AS DECIMAL)), 0)`,
          peerCount: sql<number>`COUNT(${peerRatings.id})`,
        })
        .from(peerRatings)
        .where(eq(peerRatings.toTeamId, teamId));

      const P_avg = Number(peerData[0]?.avgRating) || 0;
      const peerCount = Number(peerData[0]?.peerCount) || 0;
      
      // Normalize peer rating from [3, 10] to [0, 1]
      const P_norm = peerCount > 0 
        ? Math.max(0, Math.min(1, (P_avg - 3) / 7)) 
        : 0;

      // Calculate final score
      const Final_score = w_J * J_norm + w_P * P_norm + w_A * A + w_Q * Q_index;
      const Final_display = Final_score * 100.0; // Convert to 0-100 scale

      finalScores.push({
        rank: 0, // Will be assigned after sorting
        teamId,
        teamName: team.name,
        college: team.college,
        components: {
          quizIndex: Q_index.toFixed(4),
          approvalRate: A.toFixed(4),
          judgeNorm: J_norm.toFixed(4),
          peerNorm: P_norm.toFixed(4),
        },
        rawData: {
          judgeAvg: J_avg.toFixed(2),
          judgeCount,
          peerAvg: P_avg.toFixed(2),
          peerCount,
        },
        weights: { w_J, w_P, w_A, w_Q },
        finalScore: Final_score.toFixed(6),
        finalDisplay: Final_display.toFixed(2),
      });
    }

    // Sort by final score descending and assign ranks
    finalScores.sort((a, b) => parseFloat(b.finalScore) - parseFloat(a.finalScore));
    finalScores.forEach((team, index) => {
      team.rank = index + 1;
    });

    return NextResponse.json({
      message: 'Final scores calculated successfully',
      totalTeams: allTeams.length,
      weights: { w_J, w_P, w_A, w_Q },
      scoreboard: finalScores,
      explanation: {
        formula: 'Final_score = 0.55*J_norm + 0.25*P_norm + 0.15*A + 0.05*Q_index',
        ranges: {
          judgeScores: '[30, 100] normalized to [0, 1]',
          peerRatings: '[3, 10] normalized to [0, 1]',
          approvalRate: '[0, 1] from Round 2 voting',
          quizIndex: '[0, 1] from Round 1 quiz',
        },
      },
    }, { status: 200 });

  } catch (error: any) {
    console.error('GET calculate-scores error:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error.message 
    }, { status: 500 });
  }
}
