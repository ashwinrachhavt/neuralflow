"use client";

import { useEffect, useState, memo } from "react";
import { motion } from "framer-motion";

import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  PointerSensor,
  DragOverlay,
  defaultDropAnimationSideEffects,
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
import { Plus, Wand2, Tag, FileText } from "lucide-react";
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
import { useGamification } from "@/components/gamification/GamificationOverlay";

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
  priority?: 'LOW'|'MEDIUM'|'HIGH'|null;
  type?: 'DEEP_WORK'|'SHALLOW_WORK'|'LEARNING'|'SHIP'|'MAINTENANCE'|null;
  tags?: string[] | null;
  topics?: string[] | null;
  primaryTopic?: string | null;
  dueDate?: string | null;
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
  const { triggerAction } = useGamification();

  const [board, setBoard] = useState<BoardState>(INITIAL_BOARD);
  const [openTaskId, setOpenTaskId] = useState<string | null>(null); // fallback when routing not available
  const [showHidden, setShowHidden] = useState(false);
  const [standardEnsured, setStandardEnsured] = useState(false);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);

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
        dueDate: (t as any).dueDate ?? null,
        priority: (t as any).priority ?? null,
        type: (t as any).type ?? null,
        tags: (t as any).tags ?? null,
        topics: (t as any).topics ?? null,
        primaryTopic: (t as any).primaryTopic ?? null,
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

  // Ensure standard 4-lane design exists server-side (Backlog, Todo, In Progress, Done)
  useEffect(() => {
    const ensure = async () => {
      if (!data || standardEnsured) return;
      const cols = data.board.columnOrder.map((id) => data.board.columns[id]);
      const lower = (s: string) => (s || '').trim().toLowerCase();
      const hasBacklog = cols.some(c => lower(c.name).includes('backlog'));
      const hasTodo = cols.some(c => lower(c.name) === 'todo' || lower(c.name).includes('to do'));
      const hasInProg = cols.some(c => lower(c.name).includes('progress'));
      const hasDone = cols.some(c => lower(c.name).includes('done'));
      const needs = !(hasBacklog && hasTodo && hasInProg && hasDone);
      if (needs) {
        try {
          await fetch(`/api/boards/${boardId}/ensure-standard`, { method: 'POST' });
          await queryClient.invalidateQueries({ queryKey: queryKeys.board(boardId) });
        } catch { /* ignore */ }
      }
      setStandardEnsured(true);
    };
    void ensure();
  }, [data, boardId, queryClient, standardEnsured]);
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
      if (!res.ok) throw new Error("Unable to categorize task");
      return (await res.json()) as { topics: string[]; primaryTopic: string; confidence: number };
    },
    onSuccess: async (data) => {
      toast.success(`Categorized • ${Math.round((data.confidence ?? 0) * 100)}% confidence`, { description: `${data.primaryTopic}${data.topics?.length ? ' • +' + (data.topics.length - 1) : ''}` });
      await queryClient.invalidateQueries({ queryKey: queryKeys.board(boardId) });
    },
    onError: () => toast.error("Failed to categorize"),
  });

  // Suggest/auto-move removed for initial rollout

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

  // Quiz removed for initial rollout

  const handleDragStart = ({ active }: DragStartEvent) => {
    const id = active?.id?.toString?.();
    if (!id) return;
    if (active?.data?.current?.type === "task" || !(active?.data?.current?.type)) {
      setActiveTaskId(id);
    }
  };

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

      // Trigger gamification if moved to Done
      const destColumn = board.columns[destinationColumnId];
      console.log("Moved to column:", destColumn?.title); // DEBUG
      if (destColumn && destColumn.title.toLowerCase() === "done") {
        console.log("Triggering TASK_COMPLETE for:", activeTaskId); // DEBUG
        triggerAction("TASK_COMPLETE", activeTaskId);
      }
    }
  };

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={(evt) => { try { handleDragEnd(evt); } finally { setActiveTaskId(null); } }}>
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={async () => {
            try {
              const res = await fetch(`/api/boards/${boardId}/hide-done`, { method: 'POST' });
              if (!res.ok) throw new Error('Failed to hide done tasks');
              const data = await res.json();
              toast.success(`Moved ${data.moved} done task(s) to Hidden`);
              await queryClient.invalidateQueries({ queryKey: queryKeys.board(boardId) });
            } catch (_e) {
              toast.error('Failed to move done tasks');
            }
          }}>Move all Done to Hidden</Button>
          <Button size="sm" variant="ghost" onClick={() => setShowHidden(s => !s)}>{showHidden ? 'Hide Hidden' : 'Show Hidden'}</Button>
        </div>
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
          {(() => {
            // Render fixed 4-lane layout: Backlog, Todo, In Progress, Done
            const byId = board.columns;
            const lower = (s?: string) => (s || '').trim().toLowerCase();
            const findBy = (pred: (name: string) => boolean) => board.columnOrder.find(id => pred(lower(byId[id]?.title)));
            const backlog = findBy(n => n.includes('backlog'));
            const todo = findBy(n => n === 'todo' || n.includes('to do'));
            const inProg = findBy(n => n.includes('progress'));
            const done = findBy(n => n.includes('done'));
            const main = [backlog, todo, inProg, done].filter(Boolean) as string[];
            return main.map(columnId => (
              <KanbanColumn
                key={columnId}
                column={board.columns[columnId]}
                tasks={board.tasks}
                onEnrich={(taskId) => enrichTask.mutate(taskId)}
                onSummary={(taskId) => summarizeNote.mutate(taskId)}
                onClassify={(taskId) => classifyTask.mutate(taskId)}
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
            ));
          })()}
        </div>
        {showHidden ? (
          <div>
            <div className="mb-2 text-sm font-medium text-muted-foreground">Hidden</div>
            <div className="flex flex-nowrap gap-4 overflow-x-auto pb-4">
              {board.columnOrder
                .filter(columnId => (board.columns[columnId]?.title ?? '').toLowerCase().includes('hidden'))
                .map(columnId => (
                  <KanbanColumn
                    key={columnId}
                    column={board.columns[columnId]}
                    tasks={board.tasks}
                    onEnrich={(taskId) => enrichTask.mutate(taskId)}
                    onSummary={(taskId) => summarizeNote.mutate(taskId)}
                    onClassify={(taskId) => classifyTask.mutate(taskId)}
                    onOpen={(taskId) => {
                      try { router.push(`/boards/${boardId}/tasks/${taskId}`); } catch { setOpenTaskId(taskId); }
                    }}
                    openTaskId={openTaskId}
                    onCreateCard={async (colId, title, description) => {
                      try {
                        const res = await createCard.mutateAsync({ boardId, columnId: colId, title, descriptionMarkdown: description });
                        const newId = (res as any)?.id as string | undefined;
                        if (newId) {
                          setBoard(current => {
                            if (!current.columns[colId]) return current;
                            const next = { ...current, tasks: { ...current.tasks }, columns: { ...current.columns } };
                            next.tasks[newId] = { id: newId, title, description: description ?? '', aiSuggestedColumnId: null, aiSuggestedPriority: null, aiSuggestedEstimateMin: null, aiNextAction: null, aiState: null, aiConfidence: null };
                            next.columns[colId] = { ...next.columns[colId], taskIds: [...next.columns[colId].taskIds, newId] };
                            return next;
                          });
                          requestAnimationFrame(() => setOpenTaskId(newId));
                        }
                      } catch (_e) {
                        // noop
                      } finally {
                        await queryClient.invalidateQueries({ queryKey: queryKeys.board(boardId) });
                      }
                    }}
                  />
                ))}
            </div>
          </div>
        ) : null}
      </div>
      {openTaskId ? (
        <CardSheet taskId={openTaskId} open={true} onClose={() => setOpenTaskId(null)} onOpenFull={(id) => (window.location.href = `/tasks/${id}`)} />
      ) : null}

      {/* Drag overlay for smooth lane transitions */}
      <DragOverlay
        dropAnimation={{
          duration: 250,
          easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
          sideEffects: defaultDropAnimationSideEffects({
            styles: { active: { opacity: '0.2' } },
          }),
        }}
      >
        {(() => {
          const t = activeTaskId ? board.tasks[activeTaskId] : undefined;
          return t ? (
            <div className="pointer-events-none select-none">
              <motion.div className="rounded-lg border border-border bg-background/95 p-3 text-left shadow-2xl">
                <h3 className="font-medium text-sm break-words leading-tight line-clamp-2">{t.title}</h3>
                {t.description ? (
                  <p className="mt-2 text-xs text-muted-foreground leading-relaxed break-words whitespace-pre-wrap line-clamp-3">{t.description}</p>
                ) : null}
                {t.primaryTopic || (t.topics && t.topics.length) ? (
                  <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[10px]">
                    {t.primaryTopic ? (
                      <span className="rounded px-2 py-0.5 bg-indigo-500/10 text-indigo-700 dark:text-indigo-300">{t.primaryTopic}</span>
                    ) : null}
                    {(t.topics ?? []).filter(x => x !== t.primaryTopic).slice(0, 2).map(x => (
                      <span key={x} className="rounded px-2 py-0.5 bg-muted text-foreground/80">{x}</span>
                    ))}
                  </div>
                ) : null}
              </motion.div>
            </div>
          ) : null;
        })()}
      </DragOverlay>
    </DndContext>
  );
}

type KanbanColumnProps = {
  column: Column;
  tasks: Record<string, Task>;
  
  onEnrich: (taskId: string) => void;
  onSummary: (taskId: string) => void;
  onClassify: (taskId: string) => void;
  onOpen: (taskId: string) => void;
  onCreateCard: (columnId: string, title: string, description?: string) => void;
  openTaskId?: string | null;
  onApplyMove?: (taskId: string, targetColumnId: string) => void;
};

const KanbanColumn = memo(function KanbanColumn({ column, tasks, onEnrich, onSummary, onCreateCard, onClassify, onOpen, openTaskId, onApplyMove }: KanbanColumnProps) {
  const [newOpen, setNewOpen] = useState(false);
  const isInProgress = (column.title ?? '').trim().toLowerCase() === 'in progress';
  const wipCount = column.taskIds.length;
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
            {isInProgress && wipCount > 3 ? (
              <div className="mt-1 text-[10px] text-amber-700 dark:text-amber-300">
                You have {wipCount} tasks in progress. Consider finishing one before starting another.
              </div>
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
            <EmptyColumnHint columnTitle={column.title} />
          ) : (
            column.taskIds.map(taskId => (
              <SortableTask key={taskId} task={tasks[taskId]} columnId={column.id} onEnrich={onEnrich} onSummary={onSummary} onClassify={onClassify} onOpen={onOpen} openTaskId={openTaskId} onApplyMove={onApplyMove} />
            ))
          )}
        </ColumnSortableArea>
      </CardContent>
      <NewCardModal open={newOpen} onClose={() => setNewOpen(false)} onSubmit={(t, d) => onCreateCard(column.id, t, d)} />
    </Card>
  );
},
// Re-render when column identity or content actually changes
(prev, next) => (
  prev.column === next.column &&
  prev.tasks === next.tasks &&
  prev.openTaskId === next.openTaskId
));

type ColumnSortableAreaProps = {
  columnId: string;
  taskIds: string[];
  children: React.ReactNode;
};

const ColumnSortableArea = memo(function ColumnSortableArea({ columnId, taskIds, children }: ColumnSortableAreaProps) {
  const { isOver, setNodeRef } = useDroppable({
    id: columnId,
    data: { type: "column", columnId },
  });

  return (
    <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
      <div
        ref={setNodeRef}
        className={cn(
          "flex min-h-[120px] flex-col gap-2 transition-colors duration-200",
          isOver && "rounded-lg border border-dashed border-primary/40 bg-primary/5",
        )}
        data-column-id={columnId}
      >
        {children}
      </div>
    </SortableContext>
  );
});

type SortableTaskProps = {
  task: Task;
  columnId: string;
  onEnrich: (taskId: string) => void;
  onSummary: (taskId: string) => void;
  onClassify: (taskId: string) => void;
  onOpen: (taskId: string) => void;
  openTaskId?: string | null;
  onApplyMove?: (taskId: string, targetColumnId: string) => void;
};

const SortableTask = memo(function SortableTask({ task, columnId, onEnrich, onSummary, onClassify, onOpen, openTaskId, onApplyMove: _onApplyMove }: SortableTaskProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({
      id: task.id,
      data: { type: "task", columnId },
      animateLayoutChanges: () => true,
    });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition || 'transform 280ms cubic-bezier(0.2, 0.8, 0.2, 1)',
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
        "rounded-lg border border-border bg-background/90 p-3 text-left shadow-sm will-change-transform",
        isDragging && "opacity-70 ring-2 ring-primary/30 shadow-lg",
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
          <ActionButton title="AI: Categorize" onClick={(e) => { e.stopPropagation(); onClassify(task.id); }}>
            <Tag className="size-4" />
          </ActionButton>
          <ActionButton title="AI: Summary" onClick={(e) => { e.stopPropagation(); onSummary(task.id); }}>
            <FileText className="size-4" />
          </ActionButton>
          {/* Quiz, Suggest, Auto-move removed */}
        </div>
      </div>
      
      {task.description ? (
        <p className="mt-2 text-xs text-muted-foreground leading-relaxed break-words whitespace-pre-wrap line-clamp-3">
          {task.description}
        </p>
      ) : null}
      {task.primaryTopic || (task.topics && task.topics.length) ? (
        <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[10px]">
          {task.primaryTopic ? (
            <span className="rounded px-2 py-0.5 bg-indigo-500/10 text-indigo-700 dark:text-indigo-300">{task.primaryTopic}</span>
          ) : null}
          {(task.topics ?? []).filter(t => t !== task.primaryTopic).slice(0, 2).map((t) => (
            <span key={t} className="rounded px-2 py-0.5 bg-muted text-foreground/80">{t}</span>
          ))}
        </div>
      ) : null}
      {/* AI chips removed for initial rollout */}
    </motion.div>
  );
},
// Re-render only when identity or open state changes
(prev, next) => (
  prev.task === next.task &&
  prev.openTaskId === next.openTaskId &&
  prev.columnId === next.columnId
));

function EmptyColumnHint({ columnTitle }: { columnTitle?: string }) {
  const isBacklog = (columnTitle ?? '').trim().toLowerCase() === 'backlog';
  return (
    <div className="rounded-lg border border-dashed border-border/60 p-4 text-center text-xs text-muted-foreground">
      {isBacklog
        ? 'Dump every idea here: job prep, reading, errands. Drag into To Do when you\'re ready to work on it.'
        : 'No tasks yet. Drop tasks here.'}
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
