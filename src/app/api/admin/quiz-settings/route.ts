import { NextRequest, NextResponse } from "next/server";

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
    // Return default quiz settings
    const settings = {
      timeLimit: 30, // 30 minutes
      questionsCount: 15,
      maxTokenPerQuestion: 4,
      rulesEnabled: true
    };

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Error fetching quiz settings:", error);
    return NextResponse.json({ error: "Failed to fetch quiz settings" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  if (!requireAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const settings = await req.json();
    
    // In a real implementation, you would save these settings to a database
    // For now, we'll just return success
    console.log("Quiz settings updated:", settings);

    return NextResponse.json({ success: true, message: "Quiz settings updated" });
  } catch (error) {
    console.error("Error updating quiz settings:", error);
    return NextResponse.json({ error: "Failed to update quiz settings" }, { status: 500 });
  }
}