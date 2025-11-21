"use client";

import * as React from "react";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { StoneCelebrateModal } from "@/components/gamification/StoneCelebrateModal";
import { GEM_ICON_PATHS, GEM_META } from "@/lib/gamification/catalog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Chip } from "@/components/chip";

type TaskLite = {
  id: string;
  title: string;
  completed?: boolean;
  priority?: "LOW" | "MEDIUM" | "HIGH" | null;
  estimatedPomodoros?: number | null;
  tags?: string[] | null;
  aiPlanned?: boolean | null;
};

export function TaskRow({ task, onDone }: { task: TaskLite; onDone?: (id: string) => void }) {
  const [localDone, setLocalDone] = useState(!!task.completed);
  const qc = useQueryClient();
  const [celebrate, setCelebrate] = useState<null | { name: string; image?: string; rarity?: string }>(null);

  const mins = task.estimatedPomodoros ? Math.max(5, task.estimatedPomodoros * 25) : null;
  const workType = (task.tags || []).find(t => /deep|shallow/i.test(t))?.toLowerCase() || null;
  const p = task.priority === "HIGH" ? "P1" : task.priority === "LOW" ? "P3" : task.priority ? "P2" : null;

  async function toggle() {
    try {
      setLocalDone(d => !d);
      const res = await fetch(`/api/tasks/${task.id}/done`, { method: 'PATCH' });
      if (!res.ok) throw new Error('Failed');
      // Gamify: check awards and show celebration
      try {
        const g = await fetch('/api/gamify/on-task-completed', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ taskId: task.id }) });
        const data = await g.json().catch(() => null);
        const first: string | undefined = (data?.awards?.[0]) as any;
        if (first && first in GEM_ICON_PATHS) {
          const meta = GEM_META[first as keyof typeof GEM_ICON_PATHS];
          setCelebrate({ name: meta.name, image: GEM_ICON_PATHS[first as keyof typeof GEM_ICON_PATHS], rarity: meta.rarity });
        }
      } catch {}
      try { await qc.invalidateQueries({ predicate: (q) => Array.isArray(q.queryKey) && (q.queryKey[0] === 'board' || q.queryKey[0] === 'cards' || q.queryKey[0] === 'boards') }); } catch {}
      toast.success('Task completed');
      onDone?.(task.id);
    } catch {
      setLocalDone(d => !d);
      toast.error('Could not mark done');
    }
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border bg-background/70 px-3 py-2">
      <div className="flex items-center gap-3 min-w-0">
        <input type="checkbox" className="size-4" checked={localDone} onChange={toggle} />
        <p className={cn("truncate text-sm", (localDone) && "line-through text-muted-foreground")}>{task.title}</p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {workType ? <Chip variant="work">{workType === 'deep' ? 'Deep Work' : 'Shallow Work'}</Chip> : null}
        {mins ? <Chip variant="muted">{mins}m</Chip> : null}
        {p ? <Chip variant="priority">{p}</Chip> : null}
      </div>
      <StoneCelebrateModal open={!!celebrate} onClose={() => setCelebrate(null)} stone={celebrate} />
    </div>
  );
}
