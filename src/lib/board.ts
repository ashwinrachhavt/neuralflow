import { prisma } from "@/lib/prisma";

export async function getOrCreateDefaultBoard(userId: string) {
  const existing = await prisma.board.findFirst({
    where: { userId },
    include: { columns: { orderBy: { position: "asc" } } },
    orderBy: { createdAt: "asc" },
  });
  if (existing && existing.columns.length > 0) return existing;

  const created = await prisma.board.create({
    data: {
      userId,
      title: "Personal Kanban",
      description: "Auto-created",
      columns: {
        create: [
          { name: "Backlog", position: 0 },
          { name: "Todo", position: 1 },
          { name: "In Progress", position: 2 },
          { name: "Done", position: 3 },
        ],
      },
    },
    include: { columns: { orderBy: { position: "asc" } } },
  });
  return created;
}

