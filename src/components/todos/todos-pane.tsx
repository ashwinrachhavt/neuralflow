"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Check, MapPin, Plus, Wand2, ScatterChart, GripVertical, Pencil, Trash2, Eye } from "lucide-react";
import Link from "next/link";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useDeleteCard, useMarkDone, useMyTodos } from "@/hooks/api";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { MyTodo } from "@/hooks/api";
import { CardSheet } from "@/components/cards/CardSheet";
import { AssistantDock } from "@/components/assistant/AssistantDock";
import { StoneCelebrateModal } from "@/components/gamification/StoneCelebrateModal";
import { GEM_ICON_PATHS, GEM_META } from "@/lib/gamification/catalog";

const PRIORITY_STYLES: Record<NonNullable<MyTodo['priority']>, string> = {
  HIGH: "border-rose-400/80 bg-rose-500/10 text-rose-200",
  MEDIUM: "border-amber-400/80 bg-amber-500/10 text-amber-200",
  LOW: "border-emerald-400/80 bg-emerald-500/10 text-emerald-200",
};

export function TodosPane() {
  const qc = useQueryClient();
  const router = useRouter();
  const { data, isLoading } = useMyTodos('TODO');
  const todos = useMemo(() => data?.tasks ?? [], [data?.tasks]);
  const [openTaskId, setOpenTaskId] = useState<string | null>(null);
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [celebrate, setCelebrate] = useState<null | { name: string; image?: string; rarity?: string }>(null);
  const [title, setTitle] = useState("");

  const addMutation = useMutation({
    mutationFn: async (t: string) => {
      const res = await fetch('/api/tasks/quick', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: t }) });
      if (!res.ok) throw new Error('failed');
      return (await res.json()) as { id: string };
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['my-todos','TODO'] });
    }
  });

  const markDone = useMarkDone();
  const deleteCard = useDeleteCard();
  const totalTodos = todos.length;
  const highPriorityCount = todos.filter((t) => t.priority === "HIGH").length;
  const estimatedPomodoros = todos.reduce((sum, t) => sum + (t.estimatedPomodoros ?? 0), 0);

  const [priorityFilter, setPriorityFilter] = useState<'ALL'|'HIGH'|'MEDIUM'|'LOW'>("ALL");
  const [sortBy, setSortBy] = useState<'priority'|'estimate'|'title'>("priority");

  const visibleTodos = useMemo(() => {
    const order: Record<string, number> = { HIGH: 3, MEDIUM: 2, LOW: 1 } as const as any;
    let arr = todos.slice();
    if (priorityFilter !== 'ALL') arr = arr.filter(t => t.priority === priorityFilter);
    arr.sort((a, b) => {
      if (sortBy === 'priority') return (order[b.priority ?? 'LOW'] ?? 0) - (order[a.priority ?? 'LOW'] ?? 0);
      if (sortBy === 'estimate') return (b.estimatedPomodoros ?? 0) - (a.estimatedPomodoros ?? 0);
      return (a.title || '').localeCompare(b.title || '');
    });
    return arr;
  }, [todos, priorityFilter, sortBy]);

  useEffect(() => {
    const handleFocusQuickAdd = () => {
      const el = document.getElementById('todos-quick-add-input') as HTMLInputElement | null;
      el?.focus();
    };
    const handleKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const typing = !!target?.closest('input, textarea, [contenteditable="true"], select');
      if (!typing && e.key.toLowerCase() === 'a' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        setAssistantOpen(true);
      }
    };
    window.addEventListener('focus-todos-quick-add', handleFocusQuickAdd as EventListener);
    window.addEventListener('keydown', handleKey);
    return () => {
      window.removeEventListener('focus-todos-quick-add', handleFocusQuickAdd as EventListener);
      window.removeEventListener('keydown', handleKey);
    };
  }, []);

  async function invalidateBoardsAndTodos() {
    try {
      await qc.invalidateQueries({ predicate: (q) => Array.isArray(q.queryKey) && (q.queryKey[0] === 'board' || q.queryKey[0] === 'cards' || q.queryKey[0] === 'boards') });
    } catch (e) { void e; }
    await qc.invalidateQueries({ queryKey: ['my-todos','TODO'] });
  }

  const handleQuickAddSubmit = () => {
    const trimmed = title.trim();
    if (!trimmed) return;
    addMutation.mutate(trimmed);
    setTitle('');
  };

  return (
    <div className="flex w-full justify-center px-4 py-6">
      <div className="w-full max-w-5xl space-y-6">
        <section className="rounded-[2rem] border border-border/20 bg-hero-gradient px-6 py-6 shadow-[0_35px_60px_rgba(15,23,42,0.85)] text-white">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="space-y-1">
              <p className="text-[11px] uppercase tracking-[0.4em] text-muted-foreground/70">Todos dashboard</p>
              <h2 className="text-3xl font-semibold leading-tight">Flow into focus</h2>
              <p className="text-sm text-muted-foreground/80">Keep your focus lane soft but structured; the next action should feel like a breeze.</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/visualize/embeddings"
                className="rounded-full border border-border/40 px-5 py-2 text-[11px] uppercase tracking-[0.3em] text-white/80 transition hover:border-border/60 hover:text-white"
              >
                <span className="inline-flex items-center gap-1">
                  <ScatterChart className="size-3.5" /> Spatial
                </span>
              </Link>
              <Button
                variant="outline"
                className="rounded-full border-border/40 bg-foreground/10 text-white shadow-lg hover:border-border/60"
                onClick={() => setAssistantOpen(true)}
              >
                <Wand2 className="size-4" /> Generate with AI
              </Button>
            </div>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-border/20 bg-foreground/5 px-4 py-4">
              <p className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground/70">Active</p>
              <p className="text-3xl font-semibold">{totalTodos}</p>
              <p className="text-sm text-muted-foreground/80">Stay steady with {totalTodos ? 'your next actions' : 'a fresh plan'}</p>
            </div>
            <div className="rounded-2xl border border-border/20 bg-foreground/5 px-4 py-4">
              <p className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground/70">Urgent</p>
              <p className="text-3xl font-semibold">{highPriorityCount}</p>
              <p className="text-sm text-muted-foreground/80">
                {highPriorityCount ? `${highPriorityCount} high-priority task${highPriorityCount === 1 ? '' : 's'}` : 'No urgencies'}
              </p>
            </div>
            <div className="rounded-2xl border border-border/20 bg-foreground/5 px-4 py-4">
              <p className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground/70">Pomodoros</p>
              <p className="text-3xl font-semibold">{estimatedPomodoros}</p>
              <p className="text-sm text-muted-foreground/80">
                {estimatedPomodoros ? `${estimatedPomodoros} pomodoro${estimatedPomodoros === 1 ? '' : 's'}` : 'No estimates yet'}
              </p>
            </div>
          </div>
        </section>
        <Card className="rounded-[2rem] border border-border/20 bg-hero-surface text-white shadow-[0_25px_60px_rgba(2,6,23,0.6)]">
          <CardHeader className="px-6 pt-6 pb-1">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.4em] text-muted-foreground/70">Today</p>
                <h3 className="text-2xl font-semibold">Your focus lane</h3>
              </div>
              <span className="text-xs font-semibold uppercase tracking-[0.4em] text-emerald-300">
                {highPriorityCount ? `${highPriorityCount} urgent` : 'All calm'}
              </span>
            </div>
            <p className="text-sm text-muted-foreground/70">Tap an item to open the full card and keep context in a single glance.</p>
          </CardHeader>
          <CardContent className="px-0 pb-6 pt-0">
            <div className="flex items-center justify-between gap-3 px-6 py-3">
              <div className="text-xs text-muted-foreground/80">{totalTodos} tasks • {highPriorityCount} high • {estimatedPomodoros} pomodoros</div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 rounded-full border border-border/40 bg-foreground/5 p-1">
                  {(['ALL','HIGH','MEDIUM','LOW'] as const).map(p => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPriorityFilter(p)}
                      className={
                        "rounded-full px-3 py-1 text-[11px] uppercase tracking-wide transition " +
                        (priorityFilter === p ? "bg-foreground/10 text-white" : "text-muted-foreground hover:text-foreground")
                      }
                      aria-pressed={priorityFilter === p}
                    >
                      {p}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground/80">
                  <span>Sort</span>
                  <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
                    <SelectTrigger className="h-8 w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="priority">Priority</SelectItem>
                      <SelectItem value="estimate">Estimate</SelectItem>
                      <SelectItem value="title">Title</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <div className="max-h-[460px] overflow-hidden px-6">
              {isLoading ? (
                <div className="space-y-3 py-2">
                  {[0, 1, 2, 3].map((idx) => (
                    <div key={idx} className="rounded-3xl border border-border/20 bg-foreground/5 p-4 shadow-inner">
                      <Skeleton className="h-4 w-48" />
                    </div>
                  ))}
                </div>
              ) : todos.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-border/30 bg-foreground/5 p-6 text-center text-sm text-muted-foreground/80">
                  Your focus queue is empty—add a quick task to begin a new streak.
                </div>
              ) : (
                <ul className="flex flex-col gap-3 pb-2">
                  {visibleTodos.map((t) => (
                    <li key={t.id}>
                      <motion.div
                        layoutId={`card-${t.id}`}
                        whileHover={{ scale: 1.01 }}
                        className="group flex cursor-pointer items-center justify-between gap-4 rounded-[1.5rem] border border-border/20 bg-gradient-to-br from-foreground/5 to-transparent px-5 py-4 shadow-[0_20px_50px_rgba(2,6,23,0.55)] transition hover:border-border/40 hover:bg-foreground/10"
                        onClick={() => {
                          try {
                            router.push(`/todos/tasks/${t.id}`);
                          } catch {
                            setOpenTaskId(t.id);
                          }
                        }}
                      >
                        <div className="flex flex-1 items-start gap-3">
                          <span className="mt-1 hidden text-muted-foreground/70 transition group-hover:opacity-100 sm:block">
                            <GripVertical className="size-4 cursor-grab" aria-hidden />
                          </span>
                          <div className="flex-1 space-y-2">
                            <motion.h3 layoutId={`card-title-${t.id}`} className="text-lg font-semibold text-white">
                              {t.priority ? <span className={dotClass(t.priority)} aria-hidden /> : null}
                            {t.title}
                            </motion.h3>
                            <div className="flex flex-wrap gap-2 text-[11px] uppercase tracking-wide">
                            {t.priority ? (
                              <span className={`rounded-full border px-2 py-0.5 font-semibold ${PRIORITY_STYLES[t.priority]}`}>
                                {t.priority}
                              </span>
                            ) : null}
                            {typeof t.estimatedPomodoros === "number" ? (
                              <span className="rounded-full border border-border/30 px-2 py-0.5 text-[12px] text-muted-foreground/70">
                                {t.estimatedPomodoros} pomodor{t.estimatedPomodoros === 1 ? "o" : "os"}
                              </span>
                            ) : null}
                            {t.tags?.slice(0, 2).map((tag) => (
                              <span key={`${t.id}-${tag}`} className="rounded-full border border-border/30 bg-foreground/10 px-2 py-0.5 text-[12px] text-muted-foreground">
                                {tag}
                              </span>
                            ))}
                            </div>
                            {t.location ? (
                            <div className="mt-1 flex items-center gap-1 text-[11px] uppercase tracking-wide text-emerald-200/90">
                              <MapPin className="size-3" />
                              <span className="text-[11px] font-semibold text-foreground/70">{t.location}</span>
                            </div>
                            ) : null}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="opacity-0 transition group-hover:opacity-100">
                            <div className="flex items-center gap-1">
                              <button
                                className="rounded-2xl border border-border/30 bg-foreground/5 p-2 text-white/80 hover:bg-foreground/10"
                                title="Open"
                                aria-label="Open task"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  try { router.push(`/todos/tasks/${t.id}`); } catch { setOpenTaskId(t.id); }
                                }}
                              >
                                <Eye className="size-4" />
                              </button>
                              <button
                                className="rounded-2xl border border-border/30 bg-foreground/5 p-2 text-white/80 hover:bg-foreground/10"
                                title="Edit"
                                aria-label="Edit task"
                                onClick={(e) => { e.stopPropagation(); setOpenTaskId(t.id); }}
                              >
                                <Pencil className="size-4" />
                              </button>
                              <button
                                className="rounded-2xl border border-border/30 bg-foreground/5 p-2 text-white/80 hover:bg-foreground/10"
                                title="Delete"
                                aria-label="Delete task"
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  try { await deleteCard.mutateAsync({ taskId: t.id }); } finally { await invalidateBoardsAndTodos(); }
                                }}
                              >
                                <Trash2 className="size-4" />
                              </button>
                            </div>
                          </div>
                          <button
                          className="grid h-10 w-10 place-items-center rounded-2xl border border-border/30 bg-foreground/10 text-white transition hover:bg-foreground/20"
                          title="Mark done"
                          onClick={async (e) => {
                            e.stopPropagation();
                            await markDone.mutateAsync(t.id);
                            try {
                              const g = await fetch('/api/gamify/on-task-completed', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ taskId: t.id }),
                              });
                              const data = await g.json().catch(() => null);
                              const first: string | undefined = (data?.awards?.[0]) as any;
                              if (first && first in GEM_ICON_PATHS) {
                                const meta = GEM_META[first as keyof typeof GEM_ICON_PATHS];
                                setCelebrate({ name: meta.name, image: GEM_ICON_PATHS[first as keyof typeof GEM_ICON_PATHS], rarity: meta.rarity });
                              }
                            } catch (e) { void e; }
                            await invalidateBoardsAndTodos();
                          }}
                        >
                          <Check className="size-4" />
                        </button>
                        </div>
                      </motion.div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="mt-6 rounded-[1.5rem] border border-border/20 bg-gradient-to-r from-indigo-500/10 via-[var(--hero-via)] to-[var(--hero-to)] p-4 shadow-[0_10px_40px_rgba(15,23,42,0.35)] backdrop-blur">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <Input
                  id="todos-quick-add-input"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || (e.key === 'Enter' && (e.metaKey || e.ctrlKey))) {
                      e.preventDefault();
                      handleQuickAddSubmit();
                    }
                  }}
                  placeholder="What needs your attention next?"
                  className="flex-1 bg-transparent text-white placeholder:text-white/70"
                />
                <Button
                  className="w-full gap-2 sm:w-auto"
                  onClick={handleQuickAddSubmit}
                  disabled={addMutation.isPending}
                >
                  <Plus className="size-4" />
                  Add
                </Button>
              </div>
              <p className="mt-2 text-xs text-muted-foreground/80">Press Enter or ⌘+Enter to add quickly. Tap Add to submit.</p>
            </div>
          </CardContent>
        </Card>
      </div>
      {openTaskId ? (
        <CardSheet taskId={openTaskId} open={true} onClose={() => setOpenTaskId(null)} onOpenFull={(id) => (window.location.href = `/tasks/${id}`)} />
      ) : null}
      <StoneCelebrateModal open={!!celebrate} onClose={() => setCelebrate(null)} stone={celebrate} />
      <AssistantDock open={assistantOpen} onClose={() => setAssistantOpen(false)} />
    </div>
  );
}
