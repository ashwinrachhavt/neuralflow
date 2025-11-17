import { NextResponse } from "next/server";
import { prisma } from "@/server/db/client";
import { getUserOr401 } from "@/lib/api-helpers";

type Ctx = { params: { taskId: string } };

export async function PATCH(_req: Request, { params }: Ctx) {
  const user = await getUserOr401();
  if (!(user as any).id) return user as unknown as NextResponse;

  const task = await prisma.task.findFirst({ where: { id: params.taskId, board: { userId: (user as any).id } }, select: { id: true } });
  if (!task) return NextResponse.json({ message: "Not found" }, { status: 404 });

  const updated = await prisma.task.update({ where: { id: params.taskId }, data: { status: "DONE" } });
  return NextResponse.json({ id: updated.id, status: updated.status });
}
