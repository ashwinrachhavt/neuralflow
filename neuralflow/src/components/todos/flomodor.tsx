"use client";

import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, Trash2, Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useDeleteCard, useMarkDone, useMyTodos } from "@/hooks/api";
import { useProductAnalytics } from "@/hooks/use-product-analytics";
import { CardMotionOverlay } from "@/components/cards/CardMotionOverlay";
import { Skeleton } from "@/components/ui/skeleton";

export function FlomodorTodos() {
  const qc = useQueryClient();
  const { data, isLoading } = useMyTodos('TODO');
  const todos = useMemo(() => data?.tasks ?? [], [data?.tasks]);
  const [openTaskId, setOpenTaskId] = useState<string | null>(null);
  const { trackEvent } = useProductAnalytics();

  const quickAdd = useMutation({
    mutationFn: async ({ title }: { title: string }) => {
      const res = await fetch('/api/tasks/quick', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title }) });
      if (!res.ok) throw new Error('Unable to create');
      return (await res.json()) as { id: string };
    },
    onSuccess: async (res) => {
      await qc.invalidateQueries({ queryKey: ['my-todos','TODO'] });
      const id = (res as any)?.id as string | undefined;
      if (id) setOpenTaskId(id);
      trackEvent("todo_quick_add", { source: "flomodor" });
    }
  });

  const enrich = useMutation({
    mutationFn: async (taskId: string) => {
      const res = await fetch(`/api/ai/cards/${taskId}/enrich`, { method: 'POST' });
      if (!res.ok) throw new Error('enrich failed');
      return res.json();
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['my-todos','TODO'] });
      trackEvent("todo_enrich_success", { source: "flomodor" });
    }
  });

  const markDone = useMarkDone();
  const del = useDeleteCard();

  const [newTitle, setNewTitle] = useState("");

  return (
    <div className="grid gap-6 lg:grid-cols-1 place-items-center">
      <Card className="w-full max-w-2xl border-border/70 bg-card/70 backdrop-blur">
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-xl">
            Todo
            <Badge variant="secondary" className="text-xs font-medium">{todos.length} tasks</Badge>
          </CardTitle>
          
        </CardHeader>
        <CardContent className="space-y-4">
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              const t = newTitle.trim();
              if (!t) return;
              quickAdd.mutate({ title: t });
              setNewTitle('');
            }}
          >
            <Input placeholder="Add task" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} />
            <Button type="submit" disabled={quickAdd.isPending} className="gap-2">
              {quickAdd.isPending ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />} Add
            </Button>
          </form>

          {isLoading ? (
            <div className="space-y-3">
              {[0,1,2].map(i => (
                <div key={i} className="rounded-xl border border-border/70 bg-card/70 p-4">
                  <Skeleton className="h-4 w-56" />
                  <Skeleton className="mt-2 h-3 w-80" />
                </div>
              ))}
            </div>
          ) : null}

          <ul className="space-y-3">
            {todos.map(todo => (
              <li key={todo.id}>
                <div
                  className="rounded-xl border border-border/70 bg-card/70 p-4 hover:border-foreground/30"
                  onClick={() => {
                    setOpenTaskId(todo.id);
                    trackEvent("todo_open_card", { source: "flomodor" });
                  }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <button
                          className={cn('grid size-5 place-items-center rounded-full border transition', 'hover:bg-emerald-50')}
                          title="Mark done"
                          onClick={async (event) => {
                            event.stopPropagation();
                            trackEvent("todo_mark_done", { source: "flomodor" });
                            await markDone.mutateAsync(todo.id);
                            await qc.invalidateQueries({ queryKey: ['my-todos','TODO'] });
                          }}
                        >
                          <Check className="size-3" />
                        </button>
                        <p className="text-sm font-medium">{todo.title}</p>
                      </div>
                      {todo.descriptionMarkdown ? (
                        <p className="mt-2 text-xs text-muted-foreground">{todo.descriptionMarkdown}</p>
                      ) : null}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(event) => {
                          event.stopPropagation();
                          trackEvent("todo_enrich_request", { source: "flomodor" });
                          enrich.mutate(todo.id);
                        }}
                        disabled={enrich.isPending}
                        className="gap-2"
                        title="AI: Enrich"
                      >
                        {enrich.isPending ? <Loader2 className="size-4 animate-spin" /> : '✨'} Enrich
                      </Button>
                      <Button
                        size="icon"
                        variant="destructive"
                        onClick={(event) => {
                          event.stopPropagation();
                          trackEvent("todo_delete", { source: "flomodor" });
                          del.mutate({ taskId: todo.id });
                        }}
                        disabled={del.isPending}
                        title="Delete task"
                      >
                        {del.isPending ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
                      </Button>
                    </div>
                  </div>
                </div>
              </li>
            ))}

            {todos.length === 0 && !isLoading ? (
              <li>
                <div className="rounded-xl border border-dashed border-border/70 p-6 text-center text-sm text-muted-foreground">
                  No tasks yet.
                </div>
              </li>
            ) : null}
          </ul>
        </CardContent>
      </Card>

      <div className="space-y-4" />
      {openTaskId ? (
        <CardMotionOverlay taskId={openTaskId} open={true} onClose={() => setOpenTaskId(null)} />
      ) : null}
    </div>
  );
}
