import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { 
  teams, 
  user, 
  rounds, 
  questions, 
  options, 
  quizSubmissions, 
  votes, 
  peerRatings, 
  judgeScores,
  finalPitches,
  tokenConversions,
  pitches
} from "@/db/schema";

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
    // Fetch all data from all tables
    const [
      allUsers,
      allTeams,
      allRounds,
      allQuestions,
      allOptions,
      allQuizSubmissions,
      allVotes,
      allPeerRatings,
      allJudgeScores,
      allFinalPitches,
      allTokenConversions,
      allPitches
    ] = await Promise.all([
      db.select().from(user),
      db.select().from(teams),
      db.select().from(rounds),
      db.select().from(questions),
      db.select().from(options),
      db.select().from(quizSubmissions),
      db.select().from(votes),
      db.select().from(peerRatings),
      db.select().from(judgeScores),
      db.select().from(finalPitches),
      db.select().from(tokenConversions),
      db.select().from(pitches)
    ]);

    const exportData = {
      exportedAt: new Date().toISOString(),
  platform: "TechSummit 2.0",
      version: "1.0.0",
      data: {
        users: allUsers,
        teams: allTeams,
        rounds: allRounds,
        questions: allQuestions,
        options: allOptions,
        quizSubmissions: allQuizSubmissions,
        votes: allVotes,
        peerRatings: allPeerRatings,
        judgeScores: allJudgeScores,
        finalPitches: allFinalPitches,
        tokenConversions: allTokenConversions,
        pitches: allPitches
      },
      statistics: {
        totalUsers: allUsers.length,
        totalTeams: allTeams.length,
        totalQuizSubmissions: allQuizSubmissions.length,
        totalVotes: allVotes.length,
        totalPeerRatings: allPeerRatings.length,
        totalJudgeScores: allJudgeScores.length
      }
    };

    return NextResponse.json(exportData, {
      headers: {
        'Content-Disposition': `attachment; filename="techsummit-export-${new Date().toISOString().split('T')[0]}.json"`,
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error("Error exporting data:", error);
    return NextResponse.json({ error: "Failed to export data" }, { status: 500 });
  }
}