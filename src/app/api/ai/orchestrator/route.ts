import { NextRequest, NextResponse } from "next/server";
import { getUserOr401, readJson, jsonError } from "@/lib/api-helpers";
import { runDaoOrchestrator } from "@/lib/ai/orchestrator";

type Body = {
  brainDumpText?: string;
  quickTodoText?: string;
  boardId?: string;
};

export async function POST(req: NextRequest) {
  // Auth via Clerk (wrapped in getUserOr401)
  const user = await getUserOr401();
  if (!(user as any).id) return user as unknown as NextResponse;

  // Parse body
  const body = (await readJson<Body>(req)) || {};
  const { brainDumpText, quickTodoText, boardId } = body;
  if (!brainDumpText && !quickTodoText) {
    return jsonError("Provide brainDumpText or quickTodoText", 400);
  }

  try {
    const ctx = await runDaoOrchestrator({
      userId: (user as any).id,
      brainDumpText,
      quickTodoText,
      boardId,
    });

    return NextResponse.json(
      {
        ok: true,
        context: ctx,
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("[orchestrator] error", err);
    return jsonError(err?.message ?? "Internal error", 500);
  }
}

