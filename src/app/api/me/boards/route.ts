import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserOr401 } from "@/lib/api-helpers";

export async function GET() {
  const user = await getUserOr401();
  if (!(user as any).id) return user as unknown as NextResponse;
  const userId = (user as any).id as string;

  const boards = await prisma.board.findMany({
    where: { userId },
    orderBy: { createdAt: 'asc' },
    include: {
      columns: {
        orderBy: { position: 'asc' },
        select: { id: true, name: true, position: true },
      },
      tasks: {
        orderBy: { createdAt: 'desc' },
        take: 50,
        select: {
          id: true,
          title: true,
          descriptionMarkdown: true,
          status: true,
          priority: true,
          type: true,
          columnId: true,
          projectId: true,
          docId: true,
          tags: true,
          topics: true,
          primaryTopic: true,
          estimatedPomodoros: true,
          dueDate: true,
          createdAt: true,
          updatedAt: true,
        },
      },
    },
  });

  return NextResponse.json({ boards });
}
