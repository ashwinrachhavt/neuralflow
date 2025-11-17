"use client";

import { useMemo } from "react";
import { Check, Loader2, Trash2 } from "lucide-react";
import { useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";

import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import { useBoard, useDefaultBoardId, useDeleteCard, useMarkDone } from "@/hooks/api";
import type { BoardNormalized } from "@/hooks/api";

export function TodoList() {
  const qc = useQueryClient();
  const def = useDefaultBoardId();
  const boardId = def.data?.id ?? "";
  const { data, isLoading } = useBoard(boardId);
  const board = (data as BoardNormalized | undefined)?.board;
  const tasksArray = useMemo(() => (board ? Object.values(board.tasks) : []), [board]);

  const todoColumn = useMemo(() => {
    if (!board) return undefined;
    return Object.values(board.columns).find(c => c.name.toLowerCase() === "todo");
  }, [board]);

  const doneColumn = useMemo(() => {
    if (!board) return undefined;
    return Object.values(board.columns).find(c => c.name.toLowerCase() === "done");
  }, [board]);

  const todoTasks = useMemo(
    () => tasksArray.filter(t => (todoColumn ? t.columnId === todoColumn.id : true)),
    [tasksArray, todoColumn?.id],
  );
  const doneTasks = useMemo(
    () => tasksArray.filter(t => (doneColumn ? t.columnId === doneColumn.id : false)),
    [tasksArray, doneColumn?.id],
  );

  const stats = useMemo(() => {
    const total = tasksArray.length;
    const done = doneTasks.length;
    return {
      total,
      done,
      remaining: Math.max(0, total - done),
      progress: total === 0 ? 0 : Math.round((done / total) * 100),
    };
  }, [doneTasks.length, tasksArray.length]);

  const markDone = useMarkDone(boardId);
  const moveToColumn = useMutation({
    mutationFn: async ({ taskId, columnId }: { taskId: string; columnId: string }) => {
      const res = await fetch(`/api/tasks/${taskId}/column`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ columnId }),
      });
      if (!res.ok) throw new Error("Unable to move task");
      return (await res.json()) as { ok: boolean };
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["board", boardId] });
    },
  });

  const deleteTask = useDeleteCard();

  const enrichTask = useMutation({
    mutationFn: async (taskId: string) => {
      const res = await fetch(`/api/ai/cards/${taskId}/enrich`, { method: "POST" });
      if (!res.ok) throw new Error("Unable to enrich task");
      return (await res.json()) as { descriptionMarkdown: string };
    },
    onSuccess: async () => {
      toast.success("Description enriched");
      await qc.invalidateQueries({ queryKey: ["board", boardId] });
    },
  });

  async function ensureNote(taskId: string): Promise<string> {
    const res = await fetch(`/api/cards/${taskId}/enrich`, { method: "POST" });
    if (!res.ok) throw new Error("Unable to initialize note");
    const data = (await res.json()) as { noteId: string };
    return data.noteId;
  }

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

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <Card className="border-border/70 bg-card/70 backdrop-blur">
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-xl">
            Today&apos;s Focus
            <Badge variant="secondary" className="text-xs font-medium">
              {stats.done} / {stats.total} done
            </Badge>
          </CardTitle>
          <CardDescription>Tasks currently marked as Todo.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" /> Loading tasks…
            </div>
          ) : null}

          <ul className="space-y-3">
            {todoTasks.map(todo => (
              <li key={todo.id}>
                <div
                  className={cn(
                    "w-full rounded-xl border border-border/70 bg-background/70 p-4 text-left transition hover:border-primary/60",
                  )}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="grid size-5 place-items-center rounded-full border border-border/50">
                          <span className="size-2 rounded-full bg-border" />
                        </span>
                        <p className="text-sm font-medium">{todo.title}</p>
                      </div>
                      {todo.descriptionMarkdown ? (
                        <p className="mt-2 text-xs text-muted-foreground">
                          {todo.descriptionMarkdown}
                        </p>
                      ) : null}
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-2 text-xs text-muted-foreground select-none">
                        <input
                          type="checkbox"
                          className="accent-emerald-600 h-4 w-4"
                          checked={doneColumn ? todo.columnId === doneColumn.id : false}
                          onChange={async (e) => {
                            const checked = e.target.checked;
                            try {
                              if (checked) {
                                await markDone.mutateAsync(todo.id);
                              } else if (todoColumn) {
                                await moveToColumn.mutateAsync({ taskId: todo.id, columnId: todoColumn.id });
                              }
                            } catch (_) {
                              // ignore; UI will refresh from server state
                            }
                          }}
                        />
                        Done
                      </label>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => enrichTask.mutate(todo.id)}
                        disabled={enrichTask.isPending}
                        className="gap-2"
                        title="AI: Expand description"
                      >
                        {enrichTask.isPending ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <span className="size-4">✨</span>
                        )}
                        Enrich
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => summarizeNote.mutate(todo.id)}
                        disabled={summarizeNote.isPending}
                        className="gap-2"
                        title="AI: Summarize note"
                      >
                        {summarizeNote.isPending ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <span className="size-4">📝</span>
                        )}
                        Summary
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => quizFromNote.mutate(todo.id)}
                        disabled={quizFromNote.isPending}
                        className="gap-2"
                        title="AI: Create study material"
                      >
                        {quizFromNote.isPending ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <span className="size-4">🧠</span>
                        )}
                        Quiz
                      </Button>
                      <Button
                        size="icon"
                        variant="destructive"
                        onClick={() => deleteTask.mutate({ taskId: todo.id })}
                        disabled={deleteTask.isPending}
                        title="Delete task"
                      >
                        {deleteTask.isPending ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <Trash2 className="size-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </li>
            ))}

            {todoTasks.length === 0 && !isLoading ? (
              <li>
                <div className="rounded-xl border border-dashed border-border/70 p-6 text-center text-sm text-muted-foreground">
                  No tasks in Todo. Use AI planning to seed tasks or drag cards in Kanban.
                </div>
              </li>
            ) : null}
          </ul>
        </CardContent>
      </Card>
      <Card className="border-border/70 bg-card/60 backdrop-blur">
        <CardHeader>
          <CardTitle className="text-lg">Progress pulse</CardTitle>
          <CardDescription>A quick snapshot of today’s pace.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <p className="text-sm text-muted-foreground">Completion</p>
            <p className="mt-2 text-3xl font-semibold">{stats.progress}%</p>
            <div className="mt-4 h-2 rounded-full bg-muted/70">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${stats.progress}%` }}
              />
            </div>
          </div>
          <div className="grid gap-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Total tasks</span>
              <span className="font-medium">{stats.total}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Completed</span>
              <span className="font-medium text-emerald-500 dark:text-emerald-300">
                {stats.done}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Remaining</span>
              <span className="font-medium text-amber-500 dark:text-amber-300">
                {stats.remaining}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
