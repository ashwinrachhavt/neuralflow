import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getOrCreateDbUser } from "@/lib/get-or-create-user";
import { getOrCreateDefaultBoard } from "@/lib/board";

export async function GET() {
  const user = await getOrCreateDbUser();
  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const board = await getOrCreateDefaultBoard(user.id);

  // Load tasks per column
  const tasks = await prisma.task.findMany({
    where: { boardId: board.id },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      title: true,
      descriptionMarkdown: true,
      tags: true,
      columnId: true,
      priority: true,
      enrichedAt: true,
      createdAt: true,
    },
  });

  return NextResponse.json({
    board: {
      id: board.id,
      title: board.title,
      columns: board.columns.map(c => ({ id: c.id, name: c.name, position: c.position })),
      tasks,
    },
  });
}

