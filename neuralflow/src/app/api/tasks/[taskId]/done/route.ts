import { NextResponse } from "next/server";

import { getOrCreateDbUser } from "@/lib/get-or-create-user";
import { prisma } from "@/server/db/client";
import { getByIdForUser, moveToColumn } from "@/server/db/cards";

type RouteContext = { params: { taskId: string } };

export async function PATCH(_req: Request, { params }: RouteContext) {
  const user = await getOrCreateDbUser();
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  // Ensure task belongs to user and load board id
  const task = await getByIdForUser(params.taskId, user.id).catch(() => null);
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

  await moveToColumn(task.id, target.id, user.id);

  return NextResponse.json({ ok: true });
}
