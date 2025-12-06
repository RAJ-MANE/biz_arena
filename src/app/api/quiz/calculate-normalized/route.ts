import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { quizSubmissions } from '@/db/schema';
import { eq } from 'drizzle-orm';

/**
 * POST /api/quiz/calculate-normalized
 * 
 * Admin endpoint to calculate normalized scores after all teams submit quiz.
 * Implements Round 1 scoring logic:
 * - Clamps raw category totals to [0, ∞)
 * - Normalizes each category across all teams to [0, 1]
 * - Calculates quiz influence index Q_index[t] as average of 4 normalized categories
 */
export async function POST(req: NextRequest) {
  try {
    // Get all quiz submissions
    const submissions = await db.select().from(quizSubmissions);

    if (submissions.length === 0) {
      return NextResponse.json({ 
        error: 'No quiz submissions found', 
        code: 'NO_SUBMISSIONS' 
      }, { status: 400 });
    }

    // Step 1: Get raw category totals (already stored in tokensMarketing, etc.)
    // Step 2: Clamp negatives to zero
    const clampedScores = submissions.map((sub: any) => ({
      teamId: sub.teamId,
      C: Math.max(0, sub.tokensCapital || 0),
      M: Math.max(0, sub.tokensMarketing || 0),
      S: Math.max(0, sub.tokensStrategy || 0),
      T: Math.max(0, sub.tokensTeam || 0),
    }));

    // Step 3: Find max values for normalization
    const C_max = Math.max(...clampedScores.map((s: any) => s.C), 1); // avoid division by zero
    const M_max = Math.max(...clampedScores.map((s: any) => s.M), 1);
    const S_max = Math.max(...clampedScores.map((s: any) => s.S), 1);
    const T_max = Math.max(...clampedScores.map((s: any) => s.T), 1);

    // Step 3 & 4: Normalize and calculate quiz index
    const normalizedScores = clampedScores.map((scores: any) => {
      const C_norm = scores.C / C_max;
      const M_norm = scores.M / M_max;
      const S_norm = scores.S / S_max;
      const T_norm = scores.T / T_max;
      const Q_index = (C_norm + M_norm + S_norm + T_norm) / 4.0;

      return {
        teamId: scores.teamId,
        capitalNorm: C_norm.toFixed(6),
        marketingNorm: M_norm.toFixed(6),
        strategyNorm: S_norm.toFixed(6),
        teamNorm: T_norm.toFixed(6),
        quizIndex: Q_index.toFixed(6),
      };
    });

    // Update all submissions with normalized scores
    const updates = [];
    for (const normalized of normalizedScores) {
      const updated = await db
        .update(quizSubmissions)
        .set({
          capitalNorm: normalized.capitalNorm,
          marketingNorm: normalized.marketingNorm,
          strategyNorm: normalized.strategyNorm,
          teamNorm: normalized.teamNorm,
          quizIndex: normalized.quizIndex,
        })
        .where(eq(quizSubmissions.teamId, normalized.teamId))
        .returning();
      
      updates.push(updated[0]);
    }

    return NextResponse.json({
      message: 'Normalized scores calculated successfully',
      totalTeams: submissions.length,
      maxValues: { C_max, M_max, S_max, T_max },
      updates: normalizedScores,
    }, { status: 200 });

  } catch (error: any) {
    console.error('POST calculate-normalized error:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error.message 
    }, { status: 500 });
  }
}
