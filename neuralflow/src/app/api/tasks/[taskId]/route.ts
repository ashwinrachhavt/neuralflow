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
  const title = (body?.title as string | undefined)?.trim();
  if (!title) {
    return NextResponse.json({ message: "title is required" }, { status: 400 });
  }

  const task = await prisma.task.findFirst({
    where: { id: params.taskId, board: { userId: user.id } },
    select: { id: true },
  });
  if (!task) {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }

  const updated = await prisma.task.update({
    where: { id: params.taskId },
    data: { title },
    select: { id: true, title: true },
  });

  return NextResponse.json(updated);
}

