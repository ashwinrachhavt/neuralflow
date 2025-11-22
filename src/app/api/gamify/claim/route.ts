import { NextResponse } from "next/server";
import { getUserOr401, readJson } from "@/lib/api-helpers";
import { gamificationEngine } from "@/lib/gamification/engine";

export async function POST(req: Request) {
  const user = await getUserOr401();
  if (!(user as any).id) return user as unknown as NextResponse;
  const { slug } = (await readJson<{ slug: any }>(req)) ?? {};
  if (!slug || typeof slug !== "string") {
    return NextResponse.json({ message: "slug required" }, { status: 400 });
  }
  const result = await gamificationEngine.claim((user as any).id, slug as any);
  if ((result as any).ok) return NextResponse.json(result);
  return NextResponse.json(result, { status: 400 });
}

