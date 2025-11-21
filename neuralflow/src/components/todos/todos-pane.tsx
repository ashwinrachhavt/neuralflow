"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ChevronDown, Check, Plus } from "lucide-react";

import { SegmentedTabs } from "@/components/ui/segmented-tabs";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useMarkDone, useMyTodos } from "@/hooks/api";
import { CardSheet } from "@/components/cards/CardSheet";

export function TodosPane() {
  const qc = useQueryClient();
  const { data, isLoading } = useMyTodos('TODO');
  const todos = useMemo(() => data?.tasks ?? [], [data?.tasks]);
  const [openTaskId, setOpenTaskId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [source, setSource] = useState("Flowmo");

  const addMutation = useMutation({
    mutationFn: async (t: string) => {
      const res = await fetch('/api/tasks/quick', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: t }) });
      if (!res.ok) throw new Error('failed');
      return (await res.json()) as { id: string };
    },
    onSuccess: async (r) => {
      await qc.invalidateQueries({ queryKey: ['my-todos','TODO'] });
      setOpenTaskId(r.id);
    }
  });

  const markDone = useMarkDone();

  return (
    <div className="flex w-full justify-center">
      <div className="w-full max-w-xl">
        <div className="mb-3 flex justify-center">
          <SegmentedTabs items={[{ href: '/todos', label: 'Tasks', active: true }, { href: '/pomodoro', label: 'Timer', active: false }]} />
        </div>
        <Card className="border border-border/70 bg-card/90 text-foreground shadow-xl">
          <CardHeader className="border-b border-white/10 p-0"></CardHeader>
          <CardContent className="p-0">
            {/* Task Source */}
            <div className="flex items-center justify-between gap-2 border-b border-border/60 px-4 py-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">Task Source</p>
                <p className="text-sm text-slate-200">{source}</p>
              </div>
              <button className="inline-flex items-center gap-1 rounded-md border border-white/10 px-2 py-1 text-xs text-slate-300 hover:bg-white/5" onClick={() => setSource(source === 'Flowmo' ? 'Dao' : 'Flowmo')}>
                {source} <ChevronDown className="size-3" />
              </button>
            </div>

            {/* List */}
            <div className="max-h-[420px] overflow-auto px-2">
              {isLoading ? (
                <div className="space-y-3 p-2">
                  {[0,1,2,3].map(i => (
                    <div key={i} className="rounded-lg border border-border/60 bg-muted/30 p-4">
                      <Skeleton className="h-4 w-56" />
                    </div>
                  ))}
                </div>
              ) : (
                <ul className="divide-y divide-border/60">
                  {todos.map(t => (
                    <li key={t.id}>
                      <motion.div layoutId={`card-${t.id}`} className="flex cursor-pointer items-center gap-3 px-4 py-4 hover:bg-muted/40" onClick={() => setOpenTaskId(t.id)}>
                        <button
                          className="grid size-5 place-items-center rounded-full border border-border/60 text-muted-foreground hover:bg-emerald-500/10 hover:text-emerald-500"
                          title="Mark done"
                          onClick={async (e) => { e.stopPropagation(); await markDone.mutateAsync(t.id); await qc.invalidateQueries({ queryKey: ['my-todos','TODO'] }); }}
                        >
                          <Check className="size-3" />
                        </button>
                        <motion.h3 layoutId={`card-title-${t.id}`} className="text-sm">{t.title}</motion.h3>
                      </motion.div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Quick Add */}
            <div className="flex items-center gap-2 border-t border-border/60 px-3 py-3">
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Enter task name" className="flex-1" />
              <Button className="gap-1" onClick={() => { const v = title.trim(); if (!v) return; addMutation.mutate(v); setTitle(''); }} disabled={addMutation.isPending}>
                <Plus className="size-4" />
                Add
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      {openTaskId ? (
        <CardSheet taskId={openTaskId} open={true} onClose={() => setOpenTaskId(null)} onOpenFull={(id) => (window.location.href = `/tasks/${id}`)} />
      ) : null}
    </div>
  );
}
