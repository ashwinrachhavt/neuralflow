import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { gamificationEngine } from "@/lib/gamification/engine";

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });
  const { taskId } = await req.json();
  if (!taskId) return new NextResponse("Bad Request", { status: 400 });
  const res = await gamificationEngine.onTaskCompleted(userId, taskId);
  return NextResponse.json(res);
}
