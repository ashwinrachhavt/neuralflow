"use client";

import { useEffect, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { useMutation } from "@tanstack/react-query";
import { Loader2, Wand2, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
// Input unused currently; will reintroduce if needed
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type DraftTask = {
  title: string;
  descriptionMarkdown?: string;
  priority?: 'LOW'|'MEDIUM'|'HIGH';
  estimatePomodoros?: number | null;
  tags?: string[];
  selected?: boolean;
};

export function AssistantDock({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [prompt, setPrompt] = useState("");
  const [items, setItems] = useState<DraftTask[]>([]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { if (!open) { setItems([]); setPrompt(""); setPending(false); setError(null); } }, [open]);

  async function generate() {
    setPending(true); setItems([]); setError(null);
    try {
      const res = await fetch('/api/dao/orchestrate/stream', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ brainDumpText: prompt }) });
      if (res.ok && res.body) {
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buf = '';
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });
          const lines = buf.split('\n');
          buf = lines.pop() ?? '';
          for (const line of lines) {
            if (!line.trim()) continue;
            try {
              const evt = JSON.parse(line);
              if (evt.type === 'task' && evt.task) {
                setItems(prev => [...prev, { ...evt.task, selected: true }]);
              }
            } catch { /* ignore */ }
          }
        }
      } else {
        // Fallback to non-streaming endpoint
        const j = await fetch('/api/dao/orchestrate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ brainDumpText: prompt }) }).then(r => r.json());
        const t = (j?.tasks ?? []).map((x: any) => ({ title: x.title, descriptionMarkdown: x.description, priority: x.priority ?? 'MEDIUM', estimatePomodoros: x.estimatePomodoros ?? null, tags: x.tags ?? [], selected: true }));
        setItems(t);
      }
    } catch (e: any) {
      setError(e?.message ?? 'Failed to generate');
    } finally {
      setPending(false);
    }
  }

  const accept = useMutation({
    mutationFn: async () => {
      const tasks = items.filter(i => i.selected).map(({ title, descriptionMarkdown, priority, estimatePomodoros, tags }) => ({ title, descriptionMarkdown, priority, estimatePomodoros, tags }));
      if (tasks.length === 0) return { created: 0 };
      const res = await fetch('/api/dao/accept', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tasks }) });
      if (!res.ok) throw new Error('Failed to accept');
      return res.json();
    },
    onSuccess: () => { onClose(); },
  });

  return (
    <Transition show={open}>
      <Dialog onClose={onClose} className="relative z-50">
        <Transition.Child enter="ease-out duration-150" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
          <div className="fixed inset-0 bg-black/30" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-y-0 right-0 flex max-w-full pl-10">
            <Transition.Child enter="transform transition ease-in-out duration-200" enterFrom="translate-x-full" enterTo="translate-x-0" leave="transform transition ease-in-out duration-150" leaveFrom="translate-x-0" leaveTo="translate-x-full">
              <Dialog.Panel className="w-screen max-w-md">
                <Card className="h-full rounded-l-2xl border border-l-0 bg-card/80 backdrop-blur dark:bg-[#1b1b28] dark:border-white/10">
                  <CardHeader className="flex items-center justify-between border-b dark:border-white/10">
                    <CardTitle className="text-base flex items-center gap-2"><Wand2 className="size-4" /> Todo Agent</CardTitle>
                    <button onClick={onClose} className="rounded-full border p-2 text-slate-500 hover:bg-slate-100 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/5" aria-label="Close"><X className="size-4" /></button>
                  </CardHeader>
                  <CardContent className="h-full overflow-y-auto p-4">
                    <div className="space-y-3">
                      <label className="text-xs font-medium text-muted-foreground">Describe what you want to get done</label>
                      <textarea className="h-24 w-full rounded-lg border bg-background/80 p-3 text-sm outline-none" placeholder="e.g., Prep for interview, schedule a coding slot, revise Python fundamentals…" value={prompt} onChange={(e) => setPrompt(e.target.value)} />
                      <div className="flex gap-2">
                        <Button onClick={generate} disabled={pending || !prompt.trim()} className="gap-2">
                          {pending ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />} Generate
                        </Button>
                        <Button variant="outline" onClick={() => { setItems([]); setPrompt(''); }}>Clear</Button>
                      </div>
                      {error ? <p className="text-xs text-red-500">{error}</p> : null}

                      <div className="mt-3 space-y-2">
                        {items.map((t, idx) => (
                          <label key={idx} className="flex cursor-pointer items-start gap-3 rounded-lg border bg-white/60 p-3 text-sm dark:border-white/10 dark:bg-white/5">
                            <input type="checkbox" checked={t.selected ?? true} onChange={(e) => setItems(prev => prev.map((x, i) => i === idx ? { ...x, selected: e.target.checked } : x))} className="mt-1" />
                            <div>
                              <div className="font-medium text-foreground">{t.title}</div>
                              {t.descriptionMarkdown ? <div className="mt-1 text-xs text-muted-foreground line-clamp-2">{t.descriptionMarkdown}</div> : null}
                              <div className="mt-1 text-[10px] text-muted-foreground">
                                {t.priority ?? 'MEDIUM'} {t.estimatePomodoros ? `• ${t.estimatePomodoros} pomodoro` : ''}
                              </div>
                            </div>
                          </label>
                        ))}
                        {!pending && items.length === 0 ? <p className="text-xs text-muted-foreground">No items yet. Enter a prompt and click Generate.</p> : null}
                      </div>
                    </div>
                  </CardContent>
                  <div className="flex items-center justify-between gap-2 border-t p-3 dark:border-white/10">
                    <div className="text-xs text-muted-foreground">{items.filter(i => i.selected).length} selected</div>
                    <Button onClick={() => accept.mutate()} disabled={accept.isPending || items.filter(i => i.selected).length === 0}>
                      {accept.isPending ? <Loader2 className="size-4 animate-spin" /> : 'Accept tasks'}
                    </Button>
                  </div>
                </Card>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
