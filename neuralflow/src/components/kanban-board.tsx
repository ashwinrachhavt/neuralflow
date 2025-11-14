"use client";

import { useEffect, useMemo, useState } from "react";

import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Loader2, Plus } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Task = {
  id: string;
  title: string;
  description?: string;
  tag?: string;
};

type Column = {
  id: string;
  title: string;
  description?: string;
  taskIds: string[];
};

type BoardState = {
  tasks: Record<string, Task>;
  columns: Record<string, Column>;
  columnOrder: string[];
};

const INITIAL_BOARD: BoardState = {
  tasks: {
    "task-1": {
      id: "task-1",
      title: "Outline experiment brief",
      description: "Clarify success criteria for the new NeuralFlow feature.",
      tag: "Planning",
    },
    "task-2": {
      id: "task-2",
      title: "Design prompt flows",
      description: "Draft multi-turn prompt templates for the demo.",
      tag: "Design",
    },
    "task-3": {
      id: "task-3",
      title: "Hook up vector store",
      description: "Connect Pinecone and seed with curated knowledge base.",
      tag: "Build",
    },
    "task-4": {
      id: "task-4",
      title: "Prep user test",
      description: "Collect scenarios + schedule first feedback session.",
      tag: "Research",
    },
  },
  columns: {
    "column-todo": {
      id: "column-todo",
      title: "Backlog",
      description: "Ideas and tasks waiting for prioritisation.",
      taskIds: ["task-1", "task-2"],
    },
    "column-progress": {
      id: "column-progress",
      title: "In Progress",
      description: "Active focus items for the current sprint.",
      taskIds: ["task-3"],
    },
    "column-done": {
      id: "column-done",
      title: "Complete",
      description: "Wrapped up and ready to share.",
      taskIds: ["task-4"],
    },
  },
  columnOrder: ["column-todo", "column-progress", "column-done"],
};

type ApiBoard = {
  board: {
    id: string;
    title: string;
    columnOrder: string[];
    columns: Record<string, { id: string; name: string; position: number; taskIds: string[] }>;
    tasks: Record<string, { id: string; title: string; descriptionMarkdown: string | null; columnId: string; priority?: string | null }>;
  };
};

export function KanbanBoard() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery<ApiBoard>({
    queryKey: ["board"],
    queryFn: async () => {
      const res = await fetch("/api/board");
      if (!res.ok) throw new Error("Failed to load board");
      return (await res.json()) as ApiBoard;
    },
    staleTime: 5_000,
  });

  const [board, setBoard] = useState<BoardState>(INITIAL_BOARD);

  // Hydrate board from API
  useEffect(() => {
    if (!data) return;
    const { columns: apiColumns, columnOrder, tasks: apiTasks } = data.board;

    const columns: Record<string, Column> = {};
    for (const columnId of columnOrder) {
      const c = apiColumns[columnId];
      if (!c) continue;
      columns[columnId] = {
        id: c.id,
        title: c.name,
        description: undefined,
        taskIds: c.taskIds.slice(),
      };
    }

    const taskMap: Record<string, Task> = {};
    for (const t of Object.values(apiTasks)) {
      taskMap[t.id] = {
        id: t.id,
        title: t.title,
        description: t.descriptionMarkdown ?? undefined,
      };
    }

    setBoard({ tasks: taskMap, columns, columnOrder });
  }, [data]);
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
  );

  const moveMutation = useMutation({
    mutationFn: async ({ taskId, columnId }: { taskId: string; columnId: string }) => {
      const res = await fetch(`/api/tasks/${taskId}/column`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ columnId }),
      });
      if (!res.ok) throw new Error("Failed to move task");
      return (await res.json()) as { ok: boolean };
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["board"], exact: true });
    },
  });

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over) return;

    const activeTaskId = active.id.toString();
    const overId = over.id.toString();

    const sourceColumnId = findColumnId(board, activeTaskId);
    const destinationColumnId = findColumnId(board, overId) ?? overId;

    if (!sourceColumnId || !destinationColumnId) return;

    if (over.data.current?.type === "column" && overId !== sourceColumnId) {
      moveTaskToColumn(board, setBoard, activeTaskId, sourceColumnId, {
        columnId: destinationColumnId,
        index: board.columns[destinationColumnId].taskIds.length,
      });
      if (destinationColumnId !== sourceColumnId) {
        moveMutation.mutate({ taskId: activeTaskId, columnId: destinationColumnId });
      }
      return;
    }

    const destinationIndex = board.columns[destinationColumnId].taskIds.indexOf(
      overId,
    );

    moveTaskToColumn(board, setBoard, activeTaskId, sourceColumnId, {
      columnId: destinationColumnId,
      index: destinationIndex,
    });

    if (destinationColumnId !== sourceColumnId) {
      moveMutation.mutate({ taskId: activeTaskId, columnId: destinationColumnId });
    }
  };

  const addTask = (_columnId: string) => {
    // Intentionally disabled until a create-task API is added.
    // Kept for UI parity.
  };

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap gap-4">
          {isLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" /> Loading board…
            </div>
          ) : null}
          {board.columnOrder.map(columnId => (
            <KanbanColumn
              key={columnId}
              column={board.columns[columnId]}
              tasks={board.tasks}
              onAddTask={() => addTask(columnId)}
            />
          ))}
        </div>
      </div>
    </DndContext>
  );
}

type KanbanColumnProps = {
  column: Column;
  tasks: Record<string, Task>;
  onAddTask: () => void;
};

function KanbanColumn({ column, tasks, onAddTask }: KanbanColumnProps) {
  return (
    <Card className="flex w-full max-w-xs flex-1 flex-col bg-card/60 backdrop-blur-md">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold">
              {column.title}
            </CardTitle>
            {column.description ? (
              <CardDescription className="mt-1 text-xs text-muted-foreground">
                {column.description}
              </CardDescription>
            ) : null}
          </div>
          <Button variant="ghost" size="icon" className="size-8" onClick={onAddTask} disabled>
            <Plus className="size-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <ColumnSortableArea columnId={column.id} taskIds={column.taskIds}>
          {column.taskIds.length === 0 ? (
            <EmptyColumnHint />
          ) : (
            column.taskIds.map(taskId => (
              <SortableTask key={taskId} task={tasks[taskId]} columnId={column.id} />
            ))
          )}
        </ColumnSortableArea>
      </CardContent>
    </Card>
  );
}

type ColumnSortableAreaProps = {
  columnId: string;
  taskIds: string[];
  children: React.ReactNode;
};

function ColumnSortableArea({ columnId, taskIds, children }: ColumnSortableAreaProps) {
  const { isOver, setNodeRef } = useDroppable({
    id: columnId,
    data: { type: "column", columnId },
  });

  return (
    <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
      <div
        ref={setNodeRef}
        className={cn(
          "flex min-h-[120px] flex-col gap-3",
          isOver && "rounded-lg border border-dashed border-primary/40 bg-primary/5",
        )}
        data-column-id={columnId}
      >
        {children}
      </div>
    </SortableContext>
  );
}

type SortableTaskProps = {
  task: Task;
  columnId: string;
};

function SortableTask({ task, columnId }: SortableTaskProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({
      id: task.id,
      data: { type: "task", columnId },
    });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  } satisfies React.CSSProperties;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        "rounded-xl border border-border bg-background/90 p-4 text-left shadow-sm",
        isDragging && "opacity-60",
      )}
    >
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-sm">{task.title}</h3>
        {task.tag ? (
          <Badge variant="secondary" className="text-[0.65rem] font-medium">
            {task.tag}
          </Badge>
        ) : null}
      </div>
      {task.description ? (
        <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
          {task.description}
        </p>
      ) : null}
    </div>
  );
}

function EmptyColumnHint() {
  return (
    <div className="rounded-lg border border-dashed border-border/60 p-4 text-center text-xs text-muted-foreground">
      Drop tasks here
    </div>
  );
}

function findColumnId(board: BoardState, taskOrColumnId: string) {
  if (board.columns[taskOrColumnId]) {
    return taskOrColumnId;
  }

  return board.columnOrder.find(columnId =>
    board.columns[columnId].taskIds.includes(taskOrColumnId),
  );
}

type MoveTaskOptions = {
  columnId: string;
  index: number;
};

function moveTaskToColumn(
  board: BoardState,
  setBoard: React.Dispatch<React.SetStateAction<BoardState>>,
  taskId: string,
  fromColumnId: string,
  { columnId: toColumnId, index }: MoveTaskOptions,
) {
  setBoard(current => {
    const sourceColumn = current.columns[fromColumnId];
    const destinationColumn = current.columns[toColumnId];

    const isSameColumn = fromColumnId === toColumnId;

    if (isSameColumn) {
      const fromTasks = sourceColumn.taskIds;
      const oldIndex = fromTasks.indexOf(taskId);
      if (oldIndex === -1) {
        return current;
      }

      const targetIndex = index >= 0 ? index : fromTasks.length - 1;
      if (oldIndex === targetIndex) {
        return current;
      }

      const reordered = arrayMove(fromTasks, oldIndex, targetIndex);

      return {
        ...current,
        columns: {
          ...current.columns,
          [fromColumnId]: {
            ...sourceColumn,
            taskIds: reordered,
          },
        },
      };
    }

    const sourceTaskIds = sourceColumn.taskIds.filter(id => id !== taskId);
    const destinationTaskIds = destinationColumn.taskIds.slice();

    const nextIndex = index >= 0 ? index : destinationTaskIds.length;
    const insertIndex = Math.min(nextIndex, destinationTaskIds.length);

    destinationTaskIds.splice(insertIndex, 0, taskId);

    return {
      ...current,
      columns: {
        ...current.columns,
        [fromColumnId]: {
          ...sourceColumn,
          taskIds: sourceTaskIds,
        },
        [toColumnId]: {
          ...destinationColumn,
          taskIds: destinationTaskIds,
        },
      },
    };
  });
}
