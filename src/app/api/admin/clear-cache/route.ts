import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

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
    // Clear Next.js cache for all pages
    revalidatePath("/", "layout");
    
    // Clear specific paths that might be cached
    const pathsToRevalidate = [
      "/dashboard",
      "/quiz",
      "/voting",
      "/final",
      "/scoreboard",
      "/admin",
      "/api/rounds",
      "/api/teams",
      "/api/questions"
    ];

    pathsToRevalidate.forEach(path => {
      try {
        revalidatePath(path);
      } catch (error) {
        console.warn(`Failed to revalidate path ${path}:`, error);
      }
    });

    return NextResponse.json({ 
      success: true, 
      message: "System cache has been cleared successfully" 
    });
  } catch (error) {
    console.error("Error clearing cache:", error);
    return NextResponse.json({ error: "Failed to clear system cache" }, { status: 500 });
  }
}