"use client";

import { useMemo } from "react";
import { Check, Loader2, Trash2 } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type ApiBoard = {
  board: {
    id: string;
    title: string;
    columnOrder: string[];
    columns: Record<string, { id: string; name: string; position: number; taskIds: string[] }>;
    tasks: Record<
      string,
      {
        id: string;
        title: string;
        descriptionMarkdown: string | null;
        columnId: string;
        priority: string | null;
        createdAt: string;
      }
    >;
  };
};

export function TodoList() {
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

  const board = data?.board;
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

  const markDone = useMutation({
    mutationFn: async (taskId: string) => {
      const res = await fetch(`/api/tasks/${taskId}/done`, { method: "PATCH" });
      if (!res.ok) throw new Error("Unable to mark task done");
      return (await res.json()) as { ok: boolean };
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["board"], exact: true });
    },
  });

  const deleteTask = useMutation({
    mutationFn: async (taskId: string) => {
      const res = await fetch(`/api/tasks/${taskId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Unable to delete task");
      return (await res.json()) as { ok: boolean };
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["board"], exact: true });
    },
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
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => markDone.mutate(todo.id)}
                        disabled={markDone.isPending}
                        className="gap-2"
                      >
                        {markDone.isPending ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <Check className="size-4" />
                        )}
                        Mark done
                      </Button>
                      <Button
                        size="icon"
                        variant="destructive"
                        onClick={() => deleteTask.mutate(todo.id)}
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
