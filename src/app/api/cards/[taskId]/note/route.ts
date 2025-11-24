import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserOr401 } from "@/lib/api-helpers";

type Ctx = { params: Promise<{ taskId: string }> };

export async function POST(_req: Request, ctx: Ctx) {
  const { taskId } = await ctx.params;
  const user = await getUserOr401();
  if (!(user as any).id) return user as unknown as NextResponse;
  const userId = (user as any).id as string;

  const task = await prisma.task.findFirst({ where: { id: taskId, board: { userId } }, include: { note: true } });
  if (!task) return NextResponse.json({ message: "Not found" }, { status: 404 });

  if (task.note) {
    return NextResponse.json({ noteId: task.note.id });
  }

  const note = await prisma.note.create({
    data: {
      taskId: task.id,
      title: task.title || "Task Note",
      contentJson: "{}",
      contentMarkdown: "",
    },
  });

  return NextResponse.json({ noteId: note.id });
}
