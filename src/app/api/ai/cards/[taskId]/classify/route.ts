import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
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

  // Call classifier agent (topics only)
  let result;
  try {
    result = await classifyTask({
      title: task.title,
      description: task.descriptionMarkdown || null,
    });
  } catch (e: any) {
    // Graceful fallback if model call fails
    const fallback = { topics: ['General'], primaryTopic: 'General', confidence: 0.3 } as const;
    await prisma.task.update({
      where: { id: task.id },
      data: {
        topics: fallback.topics,
        primaryTopic: fallback.primaryTopic,
        aiState: "CLASSIFIED",
        aiConfidence: fallback.confidence,
      },
    });
    await logAgentRunFinish({ runId: run.id, status: 'error', error: String(e?.message ?? e), durationMs: Date.now() - startedAt, output: fallback });
    return NextResponse.json(fallback);
  }

  // Persist topics only with graceful fallback if columns don't exist yet
  const baseData: any = {
    topics: (result as any).topics,
    primaryTopic: (result as any).primaryTopic,
    aiState: 'CLASSIFIED',
    aiConfidence: result.confidence,
  };

  try {
    await prisma.task.update({ where: { id: task.id }, data: baseData });
  } catch (e: any) {
    const msg = String(e?.message || "");
    if (!/Unknown argument `topics`|Unknown argument `primaryTopic`/i.test(msg)) throw e;
  }

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
