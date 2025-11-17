import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { gamificationEngine } from "@/lib/gamification/engine";

export async function POST(req: Request) {
  const { userId } = auth();
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });
  const { sessionId } = await req.json();
  if (!sessionId) return new NextResponse("Bad Request", { status: 400 });
  const res = await gamificationEngine.onPomodoroCompleted(userId, sessionId);
  return NextResponse.json(res);
}

