import { NextResponse } from "next/server";
import { z } from "zod";
import { getUserOr401, readJson } from "@/lib/api-helpers";
import { prisma } from "@/server/db/client";
import { detectWorkflowCandidate } from "@/lib/workflows/mentor";

const detectInputSchema = z.object({
  limit: z.number().min(5).max(120).default(60).optional(),
});

export async function POST(req: Request) {
  const user = await getUserOr401();
  if (!(user as any).id) return user as unknown as NextResponse;
  const body = (await readJson(req)) ?? {};
  const parsed = detectInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid input" }, { status: 400 });
  }
  const limit = parsed.data.limit ?? 60;

  const tasks = await prisma.task.findMany({
    where: { board: { userId: (user as any).id } },
    orderBy: { updatedAt: "desc" },
    take: limit,
    select: {
      id: true,
      title: true,
      descriptionMarkdown: true,
      tags: true,
      priority: true,
      status: true,
      estimatedPomodoros: true,
      estimateMinutes: true,
      updatedAt: true,
      column: { select: { name: true } },
    },
  });

  const gems = await prisma.userStone.findMany({
    where: { userId: (user as any).id },
    orderBy: { earnedAt: "desc" },
    take: 25,
    select: {
      relatedTaskIds: true,
      earnedAt: true,
      stone: { select: { name: true } },
    },
  });

  const detection = await detectWorkflowCandidate({
    tasks: tasks.map((task) => ({
      id: task.id,
      title: task.title,
      descriptionMarkdown: task.descriptionMarkdown,
      tags: task.tags,
      priority: task.priority,
      status: task.status,
      estimatedPomodoros: task.estimatedPomodoros,
      estimateMinutes: task.estimateMinutes,
      columnName: task.column?.name ?? null,
      updatedAt: task.updatedAt.toISOString(),
    })),
    gems: gems.map((gem) => ({
      stone: gem.stone.name,
      relatedTaskIds: gem.relatedTaskIds,
      earnedAt: gem.earnedAt.toISOString(),
    })),
  });

  return NextResponse.json(detection);
}
