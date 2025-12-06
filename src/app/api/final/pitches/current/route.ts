import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    // Return mock pitch status for now
    // In a real implementation, this would check the actual pitch state
    const pitchStatus = {
      currentTeamId: null,
      allCompleted: false
    };

    return NextResponse.json(pitchStatus);
  } catch (error) {
    console.error("Error fetching pitch status:", error);
    return NextResponse.json({ error: "Failed to fetch pitch status" }, { status: 500 });
  }
}