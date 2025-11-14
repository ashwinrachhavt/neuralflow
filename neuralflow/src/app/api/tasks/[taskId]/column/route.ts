import { NextResponse } from "next/server";

import { getOrCreateDbUser } from "@/lib/get-or-create-user";
import { prisma } from "@/server/db/client";
import { getByIdForUser, moveToColumn } from "@/server/db/cards";

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
  const task = await getByIdForUser(params.taskId, user.id).catch(() => null);
  if (!task) return NextResponse.json({ message: "Not found" }, { status: 404 });

  // Ensure column belongs to user's board
  const column = await prisma.column.findFirst({
    where: { id: columnId, board: { userId: user.id } },
    select: { id: true },
  });
  if (!column) return NextResponse.json({ message: "Invalid column" }, { status: 400 });

  await moveToColumn(params.taskId, columnId, user.id);

  return NextResponse.json({ ok: true });
}
