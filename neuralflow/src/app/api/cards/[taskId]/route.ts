import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getUserOr401 } from "@/lib/api-helpers";

type RouteContext = { params: { taskId: string } };

export async function GET(_req: Request, { params }: RouteContext) {
  const user = await getUserOr401();
  if (!(user as any).id) return user as unknown as NextResponse;

  const task = await prisma.task.findFirst({
    where: { id: params.taskId, board: { userId: (user as any).id } },
    include: {
      column: true,
      note: true,
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
      column: task.column
        ? { id: task.column.id, title: task.column.name }
        : null,
      tags: task.tags ?? [],
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
