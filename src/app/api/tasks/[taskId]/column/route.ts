import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserOr401, readJson } from "@/lib/api-helpers";

type Ctx = { params: Promise<{ taskId: string }> };

export async function PATCH(req: Request, ctx: Ctx) {
  const { taskId } = await ctx.params;
  const user = await getUserOr401();
  if (!(user as any).id) return user as unknown as NextResponse;

  const body = await readJson<{ columnId?: string }>(req);
  const columnId = (body?.columnId as string | undefined)?.trim();
  if (!columnId) return NextResponse.json({ message: "columnId required" }, { status: 400 });

  const task = await prisma.task.findFirst({ where: { id: taskId, board: { userId: (user as any).id } }, select: { id: true, boardId: true } });
  if (!task) return NextResponse.json({ message: "Not found" }, { status: 404 });

  const col = await prisma.column.findFirst({ where: { id: columnId, boardId: task.boardId }, select: { id: true, name: true } });
  if (!col) return NextResponse.json({ message: "Invalid column" }, { status: 400 });

  // Best-effort status sync based on column name; keeps single source of truth for lanes
  let statusUpdate: any = undefined;
  const name = (col.name ?? '').toLowerCase();
  if (name.includes('backlog')) statusUpdate = 'BACKLOG';
  else if (name === 'todo' || name.includes('todo')) statusUpdate = 'TODO';
  else if (name.includes('progress')) statusUpdate = 'IN_PROGRESS';
  else if (name.includes('done')) statusUpdate = 'DONE';
  else if (name.includes('hidden') || name.includes('archive')) statusUpdate = 'DONE'; // hide done but keep status tracking

  await prisma.task.update({ where: { id: taskId }, data: { columnId, ...(statusUpdate ? { status: statusUpdate } : {}) } });
  return NextResponse.json({ ok: true, columnId, status: statusUpdate });
}
