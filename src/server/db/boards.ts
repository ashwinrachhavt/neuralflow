import { prisma } from "@/lib/prisma";
import type { Board } from "@prisma/client";
import { Result, ok, err, NotFoundError } from "./result";

export async function getOrCreateDefaultBoard(userId: string): Promise<Result<Board & { columns: { id: string; name: string; position: number }[] }>> {
  try {
    const existing = await prisma.board.findFirst({
      where: { userId },
      include: { columns: { orderBy: { position: "asc" }, select: { id: true, name: true, position: true } } },
      orderBy: { createdAt: "asc" },
    });
    if (existing && existing.columns.length > 0) return ok(existing);

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
      include: { columns: { orderBy: { position: "asc" }, select: { id: true, name: true, position: true } } },
    });
    return ok(created);
  } catch (e: any) {
    return err(e);
  }
}

export async function getBoardColumns(boardId: string) {
  const columns = await prisma.column.findMany({ where: { boardId }, orderBy: { position: "asc" }, select: { id: true, name: true, position: true } });
  if (!columns.length) throw new NotFoundError("No columns for board");
  return columns;
}
