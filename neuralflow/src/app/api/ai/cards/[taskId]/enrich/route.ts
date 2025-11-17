import { NextResponse } from "next/server";
import { prisma } from "@/server/db/client";
import { getUserOr401 } from "@/lib/api-helpers";

type Ctx = { params: { taskId: string } };

export async function POST(_req: Request, { params }: Ctx) {
  const user = await getUserOr401();
  if (!(user as any).id) return user as unknown as NextResponse;
  const task = await prisma.task.findFirst({ where: { id: params.taskId, board: { userId: (user as any).id } } });
  if (!task) return NextResponse.json({ message: "Not found" }, { status: 404 });
  const appended = (task.descriptionMarkdown?.trim() || "") + (task.descriptionMarkdown ? "\n\n" : "") + "AI: summarized scope, risks, and next steps.";
  await prisma.task.update({ where: { id: task.id }, data: { descriptionMarkdown: appended } });
  return NextResponse.json({ descriptionMarkdown: appended });
}
