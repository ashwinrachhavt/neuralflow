import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getUserOr401, readJson } from "@/lib/api-helpers";

type RouteContext = { params: Promise<{ taskId: string }> };

export async function PATCH(req: NextRequest, context: RouteContext) {
  const { taskId } = await context.params;
  const user = await getUserOr401();
  if (!(user as any).id) return user as unknown as NextResponse;

  const body = await readJson<{ projectId?: string | null }>(req);
  const projectId = (body?.projectId as string | null | undefined) ?? null;

  // Ensure task belongs to user
  const task = await prisma.task.findFirst({
    where: { id: taskId, board: { userId: (user as any).id } },
    select: { id: true },
  });
  if (!task) return NextResponse.json({ message: "Not found" }, { status: 404 });

  if (projectId) {
    const project = await prisma.project.findFirst({
      where: { id: projectId, userId: (user as any).id },
      select: { id: true },
    });
    if (!project) return NextResponse.json({ message: "Invalid project" }, { status: 400 });
  }

  await prisma.task.update({ where: { id: taskId }, data: { projectId } });

  return NextResponse.json({ ok: true });
}
