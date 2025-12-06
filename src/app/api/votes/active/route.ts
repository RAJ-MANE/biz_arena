import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    // Proxy to the canonical voting state endpoint so clients see the same source of truth.
    // Use a short timeout to avoid blocking clients if the local server has issues.
    const base = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);

    try {
      const res = await fetch(`${base}/api/voting/current`, { signal: controller.signal });
      clearTimeout(timeout);

      if (!res.ok) {
        console.warn('/api/voting/current responded with non-OK status', res.status);
        return NextResponse.json({ active: false, currentTeamId: null, timeRemaining: 0 });
      }

      const state = await res.json();
      return NextResponse.json({
        active: Boolean(state.votingActive),
        currentTeamId: state.team?.id ?? null,
        timeRemaining: state.phaseTimeLeft ?? 0,
        raw: state
      });
    } catch (err) {
      console.warn('Error proxying to /api/voting/current:', err);
      return NextResponse.json({ active: false, currentTeamId: null, timeRemaining: 0 });
    }
  } catch (error) {
    console.error("Error fetching voting status:", error);
    return NextResponse.json({ error: "Failed to fetch voting status" }, { status: 500 });
  }
}