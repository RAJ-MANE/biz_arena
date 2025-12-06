import { NextRequest, NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/db";

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
    // Test database connection
    let dbStatus = "Connected";
    try {
      await db.execute(sql`SELECT 1`);
    } catch (error) {
      dbStatus = "Disconnected";
    }

    const systemStatus = {
      database: dbStatus,
      api: "Online",
      cache: "Active",
      lastBackup: "2024-12-19T10:30:00Z", // Mock data
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      nodeVersion: process.version,
      platform: process.platform
    };

    return NextResponse.json(systemStatus);
  } catch (error) {
    console.error("Error fetching system status:", error);
    return NextResponse.json({ error: "Failed to fetch system status" }, { status: 500 });
  }
}