"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

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
import { Plus, Wand2, Tag, Lightbulb, FileText, GraduationCap, MoveRight } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useMoveCard, useCreateCard, useBoard } from "@/hooks/api";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { queryKeys } from "@/lib/queryClient";
import { CardSheet } from "@/components/cards/CardSheet";
import { NewCardModal } from "@/components/cards/NewCardModal";

function ActionButton({
  title,
  onClick,
  children,
}: {
  title: string;
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      className="inline-flex items-center justify-center rounded p-1 text-xs text-muted-foreground hover:text-foreground"
      onClick={onClick}
      title={title}
      aria-label={title}
    >
      {children}
    </button>
  );
}

type Task = {
  id: string;
  title: string;
  description?: string;
  tag?: string;
  // AI suggestion fields (optional)
  aiSuggestedColumnId?: string | null;
  aiSuggestedPriority?: 'LOW' | 'MEDIUM' | 'HIGH' | null;
  aiSuggestedEstimateMin?: number | null;
  aiNextAction?: string | null;
  aiState?: 'RAW' | 'CLASSIFIED' | 'ENRICHED' | 'SUGGESTED' | 'COMPLETED' | null;
  aiConfidence?: number | null;
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

const INITIAL_BOARD: BoardState = { tasks: {}, columns: {}, columnOrder: [] };

export function KanbanBoard({ boardId }: { boardId: string }) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { data, isLoading } = useBoard(boardId);

  const [board, setBoard] = useState<BoardState>(INITIAL_BOARD);
  const [openTaskId, setOpenTaskId] = useState<string | null>(null); // fallback when routing not available

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
        aiSuggestedColumnId: (t as any).aiSuggestedColumnId ?? null,
        aiSuggestedPriority: (t as any).aiSuggestedPriority ?? null,
        aiSuggestedEstimateMin: (t as any).aiSuggestedEstimateMin ?? null,
        aiNextAction: (t as any).aiNextAction ?? null,
        aiState: (t as any).aiState ?? null,
        aiConfidence: (t as any).aiConfidence ?? null,
      };
    }

    setBoard({ tasks: taskMap, columns, columnOrder });
  }, [data]);
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
  );

  const moveMutation = useMoveCard(boardId);
  const createCard = useCreateCard();

  async function ensureNote(taskId: string): Promise<string> {
    const res = await fetch(`/api/cards/${taskId}/note`, { method: "POST" });
    if (!res.ok) throw new Error("Unable to initialize note");
    const data = (await res.json()) as { noteId: string };
    return data.noteId;
  }

  const enrichTask = useMutation({
    mutationFn: async (taskId: string) => {
      const res = await fetch(`/api/ai/cards/${taskId}/enrich`, { method: "POST" });
      if (!res.ok) throw new Error("Unable to enrich task");
      return (await res.json()) as { descriptionMarkdown: string };
    },
    onSuccess: async () => {
      toast.success("Description enriched");
      await queryClient.invalidateQueries({ queryKey: queryKeys.board(boardId) });
    },
    onError: () => toast.error("Failed to enrich"),
  });

  const classifyTask = useMutation({
    mutationFn: async (taskId: string) => {
      const res = await fetch(`/api/ai/cards/${taskId}/classify`, { method: "POST" });
      if (!res.ok) throw new Error("Unable to classify task");
      return (await res.json()) as { suggestedColumnId: string; suggestedPriority: 'LOW' | 'MEDIUM' | 'HIGH'; suggestedEstimateMin: number; confidence: number };
    },
    onSuccess: async (data) => {
      toast.success(`AI classified • ${Math.round((data.confidence ?? 0) * 100)}% confidence`, { description: `${data.suggestedPriority} • ≈ ${data.suggestedEstimateMin} min` });
      await queryClient.invalidateQueries({ queryKey: queryKeys.board(boardId) });
    },
    onError: () => toast.error("Failed to classify"),
  });

  const suggestTask = useMutation({
    mutationFn: async (taskId: string) => {
      const res = await fetch(`/api/ai/cards/${taskId}/suggest`, { method: "POST" });
      if (!res.ok) throw new Error("Unable to suggest next action");
      return (await res.json()) as { nextAction: string; shouldMove: boolean; suggestedColumnId: string | null; confidence: number };
    },
    onSuccess: async (data) => {
      toast.info(`Next: ${data.nextAction}`, { description: `${Math.round((data.confidence ?? 0) * 100)}% confidence${data.shouldMove ? ' • suggests move' : ''}` });
      await queryClient.invalidateQueries({ queryKey: queryKeys.board(boardId) });
    },
    onError: () => toast.error("Failed to suggest"),
  });

  const autoMove = useMutation({
    mutationFn: async (taskId: string) => {
      const res = await fetch(`/api/ai/cards/${taskId}/auto-move`, { method: "POST" });
      if (!res.ok) throw new Error("Unable to auto-move");
      return (await res.json()) as { move: boolean; targetColumnId: string | null };
    },
    onSuccess: async (data) => {
      if (data.move && data.targetColumnId) toast.success("Card moved by AI"); else toast.message("No move suggested");
      await queryClient.invalidateQueries({ queryKey: queryKeys.board(boardId) });
    },
    onError: () => toast.error("Failed to auto-move"),
  });

  const summarizeNote = useMutation({
    mutationFn: async (taskId: string) => {
      const noteId = await ensureNote(taskId);
      const res = await fetch(`/api/ai/notes/${noteId}/summary`, { method: "POST" });
      if (!res.ok) throw new Error("Unable to summarize note");
      return (await res.json()) as { summary: string; bullets: string[] };
    },
    onSuccess: (data) => {
      toast.info(`Summary: ${data.summary}`, { description: `${data.bullets.length} bullets generated` });
    },
    onError: () => toast.error("Failed to summarize note"),
  });

  const quizFromNote = useMutation({
    mutationFn: async (taskId: string) => {
      const noteId = await ensureNote(taskId);
      const res = await fetch(`/api/ai/notes/${noteId}/quiz`, { method: "POST" });
      if (!res.ok) throw new Error("Unable to create quiz");
      return (await res.json()) as { deckId: string; createdCards: number; quizId: string; questions: number };
    },
    onSuccess: (data) => {
      toast.success(`Created ${data.createdCards} cards • ${data.questions} questions`, { description: `Deck ${data.deckId} • Quiz ${data.quizId}` });
    },
    onError: () => toast.error("Failed to create quiz"),
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

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="flex flex-col gap-6">
        <div className="flex flex-nowrap gap-4 overflow-x-auto pb-4">
          {isLoading ? (
            <>
              {[0, 1, 2].map(i => (
                <Card key={i} className="flex w-full max-w-xs flex-1 flex-col bg-card/60 backdrop-blur-md">
                  <CardHeader>
                    <Skeleton className="h-5 w-32" />
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {[0, 1, 2].map(j => (
                      <div key={j} className="rounded-xl border border-border bg-background/90 p-4">
                        <Skeleton className="h-4 w-40" />
                        <div className="mt-2 space-y-2">
                          <Skeleton className="h-3 w-56" />
                          <Skeleton className="h-3 w-48" />
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ))}
            </>
          ) : null}
          {!isLoading && board.columnOrder.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border/60 p-6 text-sm text-muted-foreground">
              No columns yet. Create a board or add a column.
            </div>
          ) : null}
          {board.columnOrder.map(columnId => (
            <KanbanColumn
              key={columnId}
              column={board.columns[columnId]}
              tasks={board.tasks}
              onEnrich={(taskId) => enrichTask.mutate(taskId)}
              onSummary={(taskId) => summarizeNote.mutate(taskId)}
              onQuiz={(taskId) => quizFromNote.mutate(taskId)}
              onClassify={(taskId) => classifyTask.mutate(taskId)}
              onSuggest={(taskId) => suggestTask.mutate(taskId)}
              onAutoMove={(taskId) => autoMove.mutate(taskId)}
              onOpen={(taskId) => {
                try { router.push(`/boards/${boardId}/tasks/${taskId}`); } catch { setOpenTaskId(taskId); }
              }}
              openTaskId={openTaskId}
              onCreateCard={async (colId, title, description) => {
                try {
                  const res = await createCard.mutateAsync({ boardId, columnId: colId, title, descriptionMarkdown: description });
                  const newId = (res as any)?.id as string | undefined;
                  if (newId) {
                    // Optimistically inject into local board so shared-element animation has a source
                    setBoard(current => {
                      if (!current.columns[colId]) return current;
                      const next = { ...current, tasks: { ...current.tasks }, columns: { ...current.columns } };
                      next.tasks[newId] = { id: newId, title, description: description ?? '', aiSuggestedColumnId: null, aiSuggestedPriority: null, aiSuggestedEstimateMin: null, aiNextAction: null, aiState: null, aiConfidence: null };
                      next.columns[colId] = { ...next.columns[colId], taskIds: [...next.columns[colId].taskIds, newId] };
                      return next;
                    });
                    // Defer opening to next frame so the tile is present for layoutId animation
                    requestAnimationFrame(() => setOpenTaskId(newId));
                  }
                } catch {
                  // ignore — toast handled by hook onError if needed
                } finally {
                  // ensure board refresh
                  await queryClient.invalidateQueries({ queryKey: queryKeys.board(boardId) });
                }
              }}
            />
          ))}
        </div>
      </div>
      {openTaskId ? (
        <CardSheet taskId={openTaskId} open={true} onClose={() => setOpenTaskId(null)} onOpenFull={(id) => (window.location.href = `/tasks/${id}`)} />
      ) : null}
    </DndContext>
  );
}

type KanbanColumnProps = {
  column: Column;
  tasks: Record<string, Task>;
  onEnrich: (taskId: string) => void;
  onSummary: (taskId: string) => void;
  onQuiz: (taskId: string) => void;
  onClassify: (taskId: string) => void;
  onSuggest: (taskId: string) => void;
  onAutoMove: (taskId: string) => void;
  onOpen: (taskId: string) => void;
  onCreateCard: (columnId: string, title: string, description?: string) => void;
  openTaskId?: string | null;
  onApplyMove?: (taskId: string, targetColumnId: string) => void;
};

function KanbanColumn({ column, tasks, onEnrich, onSummary, onQuiz, onCreateCard, onClassify, onSuggest, onAutoMove, onOpen, openTaskId, onApplyMove }: KanbanColumnProps) {
  const [newOpen, setNewOpen] = useState(false);
  return (
    <Card className="flex w-full max-w-xs flex-1 flex-col bg-card/60 backdrop-blur-md">
      <CardHeader className="py-3">
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
          <Button variant="ghost" size="icon" className="size-8" onClick={() => setNewOpen(true)}>
            <Plus className="size-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        <ColumnSortableArea columnId={column.id} taskIds={column.taskIds}>
          {column.taskIds.length === 0 ? (
            <EmptyColumnHint />
          ) : (
            column.taskIds.map(taskId => (
              <SortableTask key={taskId} task={tasks[taskId]} columnId={column.id} onEnrich={onEnrich} onSummary={onSummary} onQuiz={onQuiz} onClassify={onClassify} onSuggest={onSuggest} onAutoMove={onAutoMove} onOpen={onOpen} openTaskId={openTaskId} onApplyMove={onApplyMove} />
            ))
          )}
        </ColumnSortableArea>
      </CardContent>
      <NewCardModal open={newOpen} onClose={() => setNewOpen(false)} onSubmit={(t, d) => onCreateCard(column.id, t, d)} />
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
          "flex min-h-[120px] flex-col gap-2",
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
  onEnrich: (taskId: string) => void;
  onSummary: (taskId: string) => void;
  onQuiz: (taskId: string) => void;
  onClassify: (taskId: string) => void;
  onSuggest: (taskId: string) => void;
  onAutoMove: (taskId: string) => void;
  onOpen: (taskId: string) => void;
  openTaskId?: string | null;
  onApplyMove?: (taskId: string, targetColumnId: string) => void;
};

function SortableTask({ task, columnId, onEnrich, onSummary, onQuiz, onClassify, onSuggest, onAutoMove, onOpen, openTaskId, onApplyMove }: SortableTaskProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({
      id: task.id,
      data: { type: "task", columnId },
    });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  } satisfies React.CSSProperties;

  const isOpened = openTaskId === task.id;
  return (
    <motion.div
      layoutId={`card-${task.id}`}
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        "rounded-lg border border-border bg-background/90 p-3 text-left shadow-sm",
        isDragging && "opacity-60",
        isOpened && "invisible",
      )}
      onClick={(e) => {
        // Ignore clicks originating from action buttons
        const target = e.target as HTMLElement;
        if (target.closest('button')) return;
        onOpen(task.id);
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <motion.h3 layoutId={`card-title-${task.id}`} className="font-medium text-sm break-words leading-tight line-clamp-2">
          {task.title}
        </motion.h3>
        <div className="flex items-center gap-1.5">
          <ActionButton title="AI: Enrich" onClick={(e) => { e.stopPropagation(); onEnrich(task.id); }}>
            <Wand2 className="size-4" />
          </ActionButton>
          <ActionButton title="AI: Classify" onClick={(e) => { e.stopPropagation(); onClassify(task.id); }}>
            <Tag className="size-4" />
          </ActionButton>
          <ActionButton title="AI: Suggest next action" onClick={(e) => { e.stopPropagation(); onSuggest(task.id); }}>
            <Lightbulb className="size-4" />
          </ActionButton>
          <ActionButton title="AI: Summary" onClick={(e) => { e.stopPropagation(); onSummary(task.id); }}>
            <FileText className="size-4" />
          </ActionButton>
          <ActionButton title="AI: Quiz" onClick={(e) => { e.stopPropagation(); onQuiz(task.id); }}>
            <GraduationCap className="size-4" />
          </ActionButton>
          <ActionButton title="AI: Auto-move" onClick={(e) => { e.stopPropagation(); onAutoMove(task.id); }}>
            <MoveRight className="size-4" />
          </ActionButton>
        </div>
      </div>
      {task.aiNextAction ? (
        <p className="mt-2 text-xs text-primary/90 break-words leading-snug line-clamp-1">Next: {task.aiNextAction}</p>
      ) : null}
      {task.description ? (
        <p className="mt-2 text-xs text-muted-foreground leading-relaxed break-words whitespace-pre-wrap line-clamp-3">
          {task.description}
        </p>
      ) : null}
      {(task.aiSuggestedPriority || task.aiSuggestedEstimateMin || task.aiSuggestedColumnId) ? (
        <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[10px] text-muted-foreground">
          {task.aiSuggestedPriority ? (
            <span className="rounded px-2 py-0.5 bg-amber-500/10 text-amber-700 dark:text-amber-300">AI: {task.aiSuggestedPriority}</span>
          ) : null}
          {task.aiSuggestedEstimateMin ? (
            <span className="rounded bg-muted px-2 py-0.5 text-foreground/80">≈ {task.aiSuggestedEstimateMin}m</span>
          ) : null}
          {task.aiSuggestedColumnId && task.aiSuggestedColumnId !== columnId ? (
            <>
              <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-emerald-700 dark:text-emerald-300">→ suggested move</span>
              {onApplyMove ? (
                <button
                  type="button"
                  className="rounded bg-emerald-600/10 px-2 py-0.5 text-emerald-700 hover:bg-emerald-600/20 dark:text-emerald-300"
                  onClick={(e) => { e.stopPropagation(); onApplyMove(task.id, task.aiSuggestedColumnId!); }}
                >Apply</button>
              ) : null}
            </>
          ) : null}
          {typeof task.aiConfidence === 'number' ? (
            <span className="rounded bg-indigo-500/10 px-2 py-0.5 text-indigo-700 dark:text-indigo-300">{Math.round(task.aiConfidence * 100)}%</span>
          ) : null}
        </div>
      ) : null}
    </motion.div>
  );
}

function EmptyColumnHint() {
  return (
    <div className="rounded-lg border border-dashed border-border/60 p-4 text-center text-xs text-muted-foreground">
      No tasks yet. Drop tasks here.
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
