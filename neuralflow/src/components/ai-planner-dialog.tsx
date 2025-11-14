"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
// Custom streaming hook replaces ai/react useObject to avoid dependency issues
import { Sparkles, Check, Loader2, X } from "lucide-react";

import type { PlannedTask } from "@/lib/schemas/plan";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

function PreviewTaskCard({ task }: { task: PlannedTask }) {
  return (
    <div className="rounded-xl border border-border/70 bg-background/70 p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium">{task.title}</p>
        <span className="rounded-full border px-2 py-0.5 text-[0.65rem] uppercase tracking-wide text-muted-foreground">
          {task.priority}
        </span>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">{task.description}</p>
      <p className="mt-2 text-[0.7rem] text-muted-foreground">
        {task.estimateMinutes} min · {task.kind}
      </p>
    </div>
  );
}

export function AiPlannerLauncher() {
  const [open, setOpen] = React.useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/80 px-4 py-2 text-sm shadow-md backdrop-blur transition hover:border-primary/50 hover:text-primary"
      >
        <Sparkles className="size-4" /> Plan with AI
      </button>
      <AiPlannerDialog open={open} onOpenChange={setOpen} />
    </>
  );
}

export function AiPlannerDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [prompt, setPrompt] = React.useState("");

  const { tasks, isLoading, error, submit } = usePlanStream();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    submit({ prompt: prompt.trim() });
  };

  const totalFocusBlocks = React.useMemo(() => {
    if (!tasks?.length) return 0;
    return tasks.reduce((acc, t) => acc + Math.max(1, Math.ceil((t.estimateMinutes ?? 25) / 25)), 0);
  }, [tasks]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl overflow-hidden">
        <DialogHeader className="flex items-center justify-between p-4">
          <div className="sr-only">
            <DialogTitle>Flow Planner</DialogTitle>
            <DialogDescription>Describe what you want to get done today.</DialogDescription>
          </div>
          <div>
            <p className="text-sm font-semibold">Flow Planner</p>
            <p className="text-xs text-muted-foreground">Describe what you want to get done today.</p>
          </div>
          <button onClick={() => onOpenChange(false)} className="rounded-md p-1 text-muted-foreground hover:bg-muted/40">
            <X className="size-4" />
          </button>
        </DialogHeader>

        <div className="space-y-4 p-4">
          <form onSubmit={handleSubmit} className="space-y-3">
            <Textarea
              placeholder="Prep Paces system design, send 3 emails, do 2 DSA sessions."
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              className="h-24"
            />
            <div className="flex justify-end">
              <Button type="submit" disabled={!prompt.trim() || isLoading} className="gap-2">
                {isLoading ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
                {isLoading ? "Planning…" : "Generate plan"}
              </Button>
            </div>
          </form>

          <div className="space-y-2 max-h-80 overflow-y-auto">
            <AnimatePresence>
              {tasks?.map((task, idx) => (
                <motion.div key={`${task.title}-${idx}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.2 }}>
                  <PreviewTaskCard task={task} />
                </motion.div>
              ))}
            </AnimatePresence>

            {isLoading && (!tasks || tasks.length === 0) && (
              <div className="space-y-2">
                <div className="h-16 rounded-xl bg-muted/40 animate-pulse" />
                <div className="h-16 rounded-xl bg-muted/40 animate-pulse" />
              </div>
            )}

            {error ? (
              <p className="text-sm text-red-500">{String(error)}</p>
            ) : null}
          </div>
        </div>

        <DialogFooter className="flex flex-col gap-2 p-4">
          {tasks && tasks.length > 0 ? (
            <p className="text-xs text-muted-foreground">
              This will create {tasks.length} todos in the Kanban Todo column and schedule approximately {totalFocusBlocks} focus blocks with breaks.
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">Your plan will appear here as it streams in.</p>) }
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
              Discard
            </Button>
            <Button
              className="flex-1"
              disabled={!tasks || tasks.length === 0}
              onClick={async () => {
                if (!tasks?.length) return;
                await fetch("/api/plan/accept", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  credentials: "same-origin",
                  body: JSON.stringify({ tasks }),
                });
                onOpenChange(false);
              }}
            >
              <Check className="mr-2 size-4" /> Accept plan
              </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function usePlanStream() {
  const [tasks, setTasks] = React.useState<PlannedTask[] | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);

  const submit = React.useCallback(async (body: { prompt: string }) => {
    try {
      setTasks([]);
      setIsLoading(true);
      setError(null);
      const res = await fetch("/api/ai/plan-tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(body),
      });
      if (!res.ok || !res.body) {
        throw new Error(`Failed to plan (${res.status})`);
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      // Read NDJSON lines
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let index;
        while ((index = buffer.indexOf("\n")) >= 0) {
          const line = buffer.slice(0, index).trim();
          buffer = buffer.slice(index + 1);
          if (!line) continue;
          try {
            const item = JSON.parse(line) as PlannedTask;
            setTasks(prev => (prev ? [...prev, item] : [item]));
          } catch (e) {
            // ignore partial lines
          }
        }
      }
      // flush remaining buffer
      const last = buffer.trim();
      if (last) {
        try {
          const item = JSON.parse(last) as PlannedTask;
          setTasks(prev => (prev ? [...prev, item] : [item]));
        } catch {}
      }
    } catch (e: any) {
      setError(e instanceof Error ? e : new Error(String(e)));
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { tasks, isLoading, error, submit } as const;
}
