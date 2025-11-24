import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserOr401 } from "@/lib/api-helpers";
import { enrichTask } from "@/lib/ai/agents/cardEnrichmentAgent";
import { logAgentRunFinish, logAgentRunStart } from "@/server/db/agentRuns";

type Ctx = { params: Promise<{ taskId: string }> };

export async function POST(_req: Request, ctx: Ctx) {
  const { taskId } = await ctx.params;
  const user = await getUserOr401();
  if (!(user as any).id) return user as unknown as NextResponse;
  const userId = (user as any).id as string;
  const startedAt = Date.now();
  const run = await logAgentRunStart({ userId, type: "/api/ai/cards/[taskId]/enrich", model: process.env.AI_MODEL ?? null });

  const task = await prisma.task.findFirst({
    where: { id: taskId, board: { userId } },
    include: { board: { select: { id: true } } },
  });
  if (!task) return NextResponse.json({ message: "Not found" }, { status: 404 });

  // Fetch a few recent tasks for context
  const recent = await prisma.task.findMany({
    where: { boardId: task.boardId },
    orderBy: { updatedAt: "desc" },
    take: 5,
    select: { id: true, title: true, descriptionMarkdown: true },
  });

  let result;
  try {
    result = await enrichTask({
      title: task.title,
      descriptionMarkdown: task.descriptionMarkdown || null,
      userRecentTasks: recent.map((t) => ({ id: t.id, title: t.title, description: t.descriptionMarkdown || "" })),
    });
  } catch (e: any) {
    const fallback = {
      descriptionMarkdown: (task.descriptionMarkdown || "").trim() || `Add 2–3 sentences that clarify scope and desired outcome for: ${task.title}`,
      subtasks: [{ title: `Draft plan for: ${task.title}`, estimateMin: 30 }],
      kind: "shallow",
      confidence: 0.3,
    } as const;
    await prisma.task.update({
      where: { id: task.id },
      data: {
        descriptionMarkdown: fallback.descriptionMarkdown,
        aiSubtasks: fallback.subtasks,
        aiSuggestedEstimateMin: fallback.subtasks.reduce((a, s) => a + (s.estimateMin || 0), 0),
        aiState: "ENRICHED",
        aiConfidence: fallback.confidence,
        enrichedAt: new Date(),
      },
    });
    await logAgentRunFinish({ runId: run.id, status: 'error', error: String(e?.message ?? e), durationMs: Date.now() - startedAt, output: fallback });
    return NextResponse.json(fallback);
  }

  const estimateMin = (result.subtasks ?? []).reduce((a, s) => a + (s.estimateMin || 0), 0) || null;
  const newDescription = result.descriptionMarkdown?.trim()?.length
    ? result.descriptionMarkdown.trim()
    : task.descriptionMarkdown || "";

  await prisma.task.update({
    where: { id: task.id },
    data: {
      descriptionMarkdown: newDescription,
      aiSubtasks: result.subtasks,
      aiSuggestedEstimateMin: estimateMin ?? undefined,
      estimatedPomodoros: task.estimatedPomodoros ?? (estimateMin ? Math.max(1, Math.ceil(estimateMin / 25)) : null),
      aiState: "ENRICHED",
      aiConfidence: result.confidence,
      enrichedAt: new Date(),
    },
  });

  const payload = {
    descriptionMarkdown: newDescription,
    subtasks: result.subtasks,
    aiSuggestedEstimateMin: estimateMin,
    confidence: result.confidence,
  };
  await logAgentRunFinish({ runId: run.id, status: 'ok', durationMs: Date.now() - startedAt, output: payload });
  return NextResponse.json(payload);
}
