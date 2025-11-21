import { NextResponse } from "next/server";
import { prisma } from "@/server/db/client";
import { getUserOr401 } from "@/lib/api-helpers";
import { classifyTask } from "@/lib/ai/agents/classifierAgent";
import { updateTaskEmbeddings } from "@/lib/embeddings";
import { logAgentRunStart, logAgentRunFinish } from "@/server/db/agentRuns";

type Ctx = { params: Promise<{ taskId: string }> };

export async function POST(_req: Request, ctx: Ctx) {
  const { taskId } = await ctx.params;
  const user = await getUserOr401();
  if (!(user as any).id) return user as unknown as NextResponse;
  const userId = (user as any).id as string;
  const startedAt = Date.now();
  const run = await logAgentRunStart({ userId, type: "/api/ai/cards/[taskId]/classify", model: process.env.AI_MODEL ?? null });

  const task = await prisma.task.findFirst({
    where: { id: taskId, board: { userId } },
    include: {
      board: { include: { columns: { select: { id: true, name: true }, orderBy: { position: "asc" } } } },
    },
  });
  if (!task) return NextResponse.json({ message: "Not found" }, { status: 404 });

  // Prepare board columns context for the model
  const boardColumns = task.board.columns.map((c) => ({ id: c.id, name: c.name }));

  // Call classifier agent
  let result;
  try {
    result = await classifyTask({
      title: task.title,
      description: task.descriptionMarkdown || null,
      boardId: task.boardId,
      columnId: task.columnId,
      userId,
      boardColumns,
    });
  } catch (e: any) {
    // Graceful fallback if model call fails (e.g., missing API key or network)
    const fallback = {
      suggestedColumnId: task.columnId,
      suggestedPriority: task.priority,
      suggestedEstimateMin: Math.max(15, (task.estimatedPomodoros ?? 1) * 25),
      suggestedLabels: [],
      confidence: 0.3,
    } as const;
    await prisma.task.update({
      where: { id: task.id },
      data: {
        aiSuggestedColumnId: fallback.suggestedColumnId,
        aiSuggestedPriority: fallback.suggestedPriority,
        aiSuggestedEstimateMin: fallback.suggestedEstimateMin,
        aiState: "CLASSIFIED",
        aiConfidence: fallback.confidence,
      },
    });
    await logAgentRunFinish({ runId: run.id, status: 'error', error: String(e?.message ?? e), durationMs: Date.now() - startedAt, output: fallback });
    return NextResponse.json(fallback);
  }

  // Persist classification
  await prisma.task.update({
    where: { id: task.id },
    data: {
      aiSuggestedColumnId: result.suggestedColumnId,
      aiSuggestedPriority: result.suggestedPriority as any,
      aiSuggestedEstimateMin: result.suggestedEstimateMin,
      // Derive pomodoros from minutes if not set
      estimatedPomodoros:
        task.estimatedPomodoros ?? Math.max(1, Math.ceil(result.suggestedEstimateMin / 25)),
      aiState: "CLASSIFIED",
      aiConfidence: result.confidence,
      tags: task.tags?.length ? task.tags : result.suggestedLabels,
    },
  });

  // Ensure we have at-least placeholder embeddings for this task
  await updateTaskEmbeddings({
    taskId: task.id,
    userId,
    title: task.title,
    descriptionMarkdown: task.descriptionMarkdown ?? undefined,
  });

  await logAgentRunFinish({ runId: run.id, status: 'ok', durationMs: Date.now() - startedAt, output: result });
  return NextResponse.json(result);
}
