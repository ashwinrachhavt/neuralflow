import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getOrCreateDbUser } from "@/lib/get-or-create-user";

type RouteContext = { params: { taskId: string } };

export async function PATCH(_req: Request, { params }: RouteContext) {
  const user = await getOrCreateDbUser();
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  // Ensure task belongs to user and load board id
  const task = await prisma.task.findFirst({
    where: { id: params.taskId, board: { userId: user.id } },
    select: { id: true, boardId: true },
  });
  if (!task) return NextResponse.json({ message: "Not found" }, { status: 404 });

  // Find a suitable "Done" column; fallback to any last column by highest position
  const columns = await prisma.column.findMany({
    where: { boardId: task.boardId },
    orderBy: { position: "asc" },
    select: { id: true, name: true },
  });
  let target = columns.find(c => ["done", "complete", "completed"].includes(c.name.toLowerCase()));
  if (!target && columns.length > 0) target = columns[columns.length - 1];

  if (!target) return NextResponse.json({ message: "No columns available" }, { status: 409 });

  await prisma.task.update({
    where: { id: task.id },
    data: {
      column: { connect: { id: target.id } },
    },
  });

  return NextResponse.json({ ok: true });
}
