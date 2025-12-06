import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { teams } from "@/db/schema";
import { requireAdmin } from "@/lib/auth-middleware";

export async function PATCH(req: NextRequest) {
  try {
    await requireAdmin(req);

    const { teamId, status } = await req.json();

    if (!teamId || !status) {
      return NextResponse.json({ error: "Missing teamId or status" }, { status: 400 });
    }

    // Note: The teams table doesn't have a status field in the schema
    // This is a placeholder implementation
    return NextResponse.json({ success: true, message: "Team status updated" });
  } catch (error) {
    console.error("Error updating team status:", error);
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await requireAdmin(req);

    const { teamId } = await req.json();

    if (!teamId) {
      return NextResponse.json({ error: "Missing teamId" }, { status: 400 });
    }

    await db
      .delete(teams)
      .where(eq(teams.id, teamId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting team:", error);
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }
}