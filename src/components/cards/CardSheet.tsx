"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import { Dialog, DialogPanel, DialogBackdrop, Transition } from "@headlessui/react";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import { useCard } from "@/hooks/api";
import { CardTitleEditor } from "./CardTitleEditor";
import { CardMetadata } from "./CardMetadata";
import { CardAIDock } from "./CardAIDock";
import { Button } from "@/components/ui/button";
import { CardDescriptionEditor } from "@/components/cards/CardDescriptionEditor";
import { useMutation, useQueryClient } from "@tanstack/react-query";

type Props = {
  taskId: string;
  open: boolean;
  onClose: () => void;
  onOpenFull?: (id: string) => void;
  layoutIdBase?: string;
};

export function CardSheet({ taskId, open, onClose, onOpenFull, layoutIdBase = "" }: Props) {
  const { data, isLoading } = useCard(taskId);
  const qc = useQueryClient();
  const [descExpanded, setDescExpanded] = useState(false);
  const applyMove = useMutation({
    mutationFn: async (columnId: string) => {
      const res = await fetch(`/api/tasks/${taskId}/column`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ columnId }) });
      if (!res.ok) throw new Error('Move failed');
      return res.json();
    },
    onSuccess: async () => {
      await Promise.allSettled([
        qc.invalidateQueries({ queryKey: ['board'] as any }),
        qc.invalidateQueries({ queryKey: ['card', taskId] as any }),
        qc.invalidateQueries({ queryKey: ['my-todos','TODO'] as any }),
      ]);
      onClose();
    },
  });

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target?.closest('input, textarea, [contenteditable="true"], select')) return;
      if (e.key.toLowerCase() === 'e' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        setDescExpanded(v => !v);
      }
      if (e.key.toLowerCase() === 'o' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        onOpenFull?.(taskId);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onOpenFull, taskId]);

  return (
    <Transition show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        {/* Clickable backdrop that triggers onClose when clicked (Notion-like click-away) */}
        <Transition.Child as={Fragment} enter="ease-out duration-150" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
          <DialogBackdrop className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
        </Transition.Child>

        {/* Panel */}
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0 translate-y-3" enterTo="opacity-100 translate-y-0" leave="ease-in duration-150" leaveFrom="opacity-100 translate-y-0" leaveTo="opacity-0 translate-y-2">
              <DialogPanel as={motion.div}
                layoutId={`${layoutIdBase}card-${taskId}`}
                className="w-full max-w-2xl overflow-hidden rounded-2xl border bg-white shadow-2xl dark:border-white/10 dark:bg-[#1b1b28]"
                transition={{ type: "spring", stiffness: 320, damping: 30 }}
              >
                <div className="flex items-center justify-between border-b px-5 py-4 dark:border-white/10">
                  <motion.div layoutId={`${layoutIdBase}card-title-${taskId}`} className="flex-1">
                    {data ? (
                      <CardTitleEditor taskId={taskId} initialTitle={data.task.title} />
                    ) : (
                      <div className="h-8 w-48 animate-pulse rounded bg-slate-100 dark:bg-white/10" />
                    )}
                  </motion.div>
                  <div className="flex items-center gap-2">
                    <button className="rounded-full border px-3 py-1.5 text-xs text-slate-600 transition hover:bg-slate-50 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/5" onClick={() => onOpenFull?.(taskId)}>
                      Open Full View
                    </button>
                    <button className="rounded-full border p-2 text-slate-500 transition hover:bg-slate-100 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/5" onClick={onClose} aria-label="Close">
                      <X className="size-4" />
                    </button>
                  </div>
                </div>

                <div className="max-h-[70vh] overflow-y-auto px-5 py-4">
                  {isLoading || !data ? (
                    <div className="space-y-4">
                      <div className="h-4 w-[60%] animate-pulse rounded bg-slate-100 dark:bg-white/10" />
                      <div className="h-[160px] animate-pulse rounded-xl bg-slate-50 dark:bg-white/5" />
                    </div>
                  ) : (
                    <>
                      {/* AI suggested move banner */}
                      {data.task.aiSuggestedColumnId && data.task.column && data.task.aiSuggestedColumnId !== data.task.column.id ? (
                        <div className="mb-3 flex items-center justify-between rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-300">
                          <div>
                            AI suggests moving to
                            <span className="ml-1 font-medium">{data.task.suggestedColumn?.title ?? 'another column'}</span>
                            {typeof data.task.aiConfidence === 'number' ? (
                              <span className="ml-2 text-xs">({Math.round(data.task.aiConfidence * 100)}%)</span>
                            ) : null}
                          </div>
                          <Button size="sm" className="h-7" onClick={() => applyMove.mutate(data.task.aiSuggestedColumnId!)} disabled={applyMove.isPending}>
                            {applyMove.isPending ? 'Applying…' : 'Apply move'}
                          </Button>
                        </div>
                      ) : null}
                      <CardMetadata task={data.task} className="mb-3" />
                      <CardDescriptionEditor taskId={taskId} initial={data.task.descriptionMarkdown ?? ''} />
                      <CardAIDock taskId={taskId} className="mt-4" />
                    </>
                  )}
                </div>
              </DialogPanel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
