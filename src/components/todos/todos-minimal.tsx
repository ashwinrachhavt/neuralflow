"use client";

import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Clock, MapPin, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useMarkDone, useMyTodos } from "@/hooks/api";

export function TodosMinimal() {
  const qc = useQueryClient();
  const { data, isLoading } = useMyTodos('TODO');
  const tasks = useMemo(() => data?.tasks ?? [], [data?.tasks]);
  const aiPlanned = tasks.filter((t: any) => !!t.aiPlanned);
  const upcoming = tasks.filter((t: any) => !t.aiPlanned);

  const [quick, setQuick] = useState("");
  const [newType, setNewType] = useState<'DEEP_WORK'|'SHALLOW_WORK'|'LEARNING'|'SHIP'|'MAINTENANCE'|undefined>(undefined);
  const [newPriority, setNewPriority] = useState<'LOW'|'MEDIUM'|'HIGH'|undefined>('MEDIUM');
  const markDone = useMarkDone();
  const addQuick = useMutation({
    mutationFn: async (payload: { title: string; type?: string; priority?: string }) => {
      const res = await fetch('/api/tasks/quick', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!res.ok) throw new Error('failed');
      return await res.json();
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['my-todos','TODO'] });
      setQuick("");
    }
  });

  return (
    <div className="mx-auto w-full max-w-2xl">
      <header className="mb-4">
        <h1 className="text-2xl font-semibold">Todos</h1>
        <p className="text-xs text-muted-foreground">{new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</p>
      </header>

      <div className="mb-4 space-y-2">
        <div className="flex items-center gap-2">
          <div className="inline-flex overflow-hidden rounded-md border border-border/30 bg-background/40 opacity-70 hover:opacity-100 transition">
            {([
              { v: undefined, label: 'Any' },
              { v: 'DEEP_WORK', label: 'Deep' },
              { v: 'SHALLOW_WORK', label: 'Shallow' },
              { v: 'LEARNING', label: 'Learn' },
              { v: 'SHIP', label: 'Ship' },
              { v: 'MAINTENANCE', label: 'Maint' },
            ] as const).map((opt, i, arr) => (
              <button
                key={String(opt.v ?? 'any')}
                type="button"
                className={
                  (newType === opt.v ? 'bg-foreground text-background' : 'text-muted-foreground/80 hover:bg-foreground/10') +
                  ' px-2 py-0.5 text-[10px] transition-colors ' +
                  (i !== arr.length - 1 ? ' border-r border-border/30' : '')
                }
                onClick={() => setNewType(opt.v as any)}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <div className="inline-flex overflow-hidden rounded-md border border-border/30 bg-background/40 opacity-70 hover:opacity-100 transition">
            {([
              { v: 'LOW', label: 'Low' },
              { v: 'MEDIUM', label: 'Med' },
              { v: 'HIGH', label: 'High' },
            ] as const).map((opt, i, arr) => (
              <button
                key={opt.v}
                type="button"
                className={
                  (newPriority === opt.v ? 'bg-foreground text-background' : 'text-muted-foreground/80 hover:bg-foreground/10') +
                  ' px-2 py-0.5 text-[10px] transition-colors ' +
                  (i !== arr.length - 1 ? ' border-r border-border/30' : '')
                }
                onClick={() => setNewPriority(opt.v as any)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Input
            placeholder="Add a task and press Enter"
            value={quick}
            onChange={(e) => setQuick(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { const v = quick.trim(); if (!v || addQuick.isPending) return; addQuick.mutate({ title: v, type: newType, priority: newPriority } as any); } }}
          />
          <Button size="icon" variant="outline" disabled={addQuick.isPending} onClick={() => { const v = quick.trim(); if (!v || addQuick.isPending) return; addQuick.mutate({ title: v, type: newType, priority: newPriority } as any); }}>
            <Plus className="size-4" />
          </Button>
        </div>
      </div>

      {!(isLoading || tasks.length === 0) ? (
      <div className="rounded-xl border border-border/60 bg-muted/15 p-3">
        {isLoading ? (
          <ul className="divide-y divide-border/50">
            {Array.from({ length: 4 }).map((_, i) => (
              <li key={i} className="py-2">
                <div className="flex items-center justify-between gap-3 px-1">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="h-4 w-4 rounded border border-border/70" />
                    <span className="h-4 w-48 animate-pulse rounded bg-foreground/10" />
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className="h-4 w-10 animate-pulse rounded bg-foreground/10" />
                    <span className="h-4 w-14 animate-pulse rounded bg-foreground/10" />
                    <span className="h-4 w-8 animate-pulse rounded bg-foreground/10" />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : aiPlanned.length > 0 ? (
          <section>
            <h2 className="mb-2 text-sm font-semibold text-muted-foreground">AI Planned</h2>
            <ul className="divide-y divide-border/50">
            {aiPlanned.map((t) => (
              <li key={t.id} className="py-0.5">
                <TodoRow
                  id={t.id}
                  title={t.title}
                  tags={t.tags ?? []}
                  priority={t.priority ?? "MEDIUM"}
                  minutes={t.estimatedPomodoros ? t.estimatedPomodoros * 25 : undefined}
                  location={t.location ?? undefined}
                  onDone={async () => {
                    await markDone.mutateAsync(t.id);
                    await qc.invalidateQueries({ queryKey: ["my-todos","TODO"] });
                  }}
                />
              </li>
            ))}
            </ul>
          </section>
        ) : null}

        <section className={aiPlanned.length > 0 ? 'mt-4' : ''}>
          {aiPlanned.length > 0 ? (<h2 className="mb-2 text-sm font-semibold text-muted-foreground">Upcoming</h2>) : null}
          <ul className="divide-y divide-border/50">
          {isLoading ? null : upcoming.map((t) => (
            <li key={t.id} className="py-0.5">
              <TodoRow
                id={t.id}
                title={t.title}
                tags={t.tags ?? []}
                priority={t.priority ?? "MEDIUM"}
                minutes={t.estimatedPomodoros ? t.estimatedPomodoros * 25 : undefined}
                location={t.location ?? undefined}
                onDone={async () => {
                  await markDone.mutateAsync(t.id);
                  await qc.invalidateQueries({ queryKey: ["my-todos","TODO"] });
                }}
              />
            </li>
          ))}
          </ul>
        </section>
      </div>
      ) : null}
    </div>
  );
}

function TodoRow({
  id: _id,
  title,
  tags,
  priority,
  minutes,
  location,
  onDone,
}: {
  id: string;
  title: string;
  tags: string[];
  priority: "LOW" | "MEDIUM" | "HIGH";
  minutes?: number;
  location?: string | null;
  onDone: () => void;
}) {
  const type = detectType(tags);
  const priorityStr = priority === 'HIGH' ? 'P1' : priority === 'MEDIUM' ? 'P2' : 'P3';
  const priorityColor = priority === 'HIGH' ? 'bg-red-500' : priority === 'MEDIUM' ? 'bg-yellow-400' : 'bg-blue-500';

  return (
    <div className="flex items-center justify-between gap-3 px-1 py-3">
      <label className="flex min-w-0 items-center gap-3">
        <input type="checkbox" className="h-4 w-4 rounded border-border/70 bg-transparent accent-emerald-600" onChange={onDone} />
        <span className="truncate text-sm">{title}</span>
      </label>
      <div className="flex shrink-0 flex-wrap items-center gap-3 text-xs text-muted-foreground">
        <span>{type}</span>
        {typeof minutes === "number" ? (
          <span className="inline-flex items-center gap-1">
            <Clock className="size-3.5" /> {minutes}m
          </span>
        ) : null}
        <span className="inline-flex items-center gap-1">
          <span className={cn("size-2 rounded-full", priorityColor)} /> {priorityStr}
        </span>
        {location ? (
          <span className="inline-flex items-center gap-1">
            <MapPin className="size-3" />
            <span className="max-w-[90px] truncate">{location}</span>
          </span>
        ) : null}
      </div>
    </div>
  );
}

function detectType(tags: string[]): 'Deep Work' | 'Shallow Work' {
  const lowered = tags.map(t => t.toLowerCase());
  if (lowered.some(t => t.includes('deep'))) return 'Deep Work';
  if (lowered.some(t => t.includes('shallow'))) return 'Shallow Work';
  return 'Shallow Work';
}
