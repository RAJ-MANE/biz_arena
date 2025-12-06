import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { quizSubmissions } from "@/db/schema";

// Middleware to check admin authentication
function requireAdmin(req: NextRequest) {
  const cookieHeader = req.headers.get("cookie") || "";
  if (!cookieHeader.includes("admin-auth=true")) {
    return false;
  }
  return true;
}

export async function POST(req: NextRequest) {
  if (!requireAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Delete all quiz submissions to reset quiz progress
    await db.delete(quizSubmissions);

    return NextResponse.json({ 
      success: true, 
      message: "All quiz progress has been reset successfully" 
    });
  } catch (error) {
    console.error("Error resetting quizzes:", error);
    return NextResponse.json({ error: "Failed to reset quiz progress" }, { status: 500 });
  }
}