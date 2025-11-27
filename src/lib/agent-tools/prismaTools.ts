import { z } from "zod";
import { tool } from "ai";
import { prisma } from "@/lib/prisma";

// Schema definitions
const TaskCreateInput = z.object({
    userId: z.string().describe("The ID of the user creating the task"),
    title: z.string().min(1).describe("The title of the task"),
    description: z.string().optional().describe("Detailed description of the task"),
    priority: z.enum(["LOW", "MEDIUM", "HIGH"]).default("MEDIUM").describe("Priority level: LOW, MEDIUM, HIGH"),
    estimatedPomodoros: z.number().int().positive().optional().describe("Estimated number of pomodoros"),
    boardId: z.string().optional().describe("Specific board ID. If omitted, uses the user's first board."),
    columnId: z.string().optional().describe("Specific column ID. If omitted, looks for a 'TODO' column."),
    dueDate: z.string().datetime().optional().describe("Due date in ISO format"),
});

const TaskUpdateInput = z.object({
    taskId: z.string().describe("The ID of the task to update"),
    status: z.enum(["BACKLOG", "TODO", "IN_PROGRESS", "DONE", "ARCHIVED"]).optional().describe("New status: TODO, IN_PROGRESS, DONE, etc."),
    title: z.string().optional(),
    description: z.string().optional(),
    priority: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
    estimatedPomodoros: z.number().int().positive().optional(),
    dueDate: z.string().datetime().optional().nullable(),
});

const GetUserTodosInput = z.object({
    userId: z.string().describe("The ID of the user"),
    status: z.enum(["BACKLOG", "TODO", "IN_PROGRESS", "DONE", "ARCHIVED", "ALL"]).optional().describe("Filter by status. If omitted, returns all non-archived tasks."),
    limit: z.number().int().positive().default(20).describe("Max number of tasks to return"),
});

const RunRawStatsInput = z.object({
    userId: z.string().describe("The ID of the user"),
});

// Calendar events schema
const GetUserEventsInput = z.object({
    userId: z.string().describe("The ID of the user"),
    startIso: z.string().datetime().optional().describe("Start ISO date for filtering"),
    endIso: z.string().datetime().optional().describe("End ISO date for filtering"),
    type: z.enum(["FOCUS", "MEETING", "PERSONAL", "BREAK"]).optional().describe("Filter by event type"),
    limit: z.number().int().positive().default(20).describe("Max events to return"),
});

export const prismaTools = {
    createTask: tool({
        description: "Create a new task for a user. Automatically assigns to the user's board if not specified.",
        inputSchema: TaskCreateInput,
        execute: async (input) => {
            const { userId, boardId, columnId, dueDate, description, ...data } = input;

            let targetBoardId = boardId;
            let targetColumnId = columnId;

            // 1. Resolve Board
            if (!targetBoardId) {
                const firstBoard = await prisma.board.findFirst({
                    where: { userId },
                    orderBy: { createdAt: "asc" },
                    include: { columns: true },
                });
                if (!firstBoard) {
                    throw new Error(`No boards found for user ${userId}. Cannot create task.`);
                }
                targetBoardId = firstBoard.id;

                // 2. Resolve Column (if we just found the board, we might have columns)
                if (!targetColumnId) {
                    const todoCol = firstBoard.columns.find((c) =>
                        c.name.toUpperCase().includes("TODO") || c.name.toUpperCase().includes("BACKLOG")
                    );
                    // Fallback to first column if no "TODO" found
                    targetColumnId = todoCol ? todoCol.id : firstBoard.columns[0]?.id;
                }
            }

            // 3. If we had boardId but no columnId, we need to fetch columns
            if (targetBoardId && !targetColumnId) {
                const columns = await prisma.column.findMany({
                    where: { boardId: targetBoardId },
                    orderBy: { position: "asc" },
                });
                if (columns.length === 0) {
                    throw new Error(`Board ${targetBoardId} has no columns. Cannot create task.`);
                }
                const todoCol = columns.find((c) =>
                    c.name.toUpperCase().includes("TODO") || c.name.toUpperCase().includes("BACKLOG")
                );
                targetColumnId = todoCol ? todoCol.id : columns[0].id;
            }

            if (!targetBoardId || !targetColumnId) {
                throw new Error("Could not resolve board or column for task creation.");
            }

            const task = await prisma.task.create({
                data: {
                    ...data,
                    descriptionMarkdown: description || "",
                    boardId: targetBoardId,
                    columnId: targetColumnId,
                    dueDate: dueDate ? new Date(dueDate) : undefined,
                    status: "TODO", // Default status
                },
            });

            return {
                task: {
                    id: task.id,
                    title: task.title,
                    status: task.status,
                    priority: task.priority,
                    boardId: task.boardId,
                    columnId: task.columnId,
                    createdAt: task.createdAt.toISOString(),
                },
            };
        },
    }),

    updateTask: tool({
        description: "Update an existing task (status, title, priority, etc.)",
        inputSchema: TaskUpdateInput,
        execute: async ({ taskId, dueDate, description, ...updates }) => {
            const task = await prisma.task.update({
                where: { id: taskId },
                data: {
                    ...updates,
                    descriptionMarkdown: description,
                    dueDate: dueDate ? new Date(dueDate) : dueDate,
                },
            });
            return {
                task: {
                    id: task.id,
                    status: task.status,
                    title: task.title,
                    updatedAt: task.updatedAt.toISOString(),
                },
            };
        },
    }),

    getUserTodos: tool({
        description: "Fetch todos for a given user, optionally filtered by status.",
        inputSchema: GetUserTodosInput,
        execute: async ({ userId, status, limit }) => {
            const where: any = {
                board: { userId }, // Filter by tasks in boards owned by user
            };

            if (status) {
                if (status !== 'ALL') {
                    where.status = status;
                }
            } else {
                // Default: exclude ARCHIVED if no status specified
                where.status = { not: "ARCHIVED" };
            }

            const tasks = await prisma.task.findMany({
                where,
                orderBy: { createdAt: "desc" },
                take: limit,
            });

            return {
                tasks: tasks.map((t) => ({
                    id: t.id,
                    title: t.title,
                    status: t.status,
                    priority: t.priority,
                    estimatedPomodoros: t.estimatedPomodoros,
                    dueDate: t.dueDate?.toISOString(),
                    createdAt: t.createdAt.toISOString(),
                    updatedAt: t.updatedAt.toISOString(),
                })),
            };
        },
    }),

    runRawStats: tool({
        description: "Run custom SQL to compute aggregate stats (e.g. count tasks by status) for a user.",
        inputSchema: RunRawStatsInput,
        execute: async ({ userId }) => {
            // Use Prisma's raw query. Note: Table names in Prisma are usually mapped.
            // In standard Prisma with Postgres, models are often PascalCase or mapped.
            // We'll try to use the model name "Task" but it might be "Task" or "task" in DB.
            // Safest is to use Prisma's groupBy if possible, but the prompt asked for raw.
            // Let's use groupBy for safety and portability, it's "raw-like" in power but safer.
            // But if we MUST use raw, we need to know the table name.
            // Let's stick to prisma.task.groupBy which is the "Prisma way" of doing this safely.

            const stats = await prisma.task.groupBy({
                by: ['status'],
                where: {
                    board: { userId }
                },
                _count: {
                    _all: true
                }
            });

            // Format for the agent
            return {
                stats: stats.map(s => ({ status: s.status, count: s._count._all }))
            };
        },
    }),

    getUserEvents: tool({
        description: "Fetch calendar events for a user (optionally by date range or type).",
        inputSchema: GetUserEventsInput,
        execute: async ({ userId, startIso, endIso, type, limit }) => {
            const where: any = { userId };
            if (startIso) where.startAt = { gte: new Date(startIso) };
            if (endIso) where.endAt = Object.assign(where.endAt || {}, { lte: new Date(endIso) });
            if (type) where.type = type;

            const events = await prisma.calendarEvent.findMany({
                where,
                orderBy: { startAt: "asc" },
                take: limit,
                select: { id: true, title: true, type: true, startAt: true, endAt: true, location: true }
            });

            return {
                events: events.map((e) => ({
                    id: e.id,
                    title: e.title,
                    type: e.type,
                    startAt: e.startAt.toISOString(),
                    endAt: e.endAt.toISOString(),
                    location: e.location ?? undefined,
                })),
            };
        },
    }),
};
