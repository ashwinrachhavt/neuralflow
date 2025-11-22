"use client";

import { useMemo } from "react";
import { Loader2, Trash2, MapPin } from "lucide-react";
import { useQueryClient, useMutation } from "@tanstack/react-query";

import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import { useDeleteCard, useMarkDone, useMyTodos } from "@/hooks/api";

export function TodoList() {
  const qc = useQueryClient();
  const { data, isLoading } = useMyTodos('TODO');
  const tasksArray = useMemo(() => data?.tasks ?? [], [data?.tasks]);

  const stats = useMemo(() => {
    const total = tasksArray.length;
    return { total, done: 0, remaining: total, progress: 0 }; // aggregate across boards not computed here
  }, [tasksArray.length]);

  const markDone = useMarkDone();
  const deleteTask = useDeleteCard();

  const enrichTask = useMutation({
    mutationFn: async (taskId: string) => {
      const res = await fetch(`/api/ai/cards/${taskId}/enrich`, { method: "POST" });
      if (!res.ok) throw new Error("Unable to enrich task");
      return (await res.json()) as { descriptionMarkdown: string };
    },
    onSuccess: async () => {
      toast.success("Description enriched");
      await qc.invalidateQueries({ queryKey: ["my-todos", 'TODO'] });
    },
  });

  async function ensureNote(taskId: string): Promise<string> {
    const res = await fetch(`/api/cards/${taskId}/note`, { method: "POST" });
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
            <Badge variant="secondary" className="text-xs font-medium">{stats.total} tasks</Badge>
          </CardTitle>
          <CardDescription>Tasks currently marked as Todo.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="space-y-3">
              {[0,1,2].map(i => (
                <div key={i} className="rounded-xl border border-border/70 bg-card/70 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-3 w-80" />
                    </div>
                    <Skeleton className="h-8 w-20" />
                  </div>
                </div>
              ))}
            </div>
          ) : null}

          <ul className="space-y-3">
            {tasksArray.map(todo => (
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
                      {todo.location ? (
                        <div className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
                          <MapPin className="size-3" />
                          <span className="truncate">{todo.location}</span>
                        </div>
                      ) : null}
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-2 text-xs text-muted-foreground select-none">
                        <input
                          type="checkbox"
                          className="accent-emerald-600 h-4 w-4"
                          checked={false}
                          onChange={async (e) => {
                            const checked = e.target.checked;
                            try {
                              if (checked) {
                                await markDone.mutateAsync(todo.id);
                                await qc.invalidateQueries({ queryKey: ["my-todos", 'TODO'] });
                              } else {
                                // Optional: move back to known Todo column if available
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

            {tasksArray.length === 0 && !isLoading ? (
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
