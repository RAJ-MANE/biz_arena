import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { quizSubmissions, tokenConversions, teams } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    // Check for admin authentication
    const cookieHeader = req.headers.get("cookie") || "";
    if (!cookieHeader.includes("admin-auth=true")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all teams with their quiz submissions and token conversions
    const teamsData = await db
      .select({
        teamId: teams.id,
        teamName: teams.name,
        college: teams.college,
      })
      .from(teams)
      .orderBy(teams.id);

    const tokenStatus = await Promise.all(
      teamsData.map(async (team: any) => {
        // Get quiz submission
        const submission = await db
          .select()
          .from(quizSubmissions)
          .where(eq(quizSubmissions.teamId, team.teamId))
          .limit(1);

        // Get token conversions
        const conversions = await db
          .select()
          .from(tokenConversions)
          .where(eq(tokenConversions.teamId, team.teamId));

        const hasSubmission = submission.length > 0;
        const hasConverted = conversions.length > 0;

        const originalTokens = hasSubmission ? {
          marketing: submission[0].tokensMarketing,
          capital: submission[0].tokensCapital,
          team: submission[0].tokensTeam,
          strategy: submission[0].tokensStrategy,
        } : null;

        const remainingTokens = hasSubmission ? {
          marketing: submission[0].remainingMarketing ?? submission[0].tokensMarketing,
          capital: submission[0].remainingCapital ?? submission[0].tokensCapital,
          team: submission[0].remainingTeam ?? submission[0].tokensTeam,
          strategy: submission[0].remainingStrategy ?? submission[0].tokensStrategy,
        } : null;

  const votesGained = conversions.reduce((sum: number, conv: any) => sum + conv.votesGained, 0);

        return {
          team: {
            id: team.teamId,
            name: team.teamName,
            college: team.college,
          },
          hasQuizSubmission: hasSubmission,
          hasConvertedTokens: hasConverted,
          originalTokens,
          remainingTokens,
          conversions: conversions.map((conv: any) => ({
            category: conv.category,
            tokensUsed: conv.tokensUsed,
            votesGained: conv.votesGained,
            createdAt: conv.createdAt,
          })),
          totalVotesGained: votesGained,
          tokensSpent: originalTokens && remainingTokens ? {
            marketing: originalTokens.marketing - remainingTokens.marketing,
            capital: originalTokens.capital - remainingTokens.capital,
            team: originalTokens.team - remainingTokens.team,
            strategy: originalTokens.strategy - remainingTokens.strategy,
          } : null,
        };
      })
    );

    return NextResponse.json({
      success: true,
      teams: tokenStatus,
      summary: {
        totalTeams: teamsData.length,
        teamsWithQuiz: tokenStatus.filter(t => t.hasQuizSubmission).length,
        teamsWithConversions: tokenStatus.filter(t => t.hasConvertedTokens).length,
      }
    });

  } catch (error) {
    console.error("Error fetching token status:", error);
    return NextResponse.json({ 
      error: "Failed to fetch token status",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}