import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const response = NextResponse.json({ 
      success: true, 
      message: "Logged out successfully" 
    });

    // Clear all judge-related cookies
    response.cookies.set("judge-token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 0,
      path: '/'
    });

    response.cookies.set("judge-auth", "", {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 0
    });

    response.cookies.set("judge-user", "", {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 0
    });

    return response;

  } catch (error) {
    console.error("Judge logout error:", error);
    return NextResponse.json({ 
      success: false, 
      error: "Logout failed" 
    }, { status: 500 });
  }
}