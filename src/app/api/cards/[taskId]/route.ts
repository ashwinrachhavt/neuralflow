import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getUserOr401 } from "@/lib/api-helpers";

type RouteContext = { params: Promise<{ taskId: string }> };

export async function GET(_req: NextRequest, context: RouteContext) {
  const { taskId } = await context.params;
  const user = await getUserOr401();
  if (!(user as any).id) return user as unknown as NextResponse;

  const task = await prisma.task.findFirst({
    where: { id: taskId, board: { userId: (user as any).id } },
    include: {
      column: true,
      note: true,
      project: true,
      board: { select: { columns: { select: { id: true, name: true } } } },
      calendarEvents: {
        select: {
          location: true,
          startAt: true,
        },
        orderBy: { startAt: "asc" },
        take: 1,
      },
    },
  });

  if (!task) {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    task: {
      id: task.id,
      title: task.title,
      descriptionMarkdown: task.descriptionMarkdown ?? "",
      priority: task.priority,
      estimatedPomodoros: task.estimatedPomodoros,
      dueDate: task.dueDate,
      topics: (task as any).topics ?? [],
      primaryTopic: (task as any).primaryTopic ?? null,
      column: task.column
        ? { id: task.column.id, title: task.column.name }
        : null,
      tags: task.tags ?? [],
      project: task.project ? { id: task.project.id, title: task.project.title } : null,
      // AI fields
      aiSuggestedColumnId: (task as any).aiSuggestedColumnId ?? null,
      aiSuggestedPriority: (task as any).aiSuggestedPriority ?? null,
      aiSuggestedEstimateMin: (task as any).aiSuggestedEstimateMin ?? null,
      aiNextAction: (task as any).aiNextAction ?? null,
      aiState: (task as any).aiState ?? null,
      aiConfidence: (task as any).aiConfidence ?? null,
      location: task.calendarEvents?.[0]?.location ?? null,
      suggestedColumn: (task as any).aiSuggestedColumnId
        ? (() => {
            const c = task.board?.columns?.find((x) => x.id === (task as any).aiSuggestedColumnId);
            return c ? { id: c.id, title: c.name } : null;
          })()
        : null,
    },
    note: task.note
      ? {
          id: task.note.id,
          title: task.note.title,
          contentJson: task.note.contentJson,
          contentMarkdown: task.note.contentMarkdown,
        }
      : null,
  });
}
