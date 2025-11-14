import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getOrCreateDbUser } from "@/lib/get-or-create-user";

type RouteContext = { params: { taskId: string } };

export async function GET(_req: Request, { params }: RouteContext) {
  const user = await getOrCreateDbUser();
  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const task = await prisma.task.findFirst({
    where: { id: params.taskId, board: { userId: user.id } },
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

