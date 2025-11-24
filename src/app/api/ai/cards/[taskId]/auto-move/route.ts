import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserOr401 } from "@/lib/api-helpers";
import { autoMoveDecision } from "@/lib/ai/agents/autoMoverAgent";
import { logAgentRunStart, logAgentRunFinish } from "@/server/db/agentRuns";

type Ctx = { params: Promise<{ taskId: string }> };

export async function POST(_req: Request, ctx: Ctx) {
  const { taskId } = await ctx.params;
  const user = await getUserOr401();
  if (!(user as any).id) return user as unknown as NextResponse;
  const userId = (user as any).id as string;
  const startedAt = Date.now();
  const run = await logAgentRunStart({ userId, type: "/api/ai/cards/[taskId]/auto-move", model: process.env.AI_MODEL ?? null });

  const task = await prisma.task.findFirst({
    where: { id: taskId, board: { userId } },
    include: { board: { include: { columns: { select: { id: true, name: true } } } } },
  });
  if (!task) return NextResponse.json({ message: "Not found" }, { status: 404 });

  const boardColumns = task.board.columns.map((c) => ({ id: c.id, name: c.name }));

  let result;
  try {
    result = await autoMoveDecision({
      task: {
        id: task.id,
        columnId: task.columnId,
        aiState: (task as any).aiState ?? null,
        aiConfidence: (task as any).aiConfidence ?? null,
        updatedAt: task.updatedAt.toISOString(),
        lastUserInteractionAt: null,
      },
      boardColumns,
    });
  } catch (e: any) {
    // Deterministic fallback: if we have a confident suggestion, apply it
    const shouldMove = (task as any).aiState === 'SUGGESTED' && (task as any).aiConfidence && (task as any).aiConfidence > 0.8 && (task as any).aiSuggestedColumnId && (task as any).aiSuggestedColumnId !== task.columnId;
    result = { move: Boolean(shouldMove), targetColumnId: shouldMove ? (task as any).aiSuggestedColumnId : null } as const;
    await logAgentRunFinish({ runId: run.id, status: 'error', error: String(e?.message ?? e), durationMs: Date.now() - startedAt, output: result });
  }

  if (result.move && result.targetColumnId && result.targetColumnId !== task.columnId) {
    // Best-effort status sync based on target column name
    const target = boardColumns.find(c => c.id === result.targetColumnId);
    const name = (target?.name ?? '').toLowerCase();
    let statusUpdate: any = undefined;
    if (name.includes('backlog')) statusUpdate = 'BACKLOG';
    else if (name.includes('todo')) statusUpdate = 'TODO';
    else if (name.includes('progress')) statusUpdate = 'IN_PROGRESS';
    else if (name.includes('done')) statusUpdate = 'DONE';
    else if (name.includes('hidden') || name.includes('archive')) statusUpdate = 'DONE';

    await prisma.task.update({ where: { id: task.id }, data: { columnId: result.targetColumnId, aiState: 'COMPLETED', ...(statusUpdate ? { status: statusUpdate } : {}) } });
  }

  if (!result) {
    // Shouldn't happen but guard to avoid undefined response
    result = { move: false, targetColumnId: null } as const;
  }
  await logAgentRunFinish({ runId: run.id, status: 'ok', durationMs: Date.now() - startedAt, output: result });
  return NextResponse.json(result);
}
