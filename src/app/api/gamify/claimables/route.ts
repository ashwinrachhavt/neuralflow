import { NextResponse } from "next/server";
import { getUserOr401 } from "@/lib/api-helpers";
import { gamificationEngine } from "@/lib/gamification/engine";

export async function GET() {
  const user = await getUserOr401();
  if (!(user as any).id) return user as unknown as NextResponse;
  const claimables = await gamificationEngine.getClaimables((user as any).id);
  return NextResponse.json({ claimables });
}

