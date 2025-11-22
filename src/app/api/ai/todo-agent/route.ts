import { NextRequest, NextResponse } from "next/server";
import { getUserOr401, readJson, jsonError } from "@/lib/api-helpers";
import { todoAgent } from "@/lib/ai/agents/todoAgent";
import type { AgentContext } from "@/lib/ai/types";

export async function POST(req: NextRequest) {
  const user = await getUserOr401();
  if (!(user as any).id) return user as unknown as NextResponse;

  const body = (await readJson<{ brainDumpText?: string; quickTodoText?: string }>(req)) || {};
  const input = body.brainDumpText ?? body.quickTodoText;
  if (!input) return jsonError("brainDumpText or quickTodoText required", 400);

  const ctx: AgentContext = {
    userId: (user as any).id,
    brainDumpText: body.brainDumpText,
    quickTodoText: body.quickTodoText,
  };

  const result = await todoAgent.run(ctx);
  return NextResponse.json(result, { status: 200 });
}

