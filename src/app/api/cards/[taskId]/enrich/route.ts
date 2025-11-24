import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserOr401 } from "@/lib/api-helpers";

type Ctx = { params: Promise<{ taskId: string }> };

export async function POST(_req: Request, ctx: Ctx) {
  const { taskId } = await ctx.params;
  const user = await getUserOr401();
  if (!(user as any).id) return user as unknown as NextResponse;

  const task = await prisma.task.findFirst({ where: { id: taskId, board: { userId: (user as any).id } } });
  if (!task) return NextResponse.json({ message: "Not found" }, { status: 404 });

  const descriptionMarkdown = task.descriptionMarkdown?.trim() || "";
  const appended = descriptionMarkdown
    ? descriptionMarkdown + "\n\n— Enriched details added."
    : "Enriched details added.";

  await prisma.task.update({ where: { id: task.id }, data: { descriptionMarkdown: appended } });
  return NextResponse.json({ descriptionMarkdown: appended });
}
