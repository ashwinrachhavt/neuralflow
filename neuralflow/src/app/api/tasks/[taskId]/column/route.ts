import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getOrCreateDbUser } from "@/lib/get-or-create-user";

type RouteContext = { params: { taskId: string } };

export async function PATCH(req: Request, { params }: RouteContext) {
  const user = await getOrCreateDbUser();
  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const columnId = (body?.columnId as string | undefined)?.trim();
  if (!columnId) {
    return NextResponse.json({ message: "columnId is required" }, { status: 400 });
  }

  // Ensure task belongs to user
  const task = await prisma.task.findFirst({
    where: { id: params.taskId, board: { userId: user.id } },
    select: { id: true },
  });
  if (!task) return NextResponse.json({ message: "Not found" }, { status: 404 });

  // Ensure column belongs to user's board
  const column = await prisma.column.findFirst({
    where: { id: columnId, board: { userId: user.id } },
    select: { id: true },
  });
  if (!column) return NextResponse.json({ message: "Invalid column" }, { status: 400 });

  await prisma.task.update({ where: { id: params.taskId }, data: { columnId } });

  return NextResponse.json({ ok: true });
}

