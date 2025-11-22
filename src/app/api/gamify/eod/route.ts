import { NextResponse } from "next/server";
import { getUserOr401 } from "@/lib/api-helpers";
import { gamificationEngine } from "@/lib/gamification/engine";

export async function POST() {
  const user = await getUserOr401();
  if (!(user as any).id) return user as unknown as NextResponse;
  const result = await gamificationEngine.onEndOfDay((user as any).id, new Date());
  return NextResponse.json({ ok: true, awards: result.awards });
}

