import { NextResponse } from "next/server";
import { prisma } from "@/server/db/client";
import { getUserOr401, readJson } from "@/lib/api-helpers";

type Ctx = { params: { taskId: string } };

export async function PATCH(req: Request, { params }: Ctx) {
  const user = await getUserOr401();
  if (!(user as any).id) return user as unknown as NextResponse;

  const body = await readJson<{ columnId?: string }>(req);
  const columnId = (body?.columnId as string | undefined)?.trim();
  if (!columnId) return NextResponse.json({ message: "columnId required" }, { status: 400 });

  const task = await prisma.task.findFirst({ where: { id: params.taskId, board: { userId: (user as any).id } }, select: { id: true, boardId: true } });
  if (!task) return NextResponse.json({ message: "Not found" }, { status: 404 });

  const col = await prisma.column.findFirst({ where: { id: columnId, boardId: task.boardId }, select: { id: true } });
  if (!col) return NextResponse.json({ message: "Invalid column" }, { status: 400 });

  await prisma.task.update({ where: { id: params.taskId }, data: { columnId } });
  return NextResponse.json({ ok: true });
}
