import { NextResponse } from "next/server";
import { getUserOr401, readJson } from "@/lib/api-helpers";
import { runDaoOrchestrator } from "@/lib/ai/orchestrator";

export async function POST(req: Request) {
  const user = await getUserOr401();
  if (!(user as any).id) return user as unknown as NextResponse;

  const body = await readJson<any>(req);
  const { brainDumpText, quickTodoText, boardId } = body || {};

  const ctx = await runDaoOrchestrator({
    userId: (user as any).id,
    brainDumpText,
    quickTodoText,
    boardId,
  });

  return NextResponse.json({
    tasks: ctx.enrichedTasks ?? ctx.generatedTasks ?? [],
    gemAwards: ctx.gemAwards ?? [],
    meta: ctx.meta ?? {},
  });
}
