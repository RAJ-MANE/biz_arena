import { NextResponse } from "next/server";
import { db } from "@/db";
import { teams, user, admins } from "@/db/schema";

export async function GET() {
  try {
    console.log("Testing database connection...");
    
    // Test basic connection
    const teamsCount = await db.select().from(teams);
    const usersCount = await db.select().from(user);
    const adminsCount = await db.select().from(admins);
    
    console.log("Teams found:", teamsCount.length);
    console.log("Users found:", usersCount.length);
    console.log("Admins found:", adminsCount.length);
    
    // Get detailed data
    const teamsData = await db.select({
      id: teams.id,
      name: teams.name,
      college: teams.college,
      createdAt: teams.createdAt
    }).from(teams);
    
    const usersData = await db.select({
      id: user.id,
      name: user.name,
      username: user.username,
      teamId: user.teamId,
      isAdmin: user.isAdmin
    }).from(user);
    
    const adminsData = await db.select({
      id: admins.id,
      username: admins.username,
      createdAt: admins.createdAt
    }).from(admins);
    
    return NextResponse.json({
      success: true,
      connection: "OK",
      stats: {
        teamsCount: teamsCount.length,
        usersCount: usersCount.length,
        adminsCount: adminsCount.length
      },
      data: {
        teams: teamsData,
        users: usersData,
        admins: adminsData
      }
    });
  } catch (error) {
    console.error("Database connection test failed:", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      connection: "FAILED"
    }, { status: 500 });
  }
}