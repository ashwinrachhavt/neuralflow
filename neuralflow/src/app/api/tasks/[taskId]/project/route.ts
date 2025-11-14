import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getOrCreateDbUser } from "@/lib/get-or-create-user";

type RouteContext = { params: { taskId: string } };

export async function PATCH(req: Request, { params }: RouteContext) {
  const user = await getOrCreateDbUser();
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const projectId = (body?.projectId as string | null | undefined) ?? null;

  // Ensure task belongs to user
  const task = await prisma.task.findFirst({
    where: { id: params.taskId, board: { userId: user.id } },
    select: { id: true },
  });
  if (!task) return NextResponse.json({ message: "Not found" }, { status: 404 });

  if (projectId) {
    const project = await prisma.project.findFirst({
      where: { id: projectId, userId: user.id },
      select: { id: true },
    });
    if (!project) return NextResponse.json({ message: "Invalid project" }, { status: 400 });
  }

  await prisma.task.update({ where: { id: params.taskId }, data: { projectId } });

  return NextResponse.json({ ok: true });
}

