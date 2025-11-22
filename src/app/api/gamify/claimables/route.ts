import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { gamificationEngine } from "@/lib/gamification/engine";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });
  const list = await gamificationEngine.getClaimables(userId);
  return NextResponse.json({ claimables: list });
}
