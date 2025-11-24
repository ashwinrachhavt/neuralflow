import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserOr401 } from "@/lib/api-helpers";
import { getRelatedItemsForTask } from "@/server/db/related";
import { suggestNextAction } from "@/lib/ai/agents/suggestorAgent";
import { logAgentRunStart, logAgentRunFinish } from "@/server/db/agentRuns";

type Ctx = { params: Promise<{ taskId: string }> };

export async function POST(_req: Request, ctx: Ctx) {
  const { taskId } = await ctx.params;
  const user = await getUserOr401();
  if (!(user as any).id) return user as unknown as NextResponse;
  const userId = (user as any).id as string;
  const startedAt = Date.now();
  const run = await logAgentRunStart({ userId, type: "/api/ai/cards/[taskId]/suggest", model: process.env.AI_MODEL ?? null });

  const task = await prisma.task.findFirst({
    where: { id: taskId, board: { userId } },
    include: {
      board: { include: { columns: { select: { id: true, name: true }, orderBy: { position: "asc" } } } },
    },
  });
  if (!task) return NextResponse.json({ message: "Not found" }, { status: 404 });

  const relatedItems = await getRelatedItemsForTask(task.id, userId);
  const boardColumns = task.board.columns.map((c) => ({ id: c.id, name: c.name }));

  let result;
  try {
    result = await suggestNextAction({
      task: {
        id: task.id,
        title: task.title,
        descriptionMarkdown: task.descriptionMarkdown || null,
        aiSubtasks: (task as any).aiSubtasks ?? null,
      },
      relatedItems,
      boardColumns,
      userCalendarFreeSlots: [],
    });
  } catch (e: any) {
    const fallback = {
      nextAction: `Pick the first subtask and schedule 25 minutes for: ${task.title}`,
      shouldMove: false,
      suggestedColumnId: null,
      confidence: 0.3,
    } as const;
    await prisma.task.update({
      where: { id: task.id },
      data: {
        aiNextAction: fallback.nextAction,
        aiSuggestedColumnId: fallback.suggestedColumnId ?? task.columnId,
        aiState: "SUGGESTED",
        aiConfidence: fallback.confidence,
      },
    });
    await logAgentRunFinish({ runId: run.id, status: 'error', error: String(e?.message ?? e), durationMs: Date.now() - startedAt, output: fallback });
    return NextResponse.json(fallback);
  }

  await prisma.task.update({
    where: { id: task.id },
    data: {
      aiNextAction: result.nextAction,
      aiSuggestedColumnId: result.suggestedColumnId ?? undefined,
      aiState: "SUGGESTED",
      aiConfidence: result.confidence,
    },
  });

  await logAgentRunFinish({ runId: run.id, status: 'ok', durationMs: Date.now() - startedAt, output: result });
  return NextResponse.json(result);
}
