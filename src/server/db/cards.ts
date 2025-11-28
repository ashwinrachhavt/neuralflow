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
  data: { title?: string; descriptionMarkdown?: string; priority?: 'LOW'|'MEDIUM'|'HIGH'; type?: 'DEEP_WORK'|'SHALLOW_WORK'|'LEARNING'|'SHIP'|'MAINTENANCE'; tags?: string[]; estimatedPomodoros?: number | null; dueDate?: Date | null },
  userId: string,
) {
  const existing = await prisma.task.findFirst({ where: { id: taskId, board: { userId } }, select: { id: true } });
  if (!existing) throw new ForbiddenError();
  const updateData: Prisma.TaskUpdateInput = {};
  if (typeof data.title === 'string') updateData.title = data.title;
  if (typeof data.descriptionMarkdown === 'string') updateData.descriptionMarkdown = data.descriptionMarkdown;
  if (data.priority !== undefined) updateData.priority = data.priority as any;
  if (data.type !== undefined) updateData.type = data.type as any;
  if (data.estimatedPomodoros !== undefined) updateData.estimatedPomodoros = data.estimatedPomodoros;
  if (data.tags !== undefined) updateData.tags = { set: data.tags } as any;
  if (data.dueDate !== undefined) updateData.dueDate = data.dueDate as any;
  return prisma.task.update({ where: { id: taskId }, data: updateData });
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
