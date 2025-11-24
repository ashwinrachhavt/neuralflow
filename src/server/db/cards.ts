import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { NotFoundError, ForbiddenError } from "./result";

export async function getByIdForUser(taskId: string, userId: string) {
  const task = await prisma.task.findFirst({ where: { id: taskId, board: { userId } } });
  if (!task) throw new NotFoundError();
  return task;
}

export async function listByBoard(boardId: string) {
  return prisma.task.findMany({ where: { boardId }, orderBy: { createdAt: "asc" } });
}

export async function createForBoard(data: Prisma.TaskCreateInput, tx = prisma) {
  return tx.task.create({ data });
}

export async function updateTitle(taskId: string, title: string, userId: string) {
  const existing = await prisma.task.findFirst({ where: { id: taskId, board: { userId } }, select: { id: true } });
  if (!existing) throw new ForbiddenError();
  return prisma.task.update({ where: { id: taskId }, data: { title } });
}

export async function updateDescription(taskId: string, descriptionMarkdown: string, userId: string) {
  const existing = await prisma.task.findFirst({ where: { id: taskId, board: { userId } }, select: { id: true } });
  if (!existing) throw new ForbiddenError();
  return prisma.task.update({ where: { id: taskId }, data: { descriptionMarkdown } });
}

export async function updatePartial(
  taskId: string,
  data: { title?: string; descriptionMarkdown?: string; priority?: 'LOW'|'MEDIUM'|'HIGH'|null; type?: 'DEEP_WORK'|'SHALLOW_WORK'|'LEARNING'|'SHIP'|'MAINTENANCE'|null; tags?: string[] | null; estimatedPomodoros?: number | null },
  userId: string,
) {
  const existing = await prisma.task.findFirst({ where: { id: taskId, board: { userId } }, select: { id: true } });
  if (!existing) throw new ForbiddenError();
  return prisma.task.update({ where: { id: taskId }, data });
}

export async function moveToColumn(taskId: string, columnId: string, userId: string) {
  const existing = await prisma.task.findFirst({ where: { id: taskId, board: { userId } }, select: { id: true } });
  if (!existing) throw new ForbiddenError();
  return prisma.task.update({ where: { id: taskId }, data: { column: { connect: { id: columnId } } } });
}

export async function deleteForUser(taskId: string, userId: string) {
  const existing = await prisma.task.findFirst({ where: { id: taskId, board: { userId } }, select: { id: true } });
  if (!existing) throw new ForbiddenError();
  return prisma.task.delete({ where: { id: taskId } });
}
