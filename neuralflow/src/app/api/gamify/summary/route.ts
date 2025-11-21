import { NextResponse } from "next/server";
import { getOrCreateDbUser } from "@/lib/get-or-create-user";

export async function GET() {
  const user = await getOrCreateDbUser();
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  // TODO: Replace with real gamification summary once implemented
  return NextResponse.json({
    profile: { xp: 0, level: 1, currentDailyStreak: 0, longestDailyStreak: 0 },
    progress: [],
    recent: [],
  });
}

