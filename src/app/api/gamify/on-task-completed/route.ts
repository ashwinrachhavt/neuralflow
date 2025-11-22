import { NextResponse } from "next/server";
import { getUserOr401, readJson } from "@/lib/api-helpers";
import { gamificationEngine } from "@/lib/gamification/engine";

export async function POST(req: Request) {
  const user = await getUserOr401();
  if (!(user as any).id) return user as unknown as NextResponse;
  const { taskId } = (await readJson<{ taskId: string }>(req)) ?? { taskId: null } as any;
  if (!taskId) return NextResponse.json({ message: "taskId required" }, { status: 400 });

  try {
    const result = await gamificationEngine.onTaskCompleted((user as any).id, taskId);
    return NextResponse.json({ awards: result.awards, shards: result.shards ?? [] });
  } catch (e: any) {
    return NextResponse.json({ message: e?.message ?? "Internal error" }, { status: 500 });
  }
}

