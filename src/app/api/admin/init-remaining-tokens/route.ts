import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { quizSubmissions } from "@/db/schema";
import { sql } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    // Check for admin authentication
    const cookieHeader = req.headers.get("cookie") || "";
    if (!cookieHeader.includes("admin-auth=true")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log('🔄 Initializing remaining tokens for existing quiz submissions...');

    // Update all existing quiz submissions to set remaining tokens = original tokens
    // Only update records where remaining tokens are null/0
    const updateResult = await db.execute(sql`
      UPDATE quiz_submissions 
      SET 
        remaining_marketing = COALESCE(remaining_marketing, tokens_marketing),
        remaining_capital = COALESCE(remaining_capital, tokens_capital),
        remaining_team = COALESCE(remaining_team, tokens_team),
        remaining_strategy = COALESCE(remaining_strategy, tokens_strategy)
      WHERE 
        remaining_marketing IS NULL OR remaining_marketing = 0 OR
        remaining_capital IS NULL OR remaining_capital = 0 OR
        remaining_team IS NULL OR remaining_team = 0 OR
        remaining_strategy IS NULL OR remaining_strategy = 0
    `);

    // Get count of all quiz submissions for verification
    const totalSubmissions = await db.execute(sql`
      SELECT COUNT(*) as count FROM quiz_submissions
    `);

    // Get updated submissions to verify
    const updatedSubmissions = await db.execute(sql`
      SELECT 
        team_id,
        tokens_marketing, tokens_capital, tokens_team, tokens_strategy,
        remaining_marketing, remaining_capital, remaining_team, remaining_strategy
      FROM quiz_submissions 
      ORDER BY team_id
    `);

    console.log('✅ Successfully initialized remaining tokens');

    return NextResponse.json({
      success: true,
      message: 'Successfully initialized remaining tokens for existing quiz submissions',
      totalSubmissions: Array.isArray(totalSubmissions) ? totalSubmissions.length : 0,
      updatedSubmissions: Array.isArray(updatedSubmissions) ? updatedSubmissions : [],
      details: {
        description: 'Remaining tokens have been set to match original earned tokens',
        note: 'Teams can now convert tokens and see deductions properly'
      }
    });

  } catch (error) {
    console.error("Error initializing remaining tokens:", error);
    return NextResponse.json({ 
      error: "Failed to initialize remaining tokens",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}