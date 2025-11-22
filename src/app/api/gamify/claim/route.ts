import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { gamificationEngine } from "@/lib/gamification/engine";

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });
  const { slug } = await req.json();
  if (!slug || typeof slug !== "string") return new NextResponse("Bad Request", { status: 400 });
  const res = await gamificationEngine.claim(userId, slug as any);
  if (!res.ok) return NextResponse.json(res, { status: 400 });
  return NextResponse.json({ ok: true });
}
