import { NextRequest, NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { teams, user, votes, quizSubmissions, peerRatings, judgeScores } from "@/db/schema";

// Middleware to check admin authentication
function requireAdmin(req: NextRequest) {
  const cookieHeader = req.headers.get("cookie") || "";
  if (!cookieHeader.includes("admin-auth=true")) {
    return false;
  }
  return true;
}

export async function GET(req: NextRequest) {
  if (!requireAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Fetch various statistics
    const [
      totalUsers,
      totalTeams,
      totalVotes,
      quizAttempts,
      totalTokens,
      peerRatingsCount,
      judgeScoresCount
    ] = await Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(user),
      db.select({ count: sql<number>`count(*)` }).from(teams),
      db.select({ count: sql<number>`count(*)` }).from(votes),
      db.select({ count: sql<number>`count(*)` }).from(quizSubmissions),
      db.select({ 
        totalMarketing: sql<number>`COALESCE(SUM(tokens_marketing), 0)`,
        totalCapital: sql<number>`COALESCE(SUM(tokens_capital), 0)`,
        totalTeam: sql<number>`COALESCE(SUM(tokens_team), 0)`,
        totalStrategy: sql<number>`COALESCE(SUM(tokens_strategy), 0)`
      }).from(quizSubmissions),
      db.select({ count: sql<number>`count(*)` }).from(peerRatings),
      db.select({ 
        count: sql<number>`count(*)`,
        totalScore: sql<number>`COALESCE(SUM(score), 0)`,
        avgScore: sql<number>`COALESCE(AVG(CAST(score AS DECIMAL)), 0)`
      }).from(judgeScores)
    ]);

    const stats = {
      totalUsers: totalUsers[0]?.count || 0,
      totalTeams: totalTeams[0]?.count || 0,
      totalVotes: totalVotes[0]?.count || 0,
      quizAttempts: quizAttempts[0]?.count || 0,
      completedQuizzes: quizAttempts[0]?.count || 0,
      activeVoters: totalVotes[0]?.count || 0,
      completedPitches: peerRatingsCount[0]?.count || 0,
      peerRatings: peerRatingsCount[0]?.count || 0,
      judgeScores: {
        count: judgeScoresCount[0]?.count || 0,
        totalScore: Number(judgeScoresCount[0]?.totalScore) || 0,
        averageScore: Number(judgeScoresCount[0]?.avgScore) || 0
      },
      tokenDistribution: {
        marketing: Number(totalTokens[0]?.totalMarketing) || 0,
        capital: Number(totalTokens[0]?.totalCapital) || 0,
        team: Number(totalTokens[0]?.totalTeam) || 0,
        strategy: Number(totalTokens[0]?.totalStrategy) || 0,
        total: Number(totalTokens[0]?.totalMarketing || 0) + 
               Number(totalTokens[0]?.totalCapital || 0) + 
               Number(totalTokens[0]?.totalTeam || 0) + 
               Number(totalTokens[0]?.totalStrategy || 0)
      }
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Error fetching stats:", error);
    return NextResponse.json({ error: "Failed to fetch statistics" }, { status: 500 });
  }
}